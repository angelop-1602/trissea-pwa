'use client';

import { useStore } from '@/lib/store-context';
import { getTenantsByRegion, getUsersByTenant } from '@/lib/mock-db';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Building2 } from 'lucide-react';

export function TenantSwitcher() {
  const { currentTenant, currentRegion, currentUser, setCurrentTenant, setCurrentUser } = useStore();
  const pathname = usePathname();

  if (!currentRegion) return null;

  const tenants = getTenantsByRegion(currentRegion.id);

  const handleTenantChange = (tenantId: string) => {
    const tenant = tenants.find((item) => item.id === tenantId);

    if (!tenant) return;

    setCurrentTenant(tenant);

    const tenantUsers = getUsersByTenant(tenant.id);
    if (tenantUsers.length === 0) return;

    if (pathname === '/login' && !currentUser) {
      return;
    }

    const sameRoleUser = currentUser
      ? tenantUsers.find((user) => user.role === currentUser.role)
      : undefined;

    setCurrentUser(sameRoleUser ?? tenantUsers[0]);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50">
          <Building2 className="h-4 w-4" />
          <span className="hidden sm:inline max-w-[200px] truncate">
            {currentTenant?.name || 'Select Tenant'}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 border-slate-200 bg-white text-slate-900 shadow-xl">
        <DropdownMenuLabel className="text-xs uppercase tracking-wide text-slate-500">
          Tenants in {currentRegion.name}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.map((tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            onClick={() => handleTenantChange(tenant.id)}
            className="cursor-pointer rounded-md px-3 py-2.5 focus:bg-slate-100"
          >
            <div>
              <div className="font-medium text-slate-900">{tenant.name}</div>
              <div className="text-xs text-slate-500">{currentRegion.name}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
