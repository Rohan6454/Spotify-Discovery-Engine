import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getValidSpotifyToken } from '@/lib/auth';

async function spotifyGet(url: string, token: string): Promise<{ data: any; status: number }> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return { data: null, status: res.status };
  return { data: await res.json(), status: res.status };
}

export async function GET() {
  const session = await getSession();

  if (session.spotify_library_cache) {
    return NextResponse.json(session.spotify_library_cache);
  }

  const token = await getValidSpotifyToken(session);
  const artistIds = new Set<string>();
  const artistNames: Record<string, string> = {};

  const addArtist = (id: string, name: string) => {
    if (id) { artistIds.add(id); artistNames[id] = name; }
  };

  // Liked songs — paginate up to 500
  let tracksUrl: string | null = 'https://api.spotify.com/v1/me/tracks?limit=50';
  let trackCount = 0;
  while (tracksUrl && trackCount < 500) {
    const { data, status } = await spotifyGet(tracksUrl, token);
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: status === 401 ? 'not_authorized' : 'not_authorized' }, { status });
    }
    if (!data) break;
    for (const item of data.items ?? []) {
      for (const artist of item?.track?.artists ?? []) addArtist(artist.id, artist.name);
    }
    trackCount += data.items?.length ?? 0;
    tracksUrl = data.next ?? null;
  }

  // Followed artists — cursor-based pagination (different structure from other endpoints)
  let followCursor: string | null = null;
  let followDone = false;
  while (!followDone) {
    const url = followCursor
      ? `https://api.spotify.com/v1/me/following?type=artist&limit=50&after=${followCursor}`
      : 'https://api.spotify.com/v1/me/following?type=artist&limit=50';
    const { data } = await spotifyGet(url, token);
    if (!data) break;
    const artists = data.artists ?? {};
    for (const artist of artists.items ?? []) addArtist(artist.id, artist.name);
    followCursor = artists.cursors?.after ?? null;
    if (!followCursor || (artists.items?.length ?? 0) === 0) followDone = true;
  }

  // Recently played
  const { data: recentData } = await spotifyGet(
    'https://api.spotify.com/v1/me/player/recently-played?limit=50', token
  );
  for (const item of recentData?.items ?? []) {
    for (const artist of item?.track?.artists ?? []) addArtist(artist.id, artist.name);
  }

  // Top artists
  const { data: topData } = await spotifyGet(
    'https://api.spotify.com/v1/me/top/artists?limit=50&time_range=medium_term', token
  );
  for (const artist of topData?.items ?? []) addArtist(artist.id, artist.name);

  const result = { artistIds: [...artistIds], artistNames };

  console.log(`[Spotify library] found ${artistIds.size} artists`);

  // Don't store in session — too large for 4KB cookie limit.
  // Client holds library in memory and passes it in gap/match request body.

  return NextResponse.json(result);
}
