'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/data-table';
import { BarChart3, Users, MapPin, TrendingUp, DollarSign, Clock, Settings } from 'lucide-react';
import { getAdminReservationsData, type AdminReservationsData } from '@/lib/dashboard/client';
import { StatusBadge } from '@/components/status-badge';

export default function AdminReservationsPage() {
  const { currentUser, currentTenant } = useStore();
  const [data, setData] = useState<AdminReservationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const canLoad = currentUser?.role === 'admin' && Boolean(currentTenant);

  const loadData = useCallback(async () => {
    if (!canLoad || loadingRef.current) return;
    loadingRef.current = true;
    try {
      const response = await getAdminReservationsData();
      setData(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reservations.');
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

  const reservations = data?.reservations ?? [];
  const stats = data?.stats ?? {
    totalReservations: 0,
    activeReservations: 0,
  };

  const rows = reservations.map((reservation) => ({
    id: reservation.id,
    passenger: reservation.User?.name ?? 'Unknown',
    terminal: reservation.TODATerminal?.name ?? 'Unknown',
    queuePosition: reservation.queuePosition,
    status: reservation.status,
    boardingTime: new Date(reservation.boardingTime),
  }));

  const columns = [
    {
      key: 'passenger' as const,
      label: 'Passenger',
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'terminal' as const,
      label: 'Terminal',
      render: (value: string) => <span className="text-sm">{value}</span>,
    },
    {
      key: 'queuePosition' as const,
      label: 'Queue #',
      render: (value: number) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'status' as const,
      label: 'Status',
      render: (value: string) => <StatusBadge status={value as any} />,
    },
    {
      key: 'boardingTime' as const,
      label: 'Boarding',
      render: (value: Date) => value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ];

  return (
    <>
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <SidebarLayout title="Admin Menu" items={sidebarItems}>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Reservations</h1>
              <p className="text-muted-foreground">Manage TODA queue reservations</p>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Reservations</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalReservations}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Active Reservations</p>
                  <p className="text-3xl font-bold mt-1">{stats.activeReservations}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Queue Reservations</CardTitle>
                <CardDescription>All reservations for {currentTenant.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable data={rows} columns={columns} />
              </CardContent>
            </Card>
          </div>
        </SidebarLayout>
      </div>
    </>
  );
}
