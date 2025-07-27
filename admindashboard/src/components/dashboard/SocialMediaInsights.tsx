'use client';

import type { MapInsights } from '@/lib/types';
import DisruptionMap from './DisruptionMap';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { DisruptionCard } from './DisruptionCard';

type SocialMediaInsightsProps = {
  insights: MapInsights;
  isAdminView?: boolean;
};

export default function SocialMediaInsights({ insights, isAdminView = false }: SocialMediaInsightsProps) {

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
       <div className="lg:col-span-2">
         <DisruptionMap insights={insights} />
       </div>
       <div className="lg:col-span-1 flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-2">
        {insights.hotspots.length > 0 ? (
          insights.hotspots.map((hotspot, index) => (
            <DisruptionCard key={`${hotspot.area}-${index}`} hotspot={hotspot} isAdminView={isAdminView} />
          ))
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>All Clear!</AlertTitle>
            <AlertDescription>
              No significant hotspots were identified based on the latest data. The city is currently calm.
            </AlertDescription>
          </Alert>
        )}
       </div>
    </div>
  );
}
