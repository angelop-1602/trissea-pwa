'use client';

import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { BottomNav } from '@/components/bottom-nav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockDB } from '@/lib/mock-db';
import { MapPin, Wallet, Clock, Star } from 'lucide-react';
import Link from 'next/link';

export default function PassengerHomePage() {
  const { currentUser, currentTenant } = useStore();
  
  if (!currentUser || currentUser.role !== 'passenger' || !currentTenant) {
    return (
      <div className="min-h-[30vh] flex items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  const recentRides = mockDB.getRidesByTenant(currentTenant.id).filter((ride) => ride.passengerId === currentUser.id).slice(0, 3);
  const activeReservations = mockDB.getReservationsByPassenger(currentUser.id);

  const bottomNavItems = [
    { href: '/passenger/home', icon: <MapPin className="h-5 w-5" />, label: 'Home' },
    { href: '/passenger/on-demand', icon: <Wallet className="h-5 w-5" />, label: 'Book' },
    { href: '/passenger/todo', icon: <Clock className="h-5 w-5" />, label: 'TODA' },
    { href: '/passenger/history', icon: <Star className="h-5 w-5" />, label: 'History' },
  ];

  return (
    <>
      <AppHeader />
      <main className="max-w-lg mx-auto p-4 pb-24">
        {/* Welcome Card */}
        <Card className="mb-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Welcome back, {currentUser.name}!</CardTitle>
            <CardDescription>Your next ride is just a tap away</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-background/50">
                <div className="text-2xl font-bold text-primary">₱{currentUser.balance}</div>
                <div className="text-xs text-muted-foreground">Wallet</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-background/50">
                <div className="text-2xl font-bold text-primary">{currentUser.rating}</div>
                <div className="text-xs text-muted-foreground">Rating</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-background/50">
                <div className="text-2xl font-bold text-primary">{currentUser.completedRides}</div>
                <div className="text-xs text-muted-foreground">Rides</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
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

        {/* Active Reservations */}
        {activeReservations.length > 0 && (
          <div className="mb-6">
            <h2 className="font-semibold mb-3">Active Reservations</h2>
            <div className="space-y-2">
              {activeReservations.map((res) => (
                <Card key={res.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Queue #{res.queuePosition}</p>
                        <p className="text-xs text-muted-foreground">
                          Boarding at {res.boardingTime.toLocaleTimeString()}
                        </p>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        {res.status}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recent Rides */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Recent Activity</h2>
            <Link href="/passenger/history">
              <Button variant="ghost" size="sm" className="text-xs h-7">
                View All
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {recentRides.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground text-center">No recent rides yet</p>
                </CardContent>
              </Card>
            ) : (
              recentRides.map((ride) => (
                <Card key={ride.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{ride.pickupLocation}</p>
                        <p className="text-xs text-muted-foreground">→ {ride.dropoffLocation}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ride.distance}km • ₱{ride.fare}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        ride.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        ride.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {ride.status === 'completed' ? 'Done' : ride.status === 'cancelled' ? 'Cancelled' : 'Active'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      <BottomNav items={bottomNavItems} />
    </>
  );
}

