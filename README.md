# LearnSphere

A professional e-learning platform built with React + Vite + Tailwind CSS on the frontend and Node.js + Express + PostgreSQL on the backend.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Router | React Router v6 |
| Backend | Node.js + Express + TypeScript |
| Validation | Zod (client + server) |
| Database | PostgreSQL + node-postgres (pg) |
| Auth | bcrypt + JWT (in-memory) + HTTP-only refresh cookie |
| Testing | Vitest + Supertest + Playwright |

## Requirements

- Node.js v18+ (v22 recommended)
- npm v10+
- PostgreSQL 14+ (local or via pgAdmin 4)

## Quick Start

### 1. Clone and install

```bash
git clone <repo>
cd learnsphere
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL` — your local PostgreSQL connection string
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — at least 32 character random strings

### 3. Create the database

In psql or pgAdmin:
```sql
CREATE DATABASE learnsphere;
```

### 4. Run migrations

```bash
npm run db:migrate
```

### 5. Seed development data

```bash
npm run db:seed
```

### 6. Start development servers

```bash
npm run dev
```

This starts:
- **Client**: http://localhost:5173
- **Server API**: http://localhost:3001

## Default Development Accounts

After running `npm run db:seed`:

| Role | Email | Password |
|------|-------|---------|
| Admin | admin@learnsphere.dev | Admin123! |
| Instructor | instructor1@learnsphere.dev | Instructor123! |
| Instructor | instructor2@learnsphere.dev | Instructor123! |
| Learner | learner1@learnsphere.dev | Learner123! |
| Learner | learner2@learnsphere.dev | Learner123! |

## Available Commands

```bash
# Development
npm run dev            # Start both client and server
npm run dev:client     # Client only (Vite, port 5173)
npm run dev:server     # Server only (Express, port 3001)

# Database
npm run db:migrate     # Apply pending migrations
npm run db:seed        # Apply seed data (runs migrations first)
npm run db:reset       # Drop and recreate schema (DESTRUCTIVE)

# Type checking
npm run typecheck      # Check both client and server

# Linting
npm run lint           # Lint both client and server

# Testing
npm run test           # Unit + API tests (Vitest)
npm run test:api       # API integration tests only
npm run test:e2e       # Browser E2E tests (Playwright)

# Build
npm run build          # Production build (client + server)
```

## Project Structure

```
learnsphere/
├── client/                 # React + Vite frontend
│   └── src/
│       ├── app/            # Router and app root
│       ├── components/     # Shared UI components
│       ├── features/       # Feature modules (auth, courses, etc.)
│       ├── pages/          # Route-level page components
│       ├── services/       # API client and service wrappers
│       └── types/          # TypeScript type definitions
├── server/                 # Express + TypeScript backend
│   └── src/
│       ├── config/         # Environment config
│       ├── database/       # PostgreSQL pool + migrations
│       ├── middleware/      # Auth, error handling
│       ├── modules/        # Feature modules (auth, courses, etc.)
│       ├── services/       # Shared services (storage)
│       └── utils/          # Helpers and error classes
├── database/
│   ├── migrations/         # SQL migration files (001-014)
│   └── seeds/              # Development seed data
├── storage/                # Local file storage (gitignored)
├── tests/                  # E2E and integration tests
└── docs/                   # Architecture and API documentation
```

## pgAdmin Setup

1. Open pgAdmin 4
2. Add a new server with your local PostgreSQL connection details
3. Navigate to the `learnsphere` database to inspect tables and data

## Security Notes

- Passwords are hashed with bcrypt (cost 12)
- Access tokens are stored **in memory only** — never in localStorage
- Refresh tokens are stored as SHA-256 hashes in the database
- Refresh token rotation is enabled — each refresh invalidates the old token
- HTTP-only, SameSite=Lax cookies prevent XSS token theft
- All API authorization is enforced on the server

## Architecture Decision Records

See [`docs/architecture.md`](docs/architecture.md) for detailed architecture decisions.
