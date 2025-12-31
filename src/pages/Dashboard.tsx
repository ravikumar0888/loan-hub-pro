import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import KPICard from '@/components/dashboard/KPICard';
import DateRangePicker from '@/components/dashboard/DateRangePicker';
import StatusPieChart from '@/components/dashboard/StatusPieChart';
import TrendChart from '@/components/dashboard/TrendChart';
import CustomerTable from '@/components/dashboard/CustomerTable';
import CustomerFormDialog from '@/components/customers/CustomerFormDialog';
import { mockKPIData, mockTrendData, mockCustomers } from '@/data/mockData';
import { Customer } from '@/types';
import {
  LogIn,
  XCircle,
  CheckCircle,
  Wallet,
  Pause,
  RefreshCw,
  TrendingDown,
} from 'lucide-react';

export default function Dashboard() {
  const { role } = useAuth();
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(),
    to: new Date(),
  });
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('view');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const canEdit = role === 'admin' || role === 'backoffice';

  const handleView = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDialogMode('view');
    setIsDialogOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    if (!canEdit) return;
    setSelectedCustomer(customer);
    setDialogMode('edit');
    setIsDialogOpen(true);
  };

  const handleSave = (customer: Customer) => {
    setCustomers(customers.map(c => c.id === customer.id ? customer : c));
  };

  const kpiCards = [
    { title: 'Login', value: mockKPIData.login, icon: LogIn, variant: 'primary' as const },
    { title: 'Rejected', value: mockKPIData.rejected, icon: XCircle, variant: 'destructive' as const },
    { title: 'Approved', value: mockKPIData.approved, icon: CheckCircle, variant: 'success' as const },
    { title: 'Disbursed', value: mockKPIData.disbursed, icon: Wallet, variant: 'accent' as const },
    { title: 'Hold', value: mockKPIData.hold, icon: Pause, variant: 'warning' as const },
    { title: 'Relook', value: mockKPIData.relook, icon: RefreshCw, variant: 'info' as const },
    { title: 'Drop', value: mockKPIData.drop, icon: TrendingDown, variant: 'primary' as const },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
          <p className="text-muted-foreground">
            Track your loan management metrics and performance
          </p>
        </div>
        <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {kpiCards.map((card) => (
          <KPICard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            variant={card.variant}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusPieChart data={mockKPIData} />
        <TrendChart data={mockTrendData} />
      </div>

      {/* Customer Table */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Customer Management</h3>
        <CustomerTable
          customers={customers}
          onView={handleView}
          onEdit={canEdit ? handleEdit : undefined}
          showEditButton={canEdit}
        />
      </div>

      <CustomerFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        customer={selectedCustomer}
        mode={dialogMode}
        onSave={handleSave}
      />
    </div>
  );
}
