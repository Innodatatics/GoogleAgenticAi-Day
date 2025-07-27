'use client';
import { useState } from 'react';
import type { Hotspot } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Cloud, TrafficCone, MapPin, Route, Lightbulb, Rss, Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AlternativeRouteDialog } from './AlternativeRouteDialog';


type DisruptionCardProps = {
  hotspot: Hotspot;
  isAdminView?: boolean;
};

const levelStyles: { [key: string]: string } = {
  'High': 'border-red-500/80 text-red-500 bg-red-500/10',
  'Medium': 'border-yellow-500/80 text-yellow-500 bg-yellow-500/10',
  'Low': 'border-green-500/80 text-green-500 bg-green-500/10',
};

const levelIcons: { [key: string]: React.ElementType } = {
    'High': TrafficCone,
    'Medium': Cloud,
    'Low': Zap,
};

const sourceIcons: { [key: string]: React.ElementType } = {
    'Social Media': Rss,
    'News': Newspaper,
    'Prediction': Lightbulb,
};

export function DisruptionCard({ hotspot, isAdminView = false }: DisruptionCardProps) {
  const cardStyle = levelStyles[hotspot.disruptionLevel] || levelStyles['Low'];
  const Icon = levelIcons[hotspot.disruptionLevel] || Zap;
  const SourceIcon = sourceIcons[hotspot.source] || Rss;
  const [isRouteDialogOpen, setIsRouteDialogOpen] = useState(false);

  return (
    <>
    <AlternativeRouteDialog 
      open={isRouteDialogOpen}
      onOpenChange={setIsRouteDialogOpen}
      disruption={{
        area: hotspot.area,
        prediction: hotspot.prediction
      }}
    />
    <Card className="flex flex-col justify-between transition-all duration-300 hover:border-primary/50 bg-card/50 hover:bg-card hover:-translate-y-1">
      <CardHeader>
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="font-bold text-base text-foreground">{hotspot.area}</span>
            </div>
           <Badge variant="outline" className={cn('border-2 text-xs font-bold', cardStyle)}>
                <Icon className="mr-1.5 h-3 w-3" />
                {hotspot.disruptionLevel} Disruption
           </Badge>
        </div>
        <CardTitle className="text-sm font-semibold pt-2 text-primary">
            {isAdminView ? 'Admin Recommendation' : 'Prediction & Recommendation' }
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground/90">{hotspot.prediction}</p>
          <p className="text-xs text-muted-foreground/70 mt-4 italic">{hotspot.summary}</p>
      </CardContent>
       <CardFooter className="flex-col items-start gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <SourceIcon className="h-4 w-4" />
                <span>Source: {hotspot.source}</span>
            </div>
             {!isAdminView && (
                <Button variant="secondary" size="sm" className="w-full mt-2" onClick={() => setIsRouteDialogOpen(true)}>
                    <Route className="mr-2 h-4 w-4" />
                    Find an Alternative Route
                </Button>
            )}
       </CardFooter>
    </Card>
    </>
  );
}
