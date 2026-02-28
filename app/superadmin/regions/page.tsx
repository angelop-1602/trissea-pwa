'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Globe, Building2, Users, TrendingUp, Zap, Settings, MapPin } from 'lucide-react';
import { getSuperadminRegionsData, type SuperadminRegionsData } from '@/lib/dashboard/client';

export default function SuperadminRegionsPage() {
  const { currentUser } = useStore();
  const [data, setData] = useState<SuperadminRegionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const canLoad = currentUser?.role === 'superadmin';

  const loadData = useCallback(async () => {
    if (!canLoad || loadingRef.current) return;
    loadingRef.current = true;
    try {
      const response = await getSuperadminRegionsData();
      setData(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load regions.');
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [canLoad]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (!currentUser || currentUser.role !== 'superadmin' || loading) {
    return (
      <div className="min-h-[30vh] flex items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  const sidebarItems = useMemo(
    () => [
      { href: '/superadmin/dashboard', label: 'Dashboard', icon: <BarChart3 className="h-4 w-4" /> },
      { href: '/superadmin/regions', label: 'Regions', icon: <Globe className="h-4 w-4" /> },
      { href: '/superadmin/tenants', label: 'Tenants', icon: <Building2 className="h-4 w-4" /> },
      { href: '/superadmin/branding', label: 'Branding', icon: <Zap className="h-4 w-4" /> },
      { href: '/superadmin/reports', label: 'Reports', icon: <TrendingUp className="h-4 w-4" /> },
      { href: '/superadmin/settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
    ],
    []
  );

  const regions = data?.regions ?? [];

  return (
    <>
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <SidebarLayout title="Superadmin Menu" items={sidebarItems}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Regions Management</h1>
                <p className="text-muted-foreground">Manage all geographic regions</p>
              </div>
              <Button className="bg-primary">Add Region</Button>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="space-y-3">
              {regions.map((region) => (
                <Card key={region.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-lg">{region.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{region.country}</p>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Tenants</p>
                            <p className="text-lg font-bold">{region.tenantCount}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Provinces</p>
                            <p className="text-lg font-bold">{region.provinces.length}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <p className="text-lg font-bold text-green-600">{region.status}</p>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </SidebarLayout>
      </div>
    </>
  );
}
