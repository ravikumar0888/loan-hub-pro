# 🏦 LoanMS - Loan Management System

A comprehensive, full-stack loan management application built with React, Node.js, PostgreSQL, and TypeScript.

![Status](https://img.shields.io/badge/status-ready-green)
![Backend](https://img.shields.io/badge/backend-Node.js%20%2B%20PostgreSQL-blue)
![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20TypeScript-blue)

## 📋 Overview

LoanMS is a complete loan management platform designed for financial institutions, banks, NBFCs, and loan businesses. It provides comprehensive tools for managing loan applications, tracking disbursements, managing partner relationships, and generating business insights.

### Key Features

- 🔐 **Authentication & Authorization** - JWT-based auth with role-based access control
- 👥 **User Management** - Manage Admin, BackOffice, and Connector users
- 🏦 **Bank/NBFC Management** - Partner bank and financial institution tracking
- 🤝 **DSA Management** - Direct Selling Agent partnership management
- 📝 **Customer Management** - Complete loan application lifecycle
- 📊 **Dashboard Analytics** - Real-time KPIs, trends, and metrics
- 📈 **Reports & Export** - Filterable reports with CSV export
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

### Loan Statuses Tracked
- Login → Rejected/Approved → Disbursed
- Hold, Relook, Drop stages

### User Roles
- **Admin** - Full system access
- **BackOffice** - Operations and customer management
- **Connector** - Sales agents with read-only customer access

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

#### 1. Backend Setup
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Backend runs on: `http://localhost:5000`

#### 2. Frontend Setup
```bash
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@loanms.com | password123 |
| BackOffice | backoffice@loanms.com | password123 |
| Connector | connector@loanms.com | password123 |

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18.3 with TypeScript
- Vite (Build tool)
- TanStack React Query (Server state)
- shadcn/ui + Radix UI (Components)
- Tailwind CSS (Styling)
- Recharts (Data visualization)
- React Hook Form + Zod (Forms & validation)

**Backend:**
- Node.js + Express.js
- TypeScript
- PostgreSQL (Database)
- Prisma (ORM)
- JWT (Authentication)
- bcrypt (Password hashing)
- Zod (Validation)
- Winston (Logging)

### Project Structure

```
loan-hub-pro/
├── backend/                    # Node.js Backend
│   ├── src/
│   │   ├── config/            # Database & app config
│   │   ├── controllers/       # Request handlers (7 modules)
│   │   ├── middleware/        # Auth, validation, errors
│   │   ├── routes/            # API routes (7 modules)
│   │   ├── services/          # Business logic (7 modules)
│   │   ├── types/             # TypeScript types
│   │   └── utils/             # Helpers (JWT, password, validators)
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema (8 tables)
│   │   └── seed.ts            # Sample data
│   └── .env                   # Backend configuration
│
├── src/                       # React Frontend
│   ├── components/            # UI components
│   │   ├── auth/             # Login, forgot password
│   │   ├── dashboard/        # Dashboard components
│   │   ├── layout/           # Sidebar, header
│   │   └── ui/               # shadcn/ui components
│   ├── contexts/              # React contexts (auth)
│   ├── lib/
│   │   └── api.ts            # Backend API client
│   ├── pages/                 # Page components
│   └── types/                 # TypeScript types
│
└── Documentation files (see below)
```

---

## 📚 Documentation

Comprehensive documentation is available:

- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick command reference card
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Complete implementation overview
- **[BACKEND_SETUP_INSTRUCTIONS.md](BACKEND_SETUP_INSTRUCTIONS.md)** - Detailed backend setup
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Full system setup guide
- **[backend/README.md](backend/README.md)** - Backend API documentation

---

## 🔌 API Endpoints

Base URL: `http://localhost:5000/api`

### Authentication
- `POST /auth/login` - User login
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
- `GET /auth/me` - Get current user

### Customers
- `GET /customers` - List customers (paginated)
- `POST /customers` - Create customer
- `PUT /customers/:id` - Update customer
- `DELETE /customers/:id` - Delete customer
- `POST /customers/:id/remarks` - Add remark

### Dashboard
- `GET /dashboard/kpis` - Get KPI metrics
- `GET /dashboard/trends` - Get monthly trends
- `GET /dashboard/recent-customers` - Recent customers

### Reports
- `GET /reports` - Generate report
- `GET /reports/summary` - Get summary
- `GET /reports/export` - Export CSV

And more... See [backend/README.md](backend/README.md) for full API documentation.

---

## 🗄️ Database Schema

8 tables with proper relationships:

1. **users** - System users (admin, backoffice, connector)
2. **banks** - Partner banks and NBFCs
3. **user_bank_details** - Connector-bank associations
4. **dsas** - Direct Selling Agents
5. **dsa_bank_details** - DSA-bank associations
6. **customers** - Loan applications
7. **customer_remarks** - Customer notes/comments
8. **password_reset_tokens** - Password reset functionality

View schema: `backend/prisma/schema.prisma`

---

## 🛠️ Development

### Backend Development
```bash
cd backend

# Start dev server with hot reload
npm run dev

# View database in Prisma Studio
npm run prisma:studio

# Reset database
npm run prisma:reset

# Create new migration
npm run prisma:migrate
```

### Frontend Development
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🔐 Security

- JWT token-based authentication
- Password hashing with bcrypt
- Role-based authorization middleware
- Request validation with Zod schemas
- CORS configuration
- SQL injection prevention (Prisma ORM)

---

## 📊 Features by Role

### Admin
✅ Full dashboard access
✅ Create, update, delete customers
✅ Manage users (create BackOffice, Connectors)
✅ Manage banks, NBFCs, DSAs
✅ Full reports access

### BackOffice
✅ Dashboard access
✅ Create, update customers
✅ View reports
❌ No user/bank/DSA management

### Connector
✅ Dashboard (own customers only)
✅ View own customers (read-only)
✅ Add remarks
❌ No create/update/delete access

---

## 🧪 Testing the API

### Using cURL
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@loanms.com","password":"password123"}'

# Get Dashboard KPIs (replace TOKEN)
curl http://localhost:5000/api/dashboard/kpis \
  -H "Authorization: Bearer TOKEN"
```

### Using Prisma Studio
```bash
cd backend
npm run prisma:studio
```

Opens database GUI at `http://localhost:5555`

---

## 📦 Deployment

### Backend
- Deploy to: Heroku, Railway, Render, DigitalOcean, AWS
- Set production environment variables
- Use production PostgreSQL database
- Set strong JWT_SECRET

### Frontend
- Deploy to: Vercel, Netlify, GitHub Pages
- Build: `npm run build`
- Set VITE_API_URL to production backend URL

---

## 🐛 Troubleshooting

### Database connection error
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `backend/.env`

### Port already in use
- Change `PORT` in `backend/.env` (backend)
- Change port in `vite.config.ts` (frontend)

### Migration failed
```bash
cd backend
npm run prisma:reset
```

See [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for more solutions.

---

## 🤝 Contributing

This is a private project. For internal use only.

---

## 📄 License

ISC

---

## 🎉 What's Included

- ✅ Complete authentication system
- ✅ 40+ API endpoints
- ✅ 8-table relational database
- ✅ Role-based access control
- ✅ Sample data (50 customers, 7 banks, etc.)
- ✅ Dashboard with real-time metrics
- ✅ Report generation & CSV export
- ✅ Responsive UI
- ✅ TypeScript throughout
- ✅ Production-ready architecture
- ✅ Comprehensive documentation

---

**Built with ❤️ for efficient loan management**

For setup help, see [BACKEND_SETUP_INSTRUCTIONS.md](BACKEND_SETUP_INSTRUCTIONS.md)
