# Login Issue - Troubleshooting Guide

## Issue
Users are unable to log in to the application.

## Possible Causes & Solutions

### 1. Backend Server Not Running

**Check:**
```bash
# Open a terminal in the backend folder
cd backend
npm run dev
```

**Expected Output:**
```
Server running on port 5000
Connected to PostgreSQL database
```

**If it fails:**
- Check if PostgreSQL is running
- Verify DATABASE_URL in `backend/.env`
- Check if port 5000 is available

---

### 2. Database Not Set Up

**Check if database exists:**
```bash
cd backend
npx prisma db push
```

**If database doesn't exist:**
1. Open pgAdmin4
2. Create a database named `loanms`
3. Run the command again

**Seed the database with initial data:**
```bash
cd backend
npm run seed
```

This creates:
- Admin user: `admin@loanms.com` / `admin123`
- Test users for different roles

---

### 3. CORS Issue

**Symptoms:**
- Login request fails with CORS error in browser console
- Error message about "Access-Control-Allow-Origin"

**Fix:**
Ensure `backend/.env` has:
```env
CORS_ORIGIN=http://localhost:8080
```

And frontend is running on port 8080 (not 5173).

---

### 4. Frontend Not Running on Correct Port

**Check frontend port:**
```bash
# In the main project folder
npm run dev
```

Should start on `http://localhost:8080`

**If it starts on 5173:**
Update `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    port: 8080
  }
})
```

---

### 5. Invalid Credentials

**Default Credentials:**
- **Email:** `admin@loanms.com`
- **Password:** `admin123`

**If you created users manually:**
- Use the email and password you set
- Passwords must be at least 6 characters

---

### 6. Token/Session Issues

**Clear browser data:**
1. Open DevTools (F12)
2. Go to Application tab
3. Clear localStorage
4. Refresh page

**Or in Console:**
```javascript
localStorage.clear()
location.reload()
```

---

## Complete Setup Steps (Fresh Start)

### Step 1: Start PostgreSQL
1. Open pgAdmin4
2. Ensure PostgreSQL server is running
3. Create database `loanms` if it doesn't exist

### Step 2: Setup Backend
```bash
cd backend

# Install dependencies (if not done)
npm install

# Push database schema
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed database with initial data
npm run seed

# Start backend server
npm run dev
```

**Backend should now be running on http://localhost:5000**

### Step 3: Setup Frontend
```bash
# In the main project folder
npm install

# Start frontend
npm run dev
```

**Frontend should now be running on http://localhost:8080**

### Step 4: Test Login
1. Open http://localhost:8080
2. Login with:
   - Email: `admin@loanms.com`
   - Password: `admin123`

---

## Debugging Tips

### Check Backend is Running
Open browser and go to: `http://localhost:5000/api/auth/login`

**Expected:** JSON error message (because you're not sending credentials)
**Bad:** "This site can't be reached" or "Connection refused"

### Check Console Errors
Open DevTools (F12) in browser:
- **Console tab:** Check for JavaScript errors
- **Network tab:** Check API requests
  - Should see request to `http://localhost:5000/api/auth/login`
  - Check response status and data

### Common Error Messages

**"Failed to fetch"**
- Backend server is not running
- Wrong API URL
- CORS issue

**"Invalid credentials"**
- Wrong email/password
- User doesn't exist in database

**"Network Error"**
- Backend server crashed
- PostgreSQL not running
- Firewall blocking connection

**"401 Unauthorized"**
- Wrong password
- User not found

---

## Quick Fix Checklist

- [ ] PostgreSQL is running (check pgAdmin4)
- [ ] Database `loanms` exists
- [ ] Backend server is running (`cd backend && npm run dev`)
- [ ] Backend running on port 5000
- [ ] Frontend server is running (`npm run dev`)
- [ ] Frontend running on port 8080
- [ ] Using correct credentials (`admin@loanms.com` / `admin123`)
- [ ] No CORS errors in console
- [ ] Browser localStorage is not corrupted (try clearing it)

---

## Still Not Working?

### Check Backend Logs
Look at the terminal where backend is running for error messages.

### Check Database Connection
```bash
cd backend
npx prisma studio
```

This opens a GUI to view your database. If it doesn't open:
- Database connection is broken
- Check DATABASE_URL in `backend/.env`

### Verify Environment Variables

**backend/.env:**
```env
PORT=5000
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/loanms?schema=public"
JWT_SECRET=loanms-super-secret-jwt-key-minimum-32-characters-long-change-in-production
CORS_ORIGIN=http://localhost:8080
```

**frontend/.env:**
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Reset Everything (Nuclear Option)

If nothing works, completely reset:

```bash
# Backend
cd backend
rm -rf node_modules
npm install
npx prisma migrate reset  # WARNING: Deletes all data!
npm run seed
npm run dev

# Frontend (in new terminal)
cd ..
rm -rf node_modules
npm install
npm run dev
```

---

## Contact Support

If you've tried all the above and still can't login, check:
1. What error message do you see?
2. What's in the browser console (F12)?
3. What's in the backend terminal output?
4. Can you access http://localhost:5000/api/auth/login in browser?

Include this information for faster help!
