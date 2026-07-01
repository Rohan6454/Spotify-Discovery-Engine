import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getValidSpotifyToken, getValidGoogleToken } from '@/lib/auth';

export async function GET() {
  const session = await getSession();

  let googleToken: string | null = null;
  let spotifyToken: string | null = null;
  try { googleToken = await getValidGoogleToken(session); } catch { /* expired */ }
  try { spotifyToken = await getValidSpotifyToken(session); } catch { /* expired */ }

  // Test Spotify search directly
  let searchTest: any = 'no spotify token';
  let spotifyMe: any = 'no spotify token';
  let followTest: any = 'no spotify token';
  if (spotifyToken) {
    const res = await fetch(
      'https://api.spotify.com/v1/search?q=Arijit+Singh&type=artist&limit=3',
      { headers: { Authorization: `Bearer ${spotifyToken}` } }
    );
    if (res.ok) {
      const data = await res.json();
      searchTest = data.artists?.items?.map((a: any) => ({ id: a.id, name: a.name }));
    } else {
      searchTest = `HTTP ${res.status}: ${await res.text()}`;
    }

    // Check /me for product type (free vs premium) and scopes
    const meRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${spotifyToken}` }
    });
    if (meRes.ok) {
      const me = await meRes.json();
      spotifyMe = { product: me.product, email: me.email, id: me.id };
    } else {
      spotifyMe = `HTTP ${meRes.status}`;
    }

    // Test follow endpoint directly with a known artist (Arijit Singh)
    const followRes = await fetch(
      'https://api.spotify.com/v1/me/following?type=artist&ids=4YRxDV8wJFPHPTeXepOstw',
      { method: 'PUT', headers: { Authorization: `Bearer ${spotifyToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: ['4YRxDV8wJFPHPTeXepOstw'] }) }
    );
    const followBody = await followRes.text();
    const followHeaders: Record<string, string> = {};
    followRes.headers.forEach((v, k) => { followHeaders[k] = v; });
    followTest = { status: followRes.status, body: followBody, headers: followHeaders };
  }

  // YouTube: liked video titles (first 5)
  let likedTitles: string[] = [];
  if (googleToken) {
    const res = await fetch(
      'https://www.googleapis.com/youtube/v3/videos?part=snippet&myRating=like&maxResults=10',
      { headers: { Authorization: `Bearer ${googleToken}` } }
    );
    const data = await res.json();
    likedTitles = (data.items ?? []).map((i: any) => i.snippet?.title);
  }

  return NextResponse.json({
    hasSpotifyToken: !!spotifyToken,
    hasGoogleToken: !!googleToken,
    spotifyMe,
    spotifyFollowTest: followTest,
    spotifySearchArijitSingh: searchTest,
    youtubeLibrary: {
      likedVideoTitles: likedTitles,
    },
    sessionState: {
      libraryArtistCount: session.spotify_library_cache?.artistIds?.length ?? 'not loaded',
      gapResultsCount: session.gap_results?.length ?? 'not run',
      youtubeSignalSample: session.youtube_signals_cache?.slice(0, 5).map(s => s.channelTitle) ?? 'not cached',
    },
  });
}
