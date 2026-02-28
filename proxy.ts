import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateProxySession } from '@/lib/supabase/server-ssr';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const PROTECTED_PREFIXES = ['/passenger', '/driver', '/admin', '/superadmin'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!isProtected) {
    return NextResponse.next();
  }

  const { response, user } = await updateProxySession(request);

  if (!user) {
    const legacyAccessToken = request.cookies.get('sb-access-token')?.value?.trim();
    if (legacyAccessToken) {
      const admin = createSupabaseAdminClient();
      const { data, error } = await admin.auth.getUser(legacyAccessToken);

      if (!error && data.user) {
        return response;
      }
    }

    const redirect = NextResponse.redirect(new URL('/login', request.url));
    redirect.cookies.delete('sb-access-token');
    redirect.cookies.delete('sb-refresh-token');
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ['/passenger/:path*', '/driver/:path*', '/admin/:path*', '/superadmin/:path*'],
};
