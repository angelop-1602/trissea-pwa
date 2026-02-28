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
    const tenants = await prisma.tenant.findMany({
      orderBy: { name: 'asc' },
    });

    return bookingSuccess(requestId, {
      tenants: tenants.map((tenant) => ({
        id: tenant.id,
        name: tenant.name,
        logo: tenant.logo,
        primaryColor: tenant.primaryColor,
        accentColor: tenant.accentColor,
      })),
      defaults: {
        primaryColor: '#14622e',
        accentColor: '#fecc04',
      },
      featureFlags: [
        { label: 'On-Demand Booking', enabled: true },
        { label: 'TODA Queue System', enabled: true },
        { label: 'Driver Offers', enabled: true },
        { label: 'Real-Time Tracking', enabled: true },
      ],
    });
  } catch (error) {
    return bookingErrorResponse(error, requestId);
  }
}
