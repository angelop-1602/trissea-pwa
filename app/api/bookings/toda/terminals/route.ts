import { NextRequest } from 'next/server';
import { requireBookingProfile, toBookingActor } from '@/lib/booking/auth';
import { bookingErrorResponse, bookingSuccess, getRequestIdFromHeaders } from '@/lib/booking/http';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const requestId = getRequestIdFromHeaders(request.headers);

  try {
    const user = await requireBookingProfile(request);
    const actor = toBookingActor(user);
    const prisma = getPrisma();

    const terminals = await prisma.tODATerminal.findMany({
      where: {
        tenantId: actor.tenantId,
      },
      orderBy: { name: 'asc' },
    });

    return bookingSuccess(requestId, { terminals });
  } catch (error) {
    return bookingErrorResponse(error, requestId);
  }
}
