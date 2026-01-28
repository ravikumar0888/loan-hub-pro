# Deployment Guide - LoanMS Application

Complete guide for deploying the LoanMS application to cPanel hosting.

## Prerequisites

- cPanel hosting with Node.js support
- PostgreSQL database access
- SSH or Terminal access (recommended)
- Domain: `dsaconnect.rudvirfinance.in`

---

## Part 1: Local Build & Preparation

### Step 1: Install Dependencies & Build Backend

```bash
cd F:\Rudvir\loan-hub-pro\backend

# Install dependencies (including date-fns)
npm install

# Generate Prisma Client
npx prisma generate

# Build TypeScript to JavaScript
npm run build
```

**Verify:** Check that `dist` folder is created with `index.js` inside.

### Step 2: Build Frontend

```bash
cd F:\Rudvir\loan-hub-pro

# Install dependencies
npm install

# Build for production
npm run build
```

**Verify:** Check that `dist` folder is created with `index.html` and `assets` folder inside.

---

## Part 2: Server Setup

### Step 3: Upload Files to cPanel

**Via cPanel File Manager:**

1. Navigate to `/home/kashton/dsaconnect.rudvirfinance.in/`

2. Create folder structure:
   ```
   /home/kashton/dsaconnect.rudvirfinance.in/
   └── loan-hub-pro/
       └── backend/
   ```

3. Upload backend files to `/home/kashton/dsaconnect.rudvirfinance.in/loan-hub-pro/backend/`:
   - `package.json`
   - `package-lock.json`
   - `prisma/` folder (entire folder)
   - `dist/` folder (entire folder from your build)
   - `node_modules/.prisma/` folder (generated Prisma client)
   - `node_modules/@prisma/` folder
   - `.env.production` file (rename to `.env` after upload)

4. Upload frontend files to `/home/kashton/dsaconnect.rudvirfinance.in/`:
   - All contents from `F:\Rudvir\loan-hub-pro\dist\` folder
   - This includes: `index.html`, `assets/`, and any other files

### Step 4: Configure Backend Environment

SSH/Terminal:
```bash
cd /home/kashton/dsaconnect.rudvirfinance.in/loan-hub-pro/backend

# Rename .env.production to .env
mv .env.production .env

# Edit .env file
nano .env
```

**Update these values in .env:**
```env
DATABASE_URL="postgresql://kashton_loanms:Rudransh@4240@localhost:5432/kashton_loanms?schema=public"
JWT_SECRET=your-secure-random-32-character-string-here
CORS_ORIGIN=https://dsaconnect.rudvirfinance.in
```

Save with `Ctrl+X`, `Y`, `Enter`.

### Step 5: Install Node.js Dependencies on Server

```bash
cd /home/kashton/dsaconnect.rudvirfinance.in/loan-hub-pro/backend

# Install dependencies
npm install --production

# Install date-fns specifically (if not already installed)
npm install date-fns
```

**Important:** If Prisma Client is not working, copy from local:
- Upload `node_modules/.prisma/` from local machine
- Upload `node_modules/@prisma/` from local machine

---

## Part 3: cPanel Configuration

### Step 6: Create Node.js Application

**cPanel → Setup Node.js App → Create Application**

| Setting | Value |
|---------|-------|
| Node.js version | `20.x` |
| Application mode | `Production` |
| Application root | `dsaconnect.rudvirfinance.in/loan-hub-pro/backend` |
| Application URL | `dsaconnect.rudvirfinance.in` |
| Application startup file | `dist/index.js` |

### Step 7: Add Environment Variables in cPanel

In the Node.js App interface, scroll down to "Environment variables" and add:

| Name | Value |
|------|-------|
| `DATABASE_URL` | `postgresql://kashton_loanms:Rudransh@4240@localhost:5432/kashton_loanms?schema=public` |
| `JWT_SECRET` | `your-secure-random-32-character-string` |
| `JWT_EXPIRES_IN` | `24h` |
| `CORS_ORIGIN` | `https://dsaconnect.rudvirfinance.in` |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |

### Step 8: Configure Domain

**cPanel → Domains**

- Find: `dsaconnect.rudvirfinance.in`
- Set **Document Root** to: `/home/kashton/dsaconnect.rudvirfinance.in`
- **No redirect** (leave empty)

### Step 9: Create .htaccess for Frontend

SSH/Terminal:
```bash
nano /home/kashton/dsaconnect.rudvirfinance.in/.htaccess
```

Add this content:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Proxy API requests to Node.js backend
  RewriteCond %{REQUEST_URI} ^/api/
  RewriteRule ^api/(.*)$ http://127.0.0.1:5000/api/$1 [P,L]

  # Frontend SPA routing - serve index.html for all non-file requests
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_URI} !^/api/
  RewriteRule ^ index.html [L]
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser caching for static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/woff2 "access plus 1 year"
</IfModule>
```

Save with `Ctrl+X`, `Y`, `Enter`.

---

## Part 4: Database Setup

### Step 10: Create Master Admin User

**Option A: Via SQL (cPanel → PostgreSQL)**

Run this SQL query:
```sql
INSERT INTO "users" (
    "id",
    "first_name",
    "last_name",
    "email",
    "mobile",
    "password_hash",
    "role",
    "is_active",
    "organization_id",
    "created_at",
    "updated_at"
) VALUES (
    gen_random_uuid(),
    'Master',
    'Admin',
    'admin@dsaconnect.rudvirfinance.in',
    '9999999999',
    '$2b$10$rICBHDE4Q6EIYU/GDwj.8OvlOXwcFtVQ5JJwjKdHqpVxXVxqXqXqW',
    'master_admin',
    true,
    NULL,
    NOW(),
    NOW()
);
```

**Default Login Credentials:**
- Email: `admin@dsaconnect.rudvirfinance.in`
- Password: `MasterAdmin@123`

**Option B: Via Script (if SSH available)**
```bash
cd /home/kashton/dsaconnect.rudvirfinance.in/loan-hub-pro/backend
npx ts-node create-master-admin.ts
```

---

## Part 5: Start Application

### Step 11: Start Node.js App

**cPanel → Setup Node.js App → Start** (or Restart)

### Step 12: Verify Backend is Running

SSH/Terminal:
```bash
# Check if process is running
ps aux | grep node | grep backend

# Check logs
tail -50 /home/kashton/nodevenv/dsaconnect.rudvirfinance.in/loan-hub-pro/backend/20/logs/passenger.log

# Test API endpoint
curl http://localhost:5000/health
```

Should return:
```json
{
  "success": true,
  "message": "LoanMS Backend API is running",
  "timestamp": "...",
  "environment": "production"
}
```

### Step 13: Test Application

Open in browser:
```
https://dsaconnect.rudvirfinance.in
```

You should see the login page.

Test API:
```
https://dsaconnect.rudvirfinance.in/api/health
```

---

## Part 6: Troubleshooting

### Issue: 503 Service Unavailable

**Check:**
```bash
# View recent logs
tail -100 /home/kashton/nodevenv/dsaconnect.rudvirfinance.in/loan-hub-pro/backend/20/logs/passenger.log

# Check if node process is running
ps aux | grep node
```

**Common causes:**
- Missing dependencies (run `npm install` in backend)
- Missing Prisma Client (upload from local or run `npx prisma generate`)
- Wrong environment variables
- Database connection failure

### Issue: Frontend 404 Error

**Check:**
```bash
# Verify files exist
ls -la /home/kashton/dsaconnect.rudvirfinance.in/index.html
ls -la /home/kashton/dsaconnect.rudvirfinance.in/assets/

# Verify .htaccess exists
cat /home/kashton/dsaconnect.rudvirfinance.in/.htaccess
```

**Fix:** Re-upload frontend dist files.

### Issue: API errors (date-fns not found)

**Fix:**
```bash
cd /home/kashton/dsaconnect.rudvirfinance.in/loan-hub-pro/backend
npm install date-fns
# Restart app in cPanel
```

### Issue: Database connection error

**Check:**
```bash
# Test database connection
cd /home/kashton/dsaconnect.rudvirfinance.in/loan-hub-pro/backend
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => console.log('Connected')).catch(e => console.error(e));"
```

**Fix:** Update `DATABASE_URL` in `.env` file with correct credentials.

### Issue: Cannot delete Node.js app in cPanel

**Fix:**
```bash
# Force cleanup
pkill -u kashton node
rm -rf /home/kashton/nodevenv/*
rm -rf /home/kashton/.cl-selector/*
```

Wait 2 minutes, then recreate the app.

---

## Part 7: File Permissions

Ensure correct permissions:
```bash
# Set proper permissions
chmod 755 /home/kashton/dsaconnect.rudvirfinance.in
chmod 644 /home/kashton/dsaconnect.rudvirfinance.in/.htaccess
chmod 644 /home/kashton/dsaconnect.rudvirfinance.in/index.html
chmod -R 755 /home/kashton/dsaconnect.rudvirfinance.in/assets

# Backend permissions
chmod 755 /home/kashton/dsaconnect.rudvirfinance.in/loan-hub-pro/backend
chmod 600 /home/kashton/dsaconnect.rudvirfinance.in/loan-hub-pro/backend/.env
```

---

## Local Development

To run locally:

### Backend:
```bash
cd F:\Rudvir\loan-hub-pro\backend
npm install
npx prisma generate
npm run dev
```

### Frontend:
```bash
cd F:\Rudvir\loan-hub-pro
npm install
npm run dev
```

Access at: `http://localhost:8080`

---

## Quick Reference

### Important Paths

| Location | Path |
|----------|------|
| Domain root | `/home/kashton/dsaconnect.rudvirfinance.in/` |
| Frontend files | `/home/kashton/dsaconnect.rudvirfinance.in/` |
| Backend app | `/home/kashton/dsaconnect.rudvirfinance.in/loan-hub-pro/backend/` |
| Backend logs | `/home/kashton/nodevenv/.../backend/20/logs/passenger.log` |
| Database | PostgreSQL on localhost:5432 |

### Important Commands

```bash
# Restart Node.js app
# Go to cPanel → Setup Node.js App → Restart

# View logs
tail -50 /home/kashton/nodevenv/dsaconnect.rudvirfinance.in/loan-hub-pro/backend/20/logs/passenger.log

# Check running processes
ps aux | grep node

# Test API
curl http://localhost:5000/health
curl https://dsaconnect.rudvirfinance.in/api/health
```

---

## Support

If you encounter issues:
1. Check the logs first
2. Verify all files are uploaded correctly
3. Ensure database credentials are correct
4. Contact cPanel support if Node.js app issues persist

**Contact:** Your hosting provider support team
