'use client';

import { useState } from 'react';
import type { Issue, IssueStatus, Department } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Building, Shield, Siren, User, Calendar, MapPin, FileText, CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { statusStyles } from './IssueCard';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { assignDepartment } from '@/ai/flows/assign-department';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type RequestDetailsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issue: Issue;
  onUpdateStatus: (issueId: string, newStatus: IssueStatus, department?: Department) => void;
};

const departmentIcons: Record<Department, React.ElementType> = {
    'Police': Shield,
    'Emergency Services': Siren,
    'Municipality': Building
}

type Assignment = {
    department: Department;
    reason: string;
}

export function RequestDetailsDialog({ open, onOpenChange, issue, onUpdateStatus }: RequestDetailsDialogProps) {
  const { toast } = useToast();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Reset state when the dialog closes
  React.useEffect(() => {
    if (!open) {
      setAssignment(null);
      setIsAssigning(false);
      setIsConfirming(false);
    }
  }, [open]);

  const handleAssign = async () => {
    setIsAssigning(true);
    setAssignment(null);
    try {
        const result = await assignDepartment({
            issueType: issue.issue_type,
            description: issue.description,
        });

        if (result.department) {
            setAssignment(result);
        } else {
             toast({
                variant: "destructive",
                title: "Assignment Error",
                description: "The AI could not determine a department. Please assign manually.",
             });
        }
    } catch (error) {
      console.error('Failed to get assignment:', error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "An error occurred while communicating with the assignment AI.",
      });
    } finally {
        setIsAssigning(false);
    }
  };

  const handleConfirmAssignment = async () => {
    if (!assignment) return;
    setIsConfirming(true);
    try {
        const formData = new URLSearchParams();
        formData.append('issue_id', issue.id);
        formData.append('department', assignment.department);

        const response = await fetch(`${API_BASE_URL}/api/assign_department`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString(),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to confirm assignment');
        }
        
        // Update the state in the parent component
        onUpdateStatus(issue.id, 'In Progress', assignment.department);
        
        toast({
            title: "Assignment Confirmed",
            description: `Issue #${issue.id} assigned to ${assignment.department}.`,
        });

        onOpenChange(false); // Close the dialog
    } catch (error) {
        console.error('Error confirming assignment:', error);
        toast({
            variant: "destructive",
            title: "Confirmation Failed",
            description: (error as Error).message,
        });
    } finally {
        setIsConfirming(false);
    }
  }
  
  const isAssigned = !!issue.assigned_department;
  const isCompleted = issue.status === 'Completed';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Request Details - #{issue.id}</DialogTitle>
           {isAssigned ? (
             <DialogDescription className="flex items-center gap-2 pt-1 text-green-500">
                <CheckCircle className="h-4 w-4" />
                <span>Assigned to <strong>{issue.assigned_department}</strong></span>
             </DialogDescription>
           ) : (
            <DialogDescription>
              Review the details below and assign to the appropriate department.
            </DialogDescription>
           )}
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={cn('border-2 text-xs font-bold', statusStyles[issue.status])}>
                {issue.status}
            </Badge>
            <Badge variant="secondary">{issue.issue_type}</Badge>
          </div>
          <div className="space-y-4 rounded-md border bg-muted/50 p-4">
            <div className="flex items-start gap-3"><FileText className="h-5 w-5 mt-0.5 text-primary" /><p className="text-sm">{issue.description}</p></div>
            <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-primary" /><p className="text-sm font-medium">{issue.location}</p></div>
            <div className="flex items-center gap-3"><User className="h-5 w-5 text-primary" /><p className="text-sm">{issue.name} ({issue.creator_email})</p></div>
            <div className="flex items-center gap-3"><Calendar className="h-5 w-5 text-primary" /><p className="text-sm">{issue.timestamp ? format(parseISO(issue.timestamp), 'PPP p') : 'N/A'}</p></div>
          </div>

          {assignment && !isAssigned && !isCompleted && (
            <div className="rounded-lg border-2 border-primary/50 bg-primary/10 p-4">
              <h4 className="font-semibold text-primary mb-2">AI Assignment Suggestion</h4>
              <div className="flex items-center gap-3">
                {React.createElement(departmentIcons[assignment.department], { className: "h-6 w-6 text-primary" })}
                <span className="text-lg font-bold">{assignment.department}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{assignment.reason}</p>
            </div>
          )}
        </div>
        {!isAssigned && !isCompleted && (
            <DialogFooter>
            {assignment ? (
                <Button onClick={handleConfirmAssignment} disabled={isConfirming} className="w-full sm:w-auto">
                    {isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Confirm Assignment
                </Button>
            ) : (
                <Button onClick={handleAssign} disabled={isAssigning} className="w-full sm:w-auto">
                {isAssigning ? (
                    <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                    </>
                ) : (
                    <>
                    <Send className="mr-2 h-4 w-4" />
                    Assign with AI
                    </>
                )}
                </Button>
            )}
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
