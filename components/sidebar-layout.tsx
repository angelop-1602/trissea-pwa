'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, Menu, MonitorSmartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/bottom-nav';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface SidebarItem {
  href: string;
  label: string;
  icon?: ReactNode;
}

interface SidebarLayoutProps {
  children: ReactNode;
  items: SidebarItem[];
  title: string;
}

export function SidebarLayout({ children, items, title }: SidebarLayoutProps) {
  const pathname = usePathname();
  const [isAdminSidebarCollapsed, setIsAdminSidebarCollapsed] = useState(false);
  const isDriverArea = pathname.startsWith('/driver');
  const isAdminDesktopArea = pathname.startsWith('/admin') || pathname.startsWith('/superadmin');
  const activeItem = items.find((item) => pathname === item.href);

  const renderNavigation = (onItemClick?: () => void) => (
    <nav className="space-y-1.5">
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              'group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors',
              isActive
                ? 'border-primary/20 bg-primary/10 font-semibold text-primary'
                : 'border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-100'
            )}
          >
            <span className={cn('text-slate-500 transition-colors', isActive && 'text-primary')}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  if (isDriverArea) {
    const pwaItems = items.map((item) => ({
      href: item.href,
      label: item.label,
      icon: item.icon ?? <span className="h-4 w-4" />,
    }));

    return (
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-4 hidden md:flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-slate-700 hover:bg-slate-100'
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </div>

        <main className="min-w-0 pb-24">{children}</main>
        <BottomNav items={pwaItems} />
      </div>
    );
  }

  if (isAdminDesktopArea) {
    return (
      <div className="relative left-1/2 w-screen -translate-x-1/2">
        <div className="lg:hidden p-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <MonitorSmartphone className="mx-auto mb-3 h-7 w-7 text-slate-500" />
            <h3 className="text-base font-semibold text-slate-900">Desktop Layout Only</h3>
            <p className="mt-2 text-sm text-slate-600">
              Admin and Super Admin pages are desktop-only. Open this page on a larger screen.
            </p>
          </div>
        </div>

        <div className="hidden lg:flex min-h-[calc(100vh-64px)] bg-slate-100/60">
          <aside
            className={cn(
              'sticky top-16 h-[calc(100vh-64px)] shrink-0 border-r border-slate-200 bg-white transition-all duration-200',
              isAdminSidebarCollapsed ? 'w-20' : 'w-72'
            )}
          >
            <div className="border-b border-slate-200 px-4 py-4">
              <p
                className={cn(
                  'text-xs font-semibold uppercase tracking-[0.2em] text-slate-500',
                  isAdminSidebarCollapsed && 'sr-only'
                )}
              >
                {title}
              </p>
            </div>
            <nav className="space-y-1.5 p-3">
              {items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isAdminSidebarCollapsed ? item.label : undefined}
                    className={cn(
                      'group flex items-center rounded-xl border px-3 py-2.5 text-sm transition-colors',
                      isAdminSidebarCollapsed ? 'justify-center' : 'gap-3',
                      isActive
                        ? 'border-primary/20 bg-primary/10 font-semibold text-primary'
                        : 'border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-100'
                    )}
                  >
                    <span className={cn('text-slate-500 transition-colors', isActive && 'text-primary')}>
                      {item.icon}
                    </span>
                    <span className={cn(isAdminSidebarCollapsed && 'sr-only')}>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="sticky top-16 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
              <div className="flex h-16 items-center justify-between px-6">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                    onClick={() => setIsAdminSidebarCollapsed((prev) => !prev)}
                  >
                    {isAdminSidebarCollapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronLeft className="h-4 w-4" />
                    )}
                  </Button>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{title}</p>
                    <h1 className="text-lg font-semibold text-slate-900">{activeItem?.label ?? title}</h1>
                  </div>
                </div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                  Admin Workspace
                </p>
              </div>
            </div>

            <main className="min-w-0 flex-1 p-6">{children}</main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      <aside className="hidden lg:block lg:w-72 lg:shrink-0">
        <div className="sticky top-20 h-[calc(100vh-90px)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</h2>
          {renderNavigation()}
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mb-4 lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2 border-slate-200 bg-white text-slate-900 hover:bg-slate-50">
                <Menu className="h-4 w-4" />
                Open Menu
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[290px] border-r border-slate-200 bg-white px-4">
              <SheetHeader className="px-0">
                <SheetTitle className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {title}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-2">{renderNavigation()}</div>
            </SheetContent>
          </Sheet>
        </div>
        {children}
      </main>
    </div>
  );
}
