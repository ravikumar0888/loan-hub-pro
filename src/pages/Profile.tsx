import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2, Save, Trash2, User } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function Profile() {
  const { user, role, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<any>({});
  const [passwordData, setPasswordData] = useState({ password: '', confirmPassword: '' });
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Initialize form data from AuthContext user immediately (performance optimization)
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        mobile: (user as any).mobile || '',
        profilePhoto: (user as any).profilePhoto || '',
        companyName: (user as any).companyName || '',
        companyEmail: (user as any).companyEmail || '',
        companyAddress: (user as any).companyAddress || '',
        companyGSTIN: (user as any).companyGSTIN || '',
        companyState: (user as any).companyState || '',
        companyStateCode: (user as any).companyStateCode || '',
        hsnSac: (user as any).hsnSac || '',
        cgstRate: (user as any).cgstRate || '',
        sgstRate: (user as any).sgstRate || '',
      });
    }
  }, [user]);

  // Fetch additional profile data only if needed (for fields not in AuthContext)
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await profileApi.getProfile();
      // Merge with existing formData to preserve any user changes
      setFormData((prev: any) => ({
        ...response.data,
        ...prev,
      }));
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes to avoid redundant API calls
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: { profileData: any; photo?: File }) =>
      profileApi.updateProfile(data.profileData, data.photo),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      await refreshUser(); // Refresh user data in AuthContext
      setSelectedPhoto(null);
      setPhotoPreview(null);
      setPasswordData({ password: '', confirmPassword: '' });
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    },
  });

  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: () => profileApi.deletePhoto(),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      await refreshUser(); // Refresh user data in AuthContext
      toast({
        title: 'Success',
        description: 'Photo deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete photo',
        variant: 'destructive',
      });
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'Photo size must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password match if changing password
    if (passwordData.password || passwordData.confirmPassword) {
      if (passwordData.password !== passwordData.confirmPassword) {
        toast({
          title: 'Error',
          description: 'Passwords do not match',
          variant: 'destructive',
        });
        return;
      }
    }

    const submitData = { ...formData };
    if (passwordData.password) {
      submitData.password = passwordData.password;
    }

    updateProfileMutation.mutate({
      profileData: submitData,
      photo: selectedPhoto || undefined,
    });
  };

  const handleDeletePhoto = () => {
    if (window.confirm('Are you sure you want to delete your profile photo?')) {
      deletePhotoMutation.mutate();
    }
  };

  const getPhotoUrl = () => {
    if (photoPreview) return photoPreview;
    // Check formData first (from user), then profileData
    const photo = formData.profilePhoto || profileData?.profilePhoto;
    if (photo) {
      return `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${photo}`;
    }
    return null;
  };

  // Only show loading if we don't have user data yet
  if (isLoading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Profile Settings</h2>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Photo */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Photo</CardTitle>
            <CardDescription>Update your profile picture</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="relative">
                {getPhotoUrl() ? (
                  <img
                    src={getPhotoUrl()!}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border">
                    <User className="w-12 h-12 text-primary" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">
                  JPG, PNG or GIF. Max size 5MB.
                </p>
                {profileData?.profilePhoto && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleDeletePhoto}
                    disabled={deletePhotoMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Photo
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile</Label>
                <Input
                  id="mobile"
                  value={formData.mobile || ''}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password (leave blank to keep current)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={passwordData.password}
                  onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme Preference */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Choose your preferred theme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={theme} onValueChange={(value: any) => setTheme(value)}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Company Details (Admin Only) */}
        {role === 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
              <CardDescription>Manage your company information for invoicing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName || ''}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Company Email</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={formData.companyEmail || ''}
                    onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyAddress">Company Address</Label>
                <Textarea
                  id="companyAddress"
                  value={formData.companyAddress || ''}
                  onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyGSTIN">GSTIN/UIN</Label>
                  <Input
                    id="companyGSTIN"
                    value={formData.companyGSTIN || ''}
                    onChange={(e) => setFormData({ ...formData, companyGSTIN: e.target.value })}
                    maxLength={15}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyState">State</Label>
                  <Input
                    id="companyState"
                    value={formData.companyState || ''}
                    onChange={(e) => setFormData({ ...formData, companyState: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyStateCode">State Code</Label>
                  <Input
                    id="companyStateCode"
                    value={formData.companyStateCode || ''}
                    onChange={(e) => setFormData({ ...formData, companyStateCode: e.target.value })}
                    maxLength={2}
                  />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hsnSac">HSN/SAC</Label>
                  <Input
                    id="hsnSac"
                    value={formData.hsnSac || ''}
                    onChange={(e) => setFormData({ ...formData, hsnSac: e.target.value })}
                    placeholder="997159"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cgstRate">CGST Rate (%)</Label>
                  <Input
                    id="cgstRate"
                    type="number"
                    step="0.01"
                    value={formData.cgstRate || ''}
                    onChange={(e) => setFormData({ ...formData, cgstRate: e.target.value })}
                    placeholder="9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sgstRate">SGST/UTGST Rate (%)</Label>
                  <Input
                    id="sgstRate"
                    type="number"
                    step="0.01"
                    value={formData.sgstRate || ''}
                    onChange={(e) => setFormData({ ...formData, sgstRate: e.target.value })}
                    placeholder="9"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="min-w-[120px]"
          >
            {updateProfileMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
