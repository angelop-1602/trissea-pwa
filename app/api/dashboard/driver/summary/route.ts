import { NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { requireBookingProfile, toBookingActor } from '@/lib/booking/auth';
import { bookingError, bookingErrorResponse, bookingSuccess, getRequestIdFromHeaders } from '@/lib/booking/http';

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

export async function GET(request: NextRequest) {
  const requestId = getRequestIdFromHeaders(request.headers);

  try {
    const user = await requireBookingProfile(request);
    const actor = toBookingActor(user);
    if (actor.role !== 'driver') {
      return bookingError(requestId, 'Only drivers can access this endpoint.', 403, 'FORBIDDEN_ROLE');
    }

    const prisma = getPrisma();
    const todayStart = startOfToday();

    const [presence, activeRide, allDriverRides, todaysCompletedRides] = await Promise.all([
      prisma.driverPresence.findUnique({
        where: { driverId: actor.id },
      }),
      prisma.ride.findFirst({
        where: {
          tenantId: actor.tenantId,
          driverId: actor.id,
          status: {
            in: ['matched', 'en_route', 'arrived', 'in_trip'],
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.ride.findMany({
        where: {
          tenantId: actor.tenantId,
          driverId: actor.id,
        },
        select: {
          id: true,
          status: true,
          fare: true,
          completedAt: true,
        },
      }),
      prisma.ride.findMany({
        where: {
          tenantId: actor.tenantId,
          driverId: actor.id,
          status: 'completed',
          completedAt: {
            gte: todayStart,
          },
        },
        select: {
          fare: true,
        },
      }),
    ]);

    const completedRides = allDriverRides.filter((ride) => ride.status === 'completed');
    const cancelledRides = allDriverRides.filter((ride) => ride.status === 'cancelled');
    const acceptanceBase = completedRides.length + cancelledRides.length;
    const acceptanceRate =
      acceptanceBase === 0 ? 100 : Math.round((completedRides.length / acceptanceBase) * 100);

    const totalEarnings = completedRides.reduce((sum, ride) => sum + ride.fare, 0);
    const totalEarningsToday = todaysCompletedRides.reduce((sum, ride) => sum + ride.fare, 0);

    return bookingSuccess(requestId, {
      profile: {
        id: user.id,
        name: user.name,
        rating: user.rating ?? 0,
        bankAccount: user.bankAccount ?? null,
      },
      presence: {
        isOnline: presence?.isOnline ?? false,
        lastHeartbeatAt: presence?.lastHeartbeatAt ?? null,
      },
      activeRide,
      stats: {
        ridesCompletedToday: todaysCompletedRides.length,
        ridesCompletedTotal: completedRides.length,
        totalEarnings,
        totalEarningsToday,
        acceptanceRate,
      },
    });
  } catch (error) {
    return bookingErrorResponse(error, requestId);
  }
}
