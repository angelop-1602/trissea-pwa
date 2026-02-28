import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAnonServerClient } from '@/lib/supabase/server';

const bodySchema = z.object({
  phone: z.string().min(6),
});

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAnonServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      phone: parsed.data.phone,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to contact authentication provider.';
    const isNetworkIssue =
      message.includes('ENOTFOUND') ||
      message.includes('fetch failed') ||
      message.includes('ECONNREFUSED') ||
      message.includes('ETIMEDOUT');

    return NextResponse.json(
      {
        error: isNetworkIssue
          ? 'Auth service is unreachable. Verify NEXT_PUBLIC_SUPABASE_URL and your network.'
          : 'Failed to send OTP.',
      },
      { status: isNetworkIssue ? 503 : 500 }
    );
  }
}
