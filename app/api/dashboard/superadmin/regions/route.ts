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
    const [regions, tenants] = await Promise.all([
      prisma.region.findMany({
        orderBy: { name: 'asc' },
      }),
      prisma.tenant.findMany({}),
    ]);

    const rows = regions.map((region) => {
      const regionTenants = tenants.filter((tenant) => tenant.regionId === region.id);
      return {
        ...region,
        tenantCount: regionTenants.length,
        status: 'Active',
      };
    });

    return bookingSuccess(requestId, { regions: rows });
  } catch (error) {
    return bookingErrorResponse(error, requestId);
  }
}
