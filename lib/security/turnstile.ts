import { NextRequest } from 'next/server';
import { resolveClientIp } from '@/lib/security/rate-limit';

interface TurnstileVerifyResult {
  ok: boolean;
  reason?: string;
  unavailable?: boolean;
}

export async function verifyTurnstile(request: NextRequest): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    return { ok: true };
  }

  const token = request.headers.get('x-turnstile-token')?.trim();
  if (!token) {
    return { ok: false, reason: 'Missing bot verification token.' };
  }

  try {
    const params = new URLSearchParams();
    params.set('secret', secret);
    params.set('response', token);
    params.set('remoteip', resolveClientIp(request));

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: params,
      cache: 'no-store',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      return { ok: false, reason: 'Bot verification service unavailable.', unavailable: true };
    }

    const payload = (await response.json()) as { success?: boolean };
    if (!payload.success) {
      return { ok: false, reason: 'Bot verification failed.' };
    }

    return { ok: true };
  } catch {
    return { ok: false, reason: 'Bot verification service unavailable.', unavailable: true };
  }
}
