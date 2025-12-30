'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Booking } from '@/types';
import { Check, Circle } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

interface StatusTimelineProps {
  booking: Booking;
}

const statusSteps = [
  { key: 'created', label: 'Booking Created' },
  { key: 'under-review', label: 'Under Review' },
  { key: 'assigned', label: 'Driver Assigned' },
  { key: 'driver-en-route', label: 'Driver En Route' },
  { key: 'reached-pickup', label: 'Reached Pickup' },
  { key: 'loaded', label: 'Loaded' },
  { key: 'in-transit', label: 'In Transit' },
  { key: 'reached-destination', label: 'Reached Destination' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'pod-received', label: 'POD Received' },
  { key: 'closed', label: 'Closed' },
];

export function StatusTimeline({ booking }: StatusTimelineProps) {
  const currentStatusIndex = statusSteps.findIndex((step) => step.key === booking.status);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statusSteps.map((step, index) => {
            const isCompleted = index <= currentStatusIndex;
            const isCurrent = index === currentStatusIndex;

            return (
              <div key={step.key} className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className={cn(
                    'rounded-full p-1 border-2',
                    isCompleted
                      ? 'bg-green-500 border-green-500'
                      : 'bg-white border-gray-300',
                    isCurrent && 'ring-4 ring-green-100'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 text-white" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-400" />
                  )}
                </div>

                {/* Line */}
                {index < statusSteps.length - 1 && (
                  <div
                    className={cn(
                      'absolute left-7 w-0.5 h-8 mt-7',
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    )}
                  />
                )}

                {/* Content */}
                <div className="flex-1 min-w-0 pb-6">
                  <p
                    className={cn(
                      'font-medium',
                      isCurrent ? 'text-green-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'
                    )}
                  >
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-sm text-muted-foreground">
                      {formatDate(booking.updatedAt)}
                    </p>
                  )}
                  {index === 0 && isCompleted && (
                    <p className="text-sm text-muted-foreground">
                      {formatDate(booking.createdAt)}
                    </p>
                  )}
                  {step.key === 'assigned' && booking.assignedAt && isCompleted && (
                    <p className="text-sm text-muted-foreground">
                      {formatDate(booking.assignedAt)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
