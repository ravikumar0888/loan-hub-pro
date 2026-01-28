# Local Development Guide

Complete guide for running the LoanMS application on your local development machine.

## Prerequisites

- Node.js 18.x or 20.x
- PostgreSQL 13+ installed and running
- npm or yarn package manager
- Git (optional, for version control)

---

## Initial Setup

### Step 1: Install PostgreSQL

**Windows:**
- Download from: https://www.postgresql.org/download/windows/
- Install with default settings
- Remember the password you set for the `postgres` user

**macOS:**
```bash
brew install postgresql@13
brew services start postgresql@13
```

**Linux:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Step 2: Create Database

Open PostgreSQL command line (psql):

```bash
# Windows (from Start menu: "SQL Shell (psql)")
# macOS/Linux
psql -U postgres
```

Run these commands:
```sql
-- Create database
CREATE DATABASE loanms;

-- Verify
\l

-- Exit
\q
```

### Step 3: Clone/Extract Project

If you have the project files:
```bash
cd F:\Rudvir\loan-hub-pro
```

---

## Backend Setup

### Step 1: Install Dependencies

```bash
cd F:\Rudvir\loan-hub-pro\backend
npm install
```

This installs all required packages including:
- Express.js
- Prisma
- bcrypt
- jsonwebtoken
- **date-fns** (for date formatting)
- And all other dependencies

### Step 2: Configure Environment

The `.env` file is already configured for local development:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:Rudransh@4240@localhost:5432/loanms?schema=public"
JWT_SECRET=loanms-super-secret-jwt-key-minimum-32-characters-long-change-in-production
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:8080
```

**If your PostgreSQL password is different**, update the `DATABASE_URL`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/loanms?schema=public"
```

### Step 3: Run Database Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations (creates all tables)
npx prisma migrate dev

# Or use the setup script (runs migrations + creates superadmin)
npm run setup
```

### Step 4: Create Admin User

**Option 1: Via setup script (recommended)**
```bash
npm run setup
```

This creates a superadmin user with:
- Email: `superadmin@loanms.com`
- Password: `Admin@123`

**Option 2: Create master admin**
```bash
npm run setup:master
```

This creates:
- Email: `master@loanms.com`
- Password: `MasterAdmin@123`

**Option 3: Manually via SQL**

Open Prisma Studio:
```bash
npx prisma studio
```

Or run SQL directly:
```sql
INSERT INTO "users" (
    "id", "first_name", "last_name", "email", "mobile",
    "password_hash", "role", "is_active", "created_at", "updated_at"
) VALUES (
    gen_random_uuid(), 'Admin', 'User', 'admin@test.com', '9999999999',
    '$2b$10$rICBHDE4Q6EIYU/GDwj.8OvlOXwcFtVQ5JJwjKdHqpVxXVxqXqXqW',
    'master_admin', true, NOW(), NOW()
);
```

Password: `MasterAdmin@123`

### Step 5: Start Backend Server

```bash
npm run dev
```

You should see:
```
🚀 LoanMS Backend Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server running on: http://localhost:5000
🌍 Environment: development
📊 Database: Connected
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Test the backend:**
Open browser: http://localhost:5000/health

Should return:
```json
{
  "success": true,
  "message": "LoanMS Backend API is running",
  "timestamp": "...",
  "environment": "development"
}
```

---

## Frontend Setup

### Step 1: Install Dependencies

Open a **new terminal** (keep backend running):

```bash
cd F:\Rudvir\loan-hub-pro
npm install
```

### Step 2: Configure Environment

The `.env` file is already configured:

```env
VITE_API_URL=http://localhost:5000/api
```

This tells the frontend to connect to your local backend.

### Step 3: Start Frontend Dev Server

```bash
npm run dev
```

You should see:
```
VITE ready in 500 ms

➜  Local:   http://localhost:8080/
➜  Network: use --host to expose
```

### Step 4: Access Application

Open browser: **http://localhost:8080**

You should see the login page!

**Login with:**
- Email: `superadmin@loanms.com` (or `master@loanms.com`)
- Password: `Admin@123` (or `MasterAdmin@123`)

---

## Development Workflow

### Running Both Servers

You need **two terminal windows**:

**Terminal 1 - Backend:**
```bash
cd F:\Rudvir\loan-hub-pro\backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd F:\Rudvir\loan-hub-pro
npm run dev
```

### Making Code Changes

**Backend changes:**
- Edit files in `backend/src/`
- Server auto-restarts (using ts-node-dev)
- Check terminal for any errors

**Frontend changes:**
- Edit files in `src/`
- Browser auto-refreshes (using Vite HMR)
- Check browser console for errors

### Database Changes

When you modify `backend/prisma/schema.prisma`:

```bash
cd backend

# Create a migration
npx prisma migrate dev --name your_migration_name

# Regenerate Prisma Client
npx prisma generate
```

**View database:**
```bash
npx prisma studio
```

Opens a GUI at http://localhost:5555

---

## Common Commands

### Backend Commands

```bash
# Development server (auto-restart)
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Database commands
npx prisma studio          # Open database GUI
npx prisma migrate dev     # Create and run migration
npx prisma generate        # Generate Prisma Client
npx prisma db push         # Push schema without migration

# Create admin users
npm run setup              # Migrate + create superadmin
npm run setup:master       # Create master admin only
```

### Frontend Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## Troubleshooting

### Issue: Backend won't start

**Error: "Cannot find module 'date-fns'"**

Fix:
```bash
cd backend
npm install date-fns
```

**Error: "Database connection failed"**

Fix:
1. Check PostgreSQL is running
2. Verify DATABASE_URL in `.env`
3. Check password is correct

Test connection:
```bash
psql -U postgres -d loanms
```

### Issue: Prisma errors

**Error: "Unknown argument 'schema'"**

Fix:
```bash
cd backend
npx prisma generate
```

**Error: "Can't reach database server"**

Fix: Check PostgreSQL service is running:
```bash
# Windows
services.msc  # Look for "postgresql-x64-13"

# macOS
brew services list

# Linux
sudo systemctl status postgresql
```

### Issue: Frontend can't connect to backend

**Error: "Network error" or "Failed to fetch"**

Fix:
1. Ensure backend is running on http://localhost:5000
2. Check CORS_ORIGIN in backend `.env` is `http://localhost:8080`
3. Verify VITE_API_URL in frontend `.env` is `http://localhost:5000/api`

### Issue: Port already in use

**Backend (port 5000):**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

**Frontend (port 8080):**
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :8080
kill -9 <PID>
```

---

## Project Structure

```
loan-hub-pro/
├── backend/                    # Express.js backend
│   ├── src/
│   │   ├── index.ts           # Server entry point
│   │   ├── app.ts             # Express app setup
│   │   ├── controllers/       # Route handlers
│   │   ├── services/          # Business logic
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Auth, validation, etc.
│   │   ├── utils/             # Utilities, PDF generators
│   │   └── types/             # TypeScript types
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── .env                   # Local environment
│   ├── .env.production        # Production environment
│   └── package.json
│
├── src/                        # React frontend
│   ├── components/            # React components
│   ├── pages/                 # Page components
│   ├── contexts/              # React contexts (Auth, etc.)
│   ├── lib/                   # API client, utilities
│   ├── types/                 # TypeScript types
│   ├── App.tsx                # Main app component
│   └── main.tsx               # Entry point
│
├── .env                        # Frontend local environment
├── .env.production             # Frontend production environment
├── vite.config.ts              # Vite configuration
├── package.json                # Frontend dependencies
├── DEPLOYMENT-GUIDE.md         # Server deployment guide
└── LOCAL-DEVELOPMENT.md        # This file
```

---

## Testing

### Manual Testing

1. **Test login:**
   - Navigate to http://localhost:8080
   - Login with admin credentials
   - Check browser console for errors

2. **Test API:**
   - Use browser DevTools → Network tab
   - Check API calls to http://localhost:5000/api/*

3. **Test database:**
   - Open Prisma Studio: `npx prisma studio`
   - Verify data is being saved

### API Testing with curl

```bash
# Health check
curl http://localhost:5000/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@loanms.com","password":"Admin@123"}'

# Get current user (with token)
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Environment Variables Reference

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment | development |
| DATABASE_URL | PostgreSQL connection | postgresql://user:pass@localhost:5432/db |
| JWT_SECRET | Secret for JWT tokens | min 32 characters |
| JWT_EXPIRES_IN | Token expiry | 24h |
| CORS_ORIGIN | Allowed frontend URL | http://localhost:8080 |

### Frontend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | http://localhost:5000/api |

---

## Next Steps

After getting the local environment running:

1. **Explore the application:**
   - Create organizations
   - Add users
   - Manage customers
   - Generate reports

2. **Make changes:**
   - Modify code in `src/` (frontend) or `backend/src/`
   - See changes reflected immediately

3. **Deploy to production:**
   - Follow `DEPLOYMENT-GUIDE.md`
   - Build and upload to your server

---

## Getting Help

If you encounter issues:

1. Check the terminal for error messages
2. Check browser console (F12) for frontend errors
3. Review this guide's troubleshooting section
4. Check `backend/logs/` for detailed logs
5. Use `npx prisma studio` to inspect database

---

## Useful Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
