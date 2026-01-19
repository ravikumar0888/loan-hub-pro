import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dsaInvoiceApi, dsasApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Loader2, Plus, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { withAdminPasswordProtection } from '@/components/hoc/withAdminPasswordProtection';

function DsaInvoices() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedDsaId, setSelectedDsaId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Fetch all DSAs for dropdown
  const { data: dsasData } = useQuery({
    queryKey: ['dsas', 'all'],
    queryFn: async () => {
      const response = await dsasApi.getAllDsas();
      return response.data;
    },
  });

  // Fetch all invoices
  const { data: invoicesData, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['dsa-invoices'],
    queryFn: async () => {
      const response = await dsaInvoiceApi.getInvoices();
      return response.data;
    },
  });

  // Generate invoice mutation
  const generateInvoiceMutation = useMutation({
    mutationFn: async (data: { dsaId: string; month: number; year: number }) => {
      return await dsaInvoiceApi.generateInvoice(data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['dsa-invoices'] });
      setIsGenerateDialogOpen(false);
      setSelectedDsaId('');
      setSelectedMonth('');
      setSelectedYear('');

      toast({
        title: 'Invoice Generated',
        description: `Invoice ${response.data.invoiceNumber} has been created successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate invoice',
        variant: 'destructive',
      });
    },
  });

  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (id: string) => {
      return await dsaInvoiceApi.deleteInvoice(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dsa-invoices'] });
      toast({
        title: 'Invoice Deleted',
        description: 'Invoice has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete invoice',
        variant: 'destructive',
      });
    },
  });

  const dsas = dsasData || [];
  const invoices = invoicesData || [];

  const handleGenerateInvoice = () => {
    if (!selectedDsaId || !selectedMonth || !selectedYear) {
      toast({
        title: 'Validation Error',
        description: 'Please select DSA, month, and year',
        variant: 'destructive',
      });
      return;
    }

    generateInvoiceMutation.mutate({
      dsaId: selectedDsaId,
      month: parseInt(selectedMonth),
      year: parseInt(selectedYear),
    });
  };

  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsViewDialogOpen(true);
  };

  const handleDownloadPDF = (invoice: any) => {
    if (invoice.pdfUrl) {
      const pdfUrl = `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${invoice.pdfUrl}`;
      window.open(pdfUrl, '_blank');
    }
  };

  const handleDeleteInvoice = (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      deleteInvoiceMutation.mutate(id);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  };

  const getCurrentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => getCurrentYear - i);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">DSA Invoices</h2>
          <p className="text-muted-foreground">Generate and manage GST invoices for DSA commissions</p>
        </div>
        <Button onClick={() => setIsGenerateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Generate Invoice
        </Button>
      </div>

      {/* Generate Invoice Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle>Generate DSA Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="dsa">Select DSA *</Label>
              <Select value={selectedDsaId} onValueChange={setSelectedDsaId}>
                <SelectTrigger id="dsa">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="month">Month *</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger id="month">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <SelectItem key={month} value={month.toString()}>
                        {getMonthName(month)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year *</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger id="year">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border">
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsGenerateDialogOpen(false);
                  setSelectedDsaId('');
                  setSelectedMonth('');
                  setSelectedYear('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateInvoice}
                disabled={generateInvoiceMutation.isPending}
              >
                {generateInvoiceMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Invoice Number</Label>
                  <p className="font-medium">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Invoice Date</Label>
                  <p className="font-medium">{format(new Date(selectedInvoice.invoiceDate), 'dd MMM yyyy')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">DSA Name</Label>
                  <p className="font-medium">{selectedInvoice.dsa?.name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Period</Label>
                  <p className="font-medium">
                    {getMonthName(selectedInvoice.period_month)} {selectedInvoice.period_year}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Taxable Amount</Label>
                <p className="text-lg font-bold">{formatCurrency(Number(selectedInvoice.taxableAmount))}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">CGST ({Number(selectedInvoice.cgstRate)}%)</Label>
                  <p className="font-medium">{formatCurrency(Number(selectedInvoice.cgstAmount))}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">SGST/UTGST ({Number(selectedInvoice.sgstRate)}%)</Label>
                  <p className="font-medium">{formatCurrency(Number(selectedInvoice.sgstAmount))}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Total Amount</Label>
                <p className="text-2xl font-bold text-primary">{formatCurrency(Number(selectedInvoice.totalAmount))}</p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                {selectedInvoice.pdfUrl && (
                  <Button onClick={() => handleDownloadPDF(selectedInvoice)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Invoices</CardTitle>
          <CardDescription>View and manage all DSA invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingInvoices ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No invoices generated yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>DSA Name</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Invoice Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice: any) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.dsa?.name}</TableCell>
                    <TableCell>
                      {getMonthName(invoice.period_month)} {invoice.period_year}
                    </TableCell>
                    <TableCell>{format(new Date(invoice.invoiceDate), 'dd MMM yyyy')}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(invoice.totalAmount))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === 'issued' ? 'default' : 'secondary'}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewInvoice(invoice)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {invoice.pdfUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadPDF(invoice)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          disabled={deleteInvoiceMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default withAdminPasswordProtection(DsaInvoices, 'dsa-invoices', 'DSA Invoices');
