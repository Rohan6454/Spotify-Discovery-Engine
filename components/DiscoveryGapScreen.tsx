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
        title: 'No artists could be extracted',
        body: 'We scanned your YouTube liked videos and playlists, but couldn\'t reliably identify artist names from the video titles.',
        detail: 'This usually happens when video titles don\'t follow a standard "Artist – Song" or "Song | Artist" format, or when your liked videos are mostly non-music content. Try liking more music videos on YouTube and run the analysis again.',
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
            href="/"
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
                {artist.channelTitle !== artist.spotifyArtistName && (
                  <p className="text-[#6a6a6a] text-xs truncate mt-0.5">{artist.channelTitle}</p>
                )}
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
    </div>
  );
}
