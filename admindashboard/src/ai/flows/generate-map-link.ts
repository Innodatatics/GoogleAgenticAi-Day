'use server';

/**
 * @fileOverview An AI agent that generates a Google Maps link from a location description.
 *
 * - generateMapLink - A function that takes a location and returns a map URL.
 */

import {ai} from '@/ai/genkit';
import {
    GenerateMapLinkInputSchema,
    GenerateMapLinkOutputSchema,
    type GenerateMapLinkInput,
    type GenerateMapLinkOutput,
} from '@/lib/types';


export async function generateMapLink(input: GenerateMapLinkInput): Promise<GenerateMapLinkOutput> {
  return generateMapLinkFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMapLinkPrompt',
  input: {schema: GenerateMapLinkInputSchema},
  output: {schema: GenerateMapLinkOutputSchema},
  prompt: `You are a helpful assistant that converts a location description into a valid Google Maps URL.

  Given the following location, create a Google Maps "search" URL for it. The URL should be properly encoded.
  For example, if the location is "Main St & 1st Ave", the URL should be "https://www.google.com/maps/search/?api=1&query=Main+St+%26+1st+Ave".

  Location: {{{location}}}
`,
});

const generateMapLinkFlow = ai.defineFlow(
  {
    name: 'generateMapLinkFlow',
    inputSchema: GenerateMapLinkInputSchema,
    outputSchema: GenerateMapLinkOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    
    // Validate the output from the LLM to ensure it's a valid URL
    const validationResult = GenerateMapLinkOutputSchema.safeParse(output);
    
    if (!validationResult.success) {
      // The LLM's output did not match the expected schema (e.g., wasn't a valid URL)
      console.error("AI returned an invalid map link format:", validationResult.error);
      throw new Error("The AI failed to generate a valid map link. Please try again.");
    }

    return validationResult.data;
  }
);
