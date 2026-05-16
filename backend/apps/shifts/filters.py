import django_filters
from .models import Shift, ShiftAssignment


class ShiftFilter(django_filters.FilterSet):
    date_from = django_filters.DateFilter(field_name='date', lookup_expr='gte')
    date_to = django_filters.DateFilter(field_name='date', lookup_expr='lte')
    department = django_filters.NumberFilter(field_name='department__id')
    status = django_filters.CharFilter(field_name='status')
    understaffed = django_filters.BooleanFilter(method='filter_understaffed')

    class Meta:
        model = Shift
        fields = ['date_from', 'date_to', 'department', 'status']

    def filter_understaffed(self, queryset, name, value):
        if value:
            from django.db.models import Count, Q, F
            return queryset.annotate(
                confirmed_count=Count(
                    'assignments',
                    filter=Q(assignments__status__in=['confirmed', 'pending']),
                )
            ).filter(confirmed_count__lt=F('required_employees'))
        return queryset


class ShiftAssignmentFilter(django_filters.FilterSet):
    date_from = django_filters.DateFilter(field_name='shift__date', lookup_expr='gte')
    date_to = django_filters.DateFilter(field_name='shift__date', lookup_expr='lte')
    employee = django_filters.NumberFilter(field_name='employee__id')
    department = django_filters.NumberFilter(field_name='shift__department__id')
    status = django_filters.CharFilter(field_name='status')

    class Meta:
        model = ShiftAssignment
        fields = ['date_from', 'date_to', 'employee', 'department', 'status']
