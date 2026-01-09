# SuperAdmin Setup Guide

This guide will help you set up the SuperAdmin account for the Loan Management System.

## Prerequisites

Before setting up the SuperAdmin account, ensure you have:

1. ✅ PostgreSQL database running
2. ✅ Database connection configured in `backend/.env`
3. ✅ Run database migrations (see instructions below)

---

## Step 1: Run Database Migrations (CRITICAL)

**⚠️ IMPORTANT: This step MUST be completed first!**

The recent updates added new database fields and tables that don't exist yet. Run the migration:

```bash
cd backend
npx prisma migrate dev --name add_profile_payout_dsa_invoice_fields
npx prisma generate
```

This will:
- Create new columns in User table (profilePhoto, company details, GST fields)
- Create new columns in Dsa table (company details)
- Create PayoutPDF table
- Create DsaInvoice table

**If you skip this step, the application will crash!**

---

## Step 2: Create SuperAdmin Account

### Option A: Using the Batch Script (Easiest)

1. Open the `backend` folder
2. Double-click `setup-superadmin.bat`
3. The script will create or update the SuperAdmin account

### Option B: Using Command Line

```bash
cd backend
npx ts-node create-superadmin.ts
```

---

## SuperAdmin Credentials

After running the setup script, use these credentials to log in:

**Email:** `superadmin@loanms.com`
**Password:** `Admin@123`

⚠️ **IMPORTANT SECURITY NOTICE:**
- Change the password immediately after first login
- Use the Profile page to update your password and company details

---

## What Can SuperAdmin Do?

The SuperAdmin role has full access to all features:

### ✅ Access to All Pages:
- **Dashboard** - Overview of all activities
- **Customers** - View all customer loan applications
- **Banks & NBFC** - Manage banks and NBFC partners
- **Users** - Create/manage Admin, BackOffice, and Connector users
- **Corporate DSA** - Manage DSA partnerships with company details
- **Reports** - Generate comprehensive reports
- **Payouts** - Manage connector payouts and generate payout PDFs
- **DSA Invoices** - Generate GST-compliant invoices for DSA commissions
- **Profile** - Manage personal and company information

### ✅ Special Permissions:
- Create other admins and users
- Delete banks and DSAs
- Generate payout PDFs
- Generate DSA invoices
- Access all financial reports
- Configure company GST details in profile

---

## Configuring Company Details (Important for Invoices)

After logging in as SuperAdmin, configure your company details for proper invoice generation:

1. Go to **Profile** page
2. Scroll to **Company Details** section
3. Fill in:
   - **Company Name** (e.g., "RUDVIR Financial Services")
   - **Company Address**
   - **GSTIN/UIN** (15-character GST number)
   - **State** and **State Code**
   - **Company Email**
   - **HSN/SAC** (default: 997159 for financial services)
   - **CGST Rate** (default: 9%)
   - **SGST/UTGST Rate** (default: 9%)

These details will appear on:
- Payout PDFs
- DSA Tax Invoices

---

## Creating Additional Users

As SuperAdmin, you can create other user types:

### 1. Admin Users
- Can access most features except bank/DSA management
- Can generate reports and invoices
- Can manage connectors and payouts

### 2. BackOffice Users
- Can manage customers
- Can view dashboard and reports
- Cannot manage users or generate invoices

### 3. Connector Users
- Can view their own customers
- Can view their payout balance and transactions
- Cannot generate PDFs or access invoices

To create users:
1. Go to **Users** page
2. Click "Add User"
3. Fill in details and select role
4. User will receive login credentials

---

## Testing the New Features

### Test Profile Management:
1. Log in as SuperAdmin
2. Go to Profile page
3. Upload a profile photo
4. Update company details
5. Change password
6. Toggle between Light/Dark mode

### Test Payout PDF Generation:
1. Go to Payouts page
2. Select a connector with transactions
3. Click the PDF button for any month
4. PDF will be generated and downloaded

### Test DSA Invoice Generation:
1. Ensure you have DSA configured with company details
2. Ensure DSA has disbursed customers for a month
3. Go to DSA Invoices page
4. Click "Generate Invoice"
5. Select DSA, month, and year
6. Invoice will be generated with GST calculations

### Test DSA Company Details:
1. Go to Corporate DSA page
2. Edit an existing DSA or create new one
3. Fill in company details (address, GSTIN, etc.)
4. These details will appear on invoices

---

## Troubleshooting

### "Column does not exist" Error
**Problem:** Database migration not run
**Solution:** Run the migration commands from Step 1

### Cannot Login
**Problem:** SuperAdmin not created or wrong credentials
**Solution:** Run `setup-superadmin.bat` again to reset password

### Profile Photo Upload Fails
**Problem:** Upload directory doesn't exist
**Solution:** Create directory: `backend/public/uploads/profiles/`

### Invoice Generation Fails with "No commission found"
**Problem:** No disbursed customers for the selected DSA and period
**Solution:** Ensure DSA has customers with status "disbursed" in the selected month/year

### PDF Download Fails
**Problem:** PDF directory doesn't exist
**Solution:** Create directories:
- `backend/public/pdfs/payouts/`
- `backend/public/pdfs/invoices/`

---

## Security Recommendations

1. **Change Default Password:** Update SuperAdmin password immediately after first login
2. **Use Strong Passwords:** Require minimum 8 characters with mixed case, numbers, and symbols
3. **Regular Backups:** Backup the PostgreSQL database regularly
4. **Secure Company Details:** Keep GSTIN and company information confidential
5. **Monitor Access:** Review user activities regularly through reports
6. **Update Profile Photo:** Add a professional photo to identify the admin easily

---

## Support

If you encounter any issues during setup:

1. Check that PostgreSQL is running: `psql -U postgres -l`
2. Verify database connection in `backend/.env`
3. Ensure migrations are run completely
4. Check backend logs in `backend/logs/` folder

For additional help, refer to the main README.md or contact support.

---

## Next Steps After Setup

1. ✅ Log in with SuperAdmin credentials
2. ✅ Change default password
3. ✅ Configure company details in Profile
4. ✅ Create Admin and BackOffice users
5. ✅ Add Banks and NBFCs
6. ✅ Set up DSA partners with company details
7. ✅ Create Connector users
8. ✅ Start managing customer loan applications

---

**Generated with Claude Code**
Last Updated: January 2026
