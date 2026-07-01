import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export interface ArtistSignal {
  channelId: string;
  channelTitle: string;
  subscribed: boolean;
  likedCount: number;
  inPlaylist: boolean;
}

export interface SpotifyLibrary {
  artistIds: string[];
  artistNames: Record<string, string>; // id → name
}

export interface GapArtist {
  channelId: string;
  channelTitle: string;
  spotifyArtistId: string;
  spotifyArtistName: string;
  signal: ArtistSignal;
  score: number;
  inLibrary: boolean;
}

export interface SessionData {
  // Spotify
  spotify_access_token?: string;
  spotify_refresh_token?: string;
  spotify_expires_at?: number; // Unix ms
  spotify_scope?: string;

  // Google
  google_access_token?: string;
  google_refresh_token?: string;
  google_expires_at?: number;

  // PKCE / CSRF
  spotify_code_verifier?: string;
  google_state_nonce?: string;

  // Caches (written once per session)
  youtube_signals_cache?: ArtistSignal[];
  spotify_library_cache?: SpotifyLibrary;

  // Gap results
  gap_results?: GapArtist[];
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'de_session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
