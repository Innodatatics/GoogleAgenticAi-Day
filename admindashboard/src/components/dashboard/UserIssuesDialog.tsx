
'use client';

import type { UserContribution, Issue } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { statusStyles } from './IssueCard';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';


type UserIssuesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserContribution;
  issues: Issue[];
  isLoading: boolean;
};

export function UserIssuesDialog({ open, onOpenChange, user, issues, isLoading }: UserIssuesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Issues Reported by {user.email}</DialogTitle>
          <DialogDescription>
            Showing {issues.length} of {issues.length} total issue(s) reported by this user.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
            <div className="py-4">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground pt-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p>Loading issues...</p>
                </div>
            ) : (
                <div className="space-y-4">
                {issues.length > 0 ? (
                    issues.map((issue) => (
                    <div key={issue.id} className="flex items-start gap-4 rounded-lg border p-4">
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                                <p className="font-semibold">#{issue.id} - {issue.location}</p>
                                <Badge variant="outline" className={cn('border-2 text-xs font-bold', statusStyles[issue.status])}>
                                    {issue.status}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{issue.issue_type}</p>
                            <p className="text-sm text-muted-foreground/80 pt-2">{issue.description}</p>
                            <div className="flex items-center justify-between pt-2">
                                <p className="text-xs text-muted-foreground pt-1">
                                    Reported on: {format(parseISO(issue.timestamp), 'PPP p')}
                                </p>
                                {issue.status === 'Pending' && (
                                     <Button asChild variant="outline" size="sm">
                                        <Link href={`/all-requests#${issue.id}`}>
                                            Take Action
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                    ))
                ) : (
                    <p className="text-center text-muted-foreground pt-10">No issues found for this user.</p>
                )}
                </div>
            )}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
