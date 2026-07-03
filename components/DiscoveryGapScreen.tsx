'use client';

import { useState, useEffect } from 'react';
import { GapArtist, ArtistSignal } from '@/lib/session';

function signalLabel(signal: ArtistSignal): string {
  const parts: string[] = [];
  if (signal.subscribed) parts.push('Subscribed');
  if (signal.likedCount > 0) parts.push(`${signal.likedCount} liked video${signal.likedCount > 1 ? 's' : ''}`);
  if (signal.inPlaylist && !signal.subscribed && signal.likedCount === 0) parts.push('In saved playlist');
  return parts.join(' · ') || 'Detected';
}

const SpotifyIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

type ArtistRow = GapArtist & { inLibrary: boolean };

export default function DiscoveryGapScreen() {
  const [artists, setArtists] = useState<ArtistRow[]>([]);
  const [noGapReason, setNoGapReason] = useState<'not_run' | 'no_signals' | 'all_in_library' | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [genreTags, setGenreTags] = useState<Record<string, string>>({});
  const [likedVideos, setLikedVideos] = useState<{ title: string; channel: string }[]>([]);
  const [showLikedVideos, setShowLikedVideos] = useState(false);
  const [signalCount, setSignalCount] = useState<number | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('de_gap_results');
      if (stored === null) {
        setNoGapReason('not_run');
      } else {
        const parsed = JSON.parse(stored);
        setArtists(parsed);
        if (parsed.length === 0) setNoGapReason('no_signals');
        else if (parsed.every((a: ArtistRow) => a.inLibrary)) setNoGapReason('all_in_library');
      }
      const storedInsight = localStorage.getItem('de_gap_insight');
      if (storedInsight) setInsight(storedInsight);
      const storedTags = localStorage.getItem('de_genre_tags');
      if (storedTags) setGenreTags(JSON.parse(storedTags));
      const storedVideos = localStorage.getItem('de_yt_liked_videos');
      if (storedVideos) setLikedVideos(JSON.parse(storedVideos));
      const sc = localStorage.getItem('de_signal_count');
      if (sc !== null) setSignalCount(Number(sc));
    } catch {
      setNoGapReason('not_run');
    }
  }, []);

  const gapArtists = artists.filter(a => !a.inLibrary);
  const inLibraryArtists = artists.filter(a => a.inLibrary);

  if (artists.length === 0 || (artists.length > 0 && gapArtists.length === 0)) {
    const reasons: Record<string, { title: string; body: string; detail: string }> = {
      not_run: {
        title: 'No analysis data found',
        body: 'It looks like the analysis hasn\'t been run yet, or the results were cleared.',
        detail: 'Go back to the home screen and connect both Spotify and YouTube to run the Discovery Engine.',
      },
      no_signals: {
        title: 'No music activity detected on YouTube',
        body: 'Discovery Engine scanned your liked videos, subscriptions, and playlists but found no music signals strong enough to match against Spotify.',
        detail: 'This usually means your YouTube account isn\'t used much for music discovery — most activity is non-music content, or videos weren\'t liked/saved. Try liking music videos on YouTube, subscribing to artist channels (not label channels like T-Series), or saving songs to a YouTube playlist.',
      },
      all_in_library: {
        title: 'No gap — you\'re already covered',
        body: `We matched ${artists.length} artist${artists.length !== 1 ? 's' : ''} from your YouTube activity to Spotify, and all of them are already in your library.`,
        detail: 'Your Spotify collection is well-aligned with what you listen to on YouTube. Keep exploring new music on YouTube and re-run the analysis to catch new gaps over time.',
      },
    };

    const r = reasons[noGapReason ?? 'not_run'];

    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center px-4">
        <div className="w-full max-w-md">
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-[#282828] border border-[#383838]">
            <div className="w-2 h-2 rounded-full bg-[#a7a7a7]" />
            <span className="text-[#a7a7a7] text-xs font-semibold uppercase tracking-wider">Discovery Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">{r.title}</h1>
          <p className="text-[#a7a7a7] mb-4">{r.body}</p>
          <p className="text-[#6a6a6a] text-sm leading-relaxed mb-8">{r.detail}</p>
          <a
            href="/analysing"
            className="inline-block px-6 py-2.5 rounded-full bg-[#1DB954] text-black font-bold text-sm hover:bg-[#1ed760] transition-colors"
          >
            Run analysis again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/20">
            <div className="w-2 h-2 rounded-full bg-[#1DB954]" />
            <span className="text-[#1DB954] text-xs font-semibold uppercase tracking-wider">Discovery Engine</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Your Discovery Gap</h1>
        <p className="text-[#a7a7a7]">
          Artists you've been exploring on YouTube that aren't in your Spotify library yet.
        </p>
      </div>

      {/* Low signal warning */}
      {signalCount !== null && signalCount < 8 && (
        <div className="mb-6 p-4 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex gap-3">
          <span className="text-[#F59E0B] text-lg shrink-0">⚠</span>
          <div>
            <p className="text-[#F59E0B] text-sm font-medium mb-0.5">Limited YouTube signals detected ({signalCount})</p>
            <p className="text-[#a7a7a7] text-sm leading-relaxed">
              Discovery Engine found very few music signals from your YouTube activity. Results may be incomplete.
              To improve accuracy: <span className="text-[#e8e8e8]">like more music videos on YouTube</span>, or{' '}
              <span className="text-[#e8e8e8]">save music to your YouTube playlists</span> — both are scanned automatically.
            </p>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1 p-4 rounded-lg bg-[#181818]">
          <p className="text-3xl font-bold text-white">{gapArtists.length}</p>
          <p className="text-[#a7a7a7] text-sm mt-1">Missing from Spotify</p>
        </div>
        <div className="flex-1 p-4 rounded-lg bg-[#181818]">
          <p className="text-3xl font-bold text-[#1DB954]">{inLibraryArtists.length}</p>
          <p className="text-[#a7a7a7] text-sm mt-1">Already in library</p>
        </div>
        <div className="flex-1 p-4 rounded-lg bg-[#181818]">
          <p className="text-3xl font-bold text-white">{artists.length}</p>
          <p className="text-[#a7a7a7] text-sm mt-1">Total matched</p>
        </div>
      </div>

      {/* LLM Insight card */}
      {insight && (
        <div className="mb-6 p-4 rounded-lg bg-[#1DB954]/10 border border-[#1DB954]/20 flex gap-3">
          <span className="text-[#1DB954] text-lg shrink-0">✦</span>
          <p className="text-[#e8e8e8] text-sm leading-relaxed">{insight}</p>
        </div>
      )}

      {/* Artist table */}
      <div className="rounded-lg overflow-hidden bg-[#181818] mb-8">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-[#282828]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#a7a7a7]">Artist</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#a7a7a7] text-right w-44">YouTube Signal</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#a7a7a7] text-right w-28">In Spotify?</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#a7a7a7] text-right w-32"></span>
        </div>

        {artists.map((artist, i) => {
          const isGap = !artist.inLibrary;

          return (
            <div
              key={artist.channelId}
              className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3.5 items-center border-b border-[#282828]/50 last:border-0 ${
                i % 2 === 0 ? 'bg-[#181818]' : 'bg-[#1a1a1a]'
              } hover:bg-[#282828] transition-colors group`}
            >
              {/* Artist name */}
              <div className="min-w-0">
                <p className="text-white font-medium truncate">{artist.spotifyArtistName}</p>
                {genreTags[artist.spotifyArtistName] ? (
                  <p className="text-[#1DB954] text-xs truncate mt-0.5">{genreTags[artist.spotifyArtistName]}</p>
                ) : artist.channelTitle !== artist.spotifyArtistName ? (
                  <p className="text-[#6a6a6a] text-xs truncate mt-0.5">{artist.channelTitle}</p>
                ) : null}
              </div>

              {/* Signal badge */}
              <div className="w-44 flex justify-end">
                <span className="inline-block px-2.5 py-1 rounded-full bg-[#282828] text-[#a7a7a7] text-xs whitespace-nowrap group-hover:bg-[#333]">
                  {signalLabel(artist.signal)}
                </span>
              </div>

              {/* In Spotify? */}
              <div className="w-28 flex justify-end">
                {artist.inLibrary ? (
                  <span className="flex items-center gap-1.5 text-[#1DB954] text-sm">
                    <SpotifyIcon />
                    In library
                  </span>
                ) : (
                  <span className="text-[#a7a7a7] text-sm">Not saved</span>
                )}
              </div>

              {/* Per-row action */}
              <div className="w-32 flex justify-end">
                {isGap && (
                  <a
                    href={`https://open.spotify.com/artist/${artist.spotifyArtistId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#535353] text-[#a7a7a7] text-xs hover:border-[#1DB954] hover:text-[#1DB954] transition-colors whitespace-nowrap"
                  >
                    <SpotifyIcon size={11} />
                    Open in Spotify
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      {gapArtists.length > 0 && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-[#a7a7a7] text-sm text-center max-w-md">
            {gapArtists.length} artist{gapArtists.length !== 1 ? 's' : ''} from your YouTube activity {gapArtists.length !== 1 ? 'are' : 'is'} missing from your Spotify library. Click any artist to open them on Spotify.
          </p>
        </div>
      )}

      {/* YouTube Liked Videos — filtered to gap artists only */}
      {(() => {
        const gapNames = gapArtists.flatMap(a => [
          a.channelTitle.toLowerCase(),
          a.spotifyArtistName.toLowerCase(),
        ]);
        const gapLikedVideos = likedVideos.filter(v => {
          const ch = v.channel.toLowerCase();
          return gapNames.some(name => ch.includes(name) || name.includes(ch));
        });

        return (
          <div className="mt-10 rounded-lg bg-[#181818] overflow-hidden">
            <button
              onClick={() => setShowLikedVideos(v => !v)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#1f1f1f] transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>
                <span className="text-white font-medium text-sm">YouTube Videos Behind This Gap</span>
                <span className="text-[#a7a7a7] text-xs">
                  {gapLikedVideos.length > 0 ? `${gapLikedVideos.length} video${gapLikedVideos.length !== 1 ? 's' : ''} from missing artists` : 'No direct liked video matches'}
                </span>
              </div>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a7a7a7" strokeWidth="2"
                className={`transition-transform ${showLikedVideos ? 'rotate-180' : ''}`}
              >
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>

            {showLikedVideos && (
              <div className="border-t border-[#282828]">
                {gapLikedVideos.length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <p className="text-[#a7a7a7] text-sm">No liked videos matched the missing artists directly.</p>
                    <p className="text-[#6a6a6a] text-xs mt-2">
                      These artists were likely found via subscriptions or playlist saves rather than liked videos.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#282828]/50">
                    {gapLikedVideos.map((v, i) => (
                      <div key={i} className="flex items-start gap-3 px-6 py-3 hover:bg-[#1f1f1f] transition-colors">
                        <div className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#FF0000] opacity-60" />
                        <div className="min-w-0">
                          <p className="text-[#e8e8e8] text-sm truncate">{v.title}</p>
                          <p className="text-[#6a6a6a] text-xs mt-0.5">{v.channel}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
