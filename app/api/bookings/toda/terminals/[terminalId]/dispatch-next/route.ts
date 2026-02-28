import { NextRequest } from 'next/server';
import { requireBookingProfile, toBookingActor } from '@/lib/booking/auth';
import {
  bookingErrorResponse,
  bookingSuccess,
  getRequestIdFromHeaders,
  rateLimitedResponse,
} from '@/lib/booking/http';
import { dispatchNextTodaPassenger } from '@/lib/booking/service';
import { checkEndpointRateLimit } from '@/lib/security/rate-limit-endpoint';

interface Params {
  params: Promise<{ terminalId: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const requestId = getRequestIdFromHeaders(request.headers);

  try {
    const { terminalId } = await params;
    const user = await requireBookingProfile(request);
    const actor = toBookingActor(user);

    const limit = checkEndpointRateLimit(request, {
      scope: 'bookings.toda.dispatch_next',
      limit: 30,
      windowMs: 60_000,
      keyParts: [actor.id],
    });
    if (!limit.allowed) {
      return rateLimitedResponse(requestId, limit.retryAfterSeconds);
    }

    const reservation = await dispatchNextTodaPassenger(terminalId, actor);
    return bookingSuccess(requestId, { reservation });
  } catch (error) {
    return bookingErrorResponse(error, requestId);
  }
}
