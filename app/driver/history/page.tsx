'use client';

import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockDB } from '@/lib/mock-db';
import { DataTable } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { MapPin, DollarSign, Clock, Navigation, Users, TrendingUp, FileText } from 'lucide-react';

export default function DriverHistoryPage() {
  const { currentUser, currentTenant, rides } = useStore();

  if (!currentUser || currentUser.role !== 'driver' || !currentTenant) {
    return null;
  }

  const sidebarItems = [
    { href: '/driver/dashboard', label: 'Dashboard', icon: <MapPin className="h-4 w-4" /> },
    { href: '/driver/offers', label: 'Ride Offers', icon: <Users className="h-4 w-4" /> },
    { href: '/driver/active-trip', label: 'Active Trip', icon: <TrendingUp className="h-4 w-4" /> },
    { href: '/driver/earnings', label: 'Earnings', icon: <DollarSign className="h-4 w-4" /> },
    { href: '/driver/history', label: 'History', icon: <FileText className="h-4 w-4" /> },
  ];

  const allRides = rides.filter((r) => r.tenantId === currentTenant.id);

  const historyData = allRides.map((ride) => ({
    id: ride.id,
    pickupLocation: ride.pickupLocation,
    dropoffLocation: ride.dropoffLocation,
    distance: ride.distance,
    fare: ride.fare,
    status: ride.status,
    createdAt: ride.createdAt,
  }));

  const columns = [
    {
      key: 'pickupLocation' as const,
      label: 'Route',
      render: (value: string, row: typeof historyData[0]) => (
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
      key: 'status' as const,
      label: 'Status',
      render: (value: string) => <StatusBadge status={value as any} />,
    },
    {
      key: 'createdAt' as const,
      label: 'Date',
      render: (value: Date) => value.toLocaleDateString(),
    },
  ];

  const stats = {
    totalRides: allRides.length,
    completedRides: allRides.filter((r) => r.status === 'completed').length,
    cancelledRides: allRides.filter((r) => r.status === 'cancelled').length,
    totalEarnings: allRides
      .filter((r) => r.status === 'completed')
      .reduce((sum, r) => sum + r.fare, 0),
  };

  return (
    <>
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <SidebarLayout title="Driver Menu" items={sidebarItems}>
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Rides</p>
                      <p className="text-2xl font-bold mt-1">{stats.totalRides}</p>
                    </div>
                    <TrendingUp className="h-6 w-6 text-primary/50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                        {stats.completedRides}
                      </p>
                    </div>
                    <Navigation className="h-6 w-6 text-green-600/50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Cancelled</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                        {stats.cancelledRides}
                      </p>
                    </div>
                    <Clock className="h-6 w-6 text-red-600/50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Earned</p>
                      <p className="text-2xl font-bold text-primary mt-1">₱{stats.totalEarnings}</p>
                    </div>
                    <DollarSign className="h-6 w-6 text-primary/50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ride History Table */}
            <Card>
              <CardHeader>
                <CardTitle>Ride History</CardTitle>
                <CardDescription>All your rides and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable data={historyData} columns={columns} />
              </CardContent>
            </Card>
          </div>
        </SidebarLayout>
      </div>
    </>
  );
}
