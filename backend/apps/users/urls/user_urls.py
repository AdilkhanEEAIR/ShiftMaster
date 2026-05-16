from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.users.views import (
    MeView, ChangePasswordView, UserViewSet,
    AvailabilityViewSet, TimeOffRequestViewSet,
)

router = DefaultRouter()
router.register(r'', UserViewSet, basename='user')
router.register(r'availability', AvailabilityViewSet, basename='availability')
router.register(r'time-off', TimeOffRequestViewSet, basename='time-off')

urlpatterns = [
    path('me/', MeView.as_view(), name='me'),
    path('me/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('', include(router.urls)),
]
