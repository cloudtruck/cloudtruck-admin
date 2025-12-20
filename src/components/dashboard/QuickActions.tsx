'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, Truck, FileText, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      icon: Plus,
      label: 'New Booking',
      description: 'Create a new booking',
      onClick: () => router.push('/bookings/new'),
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      icon: Search,
      label: 'Find Driver',
      description: 'Search available drivers',
      onClick: () => router.push('/drivers?status=available'),
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      icon: Truck,
      label: 'Track Shipment',
      description: 'View live tracking',
      onClick: () => router.push('/tracking/live-trips'),
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      icon: FileText,
      label: 'View Reports',
      description: 'Generate reports',
      onClick: () => router.push('/reports'),
      color: 'bg-orange-500 hover:bg-orange-600',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto py-4 justify-start"
              onClick={action.onClick}
            >
              <div className="flex items-start gap-3 w-full">
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
