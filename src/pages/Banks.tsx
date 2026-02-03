import React, { useState } from 'react';
import { Bank } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableMobileCard,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Loader2, Building, Search, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { banksApi } from '@/lib/api';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 15;

export default function Banks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [bankName, setBankName] = useState('');
  const [editBankName, setEditBankName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');

  // Fetch banks from backend
  const { data: banksData, isLoading: isLoadingBanks, error: queryError } = useQuery({
    queryKey: ['banks'],
    queryFn: async () => {
      const response = await banksApi.getBanks({ limit: 10000 });
      return response.data;
    },
    refetchOnMount: true,
    staleTime: 0,
    retry: 2,
  });

  const banks = banksData || [];

  const filteredBanks = banks.filter((bank: Bank) =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredBanks.length / ITEMS_PER_PAGE);
  const paginatedBanks = filteredBanks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Create bank mutation
  const createBankMutation = useMutation({
    mutationFn: async (name: string) => {
      return await banksApi.createBank({ name });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['banks'] });
      setBankName('');
      setIsDialogOpen(false);
      setError('');

      toast({
        title: 'Bank Added',
        description: `${response.data.name} has been successfully added.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create bank',
        variant: 'destructive',
      });
    },
  });

  // Update bank mutation
  const updateBankMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      return await banksApi.updateBank(id, { name });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['banks'] });
      setIsEditDialogOpen(false);
      setSelectedBank(null);
      setEditBankName('');
      setEditError('');

      toast({
        title: 'Bank Updated',
        description: `${response.data.name} has been successfully updated.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update bank',
        variant: 'destructive',
      });
    },
  });

  // Delete bank mutation
  const deleteBankMutation = useMutation({
    mutationFn: async (id: string) => {
      return await banksApi.deleteBank(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banks'] });
      toast({
        title: 'Bank Deleted',
        description: 'Bank has been successfully deleted.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete bank',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bankName.trim()) {
      setError('Bank name is required');
      return;
    }

    if (banks.some((b: Bank) => b.name.toLowerCase() === bankName.trim().toLowerCase())) {
      setError('Bank already exists');
      return;
    }

    setError('');
    createBankMutation.mutate(bankName.trim());
  };

  const handleEdit = (bank: Bank) => {
    setSelectedBank(bank);
    setEditBankName(bank.name);
    setEditError('');
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editBankName.trim()) {
      setEditError('Bank name is required');
      return;
    }

    if (banks.some((b: Bank) => b.id !== selectedBank?.id && b.name.toLowerCase() === editBankName.trim().toLowerCase())) {
      setEditError('Bank already exists');
      return;
    }

    if (!selectedBank) return;

    setEditError('');
    updateBankMutation.mutate({ id: selectedBank.id, name: editBankName.trim() });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this bank?')) {
      deleteBankMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Banks & NBFC Management</h2>
          <p className="text-muted-foreground">Manage partner banks and financial institutions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Bank/NBFC
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle>Add New Bank/NBFC</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank/NBFC Name *</Label>
                <Input
                  id="bankName"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Enter bank or NBFC name"
                  error={!!error}
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setBankName('');
                    setError('');
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createBankMutation.isPending}>
                  {createBankMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
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
              placeholder="Search banks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoadingBanks ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading banks...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden p-3 space-y-3">
              {paginatedBanks.length === 0 ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground py-8">
                  <Building className="w-8 h-8" />
                  <p>No banks found</p>
                </div>
              ) : (
                paginatedBanks.map((bank: Bank, index: number) => (
                  <TableMobileCard key={bank.id}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">
                            #{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                          </span>
                        </div>
                        <h3 className="font-semibold text-base">{bank.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Added: {bank.createdAt ? format(new Date(bank.createdAt), 'MMM dd, yyyy') : '-'}
                        </p>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="flex gap-2 pt-3 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-10"
                        onClick={() => handleEdit(bank)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-10 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(bank.id)}
                        disabled={deleteBankMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </TableMobileCard>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12">#</TableHead>
                <TableHead>Bank/NBFC Name</TableHead>
                <TableHead>Added On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBanks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Building className="w-8 h-8" />
                      <p>No banks found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedBanks.map((bank: Bank, index: number) => (
                  <TableRow key={bank.id} className="table-row-hover">
                    <TableCell className="text-muted-foreground">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{bank.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {bank.createdAt ? format(new Date(bank.createdAt), 'MMM dd, yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(bank)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(bank.id)}
                          disabled={deleteBankMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </>
        )}

        {/* Pagination - only show if more than 15 records */}
        {filteredBanks.length > ITEMS_PER_PAGE && (
          <div className="p-3 sm:p-4 border-t border-border">
            <Pagination>
              <PaginationContent className="flex-wrap justify-center gap-1">
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    className={cn(
                      'h-10 min-w-[80px]',
                      currentPage === 1
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    )}
                  />
                </PaginationItem>

                <div className="hidden sm:flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer h-10 min-w-[40px]"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                </div>

                {/* Mobile page indicator */}
                <div className="sm:hidden flex items-center px-3 text-sm font-medium">
                  {currentPage} / {totalPages}
                </div>

                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    className={cn(
                      'h-10 min-w-[80px]',
                      currentPage === totalPages
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Edit Bank Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setSelectedBank(null);
          setEditBankName('');
          setEditError('');
        }
      }}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Edit Bank/NBFC</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="editBankName">Bank/NBFC Name *</Label>
              <Input
                id="editBankName"
                value={editBankName}
                onChange={(e) => setEditBankName(e.target.value)}
                placeholder="Enter bank or NBFC name"
                error={!!editError}
              />
              {editError && <p className="text-sm text-destructive">{editError}</p>}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedBank(null);
                  setEditBankName('');
                  setEditError('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateBankMutation.isPending}>
                {updateBankMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
