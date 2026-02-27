'use client';

import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { BottomNav } from '@/components/bottom-nav';
import { Card, CardContent } from '@/components/ui/card';
import { mockDB } from '@/lib/mock-db';
import { StatusBadge } from '@/components/status-badge';
import { MapPin, Clock, Star, DollarSign, Navigation } from 'lucide-react';

export default function PassengerHistoryPage() {
  const { currentUser, currentTenant } = useStore();

  if (!currentUser || currentUser.role !== 'passenger' || !currentTenant) {
    return null;
  }

  const rides = mockDB.getRidesByTenant(currentTenant.id).filter((r) => r.passengerId === currentUser.id);
  const completedRides = rides.filter((r) => r.status === 'completed' || r.status === 'cancelled');

  const bottomNavItems = [
    { href: '/passenger/home', icon: <MapPin className="h-5 w-5" />, label: 'Home' },
    { href: '/passenger/on-demand', icon: <Clock className="h-5 w-5" />, label: 'Book' },
    { href: '/passenger/todo', icon: <Star className="h-5 w-5" />, label: 'TODA' },
    { href: '/passenger/history', icon: <DollarSign className="h-5 w-5" />, label: 'History' },
  ];

  const stats = {
    totalRides: currentUser.completedRides,
    totalSpent: completedRides.reduce((sum, r) => sum + r.fare, 0),
    averageRating: currentUser.rating,
  };

  return (
    <>
      <AppHeader />
      <main className="max-w-lg mx-auto p-4 pb-24">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalRides}</div>
              <div className="text-xs text-muted-foreground">Total Rides</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-primary">₱{stats.totalSpent}</div>
              <div className="text-xs text-muted-foreground">Total Spent</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.averageRating}</div>
              <div className="text-xs text-muted-foreground">Rating</div>
            </CardContent>
          </Card>
        </div>

        {/* Ride History */}
        <div>
          <h2 className="font-semibold mb-3">Ride History</h2>
          {completedRides.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center">No completed rides yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {completedRides.map((ride) => (
                <Card key={ride.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="font-medium text-sm">{ride.pickupLocation}</p>
                        <p className="text-xs text-muted-foreground">→ {ride.dropoffLocation}</p>
                      </div>
                      <StatusBadge status={ride.status} />
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="flex flex-col items-center p-2 rounded bg-muted/50">
                        <Navigation className="h-3 w-3 text-primary mb-0.5" />
                        <span className="text-muted-foreground">{ride.distance}km</span>
                      </div>
                      <div className="flex flex-col items-center p-2 rounded bg-muted/50">
                        <Clock className="h-3 w-3 text-primary mb-0.5" />
                        <span className="text-muted-foreground">{ride.estimatedDuration}m</span>
                      </div>
                      <div className="flex flex-col items-center p-2 rounded bg-muted/50">
                        <DollarSign className="h-3 w-3 text-primary mb-0.5" />
                        <span className="font-medium">₱{ride.fare}</span>
                      </div>
                      <div className="flex flex-col items-center p-2 rounded bg-muted/50">
                        <Star className="h-3 w-3 text-primary mb-0.5" />
                        <span className="text-muted-foreground">4.8</span>
                      </div>
                    </div>

                    {ride.completedAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {ride.completedAt.toLocaleDateString()} at{' '}
                        {ride.completedAt.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav items={bottomNavItems} />
    </>
  );
}
