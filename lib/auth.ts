import { NextRequest } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export type AuthContext = {
  supabaseUserId: string;
  phone?: string;
  email?: string;
  bearerToken: string;
};

export async function requireAuth(request: NextRequest): Promise<AuthContext> {
  const authorization = request.headers.get('authorization');
  const authHeaderToken =
    authorization && authorization.toLowerCase().startsWith('bearer ')
      ? authorization.slice('bearer '.length).trim()
      : '';
  const cookieToken = request.cookies.get('sb-access-token')?.value?.trim() ?? '';
  const bearerToken = authHeaderToken || cookieToken;

  if (!bearerToken) {
    throw new Response(JSON.stringify({ error: 'Unauthorized.' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(bearerToken);

  if (error || !data.user) {
    throw new Response(JSON.stringify({ error: 'Unauthorized.' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  return {
    supabaseUserId: data.user.id,
    phone: data.user.phone ?? undefined,
    email: data.user.email ?? undefined,
    bearerToken,
  };
}
