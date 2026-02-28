'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, DollarSign, FileText, MapPin, TrendingUp, Users } from 'lucide-react';
import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { DataTable } from '@/components/data-table';
import { InlineErrorState, PageLoadingState } from '@/components/page-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDriverEarningsData, type DriverEarningsData } from '@/lib/dashboard/client';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(
    value
  );
}

export default function DriverEarningsPage() {
  const { currentUser, currentTenant } = useStore();
  const [earningsData, setEarningsData] = useState<DriverEarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const canLoad = currentUser?.role === 'driver' && Boolean(currentTenant);

  const loadEarnings = useCallback(async () => {
    if (!canLoad || loadingRef.current) return;

    loadingRef.current = true;
    try {
      const response = await getDriverEarningsData();
      setEarningsData(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load earnings data.');
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [canLoad]);

  useEffect(() => {
    void loadEarnings();
  }, [loadEarnings]);

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
    return <PageLoadingState label="Loading earnings..." />;
  }

  const stats = earningsData?.stats ?? {
    totalEarnings: 0,
    averageRideEarnings: 0,
    completedRides: 0,
  };

  const tableData = (earningsData?.completedRides ?? []).map((ride) => ({
    id: ride.id,
    pickupLocation: ride.pickupLocation,
    dropoffLocation: ride.dropoffLocation,
    distance: ride.distance,
    fare: ride.fare,
    completedAt: ride.completedAt ? new Date(ride.completedAt) : null,
  }));

  const columns = [
    {
      key: 'pickupLocation' as const,
      label: 'Route',
      render: (value: string, row: (typeof tableData)[number]) => (
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
      label: 'Earnings',
      render: (value: number) => <span className="font-bold text-primary">{formatCurrency(value)}</span>,
    },
    {
      key: 'completedAt' as const,
      label: 'Date',
      render: (value: Date | null) => (value ? value.toLocaleDateString() : 'N/A'),
    },
  ];

  return (
    <>
      <AppHeader />
      <div className="mx-auto max-w-7xl px-4 pb-8">
        <SidebarLayout title="Driver Menu" items={sidebarItems}>
          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-3">
              <Card className="border-green-300 bg-green-50/70">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Earnings</p>
                      <p className="mt-1 text-3xl font-bold text-green-700">{formatCurrency(stats.totalEarnings)}</p>
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
                      <p className="mt-1 text-3xl font-bold text-primary">
                        {formatCurrency(Math.round(stats.averageRideEarnings))}
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
                      <p className="mt-1 text-3xl font-bold text-primary">{stats.completedRides}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-primary/50" />
                  </div>
                </CardContent>
              </Card>
            </section>

            {error ? <InlineErrorState message={error} onRetry={() => void loadEarnings()} /> : null}

            <section>
              <h2 className="mb-3 text-base font-semibold">Earning Breakdown</h2>
              <DataTable data={tableData} columns={columns} />
            </section>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment Method</CardTitle>
                <CardDescription>Payout destination for ride earnings.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-muted/50 p-3">
                  <p className="mb-1 text-sm font-medium">Bank Account</p>
                  <p className="text-sm text-muted-foreground">
                    {earningsData?.profile.bankAccount ?? 'Not configured'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarLayout>
      </div>
    </>
  );
}
