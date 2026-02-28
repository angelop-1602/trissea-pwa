'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getHomeRouteForRole } from '@/lib/role-routes';
import type { UserRole } from '@prisma/client';
import { useStore } from '@/lib/store-context';

interface RoleGateProps {
  role: UserRole;
  children: ReactNode;
}

export function RoleGate({ role, children }: RoleGateProps) {
  const router = useRouter();
  const { setCurrentUser, setCurrentTenant, setCurrentRegion } = useStore();
  const [isAllowed, setIsAllowed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      const response = await fetch('/api/me', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));

      if (!active) {
        return;
      }

      if (!response.ok || !payload.user?.role) {
        router.replace('/login');
        return;
      }

      if (payload.user.role !== role) {
        router.replace(getHomeRouteForRole(payload.user.role));
        return;
      }

      setCurrentUser(payload.user);
      if (payload.tenant) {
        setCurrentTenant(payload.tenant);
      }
      if (payload.region) {
        setCurrentRegion(payload.region);
      }
      setIsAllowed(true);
      setIsLoading(false);
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, [role, router, setCurrentRegion, setCurrentTenant, setCurrentUser]);

  if (isLoading || !isAllowed) {
    return (
      <div className="min-h-[30vh] flex items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  return <>{children}</>;
}
