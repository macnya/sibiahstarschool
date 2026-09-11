'use server';

/**
 * @fileOverview Answers a parent's admissions question, grounded in the
 * school's admission policy text (see @/ai/school-policies). The model
 * is explicitly instructed not to invent fees, dates, or requirements
 * that aren't in that text — for anything outside it, the correct
 * answer is "contact the school office", not a guess.
 *
 * Calls Claude directly via @/ai/claude rather than through Genkit —
 * see that file for why.
 */

import { callClaude } from '@/ai/claude';
import { SCHOOL_ADMISSION_POLICIES } from '@/ai/school-policies';

export type AdmissionQaInput = { question: string };
export type AdmissionQaOutput = { answer: string };

export async function answerAdmissionQuestion(
  input: AdmissionQaInput
): Promise<AdmissionQaOutput> {
  const system = `You are a warm, helpful admissions assistant for Sibiah Star Pre-school, Primary & Junior School in Nairobi, Kenya.

Answer the parent's question using ONLY the school policy text below. Do not invent specific fees, dates, or numbers that are not stated in the policy text — if the policy text says a detail should be confirmed with the school, tell the parent that directly and suggest they contact the school office via the Contact page.

If the question is unrelated to admissions or this school entirely, politely redirect them to the Contact page.

Keep the answer concise, warm, and in plain language a parent would appreciate — a short paragraph or a few bullet points, not a wall of text.

SCHOOL POLICY TEXT:
"""
${SCHOOL_ADMISSION_POLICIES}
"""`;

  const answer = await callClaude({ system, prompt: input.question, maxTokens: 500 });
  return { answer };
}
