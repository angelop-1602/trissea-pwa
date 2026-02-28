import { NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { requireBookingProfile, toBookingActor } from '@/lib/booking/auth';
import { bookingError, bookingErrorResponse, bookingSuccess, getRequestIdFromHeaders } from '@/lib/booking/http';

const REGION_FALLBACK_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  'region-1': { latitude: 14.5995, longitude: 120.9842 },
  'region-2': { latitude: 10.3157, longitude: 123.8854 },
};

export async function GET(request: NextRequest) {
  const requestId = getRequestIdFromHeaders(request.headers);

  try {
    const user = await requireBookingProfile(request);
    const actor = toBookingActor(user);

    if (actor.role !== 'superadmin') {
      return bookingError(requestId, 'Only superadmins can access this endpoint.', 403, 'FORBIDDEN_ROLE');
    }

    const prisma = getPrisma();

    const [regions, tenants, users, rides, terminals] = await Promise.all([
      prisma.region.findMany({ orderBy: { name: 'asc' } }),
      prisma.tenant.findMany({ orderBy: { name: 'asc' } }),
      prisma.user.findMany({}),
      prisma.ride.findMany({}),
      prisma.tODATerminal.findMany({}),
    ]);

    const activeRides = rides.filter((ride) => ['matched', 'en_route', 'arrived', 'in_trip'].includes(ride.status));

    const platformMapPoints = [
      ...regions.map((region) => ({
        id: `region-${region.id}`,
        label: region.name,
        description: `${tenants.filter((tenant) => tenant.regionId === region.id).length} tenants`,
        latitude: REGION_FALLBACK_COORDINATES[region.id]?.latitude ?? 14.5995,
        longitude: REGION_FALLBACK_COORDINATES[region.id]?.longitude ?? 120.9842,
        tone: 'region' as const,
      })),
      ...terminals.map((terminal) => ({
        id: `terminal-${terminal.id}`,
        label: terminal.name,
        description: tenants.find((tenant) => tenant.id === terminal.tenantId)?.name ?? 'Unknown Tenant',
        latitude: terminal.latitude,
        longitude: terminal.longitude,
        tone: 'terminal' as const,
      })),
      ...activeRides.map((ride) => ({
        id: `ride-${ride.id}`,
        label: `Active Ride ${ride.id}`,
        description: tenants.find((tenant) => tenant.id === ride.tenantId)?.name ?? 'Unknown Tenant',
        latitude: ride.driverLatitude ?? ride.pickupLatitude,
        longitude: ride.driverLongitude ?? ride.pickupLongitude,
        tone: ride.driverLatitude && ride.driverLongitude ? ('driver' as const) : ('ride' as const),
      })),
    ];

    return bookingSuccess(requestId, {
      stats: {
        totalRegions: regions.length,
        totalTenants: tenants.length,
        totalUsers: users.length,
        totalRides: rides.length,
      },
      platformMapPoints,
    });
  } catch (error) {
    return bookingErrorResponse(error, requestId);
  }
}
