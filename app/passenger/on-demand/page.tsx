'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { BottomNav } from '@/components/bottom-nav';
import { MapView } from '@/components/map-view';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import {
  Map,
  MapControls,
  MapMarker,
  MapRoute,
  MarkerContent,
  MarkerTooltip,
  type MapRef,
} from '@/components/ui/map';
import type { MapMouseEvent } from 'maplibre-gl';
import {
  cancelOnDemandRide,
  createOnDemand,
  getPassengerActiveRide,
  quoteOnDemand,
} from '@/lib/booking/client';
import { useBookingRealtime } from '@/hooks/use-booking-realtime';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  MapPin,
  MapPinOff,
  Navigation,
  Phone,
  Star,
} from 'lucide-react';
import type { Ride } from '@prisma/client';
import { InlineErrorState, PageLoadingState } from '@/components/page-state';
import { Progress } from '@/components/ui/progress';

const MAP_CENTER: [number, number] = [121.0244, 14.5547];

function markerLabel(point: { latitude: number; longitude: number }) {
  return `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`;
}

export default function OnDemandBookingPage() {
  const { currentUser, currentTenant } = useStore();
  const [mapInstance, setMapInstance] = useState<MapRef | null>(null);

  const [pickup, setPickup] = useState<{ latitude: number; longitude: number } | null>(null);
  const [dropoff, setDropoff] = useState<{ latitude: number; longitude: number } | null>(null);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [quote, setQuote] = useState<{
    totalFare: number;
    distanceKm: number;
    estimatedDurationMin: number;
    routeCoordinates: [number, number][];
  } | null>(null);
  const [loadingActiveRide, setLoadingActiveRide] = useState(true);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRideRef = useRef(false);

  const canBook = currentUser?.role === 'passenger' && currentTenant;

  const loadActiveRide = useCallback(async () => {
    if (!canBook || isLoadingRideRef.current) return;

    isLoadingRideRef.current = true;

    try {
      const { ride } = await getPassengerActiveRide();
      setActiveRide(ride);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load active ride.');
    } finally {
      isLoadingRideRef.current = false;
      setLoadingActiveRide(false);
    }
  }, [canBook]);

  useEffect(() => {
    void loadActiveRide();
  }, [loadActiveRide]);

  useBookingRealtime({
    enabled: Boolean(canBook),
    onUpdate: (payload) => {
      if (payload.type === 'ride.updated') {
        void loadActiveRide();
      }
    },
  });

  useEffect(() => {
    if (!activeRide) return;

    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      void loadActiveRide();
    }, 30000);

    return () => clearInterval(timer);
  }, [activeRide, loadActiveRide]);

  useEffect(() => {
    const map = mapInstance;
    if (!map || activeRide) return;

    const handleClick = (event: MapMouseEvent) => {
      const point = { latitude: event.lngLat.lat, longitude: event.lngLat.lng };

      if (!pickup) {
        setPickup(point);
        setError(null);
        return;
      }

      setDropoff(point);
      setError(null);
      setQuote(null);
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [activeRide, mapInstance, pickup]);

  const bottomNavItems = useMemo(
    () => [
      { href: '/passenger/home', icon: <MapPinOff className="h-5 w-5" />, label: 'Home' },
      { href: '/passenger/on-demand', icon: <MapPin className="h-5 w-5" />, label: 'Book' },
      { href: '/passenger/todo', icon: <Clock className="h-5 w-5" />, label: 'TODA' },
      { href: '/passenger/history', icon: <Star className="h-5 w-5" />, label: 'History' },
    ],
    []
  );

  const getQuote = async () => {
    if (!pickup || !dropoff) return;

    setIsQuoting(true);
    setError(null);

    try {
      const response = await quoteOnDemand({
        pickup,
        dropoff,
        pickupLabel: `Pinned pickup (${markerLabel(pickup)})`,
        dropoffLabel: `Pinned dropoff (${markerLabel(dropoff)})`,
      });

      setQuote({
        totalFare: response.fare.totalFare,
        distanceKm: response.fare.distanceKm,
        estimatedDurationMin: response.fare.estimatedDurationMin,
        routeCoordinates: response.routeCoordinates,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate quote.');
    } finally {
      setIsQuoting(false);
    }
  };

  const confirmBooking = async () => {
    if (!pickup || !dropoff) return;

    setIsBooking(true);
    setError(null);

    try {
      const { ride } = await createOnDemand({
        pickup,
        dropoff,
        pickupLabel: `Pinned pickup (${markerLabel(pickup)})`,
        dropoffLabel: `Pinned dropoff (${markerLabel(dropoff)})`,
      });

      setActiveRide(ride);
      setQuote(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking.');
    } finally {
      setIsBooking(false);
    }
  };

  const cancelBooking = async () => {
    if (!activeRide) return;

    setIsCancelling(true);
    setError(null);

    try {
      await cancelOnDemandRide(activeRide.id);
      setActiveRide(null);
      resetPins();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking.');
    } finally {
      setIsCancelling(false);
    }
  };

  const resetPins = () => {
    setPickup(null);
    setDropoff(null);
    setQuote(null);
    setError(null);
  };

  if (!currentUser || currentUser.role !== 'passenger' || !currentTenant || loadingActiveRide) {
    return <PageLoadingState label="Loading booking screen..." />;
  }

  const bookingProgress = quote ? 100 : dropoff ? 66 : pickup ? 33 : 0;
  const canCancel = Boolean(activeRide && ['searching', 'matched', 'en_route'].includes(activeRide.status));
  const rideSubtitle =
    activeRide?.status === 'searching'
      ? 'Searching for nearby drivers.'
      : activeRide?.status === 'matched'
        ? 'Driver assigned. Driver can start heading any moment.'
        : activeRide?.status === 'en_route'
          ? 'Driver is heading to your pickup.'
          : activeRide?.status === 'arrived'
            ? 'Driver arrived at pickup.'
            : activeRide?.status === 'in_trip'
              ? 'Trip is in progress.'
              : 'Ride status updated.';

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-lg space-y-4 p-4 pb-24">
        {!activeRide ? (
          <Card>
            <CardHeader>
              <CardTitle>On-demand booking</CardTitle>
              <CardDescription>Tap once for pickup and tap again for dropoff.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Progress value={bookingProgress} />
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div
                    className={`rounded-md border px-2 py-1 ${pickup ? 'border-green-300 bg-green-50 text-green-700' : 'text-muted-foreground'}`}
                  >
                    {pickup ? <CheckCircle2 className="mx-auto mb-0.5 h-3 w-3" /> : null}
                    Pickup
                  </div>
                  <div
                    className={`rounded-md border px-2 py-1 ${dropoff ? 'border-green-300 bg-green-50 text-green-700' : 'text-muted-foreground'}`}
                  >
                    {dropoff ? <CheckCircle2 className="mx-auto mb-0.5 h-3 w-3" /> : null}
                    Dropoff
                  </div>
                  <div
                    className={`rounded-md border px-2 py-1 ${quote ? 'border-green-300 bg-green-50 text-green-700' : 'text-muted-foreground'}`}
                  >
                    {quote ? <CheckCircle2 className="mx-auto mb-0.5 h-3 w-3" /> : null}
                    Quote
                  </div>
                </div>
              </div>

              <div className="h-72 overflow-hidden rounded-xl border border-slate-200">
                <Map
                  ref={(instance) => {
                    setMapInstance(instance);
                  }}
                  center={MAP_CENTER}
                  zoom={13}
                  className="h-full w-full"
                  attributionControl={false}
                >
                  <MapControls position="bottom-right" showZoom showLocate showFullscreen />

                  {pickup ? (
                    <MapMarker longitude={pickup.longitude} latitude={pickup.latitude}>
                      <MarkerContent>
                        <div className="h-3.5 w-3.5 rounded-full border-2 border-white bg-sky-500 shadow" />
                      </MarkerContent>
                      <MarkerTooltip>Pickup</MarkerTooltip>
                    </MapMarker>
                  ) : null}

                  {dropoff ? (
                    <MapMarker longitude={dropoff.longitude} latitude={dropoff.latitude}>
                      <MarkerContent>
                        <div className="h-3.5 w-3.5 rounded-full border-2 border-white bg-slate-700 shadow" />
                      </MarkerContent>
                      <MarkerTooltip>Dropoff</MarkerTooltip>
                    </MapMarker>
                  ) : null}

                  {quote?.routeCoordinates && quote.routeCoordinates.length >= 2 ? (
                    <MapRoute coordinates={quote.routeCoordinates} color="#14622e" width={4} opacity={0.75} />
                  ) : null}
                </Map>
              </div>

              <div className="space-y-1 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                <p>Pickup: {pickup ? markerLabel(pickup) : 'Tap map to set pickup'}</p>
                <p>Dropoff: {dropoff ? markerLabel(dropoff) : 'Tap map again to set dropoff'}</p>
              </div>

              {quote ? (
                <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Distance</p>
                    <p className="text-sm font-medium">{quote.distanceKm} km</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ETA</p>
                    <p className="text-sm font-medium">{quote.estimatedDurationMin} min</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fare</p>
                    <p className="text-sm font-medium">P{quote.totalFare}</p>
                  </div>
                </div>
              ) : null}

              {error ? <InlineErrorState message={error} onRetry={() => void getQuote()} /> : null}

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => void getQuote()} disabled={!pickup || !dropoff || isQuoting}>
                  {isQuoting ? 'Calculating...' : 'Get Fare Quote'}
                </Button>
                <Button variant="outline" onClick={resetPins} disabled={isQuoting || isBooking}>
                  Reset Pins
                </Button>
              </div>

              <Button
                className="w-full bg-primary"
                onClick={() => void confirmBooking()}
                disabled={!pickup || !dropoff || !quote || isBooking}
              >
                {isBooking ? 'Confirming booking...' : 'Confirm Booking'}
                {!isBooking ? <ArrowRight className="ml-1 h-4 w-4" /> : null}
              </Button>
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
              height="h-72"
            />

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">Active ride</CardTitle>
                    <CardDescription className="text-xs">{rideSubtitle}</CardDescription>
                  </div>
                  <StatusBadge status={activeRide.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <p className="font-medium">{activeRide.pickupLocation}</p>
                  <p className="text-xs text-muted-foreground">to {activeRide.dropoffLocation}</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 rounded bg-muted/50">
                    <Navigation className="h-4 w-4 text-primary mx-auto mb-1" />
                    <div className="text-xs text-muted-foreground">{activeRide.distance}km</div>
                  </div>
                  <div className="text-center p-2 rounded bg-muted/50">
                    <Clock className="h-4 w-4 text-primary mx-auto mb-1" />
                    <div className="text-xs text-muted-foreground">{activeRide.estimatedDuration}min</div>
                  </div>
                  <div className="text-center p-2 rounded bg-muted/50">
                    <DollarSign className="h-4 w-4 text-primary mx-auto mb-1" />
                    <div className="text-xs font-medium">P{activeRide.fare}</div>
                  </div>
                </div>

                {activeRide.driverId && activeRide.status !== 'searching' ? (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">Driver Assigned</p>
                        <p className="text-xs text-muted-foreground">Your driver is on the way</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="w-full text-xs h-8">
                      <Phone className="h-3 w-3 mr-1" />
                      Contact Driver
                    </Button>
                  </div>
                ) : null}

                {error ? <InlineErrorState message={error} onRetry={() => void loadActiveRide()} /> : null}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => void cancelBooking()}
                  disabled={isCancelling || !canCancel}
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
                </Button>
                {!canCancel ? (
                  <p className="text-center text-xs text-muted-foreground">
                    Passenger cancel is allowed before trip start only.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <BottomNav items={bottomNavItems} />
    </>
  );
}
