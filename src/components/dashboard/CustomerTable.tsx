import React, { useState } from 'react';
import { Customer, LoanStatus } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, ChevronLeft, ChevronRight, Eye, Edit, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CustomerTableProps {
  customers: Customer[];
  onView?: (customer: Customer) => void;
  onEdit?: (customer: Customer) => void;
  showEditButton?: boolean;
}

const statusStyles: Record<LoanStatus, string> = {
  login: 'bg-primary/10 text-primary border-primary/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  approved: 'bg-success/10 text-success border-success/20',
  disbursed: 'bg-accent/10 text-accent border-accent/20',
  hold: 'bg-warning/10 text-warning border-warning/20',
  relook: 'bg-chart-6/10 text-chart-6 border-chart-6/20',
  drop: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
};

export default function CustomerTable({ customers, onView, onEdit, showEditButton = true }: CustomerTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.mobile.includes(searchQuery) ||
      customer.applicationId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-card rounded-xl shadow-md overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, mobile, or application ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border">
              <SelectItem value="all">All Status</SelectItem>
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
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>App ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Loan Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Connector</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No customers found
                </TableCell>
              </TableRow>
            ) : (
              paginatedCustomers.map((customer) => (
                <TableRow key={customer.id} className="table-row-hover">
                  <TableCell className="text-sm font-mono text-primary">
                    {customer.applicationId || '-'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(customer.applicationDate || customer.date || customer.createdAt), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{customer.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{customer.mobile}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-medium">
                      {customer.loanType}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    ₹{customer.loanAmount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        'capitalize font-medium',
                        statusStyles[customer.status]
                      )}
                    >
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {customer.connectorName || (customer.connector ? `${customer.connector.firstName} ${customer.connector.lastName}` : '-')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => onView?.(customer)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onEdit?.(customer)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of{' '}
            {filteredCustomers.length} entries
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium px-2">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
