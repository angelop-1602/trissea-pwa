import { NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { requireBookingProfile, toBookingActor } from '@/lib/booking/auth';
import { bookingError, bookingErrorResponse, bookingSuccess, getRequestIdFromHeaders } from '@/lib/booking/http';

export async function GET(request: NextRequest) {
  const requestId = getRequestIdFromHeaders(request.headers);

  try {
    const user = await requireBookingProfile(request);
    const actor = toBookingActor(user);
    if (actor.role !== 'driver') {
      return bookingError(requestId, 'Only drivers can access this endpoint.', 403, 'FORBIDDEN_ROLE');
    }

    const prisma = getPrisma();
    const completedRides = await prisma.ride.findMany({
      where: {
        tenantId: actor.tenantId,
        driverId: actor.id,
        status: 'completed',
      },
      orderBy: { completedAt: 'desc' },
    });

    const totalEarnings = completedRides.reduce((sum, ride) => sum + ride.fare, 0);
    const averageRideEarnings = completedRides.length === 0 ? 0 : totalEarnings / completedRides.length;

    return bookingSuccess(requestId, {
      profile: {
        bankAccount: user.bankAccount ?? null,
      },
      completedRides,
      stats: {
        totalEarnings,
        averageRideEarnings,
        completedRides: completedRides.length,
      },
    });
  } catch (error) {
    return bookingErrorResponse(error, requestId);
  }
}
