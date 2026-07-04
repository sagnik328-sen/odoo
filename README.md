# PeopleFlow HRMS

PeopleFlow is a full-stack Human Resource Management System for employee records, attendance, leave, payroll, notifications, calendars, and reports.

> **Current status:** Milestone 4 is complete. This repository contains the project foundation, authentication system, role-specific dashboards, and a complete employee profile and directory management system with local avatar and document uploads.

## Technology stack

| Area | Technology |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS |
| Backend | FastAPI |
| Database | SQLite, SQLAlchemy, Alembic |
| Authentication | JWT access/refresh tokens, bcrypt |
| API | REST |
| Server state | TanStack React Query |
| Forms | React Hook Form |
| Charts | Recharts |
| Calendar | React Big Calendar |
| Reports (planned) | ReportLab, OpenPyXL |
| Version control | Git and GitHub |

## Architecture

The application is a modular monolith using three tiers and Clean Architecture boundaries:

```text
React presentation layer
          │
          │ HTTPS / REST
          ▼
FastAPI API + application layer
          │
          │ repository interfaces / SQLAlchemy
          ▼
SQLite persistence layer
```

Backend dependencies point inward:

1. `api` handles HTTP transport and delegates work.
2. `services` contain application use cases and business rules.
3. `repositories` isolate persistence operations.
4. `models` and `database` define SQLAlchemy entities and sessions.
5. `schemas` define validated API contracts.
6. `core` owns cross-cutting configuration, logging, and errors.

This separation lets the API, database, and business rules evolve independently and makes service-level testing straightforward.

## Repository structure

```text
.
├── backend/
│   ├── alembic/
│   │   ├── versions/
│   │   │   └── [revision]_add_users_table.py
│   │   └── env.py
│   ├── app/
│   │   ├── api/v1/routes/     # HTTP endpoints
│   │   │   ├── health.py
│   │   │   └── auth.py
│   │   ├── core/              # Settings, logging, exceptions, dependencies
│   │   │   ├── config.py
│   │   │   ├── exceptions.py
│   │   │   ├── logging.py
│   │   │   └── dependencies.py
│   │   ├── database/          # Engine, sessions, declarative base
│   │   ├── middleware/        # Future custom middleware
│   │   ├── models/            # SQLAlchemy models
│   │   │   └── user.py
│   │   ├── repositories/      # Data-access boundary
│   │   │   └── user.py
│   │   ├── schemas/           # Pydantic contracts
│   │   │   ├── health.py
│   │   │   └── auth.py
│   │   ├── services/          # Application use cases
│   │   │   ├── health.py
│   │   │   └── auth.py
│   │   ├── utils/             # Shared helpers
│   │   │   └── security.py
│   │   └── main.py            # FastAPI application factory
│   ├── tests/
│   ├── uploads/               # Ignored runtime uploads
│   ├── .env.example
│   ├── alembic.ini
│   ├── requirements.txt
│   └── requirements-dev.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js
│   │   │   └── auth.js
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── Footer.jsx
│   │   │   └── Navbar.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   │   ├── Landing/
│   │   │   │   └── LandingPage.jsx
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   ├── RegisterPage.jsx
│   │   │   │   ├── ForgotPasswordPage.jsx
│   │   │   │   └── ResetPasswordPage.jsx
│   │   │   └── DashboardPage.jsx
│   │   ├── routes/
│   │   │   └── ProtectedRoute.jsx
│   │   ├── styles/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── hrms.db                    # SQLite database file (ignored)
├── .gitignore
└── README.md
```

## Prerequisites

- Python 3.12 or newer
- Node.js 20.19+ or 22.12+
- npm 10+
- Git

SQLite requires no separate database server.

## Installation

Clone the repository and enter it:

```bash
git clone <repository-url>
cd odoo
```

### Backend

From the project root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
Copy-Item .env.example .env -ErrorAction SilentlyContinue
python -m alembic upgrade head
python -m uvicorn app.main:app --reload
```

For macOS/Linux, activate the environment with `source .venv/bin/activate` and copy the environment file with `cp .env.example .env`.

The API runs at `http://localhost:8000`. Useful URLs:

- Health: `GET http://localhost:8000/api/v1/health`
- Swagger UI: `http://localhost:8000/api/v1/docs`

Expected health response:

```json
{
  "status": "healthy",
  "service": "HRMS API",
  "version": "1.0.0"
}
```

### Frontend

In another terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env -ErrorAction SilentlyContinue
npm run dev
```

The landing page runs at `http://localhost:5173`.

## Environment variables

Backend variables are documented in `backend/.env.example`:

| Variable | Purpose |
| --- | --- |
| `HRMS_APP_NAME` | Service name returned by API metadata |
| `HRMS_APP_VERSION` | Current API version |
| `HRMS_ENVIRONMENT` | Runtime environment |
| `HRMS_DEBUG` | FastAPI debug behavior |
| `HRMS_API_V1_PREFIX` | Versioned API prefix |
| `HRMS_DATABASE_URL` | SQLAlchemy connection URL |
| `HRMS_BACKEND_CORS_ORIGINS` | JSON list of allowed frontend origins |
| `HRMS_LOG_LEVEL` | Application logging threshold |
| `HRMS_SECRET_KEY` | Secret key for signing JWT tokens |
| `HRMS_ACCESS_TOKEN_EXPIRE_MINUTES` | Expiry time for access tokens in minutes |
| `HRMS_REFRESH_TOKEN_EXPIRE_DAYS` | Expiry time for refresh tokens in days |
| `HRMS_ALGORITHM` | Algorithm used to sign JWT tokens |

The frontend uses `VITE_API_BASE_URL`. Real `.env` files are ignored by Git; commit only `.env.example` templates.

## Database migrations

Run all migrations from `backend/`:

```bash
python -m alembic upgrade head
```

After adding or changing SQLAlchemy models:

```bash
python -m alembic revision --autogenerate -m "describe the schema change"
python -m alembic upgrade head
```

Review every generated migration before applying it. The Milestone 1 baseline is intentionally empty because domain tables belong to later milestones.

## Quality checks

Backend:

```bash
cd backend
python -m ruff check .
python -m pytest
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

## Development workflow

1. Create a focused branch from `main`.
2. Copy environment templates locally; never commit secrets or runtime databases.
3. Keep HTTP concerns in routes, business rules in services, and queries in repositories.
4. Add a reviewed Alembic revision for every schema change.
5. Add tests with each behavior change.
6. Run backend lint/tests and frontend lint/build before opening a pull request.
7. Keep commits small and describe the reason for the change.

Suggested branch names include `feature/employee-profile`, `fix/attendance-timezone`, and `chore/update-dependencies`.

## Milestone 1 scope

Implemented:

- React 19 + Vite + Tailwind CSS foundation
- Responsive landing page with navbar and footer
- React Query provider and future frontend package foundations
- FastAPI application with versioned routing
- `GET /api/v1/health` as the only application endpoint
- Typed environment configuration
- CORS, structured logging, and global exception handling
- SQLite engine and SQLAlchemy session lifecycle
- Alembic configuration and initial baseline migration
- Clean Architecture folder boundaries
- Backend health contract tests
- Environment templates and repository-wide `.gitignore`

Not included in this milestone:

- Authentication or authorization
- Employee, attendance, leave, payroll, notification, or report endpoints
- HRMS domain database tables
- Dashboard or authenticated application screens

## Milestone 2 scope

Implemented:

Backend:
- User SQLAlchemy model with UUID primary key, employee ID, email, hashed password, roles, and timestamps
- Pydantic schemas for authentication requests and responses
- User repository for data access
- Authentication service implementing:
  - User registration with email/employee ID uniqueness checks
  - Login with JWT access/refresh token generation
  - Token refresh
  - Logout with token blacklist (in-memory for local dev)
  - Forgot password (logs reset links to console locally)
  - Reset password
- JWT-based authentication middleware
- Role-based access control dependencies
- New API routes under `/api/v1/auth/*`
- Alembic migration to create users table
- Added missing dependencies (python-jose, email-validator) to requirements.txt

Frontend:
- AuthContext for managing authentication state
- ProtectedRoute component for restricting access to authenticated users
- Axios client with interceptors for token refresh
- Login page with email/password fields, password toggle
- Register page with employee ID, full name, email, password validation (minimum length, uppercase, lowercase, number, special character)
- Forgot password page
- Reset password page with token from URL
- Dashboard page (placeholder) with welcome message and logout button
- Updated App.jsx with router setup

Not included in this milestone:

- Employee, attendance, leave, payroll, notification, or report features
- Email integration (SMTP not configured yet)
- Persistent token blacklist (uses in-memory storage)

## Milestone 3 scope

Implemented:

Frontend:
- Refactored `DashboardPage.jsx` to dynamically direct authenticated users to their corresponding dashboard view based on user role (`employee`, `hr`, or `admin`).
- Created `EmployeeDashboard.jsx` featuring:
  - Profile Card: showing employee ID, email, designation.
  - Work Tracker: interactive check-in/check-out with session timer.
  - Weekly Activity Log: Recharts bar chart showing daily logged hours.
  - Leave Requests: remaining balances (Vacation, Sick, Casual) with Recharts pie chart, recent leave lists, and a "Request Leave" form modal.
  - Payroll Card: monthly payslip summary and text download generator.
  - Notifications Card: unread count badges and alerts list.
- Created `HRDashboard.jsx` featuring:
  - Overview Metrics: total employees, pending leaves, average attendance, active shifts.
  - Pending Leave Reviews: review, approve, or reject employee leave requests dynamically.
  - Onboard Employee: register new employee accounts via input form modal.
  - Run Payroll: simulation modal for processing and disbursing monthly salaries.
  - Daily Attendance Recharts: tracking weekly attendance rate metrics.
- Created `AdminDashboard.jsx` featuring:
  - Directory Control: view all registered users and promote/demote user roles dynamically.
  - Security Event Audit: real-time list of system logs (logins, role upgrades, backups).
  - Administrative Controls: enable/disable system-wide maintenance mode lock, trigger instant database backups, and flush cache files.
  - Role Distribution Chart: Recharts pie chart tracking role proportions.
- Created `mockState.js` utility:
  - Centralized state persistence in `localStorage` for leaves, attendance, payroll, notifications, and user directory.
  - Enables cross-dashboard interactivity (e.g. employee requesting leave is immediately visible to and actioned by HR/Admin).

## Milestone 4 scope

Implemented:

Backend:
- Created `EmployeeProfile` and `EmployeeDocument` SQLAlchemy models with proper cascade deletes and foreign keys (handling manager reference dynamically).
- Added new database tables and generated schema migration script with Alembic.
- Implemented `EmployeeRepository` to manage database operations, supporting paginated lists, text-based search, and filtering by department/designation/role.
- Created `employee` API routes:
  - `GET /api/v1/employees` - Searchable, filterable, and paginated roster (HR/Admin only).
  - `POST /api/v1/employees font-medium` - Onboard new employee user + profile (HR/Admin only).
  - `GET /api/v1/employees/{user_id}` - Fetch details of an employee (Self/HR/Admin).
  - `PUT /api/v1/employees/{user_id}` - Update profile. Employees can edit only phone/address; HR/Admin can edit all fields (including designation, department, salary).
  - `DELETE /api/v1/employees/{user_id}` - Delete user account and profile, cleaning up local files (HR/Admin only).
  - `POST /api/v1/employees/{user_id}/upload-avatar` - Upload profile picture to local `uploads/` folder.
  - `POST /api/v1/employees/{user_id}/upload-document` - Upload document to local `uploads/` folder.
  - `DELETE /api/v1/employees/{user_id}/documents/{document_id}` - Delete document record and file.
- Mounted the `uploads/` folder as a static files route in `main.py` to serve avatars and uploaded files.

Frontend:
- Implemented `employee.js` API client for communication with backend endpoints.
- Updated `EmployeeDashboard.jsx` to fetch real profile information and enable profile picture and document uploads. Added tabs for Personal Details (editable), Job Details, Salary, and Documents.
- Created and integrated a reusable, robust `EmployeeDirectory.jsx` component inside `HRDashboard.jsx` and `AdminDashboard.jsx`. It supports real-time search, filters, pagination, profile view modals, full details editing, document uploading/management, and account deletion.

## License

No license has been selected yet.
