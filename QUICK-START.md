# Quick Start Guide

## 🚀 One-Command Setup (Recommended)

Run this command in the `backend` folder:

```bash
cd backend
complete-setup.bat
```

This will automatically:
1. Run database migrations
2. Generate Prisma client
3. Create SuperAdmin account

---

## 📧 SuperAdmin Login Credentials

After setup, login with:

- **Email:** `superadmin@rudvir.com`
- **Password:** `Admin@123`

⚠️ **Change this password immediately after first login!**

---

## 🎯 Manual Setup (If needed)

### Step 1: Database Migration
```bash
cd backend
npx prisma migrate dev --name add_profile_payout_dsa_invoice_fields
npx prisma generate
```

### Step 2: Create SuperAdmin
```bash
npx ts-node create-superadmin.ts
```

---

## 🏃 Starting the Application

### Backend (Terminal 1)
```bash
cd backend
npm run dev
```
Backend runs on: http://localhost:5000

### Frontend (Terminal 2)
```bash
npm run dev
```
Frontend runs on: http://localhost:8080

---

## ✨ New Features Available

### 1. **Profile Management**
- Upload profile photo
- Update personal info
- Change password
- Configure company details (GST info)
- Dark/Light mode toggle

### 2. **Payout PDF Generation**
- SuperAdmin/Admin can download payout statements
- One click per month
- Professional formatted PDFs

### 3. **DSA Company Details**
- Add complete company information to DSAs
- Address, GSTIN, State details
- Used in invoice generation

### 4. **DSA Invoice Generation**
- Generate GST-compliant tax invoices
- Automatic commission calculation
- CGST/SGST breakdown
- Professional invoice format

---

## 📋 What to Do After Login

1. ✅ **Change Password** (Profile page)
2. ✅ **Configure Company Details** (Profile page - for invoices)
3. ✅ **Create Users** (Users page - Admin, BackOffice, Connector)
4. ✅ **Add Banks** (Banks & NBFC page)
5. ✅ **Setup DSAs** (Corporate DSA page - with company details)
6. ✅ **Start Managing Loans** (Customers page)

---

## 🔧 Troubleshooting

### Can't Login?
Run superadmin setup again: `setup-superadmin.bat`

### Database Error?
Check PostgreSQL is running and `.env` is configured correctly

### "Column does not exist" Error?
Run migrations: `npx prisma migrate dev`

### File Upload Fails?
Directories are auto-created, but if issues persist, create manually:
- `backend/public/uploads/profiles/`
- `backend/public/pdfs/payouts/`
- `backend/public/pdfs/invoices/`

---

## 📚 Documentation

- **Full Setup Guide:** [SUPERADMIN-SETUP-GUIDE.md](SUPERADMIN-SETUP-GUIDE.md)
- **Implementation Details:** [IMPLEMENTATION-COMPLETE.md](IMPLEMENTATION-COMPLETE.md)
- **Database Schema:** `backend/prisma/schema.prisma`

---

## 🎨 UI Theme

The application now supports:
- **Light Mode** ☀️
- **Dark Mode** 🌙
- **System** (auto-detect)

Toggle in header or Profile page.

---

**Ready to use! 🎉**
