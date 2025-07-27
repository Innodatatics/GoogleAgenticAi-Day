'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Issue, IssueStatus, IssueCategory, Department } from '@/lib/types';
import { RequestCard } from './RequestCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '../ui/input';
import { ListFilter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AllRequestsProps = {
  issues: Issue[];
  onUpdateStatus: (issueId: string, newStatus: IssueStatus, department?: Department) => void;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const categories: (IssueCategory | 'All')[] = ['All', 'Civic', 'Crime', 'Traffic', 'Event', 'Other'];
const statuses: (IssueStatus | 'All')[] = ['All', 'Pending', 'In Progress', 'On Hold', 'Completed'];

export default function AllRequests({ issues, onUpdateStatus }: AllRequestsProps) {
  const [categoryFilter, setCategoryFilter] = useState<IssueCategory | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const filteredIssues = useMemo(() => {
    return issues
      .filter((issue) => (categoryFilter === 'All' ? true : issue.issue_type === categoryFilter))
      .filter((issue) => (statusFilter === 'All' ? true : issue.status === statusFilter))
      .filter((issue) =>
        [issue.id, issue.location, issue.description, issue.name, issue.creator_email]
          .some(field => field && field.toLowerCase().includes(searchTerm.toLowerCase()))
      );
  }, [issues, categoryFilter, statusFilter, searchTerm]);

  const handleLocalUpdateStatus = useCallback(async (issueId: string, newStatus: IssueStatus) => {
    try {
        const formData = new URLSearchParams();
        formData.append('issue_id', issueId);
        formData.append('status', newStatus);

        const res = await fetch(`${API_BASE_URL}/api/update_status`, {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || `Failed to update status.`);
        }

        onUpdateStatus(issueId, newStatus);
        
        toast({
            title: 'Status Updated',
            description: `Issue #${issueId} is now ${newStatus}.`,
        });

    } catch (error) {
        console.error('Failed to update status:', error);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: (error as Error).message,
        });
    }
  }, [onUpdateStatus, toast]);


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 min-w-0 items-center gap-2">
            <ListFilter className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by ID, location, description..."
              className="min-w-0 flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Select onValueChange={(value) => setCategoryFilter(value as IssueCategory | 'All')} defaultValue="All">
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => setStatusFilter(value as IssueStatus | 'All')} defaultValue="All">
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {filteredIssues.length > 0 ? (
          filteredIssues.map((issue) => (
            <RequestCard key={issue.id} issue={issue} onUpdateStatus={onUpdateStatus} />
          ))
        ) : (
          <div className="col-span-full py-10 text-center text-muted-foreground">
            No issues match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}
