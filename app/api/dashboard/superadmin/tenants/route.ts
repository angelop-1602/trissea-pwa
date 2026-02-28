import { NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { requireBookingProfile, toBookingActor } from '@/lib/booking/auth';
import { bookingError, bookingErrorResponse, bookingSuccess, getRequestIdFromHeaders } from '@/lib/booking/http';

export async function GET(request: NextRequest) {
  const requestId = getRequestIdFromHeaders(request.headers);

  try {
    const user = await requireBookingProfile(request);
    const actor = toBookingActor(user);
    if (actor.role !== 'superadmin') {
      return bookingError(requestId, 'Only superadmins can access this endpoint.', 403, 'FORBIDDEN_ROLE');
    }

    const prisma = getPrisma();
    const [tenants, regions, users, rides] = await Promise.all([
      prisma.tenant.findMany({ orderBy: { name: 'asc' } }),
      prisma.region.findMany({}),
      prisma.user.findMany({}),
      prisma.ride.findMany({}),
    ]);

    const rows = tenants.map((tenant) => {
      const tenantUsers = users.filter((u) => u.tenantId === tenant.id);
      const tenantRides = rides.filter((r) => r.tenantId === tenant.id);
      const revenue = tenantRides.reduce((sum, ride) => sum + (ride.status === 'completed' ? ride.fare * 0.1 : 0), 0);
      return {
        ...tenant,
        regionName: regions.find((region) => region.id === tenant.regionId)?.name ?? 'Unknown',
        users: tenantUsers.length,
        rides: tenantRides.length,
        revenue,
        status: 'Active',
      };
    });

    return bookingSuccess(requestId, { tenants: rows });
  } catch (error) {
    return bookingErrorResponse(error, requestId);
  }
}
