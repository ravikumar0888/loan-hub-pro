import React, { useState } from 'react';
import { DSA, BankDetail, LoanType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Plus, Loader2, Briefcase, Search, Edit, Trash2, X, ChevronDown, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dsasApi, banksApi } from '@/lib/api';

export default function DSAPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDSA, setSelectedDSA] = useState<DSA | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [dsaName, setDsaName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [stateName, setStateName] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [bankDetails, setBankDetails] = useState<BankDetail[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch DSAs from backend
  const { data: dsaData, isLoading: isLoadingDSAs, error: queryError } = useQuery({
    queryKey: ['dsas'],
    queryFn: async () => {
      const response = await dsasApi.getDsas();
      return response.data;
    },
    refetchOnMount: true,
    staleTime: 0,
    retry: 2,
  });

  // Fetch banks for dropdown
  const { data: banksData } = useQuery({
    queryKey: ['banks'],
    queryFn: async () => {
      const response = await banksApi.getBanks();
      return response.data;
    },
    refetchOnMount: true,
    staleTime: 0,
    retry: 2,
  });

  const dsaList = dsaData || [];
  const banks = banksData || [];

  const filteredDSAs = dsaList.filter((dsa: DSA) =>
    dsa.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addBankDetail = () => {
    setBankDetails([
      ...bankDetails,
      {
        id: `${Date.now()}`,
        bankId: '',
        bankName: '',
        loanType: 'PL',
        payoutRatio: 0,
      },
    ]);
  };

  const removeBankDetail = (id: string) => {
    setBankDetails(bankDetails.filter((b) => b.id !== id));
  };

  const updateBankDetail = (id: string, field: keyof BankDetail, value: string | number) => {
    setBankDetails(
      bankDetails.map((b) => {
        if (b.id === id) {
          if (field === 'bankId') {
            const bank = banks.find((bank: any) => bank.id === value);
            return { ...b, bankId: value as string, bankName: bank?.name || '' };
          }
          return { ...b, [field]: value };
        }
        return b;
      })
    );
  };

  // Create DSA mutation
  const createDSAMutation = useMutation({
    mutationFn: async (data: any) => {
      return await dsasApi.createDsa(data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['dsas'] });
      setDsaName('');
      setCompanyName('');
      setAddress('');
      setCity('');
      setPinCode('');
      setEmail('');
      setGstin('');
      setStateName('');
      setStateCode('');
      setBankDetails([]);
      setErrors({});
      setIsDialogOpen(false);

      toast({
        title: 'Corporate DSA Added',
        description: `${response.data.name} has been added successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create DSA',
        variant: 'destructive',
      });
    },
  });

  // Update DSA mutation
  const updateDSAMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await dsasApi.updateDsa(id, data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['dsas'] });
      setDsaName('');
      setCompanyName('');
      setAddress('');
      setCity('');
      setPinCode('');
      setEmail('');
      setGstin('');
      setStateName('');
      setStateCode('');
      setBankDetails([]);
      setErrors({});
      setIsEditDialogOpen(false);
      setSelectedDSA(null);

      toast({
        title: 'DSA Updated',
        description: `${response.data.name} has been updated successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update DSA',
        variant: 'destructive',
      });
    },
  });

  // Delete DSA mutation
  const deleteDSAMutation = useMutation({
    mutationFn: async (id: string) => {
      return await dsasApi.deleteDsa(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dsas'] });
      toast({
        title: 'DSA Deleted',
        description: 'DSA has been successfully deleted.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete DSA',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!dsaName.trim()) newErrors.dsaName = 'DSA name is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const dsaData = {
      name: dsaName.trim(),
      companyName: companyName.trim() || null,
      address: address.trim() || null,
      city: city.trim() || null,
      pinCode: pinCode.trim() || null,
      email: email.trim() || null,
      gstin: gstin.trim() || null,
      stateName: stateName.trim() || null,
      stateCode: stateCode.trim() || null,
      bankDetails: bankDetails.map((bd) => ({
        bankId: bd.bankId,
        loanType: bd.loanType,
        payoutRatio: bd.payoutRatio,
      })),
    };

    createDSAMutation.mutate(dsaData);
  };

  const handleView = (dsa: DSA) => {
    setSelectedDSA(dsa);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (dsa: DSA) => {
    setSelectedDSA(dsa);
    setDsaName(dsa.name);
    setCompanyName((dsa as any).companyName || '');
    setAddress((dsa as any).address || '');
    setCity((dsa as any).city || '');
    setPinCode((dsa as any).pinCode || '');
    setEmail((dsa as any).email || '');
    setGstin((dsa as any).gstin || '');
    setStateName((dsa as any).stateName || '');
    setStateCode((dsa as any).stateCode || '');

    // Convert DSA bank details to editable format
    const details = dsa.bankDetails?.map(bd => ({
      id: bd.id || `${Date.now()}-${Math.random()}`,
      bankId: bd.bankId,
      bankName: bd.bankName || bd.bank?.name || '',
      loanType: bd.loanType,
      payoutRatio: bd.payoutRatio,
    })) || [];

    setBankDetails(details);
    setErrors({});
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!dsaName.trim()) newErrors.dsaName = 'DSA name is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!selectedDSA) return;

    const dsaData = {
      name: dsaName.trim(),
      companyName: companyName.trim() || null,
      address: address.trim() || null,
      city: city.trim() || null,
      pinCode: pinCode.trim() || null,
      email: email.trim() || null,
      gstin: gstin.trim() || null,
      stateName: stateName.trim() || null,
      stateCode: stateCode.trim() || null,
      bankDetails: bankDetails.map((bd) => ({
        bankId: bd.bankId,
        loanType: bd.loanType,
        payoutRatio: bd.payoutRatio,
      })),
    };

    updateDSAMutation.mutate({ id: selectedDSA.id, data: dsaData });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this DSA?')) {
      deleteDSAMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Corporate DSA Management</h2>
          <p className="text-muted-foreground">Manage Direct Selling Agent partnerships</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Corporate DSA
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
            <DialogHeader>
              <DialogTitle>Add Corporate DSA</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dsaName">DSA Name *</Label>
                  <Input
                    id="dsaName"
                    value={dsaName}
                    onChange={(e) => setDsaName(e.target.value)}
                    placeholder="Enter DSA name"
                    error={!!errors.dsaName}
                  />
                  {errors.dsaName && <p className="text-sm text-destructive">{errors.dsaName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN</Label>
                  <Input
                    id="gstin"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="Enter GSTIN"
                    maxLength={15}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter city"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pinCode">Pin Code</Label>
                  <Input
                    id="pinCode"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="Enter pin code"
                    maxLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stateName">State</Label>
                  <Input
                    id="stateName"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="Enter state name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stateCode">State Code</Label>
                  <Input
                    id="stateCode"
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    placeholder="Enter state code (e.g., 27)"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Bank Details</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addBankDetail}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Bank
                  </Button>
                </div>

                {bankDetails.length === 0 ? (
                  <div className="text-center py-6 bg-muted/50 rounded-lg">
                    <Briefcase className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No bank details added yet</p>
                  </div>
                ) : (
                  bankDetails.map((detail) => (
                    <div key={detail.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-muted/50 rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-xs">Bank</Label>
                        <Select
                          value={detail.bankId}
                          onValueChange={(value) => updateBankDetail(detail.id, 'bankId', value)}
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

                      <div className="space-y-1">
                        <Label className="text-xs">Loan Type</Label>
                        <Select
                          value={detail.loanType}
                          onValueChange={(value) => updateBankDetail(detail.id, 'loanType', value as LoanType)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border border-border">
                            <SelectItem value="PL">Personal Loan</SelectItem>
                            <SelectItem value="HL">Home Loan</SelectItem>
                            <SelectItem value="BL">Business Loan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Payout Ratio (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={detail.payoutRatio}
                          onChange={(e) => updateBankDetail(detail.id, 'payoutRatio', Number(e.target.value))}
                        />
                      </div>

                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBankDetail(detail.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setDsaName('');
                    setCompanyName('');
                    setAddress('');
                    setCity('');
                    setPinCode('');
                    setEmail('');
                    setGstin('');
                    setStateName('');
                    setStateCode('');
                    setBankDetails([]);
                    setErrors({});
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createDSAMutation.isPending}>
                  {createDSAMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save DSA'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl shadow-md overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search DSAs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoadingDSAs ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading DSAs...</p>
            </div>
          </div>
        ) : filteredDSAs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No DSAs found</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {filteredDSAs.map((dsa: DSA) => (
              <AccordionItem key={dsa.id} value={dsa.id} className="border-b border-border last:border-0">
                <AccordionTrigger className="px-6 py-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between flex-1 mr-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-foreground">{dsa.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {dsa.bankDetails?.length || 0} bank partnerships
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleView(dsa);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(dsa);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(dsa.id);
                        }}
                        disabled={deleteDSAMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  {!dsa.bankDetails || dsa.bankDetails.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No bank details configured
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Bank Name</TableHead>
                          <TableHead>Loan Type</TableHead>
                          <TableHead>Payout Ratio</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dsa.bankDetails.map((detail: any) => (
                          <TableRow key={detail.id}>
                            <TableCell className="font-medium">{detail.bankName || detail.bank?.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{detail.loanType}</Badge>
                            </TableCell>
                            <TableCell>{detail.payoutRatio}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* View DSA Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle>DSA Details</DialogTitle>
          </DialogHeader>
          {selectedDSA && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">DSA Name</Label>
                  <p className="text-foreground font-medium">{selectedDSA.name}</p>
                </div>
                {(selectedDSA as any).companyName && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Company Name</Label>
                    <p className="text-foreground">{(selectedDSA as any).companyName}</p>
                  </div>
                )}
                {(selectedDSA as any).email && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="text-foreground">{(selectedDSA as any).email}</p>
                  </div>
                )}
                {(selectedDSA as any).gstin && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">GSTIN</Label>
                    <p className="text-foreground">{(selectedDSA as any).gstin}</p>
                  </div>
                )}
                {(selectedDSA as any).address && (
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-muted-foreground">Address</Label>
                    <p className="text-foreground">
                      {(selectedDSA as any).address}
                      {(selectedDSA as any).city && `, ${(selectedDSA as any).city}`}
                      {(selectedDSA as any).pinCode && ` - ${(selectedDSA as any).pinCode}`}
                    </p>
                  </div>
                )}
                {(selectedDSA as any).stateName && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">State</Label>
                    <p className="text-foreground">
                      {(selectedDSA as any).stateName}
                      {(selectedDSA as any).stateCode && ` (Code: ${(selectedDSA as any).stateCode})`}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Bank Partnerships</Label>
                {!selectedDSA.bankDetails || selectedDSA.bankDetails.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No bank details configured</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Bank Name</TableHead>
                        <TableHead>Loan Type</TableHead>
                        <TableHead>Payout Ratio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedDSA.bankDetails.map((detail: any) => (
                        <TableRow key={detail.id}>
                          <TableCell className="font-medium">{detail.bankName || detail.bank?.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{detail.loanType}</Badge>
                          </TableCell>
                          <TableCell>{detail.payoutRatio}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit DSA Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setSelectedDSA(null);
          setDsaName('');
          setCompanyName('');
          setAddress('');
          setCity('');
          setPinCode('');
          setEmail('');
          setGstin('');
          setStateName('');
          setStateCode('');
          setBankDetails([]);
          setErrors({});
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle>Edit Corporate DSA</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-dsaName">DSA Name *</Label>
                <Input
                  id="edit-dsaName"
                  value={dsaName}
                  onChange={(e) => setDsaName(e.target.value)}
                  placeholder="Enter DSA name"
                  error={!!errors.dsaName}
                />
                {errors.dsaName && <p className="text-sm text-destructive">{errors.dsaName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-companyName">Company Name</Label>
                <Input
                  id="edit-companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-gstin">GSTIN</Label>
                <Input
                  id="edit-gstin"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="Enter GSTIN"
                  maxLength={15}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter city"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-pinCode">Pin Code</Label>
                <Input
                  id="edit-pinCode"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="Enter pin code"
                  maxLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-stateName">State</Label>
                <Input
                  id="edit-stateName"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="Enter state name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-stateCode">State Code</Label>
                <Input
                  id="edit-stateCode"
                  value={stateCode}
                  onChange={(e) => setStateCode(e.target.value)}
                  placeholder="Enter state code (e.g., 27)"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Bank Details</Label>
                <Button type="button" variant="outline" size="sm" onClick={addBankDetail}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Bank
                </Button>
              </div>

              {bankDetails.length === 0 ? (
                <div className="text-center py-6 bg-muted/50 rounded-lg">
                  <Briefcase className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No bank details added yet</p>
                </div>
              ) : (
                bankDetails.map((detail) => (
                  <div key={detail.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-xs">Bank</Label>
                      <Select
                        value={detail.bankId}
                        onValueChange={(value) => updateBankDetail(detail.id, 'bankId', value)}
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

                    <div className="space-y-1">
                      <Label className="text-xs">Loan Type</Label>
                      <Select
                        value={detail.loanType}
                        onValueChange={(value) => updateBankDetail(detail.id, 'loanType', value as LoanType)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border border-border">
                          <SelectItem value="PL">Personal Loan</SelectItem>
                          <SelectItem value="HL">Home Loan</SelectItem>
                          <SelectItem value="BL">Business Loan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Payout Ratio (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={detail.payoutRatio}
                        onChange={(e) => updateBankDetail(detail.id, 'payoutRatio', Number(e.target.value))}
                      />
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBankDetail(detail.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedDSA(null);
                  setDsaName('');
                  setCompanyName('');
                  setAddress('');
                  setCity('');
                  setPinCode('');
                  setEmail('');
                  setGstin('');
                  setStateName('');
                  setStateCode('');
                  setBankDetails([]);
                  setErrors({});
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateDSAMutation.isPending}>
                {updateDSAMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update DSA'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
