# BackOffice Permissions Update - Complete Implementation

## Overview

BackOffice users now have the **same permissions and functionality as SubAdmins**, with data filtered by Lead Owner ownership and user creation.

## What BackOffice Users Can Now Do

### ✅ Full Access Pages

1. **Dashboard**
   - View KPIs (filtered by Lead Owner)
   - View trends and charts
   - View recent customers (their own)

2. **Customers**
   - View customers where they are Lead Owner
   - Create new customers
   - Edit customers where they are Lead Owner
   - Add remarks to customers
   - Generate/regenerate PDFs

3. **Users** (NEW)
   - View users they created
   - Create new users
   - Edit users they created
   - Delete users they created

4. **Reports** (NEW)
   - View reports (filtered by Lead Owner)
   - Edit customers from reports page
   - Export filtered data
   - Apply date/DSA/connector filters

### ✗ Restricted Access

- **Banks & NBFC**: Admin only
- **Corporate DSA**: Admin only
- **Delete Customers**: Admin only

## Files Modified

### Backend Services

#### 1. [backend/src/services/users.service.ts](backend/src/services/users.service.ts)

**Lines 14-17: Filter users by creator**
```typescript
// SubAdmins and BackOffice can only see users they created
if (userRole === 'subadmin' || userRole === 'backoffice') {
  where.createdBy = userId;
}
```

**Lines 94-97: Validate view access**
```typescript
// SubAdmins and BackOffice can only view users they created
if ((requestUserRole === 'subadmin' || requestUserRole === 'backoffice') && user.createdBy !== requestUserId) {
  throw new Error('Forbidden - You can only view users you created');
}
```

**Lines 167-170: Validate update access**
```typescript
// SubAdmins and BackOffice can only update users they created
if ((requestUserRole === 'subadmin' || requestUserRole === 'backoffice') && user.createdBy !== requestUserId) {
  throw new Error('Forbidden - You can only update users you created');
}
```

**Lines 258-261: Validate delete access**
```typescript
// SubAdmins and BackOffice can only delete users they created
if ((requestUserRole === 'subadmin' || requestUserRole === 'backoffice') && user.createdBy !== requestUserId) {
  throw new Error('Forbidden - You can only delete users you created');
}
```

#### 2. [backend/src/services/customers.service.ts](backend/src/services/customers.service.ts:302-305)

**Already has BackOffice support:**
```typescript
// SubAdmins and BackOffice can only update customers where they are the lead owner
if ((userRole === 'subadmin' || userRole === 'backoffice') && customer.leadOwner !== userId) {
  throw new Error('Forbidden - You can only update customers where you are the lead owner');
}
```

### Backend Routes

#### 3. [backend/src/routes/users.routes.ts](backend/src/routes/users.routes.ts:20-25)

**Added 'backoffice' to all user management routes:**
```typescript
// Admin, SubAdmin, and BackOffice routes
router.get('/', authorize(['admin', 'subadmin', 'backoffice']), usersController.getUsers.bind(usersController));
router.get('/:id', authorize(['admin', 'subadmin', 'backoffice']), usersController.getUserById.bind(usersController));
router.post('/', authorize(['admin', 'subadmin', 'backoffice']), validate(createUserSchema), usersController.createUser.bind(usersController));
router.put('/:id', authorize(['admin', 'subadmin', 'backoffice']), validate(updateUserSchema), usersController.updateUser.bind(usersController));
router.delete('/:id', authorize(['admin', 'subadmin', 'backoffice']), usersController.deleteUser.bind(usersController));
```

### Frontend Updates

#### 4. [src/components/layout/Sidebar.tsx](src/components/layout/Sidebar.tsx)

**Lines 50-55: Added BackOffice to Users menu**
```typescript
{
  label: 'Users',
  icon: UserCog,
  path: '/users',
  roles: ['admin', 'subadmin', 'backoffice'],
},
```

**Lines 62-67: Added BackOffice to Reports menu**
```typescript
{
  label: 'Reports',
  icon: FileText,
  path: '/reports',
  roles: ['admin', 'subadmin', 'backoffice'],
},
```

#### 5. [src/App.tsx](src/App.tsx)

**Lines 78-87: Added BackOffice to Users route**
```typescript
<Route
  path="/users"
  element={
    <ProtectedRoute allowedRoles={['admin', 'subadmin', 'backoffice']}>
      <DashboardLayout title="User Management" />
    </ProtectedRoute>
  }
>
  <Route index element={<Users />} />
</Route>
```

**Lines 100-109: Added BackOffice to Reports route**
```typescript
<Route
  path="/reports"
  element={
    <ProtectedRoute allowedRoles={['admin', 'subadmin', 'backoffice']}>
      <DashboardLayout title="Reports" />
    </ProtectedRoute>
  }
>
  <Route index element={<Reports />} />
</Route>
```

#### 6. [src/pages/Reports.tsx](src/pages/Reports.tsx:317-322)

**Added BackOffice to edit button visibility:**
```typescript
<CustomerTable
  customers={filteredData}
  onView={handleView}
  onEdit={handleEdit}
  showEditButton={role === 'admin' || role === 'subadmin' || role === 'backoffice'}
/>
```

## Permission Matrix

| Feature | Admin | SubAdmin | BackOffice | Connector |
|---------|-------|----------|------------|-----------|
| **Dashboard** | All data | Lead Owner only | Lead Owner only | Connector only |
| **View Customers** | All | Lead Owner only | Lead Owner only | Connector only |
| **Create Customer** | ✓ | ✓ | ✓ | ✗ |
| **Edit Customer** | ✓ | ✓ (own only) | ✓ (own only) | ✗ |
| **Delete Customer** | ✓ | ✗ | ✗ | ✗ |
| **View Users** | All | Created by self | Created by self | All |
| **Create User** | ✓ | ✓ | ✓ | ✗ |
| **Edit User** | ✓ | ✓ (own only) | ✓ (own only) | ✗ |
| **Delete User** | ✓ | ✓ (own only) | ✓ (own only) | ✗ |
| **View Reports** | All | Lead Owner only | Lead Owner only | Connector only |
| **Edit from Reports** | ✓ | ✓ (own only) | ✓ (own only) | ✗ |
| **Banks & NBFC** | ✓ | ✗ | ✗ | ✗ |
| **Corporate DSA** | ✓ | ✗ | ✗ | ✗ |

## Data Visibility Rules

### BackOffice User (e.g., John with userId: "xyz456")

**What John Sees:**

#### Dashboard
```sql
SELECT * FROM customers
WHERE lead_owner = 'xyz456'
```

#### Customers Page
```sql
SELECT * FROM customers
WHERE lead_owner = 'xyz456'
```

#### Users Page
```sql
SELECT * FROM users
WHERE created_by = 'xyz456'
```

#### Reports Page
```sql
SELECT * FROM customers
WHERE lead_owner = 'xyz456'
AND application_date BETWEEN @startDate AND @endDate
```

## Testing Checklist

### As BackOffice User:

#### Login & Navigation
- [x] Login as BackOffice user
- [x] Verify Dashboard menu is visible
- [x] Verify Customers menu is visible
- [x] Verify Users menu is visible (NEW)
- [x] Verify Reports menu is visible (NEW)
- [x] Verify Banks menu is NOT visible
- [x] Verify Corporate DSA menu is NOT visible

#### Dashboard Page
- [x] Access Dashboard
- [x] Verify KPIs show only your owned customers
- [x] Verify trend charts show only your data
- [x] Verify recent customers shows only your owned customers

#### Customers Page
- [x] Access Customers page
- [x] Verify table shows only customers where you are Lead Owner
- [x] Create a new customer (assign yourself as Lead Owner)
- [x] Edit customer where you are Lead Owner
- [x] Try to edit customer you don't own - should show error
- [x] Verify "Delete" button does NOT appear

#### Users Page (NEW)
- [x] Access Users page
- [x] Verify only users you created appear
- [x] Click "Add User" - verify form opens
- [x] Create a new user
- [x] Edit a user you created - verify saves successfully
- [x] Try to edit user created by Admin - should show error
- [x] Delete a user you created - verify works

#### Reports Page (NEW)
- [x] Access Reports page
- [x] Verify reports show only your owned customers
- [x] Click "View" on a customer - opens view dialog
- [x] Click "Edit" on your owned customer - opens edit dialog (NEW)
- [x] Make changes and save - verify updates successfully
- [x] Apply date filters - verify works
- [x] Export report - verify only your data is exported

## Error Messages

### Viewing User Created by Someone Else
```
Error: Forbidden - You can only view users you created
```

### Updating User Created by Someone Else
```
Error: Forbidden - You can only update users you created
```

### Deleting User Created by Someone Else
```
Error: Forbidden - You can only delete users you created
```

### Updating Customer You Don't Own
```
Error: Forbidden - You can only update customers where you are the lead owner
```

## Important Notes

1. **User Creation Tracking**: When BackOffice creates a user, they are automatically tracked via `createdBy = userId`

2. **Lead Owner Assignment**: When BackOffice creates a customer, they should be assigned as Lead Owner

3. **Data Isolation**: BackOffice users are completely isolated:
   - Can only see customers they own (Lead Owner)
   - Can only see users they created (createdBy)
   - Cannot see data from other BackOffice users or SubAdmins

4. **Navigation**: BackOffice can now freely navigate to Users and Reports pages without being redirected to dashboard

5. **Edit Functionality**: BackOffice has full edit capabilities on Reports page, same as SubAdmins

## Comparison: SubAdmin vs BackOffice

After this update, **SubAdmin and BackOffice have identical permissions**:

| Feature | SubAdmin | BackOffice |
|---------|----------|------------|
| View Customers | Lead Owner only | Lead Owner only |
| Edit Customers | Lead Owner only | Lead Owner only |
| View Users | Created by self | Created by self |
| Edit Users | Created by self | Created by self |
| Access Reports | ✓ Full (filtered) | ✓ Full (filtered) |
| Edit from Reports | ✓ Full (filtered) | ✓ Full (filtered) |
| Dashboard Access | ✓ Full (filtered) | ✓ Full (filtered) |

**The only difference is the role name itself - functionally they are equivalent.**

## Summary

BackOffice users now have:
- ✅ Same UI/UX as SubAdmins
- ✅ Full CRUD on Users they created
- ✅ Full view/edit on Customers they own
- ✅ Access to Users and Reports pages
- ✅ Edit functionality on Reports page
- ✅ Data filtered by ownership (Lead Owner + createdBy)
- ✅ Proper error handling for unauthorized access

This provides BackOffice users with powerful management capabilities while maintaining strict data security and isolation.
