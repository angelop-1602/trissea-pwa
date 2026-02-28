'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Clock, History, MapPin, Navigation, Star, Wallet } from 'lucide-react';
import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { BottomNav } from '@/components/bottom-nav';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { InlineErrorState, PageLoadingState } from '@/components/page-state';
import { getPassengerHistoryData, type PassengerHistoryData } from '@/lib/dashboard/client';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(
    value
  );
}

export default function PassengerHistoryPage() {
  const { currentUser, currentTenant } = useStore();
  const [historyData, setHistoryData] = useState<PassengerHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const canLoad = currentUser?.role === 'passenger' && Boolean(currentTenant);

  const loadHistory = useCallback(async () => {
    if (!canLoad || loadingRef.current) return;

    loadingRef.current = true;
    try {
      const response = await getPassengerHistoryData();
      setHistoryData(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history.');
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [canLoad]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const bottomNavItems = useMemo(
    () => [
      { href: '/passenger/home', icon: <MapPin className="h-5 w-5" />, label: 'Home' },
      { href: '/passenger/on-demand', icon: <Clock className="h-5 w-5" />, label: 'Book' },
      { href: '/passenger/todo', icon: <Star className="h-5 w-5" />, label: 'TODA' },
      { href: '/passenger/history', icon: <History className="h-5 w-5" />, label: 'History' },
    ],
    []
  );

  if (!currentUser || currentUser.role !== 'passenger' || !currentTenant || loading) {
    return <PageLoadingState label="Loading ride history..." />;
  }

  const rides = historyData?.rides ?? [];
  const completedRides = rides.filter((ride) => ride.status === 'completed' || ride.status === 'cancelled');
  const stats = historyData?.stats ?? {
    totalRides: currentUser.completedRides ?? 0,
    totalSpent: 0,
    averageRating: currentUser.rating ?? 0,
  };

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-lg space-y-4 p-4 pb-24">
        <section className="grid grid-cols-3 gap-2">
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-lg font-bold text-primary">{stats.totalRides}</div>
              <div className="text-[11px] text-muted-foreground">Total Rides</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-lg font-bold text-primary">{formatCurrency(stats.totalSpent)}</div>
              <div className="text-[11px] text-muted-foreground">Total Spent</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-lg font-bold text-primary">{stats.averageRating.toFixed(1)}</div>
              <div className="text-[11px] text-muted-foreground">Rating</div>
            </CardContent>
          </Card>
        </section>

        {error ? <InlineErrorState message={error} onRetry={() => void loadHistory()} /> : null}

        <section className="space-y-3">
          <h2 className="font-semibold">Ride History</h2>
          {completedRides.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No completed rides yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {completedRides.map((ride) => (
                <Card key={ride.id}>
                  <CardContent className="space-y-3 pt-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{ride.pickupLocation}</p>
                        <p className="text-xs text-muted-foreground">to {ride.dropoffLocation}</p>
                      </div>
                      <StatusBadge status={ride.status} />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center gap-1 rounded bg-muted/50 p-2 text-muted-foreground">
                        <Navigation className="h-3.5 w-3.5 text-primary" />
                        <span>{ride.distance} km</span>
                      </div>
                      <div className="flex items-center gap-1 rounded bg-muted/50 p-2 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        <span>{ride.estimatedDuration} min</span>
                      </div>
                      <div className="flex items-center gap-1 rounded bg-muted/50 p-2">
                        <Wallet className="h-3.5 w-3.5 text-primary" />
                        <span className="font-medium">{formatCurrency(ride.fare)}</span>
                      </div>
                    </div>

                    {ride.completedAt ? (
                      <p className="text-xs text-muted-foreground">
                        {new Date(ride.completedAt).toLocaleDateString()} at{' '}
                        {new Date(ride.completedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    ) : null}
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
