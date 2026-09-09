'use server';

/**
 * @fileOverview Generates anticipated admission questions for parents based on their child's age and learning considerations.
 *
 * - generateAdmissionQuestions - A function that generates admission questions.
 * - AdmissionQuestionsInput - The input type for the generateAdmissionQuestions function.
 * - AdmissionQuestionsOutput - The return type for the generateAdmissionQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {SCHOOL_ADMISSION_POLICIES} from '@/ai/school-policies';

const AdmissionQuestionsInputSchema = z.object({
  childAge: z
    .number()
    .describe('The age of the child in years.'),
  learningConsiderations: z
    .string()
    .describe(
      'Any specific learning considerations or special needs of the child. Leave blank if none.'
    ),
});
export type AdmissionQuestionsInput = z.infer<typeof AdmissionQuestionsInputSchema>;

const AdmissionQuestionsOutputSchema = z.object({
  anticipatedQuestions: z
    .string()
    .describe(
      'A list of anticipated questions a parent should ask the admissions office.'
    ),
});
export type AdmissionQuestionsOutput = z.infer<typeof AdmissionQuestionsOutputSchema>;

export async function generateAdmissionQuestions(
  input: AdmissionQuestionsInput
): Promise<AdmissionQuestionsOutput> {
  return generateAdmissionQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'admissionQuestionGeneratorPrompt',
  input: {schema: AdmissionQuestionsInputSchema},
  output: {schema: AdmissionQuestionsOutputSchema},
  prompt: `You are an AI assistant designed to help parents prepare for their admission discussion with Sibiah Star Pre-school, Primary & Junior School.

Below is the school's own admission policy text. Use it so your questions are specific to how this school actually operates (its levels, document requirements, fee terms, etc.) rather than generic — but only reference details that are actually in the policy text; where the policy text itself says something needs to be confirmed with the school, that is exactly the kind of thing a parent should be prompted to ask about.

SCHOOL POLICY TEXT:
"""
${SCHOOL_ADMISSION_POLICIES}
"""

Based on the child's age and any learning considerations below, generate a list of anticipated questions that the parent should ask the admissions office.

Child's Age: {{{childAge}}}
Learning Considerations: {{{learningConsiderations}}}

Please provide the questions in a clear, concise list format.
`,
});

const generateAdmissionQuestionsFlow = ai.defineFlow(
  {
    name: 'generateAdmissionQuestionsFlow',
    inputSchema: AdmissionQuestionsInputSchema,
    outputSchema: AdmissionQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
