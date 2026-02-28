import { randomUUID } from 'node:crypto';
import { Prisma, type DriverPresence, type Reservation, type Ride, type UserRole } from '@prisma/client';
import { getPrisma } from '@/lib/prisma';
import {
  BOOKING_FARE,
  DRIVER_HEARTBEAT_MAX_AGE_SECONDS,
  DRIVER_HEARTBEAT_MIN_INTERVAL_SECONDS,
  DRIVER_STALE_CLEANUP_INTERVAL_SECONDS,
} from '@/lib/booking/constants';
import { BookingError } from '@/lib/booking/errors';
import { emitBookingEvent } from '@/lib/booking/events';
import { logError } from '@/lib/observability/log';
import { resolveRideTransition } from '@/lib/booking/fsm';
import {
  ACTIVE_ON_DEMAND_DRIVER_STATUSES,
  ACTIVE_ON_DEMAND_PASSENGER_STATUSES,
  type BookingActor,
  type DriverPresenceInput,
  type FareBreakdown,
  type OnDemandQuoteResult,
  type QuoteInput,
  type RideTransitionAction,
} from '@/lib/booking/types';

interface OsrmRouteResponse {
  routes?: Array<{
    distance?: number;
    duration?: number;
    geometry?: {
      coordinates?: [number, number][];
    };
  }>;
}

type DriverPresenceCandidate = Pick<DriverPresence, 'driverId' | 'latitude' | 'longitude'>;

const globalForPresenceCleanup = globalThis as unknown as {
  __trisseaLastPresenceCleanupAt: number | undefined;
};

function getDriverPresenceDelegate(
  prisma: Prisma.TransactionClient | ReturnType<typeof getPrisma>
): {
  upsert?: (...args: any[]) => Promise<DriverPresence>;
  findMany?: (...args: any[]) => Promise<DriverPresenceCandidate[]>;
  findUnique?: (...args: any[]) => Promise<DriverPresence | null>;
  updateMany?: (...args: any[]) => Promise<{ count: number }>;
} | null {
  const candidate = prisma as unknown as {
    driverPresence?: {
      upsert?: (...args: any[]) => Promise<DriverPresence>;
      findMany?: (...args: any[]) => Promise<DriverPresenceCandidate[]>;
      findUnique?: (...args: any[]) => Promise<DriverPresence | null>;
      updateMany?: (...args: any[]) => Promise<{ count: number }>;
    };
  };
  return candidate.driverPresence ?? null;
}

function haversineKm(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }) {
  const earthRadiusKm = 6371;
  const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function ensureTenantScope(rideTenantId: string, actorTenantId: string) {
  if (rideTenantId !== actorTenantId) {
    throw new BookingError('Cross-tenant access is not allowed.', 403, 'TENANT_SCOPE_VIOLATION');
  }
}

function ensureRole(role: UserRole, expected: UserRole) {
  if (role !== expected) {
    throw new BookingError('Forbidden for this role.', 403, 'FORBIDDEN_ROLE');
  }
}

async function fetchRoadRoute(pickup: QuoteInput['pickup'], dropoff: QuoteInput['dropoff']) {
  const coordinateString = `${pickup.longitude},${pickup.latitude};${dropoff.longitude},${dropoff.latitude}`;
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordinateString}?overview=full&geometries=geojson&steps=false`;

  const response = await fetch(osrmUrl, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new BookingError('Road routing service is currently unavailable.', 502, 'ROUTING_UNAVAILABLE');
  }

  const data = (await response.json()) as OsrmRouteResponse;
  const route = data.routes?.[0];

  if (!route?.geometry?.coordinates || route.geometry.coordinates.length < 2) {
    throw new BookingError('No route geometry returned by routing service.', 502, 'ROUTING_EMPTY');
  }

  return {
    routeCoordinates: route.geometry.coordinates,
    distanceKm: Number(((route.distance ?? 0) / 1000).toFixed(2)),
    estimatedDurationMin: Math.max(1, Math.ceil((route.duration ?? 0) / 60)),
  };
}

function calculateFare(distanceKm: number, estimatedDurationMin: number): FareBreakdown {
  const perKmFare = Number((distanceKm * BOOKING_FARE.PER_KM).toFixed(2));
  const perMinuteFare = Number((estimatedDurationMin * BOOKING_FARE.PER_MINUTE).toFixed(2));
  const totalFare = Number((BOOKING_FARE.BASE_FARE + perKmFare + perMinuteFare).toFixed(2));

  return {
    baseFare: BOOKING_FARE.BASE_FARE,
    perKmFare,
    perMinuteFare,
    totalFare,
    distanceKm,
    estimatedDurationMin,
  };
}

async function maybeCleanupStaleDriverPresence(prisma: ReturnType<typeof getPrisma>) {
  const now = Date.now();
  const lastCleanupAt = globalForPresenceCleanup.__trisseaLastPresenceCleanupAt ?? 0;

  if (now - lastCleanupAt < DRIVER_STALE_CLEANUP_INTERVAL_SECONDS * 1000) {
    return;
  }

  globalForPresenceCleanup.__trisseaLastPresenceCleanupAt = now;

  const cutoff = new Date(now - DRIVER_HEARTBEAT_MAX_AGE_SECONDS * 1000);
  const delegate = getDriverPresenceDelegate(prisma);

  if (delegate?.updateMany) {
    await delegate.updateMany({
      where: {
        isOnline: true,
        lastHeartbeatAt: {
          lt: cutoff,
        },
      },
      data: {
        isOnline: false,
      },
    });
    return;
  }

  await prisma.$executeRaw`
    UPDATE "DriverPresence"
    SET "isOnline" = false, "updatedAt" = ${new Date()}
    WHERE "isOnline" = true
      AND "lastHeartbeatAt" < ${cutoff}
  `;
}

async function upsertDriverPresenceRecord(
  prisma: ReturnType<typeof getPrisma>,
  driverUser: BookingActor,
  payload: DriverPresenceInput
): Promise<DriverPresence> {
  if (payload.isOnline) {
    const delegate = getDriverPresenceDelegate(prisma);
    const current =
      delegate?.findUnique
        ? await delegate.findUnique({
            where: { driverId: driverUser.id },
          })
        : (
            await prisma.$queryRaw<DriverPresence[]>`
              SELECT
                "driverId",
                "tenantId",
                "isOnline",
                "latitude",
                "longitude",
                "heading",
                "accuracy",
                "lastHeartbeatAt",
                "createdAt",
                "updatedAt"
              FROM "DriverPresence"
              WHERE "driverId" = ${driverUser.id}
              LIMIT 1
            `
          )[0] ?? null;

    if (current?.isOnline) {
      const ageMs = Date.now() - current.lastHeartbeatAt.getTime();
      if (ageMs < DRIVER_HEARTBEAT_MIN_INTERVAL_SECONDS * 1000) {
        return current;
      }
    }
  }

  const delegate = getDriverPresenceDelegate(prisma);
  if (delegate?.upsert) {
    return delegate.upsert({
      where: { driverId: driverUser.id },
      create: {
        driverId: driverUser.id,
        tenantId: driverUser.tenantId,
        isOnline: payload.isOnline,
        latitude: payload.latitude,
        longitude: payload.longitude,
        heading: payload.heading,
        accuracy: payload.accuracy,
        lastHeartbeatAt: new Date(),
      },
      update: {
        tenantId: driverUser.tenantId,
        isOnline: payload.isOnline,
        latitude: payload.latitude,
        longitude: payload.longitude,
        heading: payload.heading,
        accuracy: payload.accuracy,
        lastHeartbeatAt: new Date(),
      },
    });
  }

  const now = new Date();
  const latitude = typeof payload.latitude === 'number' ? payload.latitude : null;
  const longitude = typeof payload.longitude === 'number' ? payload.longitude : null;
  const heading = typeof payload.heading === 'number' ? payload.heading : null;
  const accuracy = typeof payload.accuracy === 'number' ? payload.accuracy : null;

  await prisma.$executeRaw`
    INSERT INTO "DriverPresence" (
      "driverId",
      "tenantId",
      "isOnline",
      "latitude",
      "longitude",
      "heading",
      "accuracy",
      "lastHeartbeatAt",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${driverUser.id},
      ${driverUser.tenantId},
      ${payload.isOnline},
      ${latitude},
      ${longitude},
      ${heading},
      ${accuracy},
      ${now},
      ${now},
      ${now}
    )
    ON CONFLICT ("driverId")
    DO UPDATE SET
      "tenantId" = EXCLUDED."tenantId",
      "isOnline" = EXCLUDED."isOnline",
      "latitude" = EXCLUDED."latitude",
      "longitude" = EXCLUDED."longitude",
      "heading" = EXCLUDED."heading",
      "accuracy" = EXCLUDED."accuracy",
      "lastHeartbeatAt" = EXCLUDED."lastHeartbeatAt",
      "updatedAt" = EXCLUDED."updatedAt"
  `;

  const rows = await prisma.$queryRaw<DriverPresence[]>`
    SELECT
      "driverId",
      "tenantId",
      "isOnline",
      "latitude",
      "longitude",
      "heading",
      "accuracy",
      "lastHeartbeatAt",
      "createdAt",
      "updatedAt"
    FROM "DriverPresence"
    WHERE "driverId" = ${driverUser.id}
    LIMIT 1
  `;

  const presence = rows[0];
  if (!presence) {
    throw new BookingError('Failed to persist driver presence.', 500, 'PRESENCE_UPSERT_FAILED');
  }

  return presence;
}

async function findRideOrThrow(prisma: Prisma.TransactionClient | ReturnType<typeof getPrisma>, rideId: string) {
  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride) {
    throw new BookingError('Ride not found.', 404, 'RIDE_NOT_FOUND');
  }
  return ride;
}

export async function quoteOnDemandRide(input: QuoteInput, _tenantId: string): Promise<OnDemandQuoteResult> {
  const route = await fetchRoadRoute(input.pickup, input.dropoff);
  return {
    fare: calculateFare(route.distanceKm, route.estimatedDurationMin),
    routeCoordinates: route.routeCoordinates,
  };
}

export async function assignNearestDriver(rideId: string): Promise<Ride> {
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const ride = await findRideOrThrow(tx, rideId);

    if (ride.status !== 'searching' || ride.driverId) {
      return ride;
    }

    const cutoff = new Date(Date.now() - DRIVER_HEARTBEAT_MAX_AGE_SECONDS * 1000);

    const activeDriverRides = await tx.ride.findMany({
      where: {
        tenantId: ride.tenantId,
        driverId: { not: null },
        status: { in: ACTIVE_ON_DEMAND_DRIVER_STATUSES },
      },
      select: { driverId: true },
    });

    const busyDriverIds = new Set(
      activeDriverRides.map((entry) => entry.driverId).filter((id): id is string => Boolean(id))
    );

    const driverPresenceDelegate = getDriverPresenceDelegate(tx);
    const candidates = driverPresenceDelegate?.findMany
      ? await driverPresenceDelegate.findMany({
          where: {
            tenantId: ride.tenantId,
            isOnline: true,
            lastHeartbeatAt: { gte: cutoff },
            latitude: { not: null },
            longitude: { not: null },
            User: {
              role: 'driver',
            },
          },
          select: {
            driverId: true,
            latitude: true,
            longitude: true,
          },
        })
      : await tx.$queryRaw<DriverPresenceCandidate[]>`
          SELECT
            dp."driverId",
            dp."latitude",
            dp."longitude"
          FROM "DriverPresence" dp
          INNER JOIN "User" u ON u."id" = dp."driverId"
          WHERE dp."tenantId" = ${ride.tenantId}
            AND dp."isOnline" = true
            AND dp."lastHeartbeatAt" >= ${cutoff}
            AND dp."latitude" IS NOT NULL
            AND dp."longitude" IS NOT NULL
            AND u."role" = 'driver'
        `;

    const available = candidates.filter((candidate) => !busyDriverIds.has(candidate.driverId));

    if (available.length === 0) {
      return ride;
    }

    let nearest = available[0];
    let nearestDistance = haversineKm(
      { latitude: ride.pickupLatitude, longitude: ride.pickupLongitude },
      { latitude: nearest.latitude ?? ride.pickupLatitude, longitude: nearest.longitude ?? ride.pickupLongitude }
    );

    for (const candidate of available.slice(1)) {
      const distance = haversineKm(
        { latitude: ride.pickupLatitude, longitude: ride.pickupLongitude },
        {
          latitude: candidate.latitude ?? ride.pickupLatitude,
          longitude: candidate.longitude ?? ride.pickupLongitude,
        }
      );
      if (distance < nearestDistance) {
        nearest = candidate;
        nearestDistance = distance;
      }
    }

    const matched = await tx.ride.update({
      where: { id: ride.id },
      data: {
        driverId: nearest.driverId,
        status: 'matched',
        driverLatitude: nearest.latitude,
        driverLongitude: nearest.longitude,
      },
    });

    emitBookingEvent({
      type: 'ride.updated',
      tenantId: matched.tenantId,
      entityId: matched.id,
      payload: matched,
    });

    return matched;
  });
}

export async function createOnDemandRide(input: QuoteInput, passengerUser: BookingActor): Promise<Ride> {
  ensureRole(passengerUser.role, 'passenger');

  const prisma = getPrisma();
  const activeRide = await prisma.ride.findFirst({
    where: {
      tenantId: passengerUser.tenantId,
      passengerId: passengerUser.id,
      rideType: 'on-demand',
      status: {
        in: ACTIVE_ON_DEMAND_PASSENGER_STATUSES,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (activeRide) {
    return activeRide;
  }

  const quote = await quoteOnDemandRide(input, passengerUser.tenantId);

  const ride = await prisma.ride.create({
    data: {
      id: randomUUID(),
      tenantId: passengerUser.tenantId,
      passengerId: passengerUser.id,
      pickupLocation: input.pickupLabel ?? 'Pinned pickup',
      dropoffLocation: input.dropoffLabel ?? 'Pinned dropoff',
      pickupLatitude: input.pickup.latitude,
      pickupLongitude: input.pickup.longitude,
      dropoffLatitude: input.dropoff.latitude,
      dropoffLongitude: input.dropoff.longitude,
      status: 'searching',
      fare: quote.fare.totalFare,
      distance: quote.fare.distanceKm,
      estimatedDuration: quote.fare.estimatedDurationMin,
      rideType: 'on-demand',
    },
  });

  emitBookingEvent({
    type: 'ride.updated',
    tenantId: ride.tenantId,
    entityId: ride.id,
    payload: ride,
  });

  return assignNearestDriver(ride.id);
}

export async function upsertDriverPresence(
  driverUser: BookingActor,
  payload: DriverPresenceInput
): Promise<{ presence: DriverPresence; newlyAssignedRideId?: string }> {
  ensureRole(driverUser.role, 'driver');

  const prisma = getPrisma();
  await maybeCleanupStaleDriverPresence(prisma);
  const presence = await upsertDriverPresenceRecord(prisma, driverUser, payload);

  emitBookingEvent({
    type: 'presence.updated',
    tenantId: presence.tenantId,
    entityId: presence.driverId,
    payload: presence,
  });

  if (!payload.isOnline) {
    return { presence };
  }

  // Skip auto-assignment when no coordinates were supplied.
  if (typeof presence.latitude !== 'number' || typeof presence.longitude !== 'number') {
    return { presence };
  }

  try {
    const activeRide = await prisma.ride.findFirst({
      where: {
        tenantId: driverUser.tenantId,
        driverId: driverUser.id,
        status: { in: ACTIVE_ON_DEMAND_DRIVER_STATUSES },
      },
    });

    if (activeRide) {
      return { presence };
    }

    const searchingRides = await prisma.ride.findMany({
      where: {
        tenantId: driverUser.tenantId,
        rideType: 'on-demand',
        status: 'searching',
        driverId: null,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (searchingRides.length === 0) {
      return { presence };
    }

    let selectedRide = searchingRides[0];
    let nearestDistance = haversineKm(
      { latitude: presence.latitude, longitude: presence.longitude },
      { latitude: selectedRide.pickupLatitude, longitude: selectedRide.pickupLongitude }
    );

    for (const ride of searchingRides.slice(1)) {
      const distance = haversineKm(
        { latitude: presence.latitude, longitude: presence.longitude },
        { latitude: ride.pickupLatitude, longitude: ride.pickupLongitude }
      );
      if (distance < nearestDistance) {
        selectedRide = ride;
        nearestDistance = distance;
      }
    }

    const claim = await prisma.ride.updateMany({
      where: {
        id: selectedRide.id,
        status: 'searching',
        driverId: null,
      },
      data: {
        status: 'matched',
        driverId: driverUser.id,
        driverLatitude: presence.latitude,
        driverLongitude: presence.longitude,
      },
    });

    if (claim.count === 0) {
      return { presence };
    }

    const claimedRide = await prisma.ride.findUnique({ where: { id: selectedRide.id } });
    if (claimedRide) {
      emitBookingEvent({
        type: 'ride.updated',
        tenantId: claimedRide.tenantId,
        entityId: claimedRide.id,
        payload: claimedRide,
      });
    }

    return { presence, newlyAssignedRideId: selectedRide.id };
  } catch (error) {
    logError('booking.driver.auto_assignment_failed', {
      code: 'AUTO_ASSIGNMENT_FAILED',
      driverId: driverUser.id,
      tenantId: driverUser.tenantId,
      error: error instanceof Error ? error.message : 'unknown',
    });
    return { presence };
  }
}

export async function transitionRide(
  rideId: string,
  actorUser: BookingActor,
  action: RideTransitionAction
): Promise<Ride> {
  ensureRole(actorUser.role, 'driver');

  const prisma = getPrisma();
  const ride = await findRideOrThrow(prisma, rideId);

  ensureTenantScope(ride.tenantId, actorUser.tenantId);

  if (ride.driverId !== actorUser.id) {
    throw new BookingError('Only the assigned driver can change ride status.', 403, 'NOT_ASSIGNED_DRIVER');
  }

  if (action === 'passenger_cancel') {
    throw new BookingError('Unsupported transition action.', 400, 'INVALID_ACTION');
  }

  const nextStatus = resolveRideTransition(ride.status, action);
  if (!nextStatus) {
    throw new BookingError('Invalid transition for the current ride status.', 409, 'INVALID_TRANSITION');
  }

  const data: Prisma.RideUpdateInput = {};

  switch (action) {
    case 'start_trip':
      data.startedAt = ride.startedAt ?? new Date();
      break;
    case 'complete_trip':
      data.completedAt = new Date();
      if (ride.startedAt) {
        const diffMinutes = Math.max(1, Math.ceil((Date.now() - ride.startedAt.getTime()) / 60000));
        data.actualDuration = diffMinutes;
      }
      break;
    default:
      break;
  }

  const updated = await prisma.ride.update({
    where: { id: ride.id },
    data: {
      status: nextStatus,
      ...data,
    },
  });

  emitBookingEvent({
    type: 'ride.updated',
    tenantId: updated.tenantId,
    entityId: updated.id,
    payload: updated,
  });

  return updated;
}

export async function cancelRideByPassenger(rideId: string, passengerUser: BookingActor): Promise<Ride> {
  ensureRole(passengerUser.role, 'passenger');

  const prisma = getPrisma();
  const ride = await findRideOrThrow(prisma, rideId);

  ensureTenantScope(ride.tenantId, passengerUser.tenantId);

  if (ride.passengerId !== passengerUser.id) {
    throw new BookingError('Only the ride passenger can cancel this ride.', 403, 'NOT_RIDE_PASSENGER');
  }

  if (ride.status === 'cancelled') {
    return ride;
  }

  if (!resolveRideTransition(ride.status, 'passenger_cancel')) {
    throw new BookingError('Passenger can cancel only before trip starts.', 409, 'INVALID_TRANSITION');
  }

  const cancelled = await prisma.ride.update({
    where: { id: ride.id },
    data: { status: 'cancelled' },
  });

  emitBookingEvent({
    type: 'ride.updated',
    tenantId: cancelled.tenantId,
    entityId: cancelled.id,
    payload: cancelled,
  });

  return cancelled;
}

export async function listActiveRideForPassenger(passengerUser: BookingActor): Promise<Ride | null> {
  ensureRole(passengerUser.role, 'passenger');

  const prisma = getPrisma();
  return prisma.ride.findFirst({
    where: {
      tenantId: passengerUser.tenantId,
      passengerId: passengerUser.id,
      rideType: 'on-demand',
      status: { in: ACTIVE_ON_DEMAND_PASSENGER_STATUSES },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listActiveRideForDriver(driverUser: BookingActor): Promise<Ride | null> {
  ensureRole(driverUser.role, 'driver');

  const prisma = getPrisma();
  return prisma.ride.findFirst({
    where: {
      tenantId: driverUser.tenantId,
      driverId: driverUser.id,
      rideType: 'on-demand',
      status: { in: ACTIVE_ON_DEMAND_DRIVER_STATUSES },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listAssignedRidesForDriver(driverUser: BookingActor): Promise<Ride[]> {
  ensureRole(driverUser.role, 'driver');

  const prisma = getPrisma();
  return prisma.ride.findMany({
    where: {
      tenantId: driverUser.tenantId,
      driverId: driverUser.id,
      rideType: 'on-demand',
      status: { in: ACTIVE_ON_DEMAND_DRIVER_STATUSES },
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
  });
}

export async function createTodaReservation(
  passengerUser: BookingActor,
  terminalId: string,
  boardingTime?: Date
): Promise<Reservation> {
  ensureRole(passengerUser.role, 'passenger');

  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const terminal = await tx.tODATerminal.findUnique({ where: { id: terminalId } });
    if (!terminal) {
      throw new BookingError('Terminal not found.', 404, 'TERMINAL_NOT_FOUND');
    }

    ensureTenantScope(terminal.tenantId, passengerUser.tenantId);

    const existingReservation = await tx.reservation.findFirst({
      where: {
        tenantId: passengerUser.tenantId,
        terminalId,
        passengerId: passengerUser.id,
        status: {
          in: ['confirmed', 'arrived'],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingReservation) {
      return existingReservation;
    }

    const highestQueue = await tx.reservation.findFirst({
      where: {
        terminalId,
        status: { in: ['confirmed', 'arrived'] },
      },
      orderBy: { queuePosition: 'desc' },
      select: { queuePosition: true },
    });

    const queuePosition = (highestQueue?.queuePosition ?? 0) + 1;

    const reservation = await tx.reservation.create({
      data: {
        id: randomUUID(),
        tenantId: passengerUser.tenantId,
        passengerId: passengerUser.id,
        terminalId,
        boardingTime: boardingTime ?? new Date(),
        status: 'confirmed',
        queuePosition,
      },
    });

    const terminalUpdated = await tx.tODATerminal.update({
      where: { id: terminalId },
      data: { currentQueued: terminal.currentQueued + 1 },
    });

    emitBookingEvent({
      type: 'reservation.updated',
      tenantId: reservation.tenantId,
      entityId: reservation.id,
      payload: reservation,
    });

    emitBookingEvent({
      type: 'terminal.updated',
      tenantId: terminalUpdated.tenantId,
      entityId: terminalUpdated.id,
      payload: terminalUpdated,
    });

    return reservation;
  });
}

export async function cancelTodaReservation(
  reservationId: string,
  passengerUser: BookingActor
): Promise<Reservation> {
  ensureRole(passengerUser.role, 'passenger');

  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({ where: { id: reservationId } });
    if (!reservation) {
      throw new BookingError('Reservation not found.', 404, 'RESERVATION_NOT_FOUND');
    }

    ensureTenantScope(reservation.tenantId, passengerUser.tenantId);

    if (reservation.passengerId !== passengerUser.id) {
      throw new BookingError('Only the reservation owner can cancel.', 403, 'NOT_RESERVATION_OWNER');
    }

    if (reservation.status !== 'confirmed') {
      throw new BookingError('Only confirmed reservations can be cancelled.', 409, 'INVALID_RESERVATION_STATUS');
    }

    const cancelled = await tx.reservation.update({
      where: { id: reservation.id },
      data: { status: 'cancelled' },
    });

    await tx.reservation.updateMany({
      where: {
        terminalId: reservation.terminalId,
        status: 'confirmed',
        queuePosition: { gt: reservation.queuePosition },
      },
      data: {
        queuePosition: { decrement: 1 },
      },
    });

    const terminal = await tx.tODATerminal.findUnique({ where: { id: reservation.terminalId } });
    if (!terminal) {
      throw new BookingError('Terminal not found.', 404, 'TERMINAL_NOT_FOUND');
    }

    const terminalUpdated = await tx.tODATerminal.update({
      where: { id: reservation.terminalId },
      data: {
        currentQueued: Math.max(0, terminal.currentQueued - 1),
      },
    });

    emitBookingEvent({
      type: 'reservation.updated',
      tenantId: cancelled.tenantId,
      entityId: cancelled.id,
      payload: cancelled,
    });

    emitBookingEvent({
      type: 'terminal.updated',
      tenantId: terminalUpdated.tenantId,
      entityId: terminalUpdated.id,
      payload: terminalUpdated,
    });

    return cancelled;
  });
}

export async function dispatchNextTodaPassenger(
  terminalId: string,
  driverUser: BookingActor
): Promise<Reservation | null> {
  ensureRole(driverUser.role, 'driver');

  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const terminal = await tx.tODATerminal.findUnique({ where: { id: terminalId } });
    if (!terminal) {
      throw new BookingError('Terminal not found.', 404, 'TERMINAL_NOT_FOUND');
    }

    ensureTenantScope(terminal.tenantId, driverUser.tenantId);

    const nextReservation = await tx.reservation.findFirst({
      where: {
        terminalId,
        status: 'confirmed',
      },
      orderBy: { queuePosition: 'asc' },
    });

    if (!nextReservation) {
      return null;
    }

    const dispatched = await tx.reservation.update({
      where: { id: nextReservation.id },
      data: { status: 'arrived' },
    });

    emitBookingEvent({
      type: 'reservation.updated',
      tenantId: dispatched.tenantId,
      entityId: dispatched.id,
      payload: dispatched,
    });

    return dispatched;
  });
}

export async function completeTodaReservation(
  reservationId: string,
  driverUser: BookingActor
): Promise<Reservation> {
  ensureRole(driverUser.role, 'driver');

  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({ where: { id: reservationId } });
    if (!reservation) {
      throw new BookingError('Reservation not found.', 404, 'RESERVATION_NOT_FOUND');
    }

    ensureTenantScope(reservation.tenantId, driverUser.tenantId);

    if (reservation.status !== 'arrived') {
      throw new BookingError('Only arrived reservations can be completed.', 409, 'INVALID_RESERVATION_STATUS');
    }

    const completed = await tx.reservation.update({
      where: { id: reservation.id },
      data: { status: 'completed' },
    });

    await tx.reservation.updateMany({
      where: {
        terminalId: reservation.terminalId,
        status: 'confirmed',
        queuePosition: { gt: reservation.queuePosition },
      },
      data: {
        queuePosition: { decrement: 1 },
      },
    });

    const terminal = await tx.tODATerminal.findUnique({ where: { id: reservation.terminalId } });
    if (!terminal) {
      throw new BookingError('Terminal not found.', 404, 'TERMINAL_NOT_FOUND');
    }

    const terminalUpdated = await tx.tODATerminal.update({
      where: { id: reservation.terminalId },
      data: {
        currentQueued: Math.max(0, terminal.currentQueued - 1),
      },
    });

    emitBookingEvent({
      type: 'reservation.updated',
      tenantId: completed.tenantId,
      entityId: completed.id,
      payload: completed,
    });

    emitBookingEvent({
      type: 'terminal.updated',
      tenantId: terminalUpdated.tenantId,
      entityId: terminalUpdated.id,
      payload: terminalUpdated,
    });

    return completed;
  });
}
