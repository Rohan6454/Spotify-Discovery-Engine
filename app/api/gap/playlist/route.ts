import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getValidSpotifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  const { artistSpotifyIds } = await req.json();

  if (!Array.isArray(artistSpotifyIds) || artistSpotifyIds.length === 0) {
    return NextResponse.json({ error: 'No artist IDs provided' }, { status: 400 });
  }

  const token = await getValidSpotifyToken(session);

  // Follow artists in batches of 50 (Spotify API limit per call)
  const ids: string[] = artistSpotifyIds.slice(0, 50);
  const followRes = await fetch(
    `https://api.spotify.com/v1/me/following?type=artist`,
    { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) }
  );

  if (!followRes.ok) {
    const body = await followRes.text();
    console.log(`[playlist] follow failed ${followRes.status}: ${body.slice(0, 200)}`);
    return NextResponse.json({ error: 'Failed to follow artists' }, { status: 500 });
  }

  console.log(`[playlist] followed ${ids.length} artists`);

  return NextResponse.json({
    followed: ids.length,
    playlistUrl: 'https://open.spotify.com/collection/artists',
  });
}
