'use server';
/**
 * @fileOverview An AI agent that detects high-priority issues based on keywords and urgency indicators in the issue descriptions.
 *
 * - detectHighPriorityIssues - A function that detects high-priority issues.
 */

import {ai} from '@/ai/genkit';
import {
  DetectHighPriorityIssuesInputSchema,
  DetectHighPriorityIssuesOutputSchema,
  type DetectHighPriorityIssuesInput,
  type DetectHighPriorityIssuesOutput,
} from '@/lib/types';


export async function detectHighPriorityIssues(input: DetectHighPriorityIssuesInput): Promise<DetectHighPriorityIssuesOutput> {
  return detectHighPriorityIssuesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectHighPriorityIssuesPrompt',
  input: {schema: DetectHighPriorityIssuesInputSchema},
  output: {schema: DetectHighPriorityIssuesOutputSchema},
  prompt: `You are an expert system for identifying high-priority issues based on their descriptions.

  Analyze the following issue description and determine if it is a high-priority issue. High-priority issues often contain keywords related to:
    - Emergency situations (e.g., "urgent", "critical", "emergency", "immediately")
    - Safety hazards (e.g., "danger", "unsafe", "hazardous", "risk")
    - Security breaches (e.g., "breach", "attack", "vulnerability", "compromised")
    - System failures (e.g., "failure", "outage", "malfunction", "unavailable")
    - Legal compliance (e.g. "illegal", "non-compliant")

  Provide a clear reason for your determination.

  Issue Description: {{{issueDescription}}}
`,
});

const detectHighPriorityIssuesFlow = ai.defineFlow(
  {
    name: 'detectHighPriorityIssuesFlow',
    inputSchema: DetectHighPriorityIssuesInputSchema,
    outputSchema: DetectHighPriorityIssuesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
