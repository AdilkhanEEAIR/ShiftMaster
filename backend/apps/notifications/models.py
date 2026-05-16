from django.db import models
from django.conf import settings


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        SHIFT_ASSIGNED = 'shift_assigned', 'Shift Assigned'
        SHIFT_PUBLISHED = 'shift_published', 'Shift Published'
        SHIFT_CANCELLED = 'shift_cancelled', 'Shift Cancelled'
        SHIFT_REMINDER = 'shift_reminder', 'Shift Reminder'
        SWAP_REQUEST = 'swap_request', 'Swap Request'
        SWAP_ACCEPTED = 'swap_accepted', 'Swap Accepted'
        SWAP_REJECTED = 'swap_rejected', 'Swap Rejected'
        SWAP_APPROVED = 'swap_approved', 'Swap Approved'
        TIME_OFF_SUBMITTED = 'time_off_submitted', 'Time Off Submitted'
        TIME_OFF_APPROVED = 'time_off_approved', 'Time Off Approved'
        TIME_OFF_REJECTED = 'time_off_rejected', 'Time Off Rejected'

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    data = models.JSONField(default=dict, blank=True)  # Extra metadata (shift_id, etc.)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.recipient.full_name}: {self.title}'
