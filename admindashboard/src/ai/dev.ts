'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/identify-recurrent-causes.ts';
import '@/ai/flows/detect-high-priority-issues.ts';
import '@/ai/flows/assign-department.ts';
import '@/ai/flows/generate-map-link.ts';
import '@/ai/flows/generate-map-insights.ts';
import '@/ai/flows/generate-map-image.ts';
import '@/ai/flows/generate-alternative-route.ts';