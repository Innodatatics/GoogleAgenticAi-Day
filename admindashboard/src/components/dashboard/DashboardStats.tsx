'use client';

import type { Issue, IssueStatus } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Check, Clock, Pause, AlertCircle } from 'lucide-react';

type DashboardStatsProps = {
  issues: Issue[];
};

const statusColors: Record<IssueStatus, string> = {
  'Pending': 'hsl(var(--chart-3))', // Red
  'In Progress': 'hsl(var(--chart-1))', // Blue
  'On Hold': 'hsl(var(--chart-4))', // Purple
  'Completed': 'hsl(var(--chart-2))', // Green
};

const statusIcons: Record<IssueStatus | 'Total', React.ElementType> = {
    'Pending': AlertCircle,
    'In Progress': Clock,
    'On Hold': Pause,
    'Completed': Check,
    'Total': AlertCircle,
};

export default function DashboardStats({ issues }: DashboardStatsProps) {
  const statusCounts = {
    'Pending': issues.filter((issue) => issue.status === 'Pending').length,
    'In Progress': issues.filter((issue) => issue.status === 'In Progress').length,
    'On Hold': issues.filter((issue) => issue.status === 'On Hold').length,
    'Completed': issues.filter((issue) => issue.status === 'Completed').length,
  };

  const chartData = Object.entries(statusCounts)
    .map(([name, value]) => ({
      name: name as IssueStatus,
      value,
    }))
    .filter(item => item.value > 0); // Filter out items with 0 value for the pie rendering
  
  const legendPayload = Object.keys(statusCounts).map(status => ({
    value: status,
    type: 'square',
    color: statusColors[status as IssueStatus],
  }));

  const summaryCards: { title: IssueStatus; value: number; }[] = [
    { title: 'Pending', value: statusCounts['Pending'] },
    { title: 'In Progress', value: statusCounts['In Progress'] },
    { title: 'On Hold', value: statusCounts['On Hold'] },
    { title: 'Completed', value: statusCounts['Completed'] },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:col-span-1">
        {summaryCards.map((card) => {
            const Icon = statusIcons[card.title];
            return (
              <Card key={card.title} className="bg-card/50 hover:bg-card transition-colors hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                  <Icon className="h-5 w-5 text-muted-foreground" style={{color: statusColors[card.title]}} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            )
        })}
      </div>
      <Card className="lg:col-span-2 hover:-translate-y-1 transition-transform">
        <CardHeader>
          <CardTitle>Issue Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            {chartData.length > 0 ? (
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  labelLine={true}
                  label={({
                    cx,
                    cy,
                    midAngle,
                    innerRadius,
                    outerRadius,
                    percent,
                    index,
                  }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 20;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);

                    return (
                      <text
                        x={x}
                        y={y}
                        fill="hsl(var(--foreground))"
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                        className="text-xs"
                      >
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={statusColors[entry.name]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend payload={legendPayload} />
              </PieChart>
            ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    No data to display.
                </div>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
