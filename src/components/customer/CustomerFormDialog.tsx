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
import { Loader2, Download, ChevronRight, Copy } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Customer, LoanType, LoanStatus, HomeType, CaseType, MaritalStatus, EmploymentType } from '@/types';
import { format } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi, banksApi, dsasApi, customersApi } from '@/lib/api';
import { FileText } from 'lucide-react';

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  mode: 'add' | 'edit' | 'view';
  onSave: (customer: Customer) => void;
  onDuplicate?: (prefillData: any) => void;
  prefillData?: any;
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
  employmentType: '' as EmploymentType | '',
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
  status: '' as LoanStatus | '',
  newRemark: '',
  pdfUrl: '',
};

export default function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  mode,
  onSave,
  onDuplicate,
  prefillData,
}: CustomerFormDialogProps) {
  const { role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [formData, setFormData] = useState(emptyFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('personal');
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);

  // Fetch connectors from backend
  const { data: connectorsData } = useQuery({
    queryKey: ['connectors'],
    queryFn: async () => {
      const response = await usersApi.getConnectors({ limit: 10000 });
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

  // Filter connectors based on selected Lead Owner (createdBy)
  const filteredConnectors = React.useMemo(() => {
    if (!formData.leadOwner) {
      return []; // No channel partners until Lead Owner is selected
    }
    return connectors.filter((c: any) => c.createdBy === formData.leadOwner);
  }, [formData.leadOwner, connectors]);

  // Filter banks based on selected DSA's bank details
  const filteredBanks = React.useMemo(() => {
    if (!formData.dsaId) {
      return []; // No banks until DSA is selected
    }
    const selectedDsa = dsas.find((d: any) => d.id === formData.dsaId);
    if (!selectedDsa?.bankDetails || selectedDsa.bankDetails.length === 0) {
      return banks; // Show all banks if DSA has no bank details configured
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
        employmentType: (customer as any).employmentType || '',
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
      if (prefillData) {
        // Duplicate mode: pre-fill personal/professional/address/reference, blank loan
        setFormData({
          ...emptyFormData,
          applicationDate: new Date(),
          // Personal
          name: prefillData.name || '',
          panNo: prefillData.panNo || '',
          dateOfBirth: prefillData.dateOfBirth ? new Date(prefillData.dateOfBirth) : null,
          motherName: prefillData.motherName || '',
          spouseName: prefillData.spouseName || '',
          mobile: prefillData.mobile || '',
          personalEmail: prefillData.personalEmail || '',
          qualification: prefillData.qualification || '',
          maritalStatus: prefillData.maritalStatus || '',
          // Professional
          employmentType: prefillData.employmentType || '',
          currentCompany: prefillData.currentCompany || '',
          totalWorkExperience: prefillData.totalWorkExperience || '',
          currentCompanyExperience: prefillData.currentCompanyExperience || '',
          officialEmail: prefillData.officialEmail || '',
          companyAddress: prefillData.companyAddress || '',
          // Address
          homeType: prefillData.homeType || 'own',
          currentAddress: prefillData.currentAddress || '',
          postalAddress: prefillData.postalAddress || '',
          // Reference & Nominee
          reference1Name: prefillData.reference1Name || '',
          reference1Mobile: prefillData.reference1Mobile || '',
          reference1Address: prefillData.reference1Address || '',
          reference2Name: prefillData.reference2Name || '',
          reference2Mobile: prefillData.reference2Mobile || '',
          reference2Address: prefillData.reference2Address || '',
          nomineeName: prefillData.nomineeName || '',
          nomineeRelation: prefillData.nomineeRelation || '',
          nomineeDateOfBirth: prefillData.nomineeDateOfBirth ? new Date(prefillData.nomineeDateOfBirth) : null,
        });
        setActiveTab('loan');
      } else {
        setFormData(emptyFormData);
        setActiveTab('personal');
      }
    }
    setErrors({});
    if (!prefillData) setActiveTab('personal');
  }, [customer, mode, open, prefillData]);

  // Validation for each tab
  const validateTab = (tab: string): boolean => {
    const newErrors: Record<string, string> = {};

    switch (tab) {
      case 'personal':
        if (!formData.name.trim()) newErrors.name = 'Client name is required';
        if (!formData.panNo.trim()) newErrors.panNo = 'PAN number is required';
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
        if (!formData.mobile.match(/^\d{10}$/)) newErrors.mobile = 'Valid 10-digit mobile required';
        if (!formData.personalEmail.trim()) newErrors.personalEmail = 'Personal email is required';
        break;
      case 'loan':
        if (!formData.loanAmount || Number(formData.loanAmount) <= 0) newErrors.loanAmount = 'Valid loan amount required';
        if (!formData.tenure.trim()) newErrors.tenure = 'Tenure is required';
        if (!formData.location.trim()) newErrors.location = 'Location is required';
        if (!formData.leadOwner) newErrors.leadOwner = 'Lead Owner is required';
        if (!formData.connectorId) newErrors.connectorId = 'Channel Partner is required';
        if (showDSAField && !formData.dsaId) newErrors.dsaId = 'DSA is required';
        if (!formData.bankId) newErrors.bankId = 'Bank is required';
        if (!formData.salesManager.trim()) newErrors.salesManager = 'Sales Manager is required';
        // Validate payout config for channel partner + bank
        if (formData.connectorId && formData.bankId) {
          const selectedConnector = connectors.find((c: any) => c.id === formData.connectorId);
          const hasConfig = selectedConnector?.userBankDetails?.some(
            (bd: any) => bd.bankId === formData.bankId && bd.loanType === formData.loanType
          );
          if (!hasConfig) {
            newErrors.bankPayoutConfig = 'Please configure bank for selected channel partner';
          }
        }
        break;
      case 'professional':
        // No mandatory fields
        break;
      case 'address':
        if (!formData.currentAddress.trim()) newErrors.currentAddress = 'Current address is required';
        if (!formData.postalAddress.trim()) newErrors.postalAddress = 'Postal address is required';
        break;
      case 'reference':
        // No mandatory fields
        break;
      case 'remarks':
        if (mode === 'add' && !formData.status) newErrors.status = 'Status is required';
        if (mode === 'add' && !formData.newRemark.trim()) newErrors.newRemark = 'Remark is required';
        break;
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validateAllTabs = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Personal tab
    if (!formData.name.trim()) newErrors.name = 'Client name is required';
    if (!formData.panNo.trim()) newErrors.panNo = 'PAN number is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.mobile.match(/^\d{10}$/)) newErrors.mobile = 'Valid 10-digit mobile required';
    if (!formData.personalEmail.trim()) newErrors.personalEmail = 'Personal email is required';

    // Loan tab
    if (!formData.loanAmount || Number(formData.loanAmount) <= 0) newErrors.loanAmount = 'Valid loan amount required';
    if (!formData.tenure.trim()) newErrors.tenure = 'Tenure is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.leadOwner) newErrors.leadOwner = 'Lead Owner is required';
    if (!formData.connectorId) newErrors.connectorId = 'Channel Partner is required';
    if (showDSAField && !formData.dsaId) newErrors.dsaId = 'DSA is required';
    if (!formData.bankId) newErrors.bankId = 'Bank is required';
    if (!formData.salesManager.trim()) newErrors.salesManager = 'Sales Manager is required';
    // Validate payout config for channel partner + bank
    if (formData.connectorId && formData.bankId) {
      const selectedConnector = connectors.find((c: any) => c.id === formData.connectorId);
      const hasConfig = selectedConnector?.userBankDetails?.some(
        (bd: any) => bd.bankId === formData.bankId && bd.loanType === formData.loanType
      );
      if (!hasConfig) {
        newErrors.bankPayoutConfig = 'Please configure bank for selected channel partner';
      }
    }

    // Address tab
    if (!formData.currentAddress.trim()) newErrors.currentAddress = 'Current address is required';
    if (!formData.postalAddress.trim()) newErrors.postalAddress = 'Postal address is required';

    // Remarks tab
    if (mode === 'add' && !formData.status) newErrors.status = 'Status is required';
    if (mode === 'add' && !formData.newRemark.trim()) newErrors.newRemark = 'Remark is required';

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
        employmentType: formData.employmentType || undefined,
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

  const canDuplicate = mode === 'edit' && customer?.id && (role === 'superadmin' || role === 'admin' || role === 'backoffice');

  const handleDuplicateConfirm = () => {
    if (!customer) return;
    // Build pre-filled data: copy personal, professional, address, reference — blank loan fields
    const prefillData = {
      // Personal (copied)
      name: customer.name || '',
      panNo: customer.panNo || '',
      dateOfBirth: customer.dateOfBirth || null,
      motherName: customer.motherName || '',
      spouseName: customer.spouseName || '',
      mobile: customer.mobile || '',
      personalEmail: customer.personalEmail || '',
      qualification: (customer as any).qualification || '',
      maritalStatus: (customer as any).maritalStatus || '',
      // Professional (copied)
      employmentType: (customer as any).employmentType || '',
      currentCompany: customer.currentCompany || '',
      totalWorkExperience: customer.totalWorkExperience || '',
      currentCompanyExperience: customer.currentCompanyExperience || '',
      officialEmail: customer.officialEmail || '',
      companyAddress: (customer as any).companyAddress || '',
      // Address (copied)
      homeType: customer.homeType || 'own',
      currentAddress: customer.currentAddress || '',
      postalAddress: customer.postalAddress || '',
      // Reference & Nominee (copied)
      reference1Name: customer.reference1?.name || '',
      reference1Mobile: customer.reference1?.mobile || '',
      reference1Address: customer.reference1?.address || '',
      reference2Name: customer.reference2?.name || '',
      reference2Mobile: customer.reference2?.mobile || '',
      reference2Address: customer.reference2?.address || '',
      nomineeName: customer.nomineeName || '',
      nomineeRelation: customer.nomineeRelation || '',
      nomineeDateOfBirth: customer.nomineeDateOfBirth || null,
    };
    setShowDuplicateConfirm(false);
    if (onDuplicate) {
      onDuplicate(prefillData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[100vw] sm:max-w-[95vw] md:max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-hidden bg-card p-0 rounded-none sm:rounded-lg flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col h-full">
          {/* Fixed Header: Title + Tabs */}
          <div className="flex-shrink-0 bg-card px-3 sm:px-6 pt-3 sm:pt-6 pb-3 sm:pb-4 border-b border-border">
            <DialogHeader>
              <DialogTitle>
                {mode === 'add' ? 'Add New Lead' : mode === 'edit' ? 'Edit Lead' : 'View Lead'}
              </DialogTitle>
            </DialogHeader>
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mt-3 sm:mt-4 gap-1 sm:gap-0 h-auto sm:h-10 p-1">
              <TabsTrigger value="personal" className="text-xs sm:text-sm px-1 sm:px-3 py-2 sm:py-1.5">Personal</TabsTrigger>
              <TabsTrigger value="loan" className="text-xs sm:text-sm px-1 sm:px-3 py-2 sm:py-1.5">Loan</TabsTrigger>
              <TabsTrigger value="professional" className="text-xs sm:text-sm px-1 sm:px-3 py-2 sm:py-1.5">Professional</TabsTrigger>
              <TabsTrigger value="address" className="text-xs sm:text-sm px-1 sm:px-3 py-2 sm:py-1.5">Address</TabsTrigger>
              <TabsTrigger value="reference" className="text-xs sm:text-sm px-1 sm:px-3 py-2 sm:py-1.5">Reference</TabsTrigger>
              <TabsTrigger value="remarks" className="text-xs sm:text-sm px-1 sm:px-3 py-2 sm:py-1.5">Remarks</TabsTrigger>
            </TabsList>
          </div>

          {/* Scrollable Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-6 pt-4 pb-3 sm:pb-6">

            {/* Tab 1: Personal Details */}
            <TabsContent value="personal" className="space-y-4 min-h-[300px] sm:min-h-[420px]">
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
                  required: true,
                  placeholder: 'ABCDE1234F',
                  maxLength: 10,
                  error: errors.panNo,
                })}

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">DOB *</Label>
                  {isReadOnly ? (
                    <div className="p-2 bg-muted rounded-md text-sm">
                      {formData.dateOfBirth ? format(formData.dateOfBirth, 'PPP') : '-'}
                    </div>
                  ) : (
                    <div className={errors.dateOfBirth ? 'ring-1 ring-destructive rounded-md' : ''}>
                      <DatePicker
                        date={formData.dateOfBirth || undefined}
                        onDateChange={(date) => { setFormData({ ...formData, dateOfBirth: date || null }); setErrors(prev => ({ ...prev, dateOfBirth: '' })); }}
                        placeholder="Select date of birth"
                        fromYear={1950}
                        toYear={new Date().getFullYear()}
                      />
                    </div>
                  )}
                  {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth}</p>}
                </div>

                {renderField('motherName', 'Mother Name', formData.motherName, (v) => setFormData({ ...formData, motherName: v }))}

                {renderField('spouseName', 'Spouse Name', formData.spouseName, (v) => setFormData({ ...formData, spouseName: v }))}

                {/* Mobile Number - masked for backoffice after disbursement */}
                {role === 'backoffice' && customer?.status === 'disbursed' ? (
                  <div className="space-y-2">
                    <Label>Mobile Number *</Label>
                    <div className="p-2 bg-muted rounded-md text-sm tracking-wider">
                      {'X'.repeat(Math.max(0, (formData.mobile || '').length - 4)) + (formData.mobile || '').slice(-4)}
                    </div>
                  </div>
                ) : (
                  renderField('mobile', 'Mobile Number', formData.mobile, (v) => setFormData({ ...formData, mobile: v }), {
                    required: true,
                    placeholder: '10 digit mobile',
                    maxLength: 10,
                    error: errors.mobile,
                  })
                )}

                {renderField('personalEmail', 'Personal Email Id', formData.personalEmail, (v) => setFormData({ ...formData, personalEmail: v }), {
                  required: true,
                  placeholder: 'personal@example.com',
                  type: 'email',
                  error: errors.personalEmail,
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
            <TabsContent value="loan" className="space-y-4 min-h-[300px] sm:min-h-[420px]">
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
                      className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4"
                    >
                      <div className="flex items-center space-x-2 p-2 sm:p-0 rounded-md hover:bg-muted/50 sm:hover:bg-transparent">
                        <RadioGroupItem value="PL" id="pl" />
                        <Label htmlFor="pl" className="cursor-pointer text-sm sm:text-sm">Personal Loan (PL)</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-2 sm:p-0 rounded-md hover:bg-muted/50 sm:hover:bg-transparent">
                        <RadioGroupItem value="HL" id="hl" />
                        <Label htmlFor="hl" className="cursor-pointer text-sm sm:text-sm">Home Loan (HL)</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-2 sm:p-0 rounded-md hover:bg-muted/50 sm:hover:bg-transparent">
                        <RadioGroupItem value="BL" id="bl" />
                        <Label htmlFor="bl" className="cursor-pointer text-sm sm:text-sm">Business Loan (BL)</Label>
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
                      className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4"
                    >
                      <div className="flex items-center space-x-2 p-2 sm:p-0 rounded-md hover:bg-muted/50 sm:hover:bg-transparent">
                        <RadioGroupItem value="fresh" id="fresh" />
                        <Label htmlFor="fresh" className="cursor-pointer text-sm">Fresh</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-2 sm:p-0 rounded-md hover:bg-muted/50 sm:hover:bg-transparent">
                        <RadioGroupItem value="bt" id="bt" />
                        <Label htmlFor="bt" className="cursor-pointer text-sm">BT</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-2 sm:p-0 rounded-md hover:bg-muted/50 sm:hover:bg-transparent">
                        <RadioGroupItem value="bt_topup" id="bt_topup" />
                        <Label htmlFor="bt_topup" className="cursor-pointer text-sm">BT-TopUp</Label>
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
                  required: true,
                  placeholder: 'e.g., 12 months, 5 years',
                  error: errors.tenure,
                })}

                {renderField('location', 'Location', formData.location, (v) => setFormData({ ...formData, location: v }), {
                  required: true,
                  error: errors.location,
                })}

                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                  <div className="flex items-center space-x-2 p-2 sm:p-0 rounded-md">
                    <input
                      type="checkbox"
                      id="hasSubvention"
                      checked={formData.hasSubvention}
                      onChange={(e) => setFormData({ ...formData, hasSubvention: e.target.checked, subventionAmount: e.target.checked ? formData.subventionAmount : '' })}
                      disabled={isReadOnly}
                      className="w-5 h-5 sm:w-4 sm:h-4 border border-border rounded flex-shrink-0"
                    />
                    <Label htmlFor="hasSubvention" className="cursor-pointer text-sm">
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
                        <>₹{new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(calculatedPayout)}</>
                      ) : (
                        <span className="text-xs">Select Channel Partner, Bank & Loan Type to calculate</span>
                      )}
                    </div>
                    {calculatedPayout !== null && formData.hasSubvention && Number(formData.subventionAmount) > 0 && (
                      <p className="text-xs text-muted-foreground">
                        (After ₹{new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(formData.subventionAmount))} subvention deduction)
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Lead Owner *</Label>
                  {isReadOnly ? (
                    <div className="p-2 bg-muted rounded-md text-sm">
                      {admins.find((a: any) => a.id === formData.leadOwner)
                        ? `${admins.find((a: any) => a.id === formData.leadOwner)!.firstName} ${admins.find((a: any) => a.id === formData.leadOwner)!.lastName}`
                        : '-'}
                    </div>
                  ) : (
                    <Select
                      value={formData.leadOwner}
                      onValueChange={(value) => { setFormData({ ...formData, leadOwner: value, connectorId: '', bankId: '' }); setErrors(prev => ({ ...prev, leadOwner: '', connectorId: '', bankId: '' })); }}
                    >
                      <SelectTrigger className={errors.leadOwner ? 'border-destructive' : ''}>
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
                  {errors.leadOwner && <p className="text-sm text-destructive">{errors.leadOwner}</p>}
                </div>

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
                      value={formData.connectorId || undefined}
                      onValueChange={(value) => { setFormData({ ...formData, connectorId: value, bankId: '' }); setErrors(prev => ({ ...prev, connectorId: '', bankId: '', bankPayoutConfig: '' })); }}
                      disabled={!formData.leadOwner}
                    >
                      <SelectTrigger className={errors.connectorId ? 'border-destructive' : ''}>
                        <SelectValue placeholder={formData.leadOwner ? "Select channel partner" : "Select Lead Owner first"} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border border-border">
                        {filteredConnectors.map((connector: any) => (
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
                    <Label>DSA *</Label>
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
                          setErrors(prev => ({ ...prev, dsaId: '' }));
                        }}
                      >
                        <SelectTrigger className={errors.dsaId ? 'border-destructive' : ''}>
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
                    {errors.dsaId && <p className="text-sm text-destructive">{errors.dsaId}</p>}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Bank Name *</Label>
                  {isReadOnly ? (
                    <div className="p-2 bg-muted rounded-md text-sm">
                      {banks.find((b: any) => b.id === formData.bankId)?.name || '-'}
                    </div>
                  ) : (
                    <Select
                      value={formData.bankId || undefined}
                      onValueChange={(value) => {
                        setFormData({ ...formData, bankId: value });
                        setErrors(prev => ({ ...prev, bankId: '', bankPayoutConfig: '' }));
                        // Validate payout ratio config for selected channel partner + bank + loan type
                        if (formData.connectorId && value) {
                          const selectedConnector = connectors.find((c: any) => c.id === formData.connectorId);
                          const hasConfig = selectedConnector?.userBankDetails?.some(
                            (bd: any) => bd.bankId === value && bd.loanType === formData.loanType
                          );
                          if (!hasConfig) {
                            setErrors(prev => ({ ...prev, bankPayoutConfig: 'Please configure bank for selected channel partner' }));
                          }
                        }
                      }}
                      disabled={!formData.dsaId}
                    >
                      <SelectTrigger className={(errors.bankId || errors.bankPayoutConfig) ? 'border-destructive' : ''}>
                        <SelectValue placeholder={formData.dsaId ? "Select bank" : "Select DSA first"} />
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
                  {errors.bankId && <p className="text-sm text-destructive">{errors.bankId}</p>}
                  {errors.bankPayoutConfig && <p className="text-sm text-destructive">{errors.bankPayoutConfig}</p>}
                </div>

                {renderField('salesManager', 'Sales Manager', formData.salesManager, (v) => setFormData({ ...formData, salesManager: v }), {
                  required: true,
                  error: errors.salesManager,
                })}
              </div>
            </TabsContent>

            {/* Tab 3: Professional Details */}
            <TabsContent value="professional" className="space-y-4 min-h-[300px] sm:min-h-[420px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Employment Type</Label>
                  {isReadOnly ? (
                    <div className="p-2 bg-muted rounded-md text-sm capitalize">
                      {formData.employmentType === 'salaried' ? 'Salaried' :
                        formData.employmentType === 'self_employed' ? 'Self Employed' :
                          formData.employmentType === 'professional' ? 'Professional' : '-'}
                    </div>
                  ) : (
                    <RadioGroup
                      value={formData.employmentType}
                      onValueChange={(value) => setFormData({ ...formData, employmentType: value as EmploymentType })}
                      className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4"
                    >
                      <div className="flex items-center space-x-2 p-2 sm:p-0 rounded-md hover:bg-muted/50 sm:hover:bg-transparent">
                        <RadioGroupItem value="salaried" id="salaried" />
                        <Label htmlFor="salaried" className="cursor-pointer text-sm">Salaried</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-2 sm:p-0 rounded-md hover:bg-muted/50 sm:hover:bg-transparent">
                        <RadioGroupItem value="self_employed" id="self_employed" />
                        <Label htmlFor="self_employed" className="cursor-pointer text-sm">Self Employed</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-2 sm:p-0 rounded-md hover:bg-muted/50 sm:hover:bg-transparent">
                        <RadioGroupItem value="professional" id="professional" />
                        <Label htmlFor="professional" className="cursor-pointer text-sm">Professional</Label>
                      </div>
                    </RadioGroup>
                  )}
                </div>

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
            <TabsContent value="address" className="space-y-4 min-h-[300px] sm:min-h-[420px]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Home Type</Label>
                  {isReadOnly ? (
                    <div className="p-2 bg-muted rounded-md text-sm capitalize">{formData.homeType.replace('-', ' ')}</div>
                  ) : (
                    <RadioGroup
                      value={formData.homeType}
                      onValueChange={(value) => setFormData({ ...formData, homeType: value as HomeType })}
                      className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4"
                    >
                      <div className="flex items-center space-x-2 p-2 sm:p-0 rounded-md hover:bg-muted/50 sm:hover:bg-transparent">
                        <RadioGroupItem value="own" id="own" />
                        <Label htmlFor="own" className="cursor-pointer text-sm">Own House</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-2 sm:p-0 rounded-md hover:bg-muted/50 sm:hover:bg-transparent">
                        <RadioGroupItem value="rental" id="rental" />
                        <Label htmlFor="rental" className="cursor-pointer text-sm">Rental</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-2 sm:p-0 rounded-md hover:bg-muted/50 sm:hover:bg-transparent">
                        <RadioGroupItem value="self-occupied" id="self-occupied" />
                        <Label htmlFor="self-occupied" className="cursor-pointer text-sm">Self-Occupied</Label>
                      </div>
                    </RadioGroup>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentAddress">Current Address *</Label>
                  {isReadOnly ? (
                    <div className="p-2 bg-muted rounded-md text-sm">{formData.currentAddress || '-'}</div>
                  ) : (
                    <Textarea
                      id="currentAddress"
                      value={formData.currentAddress}
                      onChange={(e) => { setFormData({ ...formData, currentAddress: e.target.value }); setErrors(prev => ({ ...prev, currentAddress: '' })); }}
                      rows={3}
                      placeholder="Enter current residential address"
                      className={errors.currentAddress ? 'border-destructive' : ''}
                    />
                  )}
                  {errors.currentAddress && <p className="text-sm text-destructive">{errors.currentAddress}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalAddress">Postal Address *</Label>
                  {isReadOnly ? (
                    <div className="p-2 bg-muted rounded-md text-sm">{formData.postalAddress || '-'}</div>
                  ) : (
                    <Textarea
                      id="postalAddress"
                      value={formData.postalAddress}
                      onChange={(e) => { setFormData({ ...formData, postalAddress: e.target.value }); setErrors(prev => ({ ...prev, postalAddress: '' })); }}
                      rows={3}
                      placeholder="Enter postal address (if different from current)"
                      className={errors.postalAddress ? 'border-destructive' : ''}
                    />
                  )}
                  {errors.postalAddress && <p className="text-sm text-destructive">{errors.postalAddress}</p>}
                </div>
              </div>
            </TabsContent>

            {/* Tab 5: Reference & Nominee */}
            <TabsContent value="reference" className="space-y-6 min-h-[300px] sm:min-h-[420px]">
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
            <TabsContent value="remarks" className="space-y-4 min-h-[300px] sm:min-h-[420px]">
              {/* PDF Download/Generate Button */}
              <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                {customer?.pdfUrl ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Construct proper PDF URL
                      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                      let baseUrl = apiUrl.replace(/\/api\/?$/, '');
                      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
                        baseUrl = `https://${baseUrl}`;
                      }
                      const pdfPath = customer.pdfUrl?.startsWith('/pdfs/')
                        ? customer.pdfUrl
                        : `/pdfs/${customer.pdfUrl?.split('/pdfs/').pop() || ''}`;
                      const pdfUrl = `${baseUrl}${pdfPath}`;
                      window.open(pdfUrl, '_blank');
                    }}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Customer PDF
                  </Button>
                ) : customer?.id ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isGeneratingPDF}
                    onClick={async () => {
                      if (!customer?.id) return;
                      setIsGeneratingPDF(true);
                      try {
                        const response = await customersApi.generatePDF(customer.id);
                        if (response.success && response.data?.pdfUrl) {
                          toast({
                            title: 'PDF Generated',
                            description: 'Customer PDF has been generated successfully.',
                          });
                          // Refresh customer data to get new pdfUrl
                          queryClient.invalidateQueries({ queryKey: ['customers'] });
                          // Open the PDF
                          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                          let baseUrl = apiUrl.replace(/\/api\/?$/, '');
                          if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
                            baseUrl = `https://${baseUrl}`;
                          }
                          window.open(`${baseUrl}${response.data.pdfUrl}`, '_blank');
                        }
                      } catch (error: any) {
                        toast({
                          title: 'Error',
                          description: error.message || 'Failed to generate PDF',
                          variant: 'destructive',
                        });
                      } finally {
                        setIsGeneratingPDF(false);
                      }
                    }}
                    className="gap-2"
                  >
                    {isGeneratingPDF ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    {isGeneratingPDF ? 'Generating...' : 'Generate PDF'}
                  </Button>
                ) : null}
              </div>

              {/* Duplicate Entry Checkbox */}
              {canDuplicate && (
                <div className="flex items-center space-x-2 p-3 sm:p-3 bg-muted/30 rounded-lg border border-border">
                  <input
                    type="checkbox"
                    id="duplicateEntry"
                    checked={false}
                    onChange={() => setShowDuplicateConfirm(true)}
                    className="w-5 h-5 sm:w-4 sm:h-4 border border-border rounded flex-shrink-0"
                  />
                  <Label htmlFor="duplicateEntry" className="cursor-pointer text-sm flex items-center gap-2">
                    <Copy className="w-4 h-4" />
                    Do you want Duplicate entry?
                  </Label>
                </div>
              )}

              {/* Loan Status */}
              <div className="space-y-4">
                <h4 className="font-semibold text-primary">Loan Status</h4>
                <div className="space-y-2">
                  <Label>Status {mode === 'add' ? '*' : ''}</Label>
                  {/* Status is read-only if:
                      1. View mode OR
                      2. Backoffice user AND status is already disbursed */}
                  {isReadOnly || (role === 'backoffice' && customer?.status === 'disbursed') ? (
                    <div className="p-2 bg-muted rounded-md text-sm capitalize">{formData.status}</div>
                  ) : (
                    <Select
                      value={formData.status || undefined}
                      onValueChange={(value) => { setFormData({ ...formData, status: value as LoanStatus }); setErrors(prev => ({ ...prev, status: '' })); }}
                    >
                      <SelectTrigger className={`w-full md:w-1/3 ${errors.status ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Select" />
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
                  {errors.status && <p className="text-sm text-destructive">{errors.status}</p>}
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
                          By {remark.addedBy || (remark.users ? `${remark.users.firstName} ${remark.users.lastName}` : 'Unknown')} on {format(new Date(remark.addedAt || remark.createdAt), 'PPp')}
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
                  <Label htmlFor="newRemark">Add New Remark {mode === 'add' ? '*' : ''}</Label>
                  <Textarea
                    id="newRemark"
                    value={formData.newRemark}
                    onChange={(e) => { setFormData({ ...formData, newRemark: e.target.value }); setErrors(prev => ({ ...prev, newRemark: '' })); }}
                    placeholder="Add a comment or note..."
                    rows={4}
                    className={errors.newRemark ? 'border-destructive' : ''}
                  />
                  {errors.newRemark && <p className="text-sm text-destructive">{errors.newRemark}</p>}
                </div>
              )}

              {/* Message for connectors */}
              {!canAddRemark && !isReadOnly && (
                <div className="p-4 bg-muted/30 rounded-lg text-center text-muted-foreground">
                  Only admins and backoffice staff can add remarks.
                </div>
              )}
            </TabsContent>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-border mt-4 sm:mt-6">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => onOpenChange(false)}
              >
                {isReadOnly ? 'Close' : 'Cancel'}
              </Button>
              {!isReadOnly && (
                <>
                  {!isLastTab ? (
                    <Button type="button" className="w-full sm:w-auto" onClick={(e) => handleNextTab(e)}>
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
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
        </Tabs>
      </DialogContent>

      {/* Duplicate Confirmation Dialog */}
      <AlertDialog open={showDuplicateConfirm} onOpenChange={setShowDuplicateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Duplicate Entry</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a duplicate entry of <strong>{customer?.name}</strong> with the current date.
              The Loan Details will be blank and you will need to fill them in.
              The original entry will remain unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDuplicateConfirm}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
