import { NextResponse } from 'next/server';
import { answerAdmissionQuestion } from '@/ai/flows/admission-policy-qa';

// TEMPORARY DIAGNOSTIC ROUTE — delete this file once the AI guide issue
// is resolved. It requires a query-string token as a mild deterrent
// against random discovery while it's live, but it is not real auth —
// treat it as public and remove it promptly.
const DEBUG_TOKEN = 'sibiah-debug-2026';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('token') !== DEBUG_TOKEN) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const anthropicKeySet = Boolean(process.env.ANTHROPIC_API_KEY);

  let callResult: { ok: true; answer: string } | { ok: false; message: string };
  try {
    const result = await answerAdmissionQuestion({ question: 'What documents do I need to enroll?' });
    callResult = { ok: true, answer: result.answer };
  } catch (err) {
    callResult = {
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }

  return NextResponse.json({
    anthropicKeySet,
    nodeVersion: process.version,
    callResult,
  });
}