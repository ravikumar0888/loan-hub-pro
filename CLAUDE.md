# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LoanMS is a full-stack loan management system with a React TypeScript frontend and Node.js + PostgreSQL backend. The application manages loan applications with role-based access control (Admin, BackOffice, Connector) and tracks loans through 7 statuses: login, rejected, approved, disbursed, hold, relook, drop.

## Development Commands

### Frontend (Root Directory)
```bash
npm run dev          # Start Vite dev server (port 8080)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend (backend/ Directory)
```bash
cd backend

# Development
npm run dev          # Start with hot reload (port 5000)
npm run build        # Compile TypeScript to dist/
npm start            # Run compiled production server

# Database (Prisma)
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Create/run migrations
npm run prisma:studio    # Open database GUI (port 5555)
npm run prisma:seed      # Seed database with sample data
npm run prisma:reset     # Reset database (drops & recreates)
```

## Architecture

### Backend Architecture (3-Layer Pattern)

**Controllers** (`backend/src/controllers/`) → Handle HTTP requests/responses
**Services** (`backend/src/services/`) → Business logic and database operations
**Routes** (`backend/src/routes/`) → Define API endpoints and middleware

Key architectural patterns:
- **Middleware chain**: `authenticate` → `authorize(roles)` → `validate(schema)` → controller
- **Role-based filtering**: Services check `req.user.role` to filter data (Connectors see only their customers)
- **Prisma transactions**: Multi-step operations use `prisma.$transaction([])`

### Database Schema (8 Tables)

Core relationships:
- `User` (1:N) → `Customer` via `connectorId`
- `User` (1:N) → `UserBankDetail` (N:1) → `Bank` (connector-bank associations)
- `Dsa` (1:N) → `DsaBankDetail` (N:1) → `Bank` (DSA-bank associations)
- `Customer` (1:N) → `CustomerRemark`

Enums: `UserRole`, `LoanStatus`, `LoanType` defined in `backend/prisma/schema.prisma`

### Authentication Flow

1. Login → `authService.login()` → verify password → generate JWT with `{userId, email, role}`
2. Protected routes → `authenticate` middleware → verify JWT → populate `req.user`
3. Role restrictions → `authorize(['admin', 'backoffice'])` middleware

Token stored in `localStorage` as `auth_token` (frontend manages via `src/lib/api.ts`)

### Frontend API Integration

Use pre-built API client in `src/lib/api.ts`:
```typescript
import { authApi, customersApi, dashboardApi } from '@/lib/api';

// Login sets token in localStorage automatically
const { data } = await authApi.login(email, password);
setAuthToken(data.token);

// All subsequent calls include token in Authorization header
const customers = await customersApi.getCustomers();
```

Do NOT call `fetch()` directly - always use the API helper functions.

## Environment Configuration

**Frontend** (`.env`):
- `VITE_API_URL` - Backend API URL (default: `http://localhost:5000/api`)
- `DATABASE_URL` - PostgreSQL connection string (only if running backend setup from frontend root)

**Backend** (`backend/.env`):
- `DATABASE_URL` - PostgreSQL connection (format: `postgresql://user:pass@localhost:5432/loanms`)
- `JWT_SECRET` - Min 32 chars for production
- `PORT` - Server port (default: 5000)
- `CORS_ORIGIN` - Frontend URL (default: `http://localhost:5173`)

## Database Migrations

When modifying `backend/prisma/schema.prisma`:
1. Run `npm run prisma:migrate` (creates migration in `prisma/migrations/`)
2. Run `npm run prisma:generate` (updates Prisma client types)
3. Restart backend server

If migrations fail: `npm run prisma:reset` (⚠️ deletes all data)

## Role-Based Access Rules

**Admin**: Full CRUD on all entities
**BackOffice**: Create/update customers, view dashboard/reports
**Connector**: Read-only own customers, add remarks

Middleware enforcement:
- `authorize(['admin'])` - Admin only
- `authorize(['admin', 'backoffice'])` - Admin or BackOffice
- No middleware = All authenticated users

Services apply additional filtering:
- `customersService.getCustomers()` filters by `connectorId` if role is 'connector'

## API Response Format

All endpoints return:
```typescript
{
  success: boolean,
  data?: T,
  message?: string,
  error?: string
}
```

Paginated endpoints add:
```typescript
{
  data: T[],
  pagination: { page, limit, total, totalPages }
}
```

## Common Patterns

### Adding a New API Endpoint

1. Define Zod schema in `backend/src/utils/validators.ts`
2. Create service method in `backend/src/services/[entity].service.ts`
3. Create controller method in `backend/src/controllers/[entity].controller.ts`
4. Add route in `backend/src/routes/[entity].routes.ts` with middleware
5. Import route in `backend/src/app.ts`
6. Add frontend helper in `src/lib/api.ts`

### Role-Based Data Filtering

Always pass `userId` and `userRole` to service methods from controllers:
```typescript
const result = await service.getData(
  query,
  req.user?.userId,
  req.user?.role
);
```

Service applies filtering:
```typescript
if (userRole === 'connector') {
  where.connectorId = userId;
}
```

## Demo Credentials

- **Admin**: admin@loanms.com / password123
- **BackOffice**: backoffice@loanms.com / password123
- **Connector**: connector@loanms.com / password123

Seed script creates 50 sample customers, 7 banks, 2 DSAs.

## Troubleshooting

**Database connection errors**: Verify PostgreSQL is running and `DATABASE_URL` is correct
**Port conflicts**: Frontend uses 8080, backend uses 5000, Prisma Studio uses 5555
**Prisma errors**: Run `npm run prisma:generate` after schema changes
**JWT errors**: Ensure JWT_SECRET is set and tokens aren't expired (24h validity)

## Important Notes

- Frontend currently uses mock data - integrate with backend by replacing mock imports with API calls from `src/lib/api.ts`
- All passwords hashed with bcrypt (10 salt rounds)
- Winston logs stored in `backend/logs/` (error.log, combined.log)
- Prisma client auto-generated - never edit `node_modules/@prisma/client`
- Customer remarks are append-only (create only, no update/delete)
