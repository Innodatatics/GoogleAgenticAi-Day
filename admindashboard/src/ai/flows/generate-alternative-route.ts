/**
 * @fileOverview An AI agent that generates alternative driving routes to avoid specific disruptions.
 * 
 * - generateAlternativeRoute - A function that suggests a route based on origin, destination, and a known disruption.
 */
'use server';

import { ai } from '@/ai/genkit';
import type { GenerateAlternativeRouteInput, GenerateAlternativeRouteOutput } from '@/lib/types';
import { GenerateAlternativeRouteInputSchema, GenerateAlternativeRouteOutputSchema } from '@/lib/types';


const routePrompt = ai.definePrompt({
    name: 'generateAlternativeRoutePrompt',
    input: { schema: GenerateAlternativeRouteInputSchema },
    output: { schema: GenerateAlternativeRouteOutputSchema },
    prompt: `You are an expert traffic navigator for Bangalore. Your task is to provide an alternative route for a user to avoid a specific, known disruption.

    User's Origin: {{{origin}}}
    User's Destination: {{{destination}}}
    Disruption to Avoid: {{{disruption}}}

    Instructions:
    1.  Analyze the origin, destination, and the disruption.
    2.  Provide a clear, step-by-step driving route that bypasses the disrupted area.
    3.  Mention major roads and landmarks to make the route easy to follow.
    4.  Summarize why the suggested route is a better choice.
    5.  Do not just say "use a map app". Provide the actual turn-by-turn directions.
    
    Example Output:
    Route: "1. Head south on ORR towards Marathahalli. 2. Instead of taking the Sarjapur exit, continue on ORR for 2 more KMs. 3. Take the Bellandur exit and make a left. 4. Follow the service road and make a right onto Varthur Main Road to bypass the Sarjapur junction."
    Summary: "This route completely avoids the Sarjapur junction which has heavy concert traffic, using the Outer Ring Road to bypass the congestion."
    `,
});

export async function generateAlternativeRoute(input: GenerateAlternativeRouteInput): Promise<GenerateAlternativeRouteOutput> {
  const { output } = await routePrompt(input);
  if (!output) {
      throw new Error("AI failed to generate an alternative route.");
  }
  return output;
}
