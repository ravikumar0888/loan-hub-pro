# API Testing & Troubleshooting Guide

## ✅ System Status

**All API endpoints are working correctly!**

### Test Results (Just Verified):
- ✅ Login endpoint working
- ✅ Authentication working
- ✅ Payout balances endpoint working
- ✅ Payout ledger endpoint working
- ✅ Customers endpoint working
- ✅ Users endpoint working
- ✅ Banks endpoint working

## 🔑 Login Credentials

### Admin Account
```
Email:    admin@loanms.com
Password: admin@123
```

**Password verified:** The password hash in the database is correct and matches `admin@123`

### Other Users in Database
1. **SubAdmin:**
   - Avinash Murai (avinash@gmail.com)
   - Pravin Oza (pravin@gmail.com)

2. **BackOffice:**
   - Nupur Gaikwad (nupur@gmail.com)
   - Swati S (swati@gmail.com)

3. **Connector:**
   - Dhiraj Fokmare (dhiraj@gmail.com)
   - Viransh Murai (viru@gmail.com)

## 🧪 Testing the API

### Method 1: Using curl

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@loanms.com","password":"admin@123"}'

# Expected Response:
# {"success":true,"data":{"token":"...","user":{...}}}
```

### Method 2: Using the Test Script

We've created a comprehensive test script:

```bash
cd backend
npx ts-node test-api.ts
```

This will test all major endpoints and show you the results.

### Method 3: Using Postman/Insomnia

1. **Login Request:**
   - Method: POST
   - URL: `http://localhost:5000/api/auth/login`
   - Headers: `Content-Type: application/json`
   - Body (JSON):
     ```json
     {
       "email": "admin@loanms.com",
       "password": "admin@123"
     }
     ```

2. **Use the token from response for authenticated requests:**
   - Add header: `Authorization: Bearer YOUR_TOKEN_HERE`

## 🐛 Troubleshooting Login Issues

### If you get "Invalid credentials" error:

1. **Check your request format:**
   - Make sure you're sending JSON with `Content-Type: application/json` header
   - Ensure email and password are exact (case-sensitive)
   - Email: `admin@loanms.com` (lowercase)
   - Password: `admin@123` (exactly as shown)

2. **Check the request body:**
   ```json
   {
     "email": "admin@loanms.com",
     "password": "admin@123"
   }
   ```

3. **Common mistakes:**
   - ❌ `admin@loanms.com ` (space at the end)
   - ❌ `Admin@loanms.com` (capital A)
   - ❌ `admin@123 ` (space at the end)
   - ❌ `admin@12` (missing 3)
   - ✅ `admin@loanms.com` (correct)
   - ✅ `admin@123` (correct)

4. **Verify user exists:**
   ```bash
   cd backend
   npx ts-node verify-users.ts
   ```

5. **Reset admin password if needed:**
   ```bash
   cd backend
   npm run create:admin
   ```

## 📊 Payout API Endpoints

All payout endpoints are working and accessible:

### 1. Get All Connector Balances (Admin/SubAdmin)
```
GET /api/payouts/balances
Headers: Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "connector": {
        "id": "...",
        "firstName": "Dhiraj",
        "lastName": "Fokmare",
        "email": "dhiraj@gmail.com"
      },
      "totalEarned": 0,
      "totalAdvance": 0,
      "currentBalance": 0
    }
  ]
}
```

### 2. Get Specific Connector Balance
```
GET /api/payouts/balance/:connectorId
Headers: Authorization: Bearer {token}
```

### 3. Get Monthly Payout
```
GET /api/payouts/monthly?connectorId={id}&month={1-12}&year={2024}
Headers: Authorization: Bearer {token}
```

### 4. Get Ledger Entries
```
GET /api/payouts/ledger?connectorId={id}&month={1-12}&year={2024}
Headers: Authorization: Bearer {token}
```

### 5. Add Ledger Entry (Admin/SubAdmin)
```
POST /api/payouts/ledger
Headers:
  Authorization: Bearer {token}
  Content-Type: application/json

Body:
{
  "connectorId": "connector-uuid",
  "entryType": "credit",
  "amount": 5000,
  "description": "Payout for December 2024",
  "month": 12,
  "year": 2024
}
```

### 6. Delete Ledger Entry (Admin Only)
```
DELETE /api/payouts/ledger/:id
Headers: Authorization: Bearer {token}
```

## 🚀 Quick Verification Checklist

- [x] Database is running (PostgreSQL on localhost:5432)
- [x] Backend server is running (http://localhost:5000)
- [x] Admin user exists in database
- [x] Admin password is correct (admin@123)
- [x] Login endpoint returns valid JWT token
- [x] Payout endpoints are registered and working
- [x] All database migrations applied
- [x] payout_ledger table exists in database

## 📝 Database Verification

Run this to check database status:

```bash
cd backend
npx prisma studio
```

This opens a GUI at http://localhost:5555 where you can:
- View all users
- Check payout_ledger table
- Verify data integrity

## 🔧 If Everything Else Fails

1. **Restart everything:**
   ```bash
   # Stop backend server (Ctrl+C)
   cd backend
   npm run prisma:generate
   npm run dev
   ```

2. **Recreate admin user:**
   ```bash
   cd backend
   npm run create:admin
   ```

3. **Check server logs:**
   - Look for any errors in the terminal running `npm run dev`
   - Check for database connection errors
   - Verify port 5000 is not in use by another process

## ✨ Frontend Integration

The frontend is configured to use:
- API URL: `http://localhost:5000/api`
- CORS is configured to accept requests from: `http://localhost:8080`

Make sure your frontend dev server is running on port 8080, or update the CORS_ORIGIN in `backend/.env`

## 📞 Need Help?

If you're still experiencing issues:
1. Run `npx ts-node verify-users.ts` to verify users
2. Run `npx ts-node test-api.ts` to test all endpoints
3. Check the backend server terminal for error messages
4. Verify PostgreSQL is running: `psql -U postgres -c "SELECT version();"`
