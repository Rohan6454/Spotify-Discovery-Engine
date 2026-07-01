'use client';

interface ConnectYouTubeProps {
  spotifyConnected: boolean;
}

const YouTubeIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="#FF0000">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const SpotifyCheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="#1DB954">
    <path d="M13.86 3.66a.5.5 0 0 1 0 .707L6.693 11.534a.5.5 0 0 1-.707 0L2.14 7.688a.5.5 0 0 1 .707-.707l3.493 3.493L13.152 3.66a.5.5 0 0 1 .707 0z"/>
  </svg>
);

export default function ConnectYouTube({ spotifyConnected }: ConnectYouTubeProps) {
  const handleConnect = () => {
    window.location.href = '/api/auth/google/login';
  };

  const handleConnectSpotify = () => {
    window.location.href = '/api/auth/spotify/login';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
      {/* Feature badge */}
      <div className="flex items-center gap-2 mb-8 px-3 py-1.5 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/20">
        <div className="w-2 h-2 rounded-full bg-[#1DB954] animate-pulse" />
        <span className="text-[#1DB954] text-xs font-semibold uppercase tracking-wider">Discovery Engine</span>
      </div>

      {/* Headline */}
      <h1 className="text-4xl font-bold text-white text-center mb-4 max-w-lg leading-tight">
        See what you've been discovering outside Spotify
      </h1>
      <p className="text-[#a7a7a7] text-center text-base max-w-md mb-10 leading-relaxed">
        Connect your YouTube account to find artists you've been exploring — and bring the ones you're missing straight into Spotify.
      </p>

      {/* Connection status */}
      <div className="flex flex-col gap-3 w-full max-w-sm mb-8">
        {/* Spotify status */}
        <div className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
          spotifyConnected
            ? 'bg-[#1DB954]/5 border-[#1DB954]/30'
            : 'bg-[#282828] border-[#3e3e3e]'
        }`}>
          <div className="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill={spotifyConnected ? '#1DB954' : '#a7a7a7'}>
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            <span className={`text-sm font-medium ${spotifyConnected ? 'text-white' : 'text-[#a7a7a7]'}`}>
              Spotify
            </span>
          </div>
          {spotifyConnected ? (
            <div className="flex items-center gap-1.5">
              <SpotifyCheckIcon />
              <span className="text-[#1DB954] text-xs font-semibold">Connected</span>
            </div>
          ) : (
            <button
              onClick={handleConnectSpotify}
              className="text-xs text-[#1DB954] font-semibold hover:underline"
            >
              Connect
            </button>
          )}
        </div>

        {/* Spotify access note — shown only when not yet connected */}
        {!spotifyConnected && (
          <div className="flex gap-2.5 px-3 py-2.5 rounded-lg bg-[#1a1a1a] border border-[#2e2e2e]">
            <span className="text-[#a7a7a7] mt-0.5 shrink-0">ⓘ</span>
            <p className="text-[#6a6a6a] text-xs leading-relaxed">
              This app is in development mode. Your Spotify account must be added to the{' '}
              <span className="text-[#a7a7a7]">Developer Dashboard → User Management</span>{' '}
              before you can connect. Contact the app owner if you don't have access.
            </p>
          </div>
        )}

        {/* YouTube — to connect */}
        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#282828] border border-[#3e3e3e]">
          <div className="flex items-center gap-3">
            <YouTubeIcon />
            <span className="text-[#a7a7a7] text-sm font-medium">YouTube</span>
          </div>
          <span className="text-[#a7a7a7] text-xs">Not connected</span>
        </div>
      </div>

      {/* Primary CTA */}
      <button
        onClick={handleConnect}
        disabled={!spotifyConnected}
        className="px-8 py-3.5 rounded-full bg-[#1DB954] text-black font-bold text-sm hover:bg-[#1ed760] hover:scale-[1.02] active:scale-100 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {spotifyConnected ? 'Connect YouTube' : 'Connect Spotify first'}
      </button>

      {!spotifyConnected && (
        <p className="mt-3 text-[#a7a7a7] text-xs text-center">
          You need to connect Spotify before connecting YouTube.
        </p>
      )}

      {/* What we read disclaimer */}
      <p className="mt-8 text-[#6a6a6a] text-xs text-center max-w-xs leading-relaxed">
        We read your YouTube subscriptions, liked videos, and saved playlists.
        Watch history is not accessed.
      </p>

      {/* Access disclaimer */}
      <div className="mt-4 px-4 py-3 rounded-lg bg-[#181818] border border-[#282828] max-w-sm">
        <p className="text-[#6a6a6a] text-xs text-center leading-relaxed">
          <span className="text-[#a7a7a7] font-medium">Access restricted?</span>{' '}
          This app is currently in development mode. If you can't connect your Spotify account,
          ask the app owner to add your email address in the{' '}
          <span className="text-[#a7a7a7]">Spotify Developer Dashboard → User Management</span>{' '}
          to get access.
        </p>
      </div>
    </div>
  );
}
