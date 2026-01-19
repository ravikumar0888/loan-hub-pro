import { useState } from 'react';
import { useOrganization, PRICING_PLANS } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Users, Sparkles, Crown, Shield, UserCog, UserCheck, Plus } from 'lucide-react';
import { PricingPlan } from '@/types';
import { Separator } from '@/components/ui/separator';

export default function PricingTab() {
  const { organizations, calculateMonthlyBilling } = useOrganization();
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [seatCount, setSeatCount] = useState(5);

  const getPlansUsageCount = (planTier: string) => {
    return organizations.filter(org => org.pricingTier === planTier).length;
  };

  return (
    <div className="space-y-6">
      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PRICING_PLANS.map((plan, index) => (
          <Card
            key={plan.id}
            className={`relative animate-fade-in transition-all duration-300 hover:shadow-lg ${
              plan.isPopular ? 'border-primary shadow-md' : ''
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            <CardHeader className="text-center pt-8">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>
                {plan.maxSeats
                  ? `${plan.minSeats} - ${plan.maxSeats} seats`
                  : `${plan.minSeats}+ seats`}
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">₹{plan.pricePerSeat}</span>
                <span className="text-muted-foreground">/seat/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* User Limits Section */}
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">User Limits</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Crown className="h-3.5 w-3.5 text-amber-500" />
                    <span>{plan.userLimits.superadmin} Superadmin</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-blue-500" />
                    <span>{plan.userLimits.admin} Admin{plan.userLimits.admin > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCog className="h-3.5 w-3.5 text-purple-500" />
                    <span>{plan.userLimits.backoffice} Backoffice</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-3.5 w-3.5 text-green-500" />
                    <span>{plan.userLimits.connector} Connectors</span>
                  </div>
                </div>
              </div>

              {/* Addon Pricing for Enterprise */}
              {plan.isCustomizable && plan.addonPricing && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Plus className="h-3.5 w-3.5 text-primary" />
                    <p className="text-xs font-medium text-primary uppercase tracking-wide">Add-on Pricing</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Extra Connector</span>
                      <span className="font-medium">₹{plan.addonPricing.connector}/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Extra Backoffice</span>
                      <span className="font-medium">₹{plan.addonPricing.backoffice}/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Extra Admin</span>
                      <span className="font-medium">₹{plan.addonPricing.admin}/month</span>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Features */}
              <ul className="space-y-2">
                {plan.features.filter(f => !f.includes('Superadmin') && !f.includes('Admin') && !f.includes('Backoffice') && !f.includes('Connector')).map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <div className="w-full p-3 bg-muted/50 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {getPlansUsageCount(plan.tier)} organizations using this plan
                  </span>
                </div>
              </div>
              <Button
                variant={plan.isPopular ? 'default' : 'outline'}
                className="w-full"
                onClick={() => setSelectedPlan(plan)}
              >
                Calculate Pricing
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Pricing Calculator */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Calculator</CardTitle>
          <CardDescription>
            Estimate monthly billing for any plan and seat count
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Selected Plan</Label>
              <div className="flex flex-wrap gap-2">
                {PRICING_PLANS.map(plan => (
                  <Button
                    key={plan.id}
                    variant={selectedPlan?.id === plan.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPlan(plan)}
                  >
                    {plan.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seats">Number of Seats</Label>
              <Input
                id="seats"
                type="number"
                min={1}
                value={seatCount}
                onChange={e => setSeatCount(parseInt(e.target.value) || 1)}
              />
              {selectedPlan && (
                <p className="text-xs text-muted-foreground">
                  {selectedPlan.maxSeats
                    ? `Allowed: ${selectedPlan.minSeats} - ${selectedPlan.maxSeats} seats`
                    : `Minimum: ${selectedPlan.minSeats} seats`}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Monthly Billing</Label>
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                {selectedPlan ? (
                  <div className="space-y-1">
                    <p className="text-3xl font-bold text-primary">
                      ₹{calculateMonthlyBilling(selectedPlan.tier, seatCount).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {seatCount} seats × ₹{selectedPlan.pricePerSeat}/seat
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Select a plan to calculate</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Summary by Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRICING_PLANS.map(plan => {
              const orgsOnPlan = organizations.filter(org => org.pricingTier === plan.tier);
              const totalSeats = orgsOnPlan.reduce((sum, org) => sum + org.seats, 0);
              const monthlyRevenue = totalSeats * plan.pricePerSeat;

              return (
                <div
                  key={plan.id}
                  className="p-4 bg-muted/30 rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{plan.name}</span>
                    <Badge variant="outline">{orgsOnPlan.length} orgs</Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Seats</span>
                      <span className="font-medium">{totalSeats}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly Revenue</span>
                      <span className="font-semibold text-success">
                        ₹{monthlyRevenue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
