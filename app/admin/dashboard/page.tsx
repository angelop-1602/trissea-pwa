'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { MapView, type MapPoint } from '@/components/map-view';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, MapPin, TrendingUp, DollarSign, Clock, Settings } from 'lucide-react';
import { getAdminOverviewData, type AdminOverviewData } from '@/lib/dashboard/client';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(
    value
  );
}

export default function AdminDashboardPage() {
  const { currentUser, currentTenant } = useStore();
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const canLoad = currentUser?.role === 'admin' && Boolean(currentTenant);

  const loadData = useCallback(async () => {
    if (!canLoad || loadingRef.current) return;
    loadingRef.current = true;
    try {
      const response = await getAdminOverviewData();
      setData(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
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

  const stats = data?.stats ?? {
    totalTerminals: 0,
    activeDrivers: 0,
    todayRides: 0,
    totalRevenue: 0,
  };

  const terminals = data?.terminals ?? [];
  const activeRides = data?.activeRides ?? [];

  const operationsMapPoints: MapPoint[] = [
    ...terminals.map((terminal) => ({
      id: `terminal-${terminal.id}`,
      label: terminal.name,
      description: `${terminal.location} | Queue ${terminal.currentQueued}/${terminal.capacity}`,
      latitude: terminal.latitude,
      longitude: terminal.longitude,
      tone: 'terminal' as const,
    })),
    ...activeRides.map((ride) => ({
      id: `ride-${ride.id}`,
      label: `Ride ${ride.id}`,
      description: `${ride.pickupLocation} to ${ride.dropoffLocation}`,
      latitude: ride.driverLatitude ?? ride.pickupLatitude,
      longitude: ride.driverLongitude ?? ride.pickupLongitude,
      tone: ride.driverLatitude && ride.driverLongitude ? ('driver' as const) : ('ride' as const),
    })),
  ];

  return (
    <>
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <SidebarLayout title="Admin Menu" items={sidebarItems}>
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
              <CardHeader>
                <CardTitle>Welcome to Admin Dashboard</CardTitle>
                <CardDescription>Manage your {currentTenant.name} operations</CardDescription>
              </CardHeader>
            </Card>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Terminals</p>
                      <p className="text-3xl font-bold mt-1">{stats.totalTerminals}</p>
                    </div>
                    <MapPin className="h-8 w-8 text-primary/50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Drivers</p>
                      <p className="text-3xl font-bold mt-1">{stats.activeDrivers}</p>
                    </div>
                    <Users className="h-8 w-8 text-primary/50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Today's Rides</p>
                      <p className="text-3xl font-bold mt-1">{stats.todayRides}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-primary/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                      <p className="text-3xl font-bold text-green-700 mt-1">{formatCurrency(stats.totalRevenue)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600/50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Operations Map</CardTitle>
                <CardDescription>Terminal and active ride locations for {currentTenant.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <MapView points={operationsMapPoints} showRoute={false} height="h-[380px]" />
              </CardContent>
            </Card>
          </div>
        </SidebarLayout>
      </div>
    </>
  );
}
