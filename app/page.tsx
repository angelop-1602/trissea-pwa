'use client';

import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getHomeRouteForRole } from '@/lib/role-routes';

export default function HomePage() {
  const { currentUser } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.replace('/landing');
      return;
    }

    router.replace(getHomeRouteForRole(currentUser.role));
  }, [currentUser, router]);

  if (!currentUser) {
    return (
      <>
        <AppHeader showDevTools={false} />
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-primary mb-4">TRISSEA</h1>
            <p className="text-muted-foreground mb-8">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <main className="max-w-7xl mx-auto p-4 pb-20">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to TRISSEA</CardTitle>
              <CardDescription>Redirecting to your dashboard...</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You are being redirected to the {currentUser.role} dashboard.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
