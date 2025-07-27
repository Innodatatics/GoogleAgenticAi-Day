
'use client';

import { useState } from 'react';
import type { Issue, IssueStatus, Department } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { statusStyles } from './IssueCard';
import { RequestDetailsDialog } from './RequestDetailsDialog';
import { Eye, CheckCircle } from 'lucide-react';

type RequestCardProps = {
  issue: Issue;
  onUpdateStatus: (issueId: string, newStatus: IssueStatus, department?: Department) => void;
};

export function RequestCard({ issue, onUpdateStatus }: RequestCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isAssigned = !!issue.assigned_department;
  const isCompleted = issue.status === 'Completed';

  return (
    <>
      <RequestDetailsDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        issue={issue}
        onUpdateStatus={onUpdateStatus}
      />
      <Card 
        id={issue.id}
        className="flex flex-col justify-between overflow-hidden transition-all duration-300 hover:border-primary/50 bg-card/50 hover:bg-card hover:-translate-y-1">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-base font-bold break-words">
              #{issue.id || 'N/A'}
            </CardTitle>
            {isCompleted ? (
                 <Badge variant="outline" className={cn('border-2 text-xs font-bold shrink-0', statusStyles[issue.status])}>
                    <CheckCircle className="mr-1.5 h-3 w-3" />
                    {issue.status}
                </Badge>
            ) : isAssigned ? (
                <Badge variant="outline" className="border-green-500/50 bg-green-500/10 text-green-500 shrink-0">
                    <CheckCircle className="mr-1.5 h-3 w-3" />
                    Assigned
                </Badge>
            ) : (
                <Badge variant="outline" className={cn('border-2 text-xs font-bold shrink-0', statusStyles[issue.status])}>
                {issue.status}
                </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground pt-1">{issue.location || 'Unknown Location'}</p>
        </CardHeader>
        <CardContent>
            <p className="text-sm line-clamp-3 text-muted-foreground/80">{issue.description}</p>
        </CardContent>
        <CardFooter className="flex-col items-start gap-3">
          <div className="text-xs text-muted-foreground w-full">
            <p><strong>Category:</strong> {issue.issue_type}</p>
            <p><strong>Reported:</strong> {issue.timestamp ? format(parseISO(issue.timestamp), 'PP') : 'N/A'}</p>
            {isCompleted && issue.completed_timestamp && (
                <p className="font-semibold text-green-400"><strong>Completed:</strong> {format(parseISO(issue.completed_timestamp), 'PP')}</p>
            )}
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={() => setIsDialogOpen(true)}>
            <Eye className="mr-2 h-4 w-4" />
            View Request
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
