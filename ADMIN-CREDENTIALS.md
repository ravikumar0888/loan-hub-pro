# Admin User Credentials

## SuperAdmin Account (Highest Level)

The SuperAdmin account has full access to all features including bank/DSA management.

### Login Credentials

```
Email:    superadmin@loanms.com
Password: Admin@123
```

### User Details

- **Name:** Super Admin
- **Mobile:** 9999999999
- **Role:** SuperAdmin
- **Status:** Active

---

## Default Admin Account

A default admin user has been created for the LoanMS application.

### Login Credentials

```
Email:    admin@loanms.com
Password: admin@123
```

### User Details

- **Name:** Admin User
- **Mobile:** 9999999999
- **Role:** Admin
- **Status:** Active

## Security Notes

⚠️ **IMPORTANT:** For production use, please change the default admin password immediately after first login.

## Creating Additional Admin Users

If you need to create another admin user, you can run:

```bash
cd backend
npm run create:admin
```

This will create a new admin account with the same default credentials.

## Changing Password

To change the admin password, you can either:

1. **Via Script (Recommended):**
   ```bash
   cd backend
   npm run update:admin-password
   ```
   This will update the password to "admin@123"

2. **Via API:** Use the password reset functionality

3. **Via Prisma Studio:**
   ```bash
   cd backend
   npm run prisma:studio
   ```
   Navigate to the `users` table and update the `passwordHash` field

## First Login Steps

1. Navigate to http://localhost:8080/login
2. Enter the credentials above
3. You will have full admin access to:
   - Dashboard (all data)
   - Customers (all customers)
   - Banks & NBFC management
   - Users management (all users)
   - Corporate DSA management
   - Reports (all data)

## Admin Capabilities

As an Admin user, you can:
- ✅ View all data across the system
- ✅ Create, edit, and delete customers
- ✅ Manage all users (Admin, SubAdmin, BackOffice, Connector)
- ✅ Manage banks and NBFCs
- ✅ Manage Corporate DSAs
- ✅ View and export all reports
- ✅ No data filtering or restrictions

This is different from SubAdmin and BackOffice users who only see data they own (Lead Owner).
