'use server';

/**
 * @fileOverview Answers a parent's admissions question, grounded in the
 * school's admission policy text (see @/ai/school-policies). The model
 * is explicitly instructed not to invent fees, dates, or requirements
 * that aren't in that text — for anything outside it, the correct
 * answer is "contact the school office", not a guess.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { SCHOOL_ADMISSION_POLICIES } from '@/ai/school-policies';

const AdmissionQaInputSchema = z.object({
  question: z.string().describe("The parent's admissions question."),
});
export type AdmissionQaInput = z.infer<typeof AdmissionQaInputSchema>;

const AdmissionQaOutputSchema = z.object({
  answer: z.string().describe("A helpful, accurate answer grounded in the school's stated policy."),
});
export type AdmissionQaOutput = z.infer<typeof AdmissionQaOutputSchema>;

export async function answerAdmissionQuestion(
  input: AdmissionQaInput
): Promise<AdmissionQaOutput> {
  return admissionQaFlow(input);
}

const prompt = ai.definePrompt({
  name: 'admissionPolicyQaPrompt',
  input: { schema: AdmissionQaInputSchema },
  output: { schema: AdmissionQaOutputSchema },
  prompt: `You are a warm, helpful admissions assistant for Sibiah Star Pre-school, Primary & Junior School in Nairobi, Kenya.

Answer the parent's question using ONLY the school policy text below. Do not invent specific fees, dates, or numbers that are not stated in the policy text — if the policy text says a detail should be confirmed with the school, tell the parent that directly and suggest they contact the school office via the Contact page.

If the question is unrelated to admissions or this school entirely, politely redirect them to the Contact page.

Keep the answer concise, warm, and in plain language a parent would appreciate — a short paragraph or a few bullet points, not a wall of text.

SCHOOL POLICY TEXT:
"""
${SCHOOL_ADMISSION_POLICIES}
"""

PARENT'S QUESTION:
{{{question}}}
`,
});

const admissionQaFlow = ai.defineFlow(
  {
    name: 'admissionQaFlow',
    inputSchema: AdmissionQaInputSchema,
    outputSchema: AdmissionQaOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
