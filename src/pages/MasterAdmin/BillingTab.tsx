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
import { Plus, FileText, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { InvoiceStatus } from '@/types';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';

export default function BillingTab() {
  const { invoices, createInvoice, updateInvoiceStatus } = useBilling();
  const { organizations, getPlanByTier } = useOrganization();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [billingPeriodDays, setBillingPeriodDays] = useState(30);

  const handleCreateInvoice = () => {
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

    const amount = plan.pricePerSeat * org.seats;
    const today = new Date();

    createInvoice({
      organizationId: org.id,
      organizationName: org.name,
      amount,
      seats: org.seats,
      pricePerSeat: plan.pricePerSeat,
      billingPeriodStart: today,
      billingPeriodEnd: addDays(today, billingPeriodDays),
      dueDate: addDays(today, billingPeriodDays + 15),
      status: 'pending',
    });

    toast.success('Invoice created successfully');
    setIsDialogOpen(false);
    setSelectedOrgId('');
  };

  const handleMarkAsPaid = (invoiceId: string) => {
    updateInvoiceStatus(invoiceId, 'paid');
    toast.success('Invoice marked as paid');
  };

  const handleMarkAsOverdue = (invoiceId: string) => {
    updateInvoiceStatus(invoiceId, 'overdue');
    toast.warning('Invoice marked as overdue');
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
                        {invoice.seats} seats × ₹{invoice.pricePerSeat}
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
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
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
                      <span className="text-muted-foreground">Seats</span>
                      <span className="font-medium">{org.seats}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Price per seat</span>
                      <span className="font-medium">₹{plan.pricePerSeat}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-medium">Total</span>
                      <span className="font-bold text-primary">
                        ₹{(plan.pricePerSeat * org.seats).toLocaleString()}
                      </span>
                    </div>
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
