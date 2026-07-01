import { NextResponse } from 'next/server';
import { getSession, ArtistSignal } from '@/lib/session';
import { getValidGoogleToken } from '@/lib/auth';

const LABEL_WORDS = /\b(records|music|entertainment|productions|films|studios|official|vevo|digital|t-series|sony|emi|universal|warner|zee|saregama|tips|speed)\b/i;

// Tries multiple patterns to extract an artist name from a video title.
// Indian music titles are often "Song - Movie | Artist" or "Song | Artist | Movie"
// so we check after pipes first (more reliable for this corpus).
function extractArtistFromTitle(videoTitle: string): string | null {
  // Pattern 1: after last " | " — often the artist name in Indian music videos
  // e.g. "Tum Hi Ho (Full Video) | Aashiqui 2 | Arijit Singh"
  const pipeParts = videoTitle.split(/\s*\|\s*/);
  if (pipeParts.length >= 2) {
    // The last pipe-segment is often the artist; skip if it looks like a label or movie name
    const last = pipeParts[pipeParts.length - 1].trim();
    if (last.length >= 2 && last.length <= 40 && !LABEL_WORDS.test(last) && !/\d{4}/.test(last)) {
      return last;
    }
    // Try second-to-last
    if (pipeParts.length >= 3) {
      const secondLast = pipeParts[pipeParts.length - 2].trim();
      if (secondLast.length >= 2 && secondLast.length <= 40 && !LABEL_WORDS.test(secondLast)) {
        return secondLast;
      }
    }
  }

  // Pattern 2: "Artist - Song" where the part before the dash is short (likely an artist name)
  const dashMatch = videoTitle.match(/^([^|\[(]{2,35}?)\s*[-–]\s*.+/);
  if (dashMatch) {
    const candidate = dashMatch[1].trim();
    if (!LABEL_WORDS.test(candidate)) return candidate;
  }

  return null;
}

function isMusicRelevant(title: string, channelTitle: string): boolean {
  const t = title.toLowerCase();
  const c = channelTitle.toLowerCase();
  const musicKeywords = [
    'official video', 'official audio', 'lyrics', 'live', 'music video',
    'album', 'ep', 'single', 'feat.', 'ft.', 'remix', 'acoustic',
    'session', 'concert', 'performance', 'tour', 'official',
  ];
  return /^.+\s[-–]\s.+/.test(t)
    || musicKeywords.some(k => t.includes(k))
    || c.endsWith('- topic');
}

async function ytGet(url: string, token: string) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  return res.json();
}

export async function GET() {
  const session = await getSession();
  const token = await getValidGoogleToken(session);

  // Use a virtual channel ID for artist-name-based signals (keyed by cleaned name)
  const signals = new Map<string, ArtistSignal>();

  const ensureById = (id: string, title: string) => {
    if (!signals.has(id)) {
      signals.set(id, { channelId: id, channelTitle: title, subscribed: false, likedCount: 0, inPlaylist: false });
    }
    return signals.get(id)!;
  };

  const ensureByName = (name: string) => {
    const key = `name:${name.toLowerCase()}`;
    if (!signals.has(key)) {
      signals.set(key, { channelId: key, channelTitle: name, subscribed: false, likedCount: 0, inPlaylist: false });
    }
    return signals.get(key)!;
  };

  // Step 1 — Subscriptions (channel-level)
  let subsUrl = 'https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50';
  let subsCount = 0;
  while (subsUrl && subsCount < 200) {
    const data = await ytGet(subsUrl, token);
    if (!data) break;
    for (const item of data.items ?? []) {
      const id = item.snippet?.resourceId?.channelId;
      const title = item.snippet?.title;
      if (id && title) ensureById(id, title).subscribed = true;
    }
    subsCount += data.items?.length ?? 0;
    subsUrl = data.nextPageToken
      ? `https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50&pageToken=${data.nextPageToken}`
      : '';
  }

  // Step 2 — Liked videos: extract artist from title AND track channel
  let likedUrl = 'https://www.googleapis.com/youtube/v3/videos?part=snippet&myRating=like&maxResults=50';
  let likedCount = 0;
  while (likedUrl && likedCount < 200) {
    const data = await ytGet(likedUrl, token);
    if (!data) break;
    for (const item of data.items ?? []) {
      const channelId = item.snippet?.channelId;
      const channelTitle = item.snippet?.channelTitle ?? '';
      const videoTitle = item.snippet?.title ?? '';

      if (!isMusicRelevant(videoTitle, channelTitle)) continue;

      // Always track the channel
      if (channelId) ensureById(channelId, channelTitle).likedCount++;

      // Also extract artist name from title if it follows "Artist - Song" pattern
      const artistName = extractArtistFromTitle(videoTitle);
      if (artistName && artistName.toLowerCase() !== channelTitle.toLowerCase()) {
        ensureByName(artistName).likedCount++;
      }
    }
    likedCount += data.items?.length ?? 0;
    likedUrl = data.nextPageToken
      ? `https://www.googleapis.com/youtube/v3/videos?part=snippet&myRating=like&maxResults=50&pageToken=${data.nextPageToken}`
      : '';
  }

  // Step 3 — User playlists + items (cap: first 5 playlists)
  const playlistsData = await ytGet(
    'https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50',
    token
  );
  for (const pl of (playlistsData?.items ?? []).slice(0, 5)) {
    const itemsData = await ytGet(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${pl.id}&maxResults=50`,
      token
    );
    for (const item of itemsData?.items ?? []) {
      const id = item.snippet?.videoOwnerChannelId;
      const title = item.snippet?.videoOwnerChannelTitle;
      if (id && title) ensureById(id, title).inPlaylist = true;

      // Also extract artist from playlist video titles
      const videoTitle = item.snippet?.title ?? '';
      const artistName = extractArtistFromTitle(videoTitle);
      if (artistName) ensureByName(artistName).inPlaylist = true;
    }
  }

  const result = [...signals.values()].filter(
    s => s.subscribed || s.likedCount > 0 || s.inPlaylist
  );

  const nameSignals = result.filter(s => s.channelId.startsWith('name:'));
  console.log(`[YouTube signals] total=${result.length} name-extracted=${nameSignals.length} sample-names:`, nameSignals.slice(0, 10).map(s => s.channelTitle));

  return NextResponse.json({ signals: result });
}
