'use client';

import Sidebar from './Sidebar';
import TopBar from './TopBar';
import PlayerBar from './PlayerBar';

interface SpotifyShellProps {
  children: React.ReactNode;
  activePage?: 'home' | 'search' | 'library' | 'discovery';
  spotifyUser?: { name: string; avatar: string | null } | null;
}

export default function SpotifyShell({ children, activePage = 'discovery', spotifyUser }: SpotifyShellProps) {
  return (
    <div className="flex flex-col h-screen bg-[#121212] text-white overflow-hidden">
      {/* Main area: sidebar + content */}
      <div className="flex flex-1 min-h-0 gap-2 p-2">
        <Sidebar activePage={activePage} />

        {/* Right column: topbar + scrollable content */}
        <div className="flex flex-col flex-1 min-w-0 rounded-lg bg-[#121212] overflow-hidden">
          <TopBar spotifyUser={spotifyUser} />
          <main className="flex-1 overflow-y-auto px-6 py-4">
            {children}
          </main>
        </div>
      </div>

      {/* Player bar pinned to bottom */}
      <PlayerBar />
    </div>
  );
}
