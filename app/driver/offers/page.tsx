'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockDB } from '@/lib/mock-db';
import { Badge } from '@/components/ui/badge';
import { MapPin, DollarSign, Clock, Navigation, Users, TrendingUp, FileText, AlertCircle } from 'lucide-react';

interface OfferWithCountdown {
  rideId: string;
  pickupLocation: string;
  dropoffLocation: string;
  distance: number;
  fare: number;
  estimatedDuration: number;
  countdown: number;
  passengerRating: number;
}

export default function DriverOffersPage() {
  const { currentUser, currentTenant, rides } = useStore();
  const [offers, setOffers] = useState<OfferWithCountdown[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);

  if (!currentUser || currentUser.role !== 'driver' || !currentTenant) {
    return (
      <div className="min-h-[30vh] flex items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  const sidebarItems = [
    { href: '/driver/dashboard', label: 'Dashboard', icon: <MapPin className="h-4 w-4" /> },
    { href: '/driver/offers', label: 'Ride Offers', icon: <Users className="h-4 w-4" /> },
    { href: '/driver/active-trip', label: 'Active Trip', icon: <TrendingUp className="h-4 w-4" /> },
    { href: '/driver/earnings', label: 'Earnings', icon: <DollarSign className="h-4 w-4" /> },
    { href: '/driver/history', label: 'History', icon: <FileText className="h-4 w-4" /> },
  ];

  // Initialize offers
  useEffect(() => {
    const tenantRides = rides.filter(
      (r) => r.tenantId === currentTenant.id && r.status === 'searching'
    );

    const newOffers: OfferWithCountdown[] = tenantRides.map((ride) => ({
      rideId: ride.id,
      pickupLocation: ride.pickupLocation,
      dropoffLocation: ride.dropoffLocation,
      distance: ride.distance,
      fare: ride.fare,
      estimatedDuration: ride.estimatedDuration,
      countdown: 15,
      passengerRating: 4.8,
    }));

    setOffers(newOffers);
  }, [rides, currentTenant.id]);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setOffers((prev) =>
        prev
          .map((offer) => ({ ...offer, countdown: offer.countdown - 1 }))
          .filter((offer) => offer.countdown > 0)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleAcceptOffer = (rideId: string) => {
    setOffers((prev) => prev.filter((o) => o.rideId !== rideId));
    setSelectedOfferId(null);
    // Show confirmation
    setTimeout(() => {
      alert('Ride accepted! Head to the pickup location.');
    }, 100);
  };

  const handleRejectOffer = (rideId: string) => {
    setOffers((prev) => prev.filter((o) => o.rideId !== rideId));
  };

  return (
    <>
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <SidebarLayout title="Driver Menu" items={sidebarItems}>
          <div className="space-y-6">
            {offers.length === 0 ? (
              <Card>
                <CardContent className="pt-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No Offers Available</h3>
                  <p className="text-sm text-muted-foreground">
                    Go online and wait for ride requests. Offers will appear here automatically.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {offers.map((offer) => (
                  <Card
                    key={offer.rideId}
                    className={`cursor-pointer transition-all ${
                      offer.countdown <= 5 ? 'ring-2 ring-amber-500' : ''
                    }`}
                    onClick={() => setSelectedOfferId(offer.rideId)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{offer.pickupLocation}</p>
                          <p className="text-xs text-muted-foreground">→ {offer.dropoffLocation}</p>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-sm font-bold ${
                              offer.countdown <= 5
                                ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700'
                                : ''
                            }`}
                          >
                            {offer.countdown}s
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="flex flex-col items-center p-2 rounded bg-muted/50">
                          <Navigation className="h-3 w-3 text-primary mb-0.5" />
                          <span className="text-xs text-muted-foreground">{offer.distance}km</span>
                        </div>
                        <div className="flex flex-col items-center p-2 rounded bg-muted/50">
                          <Clock className="h-3 w-3 text-primary mb-0.5" />
                          <span className="text-xs text-muted-foreground">{offer.estimatedDuration}m</span>
                        </div>
                        <div className="flex flex-col items-center p-2 rounded bg-muted/50">
                          <DollarSign className="h-3 w-3 text-primary mb-0.5" />
                          <span className="text-xs font-medium">₱{offer.fare}</span>
                        </div>
                        <div className="flex flex-col items-center p-2 rounded bg-muted/50">
                          <Users className="h-3 w-3 text-primary mb-0.5" />
                          <span className="text-xs text-muted-foreground">{offer.passengerRating}</span>
                        </div>
                      </div>

                      {selectedOfferId === offer.rideId && (
                        <div className="grid grid-cols-2 gap-2 pt-3 border-t">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptOffer(offer.rideId);
                            }}
                            className="bg-green-600 hover:bg-green-700"
                            size="sm"
                          >
                            Accept
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRejectOffer(offer.rideId);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            Decline
                          </Button>
                        </div>
                      )}
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

