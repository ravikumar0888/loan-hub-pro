# Dashboard & Payout System - Complete Implementation Guide

## ✅ COMPLETED BACKEND CHANGES

### 1. Dashboard Service (backend/src/services/dashboard.service.ts)
**Status:** ✅ COMPLETE

**Changes Made:**
- Removed old KPIs and trend methods
- Added `getDashboardData()` - main method that returns role-based dashboard
- Added `getTopConnectors()` - for Admin, SubAdmin
- Added `getTopDSAs()` - for Admin, SubAdmin, BackOffice
- Added `getTopBanks()` - for all roles
- Added `getTopLoanTypes()` - for all roles
- Added `getTopBackOfficeUsers()` - for Admin only
- Added `getTopLeadOwners()` - for BackOffice only
- Added `getDisbursementTable()` - for Admin only (runtime table)

**Key Features:**
- All calculations are runtime based on month/year filter
- Defaults to current month/year if not provided
- Only counts `status: 'disbursed'` customers
- Role-based filtering:
  - Admin: sees all data
  - SubAdmin: filtered by `leadOwner = userId`
  - BackOffice: filtered by `createdBy = userId`
  - Connector: filtered by `connectorId = userId`
- All results sorted by totalDisbursement descending

### 2. Dashboard Controller (backend/src/controllers/dashboard.controller.ts)
**Status:** ✅ COMPLETE

**Changes Made:**
- Simplified to single endpoint: `getDashboardData()`
- Accepts query params: `month` (1-12), `year` (e.g., 2024)
- Returns complete dashboard data based on role

### 3. Dashboard Routes (backend/src/routes/dashboard.routes.ts)
**Status:** ✅ COMPLETE

**Changes Made:**
- Single route: `GET /api/dashboard?month=1&year=2024`
- Returns role-specific dashboard data

## 📋 REMAINING FRONTEND IMPLEMENTATION

### Frontend Dashboard Page (src/pages/Dashboard.tsx)

**Required Changes:**

1. **Remove:**
   - Left sidebar filters
   - Customer DataTable
   - All old KPI cards

2. **Add Top Section:**
   ```tsx
   // Month/Year Filter (at top)
   <div className="flex gap-4 mb-6">
     <Select value={month} onChange={setMonth}>
       <option value="1">January</option>
       // ... all 12 months
     </Select>
     <Select value={year} onChange={setYear}>
       <option value="2024">2024</option>
       <option value="2025">2025</option>
       <option value="2026">2026</option>
     </Select>
   </div>
   ```

3. **Admin Dashboard Widgets:**
   ```tsx
   // Display based on API response
   {data.topConnectors && <TopCard title="Top Connector" items={data.topConnectors} />}
   {data.topDSAs && <TopCard title="Top DSA" items={data.topDSAs} />}
   {data.topBanks && <TopCard title="Top Bank" items={data.topBanks} />}
   {data.topLoanTypes && <TopCard title="Top Loan Type" items={data.topLoanTypes} />}
   {data.topBackOffice && <TopCard title="Top Back Office" items={data.topBackOffice} />}

   // Disbursement Table (Admin only)
   {data.disbursementTable && (
     <Table>
       <TableHeader>
         <TableRow>
           <TableHead>Name (Lead Owner)</TableHead>
           <TableHead>Total Disbursement Amount</TableHead>
         </TableRow>
       </TableHeader>
       <TableBody>
         {data.disbursementTable.map(row => (
           <TableRow key={row.leadOwnerId}>
             <TableCell>{row.leadOwnerName}</TableCell>
             <TableCell>₹{row.totalDisbursement.toLocaleString('en-IN')}</TableCell>
           </TableRow>
         ))}
       </TableBody>
     </Table>
   )}
   ```

4. **SubAdmin Dashboard Widgets:**
   - Top Connector
   - Top DSA
   - Top Bank
   - Top Loan Type

5. **BackOffice Dashboard Widgets:**
   - Top DSA
   - Top Bank
   - Top Loan Type
   - Top Lead Owner

6. **Connector Dashboard Widgets:**
   - Top Bank
   - Top Loan Type

### API Integration

```typescript
// src/lib/api.ts - Add to dashboardApi
getDashboardData: (month?: number, year?: number) =>
  apiRequest<{ success: boolean; data: any }>(
    `/dashboard?${month ? `month=${month}` : ''}${year ? `&year=${year}` : ''}`
  ),
```

## 🔷 PAYOUT SYSTEM UPDATES

### Backend Updates Needed

#### 1. Update Payout Service (backend/src/services/payouts.service.ts)

**Add Monthly Grouping Method:**
```typescript
async getMonthlyPayoutsByConnector(connectorId: string, userId?: string, userRole?: string) {
  // Authorization check
  const connector = await prisma.user.findFirst({
    where: { id: connectorId, role: 'connector' },
  });

  if (!connector) {
    throw new Error('Connector not found');
  }

  if (userRole === 'subadmin' && connector.createdBy !== userId) {
    throw new Error('Forbidden');
  } else if (userRole === 'connector' && connectorId !== userId) {
    throw new Error('Forbidden');
  }

  // Get all ledger entries grouped by month/year
  const entries = await prisma.payoutLedger.findMany({
    where: { connectorId },
    include: {
      creator: {
        select: { firstName: true, lastName: true },
      },
    },
    orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
  });

  // Group by month-year
  const groupedByMonth: Record<string, any[]> = {};
  entries.forEach((entry) => {
    const key = `${entry.year}-${String(entry.month).padStart(2, '0')}`;
    if (!groupedByMonth[key]) {
      groupedByMonth[key] = [];
    }
    groupedByMonth[key].push(entry);
  });

  // Calculate monthly balances with carry-forward
  const monthlyData: any[] = [];
  let runningBalance = 0;

  Object.keys(groupedByMonth)
    .sort()
    .reverse()
    .forEach((monthKey) => {
      const [year, month] = monthKey.split('-').map(Number);
      const monthEntries = groupedByMonth[monthKey];

      const earned = monthEntries
        .filter((e) => e.entryType === 'credit')
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const advance = monthEntries
        .filter((e) => e.entryType === 'debit')
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const netAmount = earned - advance;
      runningBalance += netAmount;

      monthlyData.push({
        month,
        year,
        monthKey,
        earned,
        advance,
        netAmount,
        balance: runningBalance,
        entries: monthEntries,
      });
    });

  return monthlyData;
}
```

**Add Auto-Generate Payout on Disbursement:**

Update `customers.service.ts` `updateCustomer` method:

```typescript
// After updating customer status to 'disbursed'
if (data.status === 'disbursed' && existingCustomer.status !== 'disbursed') {
  // Auto-generate payout entry
  await this.generatePayoutForDisbursed(customerId);
}

private async generatePayoutForDisbursed(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      connector: {
        include: {
          bankDetails: {
            include: { bank: true },
          },
        },
      },
      bank: true,
    },
  });

  if (!customer || !customer.connectorId) return;

  // Find matching payout ratio
  const bankDetail = customer.connector?.bankDetails?.find(
    (bd) => bd.bankId === customer.bankId && bd.loanType === customer.loanType
  );

  if (!bankDetail) return;

  // Calculate payout
  const payoutAmount = (Number(customer.loanAmount) * Number(bankDetail.payoutRatio)) / 100;

  const now = new Date();

  // Check if entry already exists
  const existing = await prisma.payoutLedger.findFirst({
    where: {
      connectorId: customer.connectorId,
      customerId: customer.id,
      entryType: 'credit',
    },
  });

  if (existing) return; // Already generated

  // Create credit entry
  await prisma.payoutLedger.create({
    data: {
      connectorId: customer.connectorId,
      customerId: customer.id,
      entryType: 'credit',
      amount: new Prisma.Decimal(payoutAmount),
      description: `Payout for ${customer.name} - ${customer.loanType} - ${customer.bank?.name || 'N/A'}`,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    },
  });
}
```

### Frontend Payout Page Updates (src/pages/Payouts.tsx)

**Replace Current Implementation with Monthly Accordion:**

```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Fetch monthly data
const [monthlyData, setMonthlyData] = useState([]);

useEffect(() => {
  async function fetchMonthlyData() {
    const res = await payoutsApi.getMonthlyPayoutsByConnector(connectorId);
    setMonthlyData(res.data);
  }
  fetchMonthlyData();
}, [connectorId]);

// Render accordion
<Accordion type="multiple">
  {monthlyData.map((month) => (
    <AccordionItem key={month.monthKey} value={month.monthKey}>
      <AccordionTrigger>
        <div className="flex justify-between w-full pr-4">
          <span>{getMonthName(month.month)}-{month.year}</span>
          <span className={month.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}>
            Amount: ₹{Math.abs(month.netAmount).toLocaleString('en-IN')}
            {month.netAmount < 0 && ' (Advance)'}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer Name</TableHead>
              <TableHead>Connector</TableHead>
              <TableHead>Payout</TableHead>
              <TableHead>Advance</TableHead>
              <TableHead>Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {month.entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{new Date(entry.createdAt).toLocaleDateString('en-IN')}</TableCell>
                <TableCell>{entry.customerId || '-'}</TableCell>
                <TableCell>{entry.connector?.firstName} {entry.connector?.lastName}</TableCell>
                <TableCell className="text-green-600">
                  {entry.entryType === 'credit' ? `₹${Number(entry.amount).toLocaleString('en-IN')}` : '-'}
                </TableCell>
                <TableCell className="text-red-600">
                  {entry.entryType === 'debit' ? `₹${Number(entry.amount).toLocaleString('en-IN')}` : '-'}
                </TableCell>
                <TableCell>{/* Running balance calculation */}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AccordionContent>
    </AccordionItem>
  ))}
</Accordion>
```

## 🔷 CUSTOMER FORM DATE CONTROL

### Update CustomerFormDialog.tsx

```tsx
// Add role check
const { role } = useAuth();
const canEditDate = role === 'admin' || role === 'subadmin' || role === 'backoffice';

// In the form
<FormField
  control={form.control}
  name="applicationDate"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Application Date</FormLabel>
      <FormControl>
        <Input
          type="date"
          {...field}
          disabled={!canEditDate}
          value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
        />
      </FormControl>
    </FormItem>
  )}
/>
```

## 🔧 TESTING CHECKLIST

### Backend Testing
- [ ] `GET /api/dashboard` returns current month/year by default
- [ ] `GET /api/dashboard?month=1&year=2024` returns January 2024 data
- [ ] Admin gets all 6 widgets + disbursement table
- [ ] SubAdmin gets 4 widgets (no BackOffice, no table)
- [ ] BackOffice gets 4 widgets including Lead Owners
- [ ] Connector gets 2 widgets (Bank, Loan Type)
- [ ] All disbursement amounts sorted descending
- [ ] Only disbursed customers counted
- [ ] Role filtering works correctly

### Frontend Testing
- [ ] Dashboard shows no customer table
- [ ] Month/Year filters visible at top
- [ ] No left-side filters
- [ ] Widgets display correctly based on role
- [ ] Disbursement table shows for Admin only
- [ ] Amounts formatted as Indian Rupees (₹)
- [ ] Sorting is descending by amount

### Payout Testing
- [ ] Monthly accordion displays correctly
- [ ] Negative amounts show in red
- [ ] Positive amounts show in green
- [ ] Auto-generate payout on disbursement works
- [ ] Carry-forward logic implemented
- [ ] Previous month negative balance carries to next month

### Customer Form Testing
- [ ] Admin can edit application date
- [ ] SubAdmin can edit application date
- [ ] BackOffice can edit application date
- [ ] Connector CANNOT edit application date

## 📝 API Endpoints Summary

| Endpoint | Method | Params | Returns |
|----------|--------|--------|---------|
| `/api/dashboard` | GET | `month`, `year` | Role-based dashboard data |
| `/api/payouts/monthly-by-connector/:id` | GET | - | Monthly payout accordion data |
| `/api/customers/:id` | PUT | `status: 'disbursed'` | Auto-generates payout entry |

## ✅ FINAL ACCEPTANCE CRITERIA

- [ ] Dashboard shows NO customer table
- [ ] Role-based visibility strictly enforced
- [ ] Month/year filter works correctly for all roles
- [ ] Only Admin can change month/year for others
- [ ] SubAdmin/BackOffice/Connector see only their filtered data
- [ ] Negative payout shows in red and carries forward
- [ ] Ledger history expandable month-wise
- [ ] LeadOwner mapped everywhere in disbursement calculations
- [ ] Auto-payout generation on disbursement status change
- [ ] Date control disabled for Connector role
- [ ] All calculations are runtime (no cached values)
