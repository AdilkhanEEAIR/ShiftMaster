from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.ADMIN)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        MANAGER = 'manager', 'Manager'
        EMPLOYEE = 'employee', 'Employee'

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.EMPLOYEE)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    department = models.ForeignKey(
        'shifts.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='members',
    )
    position = models.CharField(max_length=100, blank=True)
    hourly_rate = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = UserManager()

    class Meta:
        db_table = 'users'
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f'{self.first_name} {self.last_name} <{self.email}>'

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'

    @property
    def is_manager_or_above(self):
        return self.role in (self.Role.ADMIN, self.Role.MANAGER)


class Availability(models.Model):
    """Employee weekly availability preferences."""

    class DayOfWeek(models.IntegerChoices):
        MONDAY = 0, 'Monday'
        TUESDAY = 1, 'Tuesday'
        WEDNESDAY = 2, 'Wednesday'
        THURSDAY = 3, 'Thursday'
        FRIDAY = 4, 'Friday'
        SATURDAY = 5, 'Saturday'
        SUNDAY = 6, 'Sunday'

    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='availabilities')
    day_of_week = models.IntegerField(choices=DayOfWeek.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)
    note = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = 'availabilities'
        unique_together = ('employee', 'day_of_week')
        ordering = ['day_of_week']

    def __str__(self):
        return f'{self.employee.full_name} - {self.get_day_of_week_display()}'


class TimeOffRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    class RequestType(models.TextChoices):
        VACATION = 'vacation', 'Vacation'
        SICK = 'sick', 'Sick Leave'
        PERSONAL = 'personal', 'Personal'
        OTHER = 'other', 'Other'

    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='time_off_requests')
    request_type = models.CharField(max_length=20, choices=RequestType.choices)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_requests'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'time_off_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.employee.full_name} - {self.request_type} ({self.start_date} to {self.end_date})'
