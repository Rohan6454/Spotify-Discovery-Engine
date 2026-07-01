import { getSession, SessionData } from './session';

type Session = Awaited<ReturnType<typeof getSession>>;

// Returns a valid Spotify access token, refreshing if needed.
export async function getValidSpotifyToken(session: Session): Promise<string> {
  if (!session.spotify_access_token || !session.spotify_refresh_token) {
    throw new Error('No Spotify tokens in session');
  }

  const expiresAt = session.spotify_expires_at ?? 0;
  if (Date.now() < expiresAt - 60_000) {
    return session.spotify_access_token;
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: session.spotify_refresh_token,
    client_id: process.env.SPOTIFY_CLIENT_ID!,
  });

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    throw new Error(`Spotify token refresh failed: ${res.status}`);
  }

  const data = await res.json();
  session.spotify_access_token = data.access_token;
  session.spotify_expires_at = Date.now() + data.expires_in * 1000;
  // Spotify may return a new refresh token — persist it if so
  if (data.refresh_token) {
    session.spotify_refresh_token = data.refresh_token;
  }
  await session.save();

  return session.spotify_access_token!;
}

// Returns a valid Google access token, refreshing if needed.
export async function getValidGoogleToken(session: Session): Promise<string> {
  if (!session.google_access_token || !session.google_refresh_token) {
    throw new Error('No Google tokens in session');
  }

  const expiresAt = session.google_expires_at ?? 0;
  if (Date.now() < expiresAt - 60_000) {
    return session.google_access_token;
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: session.google_refresh_token,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    throw new Error(`Google token refresh failed: ${res.status}`);
  }

  const data = await res.json();
  session.google_access_token = data.access_token;
  session.google_expires_at = Date.now() + data.expires_in * 1000;
  await session.save();

  return session.google_access_token!;
}
