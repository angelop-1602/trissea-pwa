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
    const terminals = await prisma.tODATerminal.findMany({
      where: { tenantId: actor.tenantId },
      orderBy: { name: 'asc' },
    });

    const totalCapacity = terminals.reduce((sum, terminal) => sum + terminal.capacity, 0);
    const currentlyQueued = terminals.reduce((sum, terminal) => sum + terminal.currentQueued, 0);

    return bookingSuccess(requestId, {
      terminals,
      stats: {
        totalTerminals: terminals.length,
        totalCapacity,
        currentlyQueued,
      },
    });
  } catch (error) {
    return bookingErrorResponse(error, requestId);
  }
}
