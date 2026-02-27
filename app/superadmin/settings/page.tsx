'use client';

import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarChart3, Globe, Building2, Users, TrendingUp, Zap, Settings } from 'lucide-react';

export default function SuperadminSettingsPage() {
  const { currentUser } = useStore();

  if (!currentUser || currentUser.role !== 'superadmin') {
    return null;
  }

  const sidebarItems = [
    { href: '/superadmin/dashboard', label: 'Dashboard', icon: <BarChart3 className="h-4 w-4" /> },
    { href: '/superadmin/regions', label: 'Regions', icon: <Globe className="h-4 w-4" /> },
    { href: '/superadmin/tenants', label: 'Tenants', icon: <Building2 className="h-4 w-4" /> },
    { href: '/superadmin/branding', label: 'Branding', icon: <Zap className="h-4 w-4" /> },
    { href: '/superadmin/reports', label: 'Reports', icon: <TrendingUp className="h-4 w-4" /> },
    { href: '/superadmin/settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <>
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <SidebarLayout title="Superadmin Menu" items={sidebarItems}>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Platform Settings</h1>
              <p className="text-muted-foreground">Configure global platform settings</p>
            </div>

            {/* Commission Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Commission Settings</CardTitle>
                <CardDescription>Configure platform commission rates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Default Commission Rate (%)</label>
                  <Input defaultValue="10" type="number" min="0" max="100" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">On-Demand Ride Commission</label>
                  <Input defaultValue="10" type="number" min="0" max="100" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">TODA Queue Commission</label>
                  <Input defaultValue="5" type="number" min="0" max="100" />
                </div>
                <Button variant="outline">Save Commission Settings</Button>
              </CardContent>
            </Card>

            {/* System Settings */}
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Global system configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Platform Name</label>
                  <Input defaultValue="TRISSEA" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Support Email</label>
                  <Input defaultValue="support@trissea.com" type="email" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Support Phone</label>
                  <Input defaultValue="+63 1234 567890" />
                </div>
                <Button variant="outline">Save System Settings</Button>
              </CardContent>
            </Card>

            {/* Feature Toggles */}
            <Card>
              <CardHeader>
                <CardTitle>Feature Toggles</CardTitle>
                <CardDescription>Enable or disable platform features globally</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: 'On-Demand Booking', enabled: true },
                  { name: 'TODA Queue System', enabled: true },
                  { name: 'Real-Time Tracking', enabled: true },
                  { name: 'Wallet System', enabled: true },
                  { name: 'Driver Ratings', enabled: true },
                  { name: 'Promo Codes', enabled: false },
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                  >
                    <span className="text-sm font-medium">{feature.name}</span>
                    <button
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        feature.enabled
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {feature.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Session Timeout (minutes)</label>
                  <Input defaultValue="30" type="number" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Max Login Attempts</label>
                  <Input defaultValue="5" type="number" />
                </div>
                <Button variant="outline">Save Security Settings</Button>
              </CardContent>
            </Card>
          </div>
        </SidebarLayout>
      </div>
    </>
  );
}
