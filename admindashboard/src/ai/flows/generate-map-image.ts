'use server';

/**
 * @fileOverview Generates a styled map image using an AI model.
 * 
 * - generateMapImage - Creates a map image based on a descriptive theme.
 */

import { ai } from '@/ai/genkit';
import { GenerateMapImageInputSchema, GenerateMapImageOutputSchema } from '@/lib/types';
import type { GenerateMapImageInput, GenerateMapImageOutput } from '@/lib/types';

const imageGenPrompt = ai.definePrompt({
    name: 'generateMapImagePrompt',
    input: { schema: GenerateMapImageInputSchema },
    // IMPORTANT: Use the specified image generation model
    model: 'googleai/gemini-2.0-flash-preview-image-generation', 
    prompt: `Generate an image that looks like a satellite or digital map of Bangalore, India. 
    The style of the map should visually represent the following theme: "{{theme}}".

    For example:
    - If the theme is "calm and clear", the map should look bright, with clear roads and minimal visual noise.
    - If the theme is "high alert with major disruptions", the map could have glowing red lines on major roads to signify traffic, maybe with a darker, more serious color palette.
    - If the theme is "several isolated incidents", it could be a standard map with a few noticeable, but not overwhelming, visual alerts.

    The map should be a top-down view, focusing on the general city layout. Do not include any text, labels, or icons on the map itself. The image should be 1024x768.
    `,
    config: {
        responseModalities: ['TEXT', 'IMAGE'], 
    },
});

export async function generateMapImage(input: GenerateMapImageInput): Promise<GenerateMapImageOutput> {
    const { media } = await imageGenPrompt(input);
    if (!media || !media.url) {
        throw new Error("AI failed to generate a map image.");
    }

    return { imageUrl: media.url };
}
