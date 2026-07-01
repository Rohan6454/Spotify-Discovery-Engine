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
    return NextResponse.redirect(`${APP()}/?error=spotify_denied`);
  }

  let codeVerifier: string | null = null;
  try {
    const decoded = JSON.parse(Buffer.from(state ?? '', 'base64url').toString());
    codeVerifier = decoded.cv ?? null;
  } catch {
    return NextResponse.redirect(`${APP()}/?error=invalid_state`);
  }

  if (!codeVerifier) {
    return NextResponse.redirect(`${APP()}/?error=missing_verifier`);
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    code_verifier: codeVerifier,
  });

  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    console.error('Spotify token exchange failed:', body);
    return NextResponse.redirect(`${APP()}/?error=spotify_token_failed`);
  }

  const data = await tokenRes.json();

  session.spotify_access_token = data.access_token;
  session.spotify_refresh_token = data.refresh_token;
  session.spotify_expires_at = Date.now() + data.expires_in * 1000;
  session.spotify_scope = data.scope ?? '';
  console.log('[spotify/callback] granted scopes:', data.scope);
  await session.save();

  return NextResponse.redirect(`${APP()}/`);
}
