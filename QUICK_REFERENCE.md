# 🚀 LoanMS - Quick Reference Card

## 📦 Installation Commands

### Backend Setup
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate    # Name: init
npm run prisma:seed
npm run dev
```

### Frontend Setup
```bash
npm install
npm run dev
```

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@loanms.com | password123 |
| BackOffice | backoffice@loanms.com | password123 |
| Connector | connector@loanms.com | password123 |

---

## 🌐 URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| Prisma Studio | http://localhost:5555 |
| Health Check | http://localhost:5000/health |

---

## 🗄️ Database Commands

```bash
cd backend

# View database in GUI
npm run prisma:studio

# Create new migration
npm run prisma:migrate

# Reset database (⚠️ Deletes all data)
npm run prisma:reset

# Regenerate Prisma client
npm run prisma:generate
```

---

## 🔌 API Endpoints Quick Reference

### Authentication
```bash
POST   /api/auth/login              # Login
POST   /api/auth/forgot-password    # Forgot password
GET    /api/auth/me                 # Current user
```

### Customers
```bash
GET    /api/customers               # List customers
POST   /api/customers               # Create customer
PUT    /api/customers/:id           # Update customer
DELETE /api/customers/:id           # Delete customer
POST   /api/customers/:id/remarks   # Add remark
```

### Dashboard
```bash
GET    /api/dashboard/kpis          # Get KPIs
GET    /api/dashboard/trends        # Get trends
GET    /api/dashboard/recent-customers  # Recent customers
```

### Reports
```bash
GET    /api/reports                 # Generate report
GET    /api/reports/summary         # Summary stats
GET    /api/reports/export          # Export CSV
```

---

## 🧪 Test API with cURL

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@loanms.com","password":"password123"}'
```

### Get Dashboard KPIs (replace TOKEN)
```bash
curl -X GET http://localhost:5000/api/dashboard/kpis \
  -H "Authorization: Bearer TOKEN"
```

### Create Customer (replace TOKEN)
```bash
curl -X POST http://localhost:5000/api/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "name": "Test Customer",
    "mobile": "9876543210",
    "email": "test@example.com",
    "loanType": "PL",
    "loanAmount": 500000,
    "status": "login"
  }'
```

---

## 🐛 Common Issues & Fixes

### Database Connection Error
```bash
# Check PostgreSQL is running
pg_ctl status

# Update DATABASE_URL in backend/.env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/loanms"
```

### Port Already in Use
```bash
# Backend: Change PORT in backend/.env
PORT=5001

# Frontend: Change port in vite.config.ts
server: { port: 5174 }
```

### Migration Failed
```bash
cd backend
npm run prisma:reset  # Resets everything
```

### Module Not Found
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd ..
rm -rf node_modules package-lock.json
npm install
```

---

## 📁 Important Files

| File | Location | Purpose |
|------|----------|---------|
| Database Schema | `backend/prisma/schema.prisma` | Database structure |
| Backend Env | `backend/.env` | Backend config |
| Frontend Env | `.env` | Frontend config |
| API Helper | `src/lib/api.ts` | Frontend API client |
| Seed Script | `backend/prisma/seed.ts` | Sample data |

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/loanms"
JWT_SECRET=your-secret-key-min-32-chars
CORS_ORIGIN=http://localhost:5173
```

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📊 Database Tables

1. **users** - System users (admin, backoffice, connector)
2. **banks** - Partner banks and NBFCs
3. **user_bank_details** - Connector-bank associations
4. **dsas** - Direct Selling Agents
5. **dsa_bank_details** - DSA-bank associations
6. **customers** - Loan applications
7. **customer_remarks** - Customer notes
8. **password_reset_tokens** - Password reset tokens

---

## 🎯 Role Permissions

| Feature | Admin | BackOffice | Connector |
|---------|-------|------------|-----------|
| Dashboard | ✅ All | ✅ All | ✅ Own only |
| View Customers | ✅ All | ✅ All | ✅ Own only |
| Create Customer | ✅ | ✅ | ❌ |
| Update Customer | ✅ | ✅ | ❌ |
| Delete Customer | ✅ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ |
| Manage Banks | ✅ | ❌ | ❌ |
| Manage DSAs | ✅ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ✅ Own only |

---

## 🏃 Development Workflow

### Starting Development
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev

# Terminal 3 - Database GUI (optional)
cd backend
npm run prisma:studio
```

### Making Database Changes
```bash
# 1. Edit backend/prisma/schema.prisma
# 2. Create migration
cd backend
npm run prisma:migrate

# 3. Regenerate client
npm run prisma:generate

# 4. Restart backend server
```

---

## 📚 Documentation Files

- **IMPLEMENTATION_SUMMARY.md** - Complete overview
- **BACKEND_SETUP_INSTRUCTIONS.md** - Backend setup guide
- **SETUP_GUIDE.md** - Full system setup
- **backend/README.md** - API documentation
- **QUICK_REFERENCE.md** - This file

---

## 💡 Useful Commands

### Check if Services are Running
```bash
# PostgreSQL
pg_ctl status

# Backend (check if port is in use)
netstat -an | grep 5000

# Frontend (check if port is in use)
netstat -an | grep 5173
```

### View Logs
```bash
# Backend logs
cat backend/logs/combined.log
cat backend/logs/error.log
```

### Production Build
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
npm run build
npm run preview
```

---

## 🎉 Quick Start (TL;DR)

```bash
# 1. Install PostgreSQL and create 'loanms' database

# 2. Setup Backend
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev

# 3. Setup Frontend (new terminal)
cd ..
npm install
npm run dev

# 4. Access app at http://localhost:5173
# Login: admin@loanms.com / password123
```

---

## 🆘 Emergency Reset

If everything breaks and you want to start fresh:

```bash
# 1. Stop all servers (Ctrl+C)

# 2. Reset backend
cd backend
rm -rf node_modules package-lock.json
npm install
npm run prisma:reset

# 3. Reset frontend
cd ..
rm -rf node_modules package-lock.json
npm install

# 4. Start again
cd backend && npm run dev  # Terminal 1
npm run dev                # Terminal 2 (from root)
```

---

**Need more help?** See the detailed documentation files listed above! 📖
