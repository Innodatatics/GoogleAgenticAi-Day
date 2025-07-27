'use server';

/**
 * @fileOverview Identifies recurrent causes from issue descriptions.
 *
 * - identifyRecurrentCauses - A function that identifies recurrent causes from issue descriptions.
 */

import {ai} from '@/ai/genkit';
import {
  IdentifyRecurrentCausesInputSchema,
  IdentifyRecurrentCausesOutputSchema,
  type IdentifyRecurrentCausesInput,
  type IdentifyRecurrentCausesOutput,
} from '@/lib/types';


export async function identifyRecurrentCauses(input: IdentifyRecurrentCausesInput): Promise<IdentifyRecurrentCausesOutput> {
  return identifyRecurrentCausesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyRecurrentCausesPrompt',
  input: {schema: IdentifyRecurrentCausesInputSchema},
  output: {schema: IdentifyRecurrentCausesOutputSchema},
  prompt: `You are an expert issue analyst. Analyze the following issue descriptions and identify recurrent causes.\n\nIssue Descriptions:\n{{#each issueDescriptions}}- {{{this}}}\n{{/each}}\n\nRecurrent Causes:`,
});

const identifyRecurrentCausesFlow = ai.defineFlow(
  {
    name: 'identifyRecurrentCausesFlow',
    inputSchema: IdentifyRecurrentCausesInputSchema,
    outputSchema: IdentifyRecurrentCausesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
