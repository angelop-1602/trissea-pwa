'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  FileText,
  MapPin,
  Navigation,
  Power,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { InlineErrorState, PageLoadingState } from '@/components/page-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import { getDriverSummaryData, type DriverSummaryData } from '@/lib/dashboard/client';
import { useDriverPresence } from '@/hooks/use-driver-presence';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(
    value
  );
}

export default function DriverDashboardPage() {
  const { currentUser, currentTenant } = useStore();
  const [summary, setSummary] = useState<DriverSummaryData | null>(null);
  const [isDutyOn, setIsDutyOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTogglingDuty, setIsTogglingDuty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const isDriver = currentUser?.role === 'driver' && Boolean(currentTenant);
  useDriverPresence({ enabled: Boolean(isDriver && isDutyOn) });

  const loadSummary = useCallback(async () => {
    if (!isDriver || loadingRef.current) return;

    loadingRef.current = true;
    try {
      const response = await getDriverSummaryData();
      setSummary(response);
      setIsDutyOn(response.presence.isOnline);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [isDriver]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

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

  const toggleDuty = async () => {
    const nextValue = !isDutyOn;
    setIsTogglingDuty(true);
    setIsDutyOn(nextValue);
    setError(null);

    try {
      const response = await fetch('/api/bookings/driver/presence', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ isOnline: nextValue }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? 'Failed to update duty status.');
      }

      await loadSummary();
    } catch (err) {
      setIsDutyOn(!nextValue);
      setError(err instanceof Error ? err.message : 'Failed to update duty status.');
    } finally {
      setIsTogglingDuty(false);
    }
  };

  if (!currentUser || currentUser.role !== 'driver' || !currentTenant || loading) {
    return <PageLoadingState label="Loading driver dashboard..." />;
  }

  const stats = summary?.stats ?? {
    ridesCompletedToday: 0,
    ridesCompletedTotal: 0,
    totalEarnings: 0,
    totalEarningsToday: 0,
    acceptanceRate: 100,
  };

  return (
    <>
      <AppHeader />
      <div className="mx-auto max-w-7xl px-4 pb-8">
        <SidebarLayout title="Driver Menu" items={sidebarItems}>
          <div className="space-y-6">
            <Card className={isDutyOn ? 'border-green-300 bg-green-50/60' : ''}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>Duty Status</CardTitle>
                    <CardDescription>
                      {isDutyOn ? 'Online: you can receive assignments.' : 'Offline: you will not receive rides.'}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => void toggleDuty()}
                    className={isDutyOn ? 'bg-green-600 hover:bg-green-700' : ''}
                    size="lg"
                    disabled={isTogglingDuty}
                  >
                    <Power className="mr-2 h-4 w-4" />
                    {isTogglingDuty ? 'Updating...' : isDutyOn ? 'Go Offline' : 'Go Online'}
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {error ? <InlineErrorState message={error} onRetry={() => void loadSummary()} /> : null}

            {summary?.activeRide ? (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <p className="text-sm font-medium">Active Ride Assigned</p>
                    <p className="text-xs text-muted-foreground">
                      {summary.activeRide.pickupLocation} to {summary.activeRide.dropoffLocation}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={summary.activeRide.status} />
                    <Link href="/driver/active-trip">
                      <Button size="sm">Open Trip</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {[
                { label: 'Online', value: isDutyOn ? 'Yes' : 'No', icon: <Power className="h-5 w-5" /> },
                { label: 'Rides Today', value: stats.ridesCompletedToday, icon: <Users className="h-5 w-5" /> },
                {
                  label: 'Today Earnings',
                  value: formatCurrency(stats.totalEarningsToday),
                  icon: <DollarSign className="h-5 w-5" />,
                },
                { label: 'Rating', value: (summary?.profile.rating ?? 0).toFixed(1), icon: <TrendingUp className="h-5 w-5" /> },
                { label: 'Acceptance', value: `${stats.acceptanceRate}%`, icon: <Navigation className="h-5 w-5" /> },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                      </div>
                      <div className="text-primary/60">{stat.icon}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </section>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/driver/offers" className="block">
                  <Button className="w-full" size="lg">
                    View Assigned Rides
                  </Button>
                </Link>
                <Link href="/driver/active-trip" className="block">
                  <Button variant="outline" className="w-full">
                    Open Active Trip
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Snapshot</CardTitle>
                <CardDescription>Based on completed rides</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Total Completed</p>
                  <p className="text-xl font-bold">{stats.ridesCompletedTotal}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Acceptance Rate</p>
                  <p className="text-xl font-bold">{stats.acceptanceRate}%</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Lifetime Earnings</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.totalEarnings)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarLayout>
      </div>
    </>
  );
}
