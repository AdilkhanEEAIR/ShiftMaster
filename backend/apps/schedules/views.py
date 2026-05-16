from datetime import date, timedelta
from django.db.models import Count, Sum, Q, F
from django.db.models.functions import TruncWeek, TruncMonth
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.shifts.models import Shift, ShiftAssignment
from apps.shifts.serializers import ShiftListSerializer, ShiftAssignmentSerializer
from apps.users.permissions import IsManagerOrAdmin
from django.contrib.auth import get_user_model

User = get_user_model()


def get_week_range(ref_date: date):
    start = ref_date - timedelta(days=ref_date.weekday())  # Monday
    end = start + timedelta(days=6)  # Sunday
    return start, end


class WeeklyScheduleView(APIView):
    """
    Returns all published shifts for a given week, grouped by day.
    Query params:
      - date: any date in the target week (default: today)
      - department: filter by department id
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ref_date_str = request.query_params.get('date')
        try:
            ref_date = date.fromisoformat(ref_date_str) if ref_date_str else date.today()
        except ValueError:
            return Response({'detail': 'Invalid date format. Use YYYY-MM-DD.'}, status=400)

        week_start, week_end = get_week_range(ref_date)

        qs = Shift.objects.filter(
            date__range=(week_start, week_end),
        ).select_related('department').prefetch_related('assignments__employee')

        if not request.user.is_manager_or_above:
            qs = qs.filter(status=Shift.Status.PUBLISHED)

        dept_id = request.query_params.get('department')
        if dept_id:
            qs = qs.filter(department_id=dept_id)

        # Group by day
        days = {}
        for delta in range(7):
            d = week_start + timedelta(days=delta)
            days[d.isoformat()] = []

        for shift in qs:
            day_key = shift.date.isoformat()
            days[day_key].append(ShiftListSerializer(shift).data)

        return Response({
            'week_start': week_start.isoformat(),
            'week_end': week_end.isoformat(),
            'days': days,
        })


class MyScheduleView(APIView):
    """Returns current user's shift assignments for a date range."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        date_from_str = request.query_params.get('date_from')
        date_to_str = request.query_params.get('date_to')

        try:
            date_from = date.fromisoformat(date_from_str) if date_from_str else date.today()
            date_to = date.fromisoformat(date_to_str) if date_to_str else date_from + timedelta(days=30)
        except ValueError:
            return Response({'detail': 'Invalid date format. Use YYYY-MM-DD.'}, status=400)

        assignments = ShiftAssignment.objects.filter(
            employee=request.user,
            shift__date__range=(date_from, date_to),
        ).select_related('shift__department').exclude(
            status=ShiftAssignment.Status.DECLINED
        ).order_by('shift__date', 'shift__start_time')

        return Response(ShiftAssignmentSerializer(assignments, many=True).data)


class DashboardStatsView(APIView):
    """Manager/Admin dashboard stats."""
    permission_classes = [IsManagerOrAdmin]

    def get(self, request):
        today = date.today()
        week_start, week_end = get_week_range(today)

        # This week's shifts
        week_shifts = Shift.objects.filter(date__range=(week_start, week_end))
        week_assignments = ShiftAssignment.objects.filter(shift__date__range=(week_start, week_end))

        # Coverage: published shifts with assigned count vs required
        coverage_data = week_shifts.filter(status=Shift.Status.PUBLISHED).annotate(
            confirmed=Count('assignments', filter=Q(assignments__status__in=['confirmed', 'pending']))
        )
        total_required = sum(s.required_employees for s in coverage_data)
        total_filled = sum(min(s.confirmed, s.required_employees) for s in coverage_data)
        coverage_pct = round((total_filled / total_required * 100) if total_required else 0, 1)

        # Pending time-off requests
        from apps.users.models import TimeOffRequest
        pending_time_off = TimeOffRequest.objects.filter(status=TimeOffRequest.Status.PENDING).count()

        # Active employees
        active_employees = User.objects.filter(is_active=True, role='employee').count()

        # Today's shifts
        today_shifts = Shift.objects.filter(
            date=today, status=Shift.Status.PUBLISHED
        ).count()

        # Open swap requests
        from apps.shifts.models import ShiftSwapRequest
        open_swaps = ShiftSwapRequest.objects.filter(
            status__in=[ShiftSwapRequest.Status.PENDING, ShiftSwapRequest.Status.ACCEPTED]
        ).count()

        return Response({
            'week_start': week_start.isoformat(),
            'week_end': week_end.isoformat(),
            'coverage_percent': coverage_pct,
            'total_shifts_this_week': week_shifts.count(),
            'published_shifts_this_week': week_shifts.filter(status=Shift.Status.PUBLISHED).count(),
            'today_shifts': today_shifts,
            'active_employees': active_employees,
            'pending_time_off_requests': pending_time_off,
            'open_swap_requests': open_swaps,
            'total_assignments_this_week': week_assignments.count(),
        })


class EmployeeHoursReportView(APIView):
    """Report: hours worked per employee for a date range."""
    permission_classes = [IsManagerOrAdmin]

    def get(self, request):
        date_from_str = request.query_params.get('date_from')
        date_to_str = request.query_params.get('date_to')
        dept_id = request.query_params.get('department')

        try:
            date_from = date.fromisoformat(date_from_str) if date_from_str else date.today() - timedelta(days=30)
            date_to = date.fromisoformat(date_to_str) if date_to_str else date.today()
        except ValueError:
            return Response({'detail': 'Invalid date format.'}, status=400)

        qs = ShiftAssignment.objects.filter(
            shift__date__range=(date_from, date_to),
            status=ShiftAssignment.Status.COMPLETED,
            clock_in__isnull=False,
            clock_out__isnull=False,
        ).select_related('employee', 'shift__department')

        if dept_id:
            qs = qs.filter(shift__department_id=dept_id)

        # Aggregate per employee
        from collections import defaultdict
        employee_data = defaultdict(lambda: {'assignments': 0, 'total_hours': 0.0, 'shifts': []})

        for assignment in qs:
            key = assignment.employee_id
            employee_data[key]['employee_id'] = assignment.employee_id
            employee_data[key]['employee_name'] = assignment.employee.full_name
            employee_data[key]['assignments'] += 1
            if assignment.hours_worked:
                employee_data[key]['total_hours'] += assignment.hours_worked
            employee_data[key]['shifts'].append({
                'date': assignment.shift.date.isoformat(),
                'shift_name': assignment.shift.name,
                'hours': assignment.hours_worked,
            })

        report = sorted(employee_data.values(), key=lambda x: x.get('employee_name', ''))

        return Response({
            'date_from': date_from.isoformat(),
            'date_to': date_to.isoformat(),
            'employees': report,
        })
