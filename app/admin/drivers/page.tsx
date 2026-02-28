'use client';

import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockDB } from '@/lib/mock-db';
import { DataTable } from '@/components/data-table';
import { BarChart3, Users, MapPin, TrendingUp, DollarSign, Clock, Settings } from 'lucide-react';

export default function AdminDriversPage() {
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

  const drivers = mockDB.getUsersByTenant(currentTenant.id, 'driver');

  const driverData = drivers.map((d) => ({
    id: d.id,
    name: d.name,
    phone: d.phone,
    rating: d.rating,
    completedRides: d.completedRides,
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
      render: (value: number | undefined) => <span className="font-medium">{value || 0}</span>,
    },
    {
      key: 'rating' as const,
      label: 'Rating',
      render: (value: number | undefined) => (
        <span className="font-medium">{value ? `${value}/5.0` : 'N/A'}</span>
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
                <h1 className="text-2xl font-bold">Driver Management</h1>
                <p className="text-muted-foreground">Manage drivers for {currentTenant.name}</p>
              </div>
              <Button className="bg-primary">Add Driver</Button>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Drivers</p>
                    <p className="text-3xl font-bold mt-1">{drivers.length}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Today</p>
                    <p className="text-3xl font-bold mt-1">12</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Average Rating</p>
                    <p className="text-3xl font-bold mt-1">4.8</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Drivers Table */}
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

