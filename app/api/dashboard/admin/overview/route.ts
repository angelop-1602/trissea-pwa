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

    if (actor.role !== 'admin') {
      return bookingError(requestId, 'Only admins can access this endpoint.', 403, 'FORBIDDEN_ROLE');
    }

    const prisma = getPrisma();
    const todayStart = startOfToday();

    const [terminals, drivers, todayRides, completedRides, activeRides, activeDriverPresence] = await Promise.all([
      prisma.tODATerminal.findMany({
        where: { tenantId: actor.tenantId },
        orderBy: { name: 'asc' },
      }),
      prisma.user.findMany({
        where: {
          tenantId: actor.tenantId,
          role: 'driver',
        },
        include: {
          DriverPresence: true,
        },
      }),
      prisma.ride.findMany({
        where: {
          tenantId: actor.tenantId,
          createdAt: { gte: todayStart },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.ride.findMany({
        where: {
          tenantId: actor.tenantId,
          status: 'completed',
          completedAt: { gte: todayStart },
        },
      }),
      prisma.ride.findMany({
        where: {
          tenantId: actor.tenantId,
          status: { in: ['matched', 'en_route', 'arrived', 'in_trip'] },
        },
      }),
      prisma.driverPresence.findMany({
        where: {
          tenantId: actor.tenantId,
          isOnline: true,
        },
      }),
    ]);

    const totalRevenue = completedRides.reduce((sum, ride) => sum + ride.fare * 0.1, 0);

    return bookingSuccess(requestId, {
      terminals,
      rides: todayRides,
      activeRides,
      drivers: drivers.map((driver) => ({
        id: driver.id,
        name: driver.name,
        rating: driver.rating ?? null,
        completedRides: driver.completedRides ?? 0,
        isOnline: driver.DriverPresence?.isOnline ?? false,
      })),
      stats: {
        totalTerminals: terminals.length,
        activeDrivers: activeDriverPresence.length,
        todayRides: todayRides.length,
        totalRevenue,
      },
    });
  } catch (error) {
    return bookingErrorResponse(error, requestId);
  }
}
