'use client';

import type { UserContribution } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type UserManagementProps = {
  userContributions: UserContribution[];
  onUserClick: (user: UserContribution) => void;
};

export default function UserManagement({ userContributions, onUserClick }: UserManagementProps) {

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Contributions</CardTitle>
        <CardDescription>Click on a user to view their reported issues.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead className="text-right">Issues Reported</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userContributions.map(user => (
              <TableRow key={user.email} onClick={() => onUserClick(user)} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                       <AvatarImage src={`https://placehold.co/100x100.png`} alt={user.email} data-ai-hint="profile picture" />
                       <AvatarFallback>{user.email.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-0.5">
                       <p className="font-medium">{user.email}</p>
                       <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">{user.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
