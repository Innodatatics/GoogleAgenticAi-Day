'use server';

/**
 * @fileOverview An AI agent that analyzes social media and news data to generate a predictive disruption map.
 * 
 * - generateMapInsights - Analyzes a list of social/news posts and returns a structured object with an overall summary and specific hotspot insights.
 */

import { ai } from '@/ai/genkit';
import type { GenerateMapInsightsInput, GenerateMapInsightsOutput } from '@/lib/types';
import { GenerateMapInsightsInputSchema, GenerateMapInsightsOutputSchema } from '@/lib/types';

// A predefined map of Bangalore areas to their geographic coordinates.
// In a production app, this could come from a database or a Geocoding API.
const areaCoordinates: Record<string, { lat: number; lon: number }> = {
    "Koramangala": { lat: 12.9352, lon: 77.6245 },
    "Indiranagar": { lat: 12.9719, lon: 77.6412 },
    "Whitefield": { lat: 12.9698, lon: 77.7499 },
    "Jayanagar": { lat: 12.9252, lon: 77.5829 },
    "Malleshwaram": { lat: 13.0039, lon: 77.5724 },
    "Electronic City": { lat: 12.8452, lon: 77.6602 },
    "Marathahalli": { lat: 12.9569, lon: 77.7011 },
    "HSR Layout": { lat: 12.9121, lon: 77.6446 },
    "Bellandur": { lat: 12.9293, lon: 77.6784 },
    "Banashankari": { lat: 12.9250, lon: 77.5466 },
    "MG Road": { lat: 12.974, lon: 77.6094 },
    "Yelahanka": { lat: 13.1007, lon: 77.5963 },
    "JP Nagar": { lat: 12.9063, lon: 77.5858 },
    "Sarjapur": { lat: 12.9122, lon: 77.7482 },
    "Hebbal": { lat: 13.0382, lon: 77.5919 },
    "Rajajinagar": { lat: 12.9932, lon: 77.5528 },
    "BTM Layout": { lat: 12.9152, lon: 77.6103 },
    "Vijaynagar": { lat: 12.9718, lon: 77.5317 },
    "Domlur": { lat: 12.962, lon: 77.638 },
    "Cunningham Road": { lat: 12.9899, lon: 77.5959 },
    "Bengaluru": { lat: 12.9716, lon: 77.5946 }, // General city fallback
    "Unknown": { lat: 12.9716, lon: 77.5946 } // Default for unknown areas
};

const insightsPrompt = ai.definePrompt({
    name: 'generateMapInsightsPrompt',
    input: { schema: GenerateMapInsightsInputSchema },
    output: { schema: GenerateMapInsightsOutputSchema },
    prompt: `You are a senior analyst for the city of Bangalore, responsible for creating a holistic, predictive summary of civic life. You have deep knowledge of local festivals, weather patterns, and weekly traffic dynamics.

    Your task is to synthesize your knowledge with a list of raw insights (from Reddit/News) to generate a comprehensive city-wide analysis.

    **VERY IMPORTANT**: Your final output MUST be a valid JSON object that strictly adheres to the provided output schema. You MUST include the 'overallSummary' field. Do not omit it. If the input data is messy, repetitive, or nonsensical, IGNORE THE NOISE and extract only the factual information to construct your response. Do not get sidetracked.

    **Your Knowledge Base:**
    -   **Weather**: Assume the current forecast is for "scattered thunderstorms over the next 48 hours, with potential for heavy downpours in the evenings."
    -   **Upcoming Festivals**: You know that a major local festival is approaching, which typically causes large processions and traffic congestion in areas like Malleshwaram and Basavanagudi.
    -   **Weekend Analysis**: It is currently Friday. Provide a predictive analysis for the upcoming weekend, identifying which routes are likely to be heavily congested (e.g., routes to malls, parks, and major transit hubs).

    **Your Instructions:**
    1.  **Generate a high-level, city-wide summary.** This should be a continuous sentence suitable for a news ticker. It must incorporate the weather forecast and mention the general "alert level" (e.g., "calm," "isolated incidents," "widespread disruptions").
    2.  **Identify and detail hotspots.** A hotspot is an area with recurring/significant issues *or* an area you predict will have issues based on your knowledge (festivals, weekend traffic).
    3.  For each hotspot, provide:
        -   **area**: The name of the area.
        -   **disruptionLevel**: "Low", "Medium", or "High".
        -   **prediction**: A forward-looking, actionable recommendation **for city administrators**. This is the most important part. Do NOT suggest alternative routes for drivers. Instead, suggest actions for the city to take. For example: "With evening thunderstorms likely, the already-reported water logging in Koramangala will worsen. Recommend dispatching municipal crew to clear drains preemptively." or "Major weekend congestion and crowding is expected near Malleshwaram due to festival preparations. Recommend increasing police presence to manage traffic and crowds."
        -   **summary**: A brief summary of the *reported issues* (from raw data) in that area. If the hotspot is purely predictive (e.g., weekend traffic), this can be brief.
        -   **source**: The origin of the insight. Use 'Social Media' for Reddit, 'News' for news articles, or 'Prediction' if you are generating this hotspot based on your internal knowledge base (like weather or festivals).
    4.  Create predictive hotspots for weather, festivals, and weekend traffic even if there is no raw data for them. These should have a source of 'Prediction'.

    Here is the list of raw insights:
    {{#each insights}}
    - Source: {{source}}, Area: {{area}}, Category: {{category}}, Sub-Category: {{sub_category}}, Title: {{title}}, Timestamp: {{timestamp}}
    {{/each}}

    Provide a concise, structured analysis. Do not just repeat the input. Focus on actionable, synthesized intelligence for city management.`,
});

export async function generateMapInsights(input: GenerateMapInsightsInput): Promise<GenerateMapInsightsOutput> {
    const { output } = await insightsPrompt(input);
    if (!output) {
        throw new Error("AI failed to generate map insights.");
    }

    // Augment the AI's output with coordinates
    const hotspotsWithCoords = output.hotspots.map(hotspot => {
        const coords = areaCoordinates[hotspot.area] || areaCoordinates["Unknown"];
        return {
            ...hotspot,
            lat: coords.lat,
            lon: coords.lon
        };
    }).filter(hotspot => hotspot.lat && hotspot.lon); // Filter out any that might have failed to get coords

    return {
        overallSummary: output.overallSummary,
        hotspots: hotspotsWithCoords,
    };
}
