import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PRICING_PLANS } from '@/contexts/OrganizationContext';
import { signupApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { PricingTier } from '@/types';
import {
  Building2,
  User,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Check,
  Upload,
  Sparkles,
  Loader2,
} from 'lucide-react';

type Step = 'organization' | 'admin' | 'plan';

export default function SignupPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('organization');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const calculateMonthlyBilling = (tier: PricingTier, seats: number) => {
    const plan = PRICING_PLANS.find(p => p.tier === tier);
    return plan ? plan.pricePerSeat * seats : 0;
  };

  const [formData, setFormData] = useState({
    // Organization
    orgName: '',
    orgEmail: '',
    orgPhone: '',
    orgAddress: '',
    orgWebsite: '',
    orgLogo: '',
    // Super Admin
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    // Plan
    pricingTier: 'professional' as PricingTier,
    seats: 5,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
    { id: 'organization', label: 'Organization', icon: <Building2 className="h-5 w-5" /> },
    { id: 'admin', label: 'Super Admin', icon: <User className="h-5 w-5" /> },
    { id: 'plan', label: 'Choose Plan', icon: <CreditCard className="h-5 w-5" /> },
  ];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setFormData(prev => ({ ...prev, orgLogo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (step: Step): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 'organization') {
      if (!formData.orgName.trim()) newErrors.orgName = 'Organization name is required';
      if (!formData.orgEmail.trim()) newErrors.orgEmail = 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.orgEmail)) {
        newErrors.orgEmail = 'Invalid email format';
      }
      if (!formData.orgPhone.trim()) newErrors.orgPhone = 'Phone is required';
    }

    if (step === 'admin') {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
      if (!formData.mobile.trim()) newErrors.mobile = 'Mobile is required';
      if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) return;

    if (currentStep === 'organization') setCurrentStep('admin');
    else if (currentStep === 'admin') setCurrentStep('plan');
  };

  const prevStep = () => {
    if (currentStep === 'admin') setCurrentStep('organization');
    else if (currentStep === 'plan') setCurrentStep('admin');
  };

  const handleSubmit = async () => {
    if (!validateStep('plan')) return;

    setIsSubmitting(true);

    try {
      await signupApi.createOrganization({
        organizationName: formData.orgName,
        organizationEmail: formData.orgEmail,
        organizationPhone: formData.orgPhone,
        address: formData.orgAddress,
        website: formData.orgWebsite,
        pricingTier: formData.pricingTier,
        seats: formData.seats,
        superAdminEmail: formData.email,
        superAdminPassword: formData.password,
        superAdminName: `${formData.firstName} ${formData.lastName}`,
        superAdminMobile: formData.mobile,
      });

      toast.success('Organization created successfully! You can now login with your credentials.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPlan = PRICING_PLANS.find(p => p.tier === formData.pricingTier);
  const monthlyBilling = calculateMonthlyBilling(formData.pricingTier, formData.seats);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative w-full max-w-4xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            Loan<span className="text-primary">MS</span>
          </h1>
          <p className="text-slate-400 mt-2">Create your organization account</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  currentStep === step.id
                    ? 'bg-primary text-primary-foreground'
                    : steps.findIndex(s => s.id === currentStep) > index
                    ? 'bg-success/20 text-success'
                    : 'bg-slate-700/50 text-slate-400'
                }`}
              >
                {steps.findIndex(s => s.id === currentStep) > index ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.icon
                )}
                <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-8 sm:w-16 h-0.5 mx-2 ${
                    steps.findIndex(s => s.id === currentStep) > index
                      ? 'bg-success'
                      : 'bg-slate-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
          <CardContent className="p-6 md:p-8">
            {/* Organization Step */}
            {currentStep === 'organization' && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-white">Organization Details</h2>
                  <p className="text-slate-400 text-sm">Tell us about your company</p>
                </div>

                {/* Logo Upload */}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgName" className="text-slate-200">Organization Name *</Label>
                    <Input
                      id="orgName"
                      value={formData.orgName}
                      onChange={e => setFormData({ ...formData, orgName: e.target.value })}
                      placeholder="ABC Finance Corp"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                    {errors.orgName && <p className="text-xs text-destructive">{errors.orgName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orgEmail" className="text-slate-200">Email *</Label>
                    <Input
                      id="orgEmail"
                      type="email"
                      value={formData.orgEmail}
                      onChange={e => setFormData({ ...formData, orgEmail: e.target.value })}
                      placeholder="admin@company.com"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                    {errors.orgEmail && <p className="text-xs text-destructive">{errors.orgEmail}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orgPhone" className="text-slate-200">Phone *</Label>
                    <Input
                      id="orgPhone"
                      value={formData.orgPhone}
                      onChange={e => setFormData({ ...formData, orgPhone: e.target.value })}
                      placeholder="9876543210"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                    {errors.orgPhone && <p className="text-xs text-destructive">{errors.orgPhone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orgWebsite" className="text-slate-200">Website</Label>
                    <Input
                      id="orgWebsite"
                      value={formData.orgWebsite}
                      onChange={e => setFormData({ ...formData, orgWebsite: e.target.value })}
                      placeholder="https://company.com"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="orgAddress" className="text-slate-200">Address</Label>
                    <Input
                      id="orgAddress"
                      value={formData.orgAddress}
                      onChange={e => setFormData({ ...formData, orgAddress: e.target.value })}
                      placeholder="City, State, Country"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Admin Step */}
            {currentStep === 'admin' && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-white">Super Admin Details</h2>
                  <p className="text-slate-400 text-sm">Create your admin account</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-slate-200">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="John"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                    {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-slate-200">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Doe"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                    {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-200">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@company.com"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile" className="text-slate-200">Mobile *</Label>
                    <Input
                      id="mobile"
                      value={formData.mobile}
                      onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="9876543210"
                      maxLength={10}
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                    {errors.mobile && <p className="text-xs text-destructive">{errors.mobile}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-200">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-slate-200">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                    {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Plan Step */}
            {currentStep === 'plan' && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-white">Choose Your Plan</h2>
                  <p className="text-slate-400 text-sm">Select a plan that fits your needs</p>
                </div>

                {/* Plan Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PRICING_PLANS.map(plan => (
                    <div
                      key={plan.id}
                      onClick={() => setFormData({ ...formData, pricingTier: plan.tier })}
                      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.pricingTier === plan.tier
                          ? 'border-primary bg-primary/10'
                          : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                      }`}
                    >
                      {plan.isPopular && (
                        <Badge className="absolute -top-2 right-2 bg-primary text-primary-foreground text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                      <h3 className="font-semibold text-white">{plan.name}</h3>
                      <p className="text-2xl font-bold text-white mt-2">
                        ₹{plan.pricePerSeat}
                        <span className="text-sm font-normal text-slate-400">/seat</span>
                      </p>
                      <ul className="mt-3 space-y-1">
                        {plan.features.slice(0, 3).map((feature, i) => (
                          <li key={i} className="text-xs text-slate-300 flex items-center gap-1">
                            <Check className="h-3 w-3 text-success" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Seat Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-200">Number of Seats</Label>
                    <Input
                      type="number"
                      min={selectedPlan?.minSeats || 1}
                      max={selectedPlan?.maxSeats || 999}
                      value={formData.seats}
                      onChange={e => setFormData({ ...formData, seats: parseInt(e.target.value) || 1 })}
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                    <p className="text-xs text-slate-400">
                      {selectedPlan?.maxSeats
                        ? `${selectedPlan.minSeats} - ${selectedPlan.maxSeats} seats allowed`
                        : `Minimum ${selectedPlan?.minSeats} seats`}
                    </p>
                  </div>

                  <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl">
                    <p className="text-sm text-slate-400">Monthly Total</p>
                    <p className="text-3xl font-bold text-white">₹{monthlyBilling.toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {formData.seats} seats × ₹{selectedPlan?.pricePerSeat}/seat
                    </p>
                    <Badge className="mt-2 bg-success/20 text-success border-success/30">
                      14-day free trial included
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-700">
              <div>
                {currentStep !== 'organization' && (
                  <Button variant="ghost" onClick={prevStep} className="text-slate-300">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <Link to="/login" className="text-sm text-slate-400 hover:text-white">
                  Already have an account?
                </Link>
                {currentStep === 'plan' ? (
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        Start Free Trial
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button onClick={nextStep}>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
