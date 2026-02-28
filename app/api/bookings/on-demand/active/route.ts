import { NextRequest } from 'next/server';
import { requireBookingProfile, toBookingActor } from '@/lib/booking/auth';
import { bookingError, bookingErrorResponse, bookingSuccess, getRequestIdFromHeaders } from '@/lib/booking/http';
import { listActiveRideForPassenger } from '@/lib/booking/service';

export async function GET(request: NextRequest) {
  const requestId = getRequestIdFromHeaders(request.headers);

  try {
    const user = await requireBookingProfile(request);
    const actor = toBookingActor(user);

    if (actor.role !== 'passenger') {
      return bookingError(requestId, 'Only passengers can fetch active ride.', 403, 'FORBIDDEN_ROLE');
    }

    const ride = await listActiveRideForPassenger(actor);
    return bookingSuccess(requestId, { ride });
  } catch (error) {
    return bookingErrorResponse(error, requestId);
  }
}
