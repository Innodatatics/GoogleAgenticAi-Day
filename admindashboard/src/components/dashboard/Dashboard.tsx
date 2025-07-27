'use client';

import { useState, useEffect } from 'react';
import type { Issue } from '@/lib/types';
import DashboardStats from './DashboardStats';
import { BarChart2, Loader2 } from 'lucide-react';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from '../ui/sidebar';
import SidebarContent from './SidebarContent';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function Dashboard() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchIssues() {
      try {
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
    }
    fetchIssues();
  }, [toast]);

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
              <BarChart2 className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Admin Analytics Overview
              </h1>
            </div>
          </header>

          <main className="flex flex-col gap-8">
            <div>
              <h2 className="mb-4 text-2xl font-bold tracking-tight">Overall Issue Summary</h2>
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <DashboardStats issues={issues} />
              )}
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
