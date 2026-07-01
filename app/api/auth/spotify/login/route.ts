import { NextResponse } from 'next/server';
import { generateCodeVerifier, generateCodeChallenge } from '@/lib/pkce';

const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-library-read',
  'user-read-recently-played',
  'user-follow-read',
  'user-follow-modify',
  'user-top-read',
  'playlist-modify-public',
  'playlist-modify-private',
].join(' ');

export async function GET() {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Pass codeVerifier through state param — avoids cross-site cookie loss
  // between Spotify's redirect and our callback
  const state = Buffer.from(JSON.stringify({ cv: codeVerifier })).toString('base64url');

  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    state,
  });

  return NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params.toString()}`
  );
}
