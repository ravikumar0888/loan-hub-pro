# How to Restart Backend Server

## The Issue

When you get errors like `Unknown argument 'panNo'`, it means the Prisma client needs to be regenerated after schema changes.

## Solution

You need to **stop the backend server** and regenerate the Prisma client:

### Step 1: Stop the Backend Server

Find the terminal window running the backend (showing `ts-node-dev`) and press:
```
Ctrl + C
```

### Step 2: Regenerate Prisma Client

```bash
cd backend
npm run prisma:generate
```

### Step 3: Restart the Backend

```bash
npm run dev
```

## Quick Command (All-in-One)

After stopping the server with Ctrl+C:

```bash
cd backend && npm run prisma:generate && npm run dev
```

## Why This Happens

- The Prisma schema file ([backend/prisma/schema.prisma](backend/prisma/schema.prisma)) was updated with new fields
- The database migration has already been applied (columns exist)
- But the Prisma Client (in `node_modules/.prisma/client`) is outdated
- When the server is running, it locks these files
- You need to stop the server, regenerate, and restart

## After Restarting

Your customer creation should work with all the new fields:
- PAN Number
- Date of Birth
- Personal Email
- Nominee Name, Relation, DOB
- Case Type
- PDF URL

The error `Unknown argument 'panNo'` will be resolved!
