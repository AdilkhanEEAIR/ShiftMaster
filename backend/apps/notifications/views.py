from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics, filters
from django_filters.rest_framework import DjangoFilterBackend

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_read', 'notification_type']
    ordering_fields = ['created_at']

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


class MarkReadView(APIView):
    """Mark one or all notifications as read."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        notification_ids = request.data.get('ids')
        qs = Notification.objects.filter(recipient=request.user)
        if notification_ids:
            qs = qs.filter(id__in=notification_ids)
        updated = qs.update(is_read=True)
        return Response({'marked_read': updated})


class UnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'unread_count': count})
