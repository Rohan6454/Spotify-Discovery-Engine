import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Given a batch of YouTube video titles, returns a map of
 * title → extracted artist name (or null if no artist found).
 * Uses GPT-4o Mini for cost efficiency.
 */
export async function extractArtistsFromTitles(
  titles: string[]
): Promise<Record<string, string | null>> {
  if (titles.length === 0) return {};

  const prompt = `You are a music expert. For each YouTube video title below, extract the performing artist name if it is a music video. Return ONLY a JSON object mapping each title to the artist name string, or null if it is not a music video or no artist can be identified. Do not include record labels, distributors, or movie/show names as artists.

Titles:
${titles.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Respond with only valid JSON like:
{"1": "Artist Name", "2": null, "3": "Another Artist"}`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);

    const result: Record<string, string | null> = {};
    titles.forEach((title, i) => {
      result[title] = parsed[String(i + 1)] ?? null;
    });
    return result;
  } catch (err) {
    console.error('[llm] extractArtistsFromTitles failed:', err);
    return {};
  }
}

/**
 * Generates a personalized 2-3 sentence insight about the user's discovery gap.
 */
export async function generateGapInsight(
  gapArtistNames: string[],
  inLibraryArtistNames: string[]
): Promise<string> {
  if (gapArtistNames.length === 0) return '';

  const prompt = `You are a music discovery expert. A user has been exploring these artists on YouTube but hasn't saved them on Spotify yet:
Missing from Spotify: ${gapArtistNames.slice(0, 20).join(', ')}
Already in their Spotify library: ${inLibraryArtistNames.slice(0, 10).join(', ') || 'none'}

Write a 2-3 sentence personalized insight about their discovery gap. Mention specific patterns you notice (genres, regions, eras, moods). Be conversational and specific — not generic. Do not use bullet points. Return plain text only.`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 150,
    });
    return response.choices[0]?.message?.content?.trim() ?? '';
  } catch (err) {
    console.error('[llm] generateGapInsight failed:', err);
    return '';
  }
}

/**
 * Returns genre/mood tags for a list of artist names.
 * Returns a map of artistName → "Genre · Mood" string.
 */
export async function generateGenreTags(
  artistNames: string[]
): Promise<Record<string, string>> {
  if (artistNames.length === 0) return {};

  const prompt = `For each artist below, return 1-2 short genre or mood tags (e.g. "Bollywood · Romantic", "Hip-Hop · Trap", "Indie Folk", "Electronic · Dance"). Return ONLY a JSON object mapping artist name to tag string. If you don't know the artist, return an empty string.

Artists:
${artistNames.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Respond with only valid JSON like:
{"1": "Bollywood · Romantic", "2": "Hip-Hop", "3": ""}`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);

    const result: Record<string, string> = {};
    artistNames.forEach((name, i) => {
      result[name] = parsed[String(i + 1)] ?? '';
    });
    return result;
  } catch (err) {
    console.error('[llm] generateGenreTags failed:', err);
    return {};
  }
}
