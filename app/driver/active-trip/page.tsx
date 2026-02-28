'use client';

import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapView } from '@/components/map-view';
import { StatusBadge } from '@/components/status-badge';
import { mockDB } from '@/lib/mock-db';
import { MapPin, DollarSign, Clock, Navigation, Users, TrendingUp, FileText, Phone, AlertCircle } from 'lucide-react';

export default function ActiveTripPage() {
  const { currentUser, currentTenant, rides } = useStore();

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

  // Get active trip
  const activeRide = rides.find(
    (r) =>
      r.tenantId === currentTenant.id &&
      ['matched', 'en-route', 'arrived', 'in-trip'].includes(r.status)
  );

  return (
    <>
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <SidebarLayout title="Driver Menu" items={sidebarItems}>
          <div className="space-y-6">
            {!activeRide ? (
              <Card>
                <CardContent className="pt-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No Active Trip</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You don't have any active trips. Check ride offers to accept new requests.
                  </p>
                  <Button className="bg-primary">Check Offers</Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Map View */}
                <MapView
                  pickupLocation={activeRide.pickupLocation}
                  dropoffLocation={activeRide.dropoffLocation}
                  driverLocation={activeRide.driverLocation}
                  pickupLat={activeRide.pickupLatitude}
                  pickupLon={activeRide.pickupLongitude}
                  dropoffLat={activeRide.dropoffLatitude}
                  dropoffLon={activeRide.dropoffLongitude}
                  height="h-96"
                />

                {/* Trip Details */}
                <Card>
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
                    <div className="grid grid-cols-4 gap-2">
                      <div className="flex flex-col items-center p-2 rounded bg-muted/50">
                        <Navigation className="h-4 w-4 text-primary mb-1" />
                        <span className="text-xs text-muted-foreground">{activeRide.distance}km</span>
                      </div>
                      <div className="flex flex-col items-center p-2 rounded bg-muted/50">
                        <Clock className="h-4 w-4 text-primary mb-1" />
                        <span className="text-xs text-muted-foreground">{activeRide.estimatedDuration}m</span>
                      </div>
                      <div className="flex flex-col items-center p-2 rounded bg-muted/50">
                        <DollarSign className="h-4 w-4 text-primary mb-1" />
                        <span className="text-xs font-medium">₱{activeRide.fare}</span>
                      </div>
                      <div className="flex flex-col items-center p-2 rounded bg-muted/50">
                        <Users className="h-4 w-4 text-primary mb-1" />
                        <span className="text-xs text-muted-foreground">1 pax</span>
                      </div>
                    </div>

                    {/* Passenger Info */}
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="font-medium text-sm mb-2">Passenger</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Maria Santos</p>
                          <p className="text-xs text-muted-foreground">4.8 rating • 42 rides</p>
                        </div>
                        <Button size="sm" variant="outline" className="gap-1">
                          <Phone className="h-3 w-3" />
                          Call
                        </Button>
                      </div>
                    </div>

                    {/* Trip Status */}
                    <div className="space-y-2 p-3 rounded-lg bg-muted/50">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                        Trip Progress
                      </p>
                      {['matched', 'en-route', 'arrived', 'in-trip', 'completed'].map((status) => (
                        <div key={status} className="flex items-center gap-2 text-xs">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              ['matched', 'en-route', 'arrived', 'in-trip', 'completed'].indexOf(status) <=
                              ['matched', 'en-route', 'arrived', 'in-trip', 'completed'].indexOf(activeRide.status)
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

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      {activeRide.status === 'matched' && (
                        <>
                          <Button className="bg-green-600 hover:bg-green-700" size="sm">
                            Heading to Pickup
                          </Button>
                          <Button variant="outline" size="sm">
                            Cancel Trip
                          </Button>
                        </>
                      )}
                      {activeRide.status === 'en-route' && (
                        <>
                          <Button className="bg-green-600 hover:bg-green-700" size="sm">
                            Arrived at Pickup
                          </Button>
                          <Button variant="outline" size="sm">
                            Update Location
                          </Button>
                        </>
                      )}
                      {activeRide.status === 'arrived' && (
                        <>
                          <Button className="bg-green-600 hover:bg-green-700" size="sm">
                            Start Trip
                          </Button>
                          <Button variant="outline" size="sm">
                            Passenger Not Found
                          </Button>
                        </>
                      )}
                      {activeRide.status === 'in-trip' && (
                        <>
                          <Button className="bg-green-600 hover:bg-green-700" size="sm">
                            Complete Trip
                          </Button>
                          <Button variant="outline" size="sm">
                            Report Issue
                          </Button>
                        </>
                      )}
                    </div>
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

