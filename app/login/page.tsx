'use client';

import { useStore } from '@/lib/store-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { TenantSwitcher } from '@/components/tenant-switcher';
import { RoleSwitcher } from '@/components/role-switcher';

export default function LoginPage() {
  const { currentUser, currentTenant } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (currentUser) {
      router.replace('/');
    }
  }, [currentUser, router]);

  const handleLogin = () => {
    if (!currentUser) {
      return;
    }
    router.replace('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
              T
            </div>
          </div>
          <CardTitle className="text-2xl">TRISSEA</CardTitle>
          <CardDescription>Multi-tenant Tricycle Booking System</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Tenant:</label>
              <TenantSwitcher />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Select Role:</label>
              <RoleSwitcher />
            </div>
          </div>

          {currentTenant && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground mb-1">Current Selection:</p>
              <p className="text-sm font-medium">{currentTenant.name}</p>
              <p className="text-xs text-muted-foreground">Ready to proceed</p>
            </div>
          )}

          <Button onClick={handleLogin} className="w-full" size="lg" disabled={!currentUser}>
            {currentUser ? 'Continue to Dashboard' : 'Select Role to Continue'}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            This is a demo multi-tenant system. Use the switchers above to toggle between tenants and roles to observe tenant-specific branding and features.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
