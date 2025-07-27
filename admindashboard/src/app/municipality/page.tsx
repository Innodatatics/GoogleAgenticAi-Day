'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Issue, IssueStatus } from '@/lib/types';
import DashboardStats from '@/components/dashboard/DashboardStats';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AssignedRequestCard } from '@/components/dashboard/AssignedRequestCard';
import { Input } from '@/components/ui/input';
import { ListFilter, Building } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const DEPARTMENT_NAME = 'Municipality';

export default function MunicipalityDashboardPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/get_issues?department=${encodeURIComponent(DEPARTMENT_NAME)}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch issues: ${res.statusText}`);
      }
      const data = await res.json();
      setIssues(data);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to fetch tasks for ${DEPARTMENT_NAME}.`,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleUpdateStatus = useCallback((issueId: string, newStatus: IssueStatus) => {
    // Update the status in the main list to reflect in the stats
    setIssues((prevIssues) =>
      prevIssues.map((issue) =>
        issue.id === issueId ? { ...issue, status: newStatus } : issue
      )
    );
  }, []);

  const filteredIssues = useMemo(() => {
    // Filter for search term first
    const searchedIssues = issues.filter((issue) =>
      [issue.id, issue.location, issue.description]
        .some(field => field && field.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    // Then filter out completed issues for the task list view
    return searchedIssues.filter(issue => issue.status !== 'Completed');
  }, [issues, searchTerm]);

  return (
    <div className="bg-background min-h-screen">
      <div className="flex flex-col gap-8 p-4 md:p-6 lg:p-8">
        <header className="flex items-center justify-between rounded-lg bg-card p-4 shadow-md">
          <div className="flex items-center gap-3">
            <Building className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {DEPARTMENT_NAME} Dashboard
            </h1>
          </div>
        </header>

        <main className="flex flex-col gap-8">
          <div>
            <h2 className="mb-4 text-2xl font-bold tracking-tight">Assigned Tasks Summary</h2>
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <DashboardStats issues={issues} />
            )}
          </div>
          
          <div>
               <h2 className="mb-4 text-2xl font-bold tracking-tight">My Tasks</h2>
               <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-1 min-w-0 items-center gap-2">
                      <ListFilter className="h-5 w-5 text-muted-foreground" />
                      <Input
                      placeholder="Search tasks by ID, location, description..."
                      className="min-w-0 flex-1"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </div>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                  {loading ? (
                      <div className="col-span-full flex justify-center items-center py-10">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                  ) : filteredIssues.length > 0 ? (
                  filteredIssues.map((issue) => (
                      <AssignedRequestCard key={issue.id} issue={issue} onUpdateStatus={handleUpdateStatus} />
                  ))
                  ) : (
                  <div className="col-span-full py-10 text-center text-muted-foreground">
                      No active tasks assigned to {DEPARTMENT_NAME}.
                  </div>
                  )}
              </div>
          </div>
        </main>
      </div>
    </div>
  );
}
