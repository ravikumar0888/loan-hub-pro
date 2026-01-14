import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { payoutsApi, usersApi } from '@/lib/api';
import { User } from '@/types';

interface ConnectorBalanceWithUser {
  connector: User;
  totalEarned: number;
  totalAdvance: number;
  currentBalance: number;
}
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Wallet, TrendingUp, TrendingDown, FileText, Loader2 } from 'lucide-react';

interface MonthlyPayoutData {
  month: number;
  year: number;
  monthKey: string;
  monthName: string;
  earned: number;
  advance: number;
  netAmount: number;
  balance: number;
  isNegative: boolean;
  entries: any[];
}

export default function Payouts() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [balances, setBalances] = useState<ConnectorBalanceWithUser[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyPayoutData[]>([]);
  const [connectors, setConnectors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    connectorId: '',
    entryType: 'credit' as 'debit' | 'credit',
    amount: '',
    description: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedConnector) {
      fetchMonthlyData(selectedConnector);
    }
  }, [selectedConnector]);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (role === 'connector') {
        // Connector sees only their own data
        const balanceRes = await payoutsApi.getConnectorBalance(user!.id);
        setBalances([
          {
            connector: user!,
            ...balanceRes.data,
          },
        ]);
        setSelectedConnector(user!.id);
      } else {
        // SuperAdmin/Admin see connectors based on role
        // Fetch connectors separately to ensure dropdown is always populated
        const connectorsRes = await usersApi.getConnectors();
        const connectorList = connectorsRes.data;
        setConnectors(connectorList);

        // Fetch balances for all connectors
        const balancesRes = await payoutsApi.getAllConnectorBalances();
        setBalances(balancesRes.data);

        // Auto-select first connector
        if (connectorList.length > 0) {
          setSelectedConnector(connectorList[0].id);
        }
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to fetch payout data',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyData = async (connectorId: string) => {
    try {
      const response = await payoutsApi.getMonthlyPayoutsByConnector(connectorId);
      setMonthlyData(response.data);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to fetch monthly data',
      });
    }
  };

  const handleAddEntry = async () => {
    try {
      if (!formData.connectorId || !formData.amount || !formData.description) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Please fill all required fields',
        });
        return;
      }

      await payoutsApi.addLedgerEntry({
        connectorId: formData.connectorId,
        entryType: formData.entryType,
        amount: parseFloat(formData.amount),
        description: formData.description,
        month: formData.month,
        year: formData.year,
      });

      toast({
        title: 'Success',
        description: 'Ledger entry added successfully',
      });

      setShowAddDialog(false);
      setFormData({
        connectorId: '',
        entryType: 'credit',
        amount: '',
        description: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      });
      fetchData();
      if (selectedConnector) {
        fetchMonthlyData(selectedConnector);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add ledger entry',
      });
    }
  };

  const handleDownloadPDF = async (month: number, year: number) => {
    if (!selectedConnector) return;

    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    setGeneratingPDF(monthKey);

    try {
      const result = await payoutsApi.generatePayoutPDF({ connectorId: selectedConnector, month, year });
      const pdfUrl = `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${result.data.pdfUrl}`;
      window.open(pdfUrl, '_blank');

      toast({
        title: 'Success',
        description: 'PDF generated successfully',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to generate PDF',
      });
    } finally {
      setGeneratingPDF(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate current month totals
  const getCurrentMonthTotals = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const currentMonthData = monthlyData.find(
      (m) => m.month === currentMonth && m.year === currentYear
    );

    return {
      earned: currentMonthData?.earned || 0,
      advance: currentMonthData?.advance || 0,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading payouts...</div>
      </div>
    );
  }

  // Find the selected connector balance or create a default one
  let selectedConnectorBalance = balances.find(
    (b) => b.connector.id === selectedConnector
  );

  // If no balance found but connector is selected, create a zero balance entry
  if (!selectedConnectorBalance && selectedConnector) {
    const connector = connectors.find(c => c.id === selectedConnector) ||
                     (role === 'connector' ? user : null);
    if (connector) {
      selectedConnectorBalance = {
        connector: connector,
        totalEarned: 0,
        totalAdvance: 0,
        currentBalance: 0,
      };
    }
  }

  const currentMonthTotals = getCurrentMonthTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payouts</h1>
          <p className="text-muted-foreground">
            {role === 'connector'
              ? 'View your payout balance and history'
              : 'Manage connector payouts and advances'}
          </p>
        </div>
        {(role === 'superadmin' || role === 'admin') && (
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Entry
          </Button>
        )}
      </div>

      {/* Connector Selector Dropdown - Only for SuperAdmin/Admin */}
      {(role === 'superadmin' || role === 'admin') && (
        <>
          {connectors.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Select Channel Partner</CardTitle>
                <CardDescription>Choose a channel partner to view their payout details</CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedConnector || ''}
                  onValueChange={(value) => setSelectedConnector(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a channel partner" />
                  </SelectTrigger>
                  <SelectContent>
                    {connectors.map((connector) => (
                      <SelectItem key={connector.id} value={connector.id}>
                        {connector.firstName} {connector.lastName} ({connector.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  {role === 'admin'
                    ? 'No connectors found. Create connector users first to manage their payouts.'
                    : 'No connectors in your organization. Create connector users first.'}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Selected Connector Balance Summary - Show for all roles when connector is selected */}
      {selectedConnector && selectedConnectorBalance && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Net Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-bold ${
                  (currentMonthTotals.earned - currentMonthTotals.advance) >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {formatCurrency(currentMonthTotals.earned - currentMonthTotals.advance)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Current Month (Earned - Advance)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                Total Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(currentMonthTotals.earned)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Current Month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-600" />
                Total Advance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {formatCurrency(currentMonthTotals.advance)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Current Month</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monthly Accordion View */}
      {selectedConnectorBalance && monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              <CardTitle>
                Monthly Payout Ledger - {selectedConnectorBalance.connector.firstName}{' '}
                {selectedConnectorBalance.connector.lastName}
              </CardTitle>
            </div>
            <CardDescription>
              Expandable monthly view with carry-forward logic for negative balances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {monthlyData.map((month) => (
                <AccordionItem key={month.monthKey} value={month.monthKey}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">
                          {month.monthName} {month.year}
                        </span>
                        <Badge variant={month.isNegative ? 'destructive' : 'default'}>
                          {month.entries.length} entries
                        </Badge>
                      </div>
                      <div className="flex gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Earned:</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(month.earned)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Advance:</span>
                          <span className="font-semibold text-red-600">
                            {formatCurrency(month.advance)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Net:</span>
                          <span
                            className={`font-bold ${
                              month.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {formatCurrency(month.netAmount)}
                            {month.isNegative && ' (Carry Forward)'}
                          </span>
                        </div>
                        {(role === 'superadmin' || role === 'admin') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadPDF(month.month, month.year);
                            }}
                            disabled={generatingPDF === month.monthKey}
                            className="ml-4"
                          >
                            {generatingPDF === month.monthKey ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <FileText className="w-4 h-4 mr-2" />
                                PDF
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Customer Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Payout (Credit)</TableHead>
                          <TableHead className="text-right">Advance (Debit)</TableHead>
                          <TableHead className="text-right">Created By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {month.entries.map((entry: any) => (
                          <TableRow
                            key={entry.id}
                            className={entry.isCarryForward ? 'bg-muted/50' : ''}
                          >
                            <TableCell>
                              {new Date(entry.createdAt).toLocaleDateString('en-IN')}
                            </TableCell>
                            <TableCell>
                              {entry.isCarryForward ? (
                                <Badge variant="outline">Carry Forward</Badge>
                              ) : (
                                entry.customerName || '-'
                              )}
                            </TableCell>
                            <TableCell className="max-w-xs">{entry.description}</TableCell>
                            <TableCell className="text-right font-semibold text-green-600">
                              {entry.entry_type === 'credit'
                                ? formatCurrency(Number(entry.amount))
                                : '-'}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-red-600">
                              {entry.entry_type === 'debit'
                                ? formatCurrency(Number(entry.amount))
                                : '-'}
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {entry.creator
                                ? `${entry.creator.firstName} ${entry.creator.lastName}`
                                : 'System'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {selectedConnector && monthlyData.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No payout history found for this channel partner
          </CardContent>
        </Card>
      )}

      {/* Add Entry Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Ledger Entry</DialogTitle>
            <DialogDescription>
              Add a payout (credit) or advance (debit) entry for a channel partner
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="connector">Channel Partner *</Label>
              <Select
                value={formData.connectorId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, connectorId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select channel partner" />
                </SelectTrigger>
                <SelectContent>
                  {connectors.map((connector) => (
                    <SelectItem key={connector.id} value={connector.id}>
                      {connector.firstName} {connector.lastName} ({connector.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="entryType">Entry Type *</Label>
              <Select
                value={formData.entryType}
                onValueChange={(value: 'debit' | 'credit') =>
                  setFormData((prev) => ({ ...prev, entryType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Earned (Credit)</SelectItem>
                  <SelectItem value="debit">Advance (Debit)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="month">Month *</Label>
                <Select
                  value={formData.month.toString()}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, month: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <SelectItem key={month} value={month.toString()}>
                        {new Date(2000, month - 1).toLocaleDateString('en-IN', {
                          month: 'long',
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, year: parseInt(e.target.value) }))
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Enter description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEntry}>Add Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
