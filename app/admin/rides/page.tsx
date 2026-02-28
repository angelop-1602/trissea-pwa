'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { BarChart3, Users, MapPin, TrendingUp, DollarSign, Clock, Settings } from 'lucide-react';
import { getAdminRidesData, type AdminRidesData } from '@/lib/dashboard/client';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(
    value
  );
}

export default function AdminRidesPage() {
  const { currentUser, currentTenant } = useStore();
  const [data, setData] = useState<AdminRidesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const canLoad = currentUser?.role === 'admin' && Boolean(currentTenant);

  const loadData = useCallback(async () => {
    if (!canLoad || loadingRef.current) return;
    loadingRef.current = true;
    try {
      const response = await getAdminRidesData();
      setData(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rides.');
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [canLoad]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (!currentUser || currentUser.role !== 'admin' || !currentTenant || loading) {
    return (
      <div className="min-h-[30vh] flex items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  const sidebarItems = useMemo(
    () => [
      { href: '/admin/dashboard', label: 'Dashboard', icon: <BarChart3 className="h-4 w-4" /> },
      { href: '/admin/terminals', label: 'Terminals', icon: <MapPin className="h-4 w-4" /> },
      { href: '/admin/drivers', label: 'Drivers', icon: <Users className="h-4 w-4" /> },
      { href: '/admin/rides', label: 'Rides', icon: <TrendingUp className="h-4 w-4" /> },
      { href: '/admin/reservations', label: 'Reservations', icon: <Clock className="h-4 w-4" /> },
      { href: '/admin/users', label: 'Users', icon: <Users className="h-4 w-4" /> },
      { href: '/admin/reports', label: 'Reports', icon: <DollarSign className="h-4 w-4" /> },
      { href: '/admin/settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
    ],
    []
  );

  const rides = data?.rides ?? [];
  const stats = data?.stats ?? { totalRides: 0, completedRides: 0, totalFares: 0 };

  const rideData = rides.map((ride) => ({
    id: ride.id,
    pickupLocation: ride.pickupLocation,
    dropoffLocation: ride.dropoffLocation,
    fare: ride.fare,
    status: ride.status,
  }));

  const columns = [
    {
      key: 'pickupLocation' as const,
      label: 'Route',
      render: (value: string, row: (typeof rideData)[number]) => (
        <div className="text-sm">
          <p className="font-medium">{value}</p>
          <p className="text-xs text-muted-foreground">to {row.dropoffLocation}</p>
        </div>
      ),
    },
    {
      key: 'fare' as const,
      label: 'Fare',
      render: (value: number) => <span className="font-bold text-primary">{formatCurrency(value)}</span>,
    },
    {
      key: 'status' as const,
      label: 'Status',
      render: (value: string) => <StatusBadge status={value as any} />,
    },
  ];

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

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Rides</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalRides}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{stats.completedRides}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-3xl font-bold text-primary mt-1">{formatCurrency(stats.totalFares)}</p>
                </CardContent>
              </Card>
            </div>

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
