'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { MapView, type MapPoint } from '@/components/map-view';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Globe, Building2, Users, TrendingUp, Zap, Settings } from 'lucide-react';
import { getSuperadminOverviewData, type SuperadminOverviewData } from '@/lib/dashboard/client';

export default function SuperadminDashboardPage() {
  const { currentUser } = useStore();
  const [data, setData] = useState<SuperadminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const canLoad = currentUser?.role === 'superadmin';

  const loadData = useCallback(async () => {
    if (!canLoad || loadingRef.current) return;
    loadingRef.current = true;
    try {
      const response = await getSuperadminOverviewData();
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

  if (!currentUser || currentUser.role !== 'superadmin' || loading) {
    return (
      <div className="min-h-[30vh] flex items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  const sidebarItems = useMemo(
    () => [
      { href: '/superadmin/dashboard', label: 'Dashboard', icon: <BarChart3 className="h-4 w-4" /> },
      { href: '/superadmin/regions', label: 'Regions', icon: <Globe className="h-4 w-4" /> },
      { href: '/superadmin/tenants', label: 'Tenants', icon: <Building2 className="h-4 w-4" /> },
      { href: '/superadmin/branding', label: 'Branding', icon: <Zap className="h-4 w-4" /> },
      { href: '/superadmin/reports', label: 'Reports', icon: <TrendingUp className="h-4 w-4" /> },
      { href: '/superadmin/settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
    ],
    []
  );

  const stats = data?.stats ?? {
    totalRegions: 0,
    totalTenants: 0,
    totalUsers: 0,
    totalRides: 0,
  };

  const platformMapPoints: MapPoint[] = (data?.platformMapPoints ?? []).map((point) => ({
    ...point,
    tone: point.tone as MapPoint['tone'],
  }));

  return (
    <>
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <SidebarLayout title="Superadmin Menu" items={sidebarItems}>
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
              <CardHeader>
                <CardTitle>Welcome to Platform Management</CardTitle>
                <CardDescription>Manage all regions, tenants, and platform settings</CardDescription>
              </CardHeader>
            </Card>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Regions</p>
                      <p className="text-3xl font-bold mt-1">{stats.totalRegions}</p>
                    </div>
                    <Globe className="h-8 w-8 text-primary/50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Tenants</p>
                      <p className="text-3xl font-bold mt-1">{stats.totalTenants}</p>
                    </div>
                    <Building2 className="h-8 w-8 text-primary/50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Users</p>
                      <p className="text-3xl font-bold mt-1">{stats.totalUsers}</p>
                    </div>
                    <Users className="h-8 w-8 text-primary/50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Rides</p>
                      <p className="text-3xl font-bold mt-1">{stats.totalRides}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-primary/50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Platform Coverage Map</CardTitle>
                <CardDescription>Regions, terminals, and live ride activity</CardDescription>
              </CardHeader>
              <CardContent>
                <MapView points={platformMapPoints} showRoute={false} height="h-[400px]" />
              </CardContent>
            </Card>
          </div>
        </SidebarLayout>
      </div>
    </>
  );
}
