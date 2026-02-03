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
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Building2, X } from 'lucide-react';
import { Organization, PricingTier } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

type AddonRole = 'admin' | 'backoffice' | 'channel_partner';

interface Addon {
  id: string;
  role: AddonRole;
  quantity: number;
  price: number;
}

// Addon pricing configuration (commented out for now)
// const ADDON_PRICING = {
//   admin: 500,
//   backoffice: 200,
//   channel_partner: 100,
// };

// const ADDON_ROLE_LABELS = {
//   admin: 'Admin',
//   backoffice: 'Back Office',
//   channel_partner: 'Channel Partner',
// };

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
    pricePerSeat: 4999, // Default to Standard pricing
    status: 'active' as 'active' | 'suspended' | 'trial',
    // Super admin fields
    firstName: '',
    lastName: '',
    adminEmail: '',
    mobile: '',
    password: '',
  });
  const [addons, setAddons] = useState<Addon[]>([]);

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
      pricePerSeat: 4999, // Default Standard pricing
      status: 'active',
      firstName: '',
      lastName: '',
      adminEmail: '',
      mobile: '',
      password: '',
    });
    setAddons([]);
    setEditingOrg(null);
  };

  const addNewAddon = () => {
    const newAddon: Addon = {
      id: Math.random().toString(36).substring(7),
      role: 'admin',
      quantity: 1,
      price: 500, // Default price for admin
    };
    setAddons([...addons, newAddon]);
  };

  const removeAddon = (id: string) => {
    setAddons(addons.filter(addon => addon.id !== id));
  };

  const updateAddon = (id: string, field: 'role' | 'quantity' | 'price', value: AddonRole | number) => {
    setAddons(addons.map(addon => {
      if (addon.id !== id) return addon;

      // If role changes, update price to default for that role
      if (field === 'role') {
        const newRole = value as AddonRole;
        const defaultPrices: Record<AddonRole, number> = {
          admin: 500,
          backoffice: 200,
          channel_partner: 100,
        };
        return { ...addon, role: newRole, price: defaultPrices[newRole] };
      }

      return { ...addon, [field]: value };
    }));
  };

  // Get plan details with user counts
  const getPlanDetails = (tier: PricingTier) => {
    const planDetails = {
      starter: {
        name: 'Standard',
        users: { superadmin: 1, admin: 1, backoffice: 2, connector: 10 },
        totalSeats: 14,
      },
      enterprise: {
        name: 'Enterprise',
        users: { superadmin: 1, admin: 2, backoffice: 5, connector: 25 },
        totalSeats: 33,
      },
      professional: {
        name: 'Professional',
        users: { superadmin: 1, admin: 5, backoffice: 10, connector: 50 },
        totalSeats: 66,
      },
    };
    return planDetails[tier];
  };

  // Calculate total bill amount
  const calculateTotalBill = () => {
    const baseCost = formData.pricePerSeat; // Fixed plan price
    const addonCost = addons.reduce((total, addon) => {
      return total + (addon.price * addon.quantity);
    }, 0);
    return baseCost + addonCost;
  };

  // Pricing calculation (commented out for now)
  // const calculateTotalPrice = () => {
  //   const plan = pricingPlans.find(p => p.tier === formData.pricingTier);
  //   if (!plan) return 0;

  //   const baseCost = plan.pricePerSeat * formData.seats;
  //   const addonCost = addons.reduce((total, addon) => {
  //     return total + (ADDON_PRICING[addon.role] * addon.quantity);
  //   }, 0);

  //   return baseCost + addonCost;
  // };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (org: Organization) => {
    setEditingOrg(org);
    const superAdmin = org.users?.[0];
    const plan = pricingPlans.find(p => p.tier === org.pricingTier);
    setFormData({
      name: org.name,
      email: org.email,
      phone: org.phone,
      address: org.address,
      website: org.website || '',
      pricingTier: org.pricingTier,
      pricePerSeat: plan?.pricePerSeat || 4999,
      status: org.status,
      firstName: superAdmin?.firstName || '',
      lastName: superAdmin?.lastName || '',
      adminEmail: superAdmin?.email || '',
      mobile: superAdmin?.mobile || '',
      password: '', // Don't populate password on edit
    });

    // Load existing add-ons if available
    if ((org as any).addons && Array.isArray((org as any).addons)) {
      setAddons((org as any).addons);
    } else {
      setAddons([]);
    }

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
      // Calculate seats based on plan
      const planDetails = getPlanDetails(formData.pricingTier);
      const totalSeats = planDetails.totalSeats;

      // Calculate total billing amount (base plan + add-ons)
      const totalBillingAmount = calculateTotalBill();

      if (editingOrg) {
        // Build update data
        const updateData: any = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          website: formData.website,
          pricingTier: formData.pricingTier,
          seats: totalSeats,
          monthlyAmount: totalBillingAmount, // Total billing amount including add-ons
          addons: addons, // Save add-ons configuration
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
          seats: totalSeats,
          monthlyAmount: totalBillingAmount, // Total billing amount including add-ons
          addons: addons, // Save add-ons configuration
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
          <div className="flex flex-col gap-4 w-full sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            <Button onClick={openCreateDialog} className="w-full sm:w-auto mt-2 sm:mt-0">
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
                <Label htmlFor="password">
                  Password {!editingOrg && '*'}
                  {editingOrg && <span className="text-xs font-normal text-muted-foreground ml-2">(currently set)</span>}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingOrg ? "Enter new password to change" : "Enter password"}
                />
                {editingOrg && (
                  <p className="text-xs text-muted-foreground">Leave blank to keep current password</p>
                )}
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
                    onValueChange={value => {
                      const newTier = value as PricingTier;
                      const tierPrices: Record<PricingTier, number> = {
                        starter: 4999,
                        professional: 13999,
                        enterprise: 8999,
                      };
                      setFormData({
                        ...formData,
                        pricingTier: newTier,
                        pricePerSeat: tierPrices[newTier]
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Standard</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pricePerSeat">Price (₹) *</Label>
                  <Input
                    id="pricePerSeat"
                    type="number"
                    min={1}
                    value={formData.pricePerSeat}
                    onChange={e => setFormData({ ...formData, pricePerSeat: parseInt(e.target.value) || 0 })}
                    placeholder="4999"
                  />
                </div>
              </div>

              {/* Plan Description */}
              {(() => {
                const planDetails = getPlanDetails(formData.pricingTier);
                return (
                  <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                    <p className="text-sm font-medium text-foreground">Plan Includes:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>• {planDetails.users.superadmin} Superadmin</div>
                      <div>• {planDetails.users.admin} Admin</div>
                      <div>• {planDetails.users.backoffice} Backoffice</div>
                      <div>• {planDetails.users.connector} Connector</div>
                    </div>
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-sm font-semibold text-foreground">
                        Total Users: {planDetails.totalSeats}
                      </p>
                    </div>
                  </div>
                );
              })()}

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

            {/* Add-ons Section */}
            <div className="space-y-3 border-t pt-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Add-ons (Optional)
                  {editingOrg && <span className="text-xs font-normal text-muted-foreground ml-2">- Modify plan pricing</span>}
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={addNewAddon}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Add-on
                </Button>
              </div>

              {addons.length > 0 && (
                <div className="space-y-2">
                  {addons.map((addon) => (
                    <div key={addon.id} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <Select
                          value={addon.role}
                          onValueChange={(value) => updateAddon(addon.id, 'role', value as AddonRole)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="backoffice">Back Office</SelectItem>
                            <SelectItem value="channel_partner">Channel Partner</SelectItem>
                          </SelectContent>
                        </Select>

                        <Input
                          type="number"
                          min={1}
                          value={addon.quantity}
                          onChange={(e) => updateAddon(addon.id, 'quantity', parseInt(e.target.value) || 1)}
                          placeholder="Quantity"
                          className="h-9"
                        />

                        <Input
                          type="number"
                          min={1}
                          value={addon.price}
                          onChange={(e) => updateAddon(addon.id, 'price', parseInt(e.target.value) || 0)}
                          placeholder="Price"
                          className="h-9"
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => removeAddon(addon.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total Bill Amount */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-foreground">
                  {editingOrg ? 'Updated Bill Amount' : 'Total Bill Amount'}
                </span>
                <span className="text-2xl font-bold text-primary">
                  ₹{calculateTotalBill().toLocaleString()}
                </span>
              </div>
              {editingOrg && addons.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Add-ons will be added to the base plan price
                </p>
              )}
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
