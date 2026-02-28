'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/data-table';
import { BarChart3, Users, MapPin, TrendingUp, DollarSign, Clock, Settings } from 'lucide-react';
import { getAdminTerminalsData, type AdminTerminalsData } from '@/lib/dashboard/client';

export default function AdminTerminalsPage() {
  const { currentUser, currentTenant } = useStore();
  const [data, setData] = useState<AdminTerminalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const canLoad = currentUser?.role === 'admin' && Boolean(currentTenant);

  const loadData = useCallback(async () => {
    if (!canLoad || loadingRef.current) return;
    loadingRef.current = true;
    try {
      const response = await getAdminTerminalsData();
      setData(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load terminals.');
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

  const terminals = data?.terminals ?? [];
  const stats = data?.stats ?? { totalTerminals: 0, totalCapacity: 0, currentlyQueued: 0 };

  const terminalData = terminals.map((terminal) => ({
    id: terminal.id,
    name: terminal.name,
    location: terminal.location,
    capacity: terminal.capacity,
    currentQueued: terminal.currentQueued,
  }));

  const columns = [
    {
      key: 'name' as const,
      label: 'Terminal',
      render: (value: string, row: (typeof terminalData)[number]) => (
        <div>
          <p className="font-medium text-sm">{value}</p>
          <p className="text-xs text-muted-foreground">{row.location}</p>
        </div>
      ),
    },
    {
      key: 'currentQueued' as const,
      label: 'Queued',
      render: (value: number) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'capacity' as const,
      label: 'Capacity',
      render: (value: number, row: (typeof terminalData)[number]) => (
        <span className="text-sm">
          {row.currentQueued}/{value}
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
              <h1 className="text-2xl font-bold">TODA Terminals</h1>
              <p className="text-muted-foreground">Manage all terminals for {currentTenant.name}</p>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Terminals</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalTerminals}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Capacity</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalCapacity}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Currently Queued</p>
                  <p className="text-3xl font-bold mt-1">{stats.currentlyQueued}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Terminal List</CardTitle>
                <CardDescription>All registered TODA terminals</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable data={terminalData} columns={columns} />
              </CardContent>
            </Card>
          </div>
        </SidebarLayout>
      </div>
    </>
  );
}
