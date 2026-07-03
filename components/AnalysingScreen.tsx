'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type StepStatus = 'pending' | 'active' | 'done' | 'error';

interface Step {
  id: string;
  label: string;
  status: StepStatus;
}

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="#1DB954">
    <path d="M13.86 3.66a.5.5 0 0 1 0 .707L6.693 11.534a.5.5 0 0 1-.707 0L2.14 7.688a.5.5 0 0 1 .707-.707l3.493 3.493L13.152 3.66a.5.5 0 0 1 .707 0z"/>
  </svg>
);

const Spinner = () => (
  <div className="w-4 h-4 rounded-full border-2 border-[#282828] border-t-[#1DB954] animate-spin" />
);

const ErrorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="#e22134">
    <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"/>
    <path d="M7.25 4.75a.75.75 0 0 1 1.5 0v4a.75.75 0 0 1-1.5 0v-4zm.75 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
  </svg>
);

export default function AnalysingScreen() {
  const router = useRouter();
  const [steps, setSteps] = useState<Step[]>([
    { id: 'spotify', label: 'Reading your Spotify library...', status: 'pending' },
    { id: 'youtube', label: 'Scanning your YouTube subscriptions and liked videos...', status: 'pending' },
    { id: 'gap', label: 'Finding the gap...', status: 'pending' },
  ]);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const setStep = (id: string, status: StepStatus) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // Clear any stale session data from a previous run
      await fetch('/api/auth/reset', { method: 'POST' });

      // Phase 1: Spotify library — held in client memory, not stored in session cookie
      setStep('spotify', 'active');
      const libRes = await fetch('/api/spotify/library');
      if (!libRes.ok || cancelled) {
        setStep('spotify', 'error');
        const libData = await libRes.json().catch(() => ({}));
        if (libData.error === 'not_authorized') {
          setErrorMsg('Your Spotify account is not authorised to use this app. Ask the app owner to add your email address in the Spotify Developer Dashboard → User Management.');
        } else {
          setErrorMsg('Failed to read Spotify library.');
        }
        return;
      }
      const library = await libRes.json();
      setStep('spotify', 'done');
      setProgress(33);

      // Phase 2: YouTube signals
      setStep('youtube', 'active');
      const ytRes = await fetch('/api/youtube/signals');
      if (!ytRes.ok || cancelled) { setStep('youtube', 'error'); setErrorMsg('Failed to read YouTube data.'); return; }
      const { signals: allSignals, likedVideos } = await ytRes.json();
      if (likedVideos?.length) localStorage.setItem('de_yt_liked_videos', JSON.stringify(likedVideos));

      // Only search Spotify for name-extracted signals (from video titles like "Arijit Singh")
      // Subscription channel names (T-Series, Career247 etc) never match Spotify artists
      const signals = allSignals.filter((s: any) => s.channelId?.startsWith('name:'));

      setStep('youtube', 'done');
      setProgress(66);
      console.log(`[client] filtered ${allSignals.length} → ${signals.length} name-extracted signals`);

      // Phase 3: Gap matching — signals AND library travel in request body
      setStep('gap', 'active');
      const total = signals.length;
      let offset = 0;
      let accumulated: any[] = [];

      while (true) {
        if (cancelled) return;
        const nextOffset = offset + 10 < total ? offset + 10 : null;
        const matchRes = await fetch('/api/gap/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ offset, signals, library, accumulated, isFinal: nextOffset === null }),
        });
        if (!matchRes.ok) { setStep('gap', 'error'); setErrorMsg('Failed during gap analysis.'); return; }
        const data = await matchRes.json();
        accumulated = data.allResults ?? accumulated;

        const batchDone = Math.min(offset + 10, total);
        setProgress(66 + Math.round((batchDone / Math.max(total, 1)) * 34));

        if (data.rateLimited) { setStep('gap', 'error'); setErrorMsg(`Spotify rate limit hit. Wait ${data.retryAfter ?? 60} seconds without clicking anything, then try again.`); return; }
        if (data.premiumRequired) { setStep('gap', 'error'); setErrorMsg('Spotify Premium is required to use the search API. Please upgrade your Spotify account to Premium and try again.'); return; }
        if (nextOffset === null) break;
        offset = nextOffset;
      }

      setStep('gap', 'done');
      setProgress(100);

      // Persist sorted results to localStorage for DiscoveryGapScreen
      const sorted = [...accumulated].sort((a: any, b: any) => b.score - a.score);
      localStorage.setItem('de_gap_results', JSON.stringify(sorted));

      // LLM enrichment — insight + genre tags (non-blocking, best effort)
      try {
        const gapArtists = sorted.filter((a: any) => !a.inLibrary);
        const inLibraryArtists = sorted.filter((a: any) => a.inLibrary);
        const enrichRes = await fetch('/api/gap/enrich', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gapArtists, inLibraryArtists }),
        });
        if (enrichRes.ok) {
          const { insight, genreTags } = await enrichRes.json();
          if (insight) localStorage.setItem('de_gap_insight', insight);
          if (genreTags) localStorage.setItem('de_genre_tags', JSON.stringify(genreTags));
        }
      } catch {
        // Non-fatal — discovery screen works fine without enrichment
      }

      if (!cancelled) {
        setTimeout(() => router.push('/discovery'), 600);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/20">
            <div className="w-2 h-2 rounded-full bg-[#1DB954] animate-pulse" />
            <span className="text-[#1DB954] text-xs font-semibold uppercase tracking-wider">Discovery Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Analysing your music universe</h1>
          <p className="text-[#a7a7a7] text-sm mt-2">This takes about 10–20 seconds</p>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-4 mb-8">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center gap-4 p-4 rounded-lg bg-[#181818]">
              <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                {step.status === 'done' && <CheckIcon />}
                {step.status === 'active' && <Spinner />}
                {step.status === 'error' && <ErrorIcon />}
                {step.status === 'pending' && (
                  <div className="w-4 h-4 rounded-full border-2 border-[#535353]" />
                )}
              </div>
              <span className={`text-sm ${
                step.status === 'done' ? 'text-white' :
                step.status === 'active' ? 'text-white font-medium' :
                step.status === 'error' ? 'text-[#e22134]' :
                'text-[#535353]'
              }`}>
                {step.status === 'done'
                  ? step.label.replace('...', ' ✓').replace('...', '')
                  : step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-[#282828] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1DB954] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center text-[#a7a7a7] text-xs mt-2">{progress}% complete</p>

        {/* Error state */}
        {errorMsg && (
          <div className="mt-6 p-4 rounded-lg bg-[#e22134]/10 border border-[#e22134]/30 text-[#e22134] text-sm text-center">
            {errorMsg}
            <button
              onClick={() => window.location.reload()}
              className="block mx-auto mt-2 text-white underline text-xs"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
