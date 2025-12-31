import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Customer, LoanType, LoanStatus, HomeType } from '@/types';
import { mockUsers, mockBanks, mockDSAs } from '@/data/mockData';
import { format } from 'date-fns';

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  mode: 'add' | 'edit' | 'view';
  onSave: (customer: Customer) => void;
}

const generateApplicationId = () => {
  return `APP${Date.now().toString().slice(-6)}`;
};

const emptyFormData = {
  name: '',
  motherName: '',
  spouseName: '',
  mobile: '',
  currentCompany: '',
  currentCompanyExperience: '',
  officialEmail: '',
  totalWorkExperience: '',
  currentAddress: '',
  postalAddress: '',
  homeType: 'own' as HomeType,
  reference1Name: '',
  reference1Mobile: '',
  reference1Address: '',
  reference2Name: '',
  reference2Mobile: '',
  reference2Address: '',
  loanType: 'PL' as LoanType,
  loanAmount: '',
  connectorId: '',
  dsaId: '',
  bankId: '',
  leadOwner: '',
  salesManager: '',
  status: 'login' as LoanStatus,
  newRemark: '',
};

export default function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  mode,
  onSave,
}: CustomerFormDialogProps) {
  const { role, user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(emptyFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const connectors = mockUsers.filter((u) => u.role === 'connector');
  const isReadOnly = mode === 'view';
  const canAddRemark = role === 'admin' || role === 'backoffice';

  useEffect(() => {
    if (customer && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: customer.name,
        motherName: customer.motherName,
        spouseName: customer.spouseName,
        mobile: customer.mobile,
        currentCompany: customer.currentCompany,
        currentCompanyExperience: customer.currentCompanyExperience,
        officialEmail: customer.officialEmail,
        totalWorkExperience: customer.totalWorkExperience,
        currentAddress: customer.currentAddress,
        postalAddress: customer.postalAddress,
        homeType: customer.homeType,
        reference1Name: customer.reference1.name,
        reference1Mobile: customer.reference1.mobile,
        reference1Address: customer.reference1.address,
        reference2Name: customer.reference2.name,
        reference2Mobile: customer.reference2.mobile,
        reference2Address: customer.reference2.address,
        loanType: customer.loanType,
        loanAmount: String(customer.loanAmount),
        connectorId: customer.connectorId,
        dsaId: customer.dsaId,
        bankId: customer.bankId,
        leadOwner: customer.leadOwner,
        salesManager: customer.salesManager,
        status: customer.status,
        newRemark: '',
      });
    } else if (mode === 'add') {
      setFormData(emptyFormData);
    }
    setErrors({});
  }, [customer, mode, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Client name is required';
    if (!formData.mobile.match(/^\d{10}$/)) newErrors.mobile = 'Valid 10-digit mobile required';
    if (!formData.loanAmount || Number(formData.loanAmount) <= 0) newErrors.loanAmount = 'Valid loan amount required';
    if (!formData.connectorId) newErrors.connectorId = 'Connector is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const connector = connectors.find((c) => c.id === formData.connectorId);
    const dsa = mockDSAs.find((d) => d.id === formData.dsaId);
    const bank = mockBanks.find((b) => b.id === formData.bankId);

    const existingRemarks = customer?.remarks || [];
    const newRemarks = formData.newRemark.trim()
      ? [
          ...existingRemarks,
          {
            text: formData.newRemark,
            addedBy: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
            addedAt: new Date(),
          },
        ]
      : existingRemarks;

    const savedCustomer: Customer = {
      id: customer?.id || `${Date.now()}`,
      date: customer?.date || new Date(),
      applicationId: customer?.applicationId || generateApplicationId(),
      name: formData.name,
      motherName: formData.motherName,
      spouseName: formData.spouseName,
      mobile: formData.mobile,
      email: formData.officialEmail,
      currentCompany: formData.currentCompany,
      currentCompanyExperience: formData.currentCompanyExperience,
      officialEmail: formData.officialEmail,
      totalWorkExperience: formData.totalWorkExperience,
      currentAddress: formData.currentAddress,
      postalAddress: formData.postalAddress,
      homeType: formData.homeType,
      reference1: {
        name: formData.reference1Name,
        mobile: formData.reference1Mobile,
        address: formData.reference1Address,
      },
      reference2: {
        name: formData.reference2Name,
        mobile: formData.reference2Mobile,
        address: formData.reference2Address,
      },
      loanType: formData.loanType,
      loanAmount: Number(formData.loanAmount),
      connectorId: formData.connectorId,
      connectorName: connector ? `${connector.firstName} ${connector.lastName}` : '',
      dsaId: formData.dsaId,
      dsaName: dsa?.name || '',
      bankId: formData.bankId,
      bankName: bank?.name || '',
      leadOwner: formData.leadOwner,
      salesManager: formData.salesManager,
      status: formData.status,
      remarks: newRemarks,
      createdAt: customer?.createdAt || new Date(),
    };

    onSave(savedCustomer);
    setIsLoading(false);
    onOpenChange(false);

    toast({
      title: mode === 'add' ? 'Customer Added' : 'Customer Updated',
      description: mode === 'add' 
        ? 'New customer has been successfully added.'
        : 'Customer details have been updated.',
    });
  };

  const renderField = (
    id: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
    options?: { required?: boolean; type?: string; placeholder?: string; error?: string }
  ) => (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} {options?.required && '*'}
      </Label>
      {isReadOnly ? (
        <div className="p-2 bg-muted rounded-md text-sm">{value || '-'}</div>
      ) : (
        <>
          <Input
            id={id}
            type={options?.type || 'text'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={options?.placeholder}
            error={!!options?.error}
          />
          {options?.error && <p className="text-sm text-destructive">{options.error}</p>}
        </>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add New Customer' : mode === 'edit' ? 'Edit Customer' : 'View Customer'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Personal Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary border-b border-border pb-2">
              Personal Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <div className="p-2 bg-muted rounded-md text-sm">
                  {format(customer?.date || new Date(), 'PPP')}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Application ID</Label>
                <div className="p-2 bg-muted rounded-md text-sm font-mono">
                  {customer?.applicationId || 'Auto-generated'}
                </div>
              </div>

              {renderField('name', 'Client Name', formData.name, (v) => setFormData({ ...formData, name: v }), {
                required: true,
                error: errors.name,
              })}

              {renderField('motherName', 'Mother Name', formData.motherName, (v) => setFormData({ ...formData, motherName: v }))}

              {renderField('spouseName', 'Spouse Name', formData.spouseName, (v) => setFormData({ ...formData, spouseName: v }))}

              {renderField('mobile', 'Mobile Number', formData.mobile, (v) => setFormData({ ...formData, mobile: v }), {
                required: true,
                placeholder: '10 digit mobile',
                error: errors.mobile,
              })}
            </div>
          </div>

          {/* Professional Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary border-b border-border pb-2">
              Professional Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {renderField('currentCompany', 'Current Company', formData.currentCompany, (v) => setFormData({ ...formData, currentCompany: v }))}

              {renderField('currentCompanyExperience', 'Current Company Experience', formData.currentCompanyExperience, (v) => setFormData({ ...formData, currentCompanyExperience: v }))}

              {renderField('officialEmail', 'Official Email ID', formData.officialEmail, (v) => setFormData({ ...formData, officialEmail: v }), {
                type: 'email',
              })}

              {renderField('totalWorkExperience', 'Total Work Experience', formData.totalWorkExperience, (v) => setFormData({ ...formData, totalWorkExperience: v }))}

              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <Label htmlFor="currentAddress">Current Address</Label>
                {isReadOnly ? (
                  <div className="p-2 bg-muted rounded-md text-sm">{formData.currentAddress || '-'}</div>
                ) : (
                  <Textarea
                    id="currentAddress"
                    value={formData.currentAddress}
                    onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })}
                    rows={2}
                  />
                )}
              </div>

              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <Label htmlFor="postalAddress">Postal Address</Label>
                {isReadOnly ? (
                  <div className="p-2 bg-muted rounded-md text-sm">{formData.postalAddress || '-'}</div>
                ) : (
                  <Textarea
                    id="postalAddress"
                    value={formData.postalAddress}
                    onChange={(e) => setFormData({ ...formData, postalAddress: e.target.value })}
                    rows={2}
                  />
                )}
              </div>

              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <Label>Home Type</Label>
                {isReadOnly ? (
                  <div className="p-2 bg-muted rounded-md text-sm capitalize">{formData.homeType.replace('-', ' ')}</div>
                ) : (
                  <RadioGroup
                    value={formData.homeType}
                    onValueChange={(value) => setFormData({ ...formData, homeType: value as HomeType })}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="own" id="own" />
                      <Label htmlFor="own" className="cursor-pointer">Own House</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="rental" id="rental" />
                      <Label htmlFor="rental" className="cursor-pointer">Rental</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="self-occupied" id="self-occupied" />
                      <Label htmlFor="self-occupied" className="cursor-pointer">Self-Occupied</Label>
                    </div>
                  </RadioGroup>
                )}
              </div>
            </div>
          </div>

          {/* References Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary border-b border-border pb-2">
              References
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Reference 1 */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-foreground">Reference 1</h4>
                <div className="grid grid-cols-1 gap-4">
                  {renderField('reference1Name', 'Name', formData.reference1Name, (v) => setFormData({ ...formData, reference1Name: v }))}
                  {renderField('reference1Mobile', 'Mobile Number', formData.reference1Mobile, (v) => setFormData({ ...formData, reference1Mobile: v }))}
                  {renderField('reference1Address', 'Address', formData.reference1Address, (v) => setFormData({ ...formData, reference1Address: v }))}
                </div>
              </div>

              {/* Reference 2 */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-foreground">Reference 2</h4>
                <div className="grid grid-cols-1 gap-4">
                  {renderField('reference2Name', 'Name', formData.reference2Name, (v) => setFormData({ ...formData, reference2Name: v }))}
                  {renderField('reference2Mobile', 'Mobile Number', formData.reference2Mobile, (v) => setFormData({ ...formData, reference2Mobile: v }))}
                  {renderField('reference2Address', 'Address', formData.reference2Address, (v) => setFormData({ ...formData, reference2Address: v }))}
                </div>
              </div>
            </div>
          </div>

          {/* Loan Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary border-b border-border pb-2">
              Loan Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <Label>Loan Type *</Label>
                {isReadOnly ? (
                  <div className="p-2 bg-muted rounded-md text-sm">
                    {formData.loanType === 'PL' ? 'Personal Loan' : formData.loanType === 'HL' ? 'Home Loan' : 'Business Loan'}
                  </div>
                ) : (
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
                )}
              </div>

              {renderField('loanAmount', 'Loan Amount (₹)', formData.loanAmount, (v) => setFormData({ ...formData, loanAmount: v }), {
                required: true,
                type: 'number',
                error: errors.loanAmount,
              })}

              <div className="space-y-2">
                <Label>Connector *</Label>
                {isReadOnly ? (
                  <div className="p-2 bg-muted rounded-md text-sm">
                    {connectors.find(c => c.id === formData.connectorId)
                      ? `${connectors.find(c => c.id === formData.connectorId)!.firstName} ${connectors.find(c => c.id === formData.connectorId)!.lastName}`
                      : '-'}
                  </div>
                ) : (
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
                )}
                {errors.connectorId && <p className="text-sm text-destructive">{errors.connectorId}</p>}
              </div>

              <div className="space-y-2">
                <Label>DSA</Label>
                {isReadOnly ? (
                  <div className="p-2 bg-muted rounded-md text-sm">
                    {mockDSAs.find(d => d.id === formData.dsaId)?.name || '-'}
                  </div>
                ) : (
                  <Select
                    value={formData.dsaId}
                    onValueChange={(value) => setFormData({ ...formData, dsaId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select DSA" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      {mockDSAs.map((dsa) => (
                        <SelectItem key={dsa.id} value={dsa.id}>
                          {dsa.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label>Bank Name</Label>
                {isReadOnly ? (
                  <div className="p-2 bg-muted rounded-md text-sm">
                    {mockBanks.find(b => b.id === formData.bankId)?.name || '-'}
                  </div>
                ) : (
                  <Select
                    value={formData.bankId}
                    onValueChange={(value) => setFormData({ ...formData, bankId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      {mockBanks.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {renderField('leadOwner', 'Lead Owner', formData.leadOwner, (v) => setFormData({ ...formData, leadOwner: v }))}

              {renderField('salesManager', 'Sales Manager', formData.salesManager, (v) => setFormData({ ...formData, salesManager: v }))}

              <div className="space-y-2">
                <Label>Status</Label>
                {isReadOnly ? (
                  <div className="p-2 bg-muted rounded-md text-sm capitalize">{formData.status}</div>
                ) : (
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
                )}
              </div>
            </div>
          </div>

          {/* Remarks Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary border-b border-border pb-2">
              Remarks
            </h3>
            
            {/* Existing Remarks - Visible to everyone */}
            {customer?.remarks && customer.remarks.length > 0 && (
              <div className="space-y-2">
                <Label>Previous Remarks</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {customer.remarks.map((remark, index) => (
                    <div key={index} className="p-3 bg-muted/50 rounded-lg text-sm">
                      <p className="text-foreground">{remark.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        By {remark.addedBy} on {format(new Date(remark.addedAt), 'PPp')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Remark - Only for Admin and BackOffice */}
            {canAddRemark && !isReadOnly && (
              <div className="space-y-2">
                <Label htmlFor="newRemark">Add New Remark</Label>
                <Textarea
                  id="newRemark"
                  value={formData.newRemark}
                  onChange={(e) => setFormData({ ...formData, newRemark: e.target.value })}
                  placeholder="Add a comment or note..."
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            {!isReadOnly && (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  mode === 'add' ? 'Save Customer' : 'Update Customer'
                )}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
