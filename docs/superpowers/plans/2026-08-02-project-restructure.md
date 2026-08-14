# Project Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize `loan-hub-pro` into a clean `frontend/` + `backend/` + `docs/` layout, tidy dead files and loose scripts, and make the minimal safe backend folder changes the current code actually supports — with zero changes to business logic, API behavior, database schema, or features.

**Architecture:** Six independent, individually-verifiable phases, each ending in its own commit: (1) delete confirmed dead files, (2) relocate backend loose scripts/docs + fix their internal path assumptions, (3) minimal backend `src/` folder move (validators, constants), (4) move all frontend files from repo root into `frontend/`, (5) consolidate root-level docs into `docs/` + add an optional convenience root `package.json`, (6) full verification pass. Phases 1–3 only touch `backend/`; phase 4 only touches frontend files; they do not depend on each other and can be done in any order, but are numbered in increasing risk order (safest first).

**Tech Stack:** No new tools introduced. Uses `git mv` (preserves history), existing `npm`/`tsc`/`vite`/`prisma` CLIs already in the project.

**Decisions locked in with the user before writing this plan:**
- Backend: do NOT create empty `repository/`, `models/`, `jobs/`, `cron/`, `helpers/` folders — no corresponding code exists, and building a real repository layer would mean extracting Prisma calls out of 15 services (out of scope, real refactor not a move).
- Cruft: delete only unambiguous pure duplicates/backups; relocate (don't delete) the ~20 loose one-off scripts, `.sql`/`.bat` files, and stale docs.
- Frontend folder names: keep `contexts/` and `components/layout/` as-is — no cosmetic renames to `context/`/`layouts/`.
- Uploads/PDFs: stay at `backend/public/uploads` and `backend/public/pdfs` — not flattened to `backend/uploads/`.

**Extrapolated from those decisions (not separately asked, flagged here for override):** the spec's frontend target list also includes `services/`, `api/`, `styles/`, `assets/`, `constants/`. Applying the same "don't churn imports for a naming-only win" logic the user already chose for `contexts/`/`layouts/`:
- `src/lib/utils.ts` (the shadcn `cn()` helper) is imported by **45 files**, including every one of the 45 `components/ui/*` files, and is wired into `components.json`'s `utils: "@/lib/utils"` alias used by the shadcn CLI. Moving it into `utils/` would touch 45+ files and the shadcn config for zero functional benefit — **left in place** (`src/lib/utils.ts`, `src/lib/api.ts`).
- No frontend `services/` concept currently exists (components/pages call `src/lib/api.ts` directly) — **not created**, same reasoning as skipping backend's `repository/`.
- No `constants/` file currently exists in the frontend — **not created**.
- `src/data/mockData.ts` doesn't map cleanly onto any target folder and isn't part of any live import chain worth risking — **left in place**, flagged for you to review/delete separately if it's dead.
- `styles/` is the one exception: only `src/index.css` is actually imported (by `src/main.tsx`), and `src/App.css` is imported nowhere (confirmed via grep — likely already-dead template leftover, but not a pure duplicate so not deleted per the cruft-cleanup decision). Moving both into `src/styles/` only requires updating **one** import line — low risk, real value — so this **is** done, in Phase 4 Step 3a below.
- No `src/assets/` folder is created — there's no asset file that would go in it; `public/` already holds the only static assets (`favicon.ico`, `placeholder.svg`, `robots.txt`) and stays put per Vite convention.

If you want the full-churn version anyway (renaming `lib/` → `api/`+`utils/`, creating empty `services/`/`constants/`), say so and this plan can be amended before execution — as written, it follows the lower-risk path implied by your other answers.

---

## Phase 1: Delete confirmed dead files

**Files to delete (all verified duplicates/backups/artifacts, zero references from any source file):**
- `dist.zip` (root)
- `backend/dist.zip`
- `tailwind1.config copy.ts` (root — byte-identical to `tailwind.config.ts`)
- `src/App.tsx.backup`
- `src/App1.css` (byte-identical to `src/App.css`)
- `src/contexts/AuthContext.tsx.backup`
- `src/components/layout/Sidebar.tsx.backup`
- `backend/prisma/schema.prisma.backup`
- `backend/tmpclaude-23f1-cwd`
- `backend/tmpclaude-97c6-cwd`
- `backend/tmpclaude-3da9-cwd`

**Not touched:** `src/index1.css` — its content differs from `src/index.css` (not a pure duplicate), so it is left in place. Flagged in the final deliverable for you to check manually; not part of this restructure.

- [ ] **Step 1: Confirm none of these files are imported/referenced anywhere**

```bash
cd "f:/Rudvir/loan-hub-pro"
grep -rn "App1\.css\|App\.tsx\.backup\|AuthContext\.tsx\.backup\|Sidebar\.tsx\.backup\|schema\.prisma\.backup\|tailwind1\.config" --include="*.ts" --include="*.tsx" --include="*.json" src backend/src package.json backend/package.json vite.config.ts tsconfig*.json 2>/dev/null
```

Expected: no output (no matches). If anything matches, stop and report it before deleting.

- [ ] **Step 2: Delete the files**

```bash
cd "f:/Rudvir/loan-hub-pro"
git rm -f "dist.zip" "backend/dist.zip" "tailwind1.config copy.ts" \
  "src/App.tsx.backup" "src/App1.css" \
  "src/contexts/AuthContext.tsx.backup" \
  "src/components/layout/Sidebar.tsx.backup" \
  "backend/prisma/schema.prisma.backup" \
  "backend/tmpclaude-23f1-cwd" "backend/tmpclaude-97c6-cwd" "backend/tmpclaude-3da9-cwd"
```

(`dist.zip`/`backend/dist.zip` may show as untracked rather than tracked — if `git rm` errors "did not match any files" for a given path, use `rm` instead for that one path and continue.)

- [ ] **Step 3: Verify frontend and backend still typecheck**

```bash
cd "f:/Rudvir/loan-hub-pro" && npx tsc --noEmit -p tsconfig.app.json
cd "f:/Rudvir/loan-hub-pro/backend" && npx tsc --noEmit
```

Expected: both exit 0 with no errors (same as before this phase — these deletions touch nothing referenced by compiled code).

- [ ] **Step 4: Commit**

```bash
cd "f:/Rudvir/loan-hub-pro"
git add -A
git commit -m "chore: remove dead duplicate/backup files"
```

---

## Phase 2: Relocate backend loose scripts, SQL, batch files, and stale docs

**Why this is safe:** none of the 17 loose `.ts`/`.js` scripts at `backend/` root have relative imports (`./` or `../`) — confirmed by grep. They only import npm packages (`@prisma/client`, `bcrypt`, etc.), so moving them does not require import rewrites. The 4 `.bat` files DO make cwd-relative assumptions (they assume they're launched from `backend/`), so they need small fixes to keep working from their new location.

### Step 1: Create the scripts folder and move `.ts`/`.js` scripts

```bash
cd "f:/Rudvir/loan-hub-pro/backend"
mkdir -p scripts
git mv check-columns.ts check-customer-details.ts check-data.ts \
  create-admin.ts create-default-admin.ts create-master-admin.ts create-superadmin.ts \
  run-role-migration.ts test-api.ts test-payout-add.ts test-reports-api.ts \
  update-admin-password.ts update-superadmin-email.ts \
  verify-admin-users.ts verify-users.ts \
  test-payout-flow.js backfill-payouts.js \
  scripts/
```

### Step 2: Move loose SQL files into `scripts/`

```bash
cd "f:/Rudvir/loan-hub-pro/backend"
git mv check-migration.sql role-migration.sql run-migration.sql scripts/
```

### Step 3: Move `.bat` files into `scripts/` and fix their path assumptions

```bash
cd "f:/Rudvir/loan-hub-pro/backend"
git mv complete-setup.bat restart-dev.bat run-migration.bat setup-superadmin.bat scripts/
```

Now fix each one so it still runs correctly regardless of where it's launched from, by adding `cd /d "%~dp0.."` (jump to `backend/`, the script's parent folder) as the first executable line, and fixing the one file-relative reference in `run-migration.bat`.

**`backend/scripts/complete-setup.bat`** — replace line 1 (`@echo off`) block start with:
```bat
@echo off
cd /d "%~dp0.."
echo ========================================
echo   Complete Backend Setup
echo ========================================
echo.

echo [1/3] Running database migrations...
call npx prisma migrate dev --name add_profile_payout_dsa_invoice_fields
if errorlevel 1 (
    echo.
    echo Migration failed! Please check your database connection.
    echo.
    pause
    exit /b 1
)

echo.
echo [2/3] Generating Prisma client...
call npx prisma generate
if errorlevel 1 (
    echo.
    echo Prisma generate failed!
    echo.
    pause
    exit /b 1
)

echo.
echo [3/3] Creating SuperAdmin account...
call npx ts-node scripts\create-superadmin.ts
if errorlevel 1 (
    echo.
    echo SuperAdmin creation failed!
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo You can now:
echo   1. Start the backend: npm run dev
echo   2. Login with: superadmin@rudvir.com / Admin@123
echo.
echo Remember to change the default password after first login!
echo.
pause
```

**`backend/scripts/restart-dev.bat`** — full replacement:
```bat
@echo off
cd /d "%~dp0.."
echo ========================================
echo Restarting LoanMS Backend Server
echo ========================================
echo.
echo Step 1: Generating Prisma Client...
call npm run prisma:generate
if %ERRORLEVEL% NEQ 0 (
    echo Error generating Prisma client!
    pause
    exit /b 1
)
echo.
echo Step 2: Starting Development Server...
call npm run dev
```

**`backend/scripts/run-migration.bat`** — full replacement (note the `.env` and `run-migration.sql` references, both now correctly relative to `backend/` after the `cd`, with `run-migration.sql` explicitly pointed at `scripts\`):
```bat
@echo off
cd /d "%~dp0.."
echo ===================================
echo Running Database Migration
echo ===================================
echo.

REM Read database URL from .env file
for /f "tokens=1,2 delims==" %%a in ('findstr "DATABASE_URL" .env') do set DB_URL=%%b

echo Database URL found in .env file
echo.

REM Extract database connection details from DATABASE_URL
REM Expected format: postgresql://user:password@host:port/database

echo Running migration SQL script...
echo.

REM Use psql to run the migration
REM You may need to adjust this command based on your PostgreSQL setup
psql %DB_URL% -f scripts\run-migration.sql

if %errorlevel% equ 0 (
    echo.
    echo ===================================
    echo Migration completed successfully!
    echo ===================================
    echo.
    echo Now run: npm run prisma:generate
    echo Then restart your backend server
) else (
    echo.
    echo ===================================
    echo Migration failed!
    echo ===================================
    echo.
    echo Please run the SQL manually:
    echo 1. Open pgAdmin or your PostgreSQL client
    echo 2. Connect to your 'loanms' database
    echo 3. Run the SQL from scripts\run-migration.sql
)

pause
```

**`backend/scripts/setup-superadmin.bat`** — full replacement:
```bat
@echo off
cd /d "%~dp0.."
echo ========================================
echo   SuperAdmin Setup Script
echo ========================================
echo.

echo Running SuperAdmin creation script...
npx ts-node scripts\create-superadmin.ts

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
pause
```

Apply these four full-file replacements with the Edit/Write tool (not by hand-editing in this shell).

### Step 4: Update `backend/package.json` scripts to point at the new script location

Change:
```json
"setup": "npm run prisma:migrate && npm run prisma:generate && npx ts-node create-superadmin.ts",
"setup:master": "npx ts-node create-master-admin.ts"
```
to:
```json
"setup": "npm run prisma:migrate && npm run prisma:generate && npx ts-node scripts/create-superadmin.ts",
"setup:master": "npx ts-node scripts/create-master-admin.ts"
```

### Step 5: Move stale/point-in-time docs into `docs/archive/`, still-relevant backend docs into `docs/backend/`

```bash
cd "f:/Rudvir/loan-hub-pro"
mkdir -p docs/archive docs/backend
git mv backend/FIX-TYPESCRIPT-ERRORS.md backend/TYPESCRIPT-FIXES-COMPLETE.md backend/QUICK-FIX-GUIDE.md docs/archive/
git mv backend/BACKEND-SETUP-COMPLETE.md backend/INTEGRATION-GUIDE.md backend/MIGRATION_INSTRUCTIONS.md backend/MULTI-TENANCY-IMPLEMENTATION.md docs/backend/
```

`backend/README.md` stays at `backend/` root (conventional per-package readme).

### Step 6: Update every reference to the moved script paths and `.env` create-admin commands in documentation

```bash
cd "f:/Rudvir/loan-hub-pro"
grep -rln "npx ts-node create-superadmin\.ts\|npx ts-node create-master-admin\.ts" CLAUDE.md docs README.md backend/README.md 2>/dev/null
```

For every file that matches, update the two command strings:
- `npx ts-node create-superadmin.ts` → `npx ts-node scripts/create-superadmin.ts`
- `npx ts-node create-master-admin.ts` → `npx ts-node scripts/create-master-admin.ts`

(As of writing this plan, `CLAUDE.md` is the known file with these references — use Edit to update both occurrences there. Re-run the grep above after editing to confirm zero remaining matches.)

### Step 7: Verify

```bash
cd "f:/Rudvir/loan-hub-pro/backend"
npx tsc --noEmit
```
Expected: exit 0, no errors (scripts/ moved files aren't part of the `tsc` build under `backend/tsconfig.json`'s `include: ["src/**/*"]`, so this just confirms the app source itself is untouched).

```bash
npx ts-node scripts/create-superadmin.ts --help 2>&1 | head -5
```
This won't have a real `--help` flag, but running it should fail the same way it did before the move (e.g. "user already exists" or a DB connection attempt) — NOT a "Cannot find module" error. A module-not-found error means an import path assumption was wrong; anything else confirms the move didn't break resolution. (Ctrl+C or let it fail naturally — do not let it actually create a duplicate admin.)

### Step 8: Commit

```bash
cd "f:/Rudvir/loan-hub-pro"
git add -A
git commit -m "chore: relocate backend one-off scripts, sql, batch files, and stale docs"
```

---

## Phase 3: Minimal backend `src/` folder move (validators, constants)

**Why minimal:** per the locked-in decision above, `repository/`, `models/`, `jobs/`, `cron/`, `helpers/` are not created because no corresponding code exists for them. Only `validators.ts` and `constants.ts` get their own folders, matching the two `src/utils/validators.ts`-style single-file-per-concern moves that are pure renames with no logic change.

### Step 1: Find every file that imports `utils/validators` or `config/constants`

```bash
cd "f:/Rudvir/loan-hub-pro/backend/src"
grep -rn "from '.*utils/validators'\|from '\.\./utils/validators'\|from '\./validators'" . 
grep -rn "from '.*config/constants'\|from '\.\./config/constants'\|from '\./constants'" .
```

Record every matching file path and its exact import line — you'll fix each one in Step 3.

### Step 2: Move the files

```bash
cd "f:/Rudvir/loan-hub-pro/backend/src"
mkdir -p validators constants
git mv utils/validators.ts validators/index.ts
git mv config/constants.ts constants/index.ts
```

### Step 3: Fix every import found in Step 1

For each file, change the import path so it still resolves:
- Any `from '../utils/validators'` (from a file one level under `src/`, e.g. `src/routes/customers.routes.ts`) → `from '../validators'`
- Any `from '../../utils/validators'` (from a file two levels under `src/`) → `from '../../validators'`
- Same pattern for `config/constants` → `constants`

Use the exact list of files from Step 1's grep output — do not guess at depth, the grep output tells you the real relative path used in each file. Apply with Edit tool, one file at a time.

### Step 4: Verify

```bash
cd "f:/Rudvir/loan-hub-pro/backend"
npx tsc --noEmit
```
Expected: exit 0, no errors. If any error mentions `Cannot find module '.../validators'` or `'.../constants'`, an import in Step 3 was missed — find it with the Step 1 grep pattern again and fix it.

```bash
cd "f:/Rudvir/loan-hub-pro/backend"
npm run dev
```
Let it boot, confirm the console shows the server started on port 5000 with no import errors, then Ctrl+C.

```bash
curl http://localhost:5000/health
```
(with the dev server running) — expected: `{"success":true,"message":"LoanMS Backend API is running",...}`

### Step 5: Commit

```bash
cd "f:/Rudvir/loan-hub-pro"
git add -A
git commit -m "refactor(backend): move validators and constants into their own folders"
```

---

## Phase 4: Move all frontend files into `frontend/`

**This is the highest-value, highest-file-count phase.** Everything below is a pure `git mv` — no file content changes except the alias configs that must keep pointing at the (relocated) `src/`.

**Files/folders moving from repo root into `frontend/`:**
`index.html`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tailwind.config.ts`, `postcss.config.js`, `components.json`, `eslint.config.js`, `package.json`, `package-lock.json`, `bun.lockb`, `src/`, `public/`, `.env`, `.env.example`, `.env.production`.

**Staying at repo root:** `CLAUDE.md`, `README.md` (repo-level docs), `.gitignore`, `.git/`, `.claude/`, `backend/`, `dist/` (build output — will regenerate inside `frontend/` after this move; the stale root `dist/` gets deleted, not moved).

### Step 1: Confirm nothing outside `src/`/config hardcodes a root-relative path that would break

```bash
cd "f:/Rudvir/loan-hub-pro"
grep -rn "\.\./backend\|\"\./src\|'\./src" vite.config.ts tsconfig*.json components.json eslint.config.js package.json 2>/dev/null
```

Expected: only self-contained `./src` references inside what's about to move together as a unit — nothing reaching outside the to-be-moved set. If something references `../backend` from a frontend config file, stop and report it (none were found during the exploration that produced this plan).

### Step 2: Create `frontend/` and move everything as one `git mv` batch

```bash
cd "f:/Rudvir/loan-hub-pro"
mkdir -p frontend
git mv index.html frontend/
git mv vite.config.ts frontend/
git mv tsconfig.json frontend/
git mv tsconfig.app.json frontend/
git mv tsconfig.node.json frontend/
git mv tailwind.config.ts frontend/
git mv postcss.config.js frontend/
git mv components.json frontend/
git mv eslint.config.js frontend/
git mv package.json frontend/
git mv package-lock.json frontend/
git mv bun.lockb frontend/
git mv src frontend/
git mv public frontend/
git mv .env frontend/
git mv .env.example frontend/
git mv .env.production frontend/
```

The old root `dist/` (build output, already gitignored) is stale after this move — delete it rather than moving it, it will regenerate:
```bash
rm -rf dist
```

### Step 3: Confirm the alias configs still resolve correctly (no edits needed, just verify)

`frontend/tsconfig.app.json` has `baseUrl: "."` and `paths: { "@/*": ["./src/*"] }` — since `tsconfig.app.json` and `src/` moved together into `frontend/`, `.` still resolves to `frontend/` and `./src/*` still resolves to `frontend/src/*`. No edit needed.

`frontend/vite.config.ts` has `resolve.alias["@"] = path.resolve(__dirname, "./src")` — `__dirname` will now be `frontend/`, so this still resolves to `frontend/src`. No edit needed.

`frontend/components.json` (shadcn) aliases (`@/components`, `@/lib/utils`, etc.) — unaffected, still relative to the same `@` alias. No edit needed.

Read all three files after the move to double-check nothing else in them references a path outside `frontend/`:
```bash
cd "f:/Rudvir/loan-hub-pro/frontend"
cat vite.config.ts tsconfig.app.json components.json
```

### Step 4: Move CSS into `src/styles/` (the one frontend internal-folder move worth doing — see "Extrapolated" note above)

```bash
cd "f:/Rudvir/loan-hub-pro/frontend/src"
mkdir -p styles
git mv index.css styles/index.css
git mv App.css styles/App.css
```

Fix the one real import (`src/main.tsx`):
- Old: `import "./index.css";`
- New: `import "./styles/index.css";`

`App.css` has no importer anywhere (confirmed by grep before this plan was written), so no import line needs fixing for it — it's just relocating an already-unreferenced file. Leave it as `styles/App.css`; don't delete it (not a confirmed pure duplicate, per the cruft-cleanup decision).

### Step 5: Add a `.gitignore` inside `frontend/` (or confirm root `.gitignore` still covers it)

The root `.gitignore` has unanchored patterns (`node_modules`, `dist`, `*.log` — no leading `/`), which in git match at any depth, so `frontend/node_modules` and `frontend/dist` are still ignored automatically. No new `.gitignore` file is required. Verify:
```bash
cd "f:/Rudvir/loan-hub-pro"
git check-ignore -v frontend/node_modules frontend/dist 2>/dev/null || echo "NOT IGNORED - investigate"
```
(Run this after Step 7's `npm install` creates `frontend/node_modules`, since `git check-ignore` needs the path to exist to report cleanly for a directory — or just trust the pattern-match logic and verify post-hoc in Step 7.)

### Step 6: Update root-level documentation that references frontend commands from repo root

```bash
cd "f:/Rudvir/loan-hub-pro"
grep -rln "npm run dev\|npm run build\|npm install" CLAUDE.md README.md 2>/dev/null
```

In `CLAUDE.md`, under "Frontend (Root Directory)", change the heading and add a `cd frontend` step:
- Old: `### Frontend (Root Directory)` followed directly by the `npm run dev` etc. commands.
- New: `### Frontend (frontend/ directory)` followed by:
```bash
cd frontend
npm run dev           # Start dev server (port 8080)
npm run build         # Production build
npm run build:dev     # Development build
npm run lint          # Run ESLint
npm run preview       # Preview production build
```

Also update the "Frontend Structure" file tree section in `CLAUDE.md` to prefix every path with `frontend/` (e.g. `src/App.tsx` → `frontend/src/App.tsx`), and update the "File Structure" backend tree's implicit sibling relationship if it references the frontend at all.

Do the same scan/update for `README.md` if it contains root-relative frontend commands (it currently documents an older port/setup — leave its content accuracy alone beyond the path change, that staleness is pre-existing and out of scope for this restructure).

### Step 7: Install and build from the new location

```bash
cd "f:/Rudvir/loan-hub-pro/frontend"
npm install
```
Expected: installs cleanly, same dependency tree as before (package.json/package-lock.json moved unchanged).

```bash
npx tsc --noEmit -p tsconfig.app.json
```
Expected: exit 0, no errors.

```bash
npm run build
```
Expected: succeeds, produces `frontend/dist/index.html` + `frontend/dist/assets/`.

```bash
npm run dev
```
Expected: Vite starts on `http://localhost:8080` with no path-resolution errors in the console. Open it in a browser (or use `curl -s http://localhost:8080 | head -20`) and confirm the login page HTML loads — this also confirms `styles/index.css` from Step 4 loaded correctly (check the browser for unstyled/broken layout, which would indicate the CSS import fix was missed). Then Ctrl+C.

### Step 8: Commit

```bash
cd "f:/Rudvir/loan-hub-pro"
git add -A
git commit -m "refactor: move frontend source and config into frontend/, relocate CSS into styles/"
```

---

## Phase 5: Consolidate root docs, add optional convenience root `package.json`

### Step 1: Move root-level docs into `docs/`, keep `README.md` and `CLAUDE.md` at root

`CLAUDE.md` must stay at repo root — Claude Code discovers it there automatically; moving it breaks that discovery. `README.md` conventionally stays at root as the repo's landing doc on GitHub/GitLab.

```bash
cd "f:/Rudvir/loan-hub-pro"
git mv DEPLOYMENT-GUIDE.md docs/
git mv DESIGN-DOCUMENT.md docs/
git mv FIXES-APPLIED.md docs/
git mv LOCAL-DEVELOPMENT.md docs/
git mv QUICK-START.md docs/
```

### Step 2: Fix cross-references to the moved docs

```bash
cd "f:/Rudvir/loan-hub-pro"
grep -rln "DEPLOYMENT-GUIDE\.md\|DESIGN-DOCUMENT\.md\|FIXES-APPLIED\.md\|LOCAL-DEVELOPMENT\.md\|QUICK-START\.md" README.md CLAUDE.md docs 2>/dev/null
```

For every match found (outside the files themselves), update the reference to include the `docs/` prefix, e.g. `[QUICK-START.md](QUICK-START.md)` → `[QUICK-START.md](docs/QUICK-START.md)`. Apply with Edit per file.

### Step 3: Update the `DEPLOYMENT-GUIDE.md` local paths for the new frontend/backend split

`docs/DEPLOYMENT-GUIDE.md` currently has local build steps like `cd F:\Rudvir\loan-hub-pro\backend` and `cd F:\Rudvir\loan-hub-pro` (for frontend build). Update the frontend build step to:
```
cd F:\Rudvir\loan-hub-pro\frontend
npm install
npx prisma generate   # (remove this line — it's backend-only, was likely copy-paste from the backend section above it; verify against the actual current content before editing)
npm run build
```
Read the file's current "Part 1: Local Build & Preparation" section before editing to confirm exact current wording, then apply the `frontend/` path fix precisely — don't restate content you haven't re-read.

Also note near "Local Development" section at the bottom of that file: the `cd F:\Rudvir\loan-hub-pro` frontend block needs the same `frontend/` suffix added.

### Step 4: Add an optional root `package.json` for convenience (delegates only, no workspaces, no new dependency)

Create `f:/Rudvir/loan-hub-pro/package.json`:
```json
{
  "name": "loan-hub-pro",
  "private": true,
  "version": "1.0.0",
  "description": "LoanMS monorepo root - delegates to frontend/ and backend/",
  "scripts": {
    "install:all": "npm install --prefix frontend && npm install --prefix backend",
    "dev:frontend": "npm run dev --prefix frontend",
    "dev:backend": "npm run dev --prefix backend",
    "build:frontend": "npm run build --prefix frontend",
    "build:backend": "npm run build --prefix backend",
    "lint:frontend": "npm run lint --prefix frontend"
  }
}
```

This does not use npm workspaces (no `workspaces` field), so it does not change how `frontend/node_modules` or `backend/node_modules` are installed/hoisted — purely additive convenience scripts, zero behavior change to either sub-project.

### Step 5: Verify the delegate scripts work

```bash
cd "f:/Rudvir/loan-hub-pro"
npm run build:frontend
npm run build:backend
```
Expected: both succeed, equivalent to running `npm run build` inside each folder directly (already proven in Phases 3/4).

### Step 6: Commit

```bash
cd "f:/Rudvir/loan-hub-pro"
git add -A
git commit -m "chore: consolidate root docs into docs/, add convenience root package.json"
```

---

## Phase 6: Full verification pass

Run this after all prior phases are committed, as a final end-to-end confirmation.

- [ ] **Step 1: Clean install both projects from scratch**

```bash
cd "f:/Rudvir/loan-hub-pro"
rm -rf frontend/node_modules backend/node_modules
npm run install:all
```
Expected: both installs succeed with no errors.

- [ ] **Step 2: Backend build + typecheck**

```bash
cd "f:/Rudvir/loan-hub-pro/backend"
npx prisma generate
npx tsc --noEmit
npm run build
```
Expected: all three succeed; `backend/dist/index.js` exists.

- [ ] **Step 3: Frontend build + typecheck**

```bash
cd "f:/Rudvir/loan-hub-pro/frontend"
npx tsc --noEmit -p tsconfig.app.json
npm run build
npm run lint
```
Expected: all succeed (pre-existing lint warnings, if any existed before this restructure, are acceptable — don't fix unrelated lint issues as part of this task).

- [ ] **Step 4: Start backend, confirm health + auth**

```bash
cd "f:/Rudvir/loan-hub-pro/backend"
npm run dev
```
In a second terminal, with the server running:
```bash
curl http://localhost:5000/health
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@loanms.com","password":"Admin@123"}'
```
Expected: `/health` returns `success: true`; login returns a JWT + user object (or a clear auth-failure JSON if that specific test account doesn't exist in your local DB — either way, confirms the endpoint runs, no route/import breakage from the restructure).

- [ ] **Step 5: File upload and PDF generation still resolve to the same folders**

With the backend running, confirm the static mounts still serve from the unmoved `backend/public/` (Phase 2/3 didn't touch this):
```bash
curl -I http://localhost:5000/uploads/profiles/1767457659194-hkpfr.PNG
curl -I http://localhost:5000/pdfs/payouts/$(ls "f:/Rudvir/loan-hub-pro/backend/public/pdfs/payouts" | head -1)
```
Expected: both return `HTTP/1.1 200 OK` (confirms `app.use('/uploads', ...)` / `app.use('/pdfs', ...)` in `app.ts` and the `process.cwd()`-relative resolution still work — untouched by this restructure since `backend/public/` never moved and `backend/` is still the process's cwd when launched via `npm run dev` from `backend/`).

- [ ] **Step 6: Start frontend, confirm it talks to the backend**

```bash
cd "f:/Rudvir/loan-hub-pro/frontend"
npm run dev
```
Open `http://localhost:8080` in a browser. Confirm:
- Login page renders (no blank screen / no console errors about failed module resolution)
- Logging in with a valid account succeeds and lands on the dashboard
- Dashboard KPIs load (confirms `VITE_API_URL` from the relocated `frontend/.env` is still being read correctly)
- Navigate to Customers, open a customer, generate a PDF — confirms the PDF-generation flow still works end-to-end through the relocated frontend talking to the untouched backend `public/pdfs/`

- [ ] **Step 7: Confirm git history was preserved for moved files**

```bash
cd "f:/Rudvir/loan-hub-pro"
git log --follow --oneline -- frontend/src/App.tsx | head -5
git log --follow --oneline -- backend/src/validators/index.ts | head -5
```
Expected: both show commit history from before the move (confirms `git mv` preserved blame/history rather than the files looking newly-created).

- [ ] **Step 8: Final summary commit (only if any fixups were needed during this verification phase)**

```bash
cd "f:/Rudvir/loan-hub-pro"
git status
# If anything changed during verification (e.g. a doc fixup you made while testing):
git add -A
git commit -m "chore: final verification fixups after restructure"
```

If `git status` is clean, no commit needed — the restructure is complete as of Phase 5's commit.

---

## Manual steps required from you (not automatable by this plan)

1. **`src/index1.css`** — differs in content from `src/index.css`, left untouched. Check whether it's an intentional variant or genuinely stale, and delete/keep it yourself.
2. **Production server (cPanel)** — this plan only restructures your local working tree. Your deployed production app at `dsaconnect.rudvirfinance.in` still runs the old (pre-restructure) layout until you redeploy. `docs/DEPLOYMENT-GUIDE.md`'s build/upload steps will need to be followed fresh from the new `frontend/` location next time you deploy — the guide's paths were updated in Phase 5 Step 3 to reflect this.
3. **Loose backend script audit** — `create-admin.ts`, `create-default-admin.ts`, `create-master-admin.ts`, `create-superadmin.ts` were all relocated to `backend/scripts/` as-is (per your "relocate, don't delete ambiguous files" choice) without judging which are superseded. If you know some are dead, delete them yourself from `backend/scripts/`.
4. **`.env` files** — never touched in content, only location. Double check `frontend/.env` and `backend/.env` still have the values you expect after the move (they should be byte-identical, just relocated).

---

## Final deliverable (produced after all phases are executed)

After execution, report back:
1. Final folder tree (`git ls-files` grouped by top-level folder, or an actual tree of the repo excluding `node_modules`/`dist`)
2. Summary of what moved, what was deleted, what was renamed
3. This "Manual steps required" list, verbatim
4. Updated dev commands:
   ```
   npm run install:all        # from repo root — installs both frontend and backend

   cd backend
   npm run dev                # backend on :5000

   cd frontend
   npm run dev                # frontend on :8080
   ```
5. List of every config file touched: `backend/package.json`, `backend/scripts/*.bat` (4 files), `CLAUDE.md`, `README.md`, `docs/DEPLOYMENT-GUIDE.md`, new root `package.json`. (`vite.config.ts`, `tsconfig.app.json`, `components.json` were verified to need no edits — see Phase 4 Step 3.)
