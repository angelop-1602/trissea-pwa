'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { BottomNav } from '@/components/bottom-nav';
import { MapView } from '@/components/map-view';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/status-badge';
import { MapPin, MapPinOff, Clock, DollarSign, Navigation, Phone, Star } from 'lucide-react';

export default function OnDemandBookingPage() {
  const { currentUser, currentTenant, rides } = useStore();
  const [pickupLocation, setPickupLocation] = useState('Makati Medical Center');
  const [dropoffLocation, setDropoffLocation] = useState('SM Makati');
  const [activeRideId, setActiveRideId] = useState<string | null>(null);

  if (!currentUser || currentUser.role !== 'passenger' || !currentTenant) {
    return null;
  }

  const tenantRides = rides.filter((r) => r.tenantId === currentTenant.id && r.rideType === 'on-demand');
  const activeRide = tenantRides.find((r) => r.id === activeRideId) || tenantRides[0];

  const bottomNavItems = [
    { href: '/passenger/home', icon: <MapPinOff className="h-5 w-5" />, label: 'Home' },
    { href: '/passenger/on-demand', icon: <MapPin className="h-5 w-5" />, label: 'Book' },
    { href: '/passenger/todo', icon: <Clock className="h-5 w-5" />, label: 'TODA' },
    { href: '/passenger/history', icon: <Star className="h-5 w-5" />, label: 'History' },
  ];

  const handleBookRide = () => {
    setActiveRideId(tenantRides[0]?.id || null);
  };

  if (!activeRide) {
    return (
      <>
        <AppHeader />
        <main className="max-w-lg mx-auto p-4 pb-24">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Request a Ride</CardTitle>
              <CardDescription>Enter your pickup and dropoff locations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Pickup Location</label>
                <Input
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="Where are you?"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Dropoff Location</label>
                <Input
                  value={dropoffLocation}
                  onChange={(e) => setDropoffLocation(e.target.value)}
                  placeholder="Where are you going?"
                />
              </div>
              <Button onClick={handleBookRide} className="w-full bg-primary">
                Find Rides
              </Button>
            </CardContent>
          </Card>
        </main>
        <BottomNav items={bottomNavItems} />
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <main className="max-w-lg mx-auto p-4 pb-24">
        {/* Map View */}
        <MapView
          pickupLocation={activeRide.pickupLocation}
          dropoffLocation={activeRide.dropoffLocation}
          driverLocation={activeRide.driverLocation}
          pickupLat={activeRide.pickupLatitude}
          pickupLon={activeRide.pickupLongitude}
          dropoffLat={activeRide.dropoffLatitude}
          dropoffLon={activeRide.dropoffLongitude}
          height="h-72"
        />

        {/* Ride Details */}
        <Card className="mt-4">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-lg">{activeRide.pickupLocation}</CardTitle>
                <CardDescription className="text-xs">→ {activeRide.dropoffLocation}</CardDescription>
              </div>
              <StatusBadge status={activeRide.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
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
                <div className="text-xs font-medium">₱{activeRide.fare}</div>
              </div>
            </div>

            {/* Driver Info */}
            {activeRide.driverId && activeRide.status !== 'searching' && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">Driver Assigned</p>
                    <p className="text-xs text-muted-foreground">Juan Dela Cruz</p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-sm">4.9 ★</div>
                    <div className="text-xs text-muted-foreground">156 rides</div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-primary/20">
                  <Button size="sm" variant="outline" className="flex-1 text-xs h-8">
                    <Phone className="h-3 w-3 mr-1" />
                    Call
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 text-xs h-8">
                    Share ETA
                  </Button>
                </div>
              </div>
            )}

            {/* Status Timeline */}
            <div className="space-y-2 p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                Trip Status
              </p>
              {['searching', 'matched', 'en-route', 'arrived', 'in-trip', 'completed'].map((status) => (
                <div
                  key={status}
                  className="flex items-center gap-2 text-xs"
                >
                  <div
                    className={`h-2 w-2 rounded-full ${
                      ['searching', 'matched', 'en-route', 'arrived', 'in-trip', 'completed'].indexOf(status) <=
                      ['searching', 'matched', 'en-route', 'arrived', 'in-trip', 'completed'].indexOf(
                        activeRide.status as string
                      )
                        ? 'bg-primary'
                        : 'bg-muted-foreground'
                    }`}
                  />
                  <span className="capitalize">
                    {status === 'en-route' ? 'En Route' : status === 'in-trip' ? 'In Trip' : status}
                  </span>
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full">
              Cancel Ride
            </Button>
          </CardContent>
        </Card>
      </main>

      <BottomNav items={bottomNavItems} />
    </>
  );
}
