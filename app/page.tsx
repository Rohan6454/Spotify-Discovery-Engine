import { getSession } from '@/lib/session';
import { getValidSpotifyToken } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SpotifyShell from '@/components/SpotifyShell';
import ConnectYouTube from '@/components/ConnectYouTube';

export default async function HomePage() {
  const session = await getSession();

  // If both connected and gap results cached → go straight to results
  if (session.google_access_token && session.gap_results) {
    redirect('/discovery');
  }

  // If YouTube connected but processing not done → send to analysing
  if (session.google_access_token && !session.gap_results) {
    redirect('/analysing');
  }

  // Fetch Spotify user for the shell avatar
  let spotifyUser: { name: string; avatar: string | null } | null = null;
  if (session.spotify_access_token) {
    try {
      const token = await getValidSpotifyToken(session);
      const res = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 0 },
      });
      if (res.ok) {
        const data = await res.json();
        spotifyUser = {
          name: data.display_name ?? data.id,
          avatar: data.images?.[0]?.url ?? null,
        };
      }
    } catch {
      // Non-fatal — shell renders without user info
    }
  }

  return (
    <SpotifyShell activePage="discovery" spotifyUser={spotifyUser}>
      <ConnectYouTube spotifyConnected={!!session.spotify_access_token} />
    </SpotifyShell>
  );
}
