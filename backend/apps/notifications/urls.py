from django.urls import path
from .views import NotificationListView, MarkReadView, UnreadCountView

urlpatterns = [
    path('', NotificationListView.as_view(), name='notifications'),
    path('mark-read/', MarkReadView.as_view(), name='mark-read'),
    path('unread-count/', UnreadCountView.as_view(), name='unread-count'),
]
