"""
Management command: seed_data
Creates sample departments, users, shift templates, and shifts for development.

Usage: python manage.py seed_data
"""
from datetime import date, time, timedelta
import random

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the database with sample data for development'

    def handle(self, *args, **options):
        from apps.shifts.models import Department, ShiftTemplate, Shift, ShiftAssignment

        self.stdout.write('🌱 Seeding database...')

        # --- Departments ---
        dept_data = [
            {'name': 'Front Desk', 'color': '#3B82F6'},
            {'name': 'Kitchen', 'color': '#EF4444'},
            {'name': 'Security', 'color': '#10B981'},
            {'name': 'Housekeeping', 'color': '#F59E0B'},
        ]
        departments = {}
        for d in dept_data:
            dept, _ = Department.objects.get_or_create(name=d['name'], defaults={'color': d['color']})
            departments[d['name']] = dept
            self.stdout.write(f'  Department: {dept.name}')

        # --- Admin user ---
        admin, created = User.objects.get_or_create(
            email='admin@shiftmaster.com',
            defaults={
                'first_name': 'Admin',
                'last_name': 'User',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin.set_password('admin1234')
            admin.save()
            self.stdout.write(self.style.SUCCESS('  Admin: admin@shiftmaster.com / admin1234'))

        # --- Manager ---
        manager, created = User.objects.get_or_create(
            email='manager@shiftmaster.com',
            defaults={
                'first_name': 'Sarah',
                'last_name': 'Manager',
                'role': User.Role.MANAGER,
                'department': departments['Front Desk'],
                'position': 'Shift Supervisor',
            }
        )
        if created:
            manager.set_password('manager1234')
            manager.save()
            self.stdout.write(self.style.SUCCESS('  Manager: manager@shiftmaster.com / manager1234'))

        # --- Employees ---
        employees_data = [
            ('Alice', 'Johnson', 'Front Desk', 'Receptionist'),
            ('Bob', 'Smith', 'Kitchen', 'Chef'),
            ('Carol', 'Davis', 'Security', 'Guard'),
            ('David', 'Wilson', 'Housekeeping', 'Housekeeper'),
            ('Eva', 'Martinez', 'Front Desk', 'Receptionist'),
            ('Frank', 'Brown', 'Kitchen', 'Sous Chef'),
        ]
        employees = []
        for i, (first, last, dept_name, position) in enumerate(employees_data, start=1):
            emp, created = User.objects.get_or_create(
                email=f'{first.lower()}.{last.lower()}@shiftmaster.com',
                defaults={
                    'first_name': first,
                    'last_name': last,
                    'role': User.Role.EMPLOYEE,
                    'department': departments[dept_name],
                    'position': position,
                    'hourly_rate': round(15 + random.uniform(0, 10), 2),
                }
            )
            if created:
                emp.set_password('employee1234')
                emp.save()
                self.stdout.write(f'  Employee: {emp.email}')
            employees.append(emp)

        # --- Shift Templates ---
        templates_data = [
            ('Morning', 'morning', 'Front Desk', time(7, 0), time(15, 0)),
            ('Afternoon', 'afternoon', 'Front Desk', time(15, 0), time(23, 0)),
            ('Night', 'night', 'Security', time(23, 0), time(7, 0)),
            ('Breakfast', 'morning', 'Kitchen', time(6, 0), time(14, 0)),
            ('Dinner', 'evening', 'Kitchen', time(14, 0), time(22, 0)),
        ]
        templates = {}
        for name, stype, dept_name, start, end in templates_data:
            tmpl, _ = ShiftTemplate.objects.get_or_create(
                name=name,
                department=departments[dept_name],
                defaults={
                    'shift_type': stype,
                    'start_time': start,
                    'end_time': end,
                    'break_duration_minutes': 30,
                    'required_employees': 2,
                }
            )
            templates[f'{dept_name}_{name}'] = tmpl

        # --- Shifts for next 7 days ---
        today = date.today()
        for delta in range(7):
            d = today + timedelta(days=delta)
            for tmpl in ShiftTemplate.objects.all()[:4]:
                shift, created = Shift.objects.get_or_create(
                    template=tmpl,
                    date=d,
                    defaults={
                        'department': tmpl.department,
                        'name': tmpl.name,
                        'start_time': tmpl.start_time,
                        'end_time': tmpl.end_time,
                        'break_duration_minutes': tmpl.break_duration_minutes,
                        'required_employees': tmpl.required_employees,
                        'color': tmpl.color,
                        'status': Shift.Status.PUBLISHED,
                        'created_by': admin,
                    }
                )
                if created:
                    # Randomly assign 1-2 employees
                    dept_employees = [e for e in employees if e.department == tmpl.department]
                    for emp in dept_employees[:2]:
                        ShiftAssignment.objects.get_or_create(
                            shift=shift,
                            employee=emp,
                            defaults={'assigned_by': admin, 'status': ShiftAssignment.Status.CONFIRMED},
                        )

        self.stdout.write(self.style.SUCCESS('\n✅ Seeding complete!'))
        self.stdout.write('Credentials:')
        self.stdout.write('  admin@shiftmaster.com / admin1234')
        self.stdout.write('  manager@shiftmaster.com / manager1234')
        self.stdout.write('  alice.johnson@shiftmaster.com / employee1234')
