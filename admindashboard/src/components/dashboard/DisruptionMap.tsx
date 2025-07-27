'use client';

import React, { useEffect, useState, useRef } from 'react';
import type { Hotspot } from '@/lib/types';
import { Loader } from '@googlemaps/js-api-loader';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, Cloud, TrafficCone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type DisruptionMapProps = {
  insights: { hotspots: Hotspot[] };
  mapImageUrl?: string;
};

const levelConfig: { [key: string]: { iconColor: string, badge: string, Icon: React.ElementType, label: string } } = {
  High: { iconColor: '#EF4444', badge: 'border-red-500/80 text-red-500 bg-red-500/10', Icon: TrafficCone, label: 'High Disruption' },
  Medium: { iconColor: '#F59E0B', badge: 'border-yellow-500/80 text-yellow-500 bg-yellow-500/10', Icon: Cloud, label: 'Medium Disruption' },
  Low: { iconColor: '#10B981', badge: 'border-green-500/80 text-green-500 bg-green-500/10', Icon: Zap, label: 'Low Disruption' },
};

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const MapLegend = () => (
    <div className="absolute top-2 right-2 bg-background/80 p-3 rounded-lg shadow-lg border border-border backdrop-blur-sm">
        <h4 className="font-bold text-sm mb-2 text-foreground">Legend</h4>
        <div className="space-y-2">
            {Object.values(levelConfig).map(({ Icon, label, badge }) => (
                <div key={label} className="flex items-center gap-2">
                    <div className={cn('flex items-center justify-center h-5 w-5 rounded-full', badge)}>
                        <Icon className="h-3 w-3" />
                    </div>
                    <span className="text-xs text-muted-foreground">{label}</span>
                </div>
            ))}
        </div>
    </div>
);


const DisruptionMap = ({ insights, mapImageUrl }: DisruptionMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  useEffect(() => {
    if (!API_KEY) {
      console.error("Google Maps API key is missing.");
      return;
    }

    const loader = new Loader({
      apiKey: API_KEY,
      version: 'weekly',
      libraries: ['maps'],
    });

    loader.load().then(() => {
      setIsMapLoaded(true);
    }).catch(e => {
      console.error("Error loading Google Maps script:", e);
    });
  }, []);

  useEffect(() => {
    if (isMapLoaded && mapRef.current) {
      class ImageMapType {
        tileSize: google.maps.Size;
        alt: string;
        name: string;
        maxZoom: number;
        minZoom: number;
        getTile: (tileCoord: google.maps.Point, zoom: number, ownerDocument: Document) => HTMLElement;

        constructor(tileSize: google.maps.Size, imageUrl: string) {
          this.tileSize = tileSize;
          this.alt = "Mood Map";
          this.name = "MoodMap";
          this.maxZoom = 15;
          this.minZoom = 10;
          this.getTile = (tileCoord, zoom, ownerDocument) => {
            const div = ownerDocument.createElement('div');
            if (zoom === 11) { // Only show the image at a specific zoom level
                div.innerHTML = `<img src="${imageUrl}" style="width:${this.tileSize.width}px;height:${this.tileSize.height}px;"/>`;
            }
            div.style.width = this.tileSize.width + 'px';
            div.style.height = this.tileSize.height + 'px';
            return div;
          };
        }
      }

      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 12.9716, lng: 77.5946 }, // Bangalore center
        zoom: 11,
        mapId: 'BANGALORE_DISRUPTION_MAP',
        disableDefaultUI: true,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
      });

      if (mapImageUrl) {
        map.overlayMapTypes.insertAt(
            0,
            new ImageMapType(new google.maps.Size(2560, 2560), mapImageUrl)
        );
      }
      
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
      infoWindowRef.current = new google.maps.InfoWindow();
      
      insights.hotspots.forEach((hotspot) => {
        const config = levelConfig[hotspot.disruptionLevel] || levelConfig.Low;

        const markerIcon = {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: config.iconColor,
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
          scale: 10,
        };

        const marker = new google.maps.Marker({
          position: { lat: hotspot.lat, lng: hotspot.lon },
          map: map,
          icon: markerIcon,
          title: hotspot.area,
        });
        
        const badgeStyle = levelConfig[hotspot.disruptionLevel]?.badge || '';
        const contentString = `
          <div class="p-1 font-sans max-w-sm">
            <div class="flex items-center gap-2 mb-2">
              <span class="font-bold text-base text-gray-800">${hotspot.area}</span>
              <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${badgeStyle}">
                ${hotspot.disruptionLevel}
              </span>
            </div>
            <p class="text-sm font-semibold text-blue-600 mb-1">Prediction & Solution</p>
            <p class="text-sm text-gray-700 mb-3">${hotspot.prediction}</p>
            <p class="text-xs text-gray-500 italic border-t pt-2 mt-2">Basis: ${hotspot.summary}</p>
          </div>`;

        marker.addListener('mouseover', () => {
          infoWindowRef.current?.setContent(contentString);
          infoWindowRef.current?.open(map, marker);
        });

        marker.addListener('mouseout', () => {
          infoWindowRef.current?.close();
        });
      });
    }
  }, [isMapLoaded, insights, mapImageUrl]);

  return (
    <Card className="w-full h-[600px] overflow-hidden rounded-lg shadow-lg relative">
      {!API_KEY ? (
          <div className="flex items-center justify-center h-full text-center text-destructive p-4">
              Google Maps API Key is not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file.
          </div>
      ) : !isMapLoaded ? (
        <Skeleton className="w-full h-full" />
      ) : null}
      <div ref={mapRef} className="w-full h-full" />
      {isMapLoaded && <MapLegend />}
    </Card>
  );
};

export default DisruptionMap;