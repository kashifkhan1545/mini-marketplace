import { route, requireUser, HttpError } from '@/lib/server/db';

// AI feature: seller uploads a product photo -> suggested title + description.
// POST { image: <base64 without prefix>, mediaType: 'image/jpeg' }
export const POST = route(async (req) => {
  await requireUser(req, ['seller', 'admin']);
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new HttpError(503, 'AI is not configured (set ANTHROPIC_API_KEY)');
  const { image, mediaType } = await req.json();
  if (!image) throw new HttpError(400, 'image is required');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-haiku-5-5',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: image } },
            {
              type: 'text',
              text:
                'You write listings for an online furniture marketplace. Look at this product photo and reply with ONLY JSON: ' +
                '{"title": "<short product title, max 70 chars>", "description": "<2-3 sentence factual description, no brand names>"}',
            },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new HttpError(502, `AI request failed (${res.status})`);
  const json = await res.json();
  const text: string = json.content?.[0]?.text || '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new HttpError(502, 'AI returned an unexpected answer');
  const parsed = JSON.parse(match[0]);
  return { title: String(parsed.title || ''), description: String(parsed.description || '') };
});
