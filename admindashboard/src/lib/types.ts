import {z} from 'zod';

export type IssueStatus = 'Pending' | 'In Progress' | 'On Hold' | 'Completed';
export type IssueCategory = 'Civic' | 'Crime' | 'Traffic' | 'Event' | 'Other';

export interface Issue {
  id: string;
  issue_type: IssueCategory;
  location: string | number[];
  description: string;
  name: string;
  creator_email: string;
  timestamp: string;
  status: IssueStatus;
  priority?: string;
  no_of_reports?: number;
  assigned_department?: Department;
  completed_timestamp?: string;
}

export type Department = 'Police' | 'Emergency Services' | 'Municipality';


export type UserContribution = {
  email: string;
  name?: string;
  count: number;
};

// Represents a single raw insight from Reddit or News
export interface SocialInsight {
  id: string;
  source: 'Reddit' | 'News';
  title: string;
  url: string;
  area: string;
  category: string;
  sub_category: string;
  reason: string;
  timestamp: string;
}

export type Hotspot = {
    area: string;
    disruptionLevel: 'Low' | 'Medium' | 'High';
    prediction: string;
    summary: string;
    source: 'Social Media' | 'News' | 'Prediction';
    lat: number;
    lon: number;
}

export type MapInsights = {
    overallSummary: string;
    hotspots: Hotspot[];
}

// Schemas for assign-department flow
export const AssignDepartmentInputSchema = z.object({
  issueType: z.string().describe('The category of the issue (e.g., "Crime", "Traffic", "Civic").'),
  description: z.string().describe('The detailed description of the issue.'),
});
export type AssignDepartmentInput = z.infer<typeof AssignDepartmentInputSchema>;

export const DepartmentEnum = z.enum(['Police', 'Emergency Services', 'Municipality']);

export const AssignDepartmentOutputSchema = z.object({
  department: DepartmentEnum.describe('The department the issue should be assigned to.'),
  reason: z.string().describe('A brief justification for the assignment.'),
});
export type AssignDepartmentOutput = z.infer<typeof AssignDepartmentOutputSchema>;


// Schemas for detect-high-priority-issues flow
export const DetectHighPriorityIssuesInputSchema = z.object({
  issueDescription: z.string().describe('The description of the issue.'),
});
export type DetectHighPriorityIssuesInput = z.infer<typeof DetectHighPriorityIssuesInputSchema>;

export const DetectHighPriorityIssuesOutputSchema = z.object({
  isHighPriority: z.boolean().describe('Whether the issue is high priority.'),
  reason: z.string().describe('The reason why the issue is considered high priority.'),
});
export type DetectHighPriorityIssuesOutput = z.infer<typeof DetectHighPriorityIssuesOutputSchema>;

// Schemas for identify-recurrent-causes flow
export const IdentifyRecurrentCausesInputSchema = z.object({
  issueDescriptions: z
    .array(z.string())
    .describe('An array of issue descriptions to analyze.'),
});
export type IdentifyRecurrentCausesInput = z.infer<typeof IdentifyRecurrentCausesInputSchema>;

export const IdentifyRecurrentCausesOutputSchema = z.object({
  recurrentCauses: z
    .array(z.string())
    .describe('An array of recurrent causes identified from the issue descriptions.'),
});
export type IdentifyRecurrentCausesOutput = z.infer<typeof IdentifyRecurrentCausesOutputSchema>;

// Schemas for generate-map-link flow
export const GenerateMapLinkInputSchema = z.object({
  location: z.string().describe('The location description from the issue, like an address or intersection.'),
});
export type GenerateMapLinkInput = z.infer<typeof GenerateMapLinkInputSchema>;

export const GenerateMapLinkOutputSchema = z.object({
  mapUrl: z.string().describe('A valid Google Maps URL for the given location.'),
});
export type GenerateMapLinkOutput = z.infer<typeof GenerateMapLinkOutputSchema>;


// Schemas for generate-map-insights flow
export const GenerateMapInsightsInputSchema = z.object({
  insights: z.array(z.object({
    source: z.string(),
    area: z.string(),
    category: z.string(),
    sub_category: z.string(),
    title: z.string(),
    timestamp: z.string(),
  })),
});
export type GenerateMapInsightsInput = z.infer<typeof GenerateMapInsightsInputSchema>;

export const GenerateMapInsightsOutputSchema = z.object({
    overallSummary: z.string().describe("A single, continuous sentence overview of the current situation in Bangalore, suitable for a scrolling news ticker."),
    hotspots: z.array(z.object({
        area: z.string().describe("The name of the hotspot area."),
        disruptionLevel: z.enum(['Low', 'Medium', 'High']).describe("The calculated disruption level for this area."),
        prediction: z.string().describe("Actionable, forward-looking prediction for this hotspot. This is for city administrators, not drivers."),
        summary: z.string().describe("A brief summary of the issues reported in the area."),
        source: z.enum(['Social Media', 'News', 'Prediction']).describe("The original source of the information. Use 'Social Media' for Reddit, 'News' for news articles, and 'Prediction' for insights you generate based on your knowledge base (like weather or festivals).")
    })),
});
export type GenerateMapInsightsOutput = z.infer<typeof GenerateMapInsightsOutputSchema>;

// Schemas for generate-map-image flow
export const GenerateMapImageInputSchema = z.object({
  theme: z.string().describe('A description of the map style to generate, based on the city\'s mood.'),
});
export type GenerateMapImageInput = z.infer<typeof GenerateMapImageInputSchema>;

export const GenerateMapImageOutputSchema = z.object({
  imageUrl: z.string().describe('The base64-encoded data URI of the generated map image.'),
});
export type GenerateMapImageOutput = z.infer<typeof GenerateMapImageOutputSchema>;

// Schemas for generate-alternative-route flow
export const GenerateAlternativeRouteInputSchema = z.object({
    origin: z.string().describe("The user's starting point (e.g., address or 'current location')."),
    destination: z.string().describe("The user's desired destination address."),
    disruption: z.string().describe("A description of the disruption to avoid (e.g., 'Heavy traffic on Sarjapur Road due to a concert')."),
});
export type GenerateAlternativeRouteInput = z.infer<typeof GenerateAlternativeRouteInputSchema>;

export const GenerateAlternativeRouteOutputSchema = z.object({
    route: z.string().describe("A step-by-step description of the suggested alternative route."),
    summary: z.string().describe("A brief summary of why this route is better (e.g., 'This route avoids the concert traffic on Sarjapur Road and should be faster.')."),
});
export type GenerateAlternativeRouteOutput = z.infer<typeof GenerateAlternativeRouteOutputSchema>;
