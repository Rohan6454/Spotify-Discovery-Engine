import { NextRequest, NextResponse } from 'next/server';
import { generateGapInsight, generateGenreTags } from '@/lib/llm';

export async function POST(req: NextRequest) {
  const { gapArtists, inLibraryArtists } = await req.json();

  const gapNames: string[] = (gapArtists ?? []).map((a: any) => a.spotifyArtistName).filter(Boolean);
  const libraryNames: string[] = (inLibraryArtists ?? []).map((a: any) => a.spotifyArtistName).filter(Boolean);

  const [insight, genreTags] = await Promise.all([
    generateGapInsight(gapNames, libraryNames),
    generateGenreTags(gapNames.slice(0, 50)),
  ]);

  console.log(`[enrich] insight generated, genre tags for ${Object.keys(genreTags).length} artists`);

  return NextResponse.json({ insight, genreTags });
}
