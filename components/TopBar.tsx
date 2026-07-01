'use client';

interface TopBarProps {
  spotifyUser?: { name: string; avatar: string | null } | null;
}

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M11.03.47a.75.75 0 0 1 0 1.06L4.56 8l6.47 6.47a.75.75 0 1 1-1.06 1.06L2.44 8 9.97.47a.75.75 0 0 1 1.06 0z"/>
  </svg>
);

const ForwardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M4.97.47a.75.75 0 0 0 0 1.06L11.44 8 4.97 14.47a.75.75 0 1 0 1.06 1.06L13.56 8 6.03.47a.75.75 0 0 0-1.06 0z"/>
  </svg>
);

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function TopBar({ spotifyUser }: TopBarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3 shrink-0 bg-[#121212]">
      {/* Navigation arrows */}
      <div className="flex items-center gap-2">
        <button
          className="w-8 h-8 flex items-center justify-center rounded-full bg-black/70 text-[#a7a7a7] hover:text-white transition-colors"
          aria-label="Go back"
          onClick={() => history.back()}
        >
          <BackIcon />
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center rounded-full bg-black/70 text-[#a7a7a7] hover:text-white transition-colors"
          aria-label="Go forward"
          onClick={() => history.forward()}
        >
          <ForwardIcon />
        </button>
      </div>

      {/* User avatar */}
      {spotifyUser && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#282828] rounded-full pl-0.5 pr-3 py-0.5 hover:bg-[#3e3e3e] cursor-pointer transition-colors">
            {spotifyUser.avatar ? (
              <img
                src={spotifyUser.avatar}
                alt={spotifyUser.name}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#535353] flex items-center justify-center text-xs font-bold text-white">
                {getInitials(spotifyUser.name)}
              </div>
            )}
            <span className="text-sm font-semibold text-white">{spotifyUser.name}</span>
          </div>
        </div>
      )}
    </div>
  );
}
