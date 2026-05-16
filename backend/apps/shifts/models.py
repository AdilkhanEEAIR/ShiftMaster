from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError


class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#3B82F6', help_text='Hex color for calendar display')
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_departments',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'departments'
        ordering = ['name']

    def __str__(self):
        return self.name


class ShiftTemplate(models.Model):
    """Reusable shift definition (e.g. Morning, Evening, Night)."""

    class ShiftType(models.TextChoices):
        MORNING = 'morning', 'Morning'
        AFTERNOON = 'afternoon', 'Afternoon'
        EVENING = 'evening', 'Evening'
        NIGHT = 'night', 'Night'
        CUSTOM = 'custom', 'Custom'

    name = models.CharField(max_length=100)
    shift_type = models.CharField(max_length=20, choices=ShiftType.choices, default=ShiftType.CUSTOM)
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name='shift_templates',
    )
    start_time = models.TimeField()
    end_time = models.TimeField()
    break_duration_minutes = models.PositiveIntegerField(default=0)
    color = models.CharField(max_length=7, default='#6366F1')
    required_employees = models.PositiveIntegerField(default=1)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'shift_templates'
        ordering = ['start_time']

    def __str__(self):
        return f'{self.name} ({self.department.name})'

    @property
    def duration_hours(self):
        from datetime import datetime, date
        start = datetime.combine(date.today(), self.start_time)
        end = datetime.combine(date.today(), self.end_time)
        if end < start:  # crosses midnight
            from datetime import timedelta
            end += timedelta(days=1)
        delta = end - start
        return round((delta.seconds / 3600) - (self.break_duration_minutes / 60), 2)


class Shift(models.Model):
    """A concrete shift on a specific date, possibly based on a template."""

    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        PUBLISHED = 'published', 'Published'
        CANCELLED = 'cancelled', 'Cancelled'

    template = models.ForeignKey(
        ShiftTemplate, on_delete=models.SET_NULL, null=True, blank=True, related_name='shifts'
    )
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='shifts')
    name = models.CharField(max_length=100)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    break_duration_minutes = models.PositiveIntegerField(default=0)
    required_employees = models.PositiveIntegerField(default=1)
    color = models.CharField(max_length=7, default='#6366F1')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_shifts',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'shifts'
        ordering = ['date', 'start_time']

    def __str__(self):
        return f'{self.name} - {self.date}'

    def clean(self):
        if self.start_time and self.end_time and self.start_time == self.end_time:
            raise ValidationError('Shift start and end times cannot be the same.')

    @property
    def assigned_count(self):
        return self.assignments.filter(
            status__in=[ShiftAssignment.Status.CONFIRMED, ShiftAssignment.Status.PENDING]
        ).count()

    @property
    def is_fully_staffed(self):
        return self.assigned_count >= self.required_employees


class ShiftAssignment(models.Model):
    """Links an employee to a specific shift."""

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        CONFIRMED = 'confirmed', 'Confirmed'
        DECLINED = 'declined', 'Declined'
        SWAPPED = 'swapped', 'Swapped'
        NO_SHOW = 'no_show', 'No Show'
        COMPLETED = 'completed', 'Completed'

    shift = models.ForeignKey(Shift, on_delete=models.CASCADE, related_name='assignments')
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='shift_assignments',
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    note = models.TextField(blank=True)
    clock_in = models.DateTimeField(null=True, blank=True)
    clock_out = models.DateTimeField(null=True, blank=True)
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_shifts',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'shift_assignments'
        unique_together = ('shift', 'employee')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.employee.full_name} -> {self.shift}'

    @property
    def hours_worked(self):
        if self.clock_in and self.clock_out:
            delta = self.clock_out - self.clock_in
            return round(delta.seconds / 3600, 2)
        return None


class ShiftSwapRequest(models.Model):
    """Employee requests to swap a shift with another employee."""

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        ACCEPTED = 'accepted', 'Accepted'
        REJECTED = 'rejected', 'Rejected'
        APPROVED = 'approved', 'Manager Approved'
        CANCELLED = 'cancelled', 'Cancelled'

    requester_assignment = models.ForeignKey(
        ShiftAssignment, on_delete=models.CASCADE, related_name='swap_requests_sent'
    )
    target_assignment = models.ForeignKey(
        ShiftAssignment,
        on_delete=models.CASCADE,
        related_name='swap_requests_received',
        null=True, blank=True,
    )
    target_employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='swap_requests_received',
        null=True, blank=True,
        help_text='If no specific assignment, request open swap',
    )
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='reviewed_swaps',
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'shift_swap_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f'Swap: {self.requester_assignment} <-> {self.target_assignment}'
