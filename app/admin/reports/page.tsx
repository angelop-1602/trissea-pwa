'use client';

import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockDB } from '@/lib/mock-db';
import { BarChart3, Users, MapPin, TrendingUp, DollarSign, Clock, Settings } from 'lucide-react';

export default function AdminReportsPage() {
  const { currentUser, currentTenant } = useStore();

  if (!currentUser || currentUser.role !== 'admin' || !currentTenant) {
    return null;
  }

  const sidebarItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: <BarChart3 className="h-4 w-4" /> },
    { href: '/admin/terminals', label: 'Terminals', icon: <MapPin className="h-4 w-4" /> },
    { href: '/admin/drivers', label: 'Drivers', icon: <Users className="h-4 w-4" /> },
    { href: '/admin/rides', label: 'Rides', icon: <TrendingUp className="h-4 w-4" /> },
    { href: '/admin/reservations', label: 'Reservations', icon: <Clock className="h-4 w-4" /> },
    { href: '/admin/users', label: 'Users', icon: <Users className="h-4 w-4" /> },
    { href: '/admin/reports', label: 'Reports', icon: <DollarSign className="h-4 w-4" /> },
    { href: '/admin/settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  ];

  const rides = mockDB.getRidesByTenant(currentTenant.id);
  const completedRides = rides.filter((r) => r.status === 'completed');
  const totalFares = rides.reduce((sum, r) => sum + r.fare, 0);
  const commission = totalFares * 0.1;

  return (
    <>
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <SidebarLayout title="Admin Menu" items={sidebarItems}>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Reports & Analytics</h1>
              <p className="text-muted-foreground">Performance metrics for {currentTenant.name}</p>
            </div>

            {/* Key Metrics */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Rides</p>
                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-400 mt-1">{rides.length}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-3xl font-bold text-green-700 dark:text-green-400 mt-1">{completedRides.length}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Fares</p>
                    <p className="text-3xl font-bold text-purple-700 dark:text-purple-400 mt-1">₱{totalFares}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Commission</p>
                    <p className="text-3xl font-bold text-amber-700 dark:text-amber-400 mt-1">₱{Math.round(commission)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-sm font-bold">
                      {rides.length > 0 ? ((completedRides.length / rides.length) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600"
                      style={{
                        width: `${rides.length > 0 ? (completedRides.length / rides.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Driver Utilization</span>
                    <span className="text-sm font-bold">87%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: '87%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Terminal Occupancy</span>
                    <span className="text-sm font-bold">65%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-600" style={{ width: '65%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Customer Satisfaction</span>
                    <span className="text-sm font-bold">4.7/5.0</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600" style={{ width: '94%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Daily Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Summary</CardTitle>
                <CardDescription>Today's activity breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Peak Hour', value: '12:00 PM' },
                    { label: 'Avg. Rating', value: '4.8' },
                    { label: 'Avg. Wait', value: '5.2m' },
                    { label: 'Active Drivers', value: '12' },
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50 border border-muted">
                      <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                      <p className="font-bold text-sm">{item.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarLayout>
      </div>
    </>
  );
}
