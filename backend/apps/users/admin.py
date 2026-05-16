from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Availability, TimeOffRequest


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'full_name', 'role', 'department', 'is_active']
    list_filter = ['role', 'is_active', 'department']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['email']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal', {'fields': ('first_name', 'last_name', 'phone', 'avatar')}),
        ('Work', {'fields': ('role', 'department', 'position', 'hourly_rate')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )


@admin.register(Availability)
class AvailabilityAdmin(admin.ModelAdmin):
    list_display = ['employee', 'day_of_week', 'start_time', 'end_time', 'is_available']
    list_filter = ['day_of_week', 'is_available']


@admin.register(TimeOffRequest)
class TimeOffRequestAdmin(admin.ModelAdmin):
    list_display = ['employee', 'request_type', 'start_date', 'end_date', 'status']
    list_filter = ['status', 'request_type']
    search_fields = ['employee__first_name', 'employee__last_name']
