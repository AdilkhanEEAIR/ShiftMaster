from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import Availability, TimeOffRequest

User = get_user_model()


class UserBriefSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'role', 'avatar', 'position']


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'role', 'avatar', 'department', 'department_name',
            'position', 'hourly_rate', 'is_active', 'date_joined',
        ]
        read_only_fields = ['id', 'date_joined']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'phone', 'role',
            'department', 'position', 'hourly_rate', 'password', 'password_confirm',
        ]

    def validate(self, data):
        if data['password'] != data.pop('password_confirm'):
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone', 'avatar',
            'department', 'position', 'hourly_rate',
        ]


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'Passwords do not match.'})
        return data

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()


class AvailabilitySerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)

    class Meta:
        model = Availability
        fields = ['id', 'employee', 'day_of_week', 'day_name', 'start_time', 'end_time', 'is_available', 'note']
        read_only_fields = ['id']

    def validate(self, data):
        if data.get('is_available', True) and data.get('start_time') and data.get('end_time'):
            if data['start_time'] >= data['end_time']:
                raise serializers.ValidationError('end_time must be after start_time.')
        return data


class TimeOffRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.full_name', read_only=True)

    class Meta:
        model = TimeOffRequest
        fields = [
            'id', 'employee', 'employee_name', 'request_type',
            'start_date', 'end_date', 'reason', 'status',
            'reviewed_by', 'reviewed_by_name', 'reviewed_at', 'review_note',
            'created_at',
        ]
        read_only_fields = ['id', 'employee', 'status', 'reviewed_by', 'reviewed_at', 'created_at']

    def validate(self, data):
        if data.get('start_date') and data.get('end_date'):
            if data['start_date'] > data['end_date']:
                raise serializers.ValidationError('end_date must be after or equal to start_date.')
        return data

    def create(self, validated_data):
        validated_data['employee'] = self.context['request'].user
        return super().create(validated_data)


class TimeOffReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeOffRequest
        fields = ['status', 'review_note']

    def validate_status(self, value):
        if value not in (TimeOffRequest.Status.APPROVED, TimeOffRequest.Status.REJECTED):
            raise serializers.ValidationError('Status must be approved or rejected.')
        return value

    def update(self, instance, validated_data):
        from django.utils import timezone
        instance.status = validated_data['status']
        instance.review_note = validated_data.get('review_note', '')
        instance.reviewed_by = self.context['request'].user
        instance.reviewed_at = timezone.now()
        instance.save()
        return instance
