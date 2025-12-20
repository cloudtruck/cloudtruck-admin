'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { 
  Package, 
  Truck, 
  AlertCircle,
  FileText,
  DollarSign 
} from 'lucide-react';

interface Activity {
  _id: string;
  type: 'booking_created' | 'driver_assigned' | 'status_update' | 'pod_uploaded' | 'payment_received';
  message: string;
  bookingId?: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

interface RecentActivityProps {
  activities: Activity[];
  loading?: boolean;
}

const activityIcons = {
  booking_created: Package,
  driver_assigned: Truck,
  status_update: AlertCircle,
  pod_uploaded: FileText,
  payment_received: DollarSign,
};

const activityColors = {
  booking_created: 'text-blue-600 bg-blue-100',
  driver_assigned: 'text-yellow-600 bg-yellow-100',
  status_update: 'text-purple-600 bg-purple-100',
  pod_uploaded: 'text-green-600 bg-green-100',
  payment_received: 'text-emerald-600 bg-emerald-100',
};

export function RecentActivity({ activities, loading }: RecentActivityProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No recent activity
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type] || AlertCircle;
            const colorClass = activityColors[activity.type] || 'text-gray-600 bg-gray-100';

            return (
              <div key={activity._id} className="flex items-start gap-4">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{activity.message}</p>
                  {activity.bookingId && (
                    <Badge variant="outline" className="text-xs">
                      {activity.bookingId}
                    </Badge>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
