'use client';

import { useStore } from '@/lib/store-context';
import { Button } from '@/components/ui/button';
import { TenantSwitcher } from './tenant-switcher';
import { RoleSwitcher } from './role-switcher';
import { LogOut, Home } from 'lucide-react';
import Link from 'next/link';

interface AppHeaderProps {
  showDevTools?: boolean;
}

export function AppHeader({ showDevTools = false }: AppHeaderProps) {
  const { setCurrentUser } = useStore();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
    });
    setCurrentUser(null);
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              T
            </div>
            <span className="hidden sm:inline">TRISSEA</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {showDevTools && (
            <>
              <TenantSwitcher />
              <RoleSwitcher />
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
