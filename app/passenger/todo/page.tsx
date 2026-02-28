'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { BottomNav } from '@/components/bottom-nav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockDB } from '@/lib/mock-db';
import { MapPin, Users, Clock, Star } from 'lucide-react';

export default function TODAQueuePage() {
  const { currentUser, currentTenant } = useStore();
  const [selectedTerminalId, setSelectedTerminalId] = useState<string | null>(null);

  if (!currentUser || currentUser.role !== 'passenger' || !currentTenant) {
    return (
      <div className="min-h-[30vh] flex items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  const terminals = mockDB.getTerminalsByTenant(currentTenant.id);
  const reservations = mockDB.getReservationsByPassenger(currentUser.id);
  const selectedTerminal = terminals.find((t) => t.id === selectedTerminalId);

  const bottomNavItems = [
    { href: '/passenger/home', icon: <Users className="h-5 w-5" />, label: 'Home' },
    { href: '/passenger/on-demand', icon: <Clock className="h-5 w-5" />, label: 'Book' },
    { href: '/passenger/todo', icon: <MapPin className="h-5 w-5" />, label: 'TODA' },
    { href: '/passenger/history', icon: <Star className="h-5 w-5" />, label: 'History' },
  ];

  return (
    <>
      <AppHeader />
      <main className="max-w-lg mx-auto p-4 pb-24">
        {!selectedTerminal ? (
          <>
            {/* Active Reservations */}
            {reservations.length > 0 && (
              <div className="mb-6">
                <h2 className="font-semibold mb-3">Your Reservations</h2>
                <div className="space-y-2">
                  {reservations.map((res) => {
                    const terminal = mockDB.terminals.find((t) => t.id === res.terminalId);
                    return (
                      <Card key={res.id} className="cursor-pointer" onClick={() => setSelectedTerminalId(res.terminalId)}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-medium text-sm">{terminal?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Position: #{res.queuePosition}
                              </p>
                            </div>
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              {res.status}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Available Terminals */}
            <div>
              <h2 className="font-semibold mb-3">Queue at TODA Terminals</h2>
              <div className="space-y-2">
                {terminals.map((terminal) => (
                  <Card
                    key={terminal.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedTerminalId(terminal.id)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{terminal.name}</p>
                          <p className="text-xs text-muted-foreground">{terminal.location}</p>
                          <p className="text-xs text-muted-foreground mt-1">
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
            </div>
          </>
        ) : (
          <>
            {/* Terminal Details */}
            <Button
              variant="ghost"
              onClick={() => setSelectedTerminalId(null)}
              className="mb-4 text-sm h-8"
            >
              ← Back to Terminals
            </Button>

            <Card className="mb-4 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">{selectedTerminal.name}</CardTitle>
                <CardDescription>{selectedTerminal.location}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-background/50">
                    <div className="text-2xl font-bold text-primary">{selectedTerminal.currentQueued}</div>
                    <div className="text-xs text-muted-foreground">Currently Queued</div>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50">
                    <div className="text-2xl font-bold text-primary">{selectedTerminal.capacity}</div>
                    <div className="text-xs text-muted-foreground">Capacity</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Queue Information */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-base">Queue Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Average Wait Time</p>
                    <p className="text-xs text-muted-foreground">15-20 minutes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Queue Position</p>
                    <p className="text-xs text-muted-foreground">
                      Estimated: #{selectedTerminal.currentQueued + 1}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-base">Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Base Fare</span>
                  <span className="font-medium">₱35</span>
                </div>
                <div className="flex justify-between text-sm font-medium pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">₱35</span>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button className="w-full bg-primary" size="lg">
                Reserve Spot in Queue
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

