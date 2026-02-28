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
  Phone,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { Ride } from '@prisma/client';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapView } from '@/components/map-view';
import { StatusBadge } from '@/components/status-badge';
import { InlineErrorState, PageLoadingState } from '@/components/page-state';
import { useStore } from '@/lib/store-context';
import { getDriverActiveRide, transitionRide } from '@/lib/booking/client';
import { useBookingRealtime } from '@/hooks/use-booking-realtime';
import { useDriverPresence } from '@/hooks/use-driver-presence';

type TransitionAction = 'start_heading' | 'arrive_pickup' | 'start_trip' | 'complete_trip' | 'driver_cancel';

interface TransitionConfig {
  action: TransitionAction;
  label: string;
  variant?: 'default' | 'outline';
  className?: string;
}

const STATUS_STEPS = ['matched', 'en_route', 'arrived', 'in_trip', 'completed'] as const;

export default function ActiveTripPage() {
  const { currentUser, currentTenant } = useStore();
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transitioningAction, setTransitioningAction] = useState<string | null>(null);
  const isLoadingRideRef = useRef(false);

  const isDriver = currentUser?.role === 'driver' && Boolean(currentTenant);
  useDriverPresence({ enabled: Boolean(isDriver) });

  const loadActiveRide = useCallback(async () => {
    if (!isDriver || isLoadingRideRef.current) return;

    isLoadingRideRef.current = true;
    try {
      const response = await getDriverActiveRide();
      setActiveRide(response.ride);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load active ride.');
    } finally {
      isLoadingRideRef.current = false;
      setLoading(false);
    }
  }, [isDriver]);

  useEffect(() => {
    void loadActiveRide();
  }, [loadActiveRide]);

  useBookingRealtime({
    enabled: Boolean(isDriver),
    onUpdate: (payload) => {
      if (payload.type === 'ride.updated') {
        void loadActiveRide();
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

  const handleTransition = async (action: TransitionAction) => {
    if (!activeRide) return;

    setTransitioningAction(action);
    setError(null);
    try {
      await transitionRide(activeRide.id, action);
      await loadActiveRide();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ride status.');
    } finally {
      setTransitioningAction(null);
    }
  };

  if (!currentUser || currentUser.role !== 'driver' || !currentTenant || loading) {
    return <PageLoadingState label="Loading active trip..." />;
  }

  const transitionButtons: TransitionConfig[] = !activeRide
    ? []
    : activeRide.status === 'matched'
      ? [
          { action: 'start_heading', label: 'Start Heading', className: 'bg-green-600 hover:bg-green-700' },
          { action: 'driver_cancel', label: 'Cancel Trip', variant: 'outline' },
        ]
      : activeRide.status === 'en_route'
        ? [
            { action: 'arrive_pickup', label: 'Arrived at Pickup', className: 'bg-green-600 hover:bg-green-700' },
            { action: 'driver_cancel', label: 'Cancel Trip', variant: 'outline' },
          ]
        : activeRide.status === 'arrived'
          ? [
              { action: 'start_trip', label: 'Start Trip', className: 'bg-green-600 hover:bg-green-700' },
              { action: 'driver_cancel', label: 'Cancel Trip', variant: 'outline' },
            ]
          : activeRide.status === 'in_trip'
            ? [{ action: 'complete_trip', label: 'Complete Trip', className: 'bg-green-600 hover:bg-green-700' }]
            : [];

  const stepIndex = activeRide ? STATUS_STEPS.indexOf(activeRide.status as (typeof STATUS_STEPS)[number]) : -1;

  return (
    <>
      <AppHeader />
      <div className="mx-auto max-w-7xl px-4 pb-8">
        <SidebarLayout title="Driver Menu" items={sidebarItems}>
          <div className="space-y-6">
            {error ? <InlineErrorState message={error} onRetry={() => void loadActiveRide()} /> : null}

            {!activeRide ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <h3 className="mb-1 font-semibold">No active trip</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    You currently have no active ride. Check assigned rides for new matches.
                  </p>
                  <Link href="/driver/offers">
                    <Button>Open Assigned Rides</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <>
                <MapView
                  pickupLocation={activeRide.pickupLocation}
                  dropoffLocation={activeRide.dropoffLocation}
                  driverLocation={
                    typeof activeRide.driverLatitude === 'number' && typeof activeRide.driverLongitude === 'number'
                      ? { latitude: activeRide.driverLatitude, longitude: activeRide.driverLongitude }
                      : undefined
                  }
                  pickupLat={activeRide.pickupLatitude}
                  pickupLon={activeRide.pickupLongitude}
                  dropoffLat={activeRide.dropoffLatitude}
                  dropoffLon={activeRide.dropoffLongitude}
                  height="h-96"
                />

                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg">Trip Progress</CardTitle>
                        <CardDescription>{activeRide.pickupLocation} to {activeRide.dropoffLocation}</CardDescription>
                      </div>
                      <StatusBadge status={activeRide.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      {STATUS_STEPS.map((step, index) => {
                        const isActive = stepIndex >= index;
                        return (
                          <div
                            key={step}
                            className={`rounded border px-2 py-1 text-center ${
                              isActive ? 'border-green-300 bg-green-50 text-green-700' : 'text-muted-foreground'
                            }`}
                          >
                            {step.replace('_', ' ')}
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div className="flex flex-col items-center rounded bg-muted/50 p-2">
                        <Navigation className="mb-1 h-4 w-4 text-primary" />
                        <span className="text-xs text-muted-foreground">{activeRide.distance}km</span>
                      </div>
                      <div className="flex flex-col items-center rounded bg-muted/50 p-2">
                        <Clock className="mb-1 h-4 w-4 text-primary" />
                        <span className="text-xs text-muted-foreground">{activeRide.estimatedDuration}m</span>
                      </div>
                      <div className="flex flex-col items-center rounded bg-muted/50 p-2">
                        <DollarSign className="mb-1 h-4 w-4 text-primary" />
                        <span className="text-xs font-medium">P{activeRide.fare}</span>
                      </div>
                      <div className="flex flex-col items-center rounded bg-muted/50 p-2">
                        <Users className="mb-1 h-4 w-4 text-primary" />
                        <span className="text-xs text-muted-foreground">1 pax</span>
                      </div>
                    </div>

                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <p className="mb-2 text-sm font-medium">Passenger</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Contact available in app</p>
                        <Button size="sm" variant="outline" className="gap-1" disabled>
                          <Phone className="h-3 w-3" />
                          Call
                        </Button>
                      </div>
                    </div>

                    {transitionButtons.length > 0 ? (
                      <div className={`grid gap-2 ${transitionButtons.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {transitionButtons.map((item) => (
                          <Button
                            key={item.action}
                            variant={item.variant ?? 'default'}
                            className={item.className}
                            size="sm"
                            disabled={transitioningAction !== null}
                            onClick={() => void handleTransition(item.action)}
                          >
                            {transitioningAction === item.action ? 'Updating...' : item.label}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No transition available for current status.</p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </SidebarLayout>
      </div>
    </>
  );
}
