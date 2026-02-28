'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Clock, DollarSign, FileText, MapPin, Navigation, TrendingUp, Users } from 'lucide-react';
import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { DataTable } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { InlineErrorState, PageLoadingState } from '@/components/page-state';
import { Card, CardContent } from '@/components/ui/card';
import { getDriverHistoryData, type DriverHistoryData } from '@/lib/dashboard/client';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(
    value
  );
}

export default function DriverHistoryPage() {
  const { currentUser, currentTenant } = useStore();
  const [historyData, setHistoryData] = useState<DriverHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const canLoad = currentUser?.role === 'driver' && Boolean(currentTenant);

  const loadHistory = useCallback(async () => {
    if (!canLoad || loadingRef.current) return;

    loadingRef.current = true;
    try {
      const response = await getDriverHistoryData();
      setHistoryData(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history.');
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [canLoad]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const sidebarItems = useMemo(
    () => [
      { href: '/driver/dashboard', label: 'Dashboard', icon: <MapPin className="h-4 w-4" /> },
      { href: '/driver/offers', label: 'Assigned Rides', icon: <Users className="h-4 w-4" /> },
      { href: '/driver/active-trip', label: 'Active Trip', icon: <TrendingUp className="h-4 w-4" /> },
      { href: '/driver/earnings', label: 'Earnings', icon: <DollarSign className="h-4 w-4" /> },
      { href: '/driver/history', label: 'History', icon: <FileText className="h-4 w-4" /> },
    ],
    []
  );

  if (!currentUser || currentUser.role !== 'driver' || !currentTenant || loading) {
    return <PageLoadingState label="Loading ride history..." />;
  }

  const stats = historyData?.stats ?? {
    totalRides: 0,
    completedRides: 0,
    cancelledRides: 0,
    totalEarnings: 0,
  };

  const rides = (historyData?.rides ?? []).map((ride) => ({
    id: ride.id,
    pickupLocation: ride.pickupLocation,
    dropoffLocation: ride.dropoffLocation,
    distance: ride.distance,
    fare: ride.fare,
    status: ride.status,
    createdAt: new Date(ride.createdAt),
  }));

  const columns = [
    {
      key: 'pickupLocation' as const,
      label: 'Route',
      render: (value: string, row: (typeof rides)[number]) => (
        <div className="text-sm">
          <p className="font-medium">{value}</p>
          <p className="text-xs text-muted-foreground">to {row.dropoffLocation}</p>
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
      label: 'Fare',
      render: (value: number) => <span className="font-bold text-primary">{formatCurrency(value)}</span>,
    },
    {
      key: 'status' as const,
      label: 'Status',
      render: (value: string) => <StatusBadge status={value} />,
    },
    {
      key: 'createdAt' as const,
      label: 'Date',
      render: (value: Date) => value.toLocaleDateString(),
    },
  ];

  return (
    <>
      <AppHeader />
      <div className="mx-auto max-w-7xl px-4 pb-8">
        <SidebarLayout title="Driver Menu" items={sidebarItems}>
          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Rides</p>
                  <p className="mt-1 text-2xl font-bold">{stats.totalRides}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="mt-1 text-2xl font-bold text-green-600">{stats.completedRides}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Cancelled</p>
                  <p className="mt-1 text-2xl font-bold text-red-600">{stats.cancelledRides}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                  <p className="mt-1 text-2xl font-bold text-primary">{formatCurrency(stats.totalEarnings)}</p>
                </CardContent>
              </Card>
            </section>

            {error ? <InlineErrorState message={error} onRetry={() => void loadHistory()} /> : null}

            <section>
              <h2 className="mb-3 text-base font-semibold">Ride History</h2>
              <DataTable data={rides} columns={columns} />
            </section>
          </div>
        </SidebarLayout>
      </div>
    </>
  );
}
