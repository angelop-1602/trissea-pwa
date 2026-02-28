'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, History, MapPinned, Wallet } from 'lucide-react';
import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { BottomNav } from '@/components/bottom-nav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getPassengerHomeData, type PassengerHomeData } from '@/lib/dashboard/client';
import { useBookingRealtime } from '@/hooks/use-booking-realtime';
import { InlineErrorState, PageLoadingState } from '@/components/page-state';
import { StatusBadge } from '@/components/status-badge';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(
    value
  );
}

export default function PassengerHomePage() {
  const { currentUser, currentTenant } = useStore();
  const [homeData, setHomeData] = useState<PassengerHomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const canLoad = currentUser?.role === 'passenger' && Boolean(currentTenant);

  const loadHomeData = useCallback(async () => {
    if (!canLoad || loadingRef.current) return;

    loadingRef.current = true;
    try {
      const response = await getPassengerHomeData();
      setHomeData(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [canLoad]);

  useEffect(() => {
    void loadHomeData();
  }, [loadHomeData]);

  useBookingRealtime({
    enabled: Boolean(canLoad),
    onUpdate: (payload) => {
      if (payload.type === 'ride.updated' || payload.type === 'reservation.updated' || payload.type === 'terminal.updated') {
        void loadHomeData();
      }
    },
  });

  const bottomNavItems = useMemo(
    () => [
      { href: '/passenger/home', icon: <MapPinned className="h-5 w-5" />, label: 'Home' },
      { href: '/passenger/on-demand', icon: <Wallet className="h-5 w-5" />, label: 'Book' },
      { href: '/passenger/todo', icon: <Clock className="h-5 w-5" />, label: 'TODA' },
      { href: '/passenger/history', icon: <History className="h-5 w-5" />, label: 'History' },
    ],
    []
  );

  if (!currentUser || currentUser.role !== 'passenger' || !currentTenant || loading) {
    return <PageLoadingState label="Loading passenger dashboard..." />;
  }

  const profile = homeData?.profile ?? {
    id: currentUser.id,
    name: currentUser.name,
    balance: currentUser.balance ?? 0,
    rating: currentUser.rating ?? 0,
    completedRides: currentUser.completedRides ?? 0,
  };

  const recentRides = homeData?.recentRides ?? [];
  const activeReservations = homeData?.activeReservations ?? [];

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-lg space-y-6 p-4 pb-24">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10">
          <CardHeader>
            <CardTitle className="text-lg">Welcome back, {profile.name}</CardTitle>
            <CardDescription>Your next trip is one tap away.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-background/50">
                <div className="text-2xl font-bold text-primary">{formatCurrency(profile.balance)}</div>
                <div className="text-xs text-muted-foreground">Wallet</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-background/50">
                <div className="text-2xl font-bold text-primary">{profile.rating.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Rating</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-background/50">
                <div className="text-2xl font-bold text-primary">{profile.completedRides}</div>
                <div className="text-xs text-muted-foreground">Rides</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link href="/passenger/on-demand">
                <Button className="w-full bg-primary" size="sm">
                  Book Now
                </Button>
              </Link>
              <Link href="/passenger/todo">
                <Button variant="outline" className="w-full" size="sm">
                  Queue at TODA
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {error ? <InlineErrorState message={error} onRetry={() => void loadHomeData()} /> : null}

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Active TODA Reservations</h2>
            <Link href="/passenger/todo">
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                Manage
              </Button>
            </Link>
          </div>
          {activeReservations.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-sm text-muted-foreground">No active reservation in queue.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {activeReservations.map((reservation) => (
                <Card key={reservation.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">
                          {reservation.TODATerminal?.name ?? 'Terminal'} - Queue #{reservation.queuePosition}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Boarding at{' '}
                          {new Date(reservation.boardingTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <StatusBadge status={reservation.status} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent Activity</h2>
            <Link href="/passenger/history">
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                View All
              </Button>
            </Link>
          </div>
          {recentRides.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-sm text-muted-foreground">No recent rides yet.</p>
                <Link href="/passenger/on-demand" className="mt-3 inline-flex">
                  <Button size="sm">
                    Book your first ride <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentRides.map((ride) => (
                <Card key={ride.id}>
                  <CardContent className="space-y-2 pt-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{ride.pickupLocation}</p>
                        <p className="text-xs text-muted-foreground">to {ride.dropoffLocation}</p>
                      </div>
                      <StatusBadge status={ride.status} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {ride.distance} km • {formatCurrency(ride.fare)}
                      </span>
                      <span>{new Date(ride.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav items={bottomNavItems} />
    </>
  );
}
