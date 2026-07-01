'use client';

import { useState } from 'react';

const ShuffleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M13.151.922a.75.75 0 1 0-1.06 1.06L13.109 3H11.16a3.75 3.75 0 0 0-2.873 1.34l-6.173 7.356A2.25 2.25 0 0 1 .39 12.5H0V14h.391a3.75 3.75 0 0 0 2.873-1.34l6.173-7.356A2.25 2.25 0 0 1 11.16 4.5h1.949l-1.017 1.017a.75.75 0 0 0 1.06 1.06L15.98 3.75 13.15.922zM.391 3.5H0V2h.391c1.109 0 2.16.49 2.873 1.34L4.89 5.277l-.979 1.167-1.353-1.61A2.25 2.25 0 0 0 .39 3.5z"/>
    <path d="m7.1 10.723.98-1.167.957 1.14a2.25 2.25 0 0 0 1.724.804h1.964l-1.017-1.016a.75.75 0 1 1 1.06-1.06l2.829 2.828-2.829 2.828a.75.75 0 1 1-1.06-1.06L13.109 14H10.76a3.75 3.75 0 0 1-2.874-1.34l-.784-.933z"/>
  </svg>
);

const PrevIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M3.3 1a.7.7 0 0 1 .7.7v5.15l9.95-5.744a.7.7 0 0 1 1.05.606v12.575a.7.7 0 0 1-1.05.607L4 9.149V14.3a.7.7 0 0 1-.7.7H1.7a.7.7 0 0 1-.7-.7V1.7a.7.7 0 0 1 .7-.7h1.6z"/>
  </svg>
);

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"/>
  </svg>
);

const PauseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2.7 1a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7H2.7zm8 0a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-2.6z"/>
  </svg>
);

const NextIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M12.7 1a.7.7 0 0 0-.7.7v5.15L2.05 1.107A.7.7 0 0 0 1 1.712v12.575a.7.7 0 0 0 1.05.607L12 9.149V14.3a.7.7 0 0 0 .7.7h1.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-1.6z"/>
  </svg>
);

const RepeatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M0 4.143C0 2.955.982 2 2.188 2h9.094v-.85a.75.75 0 0 1 1.159-.626L15.07 2.36a.75.75 0 0 1 0 1.25l-2.63 1.838a.75.75 0 0 1-1.158-.625V4H2.188C1.742 4 1.5 4.32 1.5 4.143v4.714H0V4.143zm16 7.714C16 13.045 15.018 14 13.812 14H4.718v.85a.75.75 0 0 1-1.158.626L.93 13.64a.75.75 0 0 1 0-1.25l2.63-1.838a.75.75 0 0 1 1.158.625V12h9.094c.446 0 .688-.32.688-.857V6.429H16v5.428z"/>
  </svg>
);

const VolumeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M9.741.85a.75.75 0 0 1 .375.65v13a.75.75 0 0 1-1.125.65l-6.925-4a.75.75 0 0 1-.375-.65v-5a.75.75 0 0 1 .375-.65l6.925-4a.75.75 0 0 1 .75 0zm-6.65 5.096v3.108l5.65 3.261V2.685L3.091 5.946z"/>
    <path d="M11.5 13.614a5.752 5.752 0 0 0 0-11.228v1.55a4.252 4.252 0 0 1 0 8.127v1.55z"/>
  </svg>
);

const mockTrack = {
  name: 'Nothing',
  artist: '— Connect YouTube to get started',
  albumArt: null,
};

export default function PlayerBar() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(30);

  return (
    <div className="flex items-center justify-between px-4 h-[90px] bg-[#181818] border-t border-[#282828] shrink-0">
      {/* Now playing */}
      <div className="flex items-center gap-3 w-[30%] min-w-0">
        <div className="w-14 h-14 rounded bg-[#282828] shrink-0 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#a7a7a7">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{mockTrack.name}</p>
          <p className="text-xs text-[#a7a7a7] truncate">{mockTrack.artist}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-2 w-[40%]">
        <div className="flex items-center gap-5">
          <button className="text-[#a7a7a7] hover:text-white transition-colors"><ShuffleIcon /></button>
          <button className="text-[#a7a7a7] hover:text-white transition-colors"><PrevIcon /></button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform text-black"
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button className="text-[#a7a7a7] hover:text-white transition-colors"><NextIcon /></button>
          <button className="text-[#a7a7a7] hover:text-white transition-colors"><RepeatIcon /></button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 w-full">
          <span className="text-[10px] text-[#a7a7a7] w-8 text-right">1:05</span>
          <div className="flex-1 h-1 bg-[#535353] rounded-full relative group cursor-pointer">
            <div
              className="h-full bg-white rounded-full group-hover:bg-[#1DB954] transition-colors"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          </div>
          <span className="text-[10px] text-[#a7a7a7] w-8">3:32</span>
        </div>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 w-[30%] justify-end">
        <button className="text-[#a7a7a7] hover:text-white transition-colors"><VolumeIcon /></button>
        <div className="w-24 h-1 bg-[#535353] rounded-full relative group cursor-pointer">
          <div className="h-full w-2/3 bg-white rounded-full group-hover:bg-[#1DB954] transition-colors" />
        </div>
      </div>
    </div>
  );
}
