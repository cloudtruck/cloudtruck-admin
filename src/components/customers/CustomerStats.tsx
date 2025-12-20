'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Package, IndianRupee, Clock } from 'lucide-react';

interface CustomerStatsProps {
  stats: {
    totalBookings: number;
    activeBookings: number;
    completedBookings: number;
    totalSpent: number;
    averageBookingValue: number;
    lastBookingDays: number;
  };
}

export function CustomerStats({ stats }: CustomerStatsProps) {
  const statCards = [
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      title: 'Active Bookings',
      value: stats.activeBookings,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      title: 'Total Spent',
      value: `₹${stats.totalSpent.toLocaleString('en-IN')}`,
      icon: IndianRupee,
      color: 'bg-purple-500',
    },
    {
      title: 'Last Booking',
      value: stats.lastBookingDays === 0 ? 'Today' : `${stats.lastBookingDays}d ago`,
      icon: Clock,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`h-8 w-8 rounded-full ${stat.color} bg-opacity-10 flex items-center justify-center`}>
                <Icon className={`h-4 w-4 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
