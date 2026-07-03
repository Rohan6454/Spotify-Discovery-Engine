import { NextResponse } from 'next/server';
import { getSession, ArtistSignal } from '@/lib/session';
import { getValidGoogleToken } from '@/lib/auth';
import { extractArtistsFromTitles, identifyArtistChannels } from '@/lib/llm';

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

// Words that strongly indicate non-music content — if these appear, reject regardless of other signals
const NON_MUSIC_WORDS = /\b(fight|knockout|ko|boxing|mma|ufc|wrestl|gym|workout|fitness|motivation|bodybuilding|physique|transformation|interview|podcast|vlog|highlights|match|vs\.?|versus|highlights|trailer|movie trailer|reaction|commentary|news|breaking|explained|documentary|highlights|gaming|gameplay|speedrun|challenge|prank|compilation|montage|tutorial|how to|review|unboxing|ranked|tier list)\b/i;

// Explicit music signals — these override everything, even if the title looks odd
const STRONG_MUSIC_SIGNALS = [
  'official video', 'official audio', 'official music video', 'music video',
  'lyrics', 'lyric video', 'audio', 'feat.', 'ft.', 'remix', 'acoustic',
  'live performance', 'live session', 'unplugged', 'cover', 'music',
  'album', 'ep', 'single', 'song', 'track',
];

function isMusicRelevant(title: string, channelTitle: string): boolean {
  const t = title.toLowerCase();
  const c = channelTitle.toLowerCase();

  // Explicit music channel (YouTube auto-generated Topic channels are always music)
  if (c.endsWith('- topic')) return true;

  // If any strong non-music word appears, reject immediately
  if (NON_MUSIC_WORDS.test(t)) return false;

  // Must have at least one explicit music signal OR a dash pattern AND no non-music words
  const hasStrongSignal = STRONG_MUSIC_SIGNALS.some(k => t.includes(k));
  const hasDashPattern = /^.{2,40}\s[-–]\s.+/.test(t); // tighter: left side max 40 chars

  return hasStrongSignal || hasDashPattern;
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

  // Step 1b — LLM filter: identify which subscription channels are real artists
  // Subscriptions like "Arijit Singh" or "The Local Train" are valid signals;
  // "T-Series" or "Zee Music" are labels and should be ignored
  const subChannelNames = [...signals.values()]
    .filter(s => s.subscribed)
    .map(s => s.channelTitle);

  if (subChannelNames.length > 0) {
    const artistChannelNames = await identifyArtistChannels(subChannelNames);
    const artistSet = new Set(artistChannelNames.map(n => n.toLowerCase()));
    for (const s of signals.values()) {
      if (s.subscribed && artistSet.has(s.channelTitle.toLowerCase())) {
        ensureByName(s.channelTitle).subscribed = true;
      }
    }
    console.log(`[YouTube signals] subscriptions: ${subChannelNames.length} total, ${artistChannelNames.length} identified as artists:`, artistChannelNames);
  }

  // Step 2 — Liked videos: collect titles then batch-extract artists via LLM
  let likedUrl = 'https://www.googleapis.com/youtube/v3/videos?part=snippet&myRating=like&maxResults=50';
  let likedCount = 0;
  const likedItems: { channelId: string; channelTitle: string; videoTitle: string }[] = [];

  while (likedUrl && likedCount < 200) {
    const data = await ytGet(likedUrl, token);
    if (!data) break;
    for (const item of data.items ?? []) {
      const channelId = item.snippet?.channelId;
      const channelTitle = item.snippet?.channelTitle ?? '';
      const videoTitle = item.snippet?.title ?? '';
      if (!isMusicRelevant(videoTitle, channelTitle)) continue;
      if (channelId) ensureById(channelId, channelTitle).likedCount++;
      likedItems.push({ channelId, channelTitle, videoTitle });
    }
    likedCount += data.items?.length ?? 0;
    likedUrl = data.nextPageToken
      ? `https://www.googleapis.com/youtube/v3/videos?part=snippet&myRating=like&maxResults=50&pageToken=${data.nextPageToken}`
      : '';
  }

  // Step 3 — User playlists + items (cap: first 20 playlists, 100 items each)
  // Expanded from 5/50 to capture users who curate playlists but don't use likes
  const playlistsData = await ytGet(
    'https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50',
    token
  );
  const playlistItems: { videoTitle: string }[] = [];
  for (const pl of (playlistsData?.items ?? []).slice(0, 20)) {
    const itemsData = await ytGet(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${pl.id}&maxResults=100`,
      token
    );
    for (const item of itemsData?.items ?? []) {
      const id = item.snippet?.videoOwnerChannelId;
      const title = item.snippet?.videoOwnerChannelTitle;
      if (id && title) ensureById(id, title).inPlaylist = true;
      const videoTitle = item.snippet?.title ?? '';
      if (videoTitle) playlistItems.push({ videoTitle });
    }
  }

  // LLM batch extraction — send all music video titles at once
  const allTitles = [
    ...likedItems.map(i => i.videoTitle),
    ...playlistItems.map(i => i.videoTitle),
  ].filter(Boolean);

  const BATCH_SIZE = 40;
  const llmResults: Record<string, string | null> = {};

  for (let i = 0; i < allTitles.length; i += BATCH_SIZE) {
    const batch = allTitles.slice(i, i + BATCH_SIZE);
    const batchResult = await extractArtistsFromTitles(batch);
    Object.assign(llmResults, batchResult);
  }

  console.log(`[YouTube signals] LLM processed ${allTitles.length} titles`);

  // Apply LLM results — fall back to regex if LLM returned null
  for (const item of likedItems) {
    const llmArtist = llmResults[item.videoTitle];
    const artistName = llmArtist ?? extractArtistFromTitle(item.videoTitle);
    if (artistName && artistName.toLowerCase() !== item.channelTitle.toLowerCase()) {
      ensureByName(artistName).likedCount++;
    }
  }

  for (const item of playlistItems) {
    const llmArtist = llmResults[item.videoTitle];
    const artistName = llmArtist ?? extractArtistFromTitle(item.videoTitle);
    if (artistName) ensureByName(artistName).inPlaylist = true;
  }

  const result = [...signals.values()].filter(
    s => s.subscribed || s.likedCount > 0 || s.inPlaylist
  );

  const nameSignals = result.filter(s => s.channelId.startsWith('name:'));
  console.log(`[YouTube signals] total=${result.length} name-extracted=${nameSignals.length} sample-names:`, nameSignals.slice(0, 10).map(s => s.channelTitle));

  const likedVideos = likedItems.map(i => ({ title: i.videoTitle, channel: i.channelTitle }));
  const nameSignalCount = result.filter(s => s.channelId.startsWith('name:')).length;

  return NextResponse.json({ signals: result, likedVideos, nameSignalCount });
}
