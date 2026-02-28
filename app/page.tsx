'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getHomeRouteForRole } from '@/lib/role-routes';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      const response = await fetch('/api/me', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));

      if (!active) {
        return;
      }

      if (!response.ok || !payload.user?.role) {
        router.replace('/landing');
        return;
      }

      router.replace(getHomeRouteForRole(payload.user.role));
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, [router]);

  return null;
}
