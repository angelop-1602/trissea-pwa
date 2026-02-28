'use client';

import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockDB } from '@/lib/mock-db';
import { BarChart3, Globe, Building2, Users, TrendingUp, Zap, Settings, Palette } from 'lucide-react';

export default function SuperadminBrandingPage() {
  const { currentUser, getTenantBranding } = useStore();

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

  const branding = getTenantBranding();

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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Branding Customization
                </CardTitle>
                <CardDescription>Configure colors and logos for each tenant</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Color Preview */}
                <div>
                  <h3 className="font-semibold text-sm mb-4">Color Scheme Preview</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-6 rounded-lg border flex flex-col gap-2">
                      <label className="text-xs font-medium text-muted-foreground">PRIMARY COLOR</label>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-12 w-12 rounded border"
                          style={{ backgroundColor: branding.primaryColor || '#14622e' }}
                        />
                        <Input value={branding.primaryColor || '#14622e'} className="flex-1" />
                      </div>
                    </div>

                    <div className="p-6 rounded-lg border flex flex-col gap-2">
                      <label className="text-xs font-medium text-muted-foreground">ACCENT COLOR</label>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-12 w-12 rounded border"
                          style={{ backgroundColor: branding.accentColor || '#fecc04' }}
                        />
                        <Input value={branding.accentColor || '#fecc04'} className="flex-1" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Logo Upload */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">Logo</h3>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <div className="h-20 w-20 bg-muted rounded-lg flex items-center justify-center mx-auto mb-3">
                      {branding.logo ? (
                        <img src={branding.logo} alt="Logo" className="h-full w-full object-contain" />
                      ) : (
                        <Zap className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Upload or drag and drop a logo</p>
                    <Button variant="outline" size="sm">
                      Choose File
                    </Button>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">Feature Flags</h3>
                  <div className="space-y-2">
                    {[
                      { label: 'On-Demand Booking', enabled: true },
                      { label: 'TODA Queue System', enabled: true },
                      { label: 'Driver Offers', enabled: true },
                      { label: 'Real-Time Tracking', enabled: true },
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                        <span className="text-sm font-medium">{feature.label}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          feature.enabled
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
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

            {/* Tenant-Specific Overrides */}
            <Card>
              <CardHeader>
                <CardTitle>Tenant-Specific Overrides</CardTitle>
                <CardDescription>Each tenant can override global branding</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockDB.tenants.map((tenant) => (
                    <div key={tenant.id} className="p-3 rounded-lg bg-muted/50 border flex items-center justify-between">
                      <span className="font-medium text-sm">{tenant.name}</span>
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

