# LoanMS (FinConnect) — Designer Reference Document

**Version:** 1.0
**Date:** 2026-03-20
**Purpose:** Full product flow, pages, fields, and content details for UI/UX redesign

---

## TABLE OF CONTENTS

1. [Product Overview](#1-product-overview)
2. [User Roles & Access Matrix](#2-user-roles--access-matrix)
3. [Navigation Structure](#3-navigation-structure)
4. [Authentication Flow](#4-authentication-flow)
5. [Page-by-Page Specification](#5-page-by-page-specification)
   - 5.1 Landing / Index Page
   - 5.2 Login Page
   - 5.3 Signup Page (Multi-step)
   - 5.4 Forgot Password Page
   - 5.5 Reset Password Page
   - 5.6 Dashboard Page
   - 5.7 Loan Applications (Customers) Page
   - 5.8 Banks & NBFC Page
   - 5.9 Users Page
   - 5.10 Corporate DSA Page
   - 5.11 DSA Invoices Page
   - 5.12 Payouts Page
   - 5.13 Reports Page
   - 5.14 Profile Page
   - 5.15 Master Admin Page
6. [Modal / Dialog Specifications](#6-modal--dialog-specifications)
7. [Common Components](#7-common-components)
8. [Status & Badge System](#8-status--badge-system)
9. [Mobile Responsive Behavior](#9-mobile-responsive-behavior)
10. [Pricing Plans](#10-pricing-plans)

---

## 1. PRODUCT OVERVIEW

LoanMS is a **multi-tenant SaaS loan management system** used by loan DSA firms, NBFC agents, and financial intermediaries to manage loan applications from lead to disbursement.

**Core Functions:**
- Track loan applications through their lifecycle (Login → Approved → Disbursed)
- Manage bank and DSA partnerships with payout ratios
- Generate DSA invoices and channel partner payout ledgers
- Role-based access for teams (superadmin, admin, back-office, connectors)
- Reporting and analytics on application performance
- Platform-level billing management (master admin)

**Technology Stack (for designer awareness):**
- Frontend: React + TypeScript + Tailwind CSS + shadcn/ui components
- Backend: Node.js + PostgreSQL
- Auth: JWT tokens

---

## 2. USER ROLES & ACCESS MATRIX

There are **5 user roles** in the system:

| Role | Description | Scope |
|---|---|---|
| `master_admin` | Platform owner/operator | All organizations |
| `superadmin` | Organization owner | Within their org |
| `admin` | Organization manager | Within their org |
| `backoffice` | Operations staff | Within their org |
| `connector` | Sales / Channel Partner | Their own leads |

### Access Matrix

| Page / Feature | master_admin | superadmin | admin | backoffice | connector |
|---|:---:|:---:|:---:|:---:|:---:|
| Master Admin Dashboard | ✅ | ❌ | ❌ | ❌ | ❌ |
| Dashboard | ❌ | ✅ | ✅ | ✅ | ✅ |
| Loan Applications | ❌ | ✅ All | ✅ All | ✅ All | ✅ Own |
| Banks & NBFC | ❌ | ✅ Full | ❌ | ❌ | ❌ |
| Users | ❌ | ✅ Full | ✅ Partial | ❌ | ❌ |
| Corporate DSA | ❌ | ✅ Full | ❌ | ❌ | ❌ |
| DSA Invoices | ❌ | ✅ Full | ✅ View | ❌ | ❌ |
| Payouts | ❌ | ✅ Full | ✅ Full | ✅ View | ✅ Own |
| Reports | ❌ | ✅ Full | ✅ Full | ❌ | ❌ |
| Profile | ❌ | ✅ + Company | ✅ + Company | ✅ | ✅ |

### User Creation Permissions

| Creator | Can Create |
|---|---|
| superadmin | admin, backoffice, connector |
| admin | backoffice, connector |
| backoffice | — |
| connector | — |

---

## 3. NAVIGATION STRUCTURE

### Sidebar Menu (Left sidebar — authenticated users except master_admin)

```
MENU
├── Dashboard                        [All roles]
├── Loan Application                 [All roles]
│
MANAGEMENT (shown to admin+)
├── Banks & NBFC                     [superadmin only]
├── Users                            [superadmin, admin]
├── Corporate DSA                    [superadmin only]
│
FINANCE
├── DSA Invoices                     [superadmin, admin]
├── Payouts                          [superadmin, admin, connector]
├── Reports                          [superadmin, admin]
│
BOTTOM ACTIONS
├── Database Backup (button)         [superadmin only]
├── Profile                          [all roles]
└── Logout                           [all roles]
```

### Header Bar
- Left: Hamburger menu toggle (mobile) + Page title
- Right: User avatar + name + role badge + dropdown (Profile, Logout)

### Master Admin Navigation (separate)
```
TABS
├── Organizations          (list + manage orgs)
└── Billing / Invoices     (billing analytics + invoice management)
```

---

## 4. AUTHENTICATION FLOW

### 4.1 Full Authentication Flowchart

```
[User visits app]
       ↓
[Token in localStorage?]
   No ↓              Yes ↓
[/login page]    [Validate token → GET /api/auth/me]
                         ↓                    ↓
                  [Token valid]         [Token invalid]
                         ↓                    ↓
              [Role = master_admin?]     [/login page]
              Yes ↓         No ↓
         [/master-admin]  [/dashboard]
```

### 4.2 Login Flow

```
[Login Page]
     ↓
[Enter Email + Password]
     ↓
[POST /api/auth/login]
     ↓ success              ↓ error
[Store JWT token]     [Show error message]
[Redirect by role]    [Stay on login page]
```

### 4.3 Signup Flow (New Organization)

```
[Signup Page]
     ↓
[Step 1: Organization Details]
     ↓ Next
[Step 2: Admin Account Setup]
     ↓ Next
[Step 3: Select Pricing Plan]
     ↓ Submit
[POST /api/signup]
     ↓ success              ↓ error
[Show success message]  [Show errors]
[Redirect to /login]    [Stay on step]
```

### 4.4 Password Reset Flow

```
[/forgot-password] → Enter email → POST /api/auth/forgot-password
                                           ↓
                              [Email with reset link sent]
                                           ↓
                          [User clicks link → /reset-password?token=xxx]
                                           ↓
                         [Enter new password + confirm] → POST /api/auth/reset-password
                                           ↓
                                  [Redirect to /login]
```

---

## 5. PAGE-BY-PAGE SPECIFICATION

---

### 5.1 Landing / Index Page (`/`)

**Purpose:** Public landing/marketing page. Redirects authenticated users to dashboard.

**Content Sections:**
1. Hero Section — Product tagline, CTA buttons (Get Started → /signup, Login → /login)
2. Features Overview
3. Pricing Plans (Starter, Professional, Enterprise)
4. Footer

**State:** If user is already logged in → redirect to `/dashboard` or `/master-admin`

---

### 5.2 Login Page (`/login`)

**Purpose:** Authenticate existing users.

**Layout:** Centered card on full-screen background

**Fields:**

| Field | Type | Placeholder | Validation |
|---|---|---|---|
| Email Address | email input | `name@company.com` | Required, valid email |
| Password | password input (toggleable) | `••••••••` | Required, min 6 chars |

**Links / Actions:**
- "Forgot Password?" link → `/forgot-password`
- "Sign In" button (primary, full-width)
- Show/Hide password toggle icon on password field
- "Don't have an account? Sign up" link → `/signup`

**Error States:**
- Invalid credentials → inline error below form
- Network error → toast notification

**Success:** Redirect based on role → `/master-admin` or `/dashboard`

---

### 5.3 Signup Page (`/signup`) — Multi-Step Wizard

**Purpose:** Self-service organization registration with 14-day free trial.

**Layout:** Multi-step form with step indicator at top (3 steps)

---

#### Step 1: Organization Details

**Step Label:** "Organization Information"

| Field | Type | Placeholder | Required | Validation |
|---|---|---|---|---|
| Organization Name | text | `ABC Finance Corp` | Yes | Required |
| Email | email | `admin@company.com` | Yes | Required, valid email |
| Phone | text | `9876543210` | Yes | Required |
| Website | text (url) | `https://company.com` | No | Valid URL format |
| Address | text | `City, State, Country` | No | — |
| Organization Logo | file upload | — | No | JPG/PNG only |

**Navigation:** Next button → Step 2

---

#### Step 2: Super Admin Account

**Step Label:** "Admin Account Setup"

| Field | Type | Placeholder | Required | Validation |
|---|---|---|---|---|
| First Name | text | `John` | Yes | Required |
| Last Name | text | `Doe` | Yes | Required |
| Email | email | `john@company.com` | Yes | Required, valid email |
| Mobile | text | `9876543210` | Yes | Required, max 10 digits |
| Password | password | `••••••••` | Yes | Required, min 8 chars |
| Confirm Password | password | `••••••••` | Yes | Must match Password |

**Navigation:** Back → Step 1 | Next → Step 3

---

#### Step 3: Plan Selection

**Step Label:** "Choose Your Plan"

**3 Plan Cards displayed side-by-side:**

| Plan | Price | Seats | Features |
|---|---|---|---|
| Starter | ₹499/seat/month | 1–5 seats | Basic features |
| Professional | ₹899/seat/month | 5–25 seats | Advanced features |
| Enterprise | ₹1499/seat/month | 10+ seats | All features, unlimited |

**For each plan card:**
- Plan name (title)
- Price per seat
- Seat range
- Feature list (bullets)
- Select button

**After plan selected:**
- Number of Seats input (number, min/max based on plan)
- Monthly total calculation displayed: `Seats × Price = ₹X/month`

**Navigation:** Back → Step 2 | Submit (Create Organization)

---

### 5.4 Forgot Password Page (`/forgot-password`)

**Layout:** Centered card

| Field | Type | Placeholder | Validation |
|---|---|---|---|
| Email Address | email | `name@company.com` | Required, valid email |

**Actions:**
- "Send Reset Link" button
- "Back to Login" link

**Success State:** "Check your email for a reset link" message

---

### 5.5 Reset Password Page (`/reset-password`)

**Layout:** Centered card (accessed via email link with `?token=xxx` query param)

| Field | Type | Placeholder | Validation |
|---|---|---|---|
| New Password | password | `••••••••` | Required, min 8 chars |
| Confirm Password | password | `••••••••` | Must match new password |

**Actions:**
- "Reset Password" button
- "Back to Login" link

**Success State:** Redirect to `/login` with success toast

---

### 5.6 Dashboard Page (`/dashboard`)

**Purpose:** Overview of loan application performance with KPI cards and charts.

**Layout:** Full-width page with header, KPI grid, charts, and recent data tables

---

#### Header Section
- Page title: "Dashboard"
- Sub-label:
  - Non-connector: "Overview of loan applications and performance"
  - Connector: "View your performance metrics"
- Date Range Picker (start date — end date)
  - Default: First of current month → Today
  - Triggers KPI data refresh on change

---

#### KPI Cards Section (7 cards in a grid)

| Card | Icon | Color | Data |
|---|---|---|---|
| Login | LogIn icon | Primary (blue) | Count of Login status applications |
| Rejected | XCircle icon | Destructive (red) | Count of Rejected |
| Approved | CheckCircle icon | Success (green) | Count of Approved |
| Disbursed | Wallet icon | Accent (purple) | Count of Disbursed |
| Hold | Pause icon | Warning (yellow) | Count of Hold |
| Relook | RefreshCw icon | Info (blue) | Count of Relook |
| Drop | TrendingDown icon | Destructive (red) | Count of Drop |

Each card shows: Icon + Label + Count number

---

#### Top Performers Section
- Title: "Top Performers" + current month/year
- Shows top channel partners by performance
- Columns: Rank, Name, Applications, Approved, Disbursed
- If connector role: shows only own stats

---

#### Application Trends Chart
- Line chart showing application volume over time
- X-axis: Date range
- Y-axis: Application count
- Series: One line per loan status (color-coded)
- Filtered by selected date range

---

#### Recent Applications Section
- Title: "Recent Loan Applications"
- Table showing latest 5–10 applications
- Columns: Customer Name, Loan Type, Amount, Status badge, Date

---

### 5.7 Loan Applications Page (`/customers`)

**Purpose:** Full loan application management — create, view, edit, update status, duplicate.

**Layout:** Page header + toolbar + data table (desktop) / card list (mobile)

---

#### Page Header
- Title: "Loan Application"
- "Add Application" button (primary, top-right)

---

#### Toolbar / Filters
- Search input: "Search by name, mobile, email, ID..." (max-w-md)
- No additional filter dropdowns on this page (filters built into table/search)

---

#### Table View (Desktop)

| Column | Display | Sortable | Notes |
|---|---|---|---|
| Application Date | DD/MM/YYYY | Yes | — |
| Application ID | Text (auto-generated) | Yes | Clickable to view |
| Customer Name | Text | Yes | — |
| Mobile | 10-digit number | Yes | — |
| Email | Email text | Yes | — |
| Loan Type | Badge (PL/HL/BL) | Yes | Color-coded |
| Loan Amount | ₹ formatted | Yes | — |
| Status | Colored badge | Yes | See Status System |
| Bank Name | Text | Yes | — |
| DSA Name | Text | Yes | — |
| Channel Partner | Text | Yes | — |
| Lead Owner | Text | Yes | — |
| Remark | Text (truncated) | No | — |
| Actions | Icon buttons | — | View, Edit, Duplicate, Delete |

**Row Actions:**
- View (eye icon) → opens View Dialog
- Edit (pencil icon) → opens Edit Dialog
- Duplicate (copy icon) → creates duplicate record
- Delete (trash icon) → confirmation then delete

---

#### Card View (Mobile)

Each card shows:
- Application ID + Date (top)
- Customer Name (large)
- Mobile | Email
- Loan Type badge + Amount
- Status badge
- Bank + DSA
- Action buttons: View, Edit, Duplicate, Delete

---

#### Application Form Dialog

**Dialog Modes:** Add | Edit | View

**Dialog Size:** Large (max-width 4xl), scrollable

**Tabs (5 tabs):**

---

**Tab 1: Basic Information**

| Field | Type | Placeholder | Required | Notes |
|---|---|---|---|---|
| Application Date | date picker | Today's date | Yes | Auto-filled |
| Application ID | text (read-only) | Auto-generated | — | Read-only |
| Full Name | text | — | Yes | — |
| Father's Name | text | — | No | — |
| Mother's Name | text | — | No | — |
| Spouse Name | text | — | No | — |
| Mobile | text | 10 digits | Yes | — |
| Email | email | — | No | — |
| Gender | radio buttons | — | No | Male / Female / Other |
| Marital Status | select | — | No | Single, Married, Divorced, Widowed |
| Date of Birth | date picker | — | No | — |

---

**Tab 2: Loan Details**

| Field | Type | Placeholder | Required | Options |
|---|---|---|---|---|
| Loan Type | select | — | Yes | PL (Personal Loan), HL (Home Loan), BL (Business Loan) |
| Bank | select | — | Yes | Fetched from banks list |
| Loan Amount | number | — | No | ₹ currency |
| Loan Purpose | select | — | No | Home Purchase, Home Renovation, etc. |
| Loan Tenure | number | months | No | Duration in months |
| Lead Owner | select | — | No | Fetched from admins list |
| DSA Name | select | — | No | Fetched from DSAs list |
| Channel Partner | select | — | No | Fetched from connectors list |
| Lead Status | select | — | No | login, rejected, approved, disbursed, hold, relook, drop |
| Case Type | select | — | No | fresh, bt (balance transfer), bt_topup |

---

**Tab 3: Income & Employment**

| Field | Type | Placeholder | Required | Options |
|---|---|---|---|---|
| Employment Type | select | — | No | Salaried, Self-employed, Professional |
| Company Name | text | — | No | — |
| Designation | text | — | No | — |
| Monthly Income | number | — | No | ₹ currency |
| Annual Income | number | — | No | ₹ currency |
| Business Type | text | — | No | Shown for self-employed |

---

**Tab 4: Property & Liabilities**

| Field | Type | Placeholder | Required | Options |
|---|---|---|---|---|
| Home Type | select | — | No | Own, Rental, Self-occupied |
| Property Value | number | — | No | ₹ currency |
| Property Address | text | — | No | — |
| Existing Liabilities | number | — | No | ₹ monthly obligations |
| Number of Dependents | number | — | No | — |

---

**Tab 5: Documents**

| Field | Type | Placeholder | Required | Notes |
|---|---|---|---|---|
| PAN Card | text | — | No | PAN number |
| Aadhaar Number | text | — | No | 12-digit Aadhaar |
| Document Upload | file upload | — | No | Multiple files, attached to application |

---

**View Mode Additional Actions:**
- Download PDF button → generates printable application PDF
- Add Remark button → opens inline remark input
- Update Status button → status change dropdown
- Duplicate button → creates copy of application
- Edit button → switches to edit mode

---

### 5.8 Banks & NBFC Page (`/banks`)

**Purpose:** Manage list of banks and NBFCs used in loan applications.

**Roles:** Superadmin only

**Layout:** Page header + search + table

---

#### Page Header
- Title: "Banks & NBFC"
- "Add Bank" button (primary, top-right)

---

#### Toolbar
- Search input: "Search banks..." (max-w-md)

---

#### Table (Desktop)

| Column | Type | Notes |
|---|---|---|
| # | number | Row index |
| Bank/NBFC Name | text | — |
| Added On | date | DD/MM/YYYY |
| Actions | buttons | Edit (pencil), Delete (trash) |

**Pagination:** 15 items per page, with page controls

---

#### Card View (Mobile)

Each card shows:
- Bank name (large)
- "Added: DD/MM/YYYY"
- Edit + Delete action buttons

---

#### Add / Edit Bank Dialog

**Dialog Size:** Small (max-w-md)

| Field | Type | Placeholder | Required | Validation |
|---|---|---|---|---|
| Bank/NBFC Name | text | `Enter bank or NBFC name` | Yes | Required, unique |

**Actions:** Save / Cancel

---

### 5.9 Users Page (`/users`)

**Purpose:** Manage team members within the organization.

**Roles:** Superadmin (full), Admin (limited — can create Backoffice + Connector)

**Layout:** Page header + seat usage indicator + search + table

---

#### Page Header
- Title: "Users"
- Seat Usage indicator: `X / Y seats used` (based on subscription plan)
- "Add User" button (primary, top-right)

---

#### Toolbar
- Search input: "Search by name, email, or mobile..." (max-w-md)

---

#### Table (Desktop)

| Column | Type | Notes |
|---|---|---|
| Name | text | First + Last name |
| Mobile | text | 10-digit number |
| Email | email | — |
| User Type | role badge | Color-coded per role |
| Actions | buttons | Edit (pencil), Delete (trash) |

**Pagination:** 15 items per page

---

#### Role Badge Colors

| Role | Badge Style |
|---|---|
| superadmin | Accent / Purple |
| admin | Primary / Blue |
| backoffice | Info / Light Blue |
| connector | Success / Green |

---

#### Card View (Mobile)

Each card shows:
- Name (large) + Role badge
- Mobile | Email
- Edit + Delete buttons

---

#### Add / Edit User Dialog

**Dialog Size:** Medium (max-w-2xl), scrollable

**Basic Fields:**

| Field | Type | Placeholder | Required | Validation |
|---|---|---|---|---|
| First Name | text | — | Yes | Required |
| Last Name | text | — | Yes | Required |
| Mobile Number | text | 10 digits | Yes | Exactly 10 digits |
| Email Address | email | — | Yes | Valid email |
| Password | password | — | New: Yes / Edit: No | Min 6 chars |
| User Type | select | — | Yes | See options by creator role |

**User Type Options (based on creator):**

| Creator Role | Can Create |
|---|---|
| superadmin | Admin, BackOffice, Channel Partner |
| admin | BackOffice, Channel Partner |

---

**Conditional Section: Bank Details** (shown when User Type = Channel Partner / Connector)

Repeatable row group with "Add Bank" button:

| Field | Type | Placeholder | Required |
|---|---|---|---|
| Bank | select (from banks list) | Select bank | Yes |
| Loan Type | select | Select loan type | Yes |
| Payout Ratio (%) | number (step 0.1) | `e.g. 0.5` | Yes |

Row action: Remove (X button)

**Note:** Connector users must have at least one bank-payout record

**Actions:** Create User / Update User | Cancel

---

### 5.10 Corporate DSA Page (`/dsa`)

**Purpose:** Manage Corporate DSA (Direct Selling Agent) partners and their bank payout agreements.

**Roles:** Superadmin only

**Layout:** Page header + search + accordion list

---

#### Page Header
- Title: "Corporate DSA"
- "Add DSA" button (primary, top-right)

---

#### Toolbar
- Search input: "Search DSAs..." (max-w-md)

---

#### DSA List (Accordion Style)

Each DSA is shown as an accordion row:

**Collapsed View:**
- DSA Name + company name
- "X bank partnerships" badge
- Actions: View (eye), Edit (pencil), Delete (trash)

**Expanded View (on click):**
- Bank Partnerships Sub-table:

| Column | Type |
|---|---|
| Bank Name | text |
| Loan Type | badge |
| Payout Ratio | % text |

**Pagination:** 15 DSAs per page

---

#### Add / Edit DSA Dialog

**Dialog Size:** Large (max-w-2xl), scrollable

**Section 1: Basic Information**

| Field | Type | Placeholder | Required | Validation |
|---|---|---|---|---|
| DSA Name | text | `Enter DSA name` | Yes | Required |
| Company Name | text | `Enter company name` | No | — |
| Email | email | `Enter email address` | No | Valid email |
| GSTIN | text (uppercase) | `Enter GSTIN` | No | Max 15 chars |

**Section 2: Address Information**

| Field | Type | Placeholder | Required | Validation |
|---|---|---|---|---|
| Address | text | `Enter address` | No | — |
| City | text | `Enter city` | No | — |
| Pin Code | text | `Enter pin code` | No | Max 6 digits |
| State | text | `Enter state name` | No | — |
| State Code | text | `Enter state code (e.g., 27)` | No | Max 2 chars |

**Section 3: Bank Details** (Repeatable, same as User Connector bank details)

| Field | Type | Options |
|---|---|---|
| Bank | select | All banks in org |
| Loan Type | select | Personal Loan, Home Loan, Business Loan |
| Payout Ratio (%) | number (step 0.1) | 0–100 |

Row action: Remove (X button) | "Add Bank" button to add rows

**Actions:** Save DSA / Cancel

---

#### View DSA Dialog

**Dialog Size:** Large (max-w-2xl)

**Read-only display of all fields:**
- Basic info section (name, company, email, GSTIN)
- Address section
- Bank Partnerships table

**Actions:** Edit button → opens Edit Dialog | Delete button | Close

---

### 5.11 DSA Invoices Page (`/dsa-invoices`)

**Purpose:** Generate and manage monthly invoices for Corporate DSA partners based on disbursed loan payouts.

**Roles:** Superadmin (full), Admin (view only)

**Layout:** Page header + table

---

#### Page Header
- Title: "DSA Invoices"
- "Generate Invoice" button (primary, top-right) [Superadmin only]

---

#### Invoices Table (Desktop)

| Column | Type | Notes |
|---|---|---|
| Invoice No | text | INV-YYYY-### format |
| DSA Name | text | — |
| Period | text | Month Year (e.g., "January 2026") |
| Invoice Date | date | DD/MM/YYYY |
| Amount | currency | ₹ formatted |
| Status | badge | Generated, Paid, Cancelled |
| Actions | buttons | View, Download PDF, Delete |

**Pagination:** 15 items per page

---

#### Generate Invoice Dialog

**Dialog Size:** Medium (max-w-md)

| Field | Type | Placeholder | Required | Options |
|---|---|---|---|---|
| Select DSA | select | Choose a DSA | Yes | All DSAs in org |
| Month | select | Select month | Yes | 1–12 (January–December) |
| Year | select | Select year | Yes | Last 5 years |

**Actions:** Generate / Cancel

---

#### View Invoice Dialog

**Dialog Size:** Large (max-w-2xl)

**Invoice Preview Display:**

| Item | Content |
|---|---|
| Invoice Number | INV-YYYY-### |
| Invoice Date | DD/MM/YYYY |
| DSA Name | Name |
| Period | Month Year |
| Taxable Amount | ₹ X,XX,XXX |
| CGST (rate%) | ₹ amount |
| SGST/UTGST (rate%) | ₹ amount |
| **Total Amount** | **₹ X,XX,XXX** |

**Actions:** Download PDF | Close

---

### 5.12 Payouts Page (`/payouts`)

**Purpose:** Track channel partner earnings, advances, and net payouts with monthly ledger.

**Roles:** Superadmin & Admin (all connectors), Connector (own data only)

**Layout:** Page header + connector selector + balance summary cards + monthly accordion

---

#### Page Header
- Title: "Payouts"
- "Add Entry" button (primary, top-right) [Superadmin/Admin only]

---

#### Connector Selector (Superadmin / Admin view only)
- Dropdown: "Select Channel Partner"
- Options: All connectors in the organization
- On change: filters all data below

---

#### Balance Summary Cards

| Card | Value |
|---|---|
| Total Earned | ₹ total credit amount |
| Total Advance | ₹ total debit amount |
| Net Balance | ₹ (Earned − Advance) |

---

#### Monthly Payout Ledger (Accordion)

Each month is one accordion row:

**Accordion Header (Collapsed):**

| Element | Value |
|---|---|
| Month/Year | e.g., "February 2026" |
| Earned | ₹ credit for the month |
| Advance | ₹ debit for the month |
| Net | ₹ net for the month |
| Entry Count | "X entries" |
| Download PDF | Button (generates monthly statement) |

**Accordion Body (Expanded — Ledger Entries Table):**

| Column | Type | Notes |
|---|---|---|
| Date | date | Entry date |
| Customer Name | text | Or "Carry Forward" badge |
| Description | text | Entry description |
| Payout (Credit) | currency (green) | ₹ amount |
| Advance (Debit) | currency (red) | ₹ amount |
| Created By | text | User who added entry |

**Pagination:** 15 months per page

---

#### Add Ledger Entry Dialog

**Dialog Size:** Standard

| Field | Type | Placeholder | Required | Options |
|---|---|---|---|---|
| Channel Partner | select | Select partner | Yes | All connectors |
| Entry Type | select | — | Yes | Earned (Credit), Advance (Debit) |
| Month | select | — | Yes | 1–12 |
| Year | number | e.g., 2026 | Yes | — |
| Amount | number (step 0.01) | — | Yes | ₹ positive value |
| Description | textarea | — | Yes | Free text |

**Actions:** Add Entry / Cancel

---

### 5.13 Reports Page (`/reports`)

**Purpose:** Analytics and reporting on loan applications with export functionality.

**Roles:** Superadmin, Admin

**Layout:** Page header + summary cards + filter panel + table

---

#### Page Header
- Title: "Reports"
- "Export to Excel" button (secondary, top-right) → downloads CSV

---

#### Summary Cards (4 cards)

| Card | Icon | Value |
|---|---|---|
| Total Applications | FileText | Count of records in current filter |
| Total Loan Amount | ₹ | Sum of all loan amounts |
| Disbursed Amount | ✓ | Sum of disbursed loans |
| Total Payout | % | Sum of payout amounts |

---

#### Filter Panel (horizontal row above table)

| Filter | Type | Default | Options |
|---|---|---|---|
| Date Range | date range picker | Last month → Today | Any date range |
| Bank | select | All Banks | All banks in org |
| DSA | select | All DSAs | All DSAs in org |
| Channel Partner | select | All | All connectors |
| Lead Owner | select | All | All admins/backoffice |
| Reset Filters | button | — | Clears all filters |

---

#### Reports Table (Desktop)

| Column | Type | Filterable |
|---|---|---|
| Date | date | Yes |
| Application ID | text | Yes (search) |
| Customer Name | text | Yes (search) |
| Contact | Mobile + Email | Yes (search) |
| Location | City/Address | Yes |
| Loan Type | badge | Yes (filter) |
| Loan Amount | currency | Yes |
| Payout | currency | — |
| Status | colored badge | Yes (status filter) |
| DSA | text | Yes |
| Bank Name | text | Yes |
| Channel Partner | text | Yes |
| Lead Owner | text | Yes |
| Remark | text (truncated) | — |

**Table Search:** Inline search across name, mobile, email, application ID

**Status Quick Filter:** Tab-style or dropdown filter:
- All | Login | Rejected | Approved | Disbursed | Hold | Relook | Drop

**Pagination:** 25 items per page

---

### 5.14 Profile Page (`/profile`)

**Purpose:** User settings, appearance, and company configuration.

**Roles:** All authenticated users (company section: superadmin + admin only)

**Layout:** Single-column page with multiple section cards

---

#### Section 1: Profile Photo

| Element | Description |
|---|---|
| Avatar preview | Circle, 120×120px |
| Upload Photo button | Accept: JPG, PNG, GIF; Max: 5MB |
| Delete Photo button | Removes current photo |

---

#### Section 2: Personal Information

| Field | Type | Placeholder | Required |
|---|---|---|---|
| First Name | text | — | Yes |
| Last Name | text | — | Yes |
| Email | email | — | Yes |
| Mobile | text | max 10 digits | No |

---

#### Section 3: Change Password

| Field | Type | Placeholder | Notes |
|---|---|---|---|
| New Password | password | `••••••••` | Leave blank to keep current |
| Confirm Password | password | `••••••••` | Must match new password |

Info note: "Leave blank to keep your current password"

---

#### Section 4: Appearance

| Field | Type | Options |
|---|---|---|
| Theme | select | Light, Dark, System |

---

#### Section 5: Company Details *(Superadmin & Admin only)*

| Field | Type | Placeholder | Required |
|---|---|---|---|
| Company Name | text | — | No |
| Company Email | email | — | No |
| Company Address | textarea (3 rows) | — | No |
| Company GSTIN/UIN | text | — | No (max 15 chars) |
| Company State | text | — | No |
| Company State Code | text | — | No (max 2 chars) |
| HSN/SAC Code | text | `997159` | No |
| CGST Rate | number | `9` | No |
| SGST/UTGST Rate | number | `9` | No |

**Actions:** Save Changes button (at bottom of each section or global)

---

### 5.15 Master Admin Page (`/master-admin`)

**Purpose:** Platform-level administration — manage all organizations and billing.

**Roles:** master_admin only

**Layout:** Page with two tabs

---

#### Tab 1: Organizations

**Purpose:** List and manage all organizations on the platform.

**Summary Cards (top):**

| Card | Value |
|---|---|
| Total Organizations | Count |
| Active Organizations | Count |
| Trial Organizations | Count |
| Revenue (MRR) | ₹ total |

---

**Organizations Table:**

| Column | Type | Notes |
|---|---|---|
| Organization Name | text | — |
| Email | email | — |
| Plan | badge | Starter / Professional / Enterprise |
| Seats | text | Used / Total |
| Status | badge | trial, active, suspended |
| Created | date | — |
| Actions | buttons | View, Edit, Suspend, Delete |

---

**Organization Detail (click to expand or side panel):**
- Name, email, phone, website, address
- Plan details + seat count + billing amount
- Superadmin account details
- Created date, trial end date
- Status management (activate/suspend)

---

#### Tab 2: Billing / Invoices

**Purpose:** Manage platform invoices for organizations.

**Analytics Cards:**

| Card | Value |
|---|---|
| Total Revenue | ₹ |
| Active Subscriptions | Count |
| Pending Invoices | Count |
| Overdue Invoices | Count |

---

**Invoices Table:**

| Column | Type | Notes |
|---|---|---|
| Invoice No | text | INV-YYYY-### |
| Organization | text | — |
| Period | text | Month Year |
| Amount | currency | ₹ |
| Status | badge | Generated, Paid, Overdue, Cancelled |
| Due Date | date | — |
| Actions | buttons | View, Download, Update Status, Delete |

---

## 6. MODAL / DIALOG SPECIFICATIONS

### Summary of All Dialogs

| Dialog | Trigger | Size | Tabs/Sections |
|---|---|---|---|
| Add/Edit Customer | "Add Application" btn or Edit icon | max-w-4xl | 5 tabs |
| View Customer | View icon | max-w-4xl | 5 tabs (read-only) |
| Add/Edit Bank | "Add Bank" btn or Edit icon | max-w-md | Single form |
| Add/Edit User | "Add User" btn or Edit icon | max-w-2xl | Single form + conditional section |
| Add/Edit DSA | "Add DSA" btn or Edit icon | max-w-2xl | 3 sections + repeatable rows |
| View DSA | View icon | max-w-2xl | Read-only display |
| Generate DSA Invoice | "Generate Invoice" btn | max-w-md | Single form |
| View DSA Invoice | View icon | max-w-2xl | Invoice preview |
| Add Payout Entry | "Add Entry" btn | Standard | Single form |
| Database Backup | Backup btn (sidebar) | sm:max-w-md | Confirm + path input |
| Admin Password Verify | Access to protected pages | Standard | Single password field |

---

### Admin Password Verification Dialog

**Trigger:** When accessing sensitive sections (DSA, Invoices, Reports, Users, Payouts)

**Purpose:** Extra security layer before viewing sensitive data

| Field | Type | Placeholder |
|---|---|---|
| Password | text (visible) | Enter your password |

**Actions:** Verify | Cancel

**Behavior:** On success → proceeds to the protected section

---

### Database Backup Dialog

**Trigger:** "Database Backup" button in sidebar (Superadmin only)

| Field | Type | Default | Notes |
|---|---|---|---|
| Save Location | text | `D:\Backups` | Folder path; created if not exists |

**Actions:** Start Backup | Cancel

**Behavior:** Calls POST `/api/backup`, shows progress/success/error

---

## 7. COMMON COMPONENTS

### 7.1 Page Header Component
```
[Page Title]                               [Primary Action Button]
[Optional subtitle]
```

### 7.2 Search Bar
- Full-width on mobile, max-w-md on desktop
- Placeholder text varies per page
- Real-time filtering (debounced ~300ms)

### 7.3 Pagination Component
```
Showing X–Y of Z results        [< Prev] [1] [2] [3] [Next >]
```

### 7.4 Empty State
- Icon (relevant to content type)
- Title: "No [items] found"
- Subtitle: Action prompt ("Add your first bank to get started")
- Optional CTA button

### 7.5 Loading State
- Skeleton placeholders matching table/card layout
- Spinner for small inline actions

### 7.6 Toast Notifications
- Position: Top-right corner
- Types: Success (green), Error (red), Info (blue), Warning (yellow)
- Auto-dismiss: 3–5 seconds

### 7.7 Confirm Delete Dialog
- Title: "Delete [Item Name]?"
- Body: "This action cannot be undone. Are you sure you want to delete this [item]?"
- Actions: Delete (destructive/red) | Cancel

### 7.8 Date Range Picker
- Two calendar inputs (Start Date, End Date)
- Preset options: Today, This Week, This Month, Last Month, Custom
- Used in: Dashboard, Reports

---

## 8. STATUS & BADGE SYSTEM

### Loan Application Status

| Status | Color | Meaning |
|---|---|---|
| `login` | Blue (Primary) | Application submitted/in process |
| `rejected` | Red (Destructive) | Application rejected by bank |
| `approved` | Green (Success) | Application approved |
| `disbursed` | Purple (Accent) | Loan amount disbursed |
| `hold` | Yellow (Warning) | Application on hold |
| `relook` | Blue (Info) | Needs review/additional docs |
| `drop` | Red (Destructive) | Application dropped by customer |

### Case Type

| Type | Display |
|---|---|
| `fresh` | Fresh Case |
| `bt` | Balance Transfer |
| `bt_topup` | BT + Top Up |

### Loan Type

| Code | Full Name | Badge Color |
|---|---|---|
| `PL` | Personal Loan | Orange |
| `HL` | Home Loan | Green |
| `BL` | Business Loan | Blue |

### Organization Status (Master Admin)

| Status | Color |
|---|---|
| `trial` | Yellow |
| `active` | Green |
| `suspended` | Red |

### Invoice Status

| Status | Color |
|---|---|
| `generated` | Blue |
| `paid` | Green |
| `overdue` | Red |
| `cancelled` | Gray |

---

## 9. MOBILE RESPONSIVE BEHAVIOR

### Breakpoints
- Mobile: < 768px
- Tablet: 768px – 1024px
- Desktop: > 1024px

### Navigation
- Desktop: Fixed left sidebar (always visible)
- Mobile: Hidden sidebar, toggled via hamburger menu button in header
- Mobile sidebar: Slides in from left, full overlay with backdrop

### Tables → Cards (Mobile)
All data tables convert to card layout on mobile:
- Each record becomes a card with key fields
- Action buttons move to bottom of card
- Less important columns are hidden or collapsed

### Dialog / Modal Behavior
- Desktop: Centered overlay modal
- Mobile: Full-screen drawer from bottom or side

### Forms
- Desktop: Multi-column grid layout (2–3 columns)
- Mobile: Single-column stacked layout

---

## 10. PRICING PLANS

| Plan | Monthly Price | Seat Range | Target |
|---|---|---|---|
| Starter | ₹499/seat | 1–5 seats | Small agencies |
| Professional | ₹899/seat | 5–25 seats | Mid-size firms |
| Enterprise | ₹1499/seat | 10+ (unlimited) | Large organizations |

**Billing Calculation:** Selected seats × price per seat = Monthly total

**Trial:** All new organizations get 14-day free trial before billing begins

**Seat Definition:** One "seat" = one user account (any role except master_admin)

---

## APPENDIX: FIELD NAMING CONVENTIONS

| UI Label | API Field Name | Notes |
|---|---|---|
| Application ID | applicationId | Auto-generated |
| Loan Type | loanType | PL / HL / BL |
| Lead Status | status | login/rejected/approved/disbursed/hold/relook/drop |
| Channel Partner | connectorId | References User with connector role |
| Lead Owner | leadOwnerId | References User with admin role |
| DSA Name | dsaId | References DSA entity |
| Payout Ratio | payoutRatio | Decimal percentage (e.g., 0.5 = 0.5%) |
| GSTIN | gstin | Max 15 chars, uppercase |
| State Code | stateCode | Max 2 chars, numeric |

---

*Document generated from codebase analysis — March 2026*
*For questions, refer to CLAUDE.md and backend documentation files*
