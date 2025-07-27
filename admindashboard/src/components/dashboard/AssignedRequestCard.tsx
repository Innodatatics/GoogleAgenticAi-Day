
'use client';

import { useState } from 'react';
import type { Issue, IssueStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { statusStyles } from './IssueCard';
import { Map, ExternalLink, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateMapLink } from '@/ai/flows/generate-map-link';

type AssignedRequestCardProps = {
  issue: Issue;
  onUpdateStatus: (issueId: string, newStatus: IssueStatus) => void;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export function AssignedRequestCard({ issue, onUpdateStatus }: AssignedRequestCardProps) {
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const { toast } = useToast();

  const handleNavigate = async () => {
    setIsMapLoading(true);
    try {
        const locationString = Array.isArray(issue.location) 
            ? (issue.location as number[]).join(', ') 
            : issue.location;

        const result = await generateMapLink({ location: locationString });
        if (result.mapUrl) {
            window.open(result.mapUrl, '_blank');
        } else {
            throw new Error('Could not generate a map link.');
        }
    } catch (error) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Navigation Error",
            description: (error as Error).message,
        });
    } finally {
        setIsMapLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    setIsCompleting(true);
    try {
        const formData = new URLSearchParams();
        formData.append('issue_id', issue.id);
        formData.append('status', 'Completed');

        const res = await fetch(`${API_BASE_URL}/api/update_status`, {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || `Failed to update status.`);
        }
        
        onUpdateStatus(issue.id, 'Completed');
        
        toast({
            title: 'Task Completed',
            description: `Issue #${issue.id} has been marked as complete.`,
        });

    } catch (error) {
        console.error('Failed to complete task:', error);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: (error as Error).message,
        });
    } finally {
        setIsCompleting(false);
    }
  }

  const displayLocation = Array.isArray(issue.location) 
    ? (issue.location as number[]).join(', ') 
    : issue.location;

  return (
    <Card className="flex flex-col justify-between overflow-hidden transition-all duration-300 hover:border-primary/50 bg-card/50 hover:bg-card hover:-translate-y-1">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-bold break-words">
            #{issue.id}
          </CardTitle>
          <Badge variant="outline" className={cn('border-2 text-xs font-bold shrink-0', statusStyles[issue.status])}>
            {issue.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground pt-1">{displayLocation}</p>
      </CardHeader>
      <CardContent>
          <p className="text-sm line-clamp-3 text-muted-foreground/80">{issue.description}</p>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2">
        <div className="text-xs text-muted-foreground w-full">
          <p><strong>Category:</strong> {issue.issue_type}</p>
          <p><strong>Reported:</strong> {format(parseISO(issue.timestamp), 'PP')}</p>
        </div>
        <div className="w-full flex flex-col gap-2">
            <Button variant="secondary" size="sm" className="w-full" onClick={handleNavigate} disabled={isMapLoading}>
                {isMapLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                    </>
                ) : (
                    <>
                        <Map className="mr-2 h-4 w-4" />
                        Navigate on Map
                        <ExternalLink className="ml-auto h-3 w-3" />
                    </>
                )}
            </Button>
            {issue.status !== 'Completed' && (
                 <Button variant="outline" size="sm" className="w-full" onClick={handleMarkComplete} disabled={isCompleting}>
                    {isCompleting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Completing...
                        </>
                    ) : (
                        <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark as Complete
                        </>
                    )}
                 </Button>
            )}
        </div>
      </CardFooter>
    </Card>
  );
}
