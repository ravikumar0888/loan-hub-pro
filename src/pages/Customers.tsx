import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CustomerTable from '@/components/dashboard/CustomerTable';
import CustomerRemarks from '@/components/customer/CustomerRemarks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoanType, LoanStatus } from '@/types';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi, usersApi } from '@/lib/api';

export default function Customers() {
  const { role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const [formData, setFormData] = useState({
    applicationId: '',
    name: '',
    mobile: '',
    email: '',
    motherName: '',
    spouseName: '',
    personalEmail: '',
    officialEmail: '',
    totalWorkExperience: '',
    currentCompanyExp: '',
    currentAddress: '',
    postalAddress: '',
    homeType: 'Own house',
    reference1Name: '',
    reference1Mobile: '',
    reference1Address: '',
    reference2Name: '',
    reference2Mobile: '',
    reference2Address: '',
    loanType: 'PL' as LoanType,
    loanAmount: '',
    connectorId: '',
    leadOwner: '',
    salesManager: '',
    status: 'login' as LoanStatus,
    remarks: '',
  });

  // Reset form function
  const resetForm = () => {
    setFormData({
      applicationId: '',
      name: '',
      mobile: '',
      email: '',
      motherName: '',
      spouseName: '',
      personalEmail: '',
      officialEmail: '',
      totalWorkExperience: '',
      currentCompanyExp: '',
      currentAddress: '',
      postalAddress: '',
      homeType: 'Own house',
      reference1Name: '',
      reference1Mobile: '',
      reference1Address: '',
      reference2Name: '',
      reference2Mobile: '',
      reference2Address: '',
      loanType: 'PL',
      loanAmount: '',
      connectorId: '',
      leadOwner: '',
      salesManager: '',
      status: 'login',
      remarks: '',
    });
    setErrors({});
  };

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch customers from backend
  const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await customersApi.getCustomers();
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
  const customers = customersData || [];

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      return await customersApi.createCustomer(data);
    },
    onSuccess: () => {
      // Invalidate and refetch customers
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-recent-customers'] });

      setIsDialogOpen(false);
      resetForm();

      toast({
        title: 'Customer Added',
        description: 'New customer has been successfully added to the database.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create customer',
        variant: 'destructive',
      });
    },
  });

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await customersApi.updateCustomer(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-recent-customers'] });

      setIsEditDialogOpen(false);
      setSelectedCustomer(null);
      resetForm();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const customerData = {
      applicationId: formData.applicationId || undefined,
      name: formData.name,
      mobile: formData.mobile,
      email: formData.email || undefined,
      motherName: formData.motherName || undefined,
      spouseName: formData.spouseName || undefined,
      personalEmail: formData.personalEmail || undefined,
      officialEmail: formData.officialEmail || undefined,
      totalWorkExperience: formData.totalWorkExperience || undefined,
      currentCompanyExp: formData.currentCompanyExp || undefined,
      currentAddress: formData.currentAddress || undefined,
      postalAddress: formData.postalAddress || undefined,
      homeType: formData.homeType || undefined,
      reference1Name: formData.reference1Name || undefined,
      reference1Mobile: formData.reference1Mobile || undefined,
      reference1Address: formData.reference1Address || undefined,
      reference2Name: formData.reference2Name || undefined,
      reference2Mobile: formData.reference2Mobile || undefined,
      reference2Address: formData.reference2Address || undefined,
      loanType: formData.loanType,
      loanAmount: Number(formData.loanAmount),
      connectorId: formData.connectorId,
      leadOwner: formData.leadOwner || undefined,
      salesManager: formData.salesManager || undefined,
      status: formData.status,
      remarks: formData.remarks || undefined,
    };

    createCustomerMutation.mutate(customerData);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !selectedCustomer) return;

    const customerData = {
      applicationId: formData.applicationId || undefined,
      name: formData.name,
      mobile: formData.mobile,
      email: formData.email || undefined,
      motherName: formData.motherName || undefined,
      spouseName: formData.spouseName || undefined,
      personalEmail: formData.personalEmail || undefined,
      officialEmail: formData.officialEmail || undefined,
      totalWorkExperience: formData.totalWorkExperience || undefined,
      currentCompanyExp: formData.currentCompanyExp || undefined,
      currentAddress: formData.currentAddress || undefined,
      postalAddress: formData.postalAddress || undefined,
      homeType: formData.homeType || undefined,
      reference1Name: formData.reference1Name || undefined,
      reference1Mobile: formData.reference1Mobile || undefined,
      reference1Address: formData.reference1Address || undefined,
      reference2Name: formData.reference2Name || undefined,
      reference2Mobile: formData.reference2Mobile || undefined,
      reference2Address: formData.reference2Address || undefined,
      loanType: formData.loanType,
      loanAmount: Number(formData.loanAmount),
      connectorId: formData.connectorId,
      leadOwner: formData.leadOwner || undefined,
      salesManager: formData.salesManager || undefined,
      status: formData.status,
    };

    updateCustomerMutation.mutate({ id: selectedCustomer.id, data: customerData });
  };

  const handleView = (customer: any) => {
    setSelectedCustomer(customer);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (customer: any) => {
    setSelectedCustomer(customer);
    setFormData({
      applicationId: customer.applicationId || '',
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email || '',
      motherName: customer.motherName || '',
      spouseName: customer.spouseName || '',
      personalEmail: customer.personalEmail || '',
      officialEmail: customer.officialEmail || '',
      totalWorkExperience: customer.totalWorkExperience || '',
      currentCompanyExp: customer.currentCompanyExp || '',
      currentAddress: customer.currentAddress || '',
      postalAddress: customer.postalAddress || '',
      homeType: customer.homeType || 'Own house',
      reference1Name: customer.reference1Name || '',
      reference1Mobile: customer.reference1Mobile || '',
      reference1Address: customer.reference1Address || '',
      reference2Name: customer.reference2Name || '',
      reference2Mobile: customer.reference2Mobile || '',
      reference2Address: customer.reference2Address || '',
      loanType: customer.loanType,
      loanAmount: customer.loanAmount.toString(),
      connectorId: customer.connectorId,
      leadOwner: customer.leadOwner || '',
      salesManager: customer.salesManager || '',
      status: customer.status,
      remarks: Array.isArray(customer.remarks) ? customer.remarks[0] || '' : customer.remarks || '',
    });
    setIsEditDialogOpen(true);
  };

  const canAddCustomer = role === 'admin' || role === 'backoffice';

  if (isLoadingCustomers) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Customer Management</h2>
          <p className="text-muted-foreground">Manage and track all customer applications</p>
        </div>
        {canAddCustomer && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add New Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card">
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input value={format(new Date(), 'PPP')} disabled />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="applicationId">Application ID</Label>
                    <Input
                      id="applicationId"
                      value={formData.applicationId}
                      onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
                      placeholder="Auto-generated if left blank"
                    />
                    <p className="text-xs text-muted-foreground">Leave blank for auto-generation</p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="name">Customer Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={errors.name ? 'border-destructive' : ''}
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <Input
                      id="mobile"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="10 digit mobile"
                      className={errors.mobile ? 'border-destructive' : ''}
                    />
                    {errors.mobile && <p className="text-sm text-destructive">{errors.mobile}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motherName">Mother Name</Label>
                    <Input
                      id="motherName"
                      value={formData.motherName}
                      onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="spouseName">Spouse Name</Label>
                    <Input
                      id="spouseName"
                      value={formData.spouseName}
                      onChange={(e) => setFormData({ ...formData, spouseName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="personalEmail">Personal Email ID</Label>
                    <Input
                      id="personalEmail"
                      type="email"
                      value={formData.personalEmail}
                      onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="officialEmail">Official Email ID</Label>
                    <Input
                      id="officialEmail"
                      type="email"
                      value={formData.officialEmail}
                      onChange={(e) => setFormData({ ...formData, officialEmail: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totalWorkExperience">Total Work Experience</Label>
                    <Input
                      id="totalWorkExperience"
                      value={formData.totalWorkExperience}
                      onChange={(e) => setFormData({ ...formData, totalWorkExperience: e.target.value })}
                      placeholder="e.g., 5 years"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentCompanyExp">Current Company Experience</Label>
                    <Input
                      id="currentCompanyExp"
                      value={formData.currentCompanyExp}
                      onChange={(e) => setFormData({ ...formData, currentCompanyExp: e.target.value })}
                      placeholder="e.g., 2 years"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="currentAddress">Current Address</Label>
                    <Textarea
                      id="currentAddress"
                      value={formData.currentAddress}
                      onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="postalAddress">Postal Address</Label>
                    <Textarea
                      id="postalAddress"
                      value={formData.postalAddress}
                      onChange={(e) => setFormData({ ...formData, postalAddress: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Home Type</Label>
                    <RadioGroup
                      value={formData.homeType}
                      onValueChange={(value) => setFormData({ ...formData, homeType: value })}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Own house" id="own-house" />
                        <Label htmlFor="own-house" className="cursor-pointer">Own House</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Rental" id="rental" />
                        <Label htmlFor="rental" className="cursor-pointer">Rental</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Self-occupied" id="self-occupied" />
                        <Label htmlFor="self-occupied" className="cursor-pointer">Self-Occupied</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Reference 1 */}
                  <div className="space-y-2 md:col-span-2 pt-4 border-t border-border">
                    <Label className="text-base font-medium">Reference 1</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reference1Name">Name</Label>
                    <Input
                      id="reference1Name"
                      value={formData.reference1Name}
                      onChange={(e) => setFormData({ ...formData, reference1Name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reference1Mobile">Mobile Number</Label>
                    <Input
                      id="reference1Mobile"
                      value={formData.reference1Mobile}
                      onChange={(e) => setFormData({ ...formData, reference1Mobile: e.target.value })}
                      placeholder="10 digit mobile"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="reference1Address">Address</Label>
                    <Textarea
                      id="reference1Address"
                      value={formData.reference1Address}
                      onChange={(e) => setFormData({ ...formData, reference1Address: e.target.value })}
                      rows={2}
                    />
                  </div>

                  {/* Reference 2 */}
                  <div className="space-y-2 md:col-span-2 pt-4 border-t border-border">
                    <Label className="text-base font-medium">Reference 2</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reference2Name">Name</Label>
                    <Input
                      id="reference2Name"
                      value={formData.reference2Name}
                      onChange={(e) => setFormData({ ...formData, reference2Name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reference2Mobile">Mobile Number</Label>
                    <Input
                      id="reference2Mobile"
                      value={formData.reference2Mobile}
                      onChange={(e) => setFormData({ ...formData, reference2Mobile: e.target.value })}
                      placeholder="10 digit mobile"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="reference2Address">Address</Label>
                    <Textarea
                      id="reference2Address"
                      value={formData.reference2Address}
                      onChange={(e) => setFormData({ ...formData, reference2Address: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2 pt-4 border-t border-border">
                    <Label className="text-base font-medium">Loan Details</Label>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Loan Type *</Label>
                    <RadioGroup
                      value={formData.loanType}
                      onValueChange={(value) => setFormData({ ...formData, loanType: value as LoanType })}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="PL" id="pl" />
                        <Label htmlFor="pl" className="cursor-pointer">Personal Loan (PL)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="HL" id="hl" />
                        <Label htmlFor="hl" className="cursor-pointer">Home Loan (HL)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="BL" id="bl" />
                        <Label htmlFor="bl" className="cursor-pointer">Business Loan (BL)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loanAmount">Loan Amount (₹) *</Label>
                    <Input
                      id="loanAmount"
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
                    <Label htmlFor="leadOwner">Lead Owner</Label>
                    <Input
                      id="leadOwner"
                      value={formData.leadOwner}
                      onChange={(e) => setFormData({ ...formData, leadOwner: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="salesManager">Sales Manager</Label>
                    <Input
                      id="salesManager"
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

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="remarks">Remarks</Label>
                    <Textarea
                      id="remarks"
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      placeholder="Add comments or notes..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createCustomerMutation.isPending}>
                    {createCustomerMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Customer'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <CustomerTable
        customers={customers}
        onView={handleView}
        onEdit={handleEdit}
      />

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
                  <Label className="text-muted-foreground">Application ID</Label>
                  <p className="text-foreground font-medium">{selectedCustomer.applicationId || 'N/A'}</p>
                </div>
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
                  <Label className="text-muted-foreground">Mother Name</Label>
                  <p className="text-foreground font-medium">{selectedCustomer.motherName || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Spouse Name</Label>
                  <p className="text-foreground font-medium">{selectedCustomer.spouseName || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Personal Email ID</Label>
                  <p className="text-foreground font-medium">{selectedCustomer.personalEmail || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Official Email ID</Label>
                  <p className="text-foreground font-medium">{selectedCustomer.officialEmail || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Total Work Experience</Label>
                  <p className="text-foreground font-medium">{selectedCustomer.totalWorkExperience || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Current Company Experience</Label>
                  <p className="text-foreground font-medium">{selectedCustomer.currentCompanyExp || 'N/A'}</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-muted-foreground">Current Address</Label>
                  <p className="text-foreground font-medium">{selectedCustomer.currentAddress || 'N/A'}</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-muted-foreground">Postal Address</Label>
                  <p className="text-foreground font-medium">{selectedCustomer.postalAddress || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Home Type</Label>
                  <p className="text-foreground font-medium">{selectedCustomer.homeType || 'N/A'}</p>
                </div>

                {/* Reference 1 */}
                {(selectedCustomer.reference1Name || selectedCustomer.reference1Mobile || selectedCustomer.reference1Address) && (
                  <>
                    <div className="space-y-2 md:col-span-2 pt-4 border-t border-border">
                      <Label className="text-base font-medium text-muted-foreground">Reference 1</Label>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Name</Label>
                      <p className="text-foreground font-medium">{selectedCustomer.reference1Name || 'N/A'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Mobile Number</Label>
                      <p className="text-foreground font-medium">{selectedCustomer.reference1Mobile || 'N/A'}</p>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-muted-foreground">Address</Label>
                      <p className="text-foreground font-medium">{selectedCustomer.reference1Address || 'N/A'}</p>
                    </div>
                  </>
                )}

                {/* Reference 2 */}
                {(selectedCustomer.reference2Name || selectedCustomer.reference2Mobile || selectedCustomer.reference2Address) && (
                  <>
                    <div className="space-y-2 md:col-span-2 pt-4 border-t border-border">
                      <Label className="text-base font-medium text-muted-foreground">Reference 2</Label>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Name</Label>
                      <p className="text-foreground font-medium">{selectedCustomer.reference2Name || 'N/A'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Mobile Number</Label>
                      <p className="text-foreground font-medium">{selectedCustomer.reference2Mobile || 'N/A'}</p>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-muted-foreground">Address</Label>
                      <p className="text-foreground font-medium">{selectedCustomer.reference2Address || 'N/A'}</p>
                    </div>
                  </>
                )}

                <div className="space-y-2 md:col-span-2 pt-4 border-t border-border">
                  <Label className="text-base font-medium text-muted-foreground">Loan Details</Label>
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

              {/* Multiple Remarks Section */}
              <div className="mt-6 pt-6 border-t border-border">
                <CustomerRemarks customerId={selectedCustomer.id} />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
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
          resetForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
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

              <div className="space-y-2">
                <Label htmlFor="edit-applicationId">Application ID</Label>
                <Input
                  id="edit-applicationId"
                  value={formData.applicationId}
                  onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
                  placeholder="Auto-generated if left blank"
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

              <div className="space-y-2">
                <Label htmlFor="edit-motherName">Mother Name</Label>
                <Input
                  id="edit-motherName"
                  value={formData.motherName}
                  onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-spouseName">Spouse Name</Label>
                <Input
                  id="edit-spouseName"
                  value={formData.spouseName}
                  onChange={(e) => setFormData({ ...formData, spouseName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-personalEmail">Personal Email ID</Label>
                <Input
                  id="edit-personalEmail"
                  type="email"
                  value={formData.personalEmail}
                  onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-officialEmail">Official Email ID</Label>
                <Input
                  id="edit-officialEmail"
                  type="email"
                  value={formData.officialEmail}
                  onChange={(e) => setFormData({ ...formData, officialEmail: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-totalWorkExperience">Total Work Experience</Label>
                <Input
                  id="edit-totalWorkExperience"
                  value={formData.totalWorkExperience}
                  onChange={(e) => setFormData({ ...formData, totalWorkExperience: e.target.value })}
                  placeholder="e.g., 5 years"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-currentCompanyExp">Current Company Experience</Label>
                <Input
                  id="edit-currentCompanyExp"
                  value={formData.currentCompanyExp}
                  onChange={(e) => setFormData({ ...formData, currentCompanyExp: e.target.value })}
                  placeholder="e.g., 2 years"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-currentAddress">Current Address</Label>
                <Textarea
                  id="edit-currentAddress"
                  value={formData.currentAddress}
                  onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-postalAddress">Postal Address</Label>
                <Textarea
                  id="edit-postalAddress"
                  value={formData.postalAddress}
                  onChange={(e) => setFormData({ ...formData, postalAddress: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Home Type</Label>
                <RadioGroup
                  value={formData.homeType}
                  onValueChange={(value) => setFormData({ ...formData, homeType: value })}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Own house" id="edit-own-house" />
                    <Label htmlFor="edit-own-house" className="cursor-pointer">Own House</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Rental" id="edit-rental" />
                    <Label htmlFor="edit-rental" className="cursor-pointer">Rental</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Self-occupied" id="edit-self-occupied" />
                    <Label htmlFor="edit-self-occupied" className="cursor-pointer">Self-Occupied</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Reference 1 */}
              <div className="space-y-2 md:col-span-2 pt-4 border-t border-border">
                <Label className="text-base font-medium">Reference 1</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-reference1Name">Name</Label>
                <Input
                  id="edit-reference1Name"
                  value={formData.reference1Name}
                  onChange={(e) => setFormData({ ...formData, reference1Name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-reference1Mobile">Mobile Number</Label>
                <Input
                  id="edit-reference1Mobile"
                  value={formData.reference1Mobile}
                  onChange={(e) => setFormData({ ...formData, reference1Mobile: e.target.value })}
                  placeholder="10 digit mobile"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-reference1Address">Address</Label>
                <Textarea
                  id="edit-reference1Address"
                  value={formData.reference1Address}
                  onChange={(e) => setFormData({ ...formData, reference1Address: e.target.value })}
                  rows={2}
                />
              </div>

              {/* Reference 2 */}
              <div className="space-y-2 md:col-span-2 pt-4 border-t border-border">
                <Label className="text-base font-medium">Reference 2</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-reference2Name">Name</Label>
                <Input
                  id="edit-reference2Name"
                  value={formData.reference2Name}
                  onChange={(e) => setFormData({ ...formData, reference2Name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-reference2Mobile">Mobile Number</Label>
                <Input
                  id="edit-reference2Mobile"
                  value={formData.reference2Mobile}
                  onChange={(e) => setFormData({ ...formData, reference2Mobile: e.target.value })}
                  placeholder="10 digit mobile"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-reference2Address">Address</Label>
                <Textarea
                  id="edit-reference2Address"
                  value={formData.reference2Address}
                  onChange={(e) => setFormData({ ...formData, reference2Address: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2 md:col-span-2 pt-4 border-t border-border">
                <Label className="text-base font-medium">Loan Details</Label>
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

            {/* Multiple Remarks Section */}
            {selectedCustomer && (
              <div className="mt-6 pt-6 border-t border-border">
                <CustomerRemarks customerId={selectedCustomer.id} />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedCustomer(null);
                  resetForm();
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
