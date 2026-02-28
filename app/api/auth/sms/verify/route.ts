import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient, createSupabaseAnonServerClient } from '@/lib/supabase/server';
import { getPrisma } from '@/lib/prisma';
import { ensurePhoneE164Compatibility } from '@/lib/prisma-compat';
import { buildPhoneVariants, normalizePhoneE164 } from '@/lib/auth/phone';
import {
  bookingError,
  bookingSuccess,
  getRequestIdFromHeaders,
  rateLimitedResponse,
} from '@/lib/booking/http';
import { checkEndpointRateLimit } from '@/lib/security/rate-limit-endpoint';
import { verifyTurnstile } from '@/lib/security/turnstile';

const bodySchema = z.object({
  phone: z.string().min(6),
  token: z.string().min(4),
});

export async function POST(request: NextRequest) {
  const requestId = getRequestIdFromHeaders(request.headers);
  const prisma = getPrisma();
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return bookingError(requestId, 'Invalid request body.', 400, 'INVALID_REQUEST');
  }

  const normalizedInputPhone = normalizePhoneE164(parsed.data.phone);

  const botCheck = await verifyTurnstile(request);
  if (!botCheck.ok) {
    return bookingError(
      requestId,
      botCheck.reason ?? 'Bot verification failed.',
      botCheck.unavailable ? 503 : 400,
      botCheck.unavailable ? 'AUTH_UNAVAILABLE' : 'INVALID_REQUEST'
    );
  }

  const ipLimit = checkEndpointRateLimit(request, {
    scope: 'auth.sms.verify.ip',
    limit: 40,
    windowMs: 10 * 60_000,
  });
  if (!ipLimit.allowed) {
    return rateLimitedResponse(requestId, ipLimit.retryAfterSeconds);
  }

  const phoneLimit = checkEndpointRateLimit(request, {
    scope: 'auth.sms.verify.phone',
    limit: 10,
    windowMs: 10 * 60_000,
    keyParts: [normalizedInputPhone],
  });
  if (!phoneLimit.allowed) {
    return rateLimitedResponse(requestId, phoneLimit.retryAfterSeconds);
  }

  try {
    await ensurePhoneE164Compatibility(prisma);

    const supabase = createSupabaseAnonServerClient();
    const { data, error } = await supabase.auth.verifyOtp({
      phone: normalizedInputPhone,
      token: parsed.data.token,
      type: 'sms',
    });

    if (error || !data.session || !data.user) {
      return bookingError(requestId, error?.message ?? 'OTP verification failed.', 400, 'INVALID_REQUEST');
    }

    const admin = createSupabaseAdminClient();
    const { data: userData, error: userError } = await admin.auth.getUser(data.session.access_token);

    if (userError || !userData.user) {
      return bookingError(requestId, 'Failed to load user.', 400, 'AUTH_UNAUTHORIZED');
    }

    const canonicalPhone = normalizePhoneE164(userData.user.phone ?? normalizedInputPhone);
    const phoneVariants = buildPhoneVariants(canonicalPhone, parsed.data.phone, normalizedInputPhone);

    const defaultTenant = await prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!defaultTenant) {
      return bookingError(requestId, 'No tenant found. Seed the database first.', 500, 'INTERNAL_ERROR');
    }

    const profile = await prisma.$transaction(async (tx) => {
      const profileByPhoneE164 = await tx.user.findFirst({
        where: { phoneE164: canonicalPhone },
      });

      const profileBySupabase = await tx.user.findUnique({
        where: { supabaseId: userData.user.id },
      });

      if (profileByPhoneE164) {
        if (profileBySupabase && profileBySupabase.id !== profileByPhoneE164.id) {
          await tx.user.update({
            where: { id: profileBySupabase.id },
            data: {
              supabaseId: null,
              updatedAt: new Date(),
            },
          });
        }

        return tx.user.update({
          where: { id: profileByPhoneE164.id },
          data: {
            supabaseId: userData.user.id,
            phoneE164: canonicalPhone,
            updatedAt: new Date(),
          },
        });
      }

      if (profileBySupabase) {
        return tx.user.update({
          where: { id: profileBySupabase.id },
          data: {
            phoneE164: canonicalPhone,
            updatedAt: new Date(),
          },
        });
      }

      const legacyProfile = await tx.user.findFirst({
        where: {
          OR: [
            {
              phone: {
                in: phoneVariants,
              },
            },
            {
              phoneE164: {
                in: phoneVariants,
              },
            },
          ],
        },
        orderBy: { createdAt: 'asc' },
      });

      if (legacyProfile) {
        return tx.user.update({
          where: { id: legacyProfile.id },
          data: {
            supabaseId: userData.user.id,
            phoneE164: canonicalPhone,
            updatedAt: new Date(),
          },
        });
      }

      return tx.user.create({
        data: {
          id: randomUUID(),
          supabaseId: userData.user.id,
          phone: canonicalPhone,
          phoneE164: canonicalPhone,
          name: canonicalPhone,
          role: 'passenger',
          tenantId: defaultTenant.id,
          updatedAt: new Date(),
        },
      });
    });

    const response = bookingSuccess(requestId, {
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        token_type: data.session.token_type,
      },
      profile,
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    response.cookies.set('sb-access-token', data.session.access_token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7,
    });

    if (data.session.refresh_token) {
      response.cookies.set('sb-refresh-token', data.session.refresh_token, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to contact authentication provider.';
    const isNetworkIssue =
      message.includes('ENOTFOUND') ||
      message.includes('fetch failed') ||
      message.includes('ECONNREFUSED') ||
      message.includes('ETIMEDOUT');

    return bookingError(
      requestId,
      isNetworkIssue
        ? 'Auth service is unreachable. Verify NEXT_PUBLIC_SUPABASE_URL and your network.'
        : 'OTP verification failed.',
      isNetworkIssue ? 503 : 500,
      isNetworkIssue ? 'AUTH_UNAVAILABLE' : 'INTERNAL_ERROR'
    );
  }
}
