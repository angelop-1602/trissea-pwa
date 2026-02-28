'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getHomeRouteForRole } from '@/lib/role-routes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignupPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [token, setToken] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      const response = await fetch('/api/me', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));

      if (!active) return;

      if (response.ok && payload.user?.role) {
        router.replace(getHomeRouteForRole(payload.user.role));
      }
    };

    void checkSession();

    return () => {
      active = false;
    };
  }, [router]);

  const sendOtp = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/sms/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? 'Failed to send OTP.');
        return;
      }

      setOtpSent(true);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpAndSignup = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const verifyResponse = await fetch('/api/auth/sms/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          token: token.trim(),
        }),
      });
      const verifyPayload = await verifyResponse.json().catch(() => ({}));

      if (!verifyResponse.ok) {
        setError(verifyPayload.error ?? 'Invalid OTP.');
        return;
      }

      const meResponse = await fetch('/api/me', { cache: 'no-store' });
      const mePayload = await meResponse.json().catch(() => ({}));

      if (!meResponse.ok || !mePayload.user?.role) {
        setError(mePayload.error ?? 'Failed to load user profile.');
        return;
      }

      router.replace(getHomeRouteForRole(mePayload.user.role));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
              T
            </div>
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Sign up with your phone number and OTP</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!otpSent ? (
            <form className="space-y-4" onSubmit={sendOtp}>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+639171234567"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={verifyOtpAndSignup}>
              <div className="space-y-2">
                <Label htmlFor="token">One-time password</Label>
                <Input
                  id="token"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="6-digit code"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Creating account...' : 'Verify and Create Account'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setOtpSent(false);
                  setToken('');
                  setError('');
                }}
                disabled={loading}
              >
                Use a different phone number
              </Button>
            </form>
          )}

          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
