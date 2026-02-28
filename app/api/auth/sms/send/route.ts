import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseAnonServerClient } from '@/lib/supabase/server';
import { normalizePhoneE164 } from '@/lib/auth/phone';
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
});

export async function POST(request: NextRequest) {
  const requestId = getRequestIdFromHeaders(request.headers);
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return bookingError(requestId, 'Invalid request body.', 400, 'INVALID_REQUEST');
  }

  try {
    const normalizedPhone = normalizePhoneE164(parsed.data.phone);

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
      scope: 'auth.sms.send.ip',
      limit: 20,
      windowMs: 10 * 60_000,
    });
    if (!ipLimit.allowed) {
      return rateLimitedResponse(requestId, ipLimit.retryAfterSeconds);
    }

    const phoneLimit = checkEndpointRateLimit(request, {
      scope: 'auth.sms.send.phone',
      limit: 5,
      windowMs: 10 * 60_000,
      keyParts: [normalizedPhone],
    });
    if (!phoneLimit.allowed) {
      return rateLimitedResponse(requestId, phoneLimit.retryAfterSeconds);
    }

    const supabase = createSupabaseAnonServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      return bookingError(requestId, error.message, 400, 'INVALID_REQUEST');
    }

    return bookingSuccess(requestId, { ok: true });
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
        : 'Failed to send OTP.',
      isNetworkIssue ? 503 : 500,
      isNetworkIssue ? 'AUTH_UNAVAILABLE' : 'INTERNAL_ERROR'
    );
  }
}
