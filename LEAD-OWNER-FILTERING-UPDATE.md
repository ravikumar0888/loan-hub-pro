# Lead Owner Filtering & Updates - Implementation Summary

## Changes Implemented

### 1. PDF Header Update ✓
**File:** [backend/src/utils/pdfGenerator.ts](backend/src/utils/pdfGenerator.ts:78)

Changed PDF header from:
- ~~"LOAN APPLICATION"~~
- ~~"Rudvir Financial Services"~~

To:
- **"APPLICATION FORM"** (centered, single line)

### 2. Personal Email Field Added ✓
**Files Modified:**
- [src/components/customer/CustomerFormDialog.tsx](src/components/customer/CustomerFormDialog.tsx:388-391)
- [src/types/index.ts](src/types/index.ts:58)

**Implementation:**
- Added "Personal Email" field in Personal Details section
- Positioned after "Mobile Number" field
- Works in Add, Edit, and View modes
- Field is optional (not required)
- Placeholder: "personal@example.com"

**Database:** Field already exists in schema as `personal_email`

### 3. Lead Owner Filtering Implemented ✓

Implemented role-based filtering where **SubAdmins and BackOffice users** only see data for customers where they are the **Lead Owner**.

## Filtering Rules by Role

### Admin
- **Access:** All data across the system
- **No filtering applied**

### Connector
- **Customers:** Only customers where `connectorId = userId`
- **Dashboard:** Stats for their connected customers
- **Reports:** Reports for their connected customers
- **Users:** No restrictions

### SubAdmin & BackOffice
- **Customers:** Only customers where `leadOwner = userId`
- **Dashboard:** Stats for customers where they are lead owner
- **Reports:** Reports for customers where they are lead owner
- **Users:** Only connectors from customers where they are lead owner

## Files Modified for Lead Owner Filtering

### Backend Services

1. **[backend/src/services/customers.service.ts](backend/src/services/customers.service.ts)**
   - Lines 15-24: Updated `getCustomers()` filtering logic
   - Lines 192-200: Updated `getCustomerById()` access control
   - SubAdmins/BackOffice filtered by `leadOwner = userId`

2. **[backend/src/services/dashboard.service.ts](backend/src/services/dashboard.service.ts)**
   - Lines 9-13: Updated `getKPIs()` filtering
   - Lines 59-63: Updated `getTrendData()` filtering
   - Lines 109-113: Updated `getRecentCustomers()` filtering
   - All methods now filter by `leadOwner` for SubAdmins/BackOffice

3. **[backend/src/services/reports.service.ts](backend/src/services/reports.service.ts)**
   - Lines 10-16: Updated `generateReport()` filtering
   - Lines 145-149: Updated `getReportSummary()` filtering
   - Changed from `createdBy` to `leadOwner` filtering

4. **[backend/src/services/users.service.ts](backend/src/services/users.service.ts)**
   - Lines 14-31: Updated `getUsers()` filtering
   - SubAdmins/BackOffice now see only connectors from customers they own
   - Dynamic filtering based on customer relationships

## How It Works

### Example Scenario

**User:** John (SubAdmin, userId: "abc123")

**Customers in Database:**
| Customer | Lead Owner | Connector | Visible to John? |
|----------|-----------|-----------|------------------|
| Customer A | abc123 | conn1 | ✓ Yes |
| Customer B | abc123 | conn2 | ✓ Yes |
| Customer C | xyz789 | conn1 | ✗ No |
| Customer D | (none) | conn1 | ✗ No |

**Dashboard Stats:** Only counts Customer A and Customer B

**Users Page:** Shows connectors `conn1` and `conn2` (unique connectors from owned customers)

**Reports:** Only includes Customer A and Customer B data

## Testing Checklist

### Personal Email Field
- [ ] Create new customer with Personal Email filled
- [ ] Edit customer and update Personal Email
- [ ] View customer and verify Personal Email displays
- [ ] Leave Personal Email empty (optional field)

### PDF Header
- [ ] Create a customer
- [ ] Download PDF
- [ ] Verify header shows "APPLICATION FORM" only

### Lead Owner Filtering

#### As SubAdmin/BackOffice User:
- [ ] Login as SubAdmin or BackOffice user
- [ ] Dashboard: Verify KPIs show only your owned customers
- [ ] Customers: Verify table shows only customers where you are lead owner
- [ ] Customers: Try to view customer you don't own (should fail)
- [ ] Users: Verify only connectors from your owned customers appear
- [ ] Reports: Verify reports show only your owned customers

#### As Admin:
- [ ] Login as Admin
- [ ] Verify all data is visible (no filtering)

#### As Connector:
- [ ] Login as Connector
- [ ] Verify you see only customers where you are the connector

## Important Notes

1. **Database Migration:** The migration MUST be run for Personal Email and other fields to work. See [backend/QUICK-FIX-GUIDE.md](backend/QUICK-FIX-GUIDE.md)

2. **Lead Owner Assignment:** Make sure customers have `leadOwner` assigned for SubAdmin/BackOffice users to see them.

3. **Existing Data:** Customers without a `leadOwner` will only be visible to Admins and their assigned Connectors.

4. **Performance:** The Users page for SubAdmins/BackOffice now runs an additional query to find connectors. This is minimal overhead.

## Behavior Changes

### Before Update:
- SubAdmins saw customers where they were the **connector**
- BackOffice saw customers they **created**
- All users saw all users

### After Update:
- SubAdmins see customers where they are the **lead owner**
- BackOffice see customers where they are the **lead owner**
- SubAdmins/BackOffice see only relevant connectors (from owned customers)

## API Impact

No breaking changes to API endpoints. All filtering is applied server-side in the services layer.

## Database Schema

No schema changes required for Lead Owner filtering - the `leadOwner` field already exists with foreign key constraint to `users` table.

The `personalEmail` field already exists in the schema as `personal_email` VARCHAR(255).

## Rollback Instructions

If you need to revert the Lead Owner filtering:

1. **Customers Service:** Change lines 18-23 back to:
```typescript
} else if (userRole === 'subadmin') {
  where.connectorId = userId;
} else if (userRole === 'backoffice') {
  where.createdBy = userId;
}
```

2. **Dashboard Service:** Remove `leadOwner` filtering (lines 11-13, 61-63, 111-113)

3. **Reports Service:** Restore `createdBy` filtering for BackOffice

4. **Users Service:** Remove the dynamic connector filtering (lines 14-31)
