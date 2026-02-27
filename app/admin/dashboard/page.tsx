'use client';

import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { MapView, type MapPoint } from '@/components/map-view';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockDB } from '@/lib/mock-db';
import { BarChart3, Users, MapPin, TrendingUp, DollarSign, Clock, AlertCircle, Settings } from 'lucide-react';

export default function AdminDashboardPage() {
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

  const terminals = mockDB.getTerminalsByTenant(currentTenant.id);
  const drivers = mockDB.getUsersByTenant(currentTenant.id, 'driver');
  const rides = mockDB.getRidesByTenant(currentTenant.id);
  const completedRides = rides.filter((r) => r.status === 'completed');
  const activeRides = rides.filter((r) => ['matched', 'en-route', 'arrived', 'in-trip'].includes(r.status));

  const operationsMapPoints: MapPoint[] = [
    ...terminals.map((terminal) => ({
      id: `terminal-${terminal.id}`,
      label: terminal.name,
      description: `${terminal.location} | Queue ${terminal.currentQueued}/${terminal.capacity}`,
      latitude: terminal.latitude,
      longitude: terminal.longitude,
      tone: 'terminal' as const,
    })),
    ...activeRides.map((ride) => ({
      id: `ride-${ride.id}`,
      label: `Ride ${ride.id.replace('ride-', '#')}`,
      description: `${ride.pickupLocation} -> ${ride.dropoffLocation}`,
      latitude: ride.driverLocation?.latitude ?? ride.pickupLatitude,
      longitude: ride.driverLocation?.longitude ?? ride.pickupLongitude,
      tone: ride.driverLocation ? ('driver' as const) : ('ride' as const),
    })),
  ];

  const stats = {
    totalTerminals: terminals.length,
    activeDrivers: 12,
    todayRides: rides.length,
    totalRevenue: completedRides.reduce((sum, r) => sum + (r.fare * 0.1), 0), // 10% commission
  };

  return (
    <>
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <SidebarLayout title="Admin Menu" items={sidebarItems}>
          <div className="space-y-6">
            {/* Welcome */}
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
              <CardHeader>
                <CardTitle>Welcome to Admin Dashboard</CardTitle>
                <CardDescription>Manage your {currentTenant.name} operations</CardDescription>
              </CardHeader>
            </Card>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Terminals</p>
                      <p className="text-3xl font-bold mt-1">{stats.totalTerminals}</p>
                    </div>
                    <MapPin className="h-8 w-8 text-primary/50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Drivers</p>
                      <p className="text-3xl font-bold mt-1">{stats.activeDrivers}</p>
                    </div>
                    <Users className="h-8 w-8 text-primary/50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Today's Rides</p>
                      <p className="text-3xl font-bold mt-1">{stats.todayRides}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-primary/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                      <p className="text-3xl font-bold text-green-700 dark:text-green-400 mt-1">
                        ₱{Math.round(stats.totalRevenue)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600/50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Operations Map</CardTitle>
                <CardDescription>Terminal and active ride locations for {currentTenant.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <MapView
                  points={operationsMapPoints}
                  showRoute={false}
                  height="h-[380px]"
                />
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <button className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors border border-muted">
                  <p className="font-medium text-sm">Add New Terminal</p>
                  <p className="text-xs text-muted-foreground">Register a new TODA terminal</p>
                </button>
                <button className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors border border-muted">
                  <p className="font-medium text-sm">Assign Drivers</p>
                  <p className="text-xs text-muted-foreground">Manage driver assignments</p>
                </button>
                <button className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors border border-muted">
                  <p className="font-medium text-sm">View Reports</p>
                  <p className="text-xs text-muted-foreground">Generate performance reports</p>
                </button>
              </CardContent>
            </Card>

            {/* Activity Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
                <CardDescription>Key metrics for {currentTenant.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Ride Completion Rate</span>
                    <span className="text-sm font-bold">94%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-600" style={{ width: '94%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Driver Activity</span>
                    <span className="text-sm font-bold">87%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: '87%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Customer Satisfaction</span>
                    <span className="text-sm font-bold">4.7/5.0</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-600" style={{ width: '94%' }} />
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
