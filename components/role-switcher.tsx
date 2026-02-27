'use client';

import { useStore } from '@/lib/store-context';
import { getUsersByTenant, UserRole } from '@/lib/mock-db';
import { getHomeRouteForRole } from '@/lib/role-routes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePathname, useRouter } from 'next/navigation';
import { Check, ChevronDown, Shield } from 'lucide-react';

const roleLabels: Record<UserRole, string> = {
  passenger: 'Passenger',
  driver: 'Driver',
  admin: 'Admin',
  superadmin: 'Super Admin',
};

export function RoleSwitcher() {
  const { currentTenant, currentUser, setCurrentUser } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  if (!currentTenant) return null;

  const users = getUsersByTenant(currentTenant.id).sort(
    (a, b) =>
      ['passenger', 'driver', 'admin', 'superadmin'].indexOf(a.role) -
      ['passenger', 'driver', 'admin', 'superadmin'].indexOf(b.role)
  );

  const handleRoleChange = (roleUser: (typeof users)[number]) => {
    setCurrentUser(roleUser);

    if (pathname !== '/login') {
      router.push(getHomeRouteForRole(roleUser.role));
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50">
          <Shield className="h-4 w-4" />
          <span className="hidden sm:inline">{roleLabels[currentUser?.role || 'passenger']}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 border-slate-200 bg-white text-slate-900 shadow-xl">
        <DropdownMenuLabel className="text-xs uppercase tracking-wide text-slate-500">
          Switch Role
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {users.map((user) => (
          <DropdownMenuItem
            key={user.id}
            onClick={() => handleRoleChange(user)}
            className={cn(
              'cursor-pointer rounded-md px-3 py-2.5 focus:bg-slate-100',
              currentUser?.id === user.id && 'bg-slate-100'
            )}
          >
            <div className="flex w-full items-start justify-between gap-3">
              <div>
                <div className="font-medium text-slate-900">{user.name}</div>
                <div className="text-xs text-slate-500">{roleLabels[user.role]}</div>
              </div>
              {currentUser?.id === user.id ? (
                <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
              ) : null}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
