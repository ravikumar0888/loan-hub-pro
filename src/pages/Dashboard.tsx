import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import KPICard from '@/components/dashboard/KPICard';
import DateRangePicker from '@/components/dashboard/DateRangePicker';
import TopPerformersSection from '@/components/dashboard/TopPerformersSection';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import {
  LogIn,
  XCircle,
  CheckCircle,
  Wallet,
  Pause,
  RefreshCw,
  TrendingDown,
} from 'lucide-react';

// Helper to get start of current month
const getStartOfMonth = () => {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
};

// Helper to get end of today
const getEndOfToday = () => {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
};

export default function Dashboard() {
  const { role, user } = useAuth();
  // Default to current month (start of month to end of today)
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: getStartOfMonth(),
    to: getEndOfToday(),
  });

  // Get current month and year for top performers
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const currentYear = new Date().getFullYear();

  // Create stable string-based query key for reliable cache invalidation
  const dateRangeKey = useMemo(() => {
    const fromStr = dateRange.from ? dateRange.from.toISOString().split('T')[0] : 'none';
    const toStr = dateRange.to ? dateRange.to.toISOString().split('T')[0] : 'none';
    return `${fromStr}_${toStr}`;
  }, [dateRange.from, dateRange.to]);

  // Fetch KPI data from backend with date range
  // Backend automatically filters by role using authentication middleware
  const { data: kpiData, isLoading: isLoadingKPI } = useQuery({
    queryKey: ['dashboard-kpis', dateRangeKey, role],
    queryFn: async () => {
      const params: any = {};
      if (dateRange.from) params.startDate = dateRange.from.toISOString();
      if (dateRange.to) params.endDate = dateRange.to.toISOString();

      const response = await dashboardApi.getKPIs(params);
      return response.data;
    },
  });

  // Fetch top performers data for current month
  const { data: topPerformersData, isLoading: isLoadingTopPerformers } = useQuery({
    queryKey: ['dashboard-top-performers', currentMonth, currentYear],
    queryFn: async () => {
      const params = {
        month: currentMonth.toString(),
        year: currentYear.toString(),
      };

      const response = await dashboardApi.getTopPerformers(params);
      return response.data;
    },
  });

  // KPI Icons and variants mapping
  const kpiIcons = {
    login: LogIn,
    rejected: XCircle,
    approved: CheckCircle,
    disbursed: Wallet,
    hold: Pause,
    relook: RefreshCw,
    drop: TrendingDown,
  };

  const kpiVariants: Record<string, 'primary' | 'success' | 'warning' | 'destructive' | 'info' | 'accent'> = {
    login: 'primary',
    rejected: 'destructive',
    approved: 'success',
    disbursed: 'accent',
    hold: 'warning',
    relook: 'info',
    drop: 'destructive',
  };

  if (isLoadingKPI) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">
            {role === 'connector'
              ? 'View your performance metrics'
              : 'Overview of loan applications and performance'}
          </p>
        </div>
        <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {kpiData &&
          Object.entries(kpiData)
            .filter(([key]) => key !== 'total' && key !== 'totalDisbursed')
            .map(([key, value]) => {
              const Icon = kpiIcons[key as keyof typeof kpiIcons];
              const variant = kpiVariants[key as keyof typeof kpiVariants];
              return (
                <KPICard
                  key={key}
                  title={key.charAt(0).toUpperCase() + key.slice(1)}
                  value={value as number}
                  icon={Icon}
                  variant={variant}
                />
              );
            })}
      </div>

      {/* Top Performers Section */}
      {!isLoadingTopPerformers && topPerformersData && (
        <TopPerformersSection
          data={topPerformersData}
          currentMonth={currentMonth}
          currentYear={currentYear}
          userRole={role}
        />
      )}

      {isLoadingTopPerformers && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
