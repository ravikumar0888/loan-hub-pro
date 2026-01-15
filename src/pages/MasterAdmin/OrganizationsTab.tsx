import { useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Building2 } from 'lucide-react';
import { Organization, PricingTier } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function OrganizationsTab() {
  const { organizations, createOrganization, updateOrganization, deleteOrganization, pricingPlans } = useOrganization();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    pricingTier: 'starter' as PricingTier,
    seats: 1,
    status: 'active' as 'active' | 'suspended' | 'trial',
    // Super admin fields
    firstName: '',
    lastName: '',
    adminEmail: '',
    mobile: '',
    password: '',
  });

  const filteredOrganizations = organizations.filter(
    org =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      pricingTier: 'starter',
      seats: 1,
      status: 'active',
      firstName: '',
      lastName: '',
      adminEmail: '',
      mobile: '',
      password: '',
    });
    setEditingOrg(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (org: Organization) => {
    setEditingOrg(org);
    const superAdmin = org.users?.[0];
    setFormData({
      name: org.name,
      email: org.email,
      phone: org.phone,
      address: org.address,
      website: org.website || '',
      pricingTier: org.pricingTier,
      seats: org.seats,
      status: org.status,
      firstName: superAdmin?.firstName || '',
      lastName: superAdmin?.lastName || '',
      adminEmail: superAdmin?.email || '',
      mobile: superAdmin?.mobile || '',
      password: '', // Don't populate password on edit
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate super admin fields for create
    if (!editingOrg) {
      if (!formData.firstName || !formData.lastName || !formData.adminEmail || !formData.mobile || !formData.password) {
        toast.error('Please fill in all super admin fields');
        return;
      }
    }

    try {
      if (editingOrg) {
        // Build update data
        const updateData: any = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          website: formData.website,
          pricingTier: formData.pricingTier,
          seats: formData.seats,
          status: formData.status,
        };

        // Include super admin updates if provided
        if (formData.firstName) updateData.adminFirstName = formData.firstName;
        if (formData.lastName) updateData.adminLastName = formData.lastName;
        if (formData.adminEmail) updateData.adminEmail = formData.adminEmail;
        if (formData.mobile) updateData.adminMobile = formData.mobile;
        if (formData.password) updateData.adminPassword = formData.password;

        await updateOrganization(editingOrg.id, updateData);
        toast.success('Organization updated successfully');
      } else {
        await createOrganization({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          website: formData.website,
          pricingTier: formData.pricingTier,
          seats: formData.seats,
          adminFirstName: formData.firstName,
          adminLastName: formData.lastName,
          adminEmail: formData.adminEmail,
          adminMobile: formData.mobile,
          adminPassword: formData.password,
        });
        toast.success('Organization created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save organization');
    }
  };

  const handleDelete = async (org: Organization) => {
    if (confirm(`Are you sure you want to delete ${org.name}?`)) {
      try {
        await deleteOrganization(org.id);
        toast.success('Organization deleted successfully');
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete organization');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>;
      case 'suspended':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Suspended</Badge>;
      case 'trial':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Trial</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTierBadge = (tier: PricingTier) => {
    switch (tier) {
      case 'starter':
        return <Badge variant="outline">Starter</Badge>;
      case 'professional':
        return <Badge className="bg-primary/10 text-primary border-primary/20">Professional</Badge>;
      case 'enterprise':
        return <Badge className="bg-accent/10 text-accent border-accent/20">Enterprise</Badge>;
      default:
        return <Badge variant="secondary">{tier}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organizations
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Organization
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrganizations.map(org => (
                <TableRow key={org.id} className="table-row-hover">
                  <TableCell>
                    <div>
                      <p className="font-medium">{org.name}</p>
                      <p className="text-sm text-muted-foreground">{org.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getTierBadge(org.pricingTier)}</TableCell>
                  <TableCell>
                    <span className="font-medium">{org.usedSeats}</span>
                    <span className="text-muted-foreground">/{org.seats}</span>
                  </TableCell>
                  <TableCell>{getStatusBadge(org.status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(org.createdAt, 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(org)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(org)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrganizations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No organizations found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingOrg ? 'Edit Organization' : 'Create Organization'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Organization Details */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Organization Details</h3>

              <div className="space-y-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter organization name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Organization Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="info@company.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Organization Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="9876543210"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="City, State"
                />
              </div>
            </div>

            {/* Super Admin Details */}
            <div className="space-y-3 border-t pt-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Super Admin Details</h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email *</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={formData.adminEmail}
                  onChange={e => setFormData({ ...formData, adminEmail: e.target.value })}
                  placeholder="admin@company.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number *</Label>
                <Input
                  id="mobile"
                  value={formData.mobile}
                  onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="9876543210"
                  maxLength={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password {!editingOrg && '*'}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingOrg ? "Leave blank to keep current" : "Enter password"}
                />
              </div>
            </div>

            {/* Plan & Status */}
            <div className="space-y-3 border-t pt-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Plan & Status</h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Pricing Plan *</Label>
                  <Select
                    value={formData.pricingTier}
                    onValueChange={value => setFormData({ ...formData, pricingTier: value as PricingTier })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pricingPlans.map(plan => (
                        <SelectItem key={plan.id} value={plan.tier}>
                          {plan.name} (₹{plan.pricePerSeat}/seat)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seats">Seats *</Label>
                  <Input
                    id="seats"
                    type="number"
                    min={1}
                    value={formData.seats}
                    onChange={e => setFormData({ ...formData, seats: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={value => setFormData({ ...formData, status: value as 'active' | 'suspended' | 'trial' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingOrg ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
