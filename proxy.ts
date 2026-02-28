import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const PROTECTED_PREFIXES = ['/passenger', '/driver', '/admin', '/superadmin'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!isProtected) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('sb-access-token')?.value?.trim();
  if (!accessToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/passenger/:path*', '/driver/:path*', '/admin/:path*', '/superadmin/:path*'],
};
