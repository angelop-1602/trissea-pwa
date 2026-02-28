import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAnonServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { getPrisma } from '@/lib/prisma';
import { randomUUID } from 'node:crypto';

const bodySchema = z.object({
  phone: z.string().min(6),
  token: z.string().min(4),
});

export async function POST(request: NextRequest) {
  const prisma = getPrisma();
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAnonServerClient();
    const { data, error } = await supabase.auth.verifyOtp({
      phone: parsed.data.phone,
      token: parsed.data.token,
      type: 'sms',
    });

    if (error || !data.session || !data.user) {
      return NextResponse.json({ error: error?.message ?? 'OTP verification failed.' }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { data: userData, error: userError } = await admin.auth.getUser(data.session.access_token);

    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Failed to load user.' }, { status: 400 });
    }

    const phone = userData.user.phone ?? parsed.data.phone;

    const defaultTenant = await prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!defaultTenant) {
      return NextResponse.json({ error: 'No tenant found. Seed the database first.' }, { status: 500 });
    }

    const profile = await prisma.user.upsert({
      where: { supabaseId: userData.user.id },
      update: {
        phone,
        updatedAt: new Date(),
      },
      create: {
        id: randomUUID(),
        supabaseId: userData.user.id,
        phone,
        name: phone,
        role: 'passenger',
        tenantId: defaultTenant.id,
        updatedAt: new Date(),
      },
    });

    const response = NextResponse.json({
      ok: true,
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

    return NextResponse.json(
      {
        error: isNetworkIssue
          ? 'Auth service is unreachable. Verify NEXT_PUBLIC_SUPABASE_URL and your network.'
          : 'OTP verification failed.',
      },
      { status: isNetworkIssue ? 503 : 500 }
    );
  }
}
