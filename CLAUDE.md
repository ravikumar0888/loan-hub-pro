# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LoanMS is a multi-tenant SaaS loan management system with organization-based data isolation, subscription billing, and role-based access control. The system consists of a React frontend (Vite + TypeScript + shadcn/ui) and an Express backend (TypeScript + Prisma + PostgreSQL).

**Key URLs:**
- Frontend: http://localhost:8080
- Backend API: http://localhost:5000
- API Base: http://localhost:5000/api

There is no automated test suite in either the frontend or backend `package.json` — verification relies on manual API calls (curl) and running the dev servers.

## Development Commands

### Frontend (Root Directory)
```bash
npm run dev           # Start dev server (port 8080)
npm run build         # Production build
npm run build:dev     # Development build
npm run lint          # Run ESLint
npm run preview       # Preview production build
```

### Backend (backend/ directory)
```bash
npm run dev                  # Start dev server with auto-reload (ts-node-dev, port 5000)
npm run build                # Compile TypeScript to dist/
npm start                    # Run production build

# Prisma Database Commands
npm run prisma:generate      # Generate Prisma Client (run after schema changes)
npm run prisma:migrate       # Create and apply migration (dev)
npm run prisma:deploy        # Deploy migrations (production)
npm run prisma:studio        # Open Prisma Studio GUI

# Setup Commands
npm run setup                # Full setup: migrate + generate + create superadmin
npm run setup:master         # Create master admin user only
npx ts-node create-superadmin.ts      # Create organization superadmin
npx ts-node create-master-admin.ts    # Create platform master admin
```

The backend directory also has many one-off `.ts` scripts at its root (e.g. `check-data.ts`, `verify-users.ts`, `update-admin-password.ts`, `run-role-migration.ts`) used for ad-hoc data fixes/migrations — run with `npx ts-node <script>.ts`. Treat these as diagnostic tools, not part of the app runtime.

## Architecture

### Multi-Tenant Architecture

**Core Concept:** Every piece of data (except master_admin users) belongs to an Organization. Data isolation is enforced at the middleware/service level, not the database level.

**Role Hierarchy:**
1. `master_admin` - Platform administrator (organizationId = NULL)
   - Sees all organizations
   - Manages billing and subscriptions
   - Creates/deletes organizations

2. `superadmin` - Organization owner (assigned to specific org)
   - Full access within their organization
   - Cannot see other organizations' data
   - Manages organization settings and users

3. `admin` - Organization administrator
   - Manages users, customers, banks, DSAs within org

4. `backoffice` - Back-office staff
   - Limited administrative access

5. `connector` - Sales/connector staff
   - Customer and loan management

**Pricing Tiers** (`backend/src/config/constants.ts` → `PRICING_TIER_LIMITS`):
- `starter`: ₹4,999 fixed package price, 14 seats (1 superadmin, 1 admin, 2 backoffice, 10 connector)
- `professional`: ₹13,999 fixed package price, 66 seats (1 superadmin, 5 admin, 10 backoffice, 50 connector)
- `enterprise`: ₹8,999 fixed package price, 33 seats (1 superadmin, 2 admin, 5 backoffice, 25 connector) — customizable with per-role addon pricing (₹100/connector, ₹200/backoffice, ₹500/admin)

Tiers are fixed-package (not strictly per-seat) — check `constants.ts` before assuming pricing math elsewhere in the code.

### Request Flow (Backend)

**Public Endpoints:**
```
Request → CORS → rate limiter → Body Parser → Route Handler
```

**Protected Endpoints:**
```
Request → CORS → rate limiter → Body Parser → authenticate → organizationContext → authorize → Route Handler
```

**Middleware Chain** (applied per-router inside each `*.routes.ts` file, not globally in `app.ts`):
1. `authenticate` (`middleware/auth.ts`) - Verifies JWT token, sets `req.user`
2. `organizationContext` (`middleware/organizationContext.ts`) - Reads `organizationId` from the JWT (fast path, falls back to a DB lookup for older tokens), sets `req.organizationId` (null for master_admin)
3. `authorize(['role1', 'role2'])` (`middleware/authorize.ts`) - Checks user role permissions, applied per-route as needed

**Critical:** All protected routes MUST call `router.use(authenticate)` then `router.use(organizationContext)` before any route handlers, in that order. `app.ts` itself only mounts routers under `/api/*` — it does not apply auth globally, so a new route file that forgets this chain is unprotected.

### Database Schema (Prisma)

**Models** (`backend/prisma/schema.prisma`): `Organization`, `Invoice`, `User`, `Customer`, `Bank`, `Dsa`, `DsaBankDetail`, `UserBankDetail`, `PayoutLedger`, `PayoutPDF`, `DsaInvoice`, `CustomerRemark`, `PasswordResetToken`, `Notification`.

**Multi-Tenancy:**
- `Organization` - Tenant container with billing info
- `Invoice` - Subscription invoices for organizations
- `User` - Has nullable `organizationId` (null only for master_admin)
- `Customer`, `Bank`, `Dsa`, `PayoutLedger`, `DsaInvoice`, `Notification` - All have required `organizationId`

**Important Fields:**
- `User.organizationId` - NULL for master_admin, required for all others
- `Organization.status` - trial | active | suspended
- `Invoice.invoiceNumber` - Auto-generated format: INV-YYYY-###

### Frontend Context Architecture

**Provider nesting** (`src/App.tsx`):
```tsx
QueryClientProvider (TanStack Query)
  → ThemeProvider
    → TooltipProvider
      → AuthProvider (JWT token management)
        → SessionTimeoutProvider
          → AdminPasswordVerificationProvider
            → OrganizationProvider (multi-tenant org data)
              → BillingProvider (subscription/invoice data)
                → App routes/components
```

**AuthContext** (`src/contexts/AuthContext.tsx`):
- Manages JWT tokens in localStorage
- Calls `/api/auth/login` for authentication
- Persists user session across page refreshes
- Provides `login()`, `logout()`, `user`, `role`, `isAuthenticated`

**Critical:** Frontend uses the real backend API, not mock data. The AuthContext stores JWT tokens and makes actual HTTP requests to `http://localhost:5000`.

### API Endpoints Structure

Routes are mounted in `backend/src/app.ts`. Each `*.routes.ts` file applies its own `authenticate`/`organizationContext`/`authorize` chain (see Middleware Chain above) rather than relying on global middleware.

**Public:**
- `POST /api/auth/login` - Login (returns JWT + user)
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/signup` - Self-service organization signup

**Protected (organization-scoped unless noted):**
- `/api/organizations` - Org CRUD + stats (master_admin only for list/create/delete)
- `/api/invoices` - Billing invoices (master_admin only for create/status-update/analytics)
- `/api/customers` - Loan applications, remarks, PDF generation, duplication
- `/api/banks` - Partner bank/NBFC management
- `/api/users` - User management within org
- `/api/dsas` - DSA (Direct Selling Agent) management
- `/api/dashboard` - KPIs, trends, recent customers
- `/api/reports` - Filterable reports + CSV export
- `/api/payouts` - Payout ledger and PDF generation
- `/api/profile` - Current user's profile
- `/api/notifications` - In-app notifications
- `/api/dsa-invoices` - DSA invoice management
- `/api/backup` - Data backup

## Important Implementation Details

### Creating New Protected Routes

When adding new routes that need organization-scoped data:

1. **Apply middleware in correct order, inside the route file itself:**
```typescript
router.use(authenticate);           // First: verify JWT
router.use(organizationContext);    // Second: inject organizationId
router.get('/', authorize(['admin']), handler); // Third: check role
```

2. **Service methods must accept organizationId:**
```typescript
async getItems(query, userId, userRole, organizationId: string | null) {
  const where: any = {};

  // Multi-tenant filtering
  if (userRole !== 'master_admin' && organizationId) {
    where.organizationId = organizationId;
  }

  // Additional filters...
}
```

3. **Controllers pass organizationId to services:**
```typescript
async getItems(req: AuthRequest, res: Response) {
  const result = await service.getItems(
    req.query,
    req.user?.userId,
    req.user?.role,
    req.organizationId  // From organizationContext middleware
  );
}
```

4. **Register the router in `backend/src/app.ts`** under `/api/<resource>` alongside the other protected routers.

### Database Migrations

**After schema changes:**
```bash
cd backend
npx prisma migrate dev --name descriptive_migration_name
npx prisma generate
```

**Important:** Always generate Prisma Client after migrations. The backend will fail if the client is out of sync with the schema.

### User Creation Scripts

**Master Admin (Platform):**
```bash
cd backend
npx ts-node create-master-admin.ts
# Email: master@loanms.com
# Password: MasterAdmin@123
# Role: master_admin
# organizationId: NULL
```

**Superadmin (Organization):**
```bash
cd backend
npx ts-node create-superadmin.ts
# Email: superadmin@loanms.com
# Password: Admin@123
# Role: superadmin
# organizationId: (assigned to default org)
```

### Environment Setup

**Backend .env file:**
```env
PORT=5000
DATABASE_URL="postgresql://user:pass@localhost:5432/loanms?schema=public"
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:8080
```

**Important:** The `DATABASE_URL` must be set correctly for Prisma to connect to PostgreSQL.

## File Structure (Key Areas)

### Backend Structure
```
backend/
├── src/
│   ├── app.ts                    # Express app + middleware setup + route mounting
│   ├── index.ts                  # Server entry point
│   ├── config/
│   │   ├── database.ts          # Prisma client singleton
│   │   └── constants.ts         # Pricing tiers, limits, enums
│   ├── middleware/
│   │   ├── auth.ts              # authenticate
│   │   ├── authorize.ts         # authorize(roles[])
│   │   └── organizationContext.ts  # Multi-tenant data isolation
│   ├── controllers/             # HTTP request handlers
│   ├── services/                # Business logic
│   ├── routes/                  # Route definitions (auth chain applied per-file)
│   ├── types/                   # TypeScript type definitions
│   └── utils/
│       ├── jwt.ts               # Token generation/verification
│       ├── password.ts          # Password hashing
│       └── validators.ts        # Zod schemas
├── prisma/
│   └── schema.prisma            # Database schema
└── create-*.ts / *.ts            # User creation & one-off data scripts
```

### Frontend Structure
```
src/
├── App.tsx                      # Provider nesting + routes + protected routes
├── main.tsx                     # App entry point
├── contexts/
│   ├── AuthContext.tsx          # Authentication (real API)
│   ├── OrganizationContext.tsx  # Organization data
│   ├── BillingContext.tsx       # Billing/invoices
│   ├── ThemeContext.tsx         # Theme (light/dark)
│   ├── SessionTimeoutContext.tsx           # Auto-logout on inactivity
│   └── AdminPasswordVerificationContext.tsx # Re-auth gate for sensitive actions
├── components/
│   ├── auth/                    # Login/signup components
│   ├── layout/                  # DashboardLayout
│   └── ui/                      # shadcn/ui components
├── pages/                       # Route page components
└── types/                       # TypeScript types
```

## Known Issues & Gotchas

1. **AuthContext changed from mock to real API:** The frontend now calls `http://localhost:5000/api/auth/login`. Ensure backend is running.

2. **organizationId filtering is manual:** Services must manually check `userRole !== 'master_admin'` before applying organizationId filters. This is intentional for flexibility but means a forgotten check silently leaks cross-tenant data — always verify new service methods filter by `organizationId` correctly.

3. **JWT tokens in localStorage:** Tokens persist across sessions. Clear localStorage to force re-login during development.

4. **Prisma Client must be regenerated:** After any schema.prisma changes, run `npx prisma generate` or the backend will fail with "Unknown model" errors.

5. **Master admin has no organization:** The master_admin role is special - it has `organizationId = NULL` and bypasses all organization filtering.

6. **Root README.md is stale:** It describes an older, non-multi-tenant version of this app (different roles, port 5173, no master_admin/superadmin tiers). Trust this CLAUDE.md and the actual source (`app.ts`, `schema.prisma`, `constants.ts`) over `README.md` when they disagree.

## Testing Authentication

**Test Login (Backend):**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@loanms.com","password":"Admin@123"}'
```

**Test with Token:**
```bash
TOKEN="your-jwt-token-here"
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

## Documentation Files

Comprehensive implementation documentation is available in the repository:
- `backend/MULTI-TENANCY-IMPLEMENTATION.md` - Complete multi-tenancy architecture
- `backend/BACKEND-SETUP-COMPLETE.md` - Backend setup and endpoints
- `backend/INTEGRATION-GUIDE.md` - Step-by-step integration instructions
- Multiple `*-COMPLETE.md` files documenting feature implementations

Refer to these when implementing new features or troubleshooting issues.
