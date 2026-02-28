import { NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { requireBookingProfile, toBookingActor } from '@/lib/booking/auth';
import { bookingError, bookingErrorResponse, bookingSuccess, getRequestIdFromHeaders } from '@/lib/booking/http';

export async function GET(request: NextRequest) {
  const requestId = getRequestIdFromHeaders(request.headers);

  try {
    const user = await requireBookingProfile(request);
    const actor = toBookingActor(user);
    if (actor.role !== 'passenger') {
      return bookingError(requestId, 'Only passengers can access this endpoint.', 403, 'FORBIDDEN_ROLE');
    }

    const prisma = getPrisma();
    const rides = await prisma.ride.findMany({
      where: {
        tenantId: actor.tenantId,
        passengerId: actor.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    const completedOrCancelled = rides.filter(
      (ride) => ride.status === 'completed' || ride.status === 'cancelled'
    );

    const totalSpent = completedOrCancelled.reduce((sum, ride) => sum + ride.fare, 0);

    return bookingSuccess(requestId, {
      rides,
      stats: {
        totalRides: rides.length,
        totalSpent,
        averageRating: user.rating ?? 0,
      },
    });
  } catch (error) {
    return bookingErrorResponse(error, requestId);
  }
}
