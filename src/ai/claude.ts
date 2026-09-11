'use server';

/**
 * Minimal direct client for Claude's Messages API. Deliberately plain
 * fetch() rather than the @anthropic-ai/sdk package — Node 18+ (this app
 * runs on Node 22) has fetch built in, so this avoids adding a new npm
 * dependency and the redeploy/reinstall friction that comes with one.
 *
 * Docs: https://docs.claude.com/en/api/messages
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

// Haiku 4.5 — fast and cost-effective, a good fit for short admissions
// Q&A and list-generation tasks like these two flows.
const MODEL = 'claude-haiku-4-5-20251001';

export async function callClaude(params: {
  system?: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set in this environment.');
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: params.maxTokens ?? 1024,
      system: params.system,
      messages: [{ role: 'user', content: params.prompt }],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Claude API error (${response.status}): ${body.slice(0, 300)}`);
  }

  const data = await response.json();
  const textBlock = (data.content as Array<{ type: string; text?: string }> | undefined)?.find(
    (block) => block.type === 'text'
  );

  if (!textBlock?.text) {
    throw new Error('Claude API returned no text content.');
  }

  return textBlock.text;
}
