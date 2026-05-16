from rest_framework import serializers
from .models import Department, ShiftTemplate, Shift, ShiftAssignment, ShiftSwapRequest
from apps.users.serializers import UserBriefSerializer


class DepartmentSerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(source='manager.full_name', read_only=True)
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'color', 'manager', 'manager_name', 'member_count', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_member_count(self, obj):
        return obj.members.filter(is_active=True).count()


class ShiftTemplateSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    duration_hours = serializers.ReadOnlyField()

    class Meta:
        model = ShiftTemplate
        fields = [
            'id', 'name', 'shift_type', 'department', 'department_name',
            'start_time', 'end_time', 'break_duration_minutes', 'duration_hours',
            'color', 'required_employees', 'description', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class ShiftAssignmentSerializer(serializers.ModelSerializer):
    employee_detail = UserBriefSerializer(source='employee', read_only=True)
    hours_worked = serializers.ReadOnlyField()

    class Meta:
        model = ShiftAssignment
        fields = [
            'id', 'shift', 'employee', 'employee_detail', 'status',
            'note', 'clock_in', 'clock_out', 'hours_worked',
            'assigned_by', 'created_at',
        ]
        read_only_fields = ['id', 'assigned_by', 'created_at']

    def create(self, validated_data):
        validated_data['assigned_by'] = self.context['request'].user
        return super().create(validated_data)


class ShiftSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    assignments = ShiftAssignmentSerializer(many=True, read_only=True)
    assigned_count = serializers.ReadOnlyField()
    is_fully_staffed = serializers.ReadOnlyField()
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)

    class Meta:
        model = Shift
        fields = [
            'id', 'template', 'department', 'department_name', 'name',
            'date', 'start_time', 'end_time', 'break_duration_minutes',
            'required_employees', 'assigned_count', 'is_fully_staffed',
            'color', 'status', 'notes', 'assignments',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class ShiftListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    department_name = serializers.CharField(source='department.name', read_only=True)
    assigned_count = serializers.ReadOnlyField()
    is_fully_staffed = serializers.ReadOnlyField()

    class Meta:
        model = Shift
        fields = [
            'id', 'name', 'department', 'department_name', 'date',
            'start_time', 'end_time', 'required_employees', 'assigned_count',
            'is_fully_staffed', 'color', 'status',
        ]


class ClockInOutSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['clock_in', 'clock_out'])

    def save(self, assignment):
        from django.utils import timezone
        action = self.validated_data['action']
        if action == 'clock_in':
            if assignment.clock_in:
                raise serializers.ValidationError('Already clocked in.')
            assignment.clock_in = timezone.now()
            assignment.status = ShiftAssignment.Status.CONFIRMED
        else:
            if not assignment.clock_in:
                raise serializers.ValidationError('Must clock in first.')
            if assignment.clock_out:
                raise serializers.ValidationError('Already clocked out.')
            assignment.clock_out = timezone.now()
            assignment.status = ShiftAssignment.Status.COMPLETED
        assignment.save()
        return assignment


class ShiftSwapRequestSerializer(serializers.ModelSerializer):
    requester_name = serializers.CharField(source='requester_assignment.employee.full_name', read_only=True)
    target_employee_name = serializers.CharField(source='target_employee.full_name', read_only=True)

    class Meta:
        model = ShiftSwapRequest
        fields = [
            'id', 'requester_assignment', 'target_assignment', 'target_employee',
            'requester_name', 'target_employee_name', 'reason', 'status',
            'reviewed_by', 'reviewed_at', 'created_at',
        ]
        read_only_fields = ['id', 'status', 'reviewed_by', 'reviewed_at', 'created_at']


class ShiftSwapReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShiftSwapRequest
        fields = ['status']

    def validate_status(self, value):
        if value not in (ShiftSwapRequest.Status.APPROVED, ShiftSwapRequest.Status.REJECTED):
            raise serializers.ValidationError('Status must be approved or rejected.')
        return value

    def update(self, instance, validated_data):
        from django.utils import timezone
        from django.db import transaction

        instance.status = validated_data['status']
        instance.reviewed_by = self.context['request'].user
        instance.reviewed_at = timezone.now()

        if instance.status == ShiftSwapRequest.Status.APPROVED:
            # Perform the actual swap
            with transaction.atomic():
                req_assign = instance.requester_assignment
                tgt_assign = instance.target_assignment
                if req_assign and tgt_assign:
                    req_emp = req_assign.employee
                    tgt_emp = tgt_assign.employee
                    req_assign.employee = tgt_emp
                    tgt_assign.employee = req_emp
                    req_assign.status = ShiftAssignment.Status.SWAPPED
                    tgt_assign.status = ShiftAssignment.Status.SWAPPED
                    req_assign.save()
                    tgt_assign.save()

        instance.save()
        return instance
