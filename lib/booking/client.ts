import type { Reservation, Ride, TODATerminal } from '@prisma/client';
import type { QuoteInput, RideTransitionAction } from '@/lib/booking/types';

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    cache: 'no-store',
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorPayload = payload as {
      error?: string;
      code?: string;
      requestId?: string;
    };

    const detailParts = [
      errorPayload.code ? `code=${errorPayload.code}` : null,
      errorPayload.requestId ? `requestId=${errorPayload.requestId}` : null,
    ].filter(Boolean);

    const detail = detailParts.length > 0 ? ` (${detailParts.join(', ')})` : '';
    throw new Error(`${errorPayload.error ?? 'Request failed.'}${detail}`);
  }

  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

export function quoteOnDemand(input: QuoteInput) {
  return requestJson<{
    fare: { totalFare: number; distanceKm: number; estimatedDurationMin: number };
    routeCoordinates: [number, number][];
  }>(
    '/api/bookings/on-demand/quote',
    {
      method: 'POST',
      body: JSON.stringify(input),
    }
  );
}

export function createOnDemand(input: QuoteInput) {
  return requestJson<{ ride: Ride }>('/api/bookings/on-demand', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getPassengerActiveRide() {
  return requestJson<{ ride: Ride | null }>('/api/bookings/on-demand/active');
}

export function cancelOnDemandRide(rideId: string) {
  return requestJson<{ ride: Ride }>(`/api/bookings/on-demand/${rideId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export function transitionRide(rideId: string, action: RideTransitionAction) {
  return requestJson<{ ride: Ride }>(`/api/bookings/rides/${rideId}/transition`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
}

export function getDriverActiveRide() {
  return requestJson<{ ride: Ride | null }>('/api/bookings/driver/active-ride');
}

export function getDriverAssignedRides() {
  return requestJson<{ rides: Ride[] }>('/api/bookings/driver/assigned');
}

export function getTodaTerminals() {
  return requestJson<{ terminals: TODATerminal[] }>('/api/bookings/toda/terminals');
}

export type ReservationWithTerminal = Reservation & { TODATerminal: TODATerminal };

export function getMyTodaReservations() {
  return requestJson<{ reservations: ReservationWithTerminal[] }>('/api/bookings/toda/reservations/me');
}

export function createTodaReservation(terminalId: string) {
  return requestJson<{ reservation: Reservation }>('/api/bookings/toda/reservations', {
    method: 'POST',
    body: JSON.stringify({ terminalId }),
  });
}

export function cancelTodaReservation(reservationId: string) {
  return requestJson<{ reservation: Reservation }>(`/api/bookings/toda/reservations/${reservationId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
