# Quick Start Guide

Get the LoanMS application running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- PostgreSQL installed and running
- Database password: `Rudransh@4240` (or your custom password)

---

## Local Development (5 Steps)

### 1. Install Backend Dependencies

```bash
cd F:\Rudvir\loan-hub-pro\backend
npm install
```

### 2. Setup Database

```bash
# Generate Prisma Client & Run Migrations
npx prisma migrate dev

# Create admin user
npm run setup
```

**Login credentials created:**
- Email: `superadmin@loanms.com`
- Password: `Admin@123`

### 3. Start Backend

```bash
npm run dev
```

Should show: `🚀 LoanMS Backend Server` on http://localhost:5000

### 4. Install Frontend Dependencies (New Terminal)

```bash
cd F:\Rudvir\loan-hub-pro
npm install
```

### 5. Start Frontend

```bash
npm run dev
```

### 6. Open Application

Browser: **http://localhost:8080**

Login with:
- Email: `superadmin@loanms.com`
- Password: `Admin@123`

✅ **Done!** You're running locally.

---

## Production Deployment (cPanel)

### Quick Steps:

1. **Build locally:**
   ```bash
   # Backend
   cd backend
   npm install
   npx prisma generate
   npm run build

   # Frontend
   cd ..
   npm run build
   ```

2. **Upload to server:**
   - Backend files → `/home/kashton/dsaconnect.rudvirfinance.in/loan-hub-pro/backend/`
   - Frontend dist → `/home/kashton/dsaconnect.rudvirfinance.in/`

3. **Configure Node.js app in cPanel:**
   - Application root: `dsaconnect.rudvirfinance.in/loan-hub-pro/backend`
   - Startup file: `dist/index.js`
   - Add environment variables (DATABASE_URL, JWT_SECRET, etc.)

4. **Create .htaccess:**
   - Location: `/home/kashton/dsaconnect.rudvirfinance.in/.htaccess`
   - Use template from `.htaccess.example`

5. **Start app:**
   - cPanel → Setup Node.js App → Start

**For detailed instructions, see:** `DEPLOYMENT-GUIDE.md`

---

## Common Issues & Fixes

### ❌ "Cannot find module 'date-fns'"

```bash
cd backend
npm install date-fns
```

### ❌ "Database connection failed"

Update `DATABASE_URL` in `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/loanms?schema=public"
```

### ❌ "Port 5000 already in use"

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### ❌ Prisma errors

```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

---

## File Checklist

### Local Development ✅
- [x] `backend/.env` - Backend config (DATABASE_URL, JWT_SECRET)
- [x] `.env` - Frontend config (VITE_API_URL)
- [x] PostgreSQL running
- [x] Database created (`loanms`)

### Production Deployment ✅
- [x] `backend/.env.production` - Backend production config
- [x] `.env.production` - Frontend production config
- [x] Backend built (`dist` folder)
- [x] Frontend built (`dist` folder)
- [x] `.htaccess` file created
- [x] Node.js app configured in cPanel
- [x] Environment variables set in cPanel

---

## Key URLs

### Local:
- Frontend: http://localhost:8080
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/health
- Prisma Studio: http://localhost:5555 (run `npx prisma studio`)

### Production:
- Frontend: https://dsaconnect.rudvirfinance.in
- Backend API: https://dsaconnect.rudvirfinance.in/api
- Health check: https://dsaconnect.rudvirfinance.in/api/health

---

## Need Help?

1. **Local issues:** See `LOCAL-DEVELOPMENT.md`
2. **Deployment issues:** See `DEPLOYMENT-GUIDE.md`
3. **Backend logs:** Check terminal output or server logs
4. **Frontend errors:** Check browser console (F12)

---

## Next Steps

- ✅ Application running locally
- ✅ Create test data
- ✅ Explore features
- ✅ Make modifications
- ✅ Deploy to production

Happy coding! 🚀
