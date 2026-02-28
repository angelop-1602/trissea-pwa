'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/data-table';
import { BarChart3, Users, MapPin, TrendingUp, DollarSign, Clock, Settings } from 'lucide-react';
import { getAdminDriversData, type AdminDriversData } from '@/lib/dashboard/client';

export default function AdminDriversPage() {
  const { currentUser, currentTenant } = useStore();
  const [data, setData] = useState<AdminDriversData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const canLoad = currentUser?.role === 'admin' && Boolean(currentTenant);

  const loadData = useCallback(async () => {
    if (!canLoad || loadingRef.current) return;
    loadingRef.current = true;
    try {
      const response = await getAdminDriversData();
      setData(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load drivers.');
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

  const drivers = data?.drivers ?? [];
  const stats = data?.stats ?? { totalDrivers: 0, activeToday: 0, averageRating: 0 };

  const driverData = drivers.map((driver) => ({
    id: driver.id,
    name: driver.name,
    phone: driver.phone,
    rating: driver.rating,
    completedRides: driver.completedRides,
    online: driver.DriverPresence?.isOnline ?? false,
  }));

  const columns = [
    {
      key: 'name' as const,
      label: 'Name',
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'phone' as const,
      label: 'Phone',
      render: (value: string) => <span className="text-sm">{value}</span>,
    },
    {
      key: 'completedRides' as const,
      label: 'Rides',
      render: (value: number | null) => <span className="font-medium">{value ?? 0}</span>,
    },
    {
      key: 'rating' as const,
      label: 'Rating',
      render: (value: number | null) => <span className="font-medium">{value ? `${value.toFixed(1)}/5.0` : 'N/A'}</span>,
    },
    {
      key: 'online' as const,
      label: 'Status',
      render: (value: boolean) => (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${value ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
          {value ? 'Online' : 'Offline'}
        </span>
      ),
    },
  ];

  return (
    <>
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <SidebarLayout title="Admin Menu" items={sidebarItems}>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Driver Management</h1>
              <p className="text-muted-foreground">Manage drivers for {currentTenant.name}</p>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Drivers</p>
                    <p className="text-3xl font-bold mt-1">{stats.totalDrivers}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Today</p>
                    <p className="text-3xl font-bold mt-1">{stats.activeToday}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Average Rating</p>
                    <p className="text-3xl font-bold mt-1">{stats.averageRating.toFixed(1)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Driver List</CardTitle>
                <CardDescription>All drivers operating in this tenant</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable data={driverData} columns={columns} />
              </CardContent>
            </Card>
          </div>
        </SidebarLayout>
      </div>
    </>
  );
}
