'use client';

import Link from 'next/link';

interface SidebarProps {
  activePage: 'home' | 'search' | 'library' | 'discovery';
}

const HomeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h4.5v-6h7V20H20V7.577l-7.5-4.33z"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10.533 1.279c-5.18 0-9.407 4.227-9.407 9.407 0 5.18 4.227 9.407 9.407 9.407 2.234 0 4.29-.783 5.907-2.083l4.569 4.57a1 1 0 1 0 1.414-1.414l-4.57-4.57a9.366 9.366 0 0 0 2.084-5.91c0-5.18-4.227-9.407-9.404-9.407zm-7.407 9.407a7.407 7.407 0 1 1 14.814 0 7.407 7.407 0 0 1-14.814 0z"/>
  </svg>
);

const LibraryIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 22a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v18a1 1 0 0 1-1 1zM15.5 2.134A1 1 0 0 0 14 3v18a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6.464a1 1 0 0 0-.5-.866l-6-3.464zM9 2a1 1 0 0 0-1 1v18a1 1 0 1 0 2 0V3a1 1 0 0 0-1-1z"/>
  </svg>
);

const SpotifyLogo = () => (
  <svg width="131" height="40" viewBox="0 0 131 40" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0zm9.164 28.863a1.25 1.25 0 0 1-1.719.416c-4.708-2.878-10.632-3.528-17.607-1.933a1.25 1.25 0 0 1-.558-2.437c7.633-1.745 14.178-1.004 19.468 2.235a1.25 1.25 0 0 1 .416 1.719zm2.443-5.436a1.562 1.562 0 0 1-2.147.514C24.1 20.77 17.356 19.803 9.2 22.063a1.563 1.563 0 1 1-.857-3.002c9.09-2.592 16.67-1.476 22.848 2.22a1.562 1.562 0 0 1 .416 2.146zm.21-5.66c-6.299-3.742-16.695-4.086-22.712-2.261a1.874 1.874 0 1 1-1.088-3.59c6.903-2.094 18.377-1.69 25.628 2.616a1.875 1.875 0 0 1-1.828 3.235z"/>
    <path d="M52.107 18.146c-3.423-.816-4.033-1.388-4.033-2.592 0-1.14 1.074-1.908 2.672-1.908 1.553 0 3.094.586 4.706 1.792a.28.28 0 0 0 .39-.063l1.96-2.764a.28.28 0 0 0-.059-.387c-1.912-1.482-4.067-2.203-6.955-2.203-3.91 0-6.644 2.34-6.644 5.686 0 3.572 2.34 4.833 6.196 5.77 3.267.746 3.815 1.38 3.815 2.508 0 1.255-1.123 2.03-2.932 2.03-2.006 0-3.645-.675-5.47-2.257a.28.28 0 0 0-.393.034l-2.196 2.618a.28.28 0 0 0 .031.393c2.13 1.894 4.748 2.896 7.966 2.896 4.222 0 6.953-2.293 6.953-5.839 0-2.993-1.786-4.63-5.807-5.72zM66.24 14.61c-1.79 0-3.258.706-4.46 2.147v-1.718a.28.28 0 0 0-.28-.28h-3.479a.28.28 0 0 0-.28.28V33.42a.28.28 0 0 0 .28.28h3.48a.28.28 0 0 0 .279-.28v-5.977c1.202 1.366 2.67 2.037 4.46 2.037 3.32 0 6.679-2.557 6.679-7.435s-3.36-7.435-6.679-7.435zm2.953 7.435c0 2.427-1.495 4.114-3.637 4.114-2.12 0-3.71-1.76-3.71-4.114 0-2.354 1.59-4.114 3.71-4.114 2.13 0 3.637 1.724 3.637 4.114zM81.27 14.61c-4.243 0-7.565 3.249-7.565 7.435s3.298 7.411 7.516 7.411c4.258 0 7.588-3.236 7.588-7.411s-3.302-7.435-7.54-7.435zm0 11.257c-2.162 0-3.784-1.734-3.784-4.114 0-2.39 1.567-4.065 3.736-4.065 2.175 0 3.808 1.733 3.808 4.065 0 2.39-1.578 4.114-3.76 4.114zM97.64 14.759h-3.83v-3.98a.28.28 0 0 0-.28-.28H90.05a.28.28 0 0 0-.28.28v3.98h-1.67a.28.28 0 0 0-.28.28v2.99a.28.28 0 0 0 .28.28h1.67v7.72c0 3.12 1.554 4.704 4.618 4.704 1.245 0 2.279-.258 3.25-.809a.28.28 0 0 0 .142-.244v-2.852a.28.28 0 0 0-.406-.25c-.672.337-1.32.493-2.04.493-1.115 0-1.613-.507-1.613-1.646v-7.116h3.83a.28.28 0 0 0 .28-.28v-2.99a.28.28 0 0 0-.28-.28h-.11zM109.798 14.765v-.482c0-1.417.544-2.05 1.764-2.05.72 0 1.299.143 1.947.358a.28.28 0 0 0 .364-.267V9.43a.28.28 0 0 0-.198-.268c-.728-.22-1.66-.447-3.037-.447-3.37 0-5.152 1.897-5.152 5.486v.515h-1.671a.28.28 0 0 0-.28.28v3.002a.28.28 0 0 0 .28.28h1.671v10.836a.28.28 0 0 0 .28.28h3.479a.28.28 0 0 0 .28-.28V18.278h3.25l4.978 10.836c-.565 1.253-.122 1.887.36 1.887.49 0 1.064-.306 1.064-.306l.004.005 1.988-4.527-5.337-11.408h1.985a.28.28 0 0 0 .28-.28v-3.002a.28.28 0 0 0-.28-.28h-7.979v-.438z"/>
  </svg>
);

const navItems = [
  { id: 'home', label: 'Home', icon: HomeIcon, href: '/' },
  { id: 'search', label: 'Search', icon: SearchIcon, href: '#' },
  { id: 'library', label: 'Your Library', icon: LibraryIcon, href: '#' },
] as const;

const mockPlaylists = [
  'Liked Songs',
  'Chill Evenings',
  'Running Mix',
  'Late Night Coding',
  'Sunday Morning',
];

export default function Sidebar({ activePage }: SidebarProps) {
  return (
    <aside className="flex flex-col w-60 shrink-0 bg-black rounded-lg overflow-hidden">
      {/* Logo */}
      <div className="px-6 pt-6 pb-4">
        <SpotifyLogo />
      </div>

      {/* Main nav */}
      <nav className="px-2">
        {navItems.map(({ id, label, icon: Icon, href }) => (
          <Link
            key={id}
            href={href}
            className={`flex items-center gap-4 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
              activePage === id
                ? 'text-white'
                : 'text-[#a7a7a7] hover:text-white'
            }`}
          >
            <Icon />
            {label}
          </Link>
        ))}
      </nav>

      {/* Discovery Engine feature — highlighted as active */}
      <div className="mt-4 mx-2">
        <div className="flex items-center gap-4 px-4 py-2 rounded-md bg-[#1a1a1a] border-l-2 border-[#1DB954]">
          <span className="text-[#1DB954]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
          </span>
          <span className="text-white text-sm font-semibold">Discovery Engine</span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#282828] mx-4 my-4" />

      {/* Mock library */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-[#a7a7a7]">Playlists</p>
        {mockPlaylists.map((name) => (
          <div
            key={name}
            className="px-4 py-1.5 text-sm text-[#a7a7a7] hover:text-white cursor-pointer transition-colors rounded-md hover:bg-[#282828]"
          >
            {name}
          </div>
        ))}
      </div>
    </aside>
  );
}
