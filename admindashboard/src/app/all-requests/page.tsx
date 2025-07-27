
'use client';

import { useState, useEffect, useCallback } from 'react';
import AllRequests from '@/components/dashboard/AllRequests';
import type { Issue, IssueStatus, Department } from '@/lib/types';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import SidebarContent from '@/components/dashboard/SidebarContent';
import { ListTodo, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function AllRequestsPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/get_issues`); 
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
        description: "Failed to fetch issues from the backend.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  // Effect to handle scrolling to a specific issue card
  useEffect(() => {
    // We only want this to run after the initial data is loaded.
    if (loading) {
      return;
    }
  
    // Using a timeout allows the DOM to update with the new issues before we try to find the element.
    const timer = setTimeout(() => {
      const hash = window.location.hash.substring(1); // Get the hash, remove the '#'
      if (hash) {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Add a temporary highlight effect
          element.style.transition = 'background-color 0.5s ease-in-out';
          element.style.backgroundColor = 'hsl(var(--primary) / 0.1)';
          setTimeout(() => {
            element.style.backgroundColor = ''; // Revert to original bg
          }, 2000); // Highlight duration
        }
      }
    }, 200); // A short delay
  
    return () => clearTimeout(timer); // Cleanup timeout on component unmount or re-render
  }, [loading]); // Dependency on loading ensures it runs once issues are fetched


  const handleUpdateStatus = useCallback((issueId: string, newStatus: IssueStatus, department?: Department) => {
    setIssues((prevIssues) =>
      prevIssues.map((issue) => {
        if (issue.id === issueId) {
          const updatedIssue = { ...issue, status: newStatus };
          if (department) {
            updatedIssue.assigned_department = department;
          }
          return updatedIssue;
        }
        return issue;
      })
    );
  }, []);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent />
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col gap-8 p-4 md:p-6 lg:p-8">
          <header className="flex items-center justify-between rounded-lg bg-card p-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="md:hidden" />
              <ListTodo className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                All Requests
              </h1>
            </div>
          </header>
          <main>
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <AllRequests issues={issues} onUpdateStatus={handleUpdateStatus} />
            )}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
