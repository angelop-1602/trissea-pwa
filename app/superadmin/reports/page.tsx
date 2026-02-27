'use client';

import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockDB } from '@/lib/mock-db';
import { BarChart3, Globe, Building2, Users, TrendingUp, Zap, Settings } from 'lucide-react';

export default function SuperadminReportsPage() {
  const { currentUser } = useStore();

  if (!currentUser || currentUser.role !== 'superadmin') {
    return null;
  }

  const sidebarItems = [
    { href: '/superadmin/dashboard', label: 'Dashboard', icon: <BarChart3 className="h-4 w-4" /> },
    { href: '/superadmin/regions', label: 'Regions', icon: <Globe className="h-4 w-4" /> },
    { href: '/superadmin/tenants', label: 'Tenants', icon: <Building2 className="h-4 w-4" /> },
    { href: '/superadmin/branding', label: 'Branding', icon: <Zap className="h-4 w-4" /> },
    { href: '/superadmin/reports', label: 'Reports', icon: <TrendingUp className="h-4 w-4" /> },
    { href: '/superadmin/settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  ];

  const allRides = mockDB.rides;
  const totalRevenue = allRides.reduce((sum, r) => sum + r.fare, 0);
  const totalCommission = totalRevenue * 0.1;

  return (
    <>
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <SidebarLayout title="Superadmin Menu" items={sidebarItems}>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Platform Analytics</h1>
              <p className="text-muted-foreground">System-wide performance metrics</p>
            </div>

            {/* Key Metrics */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Rides</p>
                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-400 mt-1">
                      {allRides.length}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-3xl font-bold text-green-700 dark:text-green-400 mt-1">
                      ₱{totalRevenue}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Commission</p>
                    <p className="text-3xl font-bold text-purple-700 dark:text-purple-400 mt-1">
                      ₱{Math.round(totalCommission)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Per Ride</p>
                    <p className="text-3xl font-bold text-amber-700 dark:text-amber-400 mt-1">
                      ₱{allRides.length > 0 ? Math.round(totalRevenue / allRides.length) : 0}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Platform Health */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Health</CardTitle>
                <CardDescription>System-wide performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">System Uptime</span>
                    <span className="text-sm font-bold">99.9%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-600" style={{ width: '99.9%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Tenant Satisfaction</span>
                    <span className="text-sm font-bold">4.8/5.0</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: '96%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Revenue Growth</span>
                    <span className="text-sm font-bold">+18%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-600" style={{ width: '75%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tenant Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Top Tenants</CardTitle>
                <CardDescription>Performance by tenant</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockDB.tenants.map((tenant, i) => {
                    const rides = mockDB.getRidesByTenant(tenant.id);
                    const revenue = rides.reduce((sum, r) => sum + (r.status === 'completed' ? r.fare : 0), 0);
                    return (
                      <div key={tenant.id} className="p-3 rounded-lg bg-muted/50 border flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{tenant.name}</p>
                          <p className="text-xs text-muted-foreground">{rides.length} rides</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">₱{revenue}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarLayout>
      </div>
    </>
  );
}
