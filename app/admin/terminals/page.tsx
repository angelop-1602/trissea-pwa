'use client';

import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockDB } from '@/lib/mock-db';
import { DataTable } from '@/components/data-table';
import { BarChart3, Users, MapPin, TrendingUp, DollarSign, Clock, Settings } from 'lucide-react';

export default function AdminTerminalsPage() {
  const { currentUser, currentTenant } = useStore();

  if (!currentUser || currentUser.role !== 'admin' || !currentTenant) {
    return (
      <div className="min-h-[30vh] flex items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  const sidebarItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: <BarChart3 className="h-4 w-4" /> },
    { href: '/admin/terminals', label: 'Terminals', icon: <MapPin className="h-4 w-4" /> },
    { href: '/admin/drivers', label: 'Drivers', icon: <Users className="h-4 w-4" /> },
    { href: '/admin/rides', label: 'Rides', icon: <TrendingUp className="h-4 w-4" /> },
    { href: '/admin/reservations', label: 'Reservations', icon: <Clock className="h-4 w-4" /> },
    { href: '/admin/users', label: 'Users', icon: <Users className="h-4 w-4" /> },
    { href: '/admin/reports', label: 'Reports', icon: <DollarSign className="h-4 w-4" /> },
    { href: '/admin/settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  ];

  const terminals = mockDB.getTerminalsByTenant(currentTenant.id);

  const terminalData = terminals.map((t) => ({
    id: t.id,
    name: t.name,
    location: t.location,
    capacity: t.capacity,
    currentQueued: t.currentQueued,
  }));

  const columns = [
    {
      key: 'name' as const,
      label: 'Terminal',
      render: (value: string, row: typeof terminalData[0]) => (
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
      render: (value: number, row: typeof terminalData[0]) => (
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">TODA Terminals</h1>
                <p className="text-muted-foreground">Manage all terminals for {currentTenant.name}</p>
              </div>
              <Button className="bg-primary">Add Terminal</Button>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Terminals</p>
                    <p className="text-3xl font-bold mt-1">{terminals.length}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Capacity</p>
                    <p className="text-3xl font-bold mt-1">
                      {terminals.reduce((sum, t) => sum + t.capacity, 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Currently Queued</p>
                    <p className="text-3xl font-bold mt-1">
                      {terminals.reduce((sum, t) => sum + t.currentQueued, 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Terminals List */}
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

