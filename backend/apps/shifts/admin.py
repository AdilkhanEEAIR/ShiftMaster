from django.contrib import admin
from .models import Department, ShiftTemplate, Shift, ShiftAssignment, ShiftSwapRequest


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'manager', 'color']
    search_fields = ['name']


@admin.register(ShiftTemplate)
class ShiftTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'department', 'shift_type', 'start_time', 'end_time', 'is_active']
    list_filter = ['department', 'shift_type', 'is_active']


class ShiftAssignmentInline(admin.TabularInline):
    model = ShiftAssignment
    extra = 0
    fields = ['employee', 'status', 'clock_in', 'clock_out']


@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = ['name', 'department', 'date', 'start_time', 'end_time', 'status', 'required_employees']
    list_filter = ['status', 'department', 'date']
    search_fields = ['name']
    inlines = [ShiftAssignmentInline]


@admin.register(ShiftAssignment)
class ShiftAssignmentAdmin(admin.ModelAdmin):
    list_display = ['employee', 'shift', 'status', 'clock_in', 'clock_out']
    list_filter = ['status']
    search_fields = ['employee__first_name', 'employee__last_name']


@admin.register(ShiftSwapRequest)
class ShiftSwapRequestAdmin(admin.ModelAdmin):
    list_display = ['requester_assignment', 'target_employee', 'status', 'created_at']
    list_filter = ['status']
