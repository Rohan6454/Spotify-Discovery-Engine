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
