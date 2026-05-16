from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from .models import Department, ShiftTemplate, Shift, ShiftAssignment, ShiftSwapRequest
from .serializers import (
    DepartmentSerializer, ShiftTemplateSerializer,
    ShiftSerializer, ShiftListSerializer,
    ShiftAssignmentSerializer, ClockInOutSerializer,
    ShiftSwapRequestSerializer, ShiftSwapReviewSerializer,
)
from .filters import ShiftFilter, ShiftAssignmentFilter
from apps.users.permissions import IsManagerOrAdmin


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.select_related('manager').all()
    serializer_class = DepartmentSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsManagerOrAdmin()]


class ShiftTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = ShiftTemplateSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['department', 'shift_type', 'is_active']
    search_fields = ['name']

    def get_queryset(self):
        return ShiftTemplate.objects.select_related('department').filter(is_active=True)

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsManagerOrAdmin()]


class ShiftViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ShiftFilter
    search_fields = ['name', 'notes']
    ordering_fields = ['date', 'start_time', 'created_at']

    def get_queryset(self):
        qs = Shift.objects.select_related('department', 'created_by').prefetch_related(
            'assignments__employee'
        )
        if not self.request.user.is_manager_or_above:
            # Employees only see published shifts
            qs = qs.filter(status=Shift.Status.PUBLISHED)
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return ShiftListSerializer
        return ShiftSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsManagerOrAdmin()]

    @action(detail=True, methods=['post'], permission_classes=[IsManagerOrAdmin])
    def publish(self, request, pk=None):
        shift = self.get_object()
        if shift.status == Shift.Status.PUBLISHED:
            return Response({'detail': 'Shift is already published.'}, status=400)
        shift.status = Shift.Status.PUBLISHED
        shift.save()
        # Trigger notifications (signal handled in notifications app)
        return Response(ShiftSerializer(shift, context={'request': request}).data)

    @action(detail=True, methods=['post'], permission_classes=[IsManagerOrAdmin])
    def cancel(self, request, pk=None):
        shift = self.get_object()
        shift.status = Shift.Status.CANCELLED
        shift.save()
        return Response(ShiftSerializer(shift, context={'request': request}).data)

    @action(detail=True, methods=['post'], permission_classes=[IsManagerOrAdmin])
    def bulk_assign(self, request, pk=None):
        """Assign multiple employees to this shift at once."""
        shift = self.get_object()
        employee_ids = request.data.get('employee_ids', [])
        if not employee_ids:
            return Response({'detail': 'employee_ids required.'}, status=400)

        created, skipped = [], []
        for emp_id in employee_ids:
            assignment, was_created = ShiftAssignment.objects.get_or_create(
                shift=shift,
                employee_id=emp_id,
                defaults={'assigned_by': request.user, 'status': ShiftAssignment.Status.PENDING},
            )
            if was_created:
                created.append(emp_id)
            else:
                skipped.append(emp_id)

        return Response({
            'created': created,
            'skipped_already_assigned': skipped,
        })


class ShiftAssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = ShiftAssignmentSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = ShiftAssignmentFilter
    ordering_fields = ['created_at', 'shift__date']

    def get_queryset(self):
        qs = ShiftAssignment.objects.select_related('shift__department', 'employee', 'assigned_by')
        if not self.request.user.is_manager_or_above:
            qs = qs.filter(employee=self.request.user)
        return qs

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'clock'):
            return [IsAuthenticated()]
        return [IsManagerOrAdmin()]

    @action(detail=True, methods=['post'])
    def clock(self, request, pk=None):
        assignment = self.get_object()
        if assignment.employee != request.user and not request.user.is_manager_or_above:
            return Response({'detail': 'Not your assignment.'}, status=403)
        serializer = ClockInOutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(assignment=assignment)
        return Response(ShiftAssignmentSerializer(assignment).data)

    @action(detail=True, methods=['patch'])
    def respond(self, request, pk=None):
        """Employee confirms or declines their assignment."""
        assignment = self.get_object()
        if assignment.employee != request.user:
            return Response({'detail': 'Not your assignment.'}, status=403)
        new_status = request.data.get('status')
        allowed = [ShiftAssignment.Status.CONFIRMED, ShiftAssignment.Status.DECLINED]
        if new_status not in [s.value for s in allowed]:
            return Response({'detail': f'Status must be one of: {[s.value for s in allowed]}'}, status=400)
        assignment.status = new_status
        assignment.note = request.data.get('note', assignment.note)
        assignment.save()
        return Response(ShiftAssignmentSerializer(assignment).data)


class ShiftSwapRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = ShiftSwapRequest.objects.select_related(
            'requester_assignment__employee',
            'target_assignment__employee',
            'target_employee',
        )
        if not self.request.user.is_manager_or_above:
            qs = qs.filter(
                requester_assignment__employee=self.request.user
            ) | qs.filter(
                target_employee=self.request.user
            )
        return qs

    def get_serializer_class(self):
        if self.action == 'review':
            return ShiftSwapReviewSerializer
        return ShiftSwapRequestSerializer

    @action(detail=True, methods=['patch'])
    def accept(self, request, pk=None):
        swap = self.get_object()
        if swap.target_employee != request.user:
            return Response({'detail': 'Not your swap request.'}, status=403)
        if swap.status != ShiftSwapRequest.Status.PENDING:
            return Response({'detail': 'Swap is not pending.'}, status=400)
        swap.status = ShiftSwapRequest.Status.ACCEPTED
        swap.save()
        return Response(ShiftSwapRequestSerializer(swap).data)

    @action(detail=True, methods=['patch'])
    def reject(self, request, pk=None):
        swap = self.get_object()
        if swap.target_employee != request.user:
            return Response({'detail': 'Not your swap request.'}, status=403)
        swap.status = ShiftSwapRequest.Status.REJECTED
        swap.save()
        return Response(ShiftSwapRequestSerializer(swap).data)

    @action(detail=True, methods=['patch'], permission_classes=[IsManagerOrAdmin])
    def review(self, request, pk=None):
        swap = self.get_object()
        if swap.status not in (ShiftSwapRequest.Status.PENDING, ShiftSwapRequest.Status.ACCEPTED):
            return Response({'detail': 'Swap cannot be reviewed in its current state.'}, status=400)
        serializer = ShiftSwapReviewSerializer(
            swap, data=request.data, partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ShiftSwapRequestSerializer(swap).data)
