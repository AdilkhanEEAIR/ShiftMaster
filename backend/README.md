# ShiftMaster Backend

Django REST API for the ShiftMaster shift scheduling application.

## Tech Stack

- **Python 3.10+** / **Django 4.2**
- **Django REST Framework** — REST API
- **PostgreSQL** — Primary database
- **JWT (SimpleJWT)** — Authentication
- **drf-spectacular** — Auto-generated OpenAPI docs

---

## Project Structure

```
shiftmaster_backend/
├── shiftmaster/          # Django project config
│   ├── settings.py
│   └── urls.py
├── apps/
│   ├── users/            # Auth, User profiles, Availability, Time-off
│   ├── shifts/           # Departments, Shift templates, Shifts, Assignments, Swaps
│   ├── schedules/        # Weekly calendar, Dashboard stats, Reporting
│   └── notifications/   # In-app notifications (auto via signals)
├── requirements.txt
├── .env.example
└── manage.py
```

---

## Quick Start

### 1. Prerequisites

- Python 3.10+
- PostgreSQL 14+

### 2. Clone & Install

```bash
git clone <your-repo>
cd shiftmaster_backend

python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

### 4. Create the Database

```sql
-- In psql:
CREATE DATABASE shiftmaster_db;
```

### 5. Run Migrations

```bash
python manage.py migrate
```

### 6. Seed Sample Data (optional)

```bash
python manage.py seed_data
```

This creates sample departments, users, shifts, and assignments.

Default accounts:
| Email | Password | Role |
|-------|----------|------|
| admin@shiftmaster.com | admin1234 | Admin |
| manager@shiftmaster.com | manager1234 | Manager |
| alice.johnson@shiftmaster.com | employee1234 | Employee |

### 7. Run Server

```bash
python manage.py runserver
```

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login/` | Obtain JWT tokens |
| POST | `/api/v1/auth/refresh/` | Refresh access token |
| POST | `/api/v1/auth/logout/` | Blacklist refresh token |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users/me/` | Get current user |
| PATCH | `/api/v1/users/me/` | Update profile |
| POST | `/api/v1/users/me/change-password/` | Change password |
| GET/POST | `/api/v1/users/` | List / Create users |
| GET/PATCH/DELETE | `/api/v1/users/{id}/` | Retrieve / Update / Delete user |
| GET | `/api/v1/users/{id}/availability/` | User availability |
| GET | `/api/v1/users/{id}/time_off/` | User time-off requests |
| GET/POST | `/api/v1/users/time-off/` | List / Create time-off requests |
| PATCH | `/api/v1/users/time-off/{id}/review/` | Approve/Reject request (manager) |

### Shifts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/v1/shifts/` | List / Create shifts |
| GET/PUT/DELETE | `/api/v1/shifts/{id}/` | Shift detail |
| POST | `/api/v1/shifts/{id}/publish/` | Publish a shift |
| POST | `/api/v1/shifts/{id}/cancel/` | Cancel a shift |
| POST | `/api/v1/shifts/{id}/bulk_assign/` | Assign multiple employees |
| GET/POST | `/api/v1/shifts/assignments/` | List / Create assignments |
| POST | `/api/v1/shifts/assignments/{id}/clock/` | Clock in/out |
| PATCH | `/api/v1/shifts/assignments/{id}/respond/` | Confirm/Decline assignment |
| GET/POST | `/api/v1/shifts/swap-requests/` | List / Create swap requests |
| PATCH | `/api/v1/shifts/swap-requests/{id}/accept/` | Accept a swap |
| PATCH | `/api/v1/shifts/swap-requests/{id}/review/` | Manager approve/reject swap |
| GET/POST | `/api/v1/shifts/departments/` | Departments |
| GET/POST | `/api/v1/shifts/templates/` | Shift templates |

### Schedules

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/schedules/weekly/` | Weekly schedule (grouped by day) |
| GET | `/api/v1/schedules/my/` | Current user's upcoming shifts |
| GET | `/api/v1/schedules/dashboard/` | Manager dashboard stats |
| GET | `/api/v1/schedules/reports/hours/` | Hours worked report |

**Weekly schedule query params:**
- `date=YYYY-MM-DD` — any date in the target week (default: today)
- `department=<id>` — filter by department

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/notifications/` | List notifications |
| GET | `/api/v1/notifications/unread-count/` | Unread count |
| POST | `/api/v1/notifications/mark-read/` | Mark read (`{"ids": [1,2]}` or empty for all) |

### Interactive Docs

- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/

---

## Key Design Decisions

### Roles
- **Admin** — full access
- **Manager** — manage shifts, approve time-off, review swaps
- **Employee** — view published shifts, confirm/decline assignments, request time-off, request swaps

### Shift Lifecycle
```
Draft → Published → Cancelled
```

### Assignment Lifecycle
```
Pending → Confirmed → Completed
                ↘ Declined
                ↘ No Show
                ↘ Swapped
```

### Notifications
Auto-triggered via Django signals on:
- Shift assigned / published / cancelled
- Swap request created / reviewed
- Time-off request reviewed
