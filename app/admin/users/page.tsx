'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/data-table';
import { BarChart3, Users, MapPin, TrendingUp, DollarSign, Clock, Settings } from 'lucide-react';
import { getAdminUsersData, type AdminUsersData } from '@/lib/dashboard/client';

export default function AdminUsersPage() {
  const { currentUser, currentTenant } = useStore();
  const [data, setData] = useState<AdminUsersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const canLoad = currentUser?.role === 'admin' && Boolean(currentTenant);

  const loadData = useCallback(async () => {
    if (!canLoad || loadingRef.current) return;
    loadingRef.current = true;
    try {
      const response = await getAdminUsersData();
      setData(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users.');
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

  const users = data?.users ?? [];
  const stats = data?.stats ?? {
    totalUsers: 0,
    roleCounts: { passenger: 0, driver: 0, admin: 0, superadmin: 0 },
  };

  const rows = users.map((user) => ({
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    createdAt: new Date(user.createdAt),
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
      key: 'role' as const,
      label: 'Role',
      render: (value: string) => (
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-700">
          {value}
        </span>
      ),
    },
    {
      key: 'createdAt' as const,
      label: 'Created',
      render: (value: Date) => value.toLocaleDateString(),
    },
  ];

  return (
    <>
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <SidebarLayout title="Admin Menu" items={sidebarItems}>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">User Management</h1>
              <p className="text-muted-foreground">Manage all users for {currentTenant.name}</p>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalUsers}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Passengers</p>
                  <p className="text-3xl font-bold mt-1">{stats.roleCounts.passenger}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Drivers</p>
                  <p className="text-3xl font-bold mt-1">{stats.roleCounts.driver}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Admins</p>
                  <p className="text-3xl font-bold mt-1">{stats.roleCounts.admin}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>Complete user directory for {currentTenant.name}</CardDescription>
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
