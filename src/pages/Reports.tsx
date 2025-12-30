import React, { useState } from 'react';
import { mockCustomers, mockUsers, mockDSAs } from '@/data/mockData';
import { Customer } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DateRangePicker from '@/components/dashboard/DateRangePicker';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet, Download, Filter, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { LoanStatus } from '@/types';

const statusStyles: Record<LoanStatus, string> = {
  login: 'bg-primary/10 text-primary border-primary/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  approved: 'bg-success/10 text-success border-success/20',
  disbursed: 'bg-accent/10 text-accent border-accent/20',
  hold: 'bg-warning/10 text-warning border-warning/20',
  relook: 'bg-chart-6/10 text-chart-6 border-chart-6/20',
  drop: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
};

export default function Reports() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });
  const [selectedDSA, setSelectedDSA] = useState<string>('all');
  const [selectedConnector, setSelectedConnector] = useState<string>('all');

  const connectors = mockUsers.filter((u) => u.role === 'connector');

  const filteredData = mockCustomers.filter((customer) => {
    const matchesDSA = selectedDSA === 'all' || true; // DSA filter would need actual mapping
    const matchesConnector = selectedConnector === 'all' || customer.connectorId === selectedConnector;
    const matchesDate =
      (!dateRange.from || customer.date >= dateRange.from) &&
      (!dateRange.to || customer.date <= dateRange.to);
    return matchesDSA && matchesConnector && matchesDate;
  });

  const handleExport = () => {
    // Create CSV content
    const headers = ['Date', 'Customer Name', 'Mobile', 'Email', 'Loan Type', 'Amount', 'Status', 'Connector'];
    const rows = filteredData.map((c) => [
      format(c.date, 'yyyy-MM-dd'),
      c.name,
      c.mobile,
      c.email,
      c.loanType,
      c.loanAmount.toString(),
      c.status,
      c.connectorName,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loan-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export Successful',
      description: 'Report has been downloaded as CSV.',
    });
  };

  const handleReset = () => {
    setDateRange({
      from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      to: new Date(),
    });
    setSelectedDSA('all');
    setSelectedConnector('all');
  };

  const totalAmount = filteredData.reduce((sum, c) => sum + c.loanAmount, 0);
  const disbursedAmount = filteredData
    .filter((c) => c.status === 'disbursed')
    .reduce((sum, c) => sum + c.loanAmount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Reports</h2>
          <p className="text-muted-foreground">Generate and export loan reports</p>
        </div>
        <Button onClick={handleExport} variant="default">
          <Download className="w-4 h-4 mr-2" />
          Export to Excel
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl p-6 shadow-md space-y-4">
        <div className="flex items-center gap-2 text-foreground font-medium">
          <Filter className="w-5 h-5" />
          Filters
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Date Range</Label>
            <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
          </div>

          <div className="space-y-2">
            <Label>DSA</Label>
            <Select value={selectedDSA} onValueChange={setSelectedDSA}>
              <SelectTrigger>
                <SelectValue placeholder="All DSAs" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border">
                <SelectItem value="all">All DSAs</SelectItem>
                {mockDSAs.map((dsa) => (
                  <SelectItem key={dsa.id} value={dsa.id}>
                    {dsa.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Connector</Label>
            <Select value={selectedConnector} onValueChange={setSelectedConnector}>
              <SelectTrigger>
                <SelectValue placeholder="All Connectors" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border">
                <SelectItem value="all">All Connectors</SelectItem>
                {connectors.map((connector) => (
                  <SelectItem key={connector.id} value={connector.id}>
                    {connector.firstName} {connector.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button variant="outline" onClick={handleReset} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-6 shadow-md">
          <p className="text-sm text-muted-foreground">Total Applications</p>
          <p className="text-3xl font-bold text-foreground mt-1">{filteredData.length}</p>
        </div>
        <div className="bg-card rounded-xl p-6 shadow-md">
          <p className="text-sm text-muted-foreground">Total Loan Amount</p>
          <p className="text-3xl font-bold text-foreground mt-1">
            ₹{totalAmount.toLocaleString()}
          </p>
        </div>
        <div className="bg-card rounded-xl p-6 shadow-md">
          <p className="text-sm text-muted-foreground">Disbursed Amount</p>
          <p className="text-3xl font-bold text-success mt-1">
            ₹{disbursedAmount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-card rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Loan Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Connector</TableHead>
                <TableHead>Lead Owner</TableHead>
                <TableHead>Sales Manager</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No data found for selected filters</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((customer) => (
                  <TableRow key={customer.id} className="table-row-hover">
                    <TableCell className="text-sm">
                      {format(customer.date, 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{customer.mobile}</p>
                        <p className="text-muted-foreground">{customer.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{customer.loanType}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      ₹{customer.loanAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn('capitalize font-medium', statusStyles[customer.status])}
                      >
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{customer.connectorName}</TableCell>
                    <TableCell>{customer.leadOwner}</TableCell>
                    <TableCell>{customer.salesManager}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
