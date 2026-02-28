'use client';

import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { MapView, type MapPoint } from '@/components/map-view';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockDB } from '@/lib/mock-db';
import { BarChart3, Globe, Building2, Users, TrendingUp, Zap, Settings } from 'lucide-react';

export default function SuperadminDashboardPage() {
  const { currentUser } = useStore();

  if (!currentUser || currentUser.role !== 'superadmin') {
    return (
      <div className="min-h-[30vh] flex items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  const sidebarItems = [
    { href: '/superadmin/dashboard', label: 'Dashboard', icon: <BarChart3 className="h-4 w-4" /> },
    { href: '/superadmin/regions', label: 'Regions', icon: <Globe className="h-4 w-4" /> },
    { href: '/superadmin/tenants', label: 'Tenants', icon: <Building2 className="h-4 w-4" /> },
    { href: '/superadmin/branding', label: 'Branding', icon: <Zap className="h-4 w-4" /> },
    { href: '/superadmin/reports', label: 'Reports', icon: <TrendingUp className="h-4 w-4" /> },
    { href: '/superadmin/settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  ];

  const stats = {
    totalRegions: mockDB.regions.length,
    totalTenants: mockDB.tenants.length,
    totalUsers: mockDB.users.length,
    totalRides: mockDB.rides.length,
  };

  const regionCenters: Record<string, { latitude: number; longitude: number }> = {
    'region-1': { latitude: 14.5995, longitude: 120.9842 },
    'region-2': { latitude: 10.3157, longitude: 123.8854 },
  };

  const platformMapPoints: MapPoint[] = [
    ...mockDB.regions.map((region) => ({
      id: `region-${region.id}`,
      label: region.name,
      description: `${mockDB.getTenantsByRegion(region.id).length} tenants`,
      latitude: regionCenters[region.id]?.latitude ?? 14.5995,
      longitude: regionCenters[region.id]?.longitude ?? 120.9842,
      tone: 'region' as const,
    })),
    ...mockDB.terminals.map((terminal) => ({
      id: `terminal-${terminal.id}`,
      label: terminal.name,
      description: mockDB.getTenantById(terminal.tenantId)?.name ?? 'Unknown Tenant',
      latitude: terminal.latitude,
      longitude: terminal.longitude,
      tone: 'terminal' as const,
    })),
    ...mockDB.rides
      .filter((ride) => ['matched', 'en-route', 'arrived', 'in-trip'].includes(ride.status))
      .map((ride) => ({
        id: `ride-${ride.id}`,
        label: `Active Ride ${ride.id.replace('ride-', '#')}`,
        description: mockDB.getTenantById(ride.tenantId)?.name ?? 'Unknown Tenant',
        latitude: ride.driverLocation?.latitude ?? ride.pickupLatitude,
        longitude: ride.driverLocation?.longitude ?? ride.pickupLongitude,
        tone: ride.driverLocation ? ('driver' as const) : ('ride' as const),
      })),
  ];

  return (
    <>
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <SidebarLayout title="Superadmin Menu" items={sidebarItems}>
          <div className="space-y-6">
            {/* Welcome */}
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
              <CardHeader>
                <CardTitle>Welcome to Platform Management</CardTitle>
                <CardDescription>Manage all regions, tenants, and platform settings</CardDescription>
              </CardHeader>
            </Card>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Regions</p>
                      <p className="text-3xl font-bold mt-1">{stats.totalRegions}</p>
                    </div>
                    <Globe className="h-8 w-8 text-primary/50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Tenants</p>
                      <p className="text-3xl font-bold mt-1">{stats.totalTenants}</p>
                    </div>
                    <Building2 className="h-8 w-8 text-primary/50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Users</p>
                      <p className="text-3xl font-bold mt-1">{stats.totalUsers}</p>
                    </div>
                    <Users className="h-8 w-8 text-primary/50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Rides</p>
                      <p className="text-3xl font-bold mt-1">{stats.totalRides}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-primary/50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Platform Coverage Map</CardTitle>
                <CardDescription>Regions, terminals, and live ride activity</CardDescription>
              </CardHeader>
              <CardContent>
                <MapView
                  points={platformMapPoints}
                  showRoute={false}
                  height="h-[400px]"
                />
              </CardContent>
            </Card>

            {/* Platform Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Overview</CardTitle>
                <CardDescription>System-wide metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">System Health</span>
                    <span className="text-sm font-bold">99.8%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-600" style={{ width: '99.8%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Tenant Activity</span>
                    <span className="text-sm font-bold">92%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: '92%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Revenue Target</span>
                    <span className="text-sm font-bold">78%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-600" style={{ width: '78%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <button className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors border border-muted">
                  <p className="font-medium text-sm">Add New Region</p>
                  <p className="text-xs text-muted-foreground">Register a new region</p>
                </button>
                <button className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors border border-muted">
                  <p className="font-medium text-sm">Create Tenant</p>
                  <p className="text-xs text-muted-foreground">Setup a new tenant</p>
                </button>
                <button className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors border border-muted">
                  <p className="font-medium text-sm">View Analytics</p>
                  <p className="text-xs text-muted-foreground">Platform-wide analytics</p>
                </button>
              </CardContent>
            </Card>
          </div>
        </SidebarLayout>
      </div>
    </>
  );
}

