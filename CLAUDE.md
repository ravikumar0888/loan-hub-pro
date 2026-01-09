# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LoanMS is a multi-tenant SaaS loan management system with organization-based data isolation, subscription billing, and role-based access control. The system consists of a React frontend (Vite + TypeScript + shadcn/ui) and an Express backend (TypeScript + Prisma + PostgreSQL).

**Key URLs:**
- Frontend: http://localhost:8080
- Backend API: http://localhost:5000
- API Base: http://localhost:5000/api

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
npm run dev                  # Start dev server with auto-reload (port 5000)
npm run build                # Compile TypeScript to dist/
npm start                    # Run production build

# Prisma Database Commands
npm run prisma:generate      # Generate Prisma Client (run after schema changes)
npm run prisma:migrate       # Create and apply migration
npm run prisma:deploy        # Deploy migrations (production)
npm run prisma:studio        # Open Prisma Studio GUI

# Setup Commands
npm run setup                # Full setup: migrate + generate + create superadmin
npm run setup:master         # Create master admin user only
npx ts-node create-superadmin.ts      # Create organization superadmin
npx ts-node create-master-admin.ts    # Create platform master admin
```

## Architecture

### Multi-Tenant Architecture

**Core Concept:** Every piece of data (except master_admin users) belongs to an Organization. Data isolation is enforced at the middleware level.

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

**Pricing Tiers:**
- `starter`: ₹499/seat, 1-5 seats
- `professional`: ₹899/seat, 5-25 seats
- `enterprise`: ₹1499/seat, 10+ unlimited

### Request Flow (Backend)

**Public Endpoints:**
```
Request → CORS → Body Parser → Route Handler
```

**Protected Endpoints:**
```
Request → CORS → Body Parser → authenticate → organizationContext → authorize → Route Handler
```

**Middleware Chain:**
1. `authenticate` - Verifies JWT token, sets req.user
2. `organizationContext` - Injects req.organizationId (null for master_admin)
3. `authorize(['role1', 'role2'])` - Checks user role permissions

**Critical:** All protected routes MUST have both `authenticate` and `organizationContext` middleware applied in that order.

### Database Schema (Prisma)

**Multi-Tenancy Models:**
- `Organization` - Tenant container with billing info
- `Invoice` - Subscription invoices for organizations
- `User` - Has nullable `organizationId` (null only for master_admin)
- `Customer`, `Bank`, `Dsa` - All have required `organizationId`

**Important Fields:**
- `User.organizationId` - NULL for master_admin, required for all others
- `Organization.status` - trial | active | suspended
- `Invoice.invoiceNumber` - Auto-generated format: INV-YYYY-###

**Schema Location:** `backend/prisma/schema.prisma`

### Frontend Context Architecture

**Authentication Flow:**
```tsx
AuthProvider (JWT token management)
  → OrganizationProvider (multi-tenant org data)
    → BillingProvider (subscription/invoice data)
      → App Components
```

**AuthContext** (`src/contexts/AuthContext.tsx`):
- Manages JWT tokens in localStorage
- Calls `/api/auth/login` for authentication
- Persists user session across page refreshes
- Provides `login()`, `logout()`, `user`, `role`, `isAuthenticated`

**Critical:** Frontend now uses REAL backend API, not mock data. The AuthContext stores JWT tokens and makes actual HTTP requests.

### API Endpoints Structure

**Authentication (Public):**
- `POST /api/auth/login` - Login (returns JWT + user)
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/signup` - Self-service organization signup

**Organizations (Protected):**
- `GET /api/organizations` - List all (master_admin only)
- `POST /api/organizations` - Create organization (master_admin only)
- `GET /api/organizations/:id` - Get details
- `PUT /api/organizations/:id` - Update
- `DELETE /api/organizations/:id` - Delete (master_admin only)
- `GET /api/organizations/:id/stats` - Get statistics

**Invoices (Protected):**
- `GET /api/invoices` - List invoices (filtered by org)
- `POST /api/invoices` - Create invoice (master_admin only)
- `PUT /api/invoices/:id/status` - Update status (master_admin only)
- `GET /api/invoices/analytics` - Billing analytics (master_admin only)

## Important Implementation Details

### Creating New Protected Routes

When adding new routes that need organization-scoped data:

1. **Apply middleware in correct order:**
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
│   ├── app.ts                    # Express app + middleware setup
│   ├── index.ts                  # Server entry point
│   ├── config/
│   │   ├── database.ts          # Prisma client singleton
│   │   └── constants.ts         # Pricing tiers, limits, enums
│   ├── middleware/
│   │   ├── auth.ts              # authenticate + authorize
│   │   └── organizationContext.ts  # Multi-tenant data isolation
│   ├── controllers/             # HTTP request handlers
│   ├── services/                # Business logic
│   ├── routes/                  # Route definitions
│   ├── types/                   # TypeScript type definitions
│   └── utils/
│       ├── jwt.ts               # Token generation/verification
│       ├── password.ts          # Password hashing
│       └── validators.ts        # Zod schemas
├── prisma/
│   └── schema.prisma            # Database schema
└── create-*.ts                  # User creation scripts
```

### Frontend Structure
```
src/
├── App.tsx                      # Routes + Protected routes
├── main.tsx                     # App entry point
├── contexts/
│   ├── AuthContext.tsx          # Authentication (real API)
│   ├── OrganizationContext.tsx  # Organization data
│   └── BillingContext.tsx       # Billing/invoices
├── components/
│   ├── auth/                    # Login/signup components
│   ├── layout/                  # DashboardLayout
│   └── ui/                      # shadcn/ui components
├── pages/                       # Route page components
└── types/                       # TypeScript types
```

## Known Issues & Gotchas

1. **AuthContext changed from mock to real API:** The frontend now calls `http://localhost:5000/api/auth/login`. Ensure backend is running.

2. **Some routes are commented out in backend/src/app.ts:** Profile, payouts, dsa-invoices, and chatbot routes are disabled pending service implementation.

3. **organizationId filtering is manual:** Services must manually check `userRole !== 'master_admin'` before applying organizationId filters. This is intentional for flexibility.

4. **JWT tokens in localStorage:** Tokens persist across sessions. Clear localStorage to force re-login during development.

5. **Prisma Client must be regenerated:** After any schema.prisma changes, run `npx prisma generate` or the backend will fail with "Unknown model" errors.

6. **Master admin has no organization:** The master_admin role is special - it has `organizationId = NULL` and bypasses all organization filtering.

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
