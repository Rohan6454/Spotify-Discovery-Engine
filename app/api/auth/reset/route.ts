import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function POST() {
  const session = await getSession();
  session.youtube_signals_cache = undefined;
  session.spotify_library_cache = undefined;
  session.gap_results = undefined;
  await session.save();
  return NextResponse.json({ ok: true });
}

// GET version redirects to /analysing after clearing — used by the analysing page
export async function GET(req: NextRequest) {
  const session = await getSession();
  session.youtube_signals_cache = undefined;
  session.spotify_library_cache = undefined;
  session.gap_results = undefined;
  await session.save();
  return NextResponse.redirect(new URL('/analysing', req.url));
}
