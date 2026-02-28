'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Building2, Clock, MapPin, Star, Users } from 'lucide-react';
import type { TODATerminal } from '@prisma/client';
import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { BottomNav } from '@/components/bottom-nav';
import { PageLoadingState, InlineErrorState } from '@/components/page-state';
import { StatusBadge } from '@/components/status-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  cancelTodaReservation,
  createTodaReservation,
  getMyTodaReservations,
  getTodaTerminals,
  type ReservationWithTerminal,
} from '@/lib/booking/client';
import { useBookingRealtime } from '@/hooks/use-booking-realtime';

export default function TODAQueuePage() {
  const { currentUser, currentTenant } = useStore();
  const [selectedTerminalId, setSelectedTerminalId] = useState<string | null>(null);
  const [terminals, setTerminals] = useState<TODATerminal[]>([]);
  const [reservations, setReservations] = useState<ReservationWithTerminal[]>([]);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [cancellingReservationId, setCancellingReservationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isLoadingDataRef = useRef(false);

  const canLoad = currentUser?.role === 'passenger' && currentTenant;

  const loadData = useCallback(async () => {
    if (!canLoad || isLoadingDataRef.current) return;

    isLoadingDataRef.current = true;

    try {
      const [terminalsResponse, reservationsResponse] = await Promise.all([
        getTodaTerminals(),
        getMyTodaReservations(),
      ]);

      setTerminals(terminalsResponse.terminals);
      setReservations(reservationsResponse.reservations);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load TODA data.');
    } finally {
      isLoadingDataRef.current = false;
      setLoading(false);
    }
  }, [canLoad]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useBookingRealtime({
    enabled: Boolean(canLoad),
    onUpdate: (payload) => {
      if (payload.type === 'reservation.updated' || payload.type === 'terminal.updated') {
        void loadData();
      }
    },
  });

  const selectedTerminal = terminals.find((terminal) => terminal.id === selectedTerminalId) ?? null;

  const activeReservations = useMemo(
    () => reservations.filter((reservation) => ['confirmed', 'arrived'].includes(reservation.status)),
    [reservations]
  );

  const reserveSpot = async () => {
    if (!selectedTerminal) return;

    setReserving(true);
    setError(null);

    try {
      await createTodaReservation(selectedTerminal.id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reserve queue spot.');
    } finally {
      setReserving(false);
    }
  };

  const cancelReservation = async (reservationId: string) => {
    setCancellingReservationId(reservationId);
    setError(null);

    try {
      await cancelTodaReservation(reservationId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel reservation.');
    } finally {
      setCancellingReservationId(null);
    }
  };

  const bottomNavItems = useMemo(
    () => [
      { href: '/passenger/home', icon: <Users className="h-5 w-5" />, label: 'Home' },
      { href: '/passenger/on-demand', icon: <Clock className="h-5 w-5" />, label: 'Book' },
      { href: '/passenger/todo', icon: <MapPin className="h-5 w-5" />, label: 'TODA' },
      { href: '/passenger/history', icon: <Star className="h-5 w-5" />, label: 'History' },
    ],
    []
  );

  if (!currentUser || currentUser.role !== 'passenger' || !currentTenant || loading) {
    return <PageLoadingState label="Loading TODA terminals..." />;
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-lg space-y-4 p-4 pb-24">
        {!selectedTerminal ? (
          <>
            {error ? <InlineErrorState message={error} onRetry={() => void loadData()} /> : null}

            {activeReservations.length > 0 ? (
              <section className="space-y-3">
                <h2 className="font-semibold">Your Active Reservations</h2>
                <div className="space-y-2">
                  {activeReservations.map((reservation) => (
                    <Card key={reservation.id}>
                      <CardContent className="space-y-2 pt-4">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">{reservation.TODATerminal.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Queue Position: #{reservation.queuePosition}
                            </p>
                          </div>
                          <StatusBadge status={reservation.status} />
                        </div>
                        {reservation.status === 'confirmed' ? (
                          <Button
                            variant="outline"
                            className="w-full"
                            size="sm"
                            onClick={() => void cancelReservation(reservation.id)}
                            disabled={cancellingReservationId === reservation.id}
                          >
                            {cancellingReservationId === reservation.id ? 'Cancelling...' : 'Cancel Reservation'}
                          </Button>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="space-y-3">
              <h2 className="font-semibold">Queue at TODA Terminals</h2>
              {terminals.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center">
                    <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No TODA terminals available yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {terminals.map((terminal) => (
                    <Card
                      key={terminal.id}
                      className="cursor-pointer transition hover:shadow-md"
                      onClick={() => setSelectedTerminalId(terminal.id)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">{terminal.name}</p>
                            <p className="text-xs text-muted-foreground">{terminal.location}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Capacity: {terminal.currentQueued}/{terminal.capacity}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">{terminal.currentQueued}</div>
                            <div className="text-xs text-muted-foreground">in queue</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => setSelectedTerminalId(null)} className="h-8 text-sm">
              Back to Terminals
            </Button>

            <Card className="border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10">
              <CardHeader>
                <CardTitle className="text-lg">{selectedTerminal.name}</CardTitle>
                <CardDescription>{selectedTerminal.location}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-background/50 p-3">
                    <div className="text-2xl font-bold text-primary">{selectedTerminal.currentQueued}</div>
                    <div className="text-xs text-muted-foreground">Currently queued</div>
                  </div>
                  <div className="rounded-lg bg-background/50 p-3">
                    <div className="text-2xl font-bold text-primary">{selectedTerminal.capacity}</div>
                    <div className="text-xs text-muted-foreground">Capacity</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Queue Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Average wait time</p>
                    <p className="text-xs text-muted-foreground">15-20 minutes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Estimated queue position</p>
                    <p className="text-xs text-muted-foreground">#{selectedTerminal.currentQueued + 1}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {error ? <InlineErrorState message={error} onRetry={() => void loadData()} /> : null}

            <div className="space-y-2">
              <Button className="w-full bg-primary" size="lg" onClick={() => void reserveSpot()} disabled={reserving}>
                {reserving ? 'Reserving...' : 'Reserve Spot in Queue'}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setSelectedTerminalId(null)}>
                View Other Terminals
              </Button>
            </div>
          </>
        )}
      </main>

      <BottomNav items={bottomNavItems} />
    </>
  );
}
