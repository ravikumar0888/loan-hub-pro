# Current Login Credentials

## SuperAdmin (Highest Privileges)
```
Email:    superadmin@loanms.com
Password: Admin@123
```
⚠️ **Note:** Password is case-sensitive - capital 'A'

---

## Admin Users

### Pravin Oja
```
Email:    pravin@gmail.com
Password: admin@123
```

### Avinash Murai
```
Email:    avinash@gmail.com
Password: [Custom - please reset if forgotten]
```

---

### Admin User (Default)
```
Email:    admin@loanms.com
Password: admin@123
```
✅ **Status:** Active and ready to use

---

## Troubleshooting Login Issues

If you're getting "Invalid credentials" error:

1. **Check Password Case-Sensitivity**
   - SuperAdmin password: `Admin@123` (capital A)
   - Other passwords: `admin@123` (lowercase a)

2. **Verify Email Address**
   - Make sure there are no extra spaces
   - Email is case-insensitive but should be exact

3. **Check Account Status**
   - Account must be active (isActive: true)
   - All accounts listed above are currently active

4. **Reset Password if Needed**
   ```bash
   cd backend
   npx ts-node create-superadmin.ts
   ```
   This will reset SuperAdmin password to `Admin@123`

---

## Creating New Admin Accounts

To create a new admin account:

1. Use the frontend Users page (login as SuperAdmin)
2. Or run: `cd backend && npm run create:admin`

---

**Last Verified:** 2026-01-05
