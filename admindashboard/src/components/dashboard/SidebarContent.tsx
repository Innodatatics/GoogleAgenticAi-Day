'use client';

import Link from 'next/link';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { BarChart2, UserCheck, ListTodo, Rss } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { NammaDrishtiLogo } from '@/components/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '../ui/separator';

export default function SidebarContentComponent() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-3">
          <NammaDrishtiLogo className="w-10 h-10" />
          <h2 className="text-xl font-bold tracking-tight text-primary">NammaDrishti Ai</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
            <p className="px-4 py-2 text-xs font-semibold text-muted-foreground">Admin</p>
            <SidebarMenuItem>
                <Link href="/" passHref>
                <SidebarMenuButton isActive={pathname === '/'} tooltip="Admin Analytics">
                    <BarChart2 />
                    <span>Admin Analytics</span>
                </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <Link href="/all-requests" passHref>
                <SidebarMenuButton isActive={pathname === '/all-requests'} tooltip="All Requests">
                    <ListTodo />
                    <span>All Requests</span>
                </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <Link href="/user-management" passHref>
                <SidebarMenuButton isActive={pathname === '/user-management'} tooltip="User Management">
                    <UserCheck />
                    <span>User Management</span>
                </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <Link href="/admin-analysis" passHref>
                <SidebarMenuButton isActive={pathname === '/admin-analysis'} tooltip="Predictive Analysis">
                    <Rss />
                    <span>Predictive Analysis</span>
                </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <div className="mt-auto p-4">
        <Separator className="my-4 bg-sidebar-border" />
        <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-background">
                <AvatarImage src="https://placehold.co/100x100.png" alt="@admin" data-ai-hint="profile picture" />
                <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div>
                <p className="text-sm font-semibold text-sidebar-foreground">Innodatatics</p>
                <p className="text-xs text-sidebar-foreground/70">admin@innodatatics.com</p>
            </div>
        </div>
      </div>
    </>
  );
}
