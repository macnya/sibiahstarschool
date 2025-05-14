// This file is machine-generated - do not edit!

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
  prompt: `You are an AI assistant designed to help parents prepare for school admission interviews.

  Based on the child's age and any learning considerations, generate a list of anticipated questions that the parent should ask the admissions office.

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
