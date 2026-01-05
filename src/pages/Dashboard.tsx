import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import KPICard from '@/components/dashboard/KPICard';
import DateRangePicker from '@/components/dashboard/DateRangePicker';
import StatusPieChart from '@/components/dashboard/StatusPieChart';
import TrendChart from '@/components/dashboard/TrendChart';
import CustomerTable from '@/components/dashboard/CustomerTable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi, customersApi, usersApi } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { LoanType, LoanStatus } from '@/types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
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
  const { role, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(),
    to: new Date(),
  });
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    loanType: 'PL' as LoanType,
    loanAmount: '',
    connectorId: '',
    leadOwner: '',
    salesManager: '',
    status: 'login' as LoanStatus,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch KPI data from backend with date range
  const { data: kpiData, isLoading: isLoadingKPI } = useQuery({
    queryKey: ['dashboard-kpis', dateRange, user?.id],
    queryFn: async () => {
      const params: any = {};
      if (dateRange.from) params.startDate = dateRange.from.toISOString();
      if (dateRange.to) params.endDate = dateRange.to.toISOString();
      if (role === 'connector' && user?.id) params.connectorId = user.id;

      const response = await dashboardApi.getKPIs(params);
      return response.data;
    },
  });

  // Fetch trend data from backend with date range
  const { data: trendData, isLoading: isLoadingTrends } = useQuery({
    queryKey: ['dashboard-trends', dateRange, user?.id],
    queryFn: async () => {
      const params: any = {};
      if (dateRange.from) params.startDate = dateRange.from.toISOString();
      if (dateRange.to) params.endDate = dateRange.to.toISOString();
      if (role === 'connector' && user?.id) params.connectorId = user.id;

      const response = await dashboardApi.getTrends(params);
      return response.data;
    },
  });

  // Fetch recent customers from backend with role-based filtering
  const { data: recentCustomersData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['dashboard-recent-customers', dateRange, user?.id],
    queryFn: async () => {
      const params: any = { limit: 10 };
      if (dateRange.from) params.startDate = dateRange.from.toISOString();
      if (dateRange.to) params.endDate = dateRange.to.toISOString();
      if (role === 'connector' && user?.id) params.connectorId = user.id;

      const response = await dashboardApi.getRecentCustomers(params);
      return response.data;
    },
  });

  // Fetch connectors for dropdown
  const { data: connectorsData } = useQuery({
    queryKey: ['connectors'],
    queryFn: async () => {
      const response = await usersApi.getConnectors();
      return response.data;
    },
  });

  const connectors = connectorsData || [];

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await customersApi.updateCustomer(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-recent-customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });

      setIsEditDialogOpen(false);
      setSelectedCustomer(null);
      setFormData({
        name: '',
        mobile: '',
        email: '',
        loanType: 'PL',
        loanAmount: '',
        connectorId: '',
        leadOwner: '',
        salesManager: '',
        status: 'login',
      });
      setErrors({});

      toast({
        title: 'Customer Updated',
        description: 'Customer information has been successfully updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update customer',
        variant: 'destructive',
      });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Customer name is required';
    if (!formData.mobile.match(/^\d{10}$/)) newErrors.mobile = 'Valid 10-digit mobile required';
    if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      newErrors.email = 'Valid email required';
    if (!formData.loanAmount || Number(formData.loanAmount) <= 0)
      newErrors.loanAmount = 'Valid loan amount required';
    if (!formData.connectorId) newErrors.connectorId = 'Connector is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleView = (customer: any) => {
    setSelectedCustomer(customer);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (customer: any) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email || '',
      loanType: customer.loanType,
      loanAmount: customer.loanAmount.toString(),
      connectorId: customer.connectorId,
      leadOwner: customer.leadOwner || '',
      salesManager: customer.salesManager || '',
      status: customer.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !selectedCustomer) return;

    const customerData = {
      name: formData.name,
      mobile: formData.mobile,
      email: formData.email || undefined,
      loanType: formData.loanType,
      loanAmount: Number(formData.loanAmount),
      connectorId: formData.connectorId,
      leadOwner: formData.leadOwner || undefined,
      salesManager: formData.salesManager || undefined,
      status: formData.status,
    };

    updateCustomerMutation.mutate({ id: selectedCustomer.id, data: customerData });
  };

  const kpiCards = [
    { title: 'Login', value: kpiData?.login || 0, icon: LogIn, variant: 'primary' as const },
    { title: 'Rejected', value: kpiData?.rejected || 0, icon: XCircle, variant: 'destructive' as const },
    { title: 'Approved', value: kpiData?.approved || 0, icon: CheckCircle, variant: 'success' as const },
    { title: 'Disbursed', value: kpiData?.disbursed || 0, icon: Wallet, variant: 'accent' as const },
    { title: 'Hold', value: kpiData?.hold || 0, icon: Pause, variant: 'warning' as const },
    { title: 'Relook', value: kpiData?.relook || 0, icon: RefreshCw, variant: 'info' as const },
    { title: 'Drop', value: kpiData?.drop || 0, icon: TrendingDown, variant: 'primary' as const },
  ];

  const isLoading = isLoadingKPI || isLoadingTrends || isLoadingCustomers;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

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
        <StatusPieChart data={kpiData || {}} />
        <TrendChart data={trendData || []} />
      </div>

      {/* Customer Table */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Customer Management</h3>
        <CustomerTable
          customers={recentCustomersData || []}
          onView={handleView}
          onEdit={handleEdit}
        />
      </div>

      {/* View Customer Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Application Date</Label>
                  <p className="text-foreground font-medium">
                    {format(new Date(selectedCustomer.applicationDate || selectedCustomer.date || selectedCustomer.createdAt), 'PPP')}
                  </p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-muted-foreground">Customer Name</Label>
                  <p className="text-foreground font-medium">{selectedCustomer.name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Mobile Number</Label>
                  <p className="text-foreground font-medium">{selectedCustomer.mobile}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email Address</Label>
                  <p className="text-foreground font-medium">{selectedCustomer.email || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Loan Type</Label>
                  <p className="text-foreground font-medium">
                    {selectedCustomer.loanType === 'PL' && 'Personal Loan (PL)'}
                    {selectedCustomer.loanType === 'HL' && 'Home Loan (HL)'}
                    {selectedCustomer.loanType === 'BL' && 'Business Loan (BL)'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Loan Amount</Label>
                  <p className="text-foreground font-medium">₹{selectedCustomer.loanAmount.toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Connector</Label>
                  <p className="text-foreground font-medium">
                    {selectedCustomer.connectorName ||
                     (selectedCustomer.connector ? `${selectedCustomer.connector.firstName} ${selectedCustomer.connector.lastName}` : 'N/A')}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Lead Owner</Label>
                  <p className="text-foreground font-medium">{selectedCustomer.leadOwner || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Sales Manager</Label>
                  <p className="text-foreground font-medium">{selectedCustomer.salesManager || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Status</Label>
                  <p className="text-foreground font-medium capitalize">{selectedCustomer.status}</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
                <Button onClick={() => {
                  setIsViewDialogOpen(false);
                  handleEdit(selectedCustomer);
                }}>
                  Edit Customer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setSelectedCustomer(null);
          setFormData({
            name: '',
            mobile: '',
            email: '',
            loanType: 'PL',
            loanAmount: '',
            connectorId: '',
            leadOwner: '',
            salesManager: '',
            status: 'login',
          });
          setErrors({});
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  value={selectedCustomer ? format(new Date(selectedCustomer.applicationDate || selectedCustomer.date || selectedCustomer.createdAt), 'PPP') : ''}
                  disabled
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-name">Customer Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-mobile">Mobile Number *</Label>
                <Input
                  id="edit-mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="10 digit mobile"
                  className={errors.mobile ? 'border-destructive' : ''}
                />
                {errors.mobile && <p className="text-sm text-destructive">{errors.mobile}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Loan Type *</Label>
                <RadioGroup
                  value={formData.loanType}
                  onValueChange={(value) => setFormData({ ...formData, loanType: value as LoanType })}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PL" id="edit-pl" />
                    <Label htmlFor="edit-pl" className="cursor-pointer">Personal Loan (PL)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="HL" id="edit-hl" />
                    <Label htmlFor="edit-hl" className="cursor-pointer">Home Loan (HL)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="BL" id="edit-bl" />
                    <Label htmlFor="edit-bl" className="cursor-pointer">Business Loan (BL)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-loanAmount">Loan Amount (₹) *</Label>
                <Input
                  id="edit-loanAmount"
                  type="number"
                  value={formData.loanAmount}
                  onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                  className={errors.loanAmount ? 'border-destructive' : ''}
                />
                {errors.loanAmount && <p className="text-sm text-destructive">{errors.loanAmount}</p>}
              </div>

              <div className="space-y-2">
                <Label>Connector *</Label>
                <Select
                  value={formData.connectorId}
                  onValueChange={(value) => setFormData({ ...formData, connectorId: value })}
                >
                  <SelectTrigger className={errors.connectorId ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select connector" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border">
                    {connectors.map((connector: any) => (
                      <SelectItem key={connector.id} value={connector.id}>
                        {connector.firstName} {connector.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.connectorId && <p className="text-sm text-destructive">{errors.connectorId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-leadOwner">Lead Owner</Label>
                <Input
                  id="edit-leadOwner"
                  value={formData.leadOwner}
                  onChange={(e) => setFormData({ ...formData, leadOwner: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-salesManager">Sales Manager</Label>
                <Input
                  id="edit-salesManager"
                  value={formData.salesManager}
                  onChange={(e) => setFormData({ ...formData, salesManager: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as LoanStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border">
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="disbursed">Disbursed</SelectItem>
                    <SelectItem value="hold">Hold</SelectItem>
                    <SelectItem value="relook">Relook</SelectItem>
                    <SelectItem value="drop">Drop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedCustomer(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateCustomerMutation.isPending}>
                {updateCustomerMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Customer'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
