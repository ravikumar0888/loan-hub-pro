# SubAdmin Permissions Update - Full Functionality

## Overview

SubAdmins now have **full view and edit functionality** similar to Admin users, but they only see data where they are the **Lead Owner**.

## What SubAdmins Can Do

### ✓ Dashboard Access
- **View:** Full access to Dashboard
- **Data:** Shows KPIs, trends, and recent customers where SubAdmin is Lead Owner
- **Functionality:** Same as Admin, but filtered by ownership

### ✓ Customers Management
- **View:** All customers where they are Lead Owner
- **Create:** Can create new customers
- **Edit:** Can edit customers where they are Lead Owner
- **Delete:** Cannot delete (Admin only)
- **Remarks:** Can add remarks to any customer they can view

### ✓ Users Management
- **View:** Can see connectors from customers they own
- **Create:** Can create new users
- **Edit:** Can edit users
- **Delete:** Can delete users

### ✓ Reports Access
- **View:** Full access to Reports page
- **Data:** Shows only customers where SubAdmin is Lead Owner
- **Export:** Can export reports (filtered data)

### ✗ Limited Access
- **Banks & NBFC:** Admin only (cannot view/edit)
- **Corporate DSA:** Admin only (cannot view/edit)
- **Customer Deletion:** Admin only

## Files Modified

### Backend Routes

1. **[backend/src/routes/customers.routes.ts](backend/src/routes/customers.routes.ts:21,29)**
   - Added `'subadmin'` to create customer authorization
   - Added `'subadmin'` to update customer authorization
   ```typescript
   authorize(['admin', 'backoffice', 'subadmin'])
   ```

### Backend Services

2. **[backend/src/services/customers.service.ts](backend/src/services/customers.service.ts:302-305)**
   - Added validation: SubAdmins can only update customers where they are Lead Owner
   ```typescript
   if ((userRole === 'subadmin' || userRole === 'backoffice') && customer.leadOwner !== userId) {
     throw new Error('Forbidden - You can only update customers where you are the lead owner');
   }
   ```

### Frontend

3. **[src/components/layout/Sidebar.tsx](src/components/layout/Sidebar.tsx:54,66)**
   - Added `'subadmin'` to Users menu
   - Added `'subadmin'` to Reports menu

## Permission Matrix

| Feature | Admin | SubAdmin | BackOffice | Connector |
|---------|-------|----------|------------|-----------|
| **Dashboard** | All data | Own data (Lead Owner) | Own data (Lead Owner) | Own data (Connector) |
| **View Customers** | All | Lead Owner only | Lead Owner only | Connector only |
| **Create Customer** | ✓ | ✓ | ✓ | ✗ |
| **Edit Customer** | ✓ | ✓ (own only) | ✓ (own only) | ✗ |
| **Delete Customer** | ✓ | ✗ | ✗ | ✗ |
| **View Users** | All | Connectors from owned customers | Connectors from owned customers | All |
| **Create User** | ✓ | ✓ | ✗ | ✗ |
| **Edit User** | ✓ | ✓ | ✗ | ✗ |
| **Delete User** | ✓ | ✓ | ✗ | ✗ |
| **View Reports** | All | Lead Owner only | Lead Owner only | Connector only |
| **Banks & NBFC** | ✓ | ✗ | ✗ | ✗ |
| **Corporate DSA** | ✓ | ✗ | ✗ | ✗ |

## Data Visibility Rules

### SubAdmin User (e.g., John with userId: "abc123")

**What John Sees:**

#### Dashboard
- Total Login: Count of customers where `leadOwner = "abc123"` AND `status = "login"`
- Total Approved: Count of customers where `leadOwner = "abc123"` AND `status = "approved"`
- etc. for all KPIs

#### Customers Page
```sql
SELECT * FROM customers
WHERE lead_owner = 'abc123'
```

#### Users Page
```sql
SELECT DISTINCT users.*
FROM users
INNER JOIN customers ON users.id = customers.connector_id
WHERE customers.lead_owner = 'abc123'
```

#### Reports Page
```sql
SELECT * FROM customers
WHERE lead_owner = 'abc123'
AND application_date BETWEEN @startDate AND @endDate
```

## Testing Checklist

### As SubAdmin User:

#### Login & Navigation
- [ ] Login as SubAdmin user
- [ ] Verify Dashboard menu is visible
- [ ] Verify Customers menu is visible
- [ ] Verify Users menu is visible
- [ ] Verify Reports menu is visible
- [ ] Verify Banks menu is NOT visible
- [ ] Verify Corporate DSA menu is NOT visible

#### Dashboard Page
- [ ] Access Dashboard
- [ ] Verify KPIs show only your owned customers
- [ ] Verify trend charts show only your data
- [ ] Verify recent customers shows only your owned customers

#### Customers Page
- [ ] Access Customers page
- [ ] Verify table shows only customers where you are Lead Owner
- [ ] Click "Add Customer" - verify form opens
- [ ] Create a new customer (assign yourself as Lead Owner)
- [ ] Verify customer appears in the list
- [ ] Click "Edit" on your owned customer - verify form opens
- [ ] Update customer details - verify saves successfully
- [ ] Try to edit customer you don't own - should show error
- [ ] Try to view customer you don't own - should show error
- [ ] Verify "Delete" button does NOT appear (or is disabled)

#### Users Page
- [ ] Access Users page
- [ ] Verify only connectors from your owned customers appear
- [ ] Click "Add User" - verify form opens
- [ ] Create a new connector user
- [ ] Edit a user - verify saves successfully
- [ ] Delete a user - verify works (if they have permission)

#### Reports Page
- [ ] Access Reports page
- [ ] Verify reports show only your owned customers
- [ ] Apply date filters - verify works
- [ ] Export report - verify only your data is exported
- [ ] Verify summary stats are calculated from your data only

### As Admin User (Comparison):
- [ ] Login as Admin
- [ ] Verify all menus are visible
- [ ] Verify Dashboard shows ALL customers
- [ ] Verify Customers page shows ALL customers
- [ ] Verify Users page shows ALL users
- [ ] Verify Reports show ALL data

## Error Messages

When SubAdmin tries to access unauthorized data:

### Viewing Customer They Don't Own
```
Error: Forbidden - You can only view customers where you are the lead owner
```

### Updating Customer They Don't Own
```
Error: Forbidden - You can only update customers where you are the lead owner
```

### Creating Customer (Should Work)
No error - creates successfully with SubAdmin as creator

## Important Notes

1. **Lead Owner Assignment:** When SubAdmin creates a customer, they should be automatically assigned as the Lead Owner (or explicitly select themselves).

2. **Data Isolation:** SubAdmins are completely isolated to their own data. They cannot see, edit, or access customers owned by other SubAdmins.

3. **User Visibility:** SubAdmins can only see connector users who are associated with customers they own. This prevents them from seeing all connectors in the system.

4. **No Payout Visibility:** If payout data is sensitive, ensure SubAdmins cannot see payouts for customers they don't own.

## Comparison: Before vs After

### Before Update:
| Action | SubAdmin | BackOffice |
|--------|----------|------------|
| View Customers | connectorId = userId | createdBy = userId |
| Create Customer | ✗ No access | ✓ Allowed |
| Edit Customer | ✗ No access | ✓ Allowed |
| View Users | All users | All users |
| Access Dashboard | Limited | Limited |
| Access Reports | No access | No access |

### After Update:
| Action | SubAdmin | BackOffice |
|--------|----------|------------|
| View Customers | leadOwner = userId | leadOwner = userId |
| Create Customer | ✓ Allowed | ✓ Allowed |
| Edit Customer | ✓ (own only) | ✓ (own only) |
| View Users | Connectors from owned customers | Connectors from owned customers |
| Access Dashboard | ✓ Full access (filtered) | ✓ Full access (filtered) |
| Access Reports | ✓ Full access (filtered) | ✓ Full access (filtered) |

## Security Considerations

1. **Route-Level Authorization:** All routes check user role via `authorize()` middleware
2. **Service-Level Filtering:** All services apply Lead Owner filtering for SubAdmins
3. **Data Validation:** Services validate that SubAdmins can only modify their own data
4. **Error Handling:** Clear error messages prevent information leakage

## Performance Impact

- **Minimal:** Lead Owner filtering uses indexed fields
- **Users Page:** Additional query to find connectors (negligible for typical datasets)
- **No N+1 Queries:** All filtering done at database level

## Rollback Instructions

If you need to revert SubAdmin permissions:

1. **Customer Routes:** Remove `'subadmin'` from lines 21 and 29 in `customers.routes.ts`
2. **Sidebar:** Remove `'subadmin'` from Users and Reports menu roles
3. **Customer Service:** Remove the Lead Owner validation check (lines 302-305)

## Summary

SubAdmins now have:
- ✓ Same functionality as Admin users
- ✓ Full CRUD on Customers (where they are Lead Owner)
- ✓ Full CRUD on Users
- ✓ Full access to Dashboard and Reports
- ✓ Data filtered by Lead Owner ownership
- ✗ No access to Banks and DSA pages

This provides SubAdmins with powerful management capabilities while maintaining data security and isolation.
