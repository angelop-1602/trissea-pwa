'use client';

import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockDB } from '@/lib/mock-db';
import { DataTable } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { BarChart3, Users, MapPin, TrendingUp, DollarSign, Clock, Settings } from 'lucide-react';

export default function AdminRidesPage() {
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

  const rideData = rides.map((r) => ({
    id: r.id,
    pickupLocation: r.pickupLocation,
    dropoffLocation: r.dropoffLocation,
    fare: r.fare,
    status: r.status,
  }));

  const columns = [
    {
      key: 'pickupLocation' as const,
      label: 'Route',
      render: (value: string, row: typeof rideData[0]) => (
        <div className="text-sm">
          <p className="font-medium">{value}</p>
          <p className="text-xs text-muted-foreground">→ {row.dropoffLocation}</p>
        </div>
      ),
    },
    {
      key: 'fare' as const,
      label: 'Fare',
      render: (value: number) => <span className="font-bold text-primary">₱{value}</span>,
    },
    {
      key: 'status' as const,
      label: 'Status',
      render: (value: string) => <StatusBadge status={value as any} />,
    },
  ];

  const stats = {
    totalRides: rides.length,
    completedRides: rides.filter((r) => r.status === 'completed').length,
    totalFares: rides.reduce((sum, r) => sum + r.fare, 0),
  };

  return (
    <>
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <SidebarLayout title="Admin Menu" items={sidebarItems}>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Ride Management</h1>
              <p className="text-muted-foreground">Monitor all rides for {currentTenant.name}</p>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Rides</p>
                    <p className="text-3xl font-bold mt-1">{stats.totalRides}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                      {stats.completedRides}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-3xl font-bold text-primary mt-1">₱{stats.totalFares}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Rides Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Rides</CardTitle>
                <CardDescription>Complete list of rides in your tenant</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable data={rideData} columns={columns} />
              </CardContent>
            </Card>
          </div>
        </SidebarLayout>
      </div>
    </>
  );
}
