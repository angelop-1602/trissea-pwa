'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Clock,
  DollarSign,
  FileText,
  MapPin,
  Navigation,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { Ride } from '@prisma/client';
import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { StatusBadge } from '@/components/status-badge';
import { InlineErrorState, PageLoadingState } from '@/components/page-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBookingRealtime } from '@/hooks/use-booking-realtime';
import { useDriverPresence } from '@/hooks/use-driver-presence';
import { getDriverAssignedRides } from '@/lib/booking/client';

export default function DriverOffersPage() {
  const { currentUser, currentTenant } = useStore();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRidesRef = useRef(false);

  const isDriver = currentUser?.role === 'driver' && Boolean(currentTenant);
  useDriverPresence({ enabled: Boolean(isDriver) });

  const loadAssignedRides = useCallback(async () => {
    if (!isDriver || isLoadingRidesRef.current) return;

    isLoadingRidesRef.current = true;
    try {
      const response = await getDriverAssignedRides();
      setRides(response.rides);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assigned rides.');
    } finally {
      isLoadingRidesRef.current = false;
      setLoading(false);
    }
  }, [isDriver]);

  useEffect(() => {
    void loadAssignedRides();
  }, [loadAssignedRides]);

  useBookingRealtime({
    enabled: Boolean(isDriver),
    onUpdate: (payload) => {
      if (payload.type === 'ride.updated') {
        void loadAssignedRides();
      }
    },
  });

  const sidebarItems = useMemo(
    () => [
      { href: '/driver/dashboard', label: 'Dashboard', icon: <MapPin className="h-4 w-4" /> },
      { href: '/driver/offers', label: 'Assigned Rides', icon: <Users className="h-4 w-4" /> },
      { href: '/driver/active-trip', label: 'Active Trip', icon: <TrendingUp className="h-4 w-4" /> },
      { href: '/driver/earnings', label: 'Earnings', icon: <DollarSign className="h-4 w-4" /> },
      { href: '/driver/history', label: 'History', icon: <FileText className="h-4 w-4" /> },
    ],
    []
  );

  if (!currentUser || currentUser.role !== 'driver' || !currentTenant || loading) {
    return <PageLoadingState label="Loading assigned rides..." />;
  }

  return (
    <>
      <AppHeader />
      <div className="mx-auto max-w-7xl px-4 pb-8">
        <SidebarLayout title="Driver Menu" items={sidebarItems}>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Assigned Rides</CardTitle>
                <CardDescription>On-demand rides are auto-assigned while you are online.</CardDescription>
              </CardHeader>
            </Card>

            {error ? <InlineErrorState message={error} onRetry={() => void loadAssignedRides()} /> : null}

            {rides.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <h3 className="mb-1 font-semibold">No assigned rides right now</h3>
                  <p className="text-sm text-muted-foreground">
                    Keep your duty online. New assignments appear here automatically.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {rides.map((ride) => (
                  <Card key={ride.id}>
                    <CardContent className="space-y-3 pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{ride.pickupLocation}</p>
                          <p className="text-xs text-muted-foreground">to {ride.dropoffLocation}</p>
                        </div>
                        <StatusBadge status={ride.status} />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center rounded bg-muted/50 p-2">
                          <Navigation className="mb-0.5 h-3.5 w-3.5 text-primary" />
                          <span className="text-xs text-muted-foreground">{ride.distance}km</span>
                        </div>
                        <div className="flex flex-col items-center rounded bg-muted/50 p-2">
                          <Clock className="mb-0.5 h-3.5 w-3.5 text-primary" />
                          <span className="text-xs text-muted-foreground">{ride.estimatedDuration}m</span>
                        </div>
                        <div className="flex flex-col items-center rounded bg-muted/50 p-2">
                          <DollarSign className="mb-0.5 h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-medium">P{ride.fare}</span>
                        </div>
                      </div>

                      <Link href="/driver/active-trip" className="block">
                        <Button className="w-full" size="sm">
                          Open Active Trip
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </SidebarLayout>
      </div>
    </>
  );
}
