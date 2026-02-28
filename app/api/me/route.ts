import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const prisma = getPrisma();
  let auth;

  try {
    auth = await requireAuth(request);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

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
