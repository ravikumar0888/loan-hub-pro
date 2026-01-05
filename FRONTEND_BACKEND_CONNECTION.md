# Frontend-Backend Connection Guide

## ✅ What Has Been Connected

Your LoanMS frontend is now connected to the backend API!

### Changes Made:

1. **AuthContext Updated** (`src/contexts/AuthContext.tsx`)
   - Replaced mock authentication with real API calls
   - Uses `authApi` from `src/lib/api.ts`
   - Stores JWT token in localStorage
   - Auto-checks authentication on page load

2. **Backend CORS Updated** (`backend/.env`)
   - Changed `CORS_ORIGIN` from `http://localhost:5173` to `http://localhost:8080`
   - Changed `APP_URL` to match frontend port

---

## 🚀 How to Run

### Start Both Servers:

**Terminal 1 - Backend:**
```bash
cd f:\Rudvir\loan-hub-pro\backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd f:\Rudvir\loan-hub-pro
npm run dev
```

---

## 🔑 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@loanms.com | password123 |
| BackOffice | backoffice@loanms.com | password123 |
| Connector | connector@loanms.com | password123 |

---

## ✨ What Works Now

### Authentication (CONNECTED ✅)
- ✅ Login with real API
- ✅ JWT token storage
- ✅ Auto-login on page refresh
- ✅ Logout functionality
- ✅ Forgot password API call
- ✅ Reset password API call

### Ready to Connect (Use API Helper)

The frontend has a complete API client in `src/lib/api.ts`. To connect other pages:

**Example - Dashboard Page:**

```typescript
import { dashboardApi } from '@/lib/api';

// Instead of using mockKPIData:
const { data } = await dashboardApi.getKPIs();
const { data: trends } = await dashboardApi.getTrends();
const { data: customers } = await dashboardApi.getRecentCustomers(10);
```

**Example - Customers Page:**

```typescript
import { customersApi } from '@/lib/api';

// Get customers
const { data, pagination } = await customersApi.getCustomers({ page: 1, limit: 10 });

// Create customer
await customersApi.createCustomer(formData);

// Update customer
await customersApi.updateCustomer(id, updatedData);
```

---

## 🔍 Testing the Connection

### 1. Test Backend API Directly

Open browser and go to:
- **Health Check:** http://localhost:5000/health
- Should return: `{"success":true,"message":"LoanMS API is running"}`

### 2. Test Login

1. Open http://localhost:8080
2. Enter: admin@loanms.com / password123
3. Open browser DevTools (F12) → Network tab
4. You should see API calls to `http://localhost:5000/api/auth/login`
5. Check Application tab → Local Storage → You should see `auth_token`

### 3. Check Authentication Persistence

1. Login successfully
2. Refresh the page (F5)
3. You should stay logged in (not redirected to login page)
4. This proves the `useEffect` auth check is working

---

## 🐛 Troubleshooting

### CORS Errors

If you see errors like "CORS policy blocked":
1. Make sure backend `.env` has: `CORS_ORIGIN=http://localhost:8080`
2. Restart backend server after changing `.env`

### API Connection Refused

If you see "Connection refused":
1. Make sure backend is running on port 5000
2. Check backend terminal for errors
3. Verify `VITE_API_URL=http://localhost:5000/api` in root `.env`

### Authentication Not Working

If login fails:
1. Open browser DevTools → Console
2. Check for error messages
3. Verify backend database has seeded users
4. Try login with correct credentials

### Token Expired

JWT tokens expire after 24 hours. If you get "Invalid token":
1. Clear localStorage in browser DevTools
2. Login again

---

## 📝 Next Steps - Connect Remaining Pages

Currently only **Authentication** is connected. To connect other pages:

### Dashboard (`src/pages/Dashboard.tsx`)

Replace:
```typescript
import { mockKPIData, mockTrendData, mockCustomers } from '@/data/mockData';
```

With:
```typescript
import { dashboardApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

const { data: kpis } = useQuery({
  queryKey: ['dashboard-kpis'],
  queryFn: () => dashboardApi.getKPIs()
});
```

### Customers (`src/pages/Customers.tsx`)

Replace:
```typescript
const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
```

With:
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['customers'],
  queryFn: () => customersApi.getCustomers()
});
```

### Banks, Users, DSA, Reports

Similar pattern - replace mock data imports with API calls using React Query.

---

## 🎯 Current Status

✅ **Backend**: Running on http://localhost:5000
✅ **Frontend**: Running on http://localhost:8080
✅ **Database**: PostgreSQL with 50+ sample records
✅ **Authentication**: Fully connected with JWT
⏳ **Other Pages**: Still using mock data (need to update)

---

## 💡 Tips

1. **React Query**: Already installed - use it for data fetching
2. **API Helper**: All endpoints pre-built in `src/lib/api.ts`
3. **Error Handling**: Check browser console for API errors
4. **Token**: Stored in localStorage as `auth_token`
5. **Logout**: Clears token and redirects to login

---

**You're now ready to use the fully connected authentication! 🎉**

The login system is working with the real backend API and PostgreSQL database!
