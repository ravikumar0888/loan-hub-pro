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
import { DatePicker } from '@/components/ui/date-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Download, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Customer, LoanType, LoanStatus, HomeType, CaseType, MaritalStatus } from '@/types';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { usersApi, banksApi, dsasApi } from '@/lib/api';

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  mode: 'add' | 'edit' | 'view';
  onSave: (customer: Customer) => void;
}

const TAB_ORDER = ['personal', 'loan', 'professional', 'address', 'reference', 'remarks'];

const emptyFormData = {
  applicationId: '',
  applicationDate: new Date() as Date | null,
  name: '',
  panNo: '',
  dateOfBirth: null as Date | null,
  motherName: '',
  spouseName: '',
  mobile: '',
  personalEmail: '',
  qualification: '',
  maritalStatus: '' as MaritalStatus | '',
  currentCompany: '',
  currentCompanyExperience: '',
  officialEmail: '',
  totalWorkExperience: '',
  companyAddress: '',
  currentAddress: '',
  postalAddress: '',
  homeType: 'own' as HomeType,
  reference1Name: '',
  reference1Mobile: '',
  reference1Address: '',
  reference2Name: '',
  reference2Mobile: '',
  reference2Address: '',
  nomineeName: '',
  nomineeRelation: '',
  nomineeDateOfBirth: null as Date | null,
  loanType: 'PL' as LoanType,
  loanAmount: '',
  tenure: '',
  caseType: 'fresh' as CaseType,
  location: '',
  subventionAmount: '',
  hasSubvention: false,
  connectorId: '',
  dsaId: '',
  bankId: '',
  leadOwner: '',
  salesManager: '',
  status: 'login' as LoanStatus,
  newRemark: '',
  pdfUrl: '',
};

export default function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  mode,
  onSave,
}: CustomerFormDialogProps) {
  const { role } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(emptyFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('personal');

  // Fetch connectors from backend
  const { data: connectorsData } = useQuery({
    queryKey: ['connectors'],
    queryFn: async () => {
      const response = await usersApi.getConnectors();
      return response.data;
    },
  });

  // Fetch banks from backend
  const { data: banksData } = useQuery({
    queryKey: ['banks'],
    queryFn: async () => {
      const response = await banksApi.getAllBanks();
      return response.data;
    },
  });

  // Fetch DSAs from backend
  const { data: dsasData } = useQuery({
    queryKey: ['dsas'],
    queryFn: async () => {
      const response = await dsasApi.getAllDsas();
      return response.data;
    },
  });

  // Fetch Admin users for Lead Owner dropdown
  const { data: adminsData } = useQuery({
    queryKey: ['admins'],
    queryFn: async () => {
      const response = await usersApi.getAdmins();
      return response.data;
    },
  });

  const connectors = connectorsData || [];
  const banks = banksData || [];
  const dsas = dsasData || [];
  const admins = adminsData || [];
  const isReadOnly = mode === 'view';
  const canAddRemark = role === 'superadmin' || role === 'admin' || role === 'backoffice';
  const showDSAField = (role as string) !== 'connector';

  // Filter banks based on selected DSA's bank details
  const filteredBanks = React.useMemo(() => {
    if (!formData.dsaId) {
      return banks; // Show all banks if no DSA selected
    }
    const selectedDsa = dsas.find((d: any) => d.id === formData.dsaId);
    if (!selectedDsa?.bankDetails || selectedDsa.bankDetails.length === 0) {
      return banks; // Show all banks if DSA has no bank details
    }
    // Get bank IDs from DSA's bank details
    const dsaBankIds = selectedDsa.bankDetails.map((bd: any) => bd.bankId);
    return banks.filter((bank: any) => dsaBankIds.includes(bank.id));
  }, [formData.dsaId, dsas, banks]);

  // Calculate payout dynamically based on loan amount, subvention, connector, bank, and loan type
  const calculatedPayout = React.useMemo(() => {
    if (!formData.connectorId || !formData.bankId || !formData.loanType || !formData.loanAmount) {
      return null;
    }

    const loanAmount = Number(formData.loanAmount);
    if (loanAmount <= 0) return null;

    // Find the selected connector
    const selectedConnector = connectors.find((c: any) => c.id === formData.connectorId);
    if (!selectedConnector?.userBankDetails || selectedConnector.userBankDetails.length === 0) {
      return null;
    }

    // Find matching payout ratio for selected bank and loan type
    const matchingDetail = selectedConnector.userBankDetails.find(
      (bd: any) => bd.bankId === formData.bankId && bd.loanType === formData.loanType
    );

    if (!matchingDetail) return null;

    const payoutRatio = Number(matchingDetail.payoutRatio);
    const subvention = formData.hasSubvention && formData.subventionAmount ? Number(formData.subventionAmount) : 0;

    // Calculate: (loanAmount × payoutRatio%) - subventionAmount
    const payout = (loanAmount * payoutRatio / 100) - subvention;
    return payout;
  }, [formData.connectorId, formData.bankId, formData.loanType, formData.loanAmount, formData.hasSubvention, formData.subventionAmount, connectors]);


  useEffect(() => {
    if (customer && (mode === 'edit' || mode === 'view')) {
      setFormData({
        applicationId: customer.applicationId || '',
        applicationDate: customer.applicationDate ? new Date(customer.applicationDate) : new Date(),
        name: customer.name || '',
        panNo: customer.panNo || '',
        dateOfBirth: customer.dateOfBirth ? new Date(customer.dateOfBirth) : null,
        motherName: customer.motherName || '',
        spouseName: customer.spouseName || '',
        mobile: customer.mobile || '',
        personalEmail: customer.personalEmail || '',
        qualification: (customer as any).qualification || '',
        maritalStatus: (customer as any).maritalStatus || '',
        currentCompany: customer.currentCompany || '',
        currentCompanyExperience: customer.currentCompanyExperience || '',
        officialEmail: customer.officialEmail || '',
        totalWorkExperience: customer.totalWorkExperience || '',
        companyAddress: (customer as any).companyAddress || '',
        currentAddress: customer.currentAddress || '',
        postalAddress: customer.postalAddress || '',
        homeType: customer.homeType || 'own',
        reference1Name: customer.reference1?.name || '',
        reference1Mobile: customer.reference1?.mobile || '',
        reference1Address: customer.reference1?.address || '',
        reference2Name: customer.reference2?.name || '',
        reference2Mobile: customer.reference2?.mobile || '',
        reference2Address: customer.reference2?.address || '',
        nomineeName: customer.nomineeName || '',
        nomineeRelation: customer.nomineeRelation || '',
        nomineeDateOfBirth: customer.nomineeDateOfBirth ? new Date(customer.nomineeDateOfBirth) : null,
        loanType: customer.loanType || 'PL',
        loanAmount: String(customer.loanAmount || ''),
        tenure: (customer as any).tenure || '',
        caseType: customer.caseType || 'fresh',
        location: customer.location || '',
        subventionAmount: String(customer.subventionAmount || ''),
        hasSubvention: !!customer.subventionAmount,
        connectorId: customer.connectorId || '',
        dsaId: customer.dsaId || '',
        bankId: customer.bankId || '',
        leadOwner: customer.leadOwner || '',
        salesManager: customer.salesManager || '',
        status: customer.status || 'login',
        newRemark: '',
        pdfUrl: customer.pdfUrl || '',
      });
    } else if (mode === 'add') {
      setFormData(emptyFormData);
    }
    setErrors({});
    setActiveTab('personal');
  }, [customer, mode, open]);

  // Validation for each tab
  const validateTab = (tab: string): boolean => {
    const newErrors: Record<string, string> = {};

    switch (tab) {
      case 'personal':
        if (!formData.name.trim()) newErrors.name = 'Client name is required';
        if (!formData.mobile.match(/^\d{10}$/)) newErrors.mobile = 'Valid 10-digit mobile required';
        break;
      case 'loan':
        if (!formData.loanAmount || Number(formData.loanAmount) <= 0) newErrors.loanAmount = 'Valid loan amount required';
        if (!formData.connectorId) newErrors.connectorId = 'Channel Partner is required';
        break;
      case 'professional':
        // No mandatory fields
        break;
      case 'address':
        // No mandatory fields
        break;
      case 'reference':
        // No mandatory fields
        break;
      case 'remarks':
        // No mandatory fields
        break;
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validateAllTabs = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Client name is required';
    if (!formData.mobile.match(/^\d{10}$/)) newErrors.mobile = 'Valid 10-digit mobile required';
    if (!formData.loanAmount || Number(formData.loanAmount) <= 0) newErrors.loanAmount = 'Valid loan amount required';
    if (!formData.connectorId) newErrors.connectorId = 'Channel Partner is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextTab = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!validateTab(activeTab)) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields before proceeding.',
        variant: 'destructive',
      });
      return;
    }

    const currentIndex = TAB_ORDER.indexOf(activeTab);
    if (currentIndex < TAB_ORDER.length - 1) {
      setActiveTab(TAB_ORDER[currentIndex + 1]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAllTabs()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Helper function to convert Date to YYYY-MM-DD format (local timezone)
      const formatDateForBackend = (date: Date | null) => {
        if (!date) return undefined;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // Prepare customer data for backend API
      const customerData = {
        applicationId: formData.applicationId || undefined,
        applicationDate: formatDateForBackend(formData.applicationDate),
        name: formData.name,
        panNo: formData.panNo || undefined,
        dateOfBirth: formatDateForBackend(formData.dateOfBirth),
        mobile: formData.mobile,
        email: formData.officialEmail || undefined,
        motherName: formData.motherName || undefined,
        spouseName: formData.spouseName || undefined,
        personalEmail: formData.personalEmail || undefined,
        officialEmail: formData.officialEmail || undefined,
        qualification: formData.qualification || undefined,
        maritalStatus: formData.maritalStatus || undefined,
        totalWorkExperience: formData.totalWorkExperience || undefined,
        currentCompany: formData.currentCompany || undefined,
        currentCompanyExp: formData.currentCompanyExperience || undefined,
        companyAddress: formData.companyAddress || undefined,
        currentAddress: formData.currentAddress || undefined,
        postalAddress: formData.postalAddress || undefined,
        homeType: formData.homeType || undefined,
        reference1Name: formData.reference1Name || undefined,
        reference1Mobile: formData.reference1Mobile || undefined,
        reference1Address: formData.reference1Address || undefined,
        reference2Name: formData.reference2Name || undefined,
        reference2Mobile: formData.reference2Mobile || undefined,
        reference2Address: formData.reference2Address || undefined,
        nomineeName: formData.nomineeName || undefined,
        nomineeRelation: formData.nomineeRelation || undefined,
        nomineeDateOfBirth: formatDateForBackend(formData.nomineeDateOfBirth),
        loanType: formData.loanType,
        loanAmount: Number(formData.loanAmount),
        tenure: formData.tenure || undefined,
        caseType: formData.caseType || undefined,
        location: formData.location || undefined,
        subventionAmount: formData.hasSubvention && formData.subventionAmount ? Number(formData.subventionAmount) : null,
        connectorId: formData.connectorId || undefined,
        dsaId: formData.dsaId || undefined,
        bankId: formData.bankId || undefined,
        leadOwner: formData.leadOwner || undefined,
        salesManager: formData.salesManager || undefined,
        status: formData.status,
        remarks: formData.newRemark.trim() || undefined,
      };

      // Call parent onSave callback with the data
      onSave(customerData as any);

      onOpenChange(false);

      toast({
        title: mode === 'add' ? 'Customer Added' : 'Customer Updated',
        description: mode === 'add'
          ? 'New customer has been successfully added.'
          : 'Customer details have been updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${mode === 'add' ? 'add' : 'update'} customer`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderField = (
    id: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
    options?: { required?: boolean; type?: string; placeholder?: string; error?: string; maxLength?: number }
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
            maxLength={options?.maxLength}
            error={!!options?.error}
          />
          {options?.error && <p className="text-sm text-destructive">{options.error}</p>}
        </>
      )}
    </div>
  );

  const isLastTab = activeTab === 'remarks';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add New Lead' : mode === 'edit' ? 'Edit Lead' : 'View Lead'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-6">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="loan">Loan</TabsTrigger>
              <TabsTrigger value="professional">Professional</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
              <TabsTrigger value="reference">Reference</TabsTrigger>
              <TabsTrigger value="remarks">Remarks</TabsTrigger>
            </TabsList>

            {/* Tab 1: Personal Details */}
            <TabsContent value="personal" className="space-y-4 min-h-[420px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="applicationDate">Application Date</Label>
                  {isReadOnly || (role as string) === 'connector' || ((role as string) === 'backoffice' && mode === 'edit') ? (
                    <div className="p-2 bg-muted rounded-md text-sm">
                      {format(formData.applicationDate || customer?.applicationDate || customer?.date || new Date(), 'PPP')}
                    </div>
                  ) : (
                    <DatePicker
                      date={formData.applicationDate || undefined}
                      onDateChange={(date) => setFormData({ ...formData, applicationDate: date || null })}
                      disabled={(role as string) === 'connector'}
                    />
                  )}
                </div>

                {renderField('applicationId', 'Application ID', formData.applicationId, (v) => setFormData({ ...formData, applicationId: v }))}

                {/* Show Last Updated Date in View Mode */}
                {mode === 'view' && customer?.updatedAt && (
                  <div className="space-y-2">
                    <Label>Last Updated</Label>
                    <div className="p-2 bg-muted rounded-md text-sm">
                      {format(new Date(customer.updatedAt), 'PPP p')}
                    </div>
                  </div>
                )}

                {renderField('name', 'Client Full Name (As per PAN)', formData.name, (v) => setFormData({ ...formData, name: v }), {
                  required: true,
                  error: errors.name,
                })}

                {renderField('panNo', 'PAN No', formData.panNo, (v) => setFormData({ ...formData, panNo: v.toUpperCase() }), {
                  placeholder: 'ABCDE1234F',
                  maxLength: 10,
                })}

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">DOB</Label>
                  {isReadOnly ? (
                    <div className="p-2 bg-muted rounded-md text-sm">
                      {formData.dateOfBirth ? format(formData.dateOfBirth, 'PPP') : '-'}
                    </div>
                  ) : (
                    <DatePicker
                      date={formData.dateOfBirth || undefined}
                      onDateChange={(date) => setFormData({ ...formData, dateOfBirth: date || null })}
                      placeholder="Select date of birth"
                      fromYear={1950}
                      toYear={new Date().getFullYear()}
                    />
                  )}
                </div>

                {renderField('motherName', 'Mother Name', formData.motherName, (v) => setFormData({ ...formData, motherName: v }))}

                {renderField('spouseName', 'Spouse Name', formData.spouseName, (v) => setFormData({ ...formData, spouseName: v }))}

                {renderField('mobile', 'Mobile Number', formData.mobile, (v) => setFormData({ ...formData, mobile: v }), {
                  required: true,
                  placeholder: '10 digit mobile',
                  maxLength: 10,
                  error: errors.mobile,
                })}

                {renderField('personalEmail', 'Personal Email Id', formData.personalEmail, (v) => setFormData({ ...formData, personalEmail: v }), {
                  placeholder: 'personal@example.com',
                  type: 'email',
                })}

                {renderField('qualification', 'Qualification', formData.qualification, (v) => setFormData({ ...formData, qualification: v }), {
                  placeholder: 'e.g., Graduate, Post Graduate',
                })}

                <div className="space-y-2">
                  <Label>Marital Status</Label>
                  {isReadOnly ? (
                    <div className="p-2 bg-muted rounded-md text-sm capitalize">{formData.maritalStatus || '-'}</div>
                  ) : (
                    <Select
                      value={formData.maritalStatus}
                      onValueChange={(value) => setFormData({ ...formData, maritalStatus: value as MaritalStatus })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select marital status" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border border-border">
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Loan Details */}
            <TabsContent value="loan" className="space-y-4 min-h-[420px]">
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

                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                  <Label>Case Type</Label>
                  {isReadOnly ? (
                    <div className="p-2 bg-muted rounded-md text-sm capitalize">
                      {formData.caseType === 'fresh' ? 'Fresh' : formData.caseType === 'bt' ? 'BT' : 'BT-TopUp'}
                    </div>
                  ) : (
                    <RadioGroup
                      value={formData.caseType}
                      onValueChange={(value) => setFormData({ ...formData, caseType: value as CaseType })}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="fresh" id="fresh" />
                        <Label htmlFor="fresh" className="cursor-pointer">Fresh</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="bt" id="bt" />
                        <Label htmlFor="bt" className="cursor-pointer">BT</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="bt_topup" id="bt_topup" />
                        <Label htmlFor="bt_topup" className="cursor-pointer">BT-TopUp</Label>
                      </div>
                    </RadioGroup>
                  )}
                </div>

                {renderField('loanAmount', 'Loan Amount', formData.loanAmount, (v) => setFormData({ ...formData, loanAmount: v }), {
                  required: true,
                  type: 'number',
                  error: errors.loanAmount,
                })}

                {renderField('tenure', 'Tenure', formData.tenure, (v) => setFormData({ ...formData, tenure: v }), {
                  placeholder: 'e.g., 12 months, 5 years',
                })}

                {renderField('location', 'Location', formData.location, (v) => setFormData({ ...formData, location: v }))}

                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hasSubvention"
                      checked={formData.hasSubvention}
                      onChange={(e) => setFormData({ ...formData, hasSubvention: e.target.checked, subventionAmount: e.target.checked ? formData.subventionAmount : '' })}
                      disabled={isReadOnly}
                      className="w-4 h-4 border border-border rounded"
                    />
                    <Label htmlFor="hasSubvention" className="cursor-pointer">
                      Has Subvention (Amount will be deducted from Channel Partner payout)
                    </Label>
                  </div>
                  {formData.hasSubvention && (
                    <div className="mt-2">
                      {renderField('subventionAmount', 'Subvention Amount', formData.subventionAmount, (v) => setFormData({ ...formData, subventionAmount: v }), {
                        type: 'number',
                      })}
                    </div>
                  )}
                </div>

                {/* Calculated Payout Display */}
                {(role === 'superadmin' || role === 'admin') && (
                  <div className="space-y-2">
                    <Label>Calculated Payout</Label>
                    <div className={`p-3 rounded-md text-sm font-medium ${calculatedPayout !== null ? 'bg-success/10 text-success border border-success/20' : 'bg-muted text-muted-foreground'}`}>
                      {calculatedPayout !== null ? (
                        <>₹{Math.round(calculatedPayout).toLocaleString('en-IN')}</>
                      ) : (
                        <span className="text-xs">Select Channel Partner, Bank & Loan Type to calculate</span>
                      )}
                    </div>
                    {calculatedPayout !== null && formData.hasSubvention && Number(formData.subventionAmount) > 0 && (
                      <p className="text-xs text-muted-foreground">
                        (After ₹{Number(formData.subventionAmount).toLocaleString('en-IN')} subvention deduction)
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Channel Partner *</Label>
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
                        <SelectValue placeholder="Select channel partner" />
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

                {showDSAField && (
                  <div className="space-y-2">
                    <Label>DSA</Label>
                    {isReadOnly ? (
                      <div className="p-2 bg-muted rounded-md text-sm">
                        {dsas.find((d: any) => d.id === formData.dsaId)?.name || '-'}
                      </div>
                    ) : (
                      <Select
                        value={formData.dsaId}
                        onValueChange={(value) => {
                          // Check if current bank is valid for new DSA
                          const newDsa = dsas.find((d: any) => d.id === value);
                          let newBankId = formData.bankId;
                          if (newDsa?.bankDetails && newDsa.bankDetails.length > 0) {
                            const dsaBankIds = newDsa.bankDetails.map((bd: any) => bd.bankId);
                            if (!dsaBankIds.includes(formData.bankId)) {
                              newBankId = ''; // Clear bank if not in new DSA's banks
                            }
                          }
                          setFormData({ ...formData, dsaId: value, bankId: newBankId });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select DSA" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border border-border">
                          {dsas.map((dsa: any) => (
                            <SelectItem key={dsa.id} value={dsa.id}>
                              {dsa.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  {isReadOnly ? (
                    <div className="p-2 bg-muted rounded-md text-sm">
                      {banks.find((b: any) => b.id === formData.bankId)?.name || '-'}
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
                        {filteredBanks.map((bank: any) => (
                          <SelectItem key={bank.id} value={bank.id}>
                            {bank.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Lead Owner</Label>
                  {isReadOnly ? (
                    <div className="p-2 bg-muted rounded-md text-sm">
                      {admins.find((a: any) => a.id === formData.leadOwner)
                        ? `${admins.find((a: any) => a.id === formData.leadOwner)!.firstName} ${admins.find((a: any) => a.id === formData.leadOwner)!.lastName}`
                        : '-'}
                    </div>
                  ) : (
                    <Select
                      value={formData.leadOwner}
                      onValueChange={(value) => setFormData({ ...formData, leadOwner: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Lead Owner" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border border-border">
                        {admins.map((admin: any) => (
                          <SelectItem key={admin.id} value={admin.id}>
                            {admin.firstName} {admin.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {renderField('salesManager', 'Sales Manager', formData.salesManager, (v) => setFormData({ ...formData, salesManager: v }))}
              </div>
            </TabsContent>

            {/* Tab 3: Professional Details */}
            <TabsContent value="professional" className="space-y-4 min-h-[420px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderField('currentCompany', 'Current Company', formData.currentCompany, (v) => setFormData({ ...formData, currentCompany: v }))}

                {renderField('totalWorkExperience', 'Total Work Experience', formData.totalWorkExperience, (v) => setFormData({ ...formData, totalWorkExperience: v }), {
                  placeholder: 'e.g., 5 years',
                })}

                {renderField('currentCompanyExperience', 'Current Company Experience', formData.currentCompanyExperience, (v) => setFormData({ ...formData, currentCompanyExperience: v }), {
                  placeholder: 'e.g., 2 years',
                })}

                {renderField('officialEmail', 'Official Email Id', formData.officialEmail, (v) => setFormData({ ...formData, officialEmail: v }), {
                  type: 'email',
                  placeholder: 'official@company.com',
                })}

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="companyAddress">Company Address</Label>
                  {isReadOnly ? (
                    <div className="p-2 bg-muted rounded-md text-sm">{formData.companyAddress || '-'}</div>
                  ) : (
                    <Textarea
                      id="companyAddress"
                      value={formData.companyAddress}
                      onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                      rows={3}
                      placeholder="Enter company address"
                    />
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Tab 4: Address */}
            <TabsContent value="address" className="space-y-4 min-h-[420px]">
              <div className="space-y-4">
                <div className="space-y-2">
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

                <div className="space-y-2">
                  <Label htmlFor="currentAddress">Current Address</Label>
                  {isReadOnly ? (
                    <div className="p-2 bg-muted rounded-md text-sm">{formData.currentAddress || '-'}</div>
                  ) : (
                    <Textarea
                      id="currentAddress"
                      value={formData.currentAddress}
                      onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })}
                      rows={3}
                      placeholder="Enter current residential address"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalAddress">Postal Address</Label>
                  {isReadOnly ? (
                    <div className="p-2 bg-muted rounded-md text-sm">{formData.postalAddress || '-'}</div>
                  ) : (
                    <Textarea
                      id="postalAddress"
                      value={formData.postalAddress}
                      onChange={(e) => setFormData({ ...formData, postalAddress: e.target.value })}
                      rows={3}
                      placeholder="Enter postal address (if different from current)"
                    />
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Tab 5: Reference & Nominee */}
            <TabsContent value="reference" className="space-y-6 min-h-[420px]">
              {/* References */}
              <div className="space-y-4">
                <h4 className="font-semibold text-primary">References</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Reference 1 */}
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                    <h5 className="font-medium text-foreground">Reference 1</h5>
                    <div className="grid grid-cols-1 gap-4">
                      {renderField('reference1Name', 'Name', formData.reference1Name, (v) => setFormData({ ...formData, reference1Name: v }))}
                      {renderField('reference1Mobile', 'Mobile Number', formData.reference1Mobile, (v) => setFormData({ ...formData, reference1Mobile: v }), { maxLength: 10 })}
                      {renderField('reference1Address', 'Address', formData.reference1Address, (v) => setFormData({ ...formData, reference1Address: v }))}
                    </div>
                  </div>

                  {/* Reference 2 */}
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                    <h5 className="font-medium text-foreground">Reference 2</h5>
                    <div className="grid grid-cols-1 gap-4">
                      {renderField('reference2Name', 'Name', formData.reference2Name, (v) => setFormData({ ...formData, reference2Name: v }))}
                      {renderField('reference2Mobile', 'Mobile Number', formData.reference2Mobile, (v) => setFormData({ ...formData, reference2Mobile: v }), { maxLength: 10 })}
                      {renderField('reference2Address', 'Address', formData.reference2Address, (v) => setFormData({ ...formData, reference2Address: v }))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Nominee */}
              <div className="space-y-4">
                <h4 className="font-semibold text-primary">Nominee Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {renderField('nomineeName', 'Nominee Name', formData.nomineeName, (v) => setFormData({ ...formData, nomineeName: v }))}

                  {renderField('nomineeRelation', 'Relation', formData.nomineeRelation, (v) => setFormData({ ...formData, nomineeRelation: v }), {
                    placeholder: 'e.g., Father, Mother, Spouse',
                  })}

                  <div className="space-y-2">
                    <Label htmlFor="nomineeDateOfBirth">Nominee DOB</Label>
                    {isReadOnly ? (
                      <div className="p-2 bg-muted rounded-md text-sm">
                        {formData.nomineeDateOfBirth ? format(formData.nomineeDateOfBirth, 'PPP') : '-'}
                      </div>
                    ) : (
                      <DatePicker
                        date={formData.nomineeDateOfBirth || undefined}
                        onDateChange={(date) => setFormData({ ...formData, nomineeDateOfBirth: date || null })}
                        placeholder="Select nominee date of birth"
                        fromYear={1950}
                        toYear={new Date().getFullYear()}
                      />
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab 6: Remarks */}
            <TabsContent value="remarks" className="space-y-4 min-h-[420px]">
              {/* PDF Download Button */}
              {customer?.pdfUrl && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const pdfUrl = `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${customer.pdfUrl}`;
                      window.open(pdfUrl, '_blank');
                    }}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Customer PDF
                  </Button>
                </div>
              )}

              {/* Loan Status */}
              <div className="space-y-4">
                <h4 className="font-semibold text-primary">Loan Status</h4>
                <div className="space-y-2">
                  <Label>Status</Label>
                  {isReadOnly ? (
                    <div className="p-2 bg-muted rounded-md text-sm capitalize">{formData.status}</div>
                  ) : (
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as LoanStatus })}
                    >
                      <SelectTrigger className="w-full md:w-1/3">
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
              {/* Existing Remarks - Visible to everyone */}
              {customer?.remarks && customer.remarks.length > 0 && (
                <div className="space-y-2">
                  <Label>Previous Remarks</Label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {customer.remarks.map((remark: any, index) => (
                      <div key={index} className="p-3 bg-muted/50 rounded-lg text-sm">
                        <p className="text-foreground">{remark.text || remark.remark}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          By {remark.addedBy || (remark.user ? `${remark.user.firstName} ${remark.user.lastName}` : 'Unknown')} on {format(new Date(remark.addedAt || remark.createdAt), 'PPp')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No remarks message */}
              {(!customer?.remarks || customer.remarks.length === 0) && mode !== 'add' && (
                <div className="p-4 bg-muted/30 rounded-lg text-center text-muted-foreground">
                  No remarks added yet.
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
                    rows={4}
                  />
                </div>
              )}

              {/* Message for connectors */}
              {!canAddRemark && !isReadOnly && (
                <div className="p-4 bg-muted/30 rounded-lg text-center text-muted-foreground">
                  Only admins and backoffice staff can add remarks.
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            {!isReadOnly && (
              <>
                {!isLastTab ? (
                  <Button type="button" onClick={(e) => handleNextTab(e)}>
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
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
              </>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
