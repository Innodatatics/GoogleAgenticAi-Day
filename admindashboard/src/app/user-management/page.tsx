'use client';

import { useState, useEffect } from 'react';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import SidebarContent from '@/components/dashboard/SidebarContent';
import { UserCheck, Loader2 } from 'lucide-react';
import UserManagement from '@/components/dashboard/UserManagement';
import type { UserContribution, Issue } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { UserIssuesDialog } from '@/components/dashboard/UserIssuesDialog';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function UserManagementPage() {
    const [userContributions, setUserContributions] = useState<UserContribution[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const [selectedUser, setSelectedUser] = useState<UserContribution | null>(null);
    const [userIssues, setUserIssues] = useState<Issue[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDialogLoading, setIsDialogLoading] = useState(false);

    useEffect(() => {
        async function fetchContributions() {
            try {
                const res = await fetch(`${API_BASE_URL}/api/user_contributions`);

                if (!res.ok) {
                    throw new Error(`Failed to fetch user contributions: ${res.statusText}`);
                }
                
                const contribData = await res.json();
                setUserContributions(contribData);

            } catch (error) {
                console.error(error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to fetch user contributions from the backend.',
                });
            } finally {
                setLoading(false);
            }
        }
        fetchContributions();
    }, [toast]);

    const handleUserClick = async (user: UserContribution) => {
        setSelectedUser(user);
        setIsDialogOpen(true);
        setIsDialogLoading(true);
        setUserIssues([]); // Clear previous issues
        
        try {
            const res = await fetch(`${API_BASE_URL}/api/issues_by_user?email=${encodeURIComponent(user.email)}`);
            if (!res.ok) {
                throw new Error(`Failed to fetch issues for user: ${res.statusText}`);
            }
            const issuesData = await res.json();
            setUserIssues(issuesData);
        } catch (error) {
             console.error(error);
             toast({
                variant: 'destructive',
                title: 'Error',
                description: `Failed to fetch issues for ${user.email}.`,
             });
             // Close the dialog if the fetch fails
             setIsDialogOpen(false);
        } finally {
            setIsDialogLoading(false);
        }
    };

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
              <UserCheck className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                User Management
              </h1>
            </div>
          </header>
          <main>
            {loading ? (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <UserManagement userContributions={userContributions} onUserClick={handleUserClick} />
            )}
          </main>
        </div>
      </SidebarInset>
      {selectedUser && (
        <UserIssuesDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            user={selectedUser}
            issues={userIssues}
            isLoading={isDialogLoading}
        />
      )}
    </SidebarProvider>
  );
}
