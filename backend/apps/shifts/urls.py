from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DepartmentViewSet, ShiftTemplateViewSet,
    ShiftViewSet, ShiftAssignmentViewSet, ShiftSwapRequestViewSet,
)

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'templates', ShiftTemplateViewSet, basename='shift-template')
router.register(r'assignments', ShiftAssignmentViewSet, basename='shift-assignment')
router.register(r'swap-requests', ShiftSwapRequestViewSet, basename='swap-request')
router.register(r'', ShiftViewSet, basename='shift')

urlpatterns = [
    path('', include(router.urls)),
]
