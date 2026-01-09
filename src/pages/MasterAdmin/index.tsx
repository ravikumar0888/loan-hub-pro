import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useBilling } from '@/contexts/BillingContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, CreditCard, TrendingUp, DollarSign, UserCheck } from 'lucide-react';
import OrganizationsTab from './OrganizationsTab';
import BillingTab from './BillingTab';
import PricingTab from './PricingTab';

export default function MasterAdminDashboard() {
  const { user } = useAuth();
  const { organizations } = useOrganization();
  const { getTotalRevenue, getOutstandingAmount } = useBilling();

  const totalOrganizations = organizations.length;
  const activeOrganizations = organizations.filter(org => org.status === 'active').length;
  const totalSeats = organizations.reduce((sum, org) => sum + org.seats, 0);
  const usedSeats = organizations.reduce((sum, org) => sum + org.usedSeats, 0);
  const totalRevenue = getTotalRevenue();
  const outstandingAmount = getOutstandingAmount();

  const kpiCards = [
    {
      title: 'Total Organizations',
      value: totalOrganizations,
      icon: Building2,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Active Organizations',
      value: activeOrganizations,
      icon: UserCheck,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Total Seats',
      value: `${usedSeats}/${totalSeats}`,
      icon: Users,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Outstanding',
      value: `₹${outstandingAmount.toLocaleString()}`,
      icon: CreditCard,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Seat Utilization',
      value: `${totalSeats > 0 ? Math.round((usedSeats / totalSeats) * 100) : 0}%`,
      icon: TrendingUp,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Master Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName}. Manage your platform from here.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpiCards.map((kpi, index) => (
            <Card key={index} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{kpi.title}</p>
                    <p className="text-xl font-bold mt-1">{kpi.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                    <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="organizations" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
          </TabsList>

          <TabsContent value="organizations">
            <OrganizationsTab />
          </TabsContent>

          <TabsContent value="billing">
            <BillingTab />
          </TabsContent>

          <TabsContent value="pricing">
            <PricingTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
