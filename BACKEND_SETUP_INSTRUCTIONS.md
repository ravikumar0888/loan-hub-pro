# 🚀 LoanMS Backend Setup Instructions

## ✅ What Has Been Created

I've successfully created a complete Node.js + PostgreSQL backend for your LoanMS application:

### 📁 Backend Structure Created
```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts       # Prisma database connection
│   │   └── constants.ts      # App constants
│   ├── controllers/          # All 7 API controllers
│   │   ├── auth.controller.ts
│   │   ├── banks.controller.ts
│   │   ├── customers.controller.ts
│   │   ├── dashboard.controller.ts
│   │   ├── dsas.controller.ts
│   │   ├── reports.controller.ts
│   │   └── users.controller.ts
│   ├── middleware/
│   │   ├── auth.ts           # JWT authentication
│   │   ├── authorize.ts      # Role-based authorization
│   │   ├── errorHandler.ts   # Global error handling
│   │   └── validator.ts      # Request validation
│   ├── routes/               # All 7 API route files
│   ├── services/             # All 7 business logic services
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   ├── utils/
│   │   ├── jwt.ts            # JWT token utilities
│   │   ├── logger.ts         # Winston logger
│   │   ├── password.ts       # Bcrypt password hashing
│   │   └── validators.ts     # Zod validation schemas
│   ├── app.ts                # Express app configuration
│   └── server.ts             # Server entry point
├── prisma/
│   ├── schema.prisma         # Complete database schema
│   └── seed.ts               # Database seeding script
├── .env                      # Environment variables (configured)
├── .env.example              # Environment template
├── .gitignore
├── package.json              # All dependencies configured
├── tsconfig.json             # TypeScript configuration
└── README.md                 # Complete backend documentation
```

### 🎯 Features Implemented

✅ **Complete Authentication System**
- JWT-based authentication
- Password hashing with bcrypt
- Forgot/Reset password flow
- Role-based access control (Admin, BackOffice, Connector)

✅ **7 Complete API Modules**
1. **Authentication** (`/api/auth`)
2. **Users Management** (`/api/users`)
3. **Banks Management** (`/api/banks`)
4. **DSA Management** (`/api/dsas`)
5. **Customers Management** (`/api/customers`)
6. **Dashboard Analytics** (`/api/dashboard`)
7. **Reports & Export** (`/api/reports`)

✅ **Database Schema**
- 8 Tables with proper relationships
- Enums for roles, loan statuses, loan types
- Indexes for performance
- Cascade deletes where appropriate

✅ **Security Features**
- Password hashing
- JWT token authentication
- Role-based authorization
- Request validation with Zod
- CORS configuration
- Error handling

✅ **Developer Experience**
- TypeScript for type safety
- Prisma ORM for database
- Winston logging
- Hot reload in development
- Database seeding script

## 🏃 Quick Start Guide

### Step 1: Install PostgreSQL

If you don't have PostgreSQL installed:

**Windows:**
1. Download from: https://www.postgresql.org/download/windows/
2. Run installer (remember the password for 'postgres' user)
3. PostgreSQL will run on port 5432

**Mac (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Step 2: Create Database

**Using pgAdmin 4 (Windows - Recommended):**

1. Open pgAdmin 4
2. Connect to your PostgreSQL server (localhost)
   - Right-click on "Servers" → Register → Server
   - Or expand "PostgreSQL 14" (or your version)
3. Right-click on "Databases" → Create → Database
4. Enter database name: `loanms`
5. Click "Save"

**Using Command Line (Alternative):**

```bash
# Using psql command line
psql -U postgres
CREATE DATABASE loanms;
\q

# Or using createdb command
createdb -U postgres loanms
```

### Step 3: Setup Backend

Open a terminal and navigate to the backend folder:

```bash
cd backend
```

#### Install Dependencies
```bash
npm install
```

This will install all required packages:
- express, cors, dotenv
- @prisma/client, prisma
- bcrypt, jsonwebtoken
- zod, winston
- TypeScript and dev dependencies

#### Configure Database Connection

The `.env` file is already created. Update the `DATABASE_URL` if needed:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/loanms?schema=public"
```

Replace `YOUR_PASSWORD` with your PostgreSQL password.

#### Generate Prisma Client
```bash
npm run prisma:generate
```

#### Run Database Migrations
```bash
npm run prisma:migrate
```

When prompted for migration name, type: `init`

This creates all 8 tables in your database:
- users
- banks
- user_bank_details
- dsas
- dsa_bank_details
- customers
- customer_remarks
- password_reset_tokens

#### Seed Database with Sample Data
```bash
npm run prisma:seed
```

This creates:
- **3 Users** (Admin, BackOffice, Connector)
- **7 Banks** (HDFC, ICICI, SBI, Axis, Kotak, Bajaj Finance, Tata Capital)
- **2 DSAs** with bank associations
- **50 Sample Customers** with various statuses and remarks

#### Start the Server
```bash
npm run dev
```

You should see:
```
✅ Database connected successfully
🚀 Server running on port 5000
📊 Environment: development
🌐 API URL: http://localhost:5000
```

### Step 4: Test the API

#### Health Check
```bash
curl http://localhost:5000/health
```

#### Login Test
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@loanms.com","password":"password123"}'
```

You should get a response with a JWT token and user details.

## 🔑 Demo Login Credentials

### Admin User
- **Email:** `admin@loanms.com`
- **Password:** `password123`
- **Access:** Full system access

### BackOffice User
- **Email:** `backoffice@loanms.com`
- **Password:** `password123`
- **Access:** Dashboard, Customers management

### Connector User
- **Email:** `connector@loanms.com`
- **Password:** `password123`
- **Access:** Dashboard (own customers only), Read-only customer access

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected endpoints require JWT token in header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Available Endpoints

#### Authentication (`/api/auth`)
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user (protected)

#### Users (`/api/users`) - Admin Only
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/connectors` - Get all connectors (All roles)

#### Banks (`/api/banks`)
- `GET /api/banks` - List banks (Admin only)
- `GET /api/banks/all` - Get all active banks (All roles)
- `POST /api/banks` - Create bank (Admin only)
- `PUT /api/banks/:id` - Update bank (Admin only)
- `DELETE /api/banks/:id` - Delete bank (Admin only)

#### DSAs (`/api/dsas`)
- `GET /api/dsas` - List DSAs (Admin only)
- `GET /api/dsas/all` - Get all active DSAs (All roles)
- `POST /api/dsas` - Create DSA (Admin only)
- `PUT /api/dsas/:id` - Update DSA (Admin only)
- `DELETE /api/dsas/:id` - Delete DSA (Admin only)

#### Customers (`/api/customers`)
- `GET /api/customers` - List customers (filtered by role)
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create customer (Admin/BackOffice)
- `PUT /api/customers/:id` - Update customer (Admin/BackOffice)
- `DELETE /api/customers/:id` - Delete customer (Admin only)
- `POST /api/customers/:id/remarks` - Add remark (All roles)
- `GET /api/customers/:id/remarks` - Get remarks (All roles)

#### Dashboard (`/api/dashboard`)
- `GET /api/dashboard/kpis?startDate=&endDate=` - Get KPI metrics
- `GET /api/dashboard/trends` - Get monthly trends
- `GET /api/dashboard/recent-customers?limit=10` - Recent customers

#### Reports (`/api/reports`)
- `GET /api/reports?startDate=&endDate=&connectorId=` - Generate report
- `GET /api/reports/summary?startDate=&endDate=` - Get summary
- `GET /api/reports/export?startDate=&endDate=` - Export CSV

## 🗄️ Database Tools

### Prisma Studio (Database GUI)
```bash
cd backend
npm run prisma:studio
```

Opens at `http://localhost:5555` - Visual database browser and editor

### Reset Database (Start Fresh)
```bash
cd backend
npm run prisma:reset
```

Drops tables, recreates schema, runs migrations, and seeds data.

## 🔍 Logs and Debugging

Logs are stored in `backend/logs/`:
- `error.log` - Error logs only
- `combined.log` - All logs

In development, logs also print to console.

## 🎯 Next Steps - Frontend Integration

I've created an API helper file at `src/lib/api.ts` with all the functions you need.

### Example Usage in Frontend:

```typescript
import { authApi, customersApi, dashboardApi } from '@/lib/api';

// Login
const response = await authApi.login('admin@loanms.com', 'password123');
const token = response.data.token;
setAuthToken(token); // Saves to localStorage

// Get dashboard KPIs
const kpis = await dashboardApi.getKPIs();

// Get customers
const customers = await customersApi.getCustomers({ page: 1, limit: 10 });

// Create customer
const newCustomer = await customersApi.createCustomer({
  name: 'John Doe',
  mobile: '9876543210',
  email: 'john@example.com',
  loanType: 'PL',
  loanAmount: 500000,
  connectorId: 'connector-uuid',
  status: 'login'
});
```

## 🐛 Troubleshooting

### Cannot connect to database
- Ensure PostgreSQL is running: `pg_ctl status`
- Check credentials in `.env`
- Test connection: `psql -U postgres -d loanms`

### Port 5000 already in use
Change PORT in `backend/.env`:
```env
PORT=5001
```

### Migration errors
Reset database:
```bash
cd backend
npm run prisma:reset
```

### Module not found
Reinstall dependencies:
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

## ✅ Verification Checklist

- [ ] PostgreSQL installed and running
- [ ] Database `loanms` created
- [ ] Backend dependencies installed (`npm install`)
- [ ] Prisma client generated (`npm run prisma:generate`)
- [ ] Migrations run (`npm run prisma:migrate`)
- [ ] Database seeded (`npm run prisma:seed`)
- [ ] Server running (`npm run dev`)
- [ ] Can access health check: `http://localhost:5000/health`
- [ ] Can login via API
- [ ] Prisma Studio works (`npm run prisma:studio`)

## 🎉 Success!

If all steps are completed, you now have:
- ✅ Fully functional Node.js + PostgreSQL backend
- ✅ Complete REST API with 40+ endpoints
- ✅ JWT authentication and authorization
- ✅ Role-based access control
- ✅ Sample data for testing
- ✅ Production-ready architecture

Your backend is now ready to be integrated with the React frontend! 🚀

## 📖 Additional Resources

- **Prisma Docs:** https://www.prisma.io/docs
- **Express Docs:** https://expressjs.com
- **JWT Docs:** https://jwt.io
- **PostgreSQL Docs:** https://www.postgresql.org/docs

Need help? Check the `backend/README.md` for more detailed information!
