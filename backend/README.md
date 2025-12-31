# LoanMS Backend API

Complete Node.js + PostgreSQL backend for the LoanMS (Loan Management System) application.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Create and manage users (Admin, BackOffice, Connector roles)
- **Banks & NBFC Management**: Manage partner banks and financial institutions
- **DSA Management**: Direct Selling Agent partnership tracking
- **Customer Management**: Complete loan application lifecycle management
- **Dashboard Analytics**: Real-time KPIs, trends, and statistics
- **Reports & Export**: Generate filtered reports with CSV export

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## 🛠️ Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

Create a PostgreSQL database:

```bash
createdb loanms
```

Or using PostgreSQL client:

```sql
CREATE DATABASE loanms;
```

### 3. Environment Configuration

The `.env` file is already created. Update the database credentials if needed:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/loanms?schema=public"
```

### 4. Generate Prisma Client

```bash
npm run prisma:generate
```

### 5. Run Database Migrations

```bash
npm run prisma:migrate
```

When prompted, enter a migration name like: `init`

### 6. Seed Database with Sample Data

```bash
npm run prisma:seed
```

This will create:
- 3 Admin/BackOffice/Connector users
- 7 Banks (HDFC, ICICI, SBI, Axis, Kotak, Bajaj, Tata)
- 2 DSAs with bank associations
- 50 Sample customers with various statuses

## 🏃‍♂️ Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

The API will be available at: `http://localhost:5000`

## 📝 Demo Login Credentials

### Admin User
- Email: `admin@loanms.com`
- Password: `password123`

### BackOffice User
- Email: `backoffice@loanms.com`
- Password: `password123`

### Connector User
- Email: `connector@loanms.com`
- Password: `password123`

## 📚 API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user (protected)

### Users (`/api/users`)
- `GET /api/users` - List all users (Admin only)
- `GET /api/users/:id` - Get user details (Admin only)
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)
- `GET /api/users/connectors` - Get all connectors (All authenticated)

### Banks (`/api/banks`)
- `GET /api/banks` - List banks with pagination (Admin only)
- `GET /api/banks/all` - Get all active banks (All authenticated)
- `GET /api/banks/:id` - Get bank details (Admin only)
- `POST /api/banks` - Create bank (Admin only)
- `PUT /api/banks/:id` - Update bank (Admin only)
- `DELETE /api/banks/:id` - Delete bank (Admin only)

### DSAs (`/api/dsas`)
- `GET /api/dsas` - List DSAs with pagination (Admin only)
- `GET /api/dsas/all` - Get all active DSAs (All authenticated)
- `GET /api/dsas/:id` - Get DSA details (Admin only)
- `POST /api/dsas` - Create DSA (Admin only)
- `PUT /api/dsas/:id` - Update DSA (Admin only)
- `DELETE /api/dsas/:id` - Delete DSA (Admin only)

### Customers (`/api/customers`)
- `GET /api/customers` - List customers (All roles, filtered by role)
- `GET /api/customers/:id` - Get customer details (All roles, filtered by role)
- `POST /api/customers` - Create customer (Admin/BackOffice only)
- `PUT /api/customers/:id` - Update customer (Admin/BackOffice only)
- `DELETE /api/customers/:id` - Delete customer (Admin only)
- `POST /api/customers/:id/remarks` - Add remark (All authenticated)
- `GET /api/customers/:id/remarks` - Get remarks (All authenticated)

### Dashboard (`/api/dashboard`)
- `GET /api/dashboard/kpis?startDate=&endDate=` - Get KPI metrics
- `GET /api/dashboard/trends` - Get monthly trend data
- `GET /api/dashboard/recent-customers?limit=10` - Get recent customers

### Reports (`/api/reports`)
- `GET /api/reports?startDate=&endDate=&connectorId=&dsaId=` - Generate report
- `GET /api/reports/summary?startDate=&endDate=` - Get summary statistics
- `GET /api/reports/export?startDate=&endDate=` - Export report as CSV

### Health Check
- `GET /health` - API health status

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 🗄️ Database Management

### View Database in Prisma Studio

```bash
npm run prisma:studio
```

This opens a web interface at `http://localhost:5555` to view and edit data.

### Reset Database

```bash
npm run prisma:reset
```

This will drop the database, recreate it, run migrations, and seed data.

### Create New Migration

```bash
npm run prisma:migrate
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Database and app configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware (auth, validation, errors)
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic layer
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions (JWT, password, validators)
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seeding script
├── logs/                # Application logs
├── .env                 # Environment variables
├── package.json
└── tsconfig.json
```

## 🔒 Role-Based Access Control

### Admin
- Full access to all endpoints
- Can manage users, banks, DSAs, customers
- Can view all data and reports

### BackOffice
- Can view dashboard and customers
- Can create and update customers
- Cannot manage users, banks, or DSAs

### Connector
- Can view dashboard (filtered to their customers)
- Can view customers assigned to them (read-only)
- Cannot create, update, or delete customers

## 🐛 Debugging

Logs are stored in the `logs/` directory:
- `error.log` - Error logs only
- `combined.log` - All logs

In development mode, logs are also printed to console.

## 📦 Technologies Used

- **Express.js** - Web framework
- **Prisma** - ORM for PostgreSQL
- **TypeScript** - Type-safe JavaScript
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **Zod** - Schema validation
- **Winston** - Logging
- **date-fns** - Date manipulation

## 🚧 Next Steps

1. Configure email service for password reset
2. Add rate limiting for security
3. Set up API documentation (Swagger)
4. Add comprehensive unit and integration tests
5. Configure production environment variables
6. Set up CI/CD pipeline

## 📄 License

ISC
