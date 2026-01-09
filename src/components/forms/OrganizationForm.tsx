import { useState } from 'react';
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
import { Upload } from 'lucide-react';
import { PricingTier } from '@/types';
import { PRICING_PLANS } from '@/contexts/OrganizationContext';

export interface OrganizationFormData {
  // Organization Details
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  logo: string;

  // Super Admin Details (optional - only for new organizations)
  adminFirstName?: string;
  adminLastName?: string;
  adminEmail?: string;
  adminMobile?: string;
  adminPassword?: string;
  adminConfirmPassword?: string;

  // Plan Details
  pricingTier: PricingTier;
  seats: number;
  status?: 'active' | 'suspended' | 'trial';
}

interface OrganizationFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<OrganizationFormData>;
  showAdminFields?: boolean; // Show super admin fields for new org creation
  showStatusField?: boolean; // Show status field (master admin only)
  showLogoUpload?: boolean; // Show logo upload (master admin only)
  labelColor?: 'white' | 'black'; // Label color based on background
  onSubmit: (data: OrganizationFormData) => void;
  onCancel?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export default function OrganizationForm({
  mode,
  initialData,
  showAdminFields = false,
  showStatusField = false,
  showLogoUpload = false,
  labelColor = 'white',
  onSubmit,
  onCancel,
  submitLabel,
  isSubmitting = false,
}: OrganizationFormProps) {
  const [formData, setFormData] = useState<OrganizationFormData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    website: initialData?.website || '',
    logo: initialData?.logo || '',
    adminFirstName: initialData?.adminFirstName || '',
    adminLastName: initialData?.adminLastName || '',
    adminEmail: initialData?.adminEmail || '',
    adminMobile: initialData?.adminMobile || '',
    adminPassword: initialData?.adminPassword || '',
    adminConfirmPassword: initialData?.adminConfirmPassword || '',
    pricingTier: initialData?.pricingTier || 'professional',
    seats: initialData?.seats || 5,
    status: initialData?.status || 'active',
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logo || null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setFormData(prev => ({ ...prev, logo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Organization name is required
    if (!formData.name.trim()) newErrors.name = 'Organization name is required';

    // Super Admin fields validation (only if shown)
    if (showAdminFields) {
      if (!formData.adminFirstName?.trim()) newErrors.adminFirstName = 'First name is required';
      if (!formData.adminLastName?.trim()) newErrors.adminLastName = 'Last name is required';
      if (!formData.adminEmail?.trim()) newErrors.adminEmail = 'Email is required';
      if (formData.adminEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
        newErrors.adminEmail = 'Invalid email format';
      }
      if (!formData.adminMobile?.trim()) newErrors.adminMobile = 'Mobile is required';
      if (formData.adminMobile && !/^\d{10}$/.test(formData.adminMobile)) {
        newErrors.adminMobile = 'Mobile must be 10 digits';
      }
      if (!formData.adminPassword || formData.adminPassword.length < 8) {
        newErrors.adminPassword = 'Password must be at least 8 characters';
      }
      if (formData.adminPassword !== formData.adminConfirmPassword) {
        newErrors.adminConfirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const selectedPlan = PRICING_PLANS.find(p => p.tier === formData.pricingTier);
  const labelClass = labelColor === 'black' ? 'text-foreground' : 'text-white';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Logo Upload (Master Admin Only) */}
      {showLogoUpload && (
        <div className="flex justify-center">
          <label className="cursor-pointer group">
            <div className="w-24 h-24 rounded-xl bg-slate-700/50 border-2 border-dashed border-slate-600 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <Upload className="h-6 w-6 text-slate-400 mx-auto" />
                  <span className="text-xs text-slate-400 mt-1">Upload Logo</span>
                </div>
              )}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </label>
        </div>
      )}

      {/* Organization Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className={labelClass}>Organization Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          placeholder="ABC Finance Corp"
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      {/* Super Admin Details (only when creating new organization) */}
      {showAdminFields && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adminFirstName" className={labelClass}>First Name *</Label>
              <Input
                id="adminFirstName"
                value={formData.adminFirstName}
                onChange={e => setFormData({ ...formData, adminFirstName: e.target.value })}
                placeholder="John"
              />
              {errors.adminFirstName && <p className="text-xs text-destructive">{errors.adminFirstName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminLastName" className={labelClass}>Last Name *</Label>
              <Input
                id="adminLastName"
                value={formData.adminLastName}
                onChange={e => setFormData({ ...formData, adminLastName: e.target.value })}
                placeholder="Doe"
              />
              {errors.adminLastName && <p className="text-xs text-destructive">{errors.adminLastName}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminMobile" className={labelClass}>Mobile ID *</Label>
            <Input
              id="adminMobile"
              value={formData.adminMobile}
              onChange={e => setFormData({ ...formData, adminMobile: e.target.value })}
              placeholder="9876543210"
              maxLength={10}
            />
            {errors.adminMobile && <p className="text-xs text-destructive">{errors.adminMobile}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminEmail" className={labelClass}>Email ID *</Label>
            <Input
              id="adminEmail"
              type="email"
              value={formData.adminEmail}
              onChange={e => setFormData({ ...formData, adminEmail: e.target.value })}
              placeholder="john@company.com"
            />
            {errors.adminEmail && <p className="text-xs text-destructive">{errors.adminEmail}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adminPassword" className={labelClass}>Password *</Label>
              <Input
                id="adminPassword"
                type="password"
                value={formData.adminPassword}
                onChange={e => setFormData({ ...formData, adminPassword: e.target.value })}
                placeholder="••••••••"
              />
              {errors.adminPassword && <p className="text-xs text-destructive">{errors.adminPassword}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminConfirmPassword" className={labelClass}>Confirm Password *</Label>
              <Input
                id="adminConfirmPassword"
                type="password"
                value={formData.adminConfirmPassword}
                onChange={e => setFormData({ ...formData, adminConfirmPassword: e.target.value })}
                placeholder="••••••••"
              />
              {errors.adminConfirmPassword && <p className="text-xs text-destructive">{errors.adminConfirmPassword}</p>}
            </div>
          </div>
        </>
      )}

      {/* Plan Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className={labelClass}>Pricing Plan *</Label>
          <Select
            value={formData.pricingTier}
            onValueChange={value => setFormData({ ...formData, pricingTier: value as PricingTier })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRICING_PLANS.map(plan => (
                <SelectItem key={plan.id} value={plan.tier}>
                  {plan.name} (₹{plan.pricePerSeat}/seat)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="seats" className={labelClass}>Number of Seats *</Label>
          <Input
            id="seats"
            type="number"
            min={selectedPlan?.minSeats || 1}
            max={selectedPlan?.maxSeats || 999}
            value={formData.seats}
            onChange={e => setFormData({ ...formData, seats: parseInt(e.target.value) || 1 })}
          />
          <p className={`text-xs ${labelColor === 'black' ? 'text-muted-foreground' : 'text-slate-300'}`}>
            {selectedPlan?.maxSeats
              ? `${selectedPlan.minSeats} - ${selectedPlan.maxSeats} seats allowed`
              : `Minimum ${selectedPlan?.minSeats} seats`}
          </p>
        </div>
      </div>

      {showStatusField && (
        <div className="space-y-2">
          <Label className={labelClass}>Status</Label>
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
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : submitLabel || (mode === 'edit' ? 'Update' : 'Create')}
        </Button>
      </div>
    </form>
  );
}
