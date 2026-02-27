'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store-context';
import { UserRole } from '@/lib/mock-db';
import { getHomeRouteForRole } from '@/lib/role-routes';

interface RoleGateProps {
  role: UserRole;
  children: ReactNode;
  requiresTenant?: boolean;
}

export function RoleGate({ role, children, requiresTenant = true }: RoleGateProps) {
  const { currentUser, currentTenant } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.replace('/login');
      return;
    }

    if (currentUser.role !== role) {
      router.replace(getHomeRouteForRole(currentUser.role));
      return;
    }

    if (requiresTenant && !currentTenant) {
      router.replace('/login');
    }
  }, [currentTenant, currentUser, requiresTenant, role, router]);

  if (!currentUser || currentUser.role !== role || (requiresTenant && !currentTenant)) {
    return (
      <div className="min-h-[30vh] flex items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  return <>{children}</>;
}
