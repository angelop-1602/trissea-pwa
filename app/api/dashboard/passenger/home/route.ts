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

    const [recentRides, activeReservations] = await Promise.all([
      prisma.ride.findMany({
        where: {
          tenantId: actor.tenantId,
          passengerId: actor.id,
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      prisma.reservation.findMany({
        where: {
          tenantId: actor.tenantId,
          passengerId: actor.id,
          status: {
            in: ['confirmed', 'arrived'],
          },
        },
        orderBy: [{ status: 'asc' }, { queuePosition: 'asc' }],
        include: {
          TODATerminal: true,
        },
      }),
    ]);

    return bookingSuccess(requestId, {
      profile: {
        id: user.id,
        name: user.name,
        balance: user.balance ?? 0,
        rating: user.rating ?? 0,
        completedRides: user.completedRides ?? 0,
      },
      recentRides,
      activeReservations,
    });
  } catch (error) {
    return bookingErrorResponse(error, requestId);
  }
}
