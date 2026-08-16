# LoanMS Security & Performance Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the P0 (critical) and P1 (high) security and performance findings from the 2026-08-16 audit of the LoanMS backend (Express/Prisma/Postgres) and frontend (React/Vite), without changing UI, removing functionality, or altering business logic beyond what each fix strictly requires.

**Architecture:** No test suite exists in this repo (confirmed in CLAUDE.md) — verification per task uses `npx tsc --noEmit`, `npm run build`, `npm run lint`, and targeted `curl`/manual checks instead of `pytest`/`jest`-style automated tests. Each task is independently committable and independently verifiable.

**Tech Stack:** Express 4, TypeScript, Prisma 5 + PostgreSQL, express-rate-limit, multer, React 18 + Vite + TanStack Query + shadcn/ui.

**Scope:** P0 (6 tasks) + P1 (11 tasks) = 17 tasks. P2/P3 items from the audit are listed in the Backlog appendix at the end and are explicitly out of scope for this plan (per user instruction: "fix P0 and P1 first").

---

## Task 1 (P0): Untrack committed secrets from git

**Files:**
- Modify: `.gitignore`
- Remove from tracking: `.env`, `.env.production`, `backend/.env`, `backend/.env.production`

**Context:** `git ls-files | grep env` confirms these 4 files are currently tracked with live, non-placeholder credentials (verified directly, not just from audit). Root `.gitignore` has no `.env` rule at all (that's why root `.env`/`.env.production` got committed); `backend/.gitignore` has the rule but it doesn't retroactively untrack already-committed files. Per user decision: untrack going forward only, do not rewrite git history. **Secret rotation (new DB password, new JWT_SECRET) is the user's responsibility outside this repo — this task does not and cannot do that.**

- [ ] **Step 1: Add env rules to root .gitignore**

Add to `f:\Rudvir\loan-hub-pro\.gitignore`:
```
# Environment files
.env
.env.local
.env.production
.env.*.local
```

- [ ] **Step 2: Untrack the 4 files (keeps them on disk, stops git from tracking future changes)**

```bash
git rm --cached .env .env.production backend/.env backend/.env.production
```

- [ ] **Step 3: Verify they're gone from tracking but still exist on disk**

Run: `git status` — expect the 4 files listed as deleted (staged) and, separately, `git ls-files | grep env` should no longer list them.
Run: `Test-Path backend/.env` equivalent (`ls backend/.env`) — file must still physically exist so the running app doesn't break.

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore(security): stop tracking .env files with live credentials

Files remain on disk; only removed from git tracking going forward.
DB password and JWT_SECRET still need to be rotated by the operator
and git history still contains the old values — history was
intentionally left untouched per explicit decision."
```

---

## Task 2 (P0): Fix command injection / RCE in database backup

**Files:**
- Modify: `backend/src/services/backup.service.ts`

**Context:** `generateBackup()` builds a shell command string via `exec()` that embeds `host`/`port`/`user`/`database` (from `DATABASE_URL`, server-controlled) and `filePath` (built from user-supplied `savePath`, reachable by any org-level `superadmin` via `POST /api/backup/download`). Because `exec()` runs through a shell, a `filePath` containing a `"` breaks out of the quoted `-f` argument and injects arbitrary shell commands. Fix: switch to `execFile()`, which spawns the binary directly with an argument array and never invokes a shell — this makes injection structurally impossible regardless of what `savePath` contains.

- [ ] **Step 1: Replace `exec` with `execFile` and drop shell quoting**

In `backend/src/services/backup.service.ts`, change the import on line 1:
```typescript
import { execFile } from 'child_process';
```

Replace `findPgDump()` (lines 30-67) — remove the `"..."` shell-quoting since `execFile` needs a raw path, not a shell-escaped one:
```typescript
  private findPgDump(): string {
    // 1. Check env variable
    if (process.env.PG_BIN_PATH) {
      const pgDump = path.join(process.env.PG_BIN_PATH, 'pg_dump');
      if (fs.existsSync(pgDump)) return pgDump;
      if (fs.existsSync(pgDump + '.exe')) return pgDump + '.exe';
    }

    // 2. Auto-detect on Windows - check common PostgreSQL install paths
    if (process.platform === 'win32') {
      const programFiles = [
        process.env['ProgramFiles'] || 'C:\\Program Files',
        process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)',
      ];

      for (const pf of programFiles) {
        const pgDir = path.join(pf, 'PostgreSQL');
        if (fs.existsSync(pgDir)) {
          try {
            const versions = fs.readdirSync(pgDir).sort((a, b) => Number(b) - Number(a));
            for (const ver of versions) {
              const pgDump = path.join(pgDir, ver, 'bin', 'pg_dump.exe');
              if (fs.existsSync(pgDump)) {
                logger.info(`Found pg_dump at: ${pgDump}`);
                return pgDump;
              }
            }
          } catch (e) {
            // continue searching
          }
        }
      }
    }

    // 3. Fallback to bare command (works if pg_dump is in PATH)
    return 'pg_dump';
  }
```

Replace the command-building and `exec()` call inside `generateBackup()` (lines 92-121):
```typescript
    // Find pg_dump executable
    const pgDump = this.findPgDump();

    return new Promise((resolve, reject) => {
      const env = { ...process.env, PGPASSWORD: password };
      const args = ['-h', host, '-p', port, '-U', user, '-d', database, '-F', 'p', '-f', filePath];

      execFile(pgDump, args, { env, timeout: 120000 }, (error, stdout, stderr) => {
        if (error) {
          logger.error('Backup failed:', error.message);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          reject(new Error(`Backup failed: ${error.message}`));
          return;
        }

        if (!fs.existsSync(filePath)) {
          reject(new Error('Backup file was not created'));
          return;
        }

        const fileSize = fs.statSync(filePath).size;
        const sizeMB = (fileSize / (1024 * 1024)).toFixed(2);
        logger.info(`Database backup created: ${filePath} (${sizeMB} MB)`);
        resolve({ filePath, fileName });
      });
    });
```

Also change `savePath` handling right above it to resolve to an absolute path first (defense in depth, not the primary fix):
```typescript
    // Validate and prepare save directory
    const resolvedSavePath = path.resolve(savePath);
    if (!fs.existsSync(resolvedSavePath)) {
      fs.mkdirSync(resolvedSavePath, { recursive: true });
    }

    const stat = fs.statSync(resolvedSavePath);
    if (!stat.isDirectory()) {
      throw new Error('The specified path is not a valid directory');
    }

    // Generate filename with timestamp
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `backup_${database}_${timestamp}.sql`;
    const filePath = path.join(resolvedSavePath, fileName);
```

- [ ] **Step 2: Compile check**

Run: `cd backend && npx tsc --noEmit`
Expected: no new errors related to `backup.service.ts`.

- [ ] **Step 3: Manual verification (requires pg_dump available and DB reachable)**

With the backend running and logged in as an org superadmin:
```bash
curl -X POST http://localhost:5000/api/backup/download \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"savePath":"./backend/tmp-backup-test"}'
```
Expected: `{"success":true,"data":{"filePath":"...","fileName":"backup_....sql"}}` and the file exists on disk with real SQL content. Also confirm a malicious payload no longer executes anything:
```bash
curl -X POST http://localhost:5000/api/backup/download \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"savePath":"./backend/tmp-backup-test\" ; touch ./backend/pwned ; echo \""}'
```
Expected: either a filesystem error (invalid directory name) or a backup created inside a literally-named directory — and **`backend/pwned` must NOT be created**.

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/backup.service.ts
git commit -m "fix(security): eliminate command injection in DB backup via execFile

exec() interpolated an attacker-influenced savePath into a shell
command string; execFile() spawns pg_dump directly with an argument
array, so shell metacharacters in savePath can no longer break out
into arbitrary command execution."
```

---

## Task 3 (P0): Fix cross-tenant IDOR in DSA invoice generation

**Files:**
- Modify: `backend/src/services/dsaInvoice.service.ts`
- Modify: `backend/src/controllers/dsaInvoice.controller.ts`

**Context:** `generateDsaInvoice(dsaId, ...)` and the `calculateDsaCommission`/`dsa.findUnique` calls it makes never check that `dsaId` belongs to the caller's organization. Any `admin`/`superadmin` can pass any tenant's DSA UUID and get that tenant's commission data plus a persisted invoice. Every other method in this file (`getInvoices`, `getInvoiceById`) already does this check correctly — this brings `generateDsaInvoice` in line with the rest of the file.

- [ ] **Step 1: Add the org check to `generateDsaInvoice`, reusing the DSA fetch that already happens later in the function**

In `backend/src/services/dsaInvoice.service.ts`, replace the `generateDsaInvoice` method (lines 102-148) with:
```typescript
  async generateDsaInvoice(
    dsaId: string,
    month: number,
    year: number,
    issuedById: string,
    userRole: string,
    organizationId: string | null
  ) {
    // 0. Fetch DSA and verify it belongs to the caller's organization
    const dsa = await prisma.dsa.findUnique({
      where: { id: dsaId },
      include: {
        bankDetails: {
          include: {
            bank: true,
          },
        },
      },
    });

    if (!dsa) {
      throw new Error('DSA not found');
    }

    if (userRole !== 'master_admin' && organizationId && dsa.organizationId !== organizationId) {
      throw new Error('Access denied: DSA does not belong to your organization');
    }

    // 1. Calculate commission (taxable amount)
    const taxableAmount = await this.calculateDsaCommission(dsaId, month, year);

    if (taxableAmount === 0) {
      throw new Error('No commission found for the selected period');
    }

    // 2. Get issuer (admin) details for GST rates and HSN/SAC
    const issuer = await prisma.user.findUnique({
      where: { id: issuedById },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        companyName: true,
        companyAddress: true,
        companyGSTIN: true,
        companyState: true,
        companyStateCode: true,
        companyEmail: true,
        hsnSac: true,
        cgstRate: true,
        sgstRate: true,
      },
    });

    if (!issuer) {
      throw new Error('Issuer not found');
    }

    // 3. Use admin's GST configuration or defaults
    const cgstRate = issuer.cgstRate || new Prisma.Decimal(9);
    const sgstRate = issuer.sgstRate || new Prisma.Decimal(9);
    const hsnSac = issuer.hsnSac || '997159';

    // 4. Calculate taxes
    const cgstAmount = (taxableAmount * Number(cgstRate)) / 100;
    const sgstAmount = (taxableAmount * Number(sgstRate)) / 100;
    const subtotal = taxableAmount + cgstAmount + sgstAmount;
    const roundOff = Math.round(subtotal) - subtotal;
    const totalAmount = Math.round(subtotal);

    // 5. Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    // 6. Check if invoice already exists for this period
    const existingInvoice = await prisma.dsaInvoice.findFirst({
      where: {
        dsaId,
        period_month: month,
        period_year: year,
      },
    });

    if (existingInvoice) {
      throw new Error('Invoice already exists for this period');
    }

    // 7. Create invoice record
    const invoice = await prisma.dsaInvoice.create({
      data: {
        invoiceNumber,
        dsaId,
        issuedById,
        invoiceDate: new Date(),
        period_month: month,
        period_year: year,
        taxableAmount: new Prisma.Decimal(taxableAmount),
        cgstRate,
        cgstAmount: new Prisma.Decimal(cgstAmount),
        sgstRate,
        sgstAmount: new Prisma.Decimal(sgstAmount),
        roundOff: new Prisma.Decimal(roundOff),
        totalAmount: new Prisma.Decimal(totalAmount),
        hsnSac,
      },
      include: {
        dsa: true,
        issuedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            companyName: true,
            companyAddress: true,
            companyGSTIN: true,
            companyState: true,
            companyStateCode: true,
            companyEmail: true,
          },
        },
      },
    });

    // 8. Generate PDF
    const { DsaInvoicePdfGenerator } = await import('../utils/dsaInvoicePdfGenerator');
    const pdfPath = await DsaInvoicePdfGenerator.generateInvoicePDF(invoice);

    // 9. Update invoice with PDF URL
    const updatedInvoice = await prisma.dsaInvoice.update({
      where: { id: invoice.id },
      data: { pdfUrl: pdfPath },
      include: {
        dsa: true,
        issuedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            companyName: true,
            companyAddress: true,
            companyGSTIN: true,
            companyState: true,
            companyStateCode: true,
            companyEmail: true,
          },
        },
      },
    });

    return updatedInvoice;
  }
```

(This removes the old duplicate `dsa.findUnique` call that used to be step 3 — it's now done once, up front, with the org check attached.)

- [ ] **Step 2: Pass role + organizationId from the controller**

In `backend/src/controllers/dsaInvoice.controller.ts`, update the `generateInvoice` method's service call (around line 32):
```typescript
      const invoice = await dsaInvoiceService.generateDsaInvoice(
        dsaId,
        parseInt(month),
        parseInt(year),
        req.user.userId,
        req.user.role,
        req.organizationId
      );
```

- [ ] **Step 3: Compile check**

Run: `cd backend && npx tsc --noEmit` — expect no errors.

- [ ] **Step 4: Manual verification**

Log in as an admin/superadmin in Org A, find a DSA `id` belonging to Org B (via DB/Prisma Studio), then:
```bash
curl -X POST http://localhost:5000/api/dsa-invoices \
  -H "Authorization: Bearer $ORG_A_TOKEN" -H "Content-Type: application/json" \
  -d '{"dsaId":"<ORG_B_DSA_ID>","month":1,"year":2026}'
```
Expected: `403`/error `"Access denied: DSA does not belong to your organization"`, not a created invoice. Then repeat with a DSA that genuinely belongs to Org A's own org — expect success as before.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/dsaInvoice.service.ts backend/src/controllers/dsaInvoice.controller.ts
git commit -m "fix(security): enforce org ownership check before generating DSA invoice

generateDsaInvoice never verified the target DSA belonged to the
caller's organization, letting any admin/superadmin pull another
tenant's commission data and create an invoice against it."
```

---

## Task 4 (P0): Fail fast on missing/default JWT_SECRET

**Files:**
- Modify: `backend/src/utils/jwt.ts`

**Context:** `JWT_SECRET` silently falls back to the hardcoded string `'default-secret-change-in-production'` if the env var is unset — and `backend/.env.production` currently ships with exactly that value (a separate, already-flagged issue the user must fix operationally). Anyone who knows this default can forge a valid token for any user, including `master_admin`. The code should refuse to start rather than silently run insecurely.

- [ ] **Step 1: Throw at module load if JWT_SECRET is missing or equals the known default**

Replace the top of `backend/src/utils/jwt.ts`:
```typescript
import jwt from 'jsonwebtoken';
import { AuthUser } from '../types';

const INSECURE_DEFAULT_SECRET = 'default-secret-change-in-production';
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET === INSECURE_DEFAULT_SECRET) {
  throw new Error(
    'JWT_SECRET environment variable must be set to a strong, unique value before starting the server. ' +
    'Refusing to start with an unset or default secret, as this allows tokens to be forged for any user.'
  );
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export const generateToken = (payload: AuthUser): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
};

export const verifyToken = (token: string): AuthUser => {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const generatePasswordResetToken = (): string => {
  return require('crypto').randomBytes(32).toString('hex');
};
```

Note: `generatePasswordResetToken` is also changed here (needed by Task 12) — it no longer signs a JWT (which had a real collision risk: identical-second requests produced byte-identical tokens under HS256) and instead returns a 32-byte random hex string, which is what `PasswordResetToken.token` was always designed to store as an opaque, DB-verified value (see `auth.service.ts` — it only ever does `prisma.passwordResetToken.findUnique({where:{token}})`, never `jwt.verify`s this token).

- [ ] **Step 2: Confirm current backend/.env has a real (non-default) JWT_SECRET so local dev doesn't break**

Run: `grep -c "JWT_SECRET=default-secret-change-in-production" backend/.env` — must be `0`. (Already confirmed non-default during the audit; this step is just a guard before restart.)

- [ ] **Step 3: Compile + boot check**

Run: `cd backend && npx tsc --noEmit`
Run: `cd backend && npm run dev` briefly and confirm it boots without throwing, then stop it. If it throws, `backend/.env`'s `JWT_SECRET` needs to be set to a real value before continuing (expected/safe failure mode, not a bug in this change).

- [ ] **Step 4: Commit**

```bash
git add backend/src/utils/jwt.ts
git commit -m "fix(security): fail fast on missing/default JWT_SECRET, use random reset tokens

Previously the app silently ran with a hardcoded fallback JWT secret
if JWT_SECRET was unset, allowing forged tokens for any role. Also
switches password-reset tokens from a signed JWT (deterministic per
second, so two requests in the same second collided) to a random
32-byte hex string, matching how it's actually consumed (opaque
DB lookup, never jwt.verify'd)."
```

**⚠️ Deployment note (put in final report, not silently applied):** `backend/.env.production` currently contains the same insecure default JWT_SECRET (confirmed during audit, value not reproduced here). After this change ships, the production server **will refuse to start** until a real, unique `JWT_SECRET` is set there. This must happen before/during deployment of this branch, not after.

---

## Task 5 (P0): Stop serving generated PDFs and uploads via open static hosting

**Files:**
- Modify: `backend/src/app.ts`
- Create: `backend/src/utils/pdfOwnership.ts`
- Create: `backend/src/routes/files.routes.ts`
- Create: `backend/src/controllers/files.controller.ts`
- Modify: `backend/src/controllers/invoices.controller.ts`
- Create: `src/lib/downloadFile.ts`
- Modify: `src/pages/Payouts.tsx`, `src/pages/DsaInvoices.tsx`, `src/components/customer/CustomerFormDialog.tsx`, `src/pages/MasterAdmin/BillingTab.tsx`

**Context:** `app.ts` mounts `express.static` on `/pdfs` and `/uploads` with zero authentication (lines 60-61). Every payout statement, DSA invoice, customer PDF, and profile photo is reachable by anyone with the URL — no login required. `window.open()` (used everywhere PDFs are opened) can't attach an `Authorization` header, so the fix can't just be "add `authenticate` in front of the static mount" (that would 401 every existing "view PDF" click, breaking working functionality). Instead: fetch the file as an authenticated `Blob` (which *can* carry the header, since it's a `fetch()` call, not a browser navigation) and hand that blob to a tab opened synchronously on click (avoids popup-blocker issues from the async gap).

- [ ] **Step 1: Remove the open static mounts**

In `backend/src/app.ts`, delete lines 59-61:
```typescript
// Static files (for uploads and PDFs)
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));
app.use('/pdfs', express.static(path.join(process.cwd(), 'public/pdfs')));
```
Replace with a mount for the new authenticated router (add near the other route mounts, after the `authenticate`/`organizationContext` imports already at the top):
```typescript
import filesRoutes from './routes/files.routes';
```
and, in the protected-routes section:
```typescript
app.use('/api/files', filesRoutes);
```

- [ ] **Step 2: Add the ownership resolver**

Create `backend/src/utils/pdfOwnership.ts`:
```typescript
import prisma from '../config/database';

/**
 * Resolves which organization owns a generated file, by exact pdfUrl match
 * across the tables that persist one. Returns null if no record references
 * this path (caller should treat that as 404, not "no restriction").
 */
export async function resolveFileOwnerOrgId(relativePath: string): Promise<string | null> {
  const customer = await prisma.customer.findFirst({
    where: { pdfUrl: relativePath },
    select: { organizationId: true },
  });
  if (customer) return customer.organizationId;

  const dsaInvoice = await prisma.dsaInvoice.findFirst({
    where: { pdfUrl: relativePath },
    select: { dsa: { select: { organizationId: true } } },
  });
  if (dsaInvoice) return dsaInvoice.dsa.organizationId;

  const payoutPdf = await prisma.payoutPDF.findFirst({
    where: { pdfUrl: relativePath },
    select: { users_payout_pdfs_connector_idTousers: { select: { organizationId: true } } },
  });
  if (payoutPdf) return payoutPdf.users_payout_pdfs_connector_idTousers.organizationId;

  return null;
}
```

- [ ] **Step 3: Add the authenticated streaming controller + route for PDFs and uploads**

Create `backend/src/controllers/files.controller.ts`:
```typescript
import { Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../types';
import { resolveFileOwnerOrgId } from '../utils/pdfOwnership';

const PDFS_ROOT = path.join(process.cwd(), 'public', 'pdfs');
const UPLOADS_ROOT = path.join(process.cwd(), 'public', 'uploads');

function safeResolve(root: string, relativePath: string): string | null {
  const normalized = relativePath.replace(/^\/+/, '');
  const resolved = path.resolve(root, normalized);
  if (!resolved.startsWith(root)) return null; // path traversal attempt
  return resolved;
}

export class FilesController {
  async getPdf(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestedPath = String(req.query.path || '');
      if (!requestedPath.startsWith('/pdfs/')) {
        res.status(400).json({ success: false, error: 'Invalid path' });
        return;
      }

      const ownerOrgId = await resolveFileOwnerOrgId(requestedPath);
      if (!ownerOrgId) {
        res.status(404).json({ success: false, error: 'File not found' });
        return;
      }

      const isMasterAdmin = req.user?.role === 'master_admin';
      if (!isMasterAdmin && ownerOrgId !== req.organizationId) {
        res.status(403).json({ success: false, error: 'Access denied' });
        return;
      }

      const relativeToRoot = requestedPath.replace(/^\/pdfs\//, '');
      const filePath = safeResolve(PDFS_ROOT, relativeToRoot);
      if (!filePath || !fs.existsSync(filePath)) {
        res.status(404).json({ success: false, error: 'File not found' });
        return;
      }

      res.type('application/pdf');
      res.sendFile(filePath);
    } catch (error: any) {
      next(error);
    }
  }

  async getUpload(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestedPath = String(req.query.path || '');
      if (!requestedPath.startsWith('/uploads/')) {
        res.status(400).json({ success: false, error: 'Invalid path' });
        return;
      }

      // Uploads today are profile photos only; any authenticated user may
      // view them (same trust level as before, minus fully-anonymous access).
      const relativeToRoot = requestedPath.replace(/^\/uploads\//, '');
      const filePath = safeResolve(UPLOADS_ROOT, relativeToRoot);
      if (!filePath || !fs.existsSync(filePath)) {
        res.status(404).json({ success: false, error: 'File not found' });
        return;
      }

      res.sendFile(filePath);
    } catch (error: any) {
      next(error);
    }
  }
}

export const filesController = new FilesController();
```

Create `backend/src/routes/files.routes.ts`:
```typescript
import { Router } from 'express';
import { filesController } from '../controllers/files.controller';
import { authenticate } from '../middleware/auth';
import { organizationContext } from '../middleware/organizationContext';

const router = Router();

router.use(authenticate);
router.use(organizationContext);

router.get('/pdf', filesController.getPdf.bind(filesController));
router.get('/upload', filesController.getUpload.bind(filesController));

export default router;
```

- [ ] **Step 4: Make the org-invoice download stream the PDF directly instead of returning a static URL**

In `backend/src/controllers/invoices.controller.ts`, replace `downloadInvoice` (around lines 93-110):
```typescript
  async downloadInvoice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const pdfPath = await invoicesService.generateInvoicePDF(
        id,
        req.user?.role,
        req.organizationId
      );

      const path = await import('path');
      const fs = await import('fs');
      const filePath = path.join(process.cwd(), 'public', pdfPath.replace(/^\//, ''));

      if (!fs.existsSync(filePath)) {
        res.status(404).json({ success: false, error: 'Generated PDF not found' });
        return;
      }

      res.type('application/pdf');
      res.sendFile(filePath);
    } catch (error: any) {
      next(error);
```
(`generateInvoicePDF` already performs the role/org check — this task only changes how the *result* is delivered, not who is allowed to call it.)

- [ ] **Step 5: Add a frontend helper that opens a tab synchronously, then fills it with an authenticated blob**

Create `src/lib/downloadFile.ts`:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthToken = (): string | null => localStorage.getItem('auth_token');

/**
 * Opens a blank tab synchronously (so browsers don't treat it as a popup),
 * then fetches the resource with the auth header and navigates the tab to
 * an object URL for it. Use for any PDF/file that used to be a plain
 * window.open(staticUrl) call.
 */
export async function openAuthenticatedFile(relativePath: string): Promise<void> {
  const tab = window.open('', '_blank');
  const token = getAuthToken();

  const isUpload = relativePath.startsWith('/uploads/');
  const endpoint = isUpload ? '/files/upload' : '/files/pdf';

  try {
    const response = await fetch(`${API_URL}${endpoint}?path=${encodeURIComponent(relativePath)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      if (tab) tab.close();
      throw new Error('Failed to load file');
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    if (tab) {
      tab.location.href = blobUrl;
    }
  } catch (error) {
    if (tab) tab.close();
    throw error;
  }
}

/**
 * Same pattern, but for endpoints that stream the PDF directly
 * (e.g. GET /invoices/:id/download) rather than a static /pdfs path.
 */
export async function openAuthenticatedEndpoint(endpointPath: string): Promise<void> {
  const tab = window.open('', '_blank');
  const token = getAuthToken();

  try {
    const response = await fetch(`${API_URL}${endpointPath}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      if (tab) tab.close();
      throw new Error('Failed to load file');
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    if (tab) {
      tab.location.href = blobUrl;
    }
  } catch (error) {
    if (tab) tab.close();
    throw error;
  }
}
```

- [ ] **Step 6: Update the 4 frontend call sites**

`src/pages/Payouts.tsx` — replace the block around lines 228-235 (was: build `pdfUrl` string, `window.open(pdfUrl, '_blank')`) with:
```typescript
      await openAuthenticatedFile(result.data.pdfUrl);
```
(add `import { openAuthenticatedFile } from '@/lib/downloadFile';` at the top; remove the now-unused `apiUrl`/`baseUrl`/`pdfPath` construction lines).

`src/pages/DsaInvoices.tsx` — same replacement around lines 167-176:
```typescript
    if (invoice.pdfUrl) {
      await openAuthenticatedFile(invoice.pdfUrl);
    }
```
(add the same import; remove the manual URL-building lines).

`src/components/customer/CustomerFormDialog.tsx` — same replacement around lines 1191-1207 and 1225-1238: wherever the code builds `pdfUrl` from `customer.pdfUrl` or `response.data.pdfUrl` and calls `window.open`, replace with `await openAuthenticatedFile(customer.pdfUrl)` / `await openAuthenticatedFile(response.data.pdfUrl)`.

`src/pages/MasterAdmin/BillingTab.tsx` — around lines 104-111, the org-invoice download now streams directly from `GET /invoices/:id/download` (Step 4) instead of returning JSON with a static `pdfUrl`. Replace the block with:
```typescript
      await openAuthenticatedEndpoint(`/invoices/${invoice.id}/download`);
```
(remove the old `apiRequest` call that expected `{data:{pdfUrl}}`, and the manual `pdfUrl`/`window.open` construction; add `import { openAuthenticatedEndpoint } from '@/lib/downloadFile';`).

- [ ] **Step 7: Compile checks**

Run: `cd backend && npx tsc --noEmit`
Run: `npx tsc --noEmit` (frontend, from repo root)
Run: `npm run build` (frontend) — must succeed with no new errors.

- [ ] **Step 8: Manual verification**

With both servers running:
```bash
# Previously-open static path must now be gone
curl -i http://localhost:5000/pdfs/some-existing-file.pdf
# Expected: 404 (route no longer exists)

# New authenticated route without a token must be rejected
curl -i "http://localhost:5000/api/files/pdf?path=/pdfs/some-existing-file.pdf"
# Expected: 401

# With a valid token for the owning org, must succeed
curl -i "http://localhost:5000/api/files/pdf?path=/pdfs/some-existing-file.pdf" \
  -H "Authorization: Bearer $TOKEN_FOR_OWNING_ORG"
# Expected: 200, Content-Type: application/pdf

# With a valid token for a DIFFERENT org, must be denied
curl -i "http://localhost:5000/api/files/pdf?path=/pdfs/some-existing-file.pdf" \
  -H "Authorization: Bearer $TOKEN_FOR_OTHER_ORG"
# Expected: 403
```
Then in the browser: log in, generate/view a payout PDF, a DSA invoice PDF, a customer PDF, and (as master_admin) an org invoice PDF — each must still open in a new tab exactly as before.

- [ ] **Step 9: Commit**

```bash
git add backend/src/app.ts backend/src/utils/pdfOwnership.ts backend/src/routes/files.routes.ts backend/src/controllers/files.controller.ts backend/src/controllers/invoices.controller.ts src/lib/downloadFile.ts src/pages/Payouts.tsx src/pages/DsaInvoices.tsx src/components/customer/CustomerFormDialog.tsx src/pages/MasterAdmin/BillingTab.tsx
git commit -m "fix(security): require auth + org ownership to view generated PDFs

/pdfs and /uploads were served via express.static with zero auth,
so any payout statement, invoice, or customer PDF was downloadable
by anyone with the URL. Replaced with an authenticated, org-scoped
streaming route; frontend now fetches PDFs as an authenticated blob
into a synchronously-opened tab instead of navigating directly to
the static path, preserving the existing 'opens in new tab' UX."
```

---

## Task 6 (P0): Stop disabling the TanStack Query cache app-wide

**Files:**
- Modify: `src/App.tsx`

**Context:** `staleTime: 0, gcTime: 0` plus all three `refetchOn*` flags means every mount and every tab-focus re-fetches everything from the network — the cache provides zero benefit, multiplying backend load. This compounds every other frontend performance issue in this plan.

- [ ] **Step 1: Set sane cache defaults**

In `src/App.tsx`, replace lines 31-42:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,       // Data considered fresh for 30s
      gcTime: 5 * 60 * 1000,      // Keep unused data cached for 5 minutes
      refetchOnMount: true,       // Still refetch stale data on mount
      refetchOnWindowFocus: true, // Still refetch stale data on focus
      refetchOnReconnect: true,   // Still refetch stale data on reconnect
      retry: 1,
    },
  },
});
```
This is a floor, not a ceiling: `refetchOnMount`/`refetchOnWindowFocus` still refetch, but only when data is actually stale (>30s old) rather than unconditionally — so any screen that genuinely needs fresher data can still override `staleTime` per-query without being fought by the global default.

- [ ] **Step 2: Compile + smoke check**

Run: `npx tsc --noEmit` and `npm run build` from repo root — must succeed.

- [ ] **Step 3: Manual verification**

Run `npm run dev`, open the Network tab, navigate between Dashboard → Customers → Dashboard within 30 seconds. Expected: the second visit to Dashboard does not re-issue the same GET requests (served from cache); after 30+ seconds, or after a real data-changing action (create/update), it does refetch. Confirm nothing appears visibly "stale" in a way that matters (e.g., after creating a customer, the customer list still updates — TanStack Query mutations in this codebase should already `invalidateQueries` on write, which forces a refetch regardless of `staleTime`).

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "perf: stop disabling the TanStack Query cache app-wide

staleTime:0/gcTime:0 forced a network refetch on every mount and
every window focus for every query in the app. Existing mutations
already call invalidateQueries on writes, so enabling caching does
not risk showing stale data after an edit — it only stops redundant
refetches of unchanged data."
```

---

## Task 7 (P1): Compute signup billing amount/seats server-side

**Files:**
- Modify: `backend/src/services/organizations.service.ts`

**Context:** `POST /api/signup` is public/unauthenticated. `createOrganization` stores `data.monthlyAmount` and `data.seats` verbatim from the request body (only logging a warning if `seats` doesn't match the tier's expected count) — an attacker can self-signup with `monthlyAmount: 0` and get an active-looking trial organization. `PRICING_TIER_LIMITS` in `backend/src/config/constants.ts` already has the correct fixed package price and seat count per tier — use those instead of trusting the client.

- [ ] **Step 1: Derive seats and monthlyAmount from the pricing tier instead of the request body**

In `backend/src/services/organizations.service.ts`, replace the top of `createOrganization` (lines 125-141):
```typescript
  async createOrganization(data: CreateOrganizationDto) {
    const tierConfig = PRICING_TIER_LIMITS[data.pricingTier as keyof typeof PRICING_TIER_LIMITS];
    if (!tierConfig) {
      throw new Error('Invalid pricing tier');
    }

    // Seats and price are always derived from the tier server-side —
    // client-supplied values for these fields are ignored so a caller
    // can't set their own billing amount at signup.
    const seats = tierConfig.fixedSeats;
    const monthlyAmount = tierConfig.packagePrice;
```

Add the import at the top of the file:
```typescript
import { PRICING_TIER_LIMITS } from '../config/constants';
```

Then update the `tx.organization.create` call (around line 179-194) to use the derived values instead of `data.seats`/`data.monthlyAmount`:
```typescript
      const organization = await tx.organization.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          website: data.website,
          logo: data.logo,
          pricingTier: data.pricingTier as any,
          seats,
          usedSeats: 1, // Super admin counts as first user
          monthlyAmount, // Derived server-side from pricingTier, not client input
          addons: [] as any, // Addons are an enterprise-only, admin-configured feature — not settable at public signup
          status: 'trial',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        },
```
Note: `data.addons` is also dropped for the same reason — a public signup shouldn't be able to set arbitrary paid addon quantities either. This only affects the **public signup** path (`POST /api/signup`); the existing `updateOrganization` admin-facing method (used to change tier/seats/addons post-signup by an authenticated master_admin) is untouched.

- [ ] **Step 2: Apply the existing (already-defined but unused) signup validation schema to the route**

In `backend/src/routes/signup.routes.ts`, add validation (check the current file first — if it currently has no `validate()` call, add one):
```typescript
import { validate } from '../middleware/validator';
import { signupSchema } from '../utils/validators';
// ...
router.post('/', validate(signupSchema), signupController.signup.bind(signupController));
```
(Match whatever the existing router variable/method names are — read the file first since this step assumes the current structure without a validate call.)

- [ ] **Step 3: Compile check**

Run: `cd backend && npx tsc --noEmit`.

- [ ] **Step 4: Manual verification**

```bash
curl -X POST http://localhost:5000/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName":"Test Org","organizationEmail":"testorg@example.com","organizationPhone":"9876543210",
    "superAdminEmail":"testadmin@example.com","superAdminPassword":"Password123","superAdminName":"Test Admin","superAdminMobile":"9876543211",
    "pricingTier":"starter","seats":9999,"monthlyAmount":0
  }'
```
Expected: the created organization has `seats: 14` and `monthlyAmount: 4999` (the `starter` tier's real values from `PRICING_TIER_LIMITS`), **not** `9999`/`0`.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/organizations.service.ts backend/src/routes/signup.routes.ts
git commit -m "fix(security): derive signup billing amount/seats server-side

Public signup previously stored client-supplied monthlyAmount/seats
verbatim, letting anyone self-signup with a \$0 monthly amount or
inflated seat count. Both are now always computed from
PRICING_TIER_LIMITS based on the selected tier."
```

---

## Task 8 (P1): Stop leaking raw Prisma/error messages in production responses

**Files:**
- Modify: `backend/src/app.ts`

**Context:** The global error handler's Prisma-error branch (lines 139-145) and default branch (lines 166-170) both return `err.message` unconditionally, which can include table/column/constraint names. The stack-trace gating already correctly checks `NODE_ENV === 'development'` — extend the same gating to the message text for these two branches.

- [ ] **Step 1: Gate detailed messages behind NODE_ENV**

Replace the global error handler in `backend/src/app.ts` (lines 135-171):
```typescript
// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`${req.method} ${req.url} - ${err.message}`);
  const isDev = process.env.NODE_ENV === 'development';

  // Prisma errors
  if (err.code && err.code.startsWith('P')) {
    return res.status(400).json({
      success: false,
      error: 'Database error',
      ...(isDev && { message: err.message }),
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }

  // Default error
  return res.status(err.status || 500).json({
    success: false,
    error: isDev ? (err.message || 'Internal server error') : 'Internal server error',
    ...(isDev && { stack: err.stack }),
  });
});
```
Note: for the default branch, non-dev responses now always say `"Internal server error"` regardless of the real message — this matches the existing stack-trace gating pattern already in this file and avoids leaking things like file paths or internal identifiers embedded in thrown `Error` messages. Deliberately-thrown business-logic errors (e.g. `"Access denied: DSA does not belong to your organization"`) are still visible because most controllers already catch and format those into their own `res.status(...).json(...)` responses before they'd ever reach this handler (see `dsaInvoice.controller.ts`, `backup.controller.ts`) — this only affects errors that fall through to `next(error)` uncaught.

- [ ] **Step 2: Compile check**

Run: `cd backend && npx tsc --noEmit`.

- [ ] **Step 3: Manual verification**

Temporarily force a Prisma error (e.g. `GET /api/customers/not-a-real-uuid`) with `NODE_ENV` unset (defaults to non-development) — response body must not contain a raw Prisma message. Then run with `NODE_ENV=development` — response should include the detailed message again, confirming dev debugging isn't broken.

- [ ] **Step 4: Commit**

```bash
git add backend/src/app.ts
git commit -m "fix(security): stop leaking raw Prisma/internal error messages in prod

Extends the existing dev-only stack-trace gating to also cover the
error message text for Prisma errors and the default error branch,
so production responses no longer include DB/internal detail."
```

---

## Task 9 (P1): Add strict rate limiting to login

**Files:**
- Modify: `backend/src/app.ts`
- Modify: `backend/src/routes/auth.routes.ts`

**Context:** Only the global 100 req/min-per-IP `apiLimiter` covers `/api/auth/login` — that's 100 password guesses/minute/IP with no account-level lockout. Add a dedicated, much stricter limiter scoped to just the login route.

- [ ] **Step 1: Define a login-specific limiter**

In `backend/src/app.ts`, add after the existing `apiLimiter` definition (after line 57):
```typescript
// Strict rate limiting for login — prevent brute-force credential guessing
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute window
  max: 10,                   // Max 10 login attempts per IP per 15 minutes
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts against the limit
});
```

- [ ] **Step 2: Apply it to the login route**

In `backend/src/routes/auth.routes.ts`, import and apply it:
```typescript
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { loginLimiter } from '../app';

const router = Router();
const authController = new AuthController();

/**
 * POST /api/auth/login
 * Public login endpoint
 */
router.post('/login', loginLimiter, (req, res, next) => authController.login(req, res, next));
```
(If importing `loginLimiter` from `app.ts` creates a circular-import problem when compiled — verify with `tsc --noEmit` — move the `loginLimiter` definition instead into a new small file `backend/src/middleware/rateLimiters.ts` and import it from both `app.ts` and `auth.routes.ts`.)

- [ ] **Step 3: Compile check**

Run: `cd backend && npx tsc --noEmit` — if it fails due to circular imports, apply the fallback described in Step 2 and re-run.

- [ ] **Step 4: Manual verification**

```bash
for i in $(seq 1 12); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" -d '{"email":"nobody@example.com","password":"wrong"}'
done
```
Expected: the first ~10 return `401`, then subsequent ones return `429`. Then confirm a *correct* login still works (i.e., you haven't also broken normal login) by logging in with valid credentials from a fresh IP/after the window, or note `skipSuccessfulRequests: true` means successful logins never count against the limit at all.

- [ ] **Step 5: Commit**

```bash
git add backend/src/app.ts backend/src/routes/auth.routes.ts
git commit -m "fix(security): add strict rate limiting to login endpoint

The global 100 req/min limiter allowed up to 100 password guesses
per minute per IP with no login-specific throttling. Adds a
dedicated 10 attempts / 15 min limiter (successful logins excluded)
scoped to just POST /auth/login."
```

---

## Task 10 (P1): Wire up the password reset routes

**Files:**
- Modify: `backend/src/routes/auth.routes.ts`
- Modify: `backend/src/controllers/auth.controller.ts`

**Context:** The frontend already calls `POST /auth/forgot-password` and `POST /auth/reset-password` (`src/lib/api.ts:66-73`, wired to working UI pages) — but these routes don't exist in `auth.routes.ts`, so the feature is currently a live 404 in production, not just a security gap. `AuthService.forgotPassword`/`resetPassword` (in `backend/src/services/auth.service.ts`) already implement the logic correctly and already use the DB-backed opaque token from Task 4. This task only wires the missing routes/controller methods — actual email delivery remains a `TODO` in `auth.service.ts` (out of scope: that's a missing feature, not a vulnerability, and implementing an email provider isn't part of this security/performance pass).

- [ ] **Step 1: Add controller methods**

In `backend/src/controllers/auth.controller.ts`, add at the top:
```typescript
import { AuthService } from '../services/auth.service';
```
and inside the `AuthController` class, add two new methods:
```typescript
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const authService = new AuthService();
      const result = await authService.forgotPassword(email);
      res.json({ success: true, message: result.message });
    } catch (error: any) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body;
      const authService = new AuthService();
      const result = await authService.resetPassword(token, password);
      res.json({ success: true, message: result.message });
    } catch (error: any) {
      next(error);
    }
  }
```

- [ ] **Step 2: Add the routes, validated and rate-limited**

In `backend/src/routes/auth.routes.ts`:
```typescript
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { loginLimiter } from '../middleware/rateLimiters'; // or '../app', per Task 9's resolution
import { validate } from '../middleware/validator';
import { forgotPasswordSchema, resetPasswordSchema } from '../utils/validators';

const router = Router();
const authController = new AuthController();

router.post('/login', loginLimiter, (req, res, next) => authController.login(req, res, next));

router.post(
  '/forgot-password',
  loginLimiter,
  validate(forgotPasswordSchema),
  (req, res, next) => authController.forgotPassword(req, res, next)
);

router.post(
  '/reset-password',
  loginLimiter,
  validate(resetPasswordSchema),
  (req, res, next) => authController.resetPassword(req, res, next)
);

router.get('/me', authenticate, (req, res, next) => authController.me(req, res, next));

router.post('/verify-password', authenticate, (req, res, next) =>
  authController.verifyPassword(req, res, next)
);

export default router;
```
(Reusing `loginLimiter` here is intentional — these are exactly the kind of enumeration/abuse-prone public endpoints it exists to protect.)

- [ ] **Step 3: Compile check**

Run: `cd backend && npx tsc --noEmit`.

- [ ] **Step 4: Manual verification**

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" -d '{"email":"superadmin@loanms.com"}'
# Expected: {"success":true,"message":"If email exists, password reset link has been sent"}

# Confirm a row was created (check DB or Prisma Studio for a fresh PasswordResetToken row)

curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" -d '{"token":"<token-from-db>","password":"NewPassword123"}'
# Expected: {"success":true,"message":"Password reset successful"}
```
Then confirm login works with the new password, and that reusing the same token a second time fails (`used: true` check).

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/auth.routes.ts backend/src/controllers/auth.controller.ts
git commit -m "fix: wire up password reset routes (frontend already called these)

POST /auth/forgot-password and /auth/reset-password were called by
the existing frontend pages but didn't exist as backend routes,
making password reset a live 404. Wires them to the already-correct
AuthService methods, validated and rate-limited the same as login."
```

---

## Task 11 (P1): Paginate the reports endpoint

**Files:**
- Modify: `backend/src/services/reports.service.ts`
- Modify: `backend/src/controllers/reports.controller.ts`
- Check: `backend/src/routes/reports.routes.ts` (confirm query params pass through untouched — no change expected)

**Context:** `generateReport()` has no `skip`/`take` and fetches every matching customer with several nested includes (`connector.userBankDetails.bank`, `dsa.bankDetails.bank`, `remarks`) in one request — for a large org this is a full, heavily-joined table scan in a single response. Add pagination for the on-screen report view; keep a separate unbounded path only for CSV export (which legitimately needs all matching rows), reusing the same `where` builder so filtering logic isn't duplicated.

- [ ] **Step 1: Split `generateReport` into a shared filter builder + paginated fetch, and keep an explicit unbounded variant for export**

In `backend/src/services/reports.service.ts`, refactor so the `where` construction (lines 6-51) is reused by two methods. Replace the class body's opening through the `findMany` call with:
```typescript
export class ReportsService {
  private buildWhere(query: ReportQuery, userId?: string, userRole?: string, organizationId?: string | null) {
    const where: any = {};

    if (userRole !== 'master_admin' && organizationId) {
      where.organizationId = organizationId;
    }

    if (userRole === 'connector') {
      where.connectorId = userId;
    } else if (userRole === 'admin' && userId) {
      where.leadOwner = userId;
    } else if (userRole === 'backoffice' && userId) {
      where.createdBy = userId;
    }

    if (query.startDate || query.endDate) {
      where.applicationDate = {};
      if (query.startDate) where.applicationDate.gte = new Date(query.startDate);
      if (query.endDate) where.applicationDate.lte = new Date(query.endDate);
    }

    if (query.connectorId) where.connectorId = query.connectorId;
    if (query.dsaId) where.dsaId = query.dsaId;
    if (query.bankId) where.bankId = query.bankId;
    if (query.status) where.status = query.status;

    return where;
  }

  private reportInclude() {
    return {
      connector: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          userBankDetails: { include: { bank: true } },
        },
      },
      bank: { select: { id: true, name: true } },
      dsa: { select: { id: true, name: true, bankDetails: { include: { bank: true } } } },
      leadOwnerUser: { select: { id: true, firstName: true, lastName: true } },
      creator: { select: { id: true, firstName: true, lastName: true } },
      remarks: { orderBy: { createdAt: 'desc' as const }, take: 1 },
    };
  }

  async generateReport(
    query: ReportQuery,
    userId?: string,
    userRole?: string,
    organizationId?: string | null,
    page = 1,
    limit = 25
  ) {
    const where = this.buildWhere(query, userId, userRole, organizationId);
    const cappedLimit = Math.min(limit, 100);
    const skip = (page - 1) * cappedLimit;

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: this.reportInclude(),
        orderBy: { applicationDate: 'desc' },
        skip,
        take: cappedLimit,
      }),
      prisma.customer.count({ where }),
    ]);

    const customersWithPayout = this.attachPayouts(customers);

    return {
      customers: customersWithPayout,
      pagination: { page, limit: cappedLimit, total, totalPages: Math.ceil(total / cappedLimit) },
    };
  }

  async generateReportForExport(
    query: ReportQuery,
    userId?: string,
    userRole?: string,
    organizationId?: string | null
  ) {
    const where = this.buildWhere(query, userId, userRole, organizationId);

    const customers = await prisma.customer.findMany({
      where,
      include: this.reportInclude(),
      orderBy: { applicationDate: 'desc' },
    });

    return this.attachPayouts(customers);
  }
```
Keep the existing payout-calculation logic (currently inline in the `.map()` after the old `findMany` call) as a `private attachPayouts(customers)` method containing exactly that same `.map()` body, unchanged — this is a pure refactor of that piece, not a rewrite. (Read the current lines ~107 onward in `reports.service.ts` before editing, and move that logic verbatim into `attachPayouts`.)

- [ ] **Step 2: Update the controller — screen view paginates, CSV export stays unbounded**

In `backend/src/controllers/reports.controller.ts`, find the method that handles `GET /api/reports` and the one that handles CSV export (check the file first for exact names). Update the screen-view method to pass `page`/`limit` from `req.query` and return `result.customers`/`result.pagination` instead of a flat array; update the CSV-export method to call `generateReportForExport` instead of `generateReport`.

- [ ] **Step 3: Compile check**

Run: `cd backend && npx tsc --noEmit`.

- [ ] **Step 4: Manual verification**

```bash
curl "http://localhost:5000/api/reports?page=1&limit=25" -H "Authorization: Bearer $TOKEN"
```
Expected: response includes a `pagination` object and at most 25 customers. Then confirm CSV export (via the frontend "Export" button or its endpoint directly) still returns the full matching set, unpaginated, as before.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/reports.service.ts backend/src/controllers/reports.controller.ts
git commit -m "perf: paginate the on-screen reports endpoint

generateReport() fetched every matching customer (with 4 nested
relation includes) in a single unpaginated response. Split into a
paginated path for the screen view and a separate unbounded path
for CSV export, sharing the same filter-building logic."
```

---

## Task 12 (P1): Make invoice-paid + org-activation atomic

**Files:**
- Modify: `backend/src/services/invoices.service.ts`

**Context:** `updateInvoiceStatus` does two sequential, independent writes (mark invoice paid, then activate the organization) with no transaction. If the process crashes between them, the invoice is "paid" but the org stays suspended/trial (or the reverse), a real billing/access inconsistency.

- [ ] **Step 1: Wrap both writes in a transaction**

In `backend/src/services/invoices.service.ts`, replace `updateInvoiceStatus` (lines 153-181):
```typescript
  async updateInvoiceStatus(id: string, status: string, userRole?: string) {
    if (userRole !== 'master_admin') {
      throw new Error('Unauthorized: Only master admins can update invoice status');
    }

    const updateData: any = { status };
    if (status === 'paid') {
      updateData.paidAt = new Date();
    }

    const [invoice] = await prisma.$transaction(async (tx) => {
      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data: updateData,
        include: { organization: true },
      });

      if (status === 'paid') {
        await tx.organization.update({
          where: { id: updatedInvoice.organizationId },
          data: { status: 'active' },
        });
      }

      return [updatedInvoice];
    });

    return invoice;
  }
```

- [ ] **Step 2: Compile check**

Run: `cd backend && npx tsc --noEmit`.

- [ ] **Step 3: Manual verification**

As master_admin, mark a pending invoice `paid` via `PATCH /api/invoices/:id/status` and confirm both the invoice's `status`/`paidAt` and the organization's `status: 'active'` update together (check via `GET /api/organizations/:id` immediately after).

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/invoices.service.ts
git commit -m "fix: make invoice-paid + org-activation a single transaction

Marking an invoice paid and activating its organization were two
independent writes; a crash between them could leave a paid invoice
against a still-suspended organization."
```

---

## Task 13 (P1): Harden profile-photo upload validation

**Files:**
- Modify: `backend/src/middleware/upload.ts`
- Modify: `backend/package.json` (new dependency)

**Context:** `fileFilter` trusts the client-supplied `Content-Type` header only (`file.mimetype.startsWith('image/')`) with no extension allowlist or magic-byte check. An attacker can set `Content-Type: image/svg+xml`, upload an SVG containing `<script>`, and have it served back — stored XSS. Fix: validate actual file bytes via magic-byte sniffing and restrict to a safe raster-image extension allowlist (excluding SVG).

- [ ] **Step 1: Add the `file-type` package**

```bash
cd backend && npm install file-type
```

- [ ] **Step 2: Replace the filter with extension allowlist + post-write magic-byte verification**

multer's `fileFilter` runs before the file is fully on disk, so magic-byte sniffing needs to happen after `multer` saves it (or by buffering — simplest safe change without restructuring the upload pipeline: check the extension allowlist at `fileFilter` time, then verify actual content type after the file lands on disk and delete it if it doesn't match). Replace `backend/src/middleware/upload.ts`:
```typescript
import multer from 'multer';
import { RequestHandler, Request, Response, NextFunction } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { fileTypeFromFile } from 'file-type';

const uploadDir = path.join(__dirname, '../../public/uploads/profiles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    cb(new Error('Only .jpg, .jpeg, .png, and .webp files are allowed'), false);
    return;
  }
  if (!file.mimetype.startsWith('image/')) {
    cb(new Error('Only image files are allowed'), false);
    return;
  }
  cb(null, true);
};

const multerUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single('profilePhoto');

/**
 * Wraps multer's upload with a post-write magic-byte check, since multer's
 * fileFilter only sees the client-supplied (spoofable) Content-Type header.
 * Rejects the upload (and deletes the file) if the real file content isn't
 * one of the allowed raster image formats — this is what actually stops an
 * SVG-with-script or other disguised file from being stored.
 */
export const uploadProfilePhoto: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  multerUpload(req, res, async (err: any) => {
    if (err) {
      res.status(400).json({ success: false, error: err.message });
      return;
    }

    const file = (req as any).file;
    if (!file) {
      next();
      return;
    }

    try {
      const detected = await fileTypeFromFile(file.path);
      if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) {
        fs.unlinkSync(file.path);
        res.status(400).json({ success: false, error: 'File content does not match an allowed image type' });
        return;
      }
      next();
    } catch (error) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      next(error);
    }
  });
};
```

- [ ] **Step 3: Compile check**

Run: `cd backend && npx tsc --noEmit`.

- [ ] **Step 4: Manual verification**

```bash
# Legit JPEG must succeed
curl -X PUT http://localhost:5000/api/profile/me/photo \
  -H "Authorization: Bearer $TOKEN" -F "profilePhoto=@/path/to/real.jpg"
# Expected: 200

# SVG disguised with an image/jpeg extension/rename must be rejected
cp malicious.svg fake.jpg
curl -X PUT http://localhost:5000/api/profile/me/photo \
  -H "Authorization: Bearer $TOKEN" -F "profilePhoto=@fake.jpg"
# Expected: 400 "File content does not match an allowed image type", and fake.jpg must NOT remain in public/uploads/profiles
```
(Confirm the actual route path/method for profile photo upload by checking `backend/src/routes/profile.routes.ts` first — the example above assumes but doesn't guarantee the exact path.)

- [ ] **Step 5: Commit**

```bash
git add backend/src/middleware/upload.ts backend/package.json backend/package-lock.json
git commit -m "fix(security): validate uploaded profile photos by actual content, not header

fileFilter only checked the client-supplied Content-Type, which is
trivially spoofable (e.g. an SVG-with-script uploaded as
image/jpeg). Adds an extension allowlist plus a post-write
magic-byte check via file-type, rejecting and deleting anything
that isn't a real jpg/png/webp."
```

---

## Task 14 (P1): Fix silent data truncation in list pages (Customers/Users/Banks/Payouts)

**Files:**
- Modify: `src/pages/Customers.tsx`, `src/pages/Users.tsx`, `src/pages/Banks.tsx`, `src/pages/Payouts.tsx`

**Context:** These pages request `limit: 10000` expecting "everything," then paginate client-side. But `PAGINATION_DEFAULTS.maxLimit = 100` in `backend/src/config/constants.ts` silently caps every list endpoint's response at 100 rows server-side (confirmed by reading `customers.service.ts` directly — this was mis-described in an earlier draft of this audit as "limit ignored entirely," but the real behavior is worse in one way: any org with more than 100 matching rows silently loses data from these screens with no error and no indication to the user). Fix: switch these pages to real server-side pagination — request only the current page's worth of rows, matching what the backend already correctly supports.

- [ ] **Step 1: Customers page**

In `src/pages/Customers.tsx`, find where the query is built (around line 25, `limit: 10000`) and the client-side pagination logic. Change the query to request only the current page:
```typescript
// Before: limit: 10000, then .slice() locally
// After: pass the actual page/pageSize the table UI is showing, e.g.:
const { data, isLoading } = useQuery({
  queryKey: ['customers', filters, page, pageSize],
  queryFn: () => customersApi.getCustomers({ ...filters, page, limit: pageSize }),
});
```
Use the `pagination.total`/`pagination.totalPages` fields already returned by `customers.service.ts`'s existing pagination response to drive the table's page controls, instead of computing them from a locally-sliced array. Remove the now-unnecessary client-side `.slice()` pagination logic — the array returned is already exactly one page.

- [ ] **Step 2: Users page**

Same change in `src/pages/Users.tsx` (currently `limit: 10000` at line 73, `.slice()` at line 100): request `page`/`limit` matching the table's page size, use the backend's returned `total` for page-count instead of `data.length`.

- [ ] **Step 3: Banks page**

Same change in `src/pages/Banks.tsx` (line 56 `limit: 10000`, line 72 `.slice()`). Note: if the actual number of banks per org is typically small (tens, not thousands), this page may reasonably keep `limit: 10000`-style "fetch all" behavior *if* the backend service for banks has no `maxLimit` cap that would silently truncate it — check `backend/src/services/banks.service.ts` first. If it also caps at `PAGINATION_DEFAULTS.maxLimit`, apply the same real-pagination fix as Customers/Users; if banks lists are reliably small and unbounded-fetch is intentional there, leave it and note that in the commit message instead of forcing an unnecessary change.

- [ ] **Step 4: Payouts page**

Same change in `src/pages/Payouts.tsx` (line 135 `limit: 10000`): request real pages from `backend/src/services/payouts.service.ts`'s list endpoint.

- [ ] **Step 5: Compile + build check**

Run: `npx tsc --noEmit` and `npm run build` from repo root.

- [ ] **Step 6: Manual verification**

For an org/table with more than 100 rows (seed test data if needed), confirm: (a) the page no longer silently drops rows beyond 100 — the total count shown matches the real total, and (b) paging controls (next/prev/page number) correctly fetch subsequent pages from the server rather than slicing an already-incomplete local array.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Customers.tsx src/pages/Users.tsx src/pages/Banks.tsx src/pages/Payouts.tsx
git commit -m "fix: use real server-side pagination instead of limit:10000 + client slice

Backend list endpoints cap results at PAGINATION_DEFAULTS.maxLimit
(100) regardless of the requested limit, so these pages were
silently losing data for any org with more than 100 matching rows
while appearing to paginate correctly. Now requests the actual
current page from the server."
```

---

## Task 15 (P1): Lazy-load route pages

**Files:**
- Modify: `src/App.tsx`

**Context:** All ~16 page components are eagerly imported in `App.tsx`, so every user downloads the JS for every page (including `MasterAdminDashboard`, `Reports`, `Payouts`, `DsaInvoices` — all role-restricted, most users never see them) on first load. Convert to `React.lazy` + `Suspense`.

- [ ] **Step 1: Convert page imports to lazy imports**

In `src/App.tsx`, replace the static page imports (lines 13-29, keep layout/context imports as-is since those are needed immediately):
```typescript
import { lazy, Suspense } from "react";

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LoginPage = lazy(() => import("./components/auth/LoginPage"));
const ForgotPasswordPage = lazy(() => import("./components/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./components/auth/ResetPasswordPage"));
const SignupPage = lazy(() => import("./pages/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Customers = lazy(() => import("./pages/Customers"));
const Banks = lazy(() => import("./pages/Banks"));
const Users = lazy(() => import("./pages/Users"));
const DSAPage = lazy(() => import("./pages/DSA"));
const DsaInvoices = lazy(() => import("./pages/DsaInvoices"));
const Reports = lazy(() => import("./pages/Reports"));
const Payouts = lazy(() => import("./pages/Payouts"));
const Profile = lazy(() => import("./pages/Profile"));
const MasterAdminDashboard = lazy(() => import("./pages/MasterAdmin"));
```
Keep `DashboardLayout` as a regular (non-lazy) import — it's the shell every authenticated route uses, so lazy-loading it just adds an extra waterfall step for no benefit.

- [ ] **Step 2: Wrap the route tree in `Suspense`**

In `AppRoutes()`, wrap the `<Routes>` element:
```typescript
function AppRoutes() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <Routes>
        {/* ...unchanged... */}
      </Routes>
    </Suspense>
  );
}
```
(Matches the loading-spinner style already used in `AuthContext.tsx`'s `isLoading` branch, so the loading state looks consistent with the rest of the app.)

- [ ] **Step 3: Compile + build check**

Run: `npx tsc --noEmit` and `npm run build` — check the build output lists multiple separate chunk files for the page components (confirms code-splitting is actually happening, not just syntactically present).

- [ ] **Step 4: Manual verification**

Run `npm run dev`, open Network tab, load `/login` — confirm `Dashboard`/`Reports`/`MasterAdmin` chunks are NOT fetched. Log in and navigate to `/dashboard` — confirm the `Dashboard` chunk loads then, and `/reports`'s chunk still hasn't loaded until you visit it.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "perf: lazy-load route pages instead of bundling all ~16 into one chunk

Every page (including role-restricted ones like MasterAdminDashboard,
Reports, Payouts, DsaInvoices that most users never visit) was
eagerly imported into the main bundle. Converts to React.lazy +
Suspense so each route's JS loads only when actually navigated to."
```

---

## Task 16 (P1): Add vendor chunk splitting

**Files:**
- Modify: `vite.config.ts`

**Context:** No `build.rollupOptions` config exists, so Vite's default chunking is used — vendor code (Radix UI, recharts, react-hook-form, react-router) isn't isolated into its own long-term-cacheable chunk, so every app deploy invalidates the cached vendor blob for all users even though vendor code didn't change.

- [ ] **Step 1: Add manual chunk splitting**

In `vite.config.ts`, add a `build` section:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'radix-vendor': [
            // Only include the @radix-ui packages actually present in package.json —
            // check package.json's dependencies first and list them explicitly
            // (Vite's manualChunks doesn't support globs).
          ],
          'charts-vendor': ['recharts'],
        },
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
```
Before finalizing, read `package.json`'s `dependencies` to list the actual installed `@radix-ui/react-*` package names in the `radix-vendor` array (there isn't a wildcard form).

- [ ] **Step 2: Build check**

Run: `npm run build` — confirm the output lists `react-vendor`, `radix-vendor`, `charts-vendor` as separate chunk files, and that the build doesn't error on any package name typo.

- [ ] **Step 3: Manual verification**

Run `npm run build && npm run preview`, load the app, confirm it renders correctly with no console errors (chunk-splitting misconfiguration would typically surface as a runtime "X is not defined" or blank-screen error, not a build error).

- [ ] **Step 4: Commit**

```bash
git add vite.config.ts
git commit -m "perf: split vendor code into separate cacheable chunks

No manual chunking was configured, so vendor code (React, Radix UI,
recharts) was bundled together with app code and re-downloaded by
every user on every deploy even when vendor code hadn't changed."
```

---

## Task 17 (P1): Set trust proxy for correct client IP detection

**Files:**
- Modify: `backend/src/app.ts`

**Context:** No `app.set('trust proxy', ...)` exists, but the deployment routes through a reverse proxy (`backend/.htaccess.example` proxies to `http://127.0.0.1:5000`). Without this, `express-rate-limit` (and any `req.ip` usage) sees the proxy's loopback address for every request — either all users share one rate-limit bucket, or, if `X-Forwarded-For` is present without `trust proxy` enabled, `express-rate-limit` throws a validation error.

- [ ] **Step 1: Add trust proxy before the rate limiters are registered**

In `backend/src/app.ts`, add immediately after `const app: Application = express();` (before the CORS/rate-limiter setup):
```typescript
// Trust the first hop reverse proxy (Apache/nginx) for correct client IP
// detection — required for express-rate-limit to key on the real client
// IP instead of the proxy's loopback address.
app.set('trust proxy', 1);
```

- [ ] **Step 2: Compile check**

Run: `cd backend && npx tsc --noEmit`.

- [ ] **Step 3: Manual verification**

If running locally without a reverse proxy in front, confirm the app still boots and rate limiting still works (`trust proxy: 1` just changes which hop's IP is trusted — it's a no-op correctness fix, not something that should break local dev). In the actual proxied deployment, confirm (via logs or a debug endpoint) that `req.ip` now reflects the real client IP, not `127.0.0.1`, for every request.

- [ ] **Step 4: Commit**

```bash
git add backend/src/app.ts
git commit -m "fix: set trust proxy for correct client IP behind reverse proxy

Without this, express-rate-limit either buckets all users under the
proxy's loopback IP (defeating rate limiting) or throws a validation
error when X-Forwarded-For is present. The deployment already routes
through Apache per backend/.htaccess.example."
```

---

## Final steps (after all 17 tasks)

- [ ] Run the full verification suite one more time end-to-end:
  - `cd backend && npx tsc --noEmit && npm run build`
  - `npx tsc --noEmit && npm run build && npm run lint` (from repo root)
  - `cd backend && npm audit --production` and `npm audit --production` (root) — confirm counts match or improve vs. the audit baseline (11 frontend / 6 backend vulnerabilities), not worse.
- [ ] Start both dev servers and manually walk through: login, logout, forgot/reset password, create/view/edit a customer (+ PDF), create a bank, create a DSA + generate a DSA invoice (+ PDF), generate a payout (+ PDF), view reports, master_admin billing (create/mark-paid an org invoice + PDF), and the database backup feature — confirming nothing that worked before is now broken.
- [ ] Write the final report (per the original request's Step 17 format): Security/Performance score before/after, full issue list with severity/file/line/risk/fix, files changed, security improvements, and remaining issues (P2/P3 backlog below + the JWT_SECRET/DB-password rotation the user still needs to do operationally).

---

## Appendix: P2/P3 backlog (explicitly out of scope for this plan)

Not implemented here per "fix P0/P1 first" — listed for a future pass:
- Missing `helmet()` security headers (P2)
- Missing composite index on `Notification` (`userId, organizationId, isRead, createdAt`) (P2)
- `getTopPerformers`/`getConnectorPayout`/`getConnectorBalance` fetch-all-then-JS-reduce instead of Prisma `groupBy` (P2, 3 occurrences)
- `PayoutLedger` missing a unique constraint to prevent duplicate concurrent credit entries (P2/P3)
- Vulnerable `nodemailer` version (P2 — upgrade to 9.x is a breaking change, needs its own scoped task)
- Duplicate `authorize()`/`validate()` middleware implementations imported inconsistently across routes (P2)
- Context provider value objects not wrapped in `useMemo` (`AuthContext`, `OrganizationContext`, `BillingContext`) (P2)
- Duplicate/inconsistent TanStack Query keys for shared reference data (banks, dsas) across pages (P2)
- No `compression()` middleware in Express (P2 — defense in depth; reverse proxy may already gzip)
- Users can change their own password via profile update with no current-password confirmation (P2)
- Missing `img` `loading="lazy"`/dimensions on a few small avatar/logo previews (P3)
- `multer` a major version behind current (P3, no open CVE currently)
- `express`-locked `path-to-regexp`/`qs` ReDoS advisories, fixable via non-breaking `npm audit fix` (P3)
- `profile.routes.ts` doesn't apply `organizationContext` for consistency with the documented pattern, though not currently exploitable (P3)
- `/api/auth/login` doesn't apply the already-defined `loginSchema` validator (P3 — low impact, `authController.login` already does its own truthy checks)
- **Product/design decision, not a code fix:** the DB-backup feature (`POST /api/backup/download`, Task 2) is reachable by any org-level `superadmin` in a multi-tenant deployment, which means any paying customer's admin can trigger `pg_dump` and write files on the shared host. Task 2 closes the RCE hole but doesn't change who can call this — flagging for the user to decide whether this should be `master_admin`-only in a true multi-tenant deployment.
