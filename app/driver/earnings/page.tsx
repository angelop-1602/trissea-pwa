'use client';

import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockDB } from '@/lib/mock-db';
import { DataTable } from '@/components/data-table';
import { MapPin, DollarSign, Clock, Navigation, Users, TrendingUp, FileText, BarChart3 } from 'lucide-react';

export default function DriverEarningsPage() {
  const { currentUser, currentTenant, rides } = useStore();

  if (!currentUser || currentUser.role !== 'driver' || !currentTenant) {
    return (
      <div className="min-h-[30vh] flex items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  const sidebarItems = [
    { href: '/driver/dashboard', label: 'Dashboard', icon: <MapPin className="h-4 w-4" /> },
    { href: '/driver/offers', label: 'Ride Offers', icon: <Users className="h-4 w-4" /> },
    { href: '/driver/active-trip', label: 'Active Trip', icon: <TrendingUp className="h-4 w-4" /> },
    { href: '/driver/earnings', label: 'Earnings', icon: <DollarSign className="h-4 w-4" /> },
    { href: '/driver/history', label: 'History', icon: <FileText className="h-4 w-4" /> },
  ];

  const completedRides = rides.filter(
    (r) => r.tenantId === currentTenant.id && r.status === 'completed'
  );

  const totalEarnings = completedRides.reduce((sum, r) => sum + r.fare, 0);
  const averageRideEarnings = completedRides.length > 0 ? totalEarnings / completedRides.length : 0;

  const earningsData = completedRides.map((ride) => ({
    id: ride.id,
    pickupLocation: ride.pickupLocation,
    dropoffLocation: ride.dropoffLocation,
    distance: ride.distance,
    fare: ride.fare,
    completedAt: ride.completedAt,
  }));

  const columns = [
    {
      key: 'pickupLocation' as const,
      label: 'Route',
      render: (value: string, row: typeof earningsData[0]) => (
        <div className="text-sm">
          <p className="font-medium">{value}</p>
          <p className="text-xs text-muted-foreground">→ {row.dropoffLocation}</p>
        </div>
      ),
    },
    {
      key: 'distance' as const,
      label: 'Distance',
      render: (value: number) => <span className="text-sm">{value}km</span>,
    },
    {
      key: 'fare' as const,
      label: 'Earnings',
      render: (value: number) => <span className="font-bold text-primary">₱{value}</span>,
    },
    {
      key: 'completedAt' as const,
      label: 'Date',
      render: (value: Date | undefined) =>
        value ? value.toLocaleDateString() : 'N/A',
    },
  ];

  return (
    <>
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <SidebarLayout title="Driver Menu" items={sidebarItems}>
          <div className="space-y-6">
            {/* Earnings Summary */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Earnings</p>
                      <p className="text-3xl font-bold text-green-700 dark:text-green-400 mt-1">
                        ₱{totalEarnings}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600/50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg per Ride</p>
                      <p className="text-3xl font-bold text-primary mt-1">
                        ₱{Math.round(averageRideEarnings)}
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-primary/50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Completed Rides</p>
                      <p className="text-3xl font-bold text-primary mt-1">{completedRides.length}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-primary/50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Earning Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Earning Breakdown</CardTitle>
                <CardDescription>Detailed view of all completed rides</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable data={earningsData} columns={columns} />
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 rounded-lg bg-muted/50 border border-muted">
                  <p className="text-sm font-medium mb-1">Bank Account</p>
                  <p className="text-sm text-muted-foreground">****1234</p>
                  <button className="text-sm text-primary hover:underline mt-2">
                    Update Payment Details
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarLayout>
      </div>
    </>
  );
}

