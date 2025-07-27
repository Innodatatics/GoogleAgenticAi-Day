'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Route, LocateFixed, AlertTriangle, Sparkles } from 'lucide-react';
import { generateAlternativeRoute, type GenerateAlternativeRouteOutput } from '@/ai/flows/generate-alternative-route';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';

type AlternativeRouteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disruption: {
    area: string;
    prediction: string;
  };
};

export function AlternativeRouteDialog({ open, onOpenChange, disruption }: AlternativeRouteDialogProps) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [routeResult, setRouteResult] = useState<GenerateAlternativeRouteOutput | null>(null);
  const { toast } = useToast();

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({ variant: 'destructive', title: 'Geolocation not supported' });
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin(`${position.coords.latitude}, ${position.coords.longitude}`);
        setIsLocating(false);
        toast({ title: 'Location captured!' });
      },
      (error) => {
        setIsLocating(false);
        toast({ variant: 'destructive', title: 'Could not get location', description: error.message });
      }
    );
  };

  const handleFindRoute = async () => {
    if (!origin || !destination) {
      toast({ variant: 'destructive', title: 'Missing information', description: 'Please provide both origin and destination.' });
      return;
    }
    setIsLoading(true);
    setRouteResult(null);
    try {
      const result = await generateAlternativeRoute({
        origin,
        destination,
        disruption: `Area: ${disruption.area}, Disruption: ${disruption.prediction}`,
      });
      setRouteResult(result);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'AI Error', description: 'Failed to generate an alternative route.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Find an Alternative Route</DialogTitle>
          <DialogDescription>Avoid the disruption in {disruption.area}. Enter your start and end points.</DialogDescription>
        </DialogHeader>
        
        <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Disruption Details</AlertTitle>
            <AlertDescription className="text-xs">{disruption.prediction}</AlertDescription>
        </Alert>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="origin">Origin</Label>
            <div className="flex gap-2">
              <Input
                id="origin"
                placeholder="e.g., Koramangala or Lat, Long"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                disabled={isLoading}
              />
              <Button variant="outline" size="icon" onClick={handleGetLocation} disabled={isLocating || isLoading}>
                {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                <span className="sr-only">Get Current Location</span>
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              placeholder="e.g., Whitefield"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        {routeResult && (
            <Alert variant="default" className="border-primary bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary">Suggested Alternative Route</AlertTitle>
                <AlertDescription>
                    <p className="font-semibold mt-2 mb-1">{routeResult.summary}</p>
                    <p className="text-xs">{routeResult.route}</p>
                </AlertDescription>
            </Alert>
        )}

        <DialogFooter>
          <Button onClick={handleFindRoute} disabled={isLoading || !origin || !destination} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Route className="mr-2 h-4 w-4" />}
            {isLoading ? 'Generating Route...' : 'Find Route'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
