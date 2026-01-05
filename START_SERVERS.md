# How to Start the LoanMS Application

## Quick Start Guide

### Prerequisites
- PostgreSQL is installed and running (check pgAdmin4)
- Database `loanms` exists
- Node.js is installed

---

## Option 1: Manual Start (Recommended for First Time)

### Terminal 1 - Backend Server
```bash
cd backend
npm run dev
```

**Expected Output:**
```
Server running on port 5000
Connected to PostgreSQL database
```

**If you see errors:**
- Check [LOGIN_FIX_GUIDE.md](./LOGIN_FIX_GUIDE.md) for troubleshooting

---

### Terminal 2 - Frontend Server
```bash
# In the main project folder (not inside backend)
npm run dev
```

**Expected Output:**
```
VITE ready in XXX ms
➜  Local:   http://localhost:8080/
```

---

## Option 2: First Time Setup

If this is your first time running the project:

### 1. Setup Backend
```bash
cd backend

# Install dependencies
npm install

# Setup database
npx prisma db push

# Seed with initial data (creates admin user)
npm run seed

# Start server
npm run dev
```

### 2. Setup Frontend
```bash
# In new terminal, in main project folder
npm install
npm run dev
```

---

## Login Credentials

After seeding the database, use these credentials:

**Admin Account:**
- Email: `admin@loanms.com`
- Password: `admin123`

**BackOffice Account:**
- Email: `backoffice@loanms.com`
- Password: `back123`

**Connector Account:**
- Email: `connector@loanms.com`
- Password: `conn123`

---

## Verify Everything is Working

### 1. Check Backend
Open browser: http://localhost:5000/api/auth/login

Should see JSON error (this is correct - endpoint requires credentials)

### 2. Check Frontend
Open browser: http://localhost:8080

Should see login page

### 3. Test Login
1. Go to http://localhost:8080
2. Enter: `admin@loanms.com` / `admin123`
3. Click Login
4. Should redirect to Dashboard

---

## Common Issues

### "This site can't be reached" on localhost:5000
**Problem:** Backend server not running

**Solution:**
```bash
cd backend
npm run dev
```

---

### "This site can't be reached" on localhost:8080
**Problem:** Frontend server not running

**Solution:**
```bash
npm run dev
```

---

### Login button doesn't work / No response
**Problem:** Backend server crashed or database connection failed

**Check backend terminal for errors:**
- Database connection error → Check PostgreSQL is running
- Port in use → Close other applications using port 5000
- Other errors → See [LOGIN_FIX_GUIDE.md](./LOGIN_FIX_GUIDE.md)

---

### CORS Error in Console
**Problem:** Backend CORS settings don't match frontend URL

**Fix:** Ensure `backend/.env` has:
```env
CORS_ORIGIN=http://localhost:8080
```

Then restart backend server.

---

## Stopping the Servers

Press `Ctrl + C` in each terminal to stop the servers.

---

## Development Workflow

1. **Start Backend First** (Terminal 1)
   ```bash
   cd backend && npm run dev
   ```

2. **Start Frontend** (Terminal 2)
   ```bash
   npm run dev
   ```

3. **Make Changes** - Both servers will auto-reload

4. **Stop Servers** - Press `Ctrl + C` in each terminal

---

## Database Management

### View Database Data
```bash
cd backend
npx prisma studio
```

Opens GUI at http://localhost:5555

### Reset Database (Deletes all data!)
```bash
cd backend
npx prisma migrate reset
npm run seed  # Re-add initial data
```

### Apply Schema Changes
```bash
cd backend
npx prisma db push
```

---

## Need Help?

1. Check [LOGIN_FIX_GUIDE.md](./LOGIN_FIX_GUIDE.md) for login issues
2. Check [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for feature status
3. Check [FIXES_IMPLEMENTATION_GUIDE.md](./FIXES_IMPLEMENTATION_GUIDE.md) for implementation details

---

## Quick Reference

| What | Command | Location |
|------|---------|----------|
| Start Backend | `npm run dev` | `backend/` folder |
| Start Frontend | `npm run dev` | Main folder |
| View Database | `npx prisma studio` | `backend/` folder |
| Reset DB | `npx prisma migrate reset` | `backend/` folder |
| Seed DB | `npm run seed` | `backend/` folder |

**Default Admin Login:**
- Email: `admin@loanms.com`
- Password: `admin123`
