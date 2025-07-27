
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import SidebarContent from '@/components/dashboard/SidebarContent';
import { Rss, Loader2, Zap, Cloud, TrafficCone, Megaphone } from 'lucide-react';
import SocialMediaInsights from '@/components/dashboard/SocialMediaInsights';
import type { SocialInsight, MapInsights } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { generateMapInsights } from '@/ai/flows/generate-map-insights';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function PredictiveAnalysisPage() {
    const [mapInsights, setMapInsights] = useState<MapInsights | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const autoplayPlugin = useRef(
      Autoplay({ delay: 5000, stopOnInteraction: true })
    );

    const fetchAndAnalyze = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/get_social_insights`);
            if (!res.ok) throw new Error(`Failed to fetch social media insights: ${res.statusText}`);
            const rawInsights: SocialInsight[] = await res.json();

            if (rawInsights.length === 0) {
                setMapInsights({ overallSummary: "No significant social media or news activity detected in the last 7 days.", hotspots: [] });
                return;
            }

            const analysisResult = await generateMapInsights({ insights: rawInsights });
            setMapInsights(analysisResult);

        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(errorMessage);
            toast({
                variant: 'destructive',
                title: 'Error Analyzing Data',
                description: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchAndAnalyze();
    }, [fetchAndAnalyze]);
    
    const AnnouncementCarousel = ({ insights }: { insights: MapInsights }) => {
        const announcements = [
            { id: 'summary', title: 'City-Wide Summary', content: insights.overallSummary, Icon: Megaphone },
            ...insights.hotspots.map((hotspot, index) => {
                 const Icon = hotspot.disruptionLevel === 'High' ? TrafficCone : hotspot.disruptionLevel === 'Medium' ? Cloud : Zap;
                 return {
                    id: `hotspot-${index}`,
                    title: `${hotspot.disruptionLevel} Alert: ${hotspot.area}`,
                    content: hotspot.prediction,
                    Icon
                 }
            })
        ];

        return (
            <Carousel
                plugins={[autoplayPlugin.current]}
                onMouseEnter={autoplayPlugin.current.stop}
                onMouseLeave={autoplayPlugin.current.reset}
                className="w-full"
            >
                <CarouselContent>
                    {announcements.map((item, index) => (
                        <CarouselItem key={`${item.id}-${index}`}>
                            <div className="p-1">
                                <Card className="bg-card/80 border-primary/20">
                                    <CardContent className="flex items-center gap-4 p-4">
                                       <div className="bg-primary/10 p-3 rounded-full">
                                        <item.Icon className="h-6 w-6 text-primary" />
                                       </div>
                                       <div className="flex flex-col">
                                            <p className="font-bold text-sm text-primary">{item.title}</p>
                                            <p className="text-sm text-muted-foreground">{item.content}</p>
                                       </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex" />
                <CarouselNext className="hidden sm:flex" />
            </Carousel>
        )
    }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent />
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col gap-8 p-4 md:p-6 lg:p-8">
          <header className="flex items-center justify-between rounded-lg bg-card p-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="md:hidden" />
              <Rss className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Predictive Analysis
              </h1>
            </div>
          </header>
          <main className="flex flex-col gap-6">
             {loading ? (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-4 text-muted-foreground">Analyzing real-time social and news data...</p>
                </div>
            ) : error ? (
                 <Alert variant="destructive">
                    <TrafficCone className="h-4 w-4" />
                    <AlertTitle>Analysis Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : mapInsights ? (
              <>
                <AnnouncementCarousel insights={mapInsights} />
                <SocialMediaInsights insights={mapInsights} />
              </>
            ) : null}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
