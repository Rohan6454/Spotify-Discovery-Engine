import { getSession } from '@/lib/session';
import { getValidSpotifyToken } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SpotifyShell from '@/components/SpotifyShell';
import DiscoveryGapScreen from '@/components/DiscoveryGapScreen';

export default async function DiscoveryPage() {
  const session = await getSession();

  if (!session.google_access_token) redirect('/');
  if (session.gap_results === undefined) redirect('/analysing');

  let spotifyUser = null;
  if (session.spotify_access_token) {
    try {
      const token = await getValidSpotifyToken(session);
      const res = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 0 },
      });
      if (res.ok) {
        const data = await res.json();
        spotifyUser = { name: data.display_name ?? data.id, avatar: data.images?.[0]?.url ?? null };
      }
    } catch { /* non-fatal */ }
  }

  return (
    <SpotifyShell activePage="discovery" spotifyUser={spotifyUser}>
      <DiscoveryGapScreen />
    </SpotifyShell>
  );
}
