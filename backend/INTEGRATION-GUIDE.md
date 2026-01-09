# Backend Integration Guide

## ✅ What's Been Completed

All core multi-tenancy infrastructure has been created:

- ✅ Database schema with Organization and Invoice models
- ✅ Database migration ready to apply
- ✅ TypeScript types (`backend/src/types/index.ts`)
- ✅ Organization context middleware (`backend/src/middleware/organizationContext.ts`)
- ✅ Organizations service (`backend/src/services/organizations.service.ts`)
- ✅ Invoices service (`backend/src/services/invoices.service.ts`)
- ✅ Organizations controller (`backend/src/controllers/organizations.controller.ts`)
- ✅ Invoices controller (`backend/src/controllers/invoices.controller.ts`)
- ✅ Signup controller (`backend/src/controllers/signup.controller.ts`)
- ✅ Route files (organizations, invoices, signup)
- ✅ Validators (`backend/src/utils/validators.ts`)
- ✅ Master admin script (`backend/create-master-admin.ts`)

##  Integration Steps

### Step 1: Apply Database Migration

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

This will:
- Add Organization and Invoice tables
- Add organizationId to existing tables
- Create default organization
- Migrate all existing data

### Step 2: Create Master Admin

```bash
cd backend
npx ts-node create-master-admin.ts
```

This creates the platform admin account:
- Email: master@loanms.com
- Password: MasterAdmin@123
- Role: master_admin
- No organization assignment (can access all orgs)

### Step 3: Register New Routes in Main App

**Find your main Express app file** (likely `backend/src/app.ts`, `backend/src/index.ts`, or `backend/src/server.ts`)

**Add these imports at the top:**
```typescript
import organizationsRoutes from './routes/organizations.routes';
import invoicesRoutes from './routes/invoices.routes';
import signupRoutes from './routes/signup.routes';
```

**Register the routes:**
```typescript
// Public routes (no authentication)
app.use('/api/signup', signupRoutes);

// Protected routes (require authentication + organization context)
app.use('/api/organizations', organizationsRoutes);
app.use('/api/invoices', invoicesRoutes);
```

### Step 4: Update Existing Routes

Add organization context middleware to all existing protected routes.

**Example for customers route:**
```typescript
import { authenticate } from '../middleware/auth';
import { organizationContext } from '../middleware/organizationContext';

router.use(authenticate);
router.use(organizationContext); // Add this line

// ... rest of your routes
```

**Apply to these route files:**
- `backend/src/routes/customers.routes.ts`
- `backend/src/routes/users.routes.ts`
- `backend/src/routes/banks.routes.ts`
- `backend/src/routes/dsas.routes.ts`
- `backend/src/routes/dashboard.routes.ts`
- Any other routes that handle user data

### Step 5: Update Authorize Middleware

**Find**: `backend/src/middleware/authorize.ts` or `backend/src/middleware/auth.ts`

**Update to support master_admin:**
```typescript
export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Add master_admin check
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};
```

### Step 6: Update Existing Services

Add organization filtering to all service methods that query user data.

**Pattern to follow:**

```typescript
// Before
async getCustomers(query: any, userId: string, userRole: string) {
  const where: any = {};
  // ... existing filters
}

// After
async getCustomers(query: any, userId: string, userRole: string, organizationId: string | null) {
  const where: any = {};

  // Multi-tenant filtering
  if (userRole !== 'master_admin' && organizationId) {
    where.organizationId = organizationId;
  }

  // ... existing filters
}
```

**Services to update:**
1. `backend/src/services/customers.service.ts`
2. `backend/src/services/users.service.ts`
3. `backend/src/services/banks.service.ts`
4. `backend/src/services/dsas.service.ts`
5. `backend/src/services/dashboard.service.ts`
6. `backend/src/services/reports.service.ts`

**For each service:**
- Add `organizationId: string | null` parameter
- Add the organization filtering logic
- Pass `organizationId` when creating new records

### Step 7: Update Existing Controllers

Update controller methods to pass organizationId to services.

**Example:**
```typescript
// Before
async getCustomers(req: AuthRequest, res: Response, next: NextFunction) {
  const result = await customersService.getCustomers(
    req.query,
    req.user?.userId,
    req.user?.role
  );
}

// After
async getCustomers(req: AuthRequest, res: Response, next: NextFunction) {
  const result = await customersService.getCustomers(
    req.query,
    req.user?.userId,
    req.user?.role,
    req.organizationId  // Add this
  );
}
```

**Controllers to update:**
- `backend/src/controllers/customers.controller.ts`
- `backend/src/controllers/users.controller.ts`
- `backend/src/controllers/banks.controller.ts`
- `backend/src/controllers/dsas.controller.ts`
- `backend/src/controllers/dashboard.controller.ts`

## Testing the Implementation

### 1. Test Master Admin Login

```bash
# POST /api/auth/login
{
  "email": "master@loanms.com",
  "password": "MasterAdmin@123"
}
```

Should return JWT token with role: `master_admin`

### 2. Test Self-Service Signup

```bash
# POST /api/signup
{
  "name": "Test Company",
  "email": "contact@testco.com",
  "phone": "9876543210",
  "pricingTier": "professional",
  "seats": 10,
  "adminFirstName": "John",
  "adminLastName": "Doe",
  "adminEmail": "john@testco.com",
  "adminMobile": "9876543211",
  "adminPassword": "Test@123"
}
```

Should return:
- Organization object
- Superadmin user
- JWT token
- 14-day trial started message

### 3. Test Organization Isolation

1. Create second organization via signup
2. Login as superadmin of org 1
3. Try to access customers - should only see org 1 customers
4. Login as superadmin of org 2
5. Try to access customers - should only see org 2 customers
6. Login as master admin
7. Should see all customers from all organizations

### 4. Test Invoice Generation

As master_admin:
```bash
# POST /api/invoices
{
  "organizationId": "<org-id>",
  "billingPeriodStart": "2026-01-01",
  "billingPeriodEnd": "2026-01-31"
}
```

Should generate invoice with auto-generated number: `INV-2026-001`

## Frontend Integration

Update frontend to use real APIs instead of localStorage:

### 1. Replace OrganizationContext

```typescript
// Remove mock localStorage data
// Add real API calls to /api/organizations
```

### 2. Replace BillingContext

```typescript
// Remove mock localStorage data
// Add real API calls to /api/invoices
```

### 3. Update Signup Page

```typescript
// Update form submission to POST /api/signup
// Store returned JWT token
// Redirect to dashboard
```

### 4. Update Master Admin Dashboard

```typescript
// Fetch organizations from /api/organizations
// Fetch billing analytics from /api/invoices/analytics
// Wire up organization CRUD operations
```

## API Endpoints Summary

### Public Endpoints
- `POST /api/signup` - Self-service organization signup

### Organizations (Protected)
- `GET /api/organizations` - List organizations (master_admin sees all)
- `GET /api/organizations/:id` - Get single organization
- `POST /api/organizations` - Create organization (master_admin only)
- `PUT /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization (master_admin only)
- `GET /api/organizations/:id/stats` - Get organization stats

### Invoices (Protected)
- `GET /api/invoices` - List invoices
- `GET /api/invoices/:id` - Get single invoice
- `POST /api/invoices` - Create invoice (master_admin only)
- `PUT /api/invoices/:id/status` - Update invoice status (master_admin only)
- `GET /api/invoices/analytics` - Billing analytics (master_admin only)

## Troubleshooting

### Issue: "Unknown role 'master_admin'"

**Solution**: Run the database migration to add the new role enum value:
```bash
npx prisma migrate dev
```

### Issue: "Column organizationId does not exist"

**Solution**: Migration not applied. Run:
```bash
npx prisma migrate dev
npx prisma generate
```

### Issue: Can't login as master admin

**Solution**: Run the setup script:
```bash
npx ts-node create-master-admin.ts
```

### Issue: All users see same data

**Solution**: Ensure `organizationContext` middleware is added to routes:
```typescript
router.use(authenticate);
router.use(organizationContext); // Must be after authenticate
```

### Issue: Services throwing errors about organizationId

**Solution**: Update service method signatures to include `organizationId` parameter

## Next Steps

1. ✅ Apply database migration
2. ✅ Create master admin
3. ⏳ Find and update main app file to register routes
4. ⏳ Update existing routes with organization context
5. ⏳ Update existing services with organization filtering
6. ⏳ Update existing controllers to pass organizationId
7. ⏳ Update authorize middleware for master_admin
8. ⏳ Test the implementation
9. ⏳ Update frontend to use real APIs

## Files Reference

**Created/Updated Files:**
- `backend/prisma/schema.prisma` - Database schema
- `backend/prisma/migrations/20260105000000_add_multi_tenancy/` - Migration
- `backend/src/types/index.ts` - TypeScript types
- `backend/src/middleware/organizationContext.ts` - Multi-tenant middleware
- `backend/src/services/organizations.service.ts` - Organization logic
- `backend/src/services/invoices.service.ts` - Invoice logic
- `backend/src/controllers/organizations.controller.ts` - Organization endpoints
- `backend/src/controllers/invoices.controller.ts` - Invoice endpoints
- `backend/src/controllers/signup.controller.ts` - Signup endpoint
- `backend/src/routes/organizations.routes.ts` - Organization routes
- `backend/src/routes/invoices.routes.ts` - Invoice routes
- `backend/src/routes/signup.routes.ts` - Signup routes
- `backend/src/utils/validators.ts` - Request validation
- `backend/create-master-admin.ts` - Master admin setup script
- `backend/MULTI-TENANCY-IMPLEMENTATION.md` - Implementation details

**Need to Update:**
- Main app file (register new routes)
- `backend/src/middleware/authorize.ts` (support master_admin)
- All existing service files (add organization filtering)
- All existing controller files (pass organizationId)
- All existing route files (add organizationContext middleware)

The heavy lifting is complete. Now it's just wiring everything together!
