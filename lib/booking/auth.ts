import { NextRequest } from 'next/server';
import type { Prisma } from '@prisma/client';
import { requireAuth } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { ensurePhoneE164Compatibility } from '@/lib/prisma-compat';
import type { BookingActor } from '@/lib/booking/types';
import { BookingError } from '@/lib/booking/errors';

export type BookingProfile = Prisma.UserGetPayload<{
  include: {
    Tenant: {
      include: {
        Region: true;
      };
    };
  };
}>;

export async function requireBookingProfile(request: NextRequest): Promise<BookingProfile> {
  const auth = await requireAuth(request);
  const prisma = getPrisma();
  await ensurePhoneE164Compatibility(prisma);

  const user = await prisma.user.findUnique({
    where: { supabaseId: auth.supabaseUserId },
    include: {
      Tenant: {
        include: {
          Region: true,
        },
      },
    },
  });

  if (!user) {
    throw new BookingError('User profile not found.', 404, 'PROFILE_NOT_FOUND');
  }

  return user;
}

export function toBookingActor(user: BookingProfile): BookingActor {
  return {
    id: user.id,
    role: user.role,
    tenantId: user.tenantId,
  };
}
