import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getValidSpotifyToken } from '@/lib/auth';

export async function GET() {
  const session = await getSession();

  const spotifyConnected = !!session.spotify_access_token && !!session.spotify_refresh_token;
  const googleConnected = !!session.google_access_token && !!session.google_refresh_token;

  let spotifyUser: { name: string; avatar: string | null } | null = null;

  if (spotifyConnected) {
    try {
      const token = await getValidSpotifyToken(session);
      const res = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        spotifyUser = {
          name: data.display_name ?? data.id,
          avatar: data.images?.[0]?.url ?? null,
        };
      }
    } catch {
      // Non-fatal — return connected status without user details
    }
  }

  return NextResponse.json({
    spotifyConnected,
    googleConnected,
    spotifyUser,
  });
}
