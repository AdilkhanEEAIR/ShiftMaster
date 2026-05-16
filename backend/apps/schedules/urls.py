from django.urls import path
from .views import (
    WeeklyScheduleView, MyScheduleView,
    DashboardStatsView, EmployeeHoursReportView,
)

urlpatterns = [
    path('weekly/', WeeklyScheduleView.as_view(), name='weekly-schedule'),
    path('my/', MyScheduleView.as_view(), name='my-schedule'),
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('reports/hours/', EmployeeHoursReportView.as_view(), name='hours-report'),
]
