from django.contrib.auth import get_user_model
from rest_framework import generics, status, filters
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from .models import Availability, TimeOffRequest
from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    ChangePasswordSerializer, AvailabilitySerializer,
    TimeOffRequestSerializer, TimeOffReviewSerializer, UserBriefSerializer,
)
from .permissions import IsManagerOrAdmin, IsAdminUser, IsSelfOrManagerOrAdmin, IsOwnerOrManagerOrAdmin

User = get_user_model()


class MeView(generics.RetrieveUpdateAPIView):
    """Get or update the currently authenticated user's profile."""
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return UserUpdateSerializer
        return UserSerializer


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Password changed successfully.'})


class UserViewSet(ModelViewSet):
    queryset = User.objects.select_related('department').filter(is_active=True)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'department', 'is_active']
    search_fields = ['first_name', 'last_name', 'email', 'position']
    ordering_fields = ['last_name', 'first_name', 'date_joined']

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        if self.action == 'create':
            return [IsManagerOrAdmin()]
        if self.action in ('update', 'partial_update', 'destroy'):
            return [IsManagerOrAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        if self.action in ('update', 'partial_update'):
            return UserUpdateSerializer
        if self.action == 'list':
            return UserBriefSerializer
        return UserSerializer

    def destroy(self, request, *args, **kwargs):
        # Soft delete
        user = self.get_object()
        user.is_active = False
        user.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'])
    def availability(self, request, pk=None):
        user = self.get_object()
        avails = Availability.objects.filter(employee=user)
        return Response(AvailabilitySerializer(avails, many=True).data)

    @action(detail=True, methods=['get'])
    def time_off(self, request, pk=None):
        user = self.get_object()
        requests = TimeOffRequest.objects.filter(employee=user).select_related('reviewed_by')
        return Response(TimeOffRequestSerializer(requests, many=True).data)


class AvailabilityViewSet(ModelViewSet):
    serializer_class = AvailabilitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_manager_or_above:
            return Availability.objects.select_related('employee').all()
        return Availability.objects.filter(employee=self.request.user)

    def perform_create(self, serializer):
        # Managers can set availability for any employee; employees only for themselves
        if self.request.user.is_manager_or_above:
            serializer.save()
        else:
            serializer.save(employee=self.request.user)


class TimeOffRequestViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'request_type']
    ordering_fields = ['start_date', 'created_at']

    def get_queryset(self):
        qs = TimeOffRequest.objects.select_related('employee', 'reviewed_by')
        if not self.request.user.is_manager_or_above:
            qs = qs.filter(employee=self.request.user)
        return qs

    def get_serializer_class(self):
        if self.action == 'review':
            return TimeOffReviewSerializer
        return TimeOffRequestSerializer

    @action(detail=True, methods=['patch'], permission_classes=[IsManagerOrAdmin])
    def review(self, request, pk=None):
        instance = self.get_object()
        if instance.status != TimeOffRequest.Status.PENDING:
            return Response(
                {'detail': 'Only pending requests can be reviewed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = TimeOffReviewSerializer(
            instance, data=request.data, partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(TimeOffRequestSerializer(instance).data)
