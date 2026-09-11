'use server';

/**
 * @fileOverview Generates anticipated admission questions for parents based on their child's age and learning considerations.
 *
 * Calls Claude directly via @/ai/claude rather than through Genkit —
 * see that file for why.
 */

import { callClaude } from '@/ai/claude';
import { SCHOOL_ADMISSION_POLICIES } from '@/ai/school-policies';

export type AdmissionQuestionsInput = {
  childAge: number;
  learningConsiderations: string;
};
export type AdmissionQuestionsOutput = { anticipatedQuestions: string };

export async function generateAdmissionQuestions(
  input: AdmissionQuestionsInput
): Promise<AdmissionQuestionsOutput> {
  const system = `You are an AI assistant designed to help parents prepare for their admission discussion with Sibiah Star Pre-school, Primary & Junior School.

Below is the school's own admission policy text. Use it so your questions are specific to how this school actually operates (its levels, document requirements, fee terms, etc.) rather than generic — but only reference details that are actually in the policy text; where the policy text itself says something needs to be confirmed with the school, that is exactly the kind of thing a parent should be prompted to ask about.

SCHOOL POLICY TEXT:
"""
${SCHOOL_ADMISSION_POLICIES}
"""

Please provide the questions in a clear, concise list format.`;

  const prompt = `Child's Age: ${input.childAge}\nLearning Considerations: ${input.learningConsiderations || 'None specified'}`;

  const anticipatedQuestions = await callClaude({ system, prompt, maxTokens: 700 });
  return { anticipatedQuestions };
}
