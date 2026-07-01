import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

const APP = () => process.env.NEXT_PUBLIC_APP_URL!;

export async function GET(req: NextRequest) {
  const session = await getSession();
  const { searchParams } = new URL(req.url);

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${APP()}/?error=google_denied`);
  }

  if (!state) {
    return NextResponse.redirect(`${APP()}/?error=invalid_state`);
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
  });

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    console.error('Google token exchange failed:', body);
    return NextResponse.redirect(`${APP()}/?error=google_token_failed`);
  }

  const data = await tokenRes.json();

  session.google_access_token = data.access_token;
  session.google_refresh_token = data.refresh_token;
  session.google_expires_at = Date.now() + data.expires_in * 1000;
  session.google_state_nonce = undefined;
  await session.save();

  return NextResponse.redirect(`${APP()}/analysing`);
}
