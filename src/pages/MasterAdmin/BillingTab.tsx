import { useState } from 'react';
import { useBilling } from '@/contexts/BillingContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, FileText, Download, CheckCircle, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { InvoiceStatus } from '@/types';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { invoicesApi } from '@/lib/api';

export default function BillingTab() {
  const { invoices, createInvoice, updateInvoiceStatus, refetch } = useBilling();
  const { organizations, getPlanByTier } = useOrganization();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [billingPeriodDays, setBillingPeriodDays] = useState(30);

  const handleCreateInvoice = async () => {
    const org = organizations.find(o => o.id === selectedOrgId);
    if (!org) {
      toast.error('Please select an organization');
      return;
    }

    const plan = getPlanByTier(org.pricingTier);
    if (!plan) {
      toast.error('Pricing plan not found');
      return;
    }

    // Backend will calculate the amount based on organization's pricing tier
    const today = new Date();
    const billingPeriodStart = today;
    const billingPeriodEnd = addDays(today, billingPeriodDays);
    const dueDate = addDays(today, 15);

    try {
      await createInvoice({
        organizationId: org.id,
        billingPeriodStart: billingPeriodStart.toISOString(),
        billingPeriodEnd: billingPeriodEnd.toISOString(),
        dueDate: dueDate.toISOString(),
      });

      toast.success('Invoice created successfully');
      setIsDialogOpen(false);
      setSelectedOrgId('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create invoice');
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      await updateInvoiceStatus(invoiceId, 'paid');
      toast.success('Invoice marked as paid');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update invoice status');
    }
  };

  const handleMarkAsOverdue = async (invoiceId: string) => {
    try {
      await updateInvoiceStatus(invoiceId, 'overdue');
      toast.warning('Invoice marked as overdue');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update invoice status');
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      toast.loading('Generating PDF...');
      const response = await invoicesApi.download(invoiceId);
      toast.dismiss();

      // Open PDF in new tab
      const pdfUrl = `http://localhost:5000${response.data.pdfUrl}`;
      window.open(pdfUrl, '_blank');

      toast.success('Invoice downloaded successfully');
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || 'Failed to download invoice');
    }
  };

  const handleDeleteInvoice = async (invoice: any) => {
    if (!confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}? This action cannot be undone.`)) {
      return;
    }

    try {
      await invoicesApi.delete(invoice.id);
      toast.success('Invoice deleted successfully');
      refetch(); // Refresh the invoices list
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete invoice');
    }
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        );
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoices & Billing
          </CardTitle>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Billing Period</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map(invoice => (
                <TableRow key={invoice.id} className="table-row-hover">
                  <TableCell className="font-mono text-sm">
                    {invoice.invoiceNumber}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{invoice.organizationName}</p>
                      <p className="text-sm text-muted-foreground">
                        Fixed plan - {invoice.seats} users included
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    ₹{invoice.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(invoice.billingPeriodStart, 'MMM dd')} -{' '}
                    {format(invoice.billingPeriodEnd, 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(invoice.dueDate, 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {invoice.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsPaid(invoice.id)}
                          >
                            Mark Paid
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsOverdue(invoice.id)}
                            className="text-destructive"
                          >
                            Overdue
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadInvoice(invoice.id)}
                        title="Download Invoice PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteInvoice(invoice)}
                        title="Delete Invoice"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No invoices found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Create Invoice Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Organization</Label>
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map(org => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name} ({org.seats} seats)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Billing Period (days)</Label>
              <Input
                id="period"
                type="number"
                min={1}
                value={billingPeriodDays}
                onChange={e => setBillingPeriodDays(parseInt(e.target.value) || 30)}
              />
            </div>

            {selectedOrgId && (() => {
              const org = organizations.find(o => o.id === selectedOrgId);
              const plan = org ? getPlanByTier(org.pricingTier) : null;
              if (org && plan) {
                return (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Plan</span>
                      <span className="font-medium">{plan.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Users Included</span>
                      <span className="font-medium">{org.seats} users</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>• {plan.userLimits.superadmin} Superadmin</span>
                      <span>• {plan.userLimits.admin} Admin</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>• {plan.userLimits.backoffice} Backoffice</span>
                      <span>• {plan.userLimits.connector} Connector</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-medium">Fixed Package Price</span>
                      <span className="font-bold text-primary">
                        ₹{plan.pricePerSeat.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      * Add-ons charged separately if configured
                    </p>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateInvoice}>Create Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
