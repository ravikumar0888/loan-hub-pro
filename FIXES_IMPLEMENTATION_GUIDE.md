# Implementation Guide for Requested Fixes

## Summary
This document outlines all the changes needed to fix the issues identified in the LoanMS application.

## Changes Completed
1. ✅ Updated Dashboard to support date range filtering with role-based data access
2. ✅ Updated API methods to accept parameters for filtering
3. ✅ Updated Customer type to include applicationId and optional fields
4. ✅ Fixed CustomerTable to display connector names from database

## Changes Remaining

### 1. Dashboard - View/Edit Customer Dialog

**File:** `src/pages/Dashboard.tsx`

Add state management and dialog components for viewing and editing customers:

```typescript
const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

const handleView = (customer: Customer) => {
  setSelectedCustomer(customer);
  setIsViewDialogOpen(true);
};

const handleEdit = (customer: Customer) => {
  setSelectedCustomer(customer);
  setIsEditDialogOpen(true);
};
```

Update CustomerTable call:
```typescript
<CustomerTable
  customers={recentCustomersData || []}
  onView={handleView}
  onEdit={handleEdit}
/>
```

Add View Dialog component (read-only display):
- Show all customer fields in a read-only dialog
- Display connector name from DB
- Display bank name if available
- Show application ID
- Display formatted dates

Add Edit Dialog component:
- Similar to Add Customer form
- Pre-populate with existing customer data
- Allow editing all fields
- Save changes using `customersApi.updateCustomer(id, data)`

### 2. Customer Management Page

**File:** `src/pages/Customers.tsx`

#### A. Add Application ID field

In the form section, add before the customer name field:

```typescript
<div className="space-y-2">
  <Label htmlFor="applicationId">Application ID</Label>
  <Input
    id="applicationId"
    value={formData.applicationId}
    onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
    placeholder="Auto-generated if left blank"
  />
</div>
```

Update formData state:
```typescript
const [formData, setFormData] = useState({
  applicationId: '',
  name: '',
  // ... rest of fields
});
```

#### B. Fix Form Reset on Dialog Open

Update dialog trigger to reset form:

```typescript
<DialogTrigger asChild>
  <Button onClick={() => {
    setFormData({
      applicationId: '',
      name: '',
      mobile: '',
      email: '',
      loanType: 'PL',
      loanAmount: '',
      connectorId: '',
      leadOwner: '',
      salesManager: '',
      status: 'login',
      remarks: '',
    });
    setErrors({});
  }}>
    <Plus className="w-4 h-4 mr-2" />
    Add Customer
  </Button>
</DialogTrigger>
```

#### C. Add View/Edit Functionality

Same as Dashboard - add view and edit dialogs with state management.

#### D. Add Bank Name Selection

Add bank dropdown field in the form:

```typescript
<div className="space-y-2">
  <Label>Bank/NBFC</Label>
  <Select
    value={formData.bankId}
    onValueChange={(value) => setFormData({ ...formData, bankId: value })}
  >
    <SelectTrigger>
      <SelectValue placeholder="Select bank" />
    </SelectTrigger>
    <SelectContent className="bg-popover border border-border">
      {banks.map((bank: any) => (
        <SelectItem key={bank.id} value={bank.id}>
          {bank.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

Fetch banks:
```typescript
const { data: banksData } = useQuery({
  queryKey: ['banks'],
  queryFn: async () => {
    const response = await banksApi.getAllBanks();
    return response.data;
  },
});

const banks = banksData || [];
```

### 3. Banks & NBFC Management

**File:** `src/pages/Banks.tsx`

#### A. Add Edit Functionality

Add state for editing:
```typescript
const [editingBank, setEditingBank] = useState<Bank | null>(null);
const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
```

Add edit button in table:
```typescript
<Button
  variant="ghost"
  size="icon"
  onClick={() => {
    setEditingBank(bank);
    setBankName(bank.name);
    setIsEditDialogOpen(true);
  }}
>
  <Edit className="w-4 h-4" />
</Button>
```

Add update mutation:
```typescript
const updateBankMutation = useMutation({
  mutationFn: async ({ id, name }: { id: string; name: string }) => {
    return await banksApi.updateBank(id, { name });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['banks'] });
    setIsEditDialogOpen(false);
    setEditingBank(null);
    toast({
      title: 'Bank Updated',
      description: 'Bank has been successfully updated.',
    });
  },
});
```

Modify handleSubmit to check if editing:
```typescript
if (editingBank) {
  updateBankMutation.mutate({ id: editingBank.id, name: bankName.trim() });
} else {
  createBankMutation.mutate(bankName.trim());
}
```

Delete functionality is already implemented.

### 4. Corporate DSA Management

**File:** `src/pages/DSA.tsx`

#### A. Add View/Edit Functionality

Add states:
```typescript
const [selectedDSA, setSelectedDSA] = useState<DSA | null>(null);
const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
const [editingDSA, setEditingDSA] = useState<DSA | null>(null);
```

Update Edit button in accordion:
```typescript
<Button
  variant="ghost"
  size="icon"
  onClick={(e) => {
    e.stopPropagation();
    setEditingDSA(dsa);
    setDsaName(dsa.name);
    setBankDetails(dsa.bankDetails || []);
    setIsDialogOpen(true);
  }}
>
  <Edit className="w-4 h-4" />
</Button>
```

Add View button:
```typescript
<Button
  variant="ghost"
  size="icon"
  onClick={(e) => {
    e.stopPropagation();
    setSelectedDSA(dsa);
    setIsViewDialogOpen(true);
  }}
>
  <Eye className="w-4 h-4" />
</Button>
```

Add update mutation and modify handleSubmit similar to Banks.

Create View Dialog to show DSA details in read-only format.

### 5. Reports Page

**File:** `src/pages/Reports.tsx`

The Reports page already has:
- ✅ DSA details display in datatable
- ✅ Filter functionality

Verify that the DSA column is showing properly with the fix:
```typescript
<TableCell>
  {customer.dsaName || (customer.dsa ? customer.dsa.name : '-')}
</TableCell>
```

### 6. Role-Based Dashboard Filtering

**Already Implemented** in Dashboard.tsx:
- Connector users see only their data
- Admin/BackOffice see all data
- Filtering applied to KPIs, trends, and recent customers

### 7. Mobile Responsive Improvements

**Files to Update:** All pages

Add/verify responsive classes:

#### Table containers:
```typescript
<div className="overflow-x-auto -mx-4 sm:mx-0">
  <div className="inline-block min-w-full align-middle">
    <Table>
      {/* ... */}
    </Table>
  </div>
</div>
```

#### Form grids:
```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
```

#### Dialogs:
```typescript
<DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
```

#### Buttons:
```typescript
<Button className="w-full sm:w-auto">
```

## Backend Changes Required

The backend APIs need to be updated to support these features. The following endpoints should accept and handle these parameters:

### 1. Dashboard API Updates

**File:** `backend/src/controllers/dashboard.controller.ts`

```typescript
// GET /api/dashboard/kpis?startDate=...&endDate=...&connectorId=...
// GET /api/dashboard/trends?startDate=...&endDate=...&connectorId=...
// GET /api/dashboard/recent-customers?limit=10&startDate=...&endDate=...&connectorId=...
```

Add filtering logic based on query parameters:
- Filter by date range (applicationDate between startDate and endDate)
- Filter by connectorId if provided
- Return aggregated KPIs based on filtered data

### 2. Customers API Updates

Add applicationId field to schema:

**File:** `backend/prisma/schema.prisma`

```prisma
model Customer {
  id              String     @id @default(uuid())
  applicationId   String?    @unique @map("application_id") @db.VarChar(50)
  // ... rest of fields
}
```

Run migration:
```bash
cd backend
npx prisma migrate dev --name add_application_id
```

Update create customer endpoint to:
- Auto-generate applicationId if not provided (e.g., "APP" + timestamp + random)
- Store applicationId in database

### 3. Include Relations in Responses

Update all customer queries to include:
```typescript
include: {
  connector: {
    select: {
      firstName: true,
      lastName: true,
    },
  },
  bank: {
    select: {
      name: true,
    },
  },
}
```

## Testing Checklist

After implementing all changes:

- [ ] Dashboard displays current date data by default
- [ ] Date range filter updates KPIs and table data
- [ ] View button shows read-only customer details
- [ ] Edit button allows editing and saving customer
- [ ] Connector names display from database
- [ ] Bank names display from database
- [ ] Customer form resets when opening Add dialog
- [ ] Application ID field works (auto-generate or manual)
- [ ] Banks can be edited and deleted
- [ ] DSAs can be viewed and edited
- [ ] Reports show DSA details
- [ ] Report filters work correctly
- [ ] Connector users see only their data
- [ ] All pages are mobile responsive

## Priority Order

1. **High Priority:**
   - Application ID field in customers
   - Form reset on dialog open
   - View/Edit dialogs for customers
   - Role-based filtering

2. **Medium Priority:**
   - Bank edit functionality
   - DSA view/edit functionality
   - Mobile responsiveness

3. **Low Priority:**
   - UI polish and refinements

## Next Steps

1. Implement backend changes first (API updates, database migrations)
2. Test backend endpoints with Postman/Thunder Client
3. Implement frontend changes page by page
4. Test each page thoroughly
5. Perform end-to-end testing
6. Fix any bugs discovered during testing
