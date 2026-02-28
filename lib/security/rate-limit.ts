import { NextRequest } from 'next/server';

type BucketEntry = {
  count: number;
  resetAt: number;
};

interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: number;
}

const globalForRateLimit = globalThis as unknown as {
  __trisseaRateLimitStore: Map<string, BucketEntry> | undefined;
  __trisseaRateLimitLastPruneAt: number | undefined;
};

const rateLimitStore =
  globalForRateLimit.__trisseaRateLimitStore ?? (globalForRateLimit.__trisseaRateLimitStore = new Map());

function pruneExpiredBuckets(now: number) {
  const lastPruneAt = globalForRateLimit.__trisseaRateLimitLastPruneAt ?? 0;
  if (now - lastPruneAt < 60_000) {
    return;
  }

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }

  globalForRateLimit.__trisseaRateLimitLastPruneAt = now;
}

export function resolveClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  return 'unknown';
}

export function checkRateLimit({ key, limit, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  pruneExpiredBuckets(now);

  const current = rateLimitStore.get(key);
  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      retryAfterSeconds: 0,
      resetAt,
    };
  }

  const nextCount = current.count + 1;
  current.count = nextCount;
  rateLimitStore.set(key, current);

  if (nextCount > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
      resetAt: current.resetAt,
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, limit - nextCount),
    retryAfterSeconds: 0,
    resetAt: current.resetAt,
  };
}
