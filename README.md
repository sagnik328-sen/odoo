# PeopleFlow HRMS

PeopleFlow is a full-stack Human Resource Management System for employee records, attendance, leave, payroll, notifications, calendars, and reports.

> **Current status:** Milestone 1 is complete. This repository contains the project foundation, one health endpoint, and a public landing page. Authentication and HRMS domain features are intentionally not implemented yet.

## Technology stack

| Area | Technology |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS |
| Backend | FastAPI |
| Database | SQLite, SQLAlchemy, Alembic |
| Authentication (planned) | JWT access/refresh tokens, bcrypt |
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
│   │   └── env.py
│   ├── app/
│   │   ├── api/v1/routes/     # HTTP endpoints
│   │   ├── core/              # Settings, logging, exceptions
│   │   ├── database/          # Engine, sessions, declarative base
│   │   ├── middleware/        # Future custom middleware
│   │   ├── models/            # SQLAlchemy models
│   │   ├── repositories/      # Data-access boundary
│   │   ├── schemas/           # Pydantic contracts
│   │   ├── services/          # Application use cases
│   │   ├── utils/             # Shared helpers
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
│   │   ├── assets/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/Landing/
│   │   ├── styles/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
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

## License

No license has been selected yet.
