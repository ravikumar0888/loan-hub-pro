import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CustomerTable from '@/components/dashboard/CustomerTable';
import CustomerFormDialog from '@/components/customers/CustomerFormDialog';
import { mockCustomers } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Customer } from '@/types';

export default function Customers() {
  const { role } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);

  const canAddCustomer = role === 'admin' || role === 'backoffice';
  const canEdit = role === 'admin' || role === 'backoffice';

  const handleAddNew = () => {
    setSelectedCustomer(null);
    setDialogMode('add');
    setIsDialogOpen(true);
  };

  const handleView = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDialogMode('view');
    setIsDialogOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    if (!canEdit) return;
    setSelectedCustomer(customer);
    setDialogMode('edit');
    setIsDialogOpen(true);
  };

  const handleSave = (customer: Customer) => {
    if (dialogMode === 'add') {
      setCustomers([customer, ...customers]);
    } else if (dialogMode === 'edit') {
      setCustomers(customers.map(c => c.id === customer.id ? customer : c));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Customer Management</h2>
          <p className="text-muted-foreground">Manage and track all customer applications</p>
        </div>
        {canAddCustomer && (
          <Button onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        )}
      </div>

      <CustomerTable
        customers={customers}
        onView={handleView}
        onEdit={canEdit ? handleEdit : undefined}
        showEditButton={canEdit}
      />

      <CustomerFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        customer={selectedCustomer}
        mode={dialogMode}
        onSave={handleSave}
      />
    </div>
  );
}
