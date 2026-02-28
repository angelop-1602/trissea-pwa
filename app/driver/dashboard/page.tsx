'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store-context';
import { AppHeader } from '@/components/app-header';
import { SidebarLayout } from '@/components/sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockDB } from '@/lib/mock-db';
import { Badge } from '@/components/ui/badge';
import { Power, MapPin, DollarSign, TrendingUp, Clock, Users, FileText } from 'lucide-react';

export default function DriverDashboardPage() {
  const { currentUser, currentTenant } = useStore();
  const [isDutyOn, setIsDutyOn] = useState(true);

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

  const stats = {
    onlineTime: '4h 32m',
    ridesCompleted: 8,
    totalEarnings: 1840,
    rating: 4.9,
    acceptanceRate: 92,
  };

  return (
    <>
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <SidebarLayout title="Driver Menu" items={sidebarItems}>
          <div className="space-y-6">
            {/* Duty Toggle */}
            <Card className={isDutyOn ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Duty Status</CardTitle>
                    <CardDescription>
                      {isDutyOn ? 'You are currently available for rides' : 'You are offline'}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setIsDutyOn(!isDutyOn)}
                    className={isDutyOn ? 'bg-green-600 hover:bg-green-700' : ''}
                    size="lg"
                  >
                    <Power className="h-4 w-4 mr-2" />
                    {isDutyOn ? 'Go Offline' : 'Go Online'}
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'Online Time', value: stats.onlineTime, icon: <Clock className="h-5 w-5" /> },
                { label: 'Rides Today', value: stats.ridesCompleted, icon: <Users className="h-5 w-5" /> },
                { label: 'Earnings', value: `₱${stats.totalEarnings}`, icon: <DollarSign className="h-5 w-5" /> },
                { label: 'Rating', value: stats.rating, icon: <TrendingUp className="h-5 w-5" /> },
                { label: 'Acceptance', value: `${stats.acceptanceRate}%`, icon: <Badge className="h-5 w-5" /> },
              ].map((stat, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                      </div>
                      <div className="text-primary/60">{stat.icon}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isDutyOn ? (
                  <>
                    <Button className="w-full bg-primary" size="lg">
                      View Ride Offers
                    </Button>
                    <Button variant="outline" className="w-full">
                      Update Location
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Go online to start receiving ride offers
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
                <CardDescription>Based on today's activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-sm font-bold">98%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-600" style={{ width: '98%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Safety Rating</span>
                    <span className="text-sm font-bold">4.9/5.0</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: '98%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">On-Time Rate</span>
                    <span className="text-sm font-bold">95%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-600" style={{ width: '95%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarLayout>
      </div>
    </>
  );
}

