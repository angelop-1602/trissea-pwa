'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarChart3, Globe, Building2, TrendingUp, Zap, Settings, Palette } from 'lucide-react';
import { getSuperadminBrandingData, type SuperadminBrandingData } from '@/lib/dashboard/client';

export default function SuperadminBrandingPage() {
  const { currentUser } = useStore();
  const [data, setData] = useState<SuperadminBrandingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const canLoad = currentUser?.role === 'superadmin';

  const loadData = useCallback(async () => {
    if (!canLoad || loadingRef.current) return;
    loadingRef.current = true;
    try {
      const response = await getSuperadminBrandingData();
      setData(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load branding data.');
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

  const defaults = data?.defaults ?? {
    primaryColor: '#14622e',
    accentColor: '#fecc04',
  };
  const tenants = data?.tenants ?? [];
  const featureFlags = data?.featureFlags ?? [];

  return (
    <>
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <SidebarLayout title="Superadmin Menu" items={sidebarItems}>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Tenant Branding</h1>
              <p className="text-muted-foreground">Customize tenant appearance and colors</p>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Branding Customization
                </CardTitle>
                <CardDescription>Configure default colors and logo policies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-sm mb-4">Default Color Scheme</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-6 rounded-lg border flex flex-col gap-2">
                      <label className="text-xs font-medium text-muted-foreground">PRIMARY COLOR</label>
                      <div className="flex items-center gap-2">
                        <div className="h-12 w-12 rounded border" style={{ backgroundColor: defaults.primaryColor }} />
                        <Input value={defaults.primaryColor} readOnly className="flex-1" />
                      </div>
                    </div>

                    <div className="p-6 rounded-lg border flex flex-col gap-2">
                      <label className="text-xs font-medium text-muted-foreground">ACCENT COLOR</label>
                      <div className="flex items-center gap-2">
                        <div className="h-12 w-12 rounded border" style={{ backgroundColor: defaults.accentColor }} />
                        <Input value={defaults.accentColor} readOnly className="flex-1" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-sm mb-3">Feature Flags</h3>
                  <div className="space-y-2">
                    {featureFlags.map((feature, index) => (
                      <div key={`${feature.label}-${index}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                        <span className="text-sm font-medium">{feature.label}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${feature.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {feature.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button className="bg-primary" size="lg">
                  Save Branding Changes
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tenant-Specific Overrides</CardTitle>
                <CardDescription>Each tenant can override global branding</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tenants.map((tenant) => (
                    <div key={tenant.id} className="p-3 rounded-lg bg-muted/50 border flex items-center justify-between">
                      <div>
                        <span className="font-medium text-sm">{tenant.name}</span>
                        <p className="text-xs text-muted-foreground">
                          Primary: {tenant.primaryColor ?? defaults.primaryColor} | Accent: {tenant.accentColor ?? defaults.accentColor}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarLayout>
      </div>
    </>
  );
}
