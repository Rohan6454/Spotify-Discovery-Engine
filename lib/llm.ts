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

  const prompt = `You are a music expert. For each YouTube video title below, extract the PERFORMING ARTIST NAME only if it is clearly a music video or song.

Rules:
- Return the artist/band name only — NEVER a song title, album name, movie name, or show name
- If the title is "Led Zeppelin - Stairway to Heaven", return "Led Zeppelin" NOT "Stairway to Heaven"
- If the title is "Stairway to Heaven (Full Song)", return null — the artist is not identifiable
- Return null for: sports, boxing, fitness, gym motivation, interviews, podcasts, vlogs, gaming, trailers, news
- Return null for: motivational videos, workout compilations, fight highlights, documentaries
- Return null for: academic subjects, courses, lectures, tutorials (e.g. "Anthropology", "History", "Physics", "Philosophy", "Economics")
- Return null for: generic topic words that are not known music artists (e.g. "Introduction", "Chapter", "Lecture", "Study", "Guide")
- Do NOT extract names of athletes, boxers, YouTubers, influencers, or public figures who are not primarily musicians
- Do NOT return record label names (T-Series, Sony Music, Zee Music, Vevo, etc.)
- When uncertain whether a name is a real music artist or a topic/subject word, return null

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
 * Given a list of YouTube subscription channel names, returns only the ones
 * that are actual music artist or band channels (not labels, aggregators,
 * or non-music channels).
 */
export async function identifyArtistChannels(
  channelNames: string[]
): Promise<string[]> {
  if (channelNames.length === 0) return [];

  const prompt = `You are a music expert. Below is a list of YouTube channel names. For each one, decide if it is a music ARTIST or BAND channel (a real performing musician or group), or something else (record label, music aggregator, Bollywood studio, movie channel, non-music channel, news, sports, etc.).

Return ONLY a JSON object mapping each number to true (is an artist) or false (is not an artist).

Examples of artists: "Arijit Singh", "The Local Train", "Ed Sheeran", "Nucleya", "Prateek Kuhad"
Examples of non-artists: "T-Series", "Zee Music Company", "Sony Music India", "Tips Official", "Speed Records", "Saregama Music"

Channel names:
${channelNames.map((n, i) => `${i + 1}. ${n}`).join('\n')}

Respond with only valid JSON like:
{"1": true, "2": false, "3": true}`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);

    return channelNames.filter((_, i) => parsed[String(i + 1)] === true);
  } catch (err) {
    console.error('[llm] identifyArtistChannels failed:', err);
    return [];
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
