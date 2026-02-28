import { NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { requireBookingProfile, toBookingActor } from '@/lib/booking/auth';
import { bookingError, bookingErrorResponse, bookingSuccess, getRequestIdFromHeaders } from '@/lib/booking/http';

export async function GET(request: NextRequest) {
  const requestId = getRequestIdFromHeaders(request.headers);

  try {
    const user = await requireBookingProfile(request);
    const actor = toBookingActor(user);

    if (actor.role !== 'admin') {
      return bookingError(requestId, 'Only admins can access this endpoint.', 403, 'FORBIDDEN_ROLE');
    }

    const prisma = getPrisma();
    const drivers = await prisma.user.findMany({
      where: {
        tenantId: actor.tenantId,
        role: 'driver',
      },
      include: {
        DriverPresence: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const onlineDrivers = drivers.filter((driver) => driver.DriverPresence?.isOnline).length;
    const averageRating =
      drivers.length === 0
        ? 0
        : drivers.reduce((sum, driver) => sum + (driver.rating ?? 0), 0) / drivers.length;

    return bookingSuccess(requestId, {
      drivers,
      stats: {
        totalDrivers: drivers.length,
        activeToday: onlineDrivers,
        averageRating,
      },
    });
  } catch (error) {
    return bookingErrorResponse(error, requestId);
  }
}
