
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Video, Camera, Check, MapPin, LocateFixed, ArrowLeft } from 'lucide-react';
import { Loader } from '@googlemaps/js-api-loader';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { NammaDrishtiLogo } from '@/components/icons';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  phone: z.string().min(10, 'Phone number is required.'),
  issue_type: z.enum(['Traffic', 'Civic', 'Crime', 'Event', 'Other']),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  location: z.string().min(5, 'Location is required.'),
  duration: z.string().nonempty('Duration is required'),
  traffic_flow: z.enum(['Yes', 'No']),
  causing_harm: z.enum(['Yes', 'No']),
  proof: z.instanceof(File).optional(),
});

export default function CreateIssuePage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [ticketId, setTicketId] = useState('');

  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerInstance = useRef<google.maps.Marker | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      description: '',
      location: '',
    },
  });

  const initMap = useCallback((lat: number, lng: number) => {
    if (mapInstance.current) {
        mapInstance.current.setCenter({ lat, lng });
        if(markerInstance.current) markerInstance.current.setPosition({ lat, lng });
        return;
    }

    const loader = new Loader({
      apiKey: API_KEY!,
      version: 'weekly',
    });

    loader.load().then(() => {
        if (!mapRef.current) return;
        const map = new google.maps.Map(mapRef.current, {
            center: { lat, lng },
            zoom: 15,
            mapId: 'CREATE_ISSUE_MAP',
        });
        mapInstance.current = map;

        const marker = new google.maps.Marker({
            position: { lat, lng },
            map,
            draggable: true,
        });
        markerInstance.current = marker;

        marker.addListener('dragend', () => {
            const pos = marker.getPosition();
            if (pos) {
                form.setValue('location', `${pos.lat()}, ${pos.lng()}`);
                setIsMapDialogOpen(false);
            }
        });
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
                marker.setPosition(e.latLng);
                form.setValue('location', `${e.latLng.lat()}, ${e.latLng.lng()}`);
                setIsMapDialogOpen(false);
            }
        });
    }).catch(e => console.error("Error loading maps", e));
  }, [form]);

  const handleGetCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        form.setValue('location', `${latitude}, ${longitude}`);
        initMap(latitude, longitude);
      },
      (err) => toast({ variant: 'destructive', title: 'Geolocation Error', description: err.message })
    );
  };
  
  const handleOpenCamera = async () => {
    try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(s);
        setIsCameraOpen(true);
    } catch (err) {
        toast({ variant: 'destructive', title: 'Camera Error', description: 'Could not access camera.' });
    }
  };

  useEffect(() => {
      if (isCameraOpen && videoRef.current && stream) {
          videoRef.current.srcObject = stream;
      }
  }, [isCameraOpen, stream]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);
      canvasRef.current.toBlob((blob) => {
        if(blob) {
            const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
            form.setValue('proof', file);
            toast({ title: 'Image Captured!' });
        }
      }, 'image/jpeg');

      stream?.getTracks().forEach(track => track.stop());
      setIsCameraOpen(false);
      setStream(null);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    // This is where you would connect to your flask backend.
    // For now we will simulate a successful submission.
    console.log(values);
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate API call
    const randomId = `IS-${Math.floor(1000 + Math.random() * 9000)}`;
    setTicketId(randomId);
    setIsSuccess(true);
    setIsSubmitting(false);
    form.reset();
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="flex flex-col items-center justify-center p-4 md:p-6 lg:p-8">
        <header className="w-full max-w-4xl mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <NammaDrishtiLogo className="w-10 h-10" />
              <h2 className="text-xl font-bold tracking-tight text-primary">NammaDrishti Ai</h2>
            </div>
             <Button variant="outline" asChild>
                <Link href="/user/dashboard">
                    <ArrowLeft />
                    Back to Dashboard
                </Link>
             </Button>
          </div>
        </header>

        <main className="w-full max-w-4xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                    <PlusCircle className="h-8 w-8 text-primary" />
                    Create a New Issue Report
                </CardTitle>
                <CardDescription>
                    Please provide detailed information about the issue you've encountered. Your report will help us address the problem quickly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField name="name" control={form.control} render={({ field }) => (<FormItem><FormLabel>Name *</FormLabel><FormControl><Input placeholder="Your full name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField name="email" control={form.control} render={({ field }) => (<FormItem><FormLabel>Email *</FormLabel><FormControl><Input placeholder="Your email address" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField name="phone" control={form.control} render={({ field }) => (<FormItem><FormLabel>Phone *</FormLabel><FormControl><Input placeholder="Your phone number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField name="issue_type" control={form.control} render={({ field }) => (<FormItem><FormLabel>Issue Type *</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select an issue type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Traffic">Traffic</SelectItem><SelectItem value="Civic">Civic</SelectItem><SelectItem value="Crime">Crime</SelectItem><SelectItem value="Event">Event</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                    </div>
                    
                    <FormField name="description" control={form.control} render={({ field }) => (<FormItem><FormLabel>Description *</FormLabel><FormControl><Textarea placeholder="Describe the issue in detail..." rows={5} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    
                    <FormField name="location" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location *</FormLabel>
                        <FormControl>
                            <div className="flex gap-2">
                                <Input placeholder="Address or Lat, Lon" {...field} />
                                <Button type="button" variant="outline" onClick={() => setIsMapDialogOpen(true)}><MapPin className="mr-2" /> Select on Map</Button>
                            </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField name="duration" control={form.control} render={({ field }) => (<FormItem><FormLabel>Duration *</FormLabel><Select onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Less than 2 hrs">Less than 2 hrs</SelectItem><SelectItem value="Less than 5 hrs">Less than 5 hrs</SelectItem><SelectItem value="Less than 12 hrs">Less than 12 hrs</SelectItem><SelectItem value="Less than 24 hrs">Less than 24 hrs</SelectItem><SelectItem value="1-3 days">1-3 days</SelectItem><SelectItem value="3-7 days">3-7 days</SelectItem><SelectItem value="More than 7 days">More than 7 days</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField name="traffic_flow" control={form.control} render={({ field }) => (<FormItem><FormLabel>Affects Traffic? *</FormLabel><Select onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Select option" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField name="causing_harm" control={form.control} render={({ field }) => (<FormItem><FormLabel>Causing Harm? *</FormLabel><Select onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Select option" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                    </div>

                    <FormField name="proof" control={form.control} render={({ field: { onChange, value, ...rest } }) => (
                        <FormItem>
                            <FormLabel>Upload Proof</FormLabel>
                            <FormControl>
                                <div className="flex flex-col gap-3">
                                    <Input type="file" accept="image/*" onChange={(e) => onChange(e.target.files?.[0])} />
                                    <Button type="button" variant="secondary" onClick={handleOpenCamera}><Camera className="mr-2" /> Capture from Camera</Button>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                      {isSubmitting ? <><Loader2 className="animate-spin mr-2" /> Submitting...</> : 'Submit Ticket'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
        </main>
      </div>

      <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Select Location</DialogTitle>
            <DialogDescription>Click on the map or drag the pin to set the issue location. You can also use the buttons below.</DialogDescription>
          </DialogHeader>
          <div className="h-[500px] w-full" ref={mapRef} />
          <DialogFooter className="sm:justify-start">
             <Button type="button" variant="outline" onClick={handleGetCurrentLocation}><LocateFixed className="mr-2" /> Use Current Location</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Capture Image</DialogTitle>
            </DialogHeader>
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-md" />
            <canvas ref={canvasRef} className="hidden" />
            <DialogFooter>
                <Button onClick={handleCapture}><Check className="mr-2" /> Capture Image</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSuccess} onOpenChange={setIsSuccess}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="text-green-600 flex items-center gap-2">🎉 Ticket Submitted!</DialogTitle>
                <DialogDescription>Thank you for your report. Your issue has been successfully logged.</DialogDescription>
            </DialogHeader>
            <div className="py-4 text-center">
                <p className="font-semibold text-primary text-lg">Ticket ID: <span className="font-bold">{ticketId}</span></p>
            </div>
            <DialogFooter>
                <Button onClick={() => setIsSuccess(false)}>Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
