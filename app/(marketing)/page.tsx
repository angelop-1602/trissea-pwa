'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MapPin, BarChart3, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 font-bold text-lg">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              T
            </div>
            <span>TRISSEA</span>
          </div>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center px-4 py-20">
          <div className="max-w-2xl text-center space-y-6">
            <h1 className="text-5xl sm:text-6xl font-bold text-balance">
              Tricycle Booking Reimagined
            </h1>
            <p className="text-xl text-muted-foreground text-balance">
              TRISSEA is a comprehensive multi-tenant platform for booking tricycles on-demand or queuing at TODA terminals with real-time tracking and driver management.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-8">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Learn More
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Complete Platform</h2>
            <p className="text-muted-foreground text-lg">Everything you need for tricycle operations</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <MapPin className="h-6 w-6" />,
                title: 'On-Demand Booking',
                description: 'Real-time ride matching and tracking',
              },
              {
                icon: <Users className="h-6 w-6" />,
                title: 'TODA Queuing',
                description: 'Terminal queue management system',
              },
              {
                icon: <Zap className="h-6 w-6" />,
                title: 'Real-Time Updates',
                description: 'Live location and status tracking',
              },
              {
                icon: <BarChart3 className="h-6 w-6" />,
                title: 'Analytics',
                description: 'Comprehensive reporting and insights',
              },
            ].map((feature, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="mb-2 inline-block p-2 rounded-lg bg-primary/10 text-primary">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Roles Section */}
        <section className="py-20 px-4 sm:px-6 bg-muted">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">For Everyone</h2>
              <p className="text-muted-foreground text-lg">Built for passengers, drivers, admins, and superadmins</p>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              {[
                {
                  title: 'Passengers',
                  description: 'Book rides on-demand or queue at terminals with real-time updates',
                  features: ['Quick booking', 'Route tracking', 'Wallet system', 'Ratings'],
                },
                {
                  title: 'Drivers',
                  description: 'Accept ride offers and track earnings with an intuitive dashboard',
                  features: ['Ride offers', 'Duty toggle', 'Real-time earnings', 'Performance'],
                },
                {
                  title: 'Admins',
                  description: 'Manage TODA terminals, drivers, and rides for your tenant',
                  features: ['Terminal management', 'Driver management', 'Reports', 'Support'],
                },
                {
                  title: 'Superadmins',
                  description: 'Control regions, tenants, and branding across the platform',
                  features: ['Region management', 'Tenant setup', 'Custom branding', 'Billing'],
                },
              ].map((role, i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle className="text-lg">{role.title}</CardTitle>
                    <CardDescription className="text-xs">{role.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {role.features.map((f, j) => (
                        <li key={j} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 bg-primary text-primary-foreground">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold">Ready to Get Started?</h2>
            <p className="text-lg opacity-90">
              Sign in to explore all roles and tenants. Use the developer switchers to observe branding changes and test different workflows.
            </p>
            <Link href="/login">
              <Button size="lg" variant="secondary">
                Sign In Now
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t bg-muted py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {[
              {
                title: 'Product',
                links: ['Features', 'Pricing', 'Security', 'Roadmap'],
              },
              {
                title: 'Company',
                links: ['About', 'Blog', 'Careers', 'Contact'],
              },
              {
                title: 'Legal',
                links: ['Privacy', 'Terms', 'Compliance', 'License'],
              },
              {
                title: 'Resources',
                links: ['Documentation', 'API', 'Support', 'Community'],
              },
            ].map((col, i) => (
              <div key={i}>
                <h3 className="font-semibold mb-4">{col.title}</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="hover:text-foreground transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t pt-8 flex flex-col sm:flex-row items-center justify-between text-sm text-muted-foreground">
            <p>&copy; 2024 TRISSEA. All rights reserved.</p>
            <div className="flex gap-4 mt-4 sm:mt-0">
              <a href="#" className="hover:text-foreground">Twitter</a>
              <a href="#" className="hover:text-foreground">Facebook</a>
              <a href="#" className="hover:text-foreground">Instagram</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
