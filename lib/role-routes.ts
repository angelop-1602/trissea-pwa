import { UserRole } from '@/lib/mock-db';

export const ROLE_HOME_ROUTE: Record<UserRole, string> = {
  passenger: '/passenger/home',
  driver: '/driver/dashboard',
  admin: '/admin/dashboard',
  superadmin: '/superadmin/dashboard',
};

export function getHomeRouteForRole(role: UserRole): string {
  return ROLE_HOME_ROUTE[role];
}
