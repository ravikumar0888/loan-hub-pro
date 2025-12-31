# LoanMS - Complete Setup Guide

This guide will help you set up the complete LoanMS (Loan Management System) with both backend and frontend.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** (comes with Node.js) or **yarn**
- **Git** (optional, for version control)

## 🚀 Quick Start

### Step 1: Install PostgreSQL

1. Download and install PostgreSQL from the official website
2. During installation, set a password for the `postgres` user (remember this!)
3. PostgreSQL will run on port `5432` by default

### Step 2: Create Database

**Using pgAdmin 4 (Recommended for Windows):**

1. Open **pgAdmin 4**
2. Connect to your PostgreSQL server:
   - Expand "Servers" in the left panel
   - Expand "PostgreSQL 14" (or your installed version)
   - Enter your password if prompted
3. Create the database:
   - Right-click on "Databases"
   - Select "Create" → "Database..."
   - In the "Database" field, enter: `loanms`
   - Click "Save"

You should now see `loanms` in the databases list!

**Using Command Line (Alternative):**

```bash
# Using psql
psql -U postgres
CREATE DATABASE loanms;
\q

# Or using createdb
createdb -U postgres loanms
```

### Step 3: Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

#### Install Dependencies

```bash
npm install
```

#### Configure Environment

The `.env` file is already created. Update the `DATABASE_URL` with your PostgreSQL password:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/loanms?schema=public"
```

Replace `YOUR_PASSWORD` with the password you set during PostgreSQL installation.

#### Generate Prisma Client

```bash
npm run prisma:generate
```

#### Run Database Migrations

```bash
npm run prisma:migrate
```

When prompted for a migration name, type: `init` and press Enter.

#### Seed Database with Sample Data

```bash
npm run prisma:seed
```

This creates:
- Admin, BackOffice, and Connector users
- 7 Banks (HDFC, ICICI, SBI, etc.)
- 2 DSAs
- 50 Sample customers

#### Start Backend Server

```bash
npm run dev
```

The backend API will run on: `http://localhost:5000`

You should see:
```
✅ Database connected successfully
🚀 Server running on port 5000
📊 Environment: development
🌐 API URL: http://localhost:5000
```

### Step 4: Frontend Setup

Open a **new terminal** (keep the backend running) and navigate to the frontend:

```bash
cd ..  # Go back to root
```

#### Install Frontend Dependencies

```bash
npm install
```

#### Start Frontend Development Server

```bash
npm run dev
```

The frontend will run on: `http://localhost:5173`

### Step 5: Access the Application

Open your browser and go to: `http://localhost:5173`

#### Login Credentials

**Admin:**
- Email: `admin@loanms.com`
- Password: `password123`

**BackOffice:**
- Email: `backoffice@loanms.com`
- Password: `password123`

**Connector:**
- Email: `connector@loanms.com`
- Password: `password123`

## 🎯 What You Can Do

### As Admin
- ✅ View dashboard with all metrics
- ✅ Manage all customers (create, edit, delete)
- ✅ Manage users (create BackOffice and Connector users)
- ✅ Manage banks and NBFCs
- ✅ Manage DSAs (Direct Selling Agents)
- ✅ Generate and export reports
- ✅ Full system access

### As BackOffice
- ✅ View dashboard
- ✅ Manage customers (create, edit)
- ✅ Add remarks to customers
- ✅ View reports

### As Connector
- ✅ View dashboard (filtered to their customers only)
- ✅ View customers assigned to them (read-only)
- ✅ Add remarks to customers

## 🗄️ Database Management

### View Data in Prisma Studio

```bash
cd backend
npm run prisma:studio
```

Opens a web interface at `http://localhost:5555` to view and edit database records.

### Reset Database (Clear all data and re-seed)

```bash
cd backend
npm run prisma:reset
```

This will:
1. Drop all tables
2. Recreate database schema
3. Run migrations
4. Seed sample data

## 🔧 Troubleshooting

### Database Connection Error

**Error:** `Can't reach database server`

**Solution:**
1. Ensure PostgreSQL is running
2. Check your `.env` file has the correct database credentials
3. Test connection: `psql -U postgres -d loanms`

### Port Already in Use

**Error:** `Port 5000 (or 5173) is already in use`

**Solution:**

For backend (in `backend/.env`):
```env
PORT=5001
```

For frontend (in `vite.config.ts`):
```typescript
server: {
  port: 5174
}
```

### Migration Failed

**Error:** Migration errors

**Solution:**
```bash
cd backend
npm run prisma:reset
```

This will reset everything and start fresh.

### Module Not Found

**Error:** `Cannot find module...`

**Solution:**
```bash
# In backend
cd backend
npm install

# In frontend
cd ..
npm install
```

## 📊 API Testing

You can test the API using:

### cURL Example

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@loanms.com","password":"password123"}'

# Get Dashboard KPIs (replace TOKEN with actual token from login)
curl -X GET http://localhost:5000/api/dashboard/kpis \
  -H "Authorization: Bearer TOKEN"
```

### Postman/Insomnia

1. Import the API endpoints from the README
2. Set up environment with `baseUrl: http://localhost:5000`
3. Use login endpoint to get token
4. Add token to Authorization header for protected routes

## 🔄 Development Workflow

### Making Database Changes

1. Edit `backend/prisma/schema.prisma`
2. Create migration: `npm run prisma:migrate`
3. Generate Prisma Client: `npm run prisma:generate`
4. Restart backend server

### Adding New API Endpoint

1. Create service in `backend/src/services/`
2. Create controller in `backend/src/controllers/`
3. Add route in `backend/src/routes/`
4. Import route in `backend/src/app.ts`

## 🏗️ Project Structure

```
loan-hub-pro/
├── backend/               # Node.js + PostgreSQL API
│   ├── src/
│   │   ├── config/       # Database config
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Auth, validation
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Helpers
│   ├── prisma/
│   │   ├── schema.prisma # Database schema
│   │   └── seed.ts       # Sample data
│   └── .env              # Environment variables
│
└── src/                  # React Frontend
    ├── components/       # UI components
    ├── pages/           # Page components
    ├── contexts/        # React contexts
    └── types/           # TypeScript types
```

## 📝 Next Steps

1. ✅ Complete backend setup
2. ✅ Complete frontend setup
3. 🔄 Update frontend to use backend APIs (instead of mock data)
4. 🔄 Test all features
5. 🔄 Deploy to production

## 🚀 Production Deployment

### Backend Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use a production PostgreSQL database
3. Set strong `JWT_SECRET` (32+ characters)
4. Deploy to platforms like:
   - Heroku
   - Railway
   - Render
   - DigitalOcean
   - AWS/Azure/GCP

### Frontend Deployment

1. Build frontend: `npm run build`
2. Deploy to:
   - Vercel
   - Netlify
   - GitHub Pages
   - AWS S3 + CloudFront

## 💡 Tips

- Keep backend and frontend terminals open during development
- Use Prisma Studio to inspect database
- Check backend logs in `backend/logs/` for debugging
- Use browser DevTools Network tab to debug API calls

## 📞 Support

If you encounter any issues:

1. Check this guide thoroughly
2. Review error messages in terminal
3. Check database connection
4. Ensure all dependencies are installed
5. Try resetting the database

## 🎉 Success!

If you see:
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:5173`
- Can login with demo credentials
- Dashboard shows data

**Congratulations! Your LoanMS is up and running! 🚀**
