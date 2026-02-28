'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, MapPin, TrendingUp, DollarSign, Clock, Settings } from 'lucide-react';
import { getAdminReportsData, type AdminReportsData } from '@/lib/dashboard/client';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(
    value
  );
}

export default function AdminReportsPage() {
  const { currentUser, currentTenant } = useStore();
  const [data, setData] = useState<AdminReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const canLoad = currentUser?.role === 'admin' && Boolean(currentTenant);

  const loadData = useCallback(async () => {
    if (!canLoad || loadingRef.current) return;
    loadingRef.current = true;
    try {
      const response = await getAdminReportsData();
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
    totalRides: 0,
    completedRides: 0,
    totalFares: 0,
    commission: 0,
    completionRate: 0,
    driverActivity: 0,
    terminalOccupancy: 0,
    todayRides: 0,
  };

  return (
    <>
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <SidebarLayout title="Admin Menu" items={sidebarItems}>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Reports and Analytics</h1>
              <p className="text-muted-foreground">Performance metrics for {currentTenant.name}</p>
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
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-3xl font-bold text-green-700 mt-1">{stats.completedRides}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Fares</p>
                  <p className="text-3xl font-bold text-purple-700 mt-1">{formatCurrency(stats.totalFares)}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Commission</p>
                  <p className="text-3xl font-bold text-amber-700 mt-1">{formatCurrency(stats.commission)}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-sm font-bold">{stats.completionRate.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-600" style={{ width: `${Math.min(100, stats.completionRate)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Driver Activity</span>
                    <span className="text-sm font-bold">{stats.driverActivity.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: `${Math.min(100, stats.driverActivity)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Terminal Occupancy</span>
                    <span className="text-sm font-bold">{stats.terminalOccupancy.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-600" style={{ width: `${Math.min(100, stats.terminalOccupancy)}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarLayout>
      </div>
    </>
  );
}
