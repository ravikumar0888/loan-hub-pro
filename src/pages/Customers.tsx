import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CustomerTable from '@/components/dashboard/CustomerTable';
import { mockCustomers, mockUsers, mockBanks } from '@/data/mockData';
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
import { Customer, LoanType, LoanStatus } from '@/types';
import { format } from 'date-fns';

export default function Customers() {
  const { role } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);

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
    remarks: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const connectors = mockUsers.filter((u) => u.role === 'connector');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Customer name is required';
    if (!formData.mobile.match(/^\d{10}$/)) newErrors.mobile = 'Valid 10-digit mobile required';
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = 'Valid email required';
    if (!formData.loanAmount || Number(formData.loanAmount) <= 0) newErrors.loanAmount = 'Valid loan amount required';
    if (!formData.connectorId) newErrors.connectorId = 'Connector is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const connector = connectors.find((c) => c.id === formData.connectorId);
    const newCustomer: Customer = {
      id: `${Date.now()}`,
      date: new Date(),
      name: formData.name,
      mobile: formData.mobile,
      email: formData.email,
      loanType: formData.loanType,
      loanAmount: Number(formData.loanAmount),
      connectorId: formData.connectorId,
      connectorName: connector ? `${connector.firstName} ${connector.lastName}` : '',
      leadOwner: formData.leadOwner,
      salesManager: formData.salesManager,
      status: formData.status,
      remarks: formData.remarks ? [formData.remarks] : [],
      createdAt: new Date(),
    };

    setCustomers([newCustomer, ...customers]);
    setIsDialogOpen(false);
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
      remarks: '',
    });
    setErrors({});
    setIsLoading(false);

    toast({
      title: 'Customer Added',
      description: 'New customer has been successfully added.',
    });
  };

  const canAddCustomer = role === 'admin' || role === 'backoffice';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Customer Management</h2>
          <p className="text-muted-foreground">Manage and track all customer applications</p>
        </div>
        {canAddCustomer && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input value={format(new Date(), 'PPP')} disabled />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Customer Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      error={!!errors.name}
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
                      error={!!errors.mobile}
                    />
                    {errors.mobile && <p className="text-sm text-destructive">{errors.mobile}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      error={!!errors.email}
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
                      error={!!errors.loanAmount}
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
                        {connectors.map((connector) => (
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
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
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
        onView={(customer) => console.log('View', customer)}
        onEdit={(customer) => console.log('Edit', customer)}
      />
    </div>
  );
}
