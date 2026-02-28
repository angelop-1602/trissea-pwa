import { NextRequest, NextResponse } from 'next/server';
import { AuthError, requireAuth } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { ensurePhoneE164Compatibility } from '@/lib/prisma-compat';

export async function GET(request: NextRequest) {
  const prisma = getPrisma();
  let auth;

  try {
    auth = await requireAuth(request);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  await ensurePhoneE164Compatibility(prisma);

  const user = await prisma.user.findUnique({
    where: { supabaseId: auth.supabaseUserId },
    include: {
      Tenant: {
        include: { Region: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
  }

  return NextResponse.json({
    user,
    tenant: user.Tenant,
    region: user.Tenant.Region,
  });
}
