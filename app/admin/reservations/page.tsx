'use client';

import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, MapPin, TrendingUp, DollarSign, Clock, Settings } from 'lucide-react';

export default function AdminReservationsPage() {
  const { currentUser, currentTenant } = useStore();

  if (!currentUser || currentUser.role !== 'admin' || !currentTenant) {
    return null;
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

            <Card>
              <CardHeader>
                <CardTitle>Queue Reservations</CardTitle>
                <CardDescription>All active and historical reservations for {currentTenant.name}</CardDescription>
              </CardHeader>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">Reservation management coming soon</p>
              </CardContent>
            </Card>
          </div>
        </SidebarLayout>
      </div>
    </>
  );
}
