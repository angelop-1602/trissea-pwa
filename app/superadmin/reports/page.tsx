'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Globe, Building2, Users, TrendingUp, Zap, Settings } from 'lucide-react';
import { getSuperadminReportsData, type SuperadminReportsData } from '@/lib/dashboard/client';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(
    value
  );
}

export default function SuperadminReportsPage() {
  const { currentUser } = useStore();
  const [data, setData] = useState<SuperadminReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const canLoad = currentUser?.role === 'superadmin';

  const loadData = useCallback(async () => {
    if (!canLoad || loadingRef.current) return;
    loadingRef.current = true;
    try {
      const response = await getSuperadminReportsData();
      setData(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports.');
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
    totalRides: 0,
    totalRevenue: 0,
    totalCommission: 0,
    averagePerRide: 0,
  };

  const tenantPerformance = data?.tenantPerformance ?? [];

  return (
    <>
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <SidebarLayout title="Superadmin Menu" items={sidebarItems}>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Platform Analytics</h1>
              <p className="text-muted-foreground">System-wide performance metrics</p>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Rides</p>
                  <p className="text-3xl font-bold text-blue-700 mt-1">{stats.totalRides}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-700 mt-1">{formatCurrency(stats.totalRevenue)}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Commission</p>
                  <p className="text-3xl font-bold text-purple-700 mt-1">{formatCurrency(stats.totalCommission)}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Avg per Ride</p>
                  <p className="text-3xl font-bold text-amber-700 mt-1">{formatCurrency(stats.averagePerRide)}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Top Tenants</CardTitle>
                <CardDescription>Performance by tenant</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tenantPerformance.map((tenant) => (
                    <div key={tenant.id} className="p-3 rounded-lg bg-muted/50 border flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">{tenant.rides} rides</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{formatCurrency(tenant.revenue)}</p>
                      </div>
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
