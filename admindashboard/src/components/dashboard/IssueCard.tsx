'use client';

import type { Issue, IssueStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { Check, Clock, Pause, Flame } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type IssueCardProps = {
  issue: Issue;
  onUpdateStatus: (issueId: string, newStatus: IssueStatus) => void;
};

export const statusStyles: Record<IssueStatus, string> = {
  Pending: 'border-red-500/50 text-red-500 bg-red-500/10 hover:bg-red-500/20',
  'In Progress': 'border-yellow-500/50 text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20',
  'On Hold': 'border-indigo-500/50 text-indigo-500 bg-indigo-500/10 hover:bg-indigo-500/20',
  Completed: 'border-green-500/50 text-green-500 bg-green-500/10 hover:bg-green-500/20',
};

export default function IssueCard({ issue, onUpdateStatus }: IssueCardProps) {
  const isHighPriority = issue.priority === 'very important';

  return (
    <Card className="hover:border-primary/50 transition-all duration-300 bg-card/50 hover:bg-card hover:-translate-y-1">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-bold">
            #{issue.id} - {issue.location}
          </CardTitle>
          <div className="flex items-center gap-2">
            {isHighPriority && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Flame className="h-5 w-5 text-red-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs"><strong>High Priority</strong></p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Badge variant="outline" className={cn('text-xs font-bold border-2', statusStyles[issue.status])}>{issue.status}</Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{issue.issue_type}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{issue.description}</p>
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Submitted by:</strong> {issue.name} {issue.creator_email && `(${issue.creator_email})`}</p>
          <p><strong>Created at:</strong> {issue.timestamp ? format(parseISO(issue.timestamp), 'PPP p') : 'N/A'}</p>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onUpdateStatus(issue.id, 'Completed')}><Check className="mr-1.5 h-4 w-4" />Completed</Button>
          <Button variant="outline" size="sm" onClick={() => onUpdateStatus(issue.id, 'In Progress')}><Clock className="mr-1.5 h-4 w-4" />In Progress</Button>
          <Button variant="outline" size="sm" onClick={() => onUpdateStatus(issue.id, 'On Hold')}><Pause className="mr-1.5 h-4 w-4" />On Hold</Button>
        </div>
      </CardContent>
    </Card>
  );
}
