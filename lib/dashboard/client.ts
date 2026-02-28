import type { Reservation, Ride, TODATerminal } from '@prisma/client';

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    cache: 'no-store',
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorPayload = payload as {
      error?: string;
      code?: string;
      requestId?: string;
    };

    const detailParts = [
      errorPayload.code ? `code=${errorPayload.code}` : null,
      errorPayload.requestId ? `requestId=${errorPayload.requestId}` : null,
    ].filter(Boolean);

    const detail = detailParts.length > 0 ? ` (${detailParts.join(', ')})` : '';
    throw new Error(`${errorPayload.error ?? 'Request failed.'}${detail}`);
  }

  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

export type ReservationWithTerminal = Reservation & { TODATerminal: TODATerminal };

export interface PassengerHomeData {
  profile: {
    id: string;
    name: string;
    balance: number;
    rating: number;
    completedRides: number;
  };
  recentRides: Ride[];
  activeReservations: ReservationWithTerminal[];
}

export interface PassengerHistoryData {
  rides: Ride[];
  stats: {
    totalRides: number;
    totalSpent: number;
    averageRating: number;
  };
}

export interface DriverSummaryData {
  profile: {
    id: string;
    name: string;
    rating: number;
    bankAccount: string | null;
  };
  presence: {
    isOnline: boolean;
    lastHeartbeatAt: string | Date | null;
  };
  activeRide: Ride | null;
  stats: {
    ridesCompletedToday: number;
    ridesCompletedTotal: number;
    totalEarnings: number;
    totalEarningsToday: number;
    acceptanceRate: number;
  };
}

export interface DriverHistoryData {
  rides: Ride[];
  stats: {
    totalRides: number;
    completedRides: number;
    cancelledRides: number;
    totalEarnings: number;
  };
}

export interface DriverEarningsData {
  profile: {
    bankAccount: string | null;
  };
  completedRides: Ride[];
  stats: {
    totalEarnings: number;
    averageRideEarnings: number;
    completedRides: number;
  };
}

export interface AdminOverviewData {
  terminals: TODATerminal[];
  rides: Ride[];
  activeRides: Ride[];
  drivers: Array<{
    id: string;
    name: string;
    rating: number | null;
    completedRides: number;
    isOnline: boolean;
  }>;
  stats: {
    totalTerminals: number;
    activeDrivers: number;
    todayRides: number;
    totalRevenue: number;
  };
}

export interface AdminDriversData {
  drivers: Array<{
    id: string;
    name: string;
    phone: string;
    rating: number | null;
    completedRides: number | null;
    DriverPresence: {
      isOnline: boolean;
      lastHeartbeatAt: string | Date;
    } | null;
  }>;
  stats: {
    totalDrivers: number;
    activeToday: number;
    averageRating: number;
  };
}

export interface AdminRidesData {
  rides: Ride[];
  stats: {
    totalRides: number;
    completedRides: number;
    totalFares: number;
  };
}

export interface AdminTerminalsData {
  terminals: TODATerminal[];
  stats: {
    totalTerminals: number;
    totalCapacity: number;
    currentlyQueued: number;
  };
}

export interface AdminReportsData {
  stats: {
    totalRides: number;
    completedRides: number;
    totalFares: number;
    commission: number;
    completionRate: number;
    driverActivity: number;
    terminalOccupancy: number;
    todayRides: number;
  };
}

export interface AdminReservationsData {
  reservations: Array<{
    id: string;
    status: string;
    queuePosition: number;
    boardingTime: string | Date;
    createdAt: string | Date;
    User: {
      id: string;
      name: string;
      phone: string;
    };
    TODATerminal: {
      id: string;
      name: string;
      location: string;
    };
  }>;
  stats: {
    totalReservations: number;
    activeReservations: number;
  };
}

export interface AdminUsersData {
  users: Array<{
    id: string;
    name: string;
    phone: string;
    role: 'passenger' | 'driver' | 'admin' | 'superadmin';
    createdAt: string | Date;
  }>;
  stats: {
    totalUsers: number;
    roleCounts: {
      passenger: number;
      driver: number;
      admin: number;
      superadmin: number;
    };
  };
}

export interface SuperadminOverviewData {
  stats: {
    totalRegions: number;
    totalTenants: number;
    totalUsers: number;
    totalRides: number;
  };
  platformMapPoints: Array<{
    id: string;
    label: string;
    description: string;
    latitude: number;
    longitude: number;
    tone: 'region' | 'terminal' | 'driver' | 'ride';
  }>;
}

export interface SuperadminRegionRow {
  id: string;
  name: string;
  country: string;
  provinces: string[];
  tenantCount: number;
  status: string;
}

export interface SuperadminRegionsData {
  regions: SuperadminRegionRow[];
}

export interface SuperadminTenantRow {
  id: string;
  name: string;
  regionId: string;
  regionName: string;
  users: number;
  rides: number;
  revenue: number;
  status: string;
}

export interface SuperadminTenantsData {
  tenants: SuperadminTenantRow[];
}

export interface SuperadminReportsData {
  stats: {
    totalRides: number;
    totalRevenue: number;
    totalCommission: number;
    averagePerRide: number;
  };
  tenantPerformance: Array<{
    id: string;
    name: string;
    rides: number;
    revenue: number;
  }>;
}

export interface SuperadminBrandingData {
  tenants: Array<{
    id: string;
    name: string;
    logo: string | null;
    primaryColor: string | null;
    accentColor: string | null;
  }>;
  defaults: {
    primaryColor: string;
    accentColor: string;
  };
  featureFlags: Array<{
    label: string;
    enabled: boolean;
  }>;
}

export function getPassengerHomeData() {
  return requestJson<PassengerHomeData>('/api/dashboard/passenger/home');
}

export function getPassengerHistoryData() {
  return requestJson<PassengerHistoryData>('/api/dashboard/passenger/history');
}

export function getDriverSummaryData() {
  return requestJson<DriverSummaryData>('/api/dashboard/driver/summary');
}

export function getDriverHistoryData() {
  return requestJson<DriverHistoryData>('/api/dashboard/driver/history');
}

export function getDriverEarningsData() {
  return requestJson<DriverEarningsData>('/api/dashboard/driver/earnings');
}

export function getAdminOverviewData() {
  return requestJson<AdminOverviewData>('/api/dashboard/admin/overview');
}

export function getAdminDriversData() {
  return requestJson<AdminDriversData>('/api/dashboard/admin/drivers');
}

export function getAdminRidesData() {
  return requestJson<AdminRidesData>('/api/dashboard/admin/rides');
}

export function getAdminTerminalsData() {
  return requestJson<AdminTerminalsData>('/api/dashboard/admin/terminals');
}

export function getAdminReportsData() {
  return requestJson<AdminReportsData>('/api/dashboard/admin/reports');
}

export function getAdminReservationsData() {
  return requestJson<AdminReservationsData>('/api/dashboard/admin/reservations');
}

export function getAdminUsersData() {
  return requestJson<AdminUsersData>('/api/dashboard/admin/users');
}

export function getSuperadminOverviewData() {
  return requestJson<SuperadminOverviewData>('/api/dashboard/superadmin/overview');
}

export function getSuperadminRegionsData() {
  return requestJson<SuperadminRegionsData>('/api/dashboard/superadmin/regions');
}

export function getSuperadminTenantsData() {
  return requestJson<SuperadminTenantsData>('/api/dashboard/superadmin/tenants');
}

export function getSuperadminReportsData() {
  return requestJson<SuperadminReportsData>('/api/dashboard/superadmin/reports');
}

export function getSuperadminBrandingData() {
  return requestJson<SuperadminBrandingData>('/api/dashboard/superadmin/branding');
}
