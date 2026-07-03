import { NextRequest, NextResponse } from 'next/server';
import { getSession, GapArtist, ArtistSignal, SpotifyLibrary } from '@/lib/session';
import { getValidSpotifyToken } from '@/lib/auth';
import { cleanChannelName, similarity } from '@/lib/fuzzy';

const BATCH_SIZE = 10;
const MATCH_THRESHOLD = 0.60;

export async function POST(req: NextRequest) {
  const session = await getSession();
  const {
    offset = 0,
    signals = [],
    library,
    accumulated = [],
    isFinal = false,
  }: {
    offset: number;
    signals: ArtistSignal[];
    library: SpotifyLibrary;
    accumulated: (GapArtist & { inLibrary: boolean })[];
    isFinal: boolean;
  } = await req.json().catch(() => ({ offset: 0, signals: [], library: { artistIds: [], artistNames: {} }, accumulated: [], isFinal: false }));

  if (!library) {
    return NextResponse.json({ error: 'Spotify library not provided' }, { status: 400 });
  }

  if (offset === 0) {
    console.log(`[gap/match] Starting — ${signals.length} signals, library has ${library.artistIds.length} artists`);
  }

  const librarySet = new Set(library.artistIds);
  const batch = signals.slice(offset, offset + BATCH_SIZE);
  const token = await getValidSpotifyToken(session);
  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

  const results: (GapArtist & { inLibrary: boolean })[] = [];

  for (const signal of batch) {
    await delay(150);
    const cleanedName = cleanChannelName(signal.channelTitle);
    if (!cleanedName) continue;

    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(cleanedName)}&type=artist&limit=3`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!searchRes.ok) {
      console.log(`[gap/match] search ${searchRes.status} for "${cleanedName}"`);
      if (searchRes.status === 429) {
        const retryAfter = searchRes.headers.get('Retry-After') ?? '60';
        console.log(`[gap/match] rate limited, Retry-After: ${retryAfter}s`);
        return NextResponse.json({ results, allResults: [...accumulated, ...results], nextOffset: offset, total: signals.length, rateLimited: true, retryAfter: parseInt(retryAfter) });
      }
      if (searchRes.status === 403) {
        return NextResponse.json({ results, allResults: [...accumulated, ...results], nextOffset: offset, total: signals.length, premiumRequired: true });
      }
      continue;
    }

    const searchData = await searchRes.json();
    const candidates = searchData.artists?.items ?? [];
    console.log(`[gap/match] search:"${cleanedName}" → ${candidates.map((c: any) => `${c.name}(${Math.round(similarity(cleanedName, c.name)*100)}%)`).join(', ') || 'no results'}`);

    let bestMatch: { id: string; name: string } | null = null;
    let bestScore = 0;

    for (const candidate of candidates) {
      const score = similarity(cleanedName, candidate.name);
      if (score > bestScore && score >= MATCH_THRESHOLD) {
        bestScore = score;
        bestMatch = { id: candidate.id, name: candidate.name };
      }
    }

    if (!bestMatch) continue;

    const score = (signal.subscribed ? 3 : 0) + signal.likedCount + (signal.inPlaylist ? 1 : 0);

    results.push({
      channelId: signal.channelId,
      channelTitle: signal.channelTitle,
      spotifyArtistId: bestMatch.id,
      spotifyArtistName: bestMatch.name,
      signal,
      score,
      inLibrary: librarySet.has(bestMatch.id),
    });
  }

  console.log(`[gap/match] batch offset=${offset} matched=${results.length}`, results.map(r => `${r.channelTitle}→${r.spotifyArtistName}(${r.inLibrary?'in lib':'NOT saved'})`));

  const nextOffset = offset + BATCH_SIZE < signals.length ? offset + BATCH_SIZE : null;
  const allResults = [...accumulated, ...results];

  if (nextOffset === null) {
    // Store only a tiny completion flag in the session — full results go to client localStorage
    session.gap_results = [];
    await session.save();
  }

  return NextResponse.json({ results, allResults, nextOffset, total: signals.length });
}
