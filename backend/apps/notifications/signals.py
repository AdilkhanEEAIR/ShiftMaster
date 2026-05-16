from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Notification


def create_notification(recipient, notification_type, title, message, data=None):
    Notification.objects.create(
        recipient=recipient,
        notification_type=notification_type,
        title=title,
        message=message,
        data=data or {},
    )


@receiver(post_save, sender='shifts.ShiftAssignment')
def on_shift_assignment(sender, instance, created, **kwargs):
    if created:
        create_notification(
            recipient=instance.employee,
            notification_type=Notification.NotificationType.SHIFT_ASSIGNED,
            title='New Shift Assigned',
            message=f'You have been assigned to {instance.shift.name} on {instance.shift.date}.',
            data={'shift_id': instance.shift_id, 'assignment_id': instance.id},
        )


@receiver(post_save, sender='shifts.Shift')
def on_shift_status_change(sender, instance, created, **kwargs):
    if not created and instance.status == 'published':
        for assignment in instance.assignments.all():
            create_notification(
                recipient=assignment.employee,
                notification_type=Notification.NotificationType.SHIFT_PUBLISHED,
                title='Shift Published',
                message=f'Your shift {instance.name} on {instance.date} has been published.',
                data={'shift_id': instance.id},
            )
    elif not created and instance.status == 'cancelled':
        for assignment in instance.assignments.all():
            create_notification(
                recipient=assignment.employee,
                notification_type=Notification.NotificationType.SHIFT_CANCELLED,
                title='Shift Cancelled',
                message=f'Your shift {instance.name} on {instance.date} has been cancelled.',
                data={'shift_id': instance.id},
            )


@receiver(post_save, sender='shifts.ShiftSwapRequest')
def on_swap_request(sender, instance, created, **kwargs):
    if created and instance.target_employee:
        create_notification(
            recipient=instance.target_employee,
            notification_type=Notification.NotificationType.SWAP_REQUEST,
            title='Shift Swap Request',
            message=(
                f'{instance.requester_assignment.employee.full_name} wants to swap their '
                f'{instance.requester_assignment.shift.name} shift with you.'
            ),
            data={'swap_request_id': instance.id},
        )


@receiver(post_save, sender='users.TimeOffRequest')
def on_time_off_review(sender, instance, created, **kwargs):
    if not created and instance.status in ('approved', 'rejected'):
        ntype = (
            Notification.NotificationType.TIME_OFF_APPROVED
            if instance.status == 'approved'
            else Notification.NotificationType.TIME_OFF_REJECTED
        )
        create_notification(
            recipient=instance.employee,
            notification_type=ntype,
            title=f'Time Off {instance.status.capitalize()}',
            message=(
                f'Your time off request from {instance.start_date} to {instance.end_date} '
                f'has been {instance.status}.'
            ),
            data={'time_off_id': instance.id},
        )
