'use server';

/**
 * @fileOverview An AI agent that assigns issues to the correct department based on their content.
 *
 * - assignDepartment - A function that assigns an issue to a department.
 */

import {ai} from '@/ai/genkit';
import {
  AssignDepartmentInputSchema,
  AssignDepartmentOutputSchema,
  type AssignDepartmentInput,
  type AssignDepartmentOutput,
} from '@/lib/types';


export async function assignDepartment(input: AssignDepartmentInput): Promise<AssignDepartmentOutput> {
  return assignDepartmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'assignDepartmentPrompt',
  input: {schema: AssignDepartmentInputSchema},
  output: {schema: AssignDepartmentOutputSchema},
  prompt: `You are an expert dispatcher responsible for assigning public service requests to the correct department.

  The available departments are:
  - **Police**: For issues related to crime, public order, and law enforcement (e.g., theft, vandalism, assault, suspicious activity).
  - **Emergency Services**: For urgent, life-threatening situations that require immediate response (e.g., fire, medical emergencies, major accidents, hazardous material spills, natural disasters).
  - **Municipality**: For non-emergency civic issues related to public infrastructure and services (e.g., potholes, broken streetlights, water leaks, park maintenance, garbage collection).

  Analyze the issue type and description to determine the most appropriate department. A traffic issue could be for police (accident) or municipality (broken traffic light). Use the description to decide.

  Issue Type: {{{issueType}}}
  Description: {{{description}}}

  Assign the issue to the most relevant department and provide a clear reason for your choice.`,
});

const assignDepartmentFlow = ai.defineFlow(
  {
    name: 'assignDepartmentFlow',
    inputSchema: AssignDepartmentInputSchema,
    outputSchema: AssignDepartmentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
