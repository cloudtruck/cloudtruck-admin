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
  { key: 'unloading', label: 'Unloading' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'pod-received', label: 'POD Received' },
  { key: 'closed', label: 'Closed' },
];

const cancelledStep = { key: 'cancelled', label: 'Cancelled' };

export function StatusTimeline({ booking }: StatusTimelineProps) {
  const isCancelled = booking.status === 'cancelled';
  const currentStatusIndex = statusSteps.findIndex((step) => step.key === booking.status);

  // For cancelled bookings: show steps up to and including the last completed one, then the cancelled step
  const visibleSteps = isCancelled
    ? [
        ...statusSteps.slice(
          0,
          currentStatusIndex === -1 ? statusSteps.length : currentStatusIndex + 1
        ),
        cancelledStep,
      ]
    : statusSteps;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          {visibleSteps.map((step, index) => {
            const isCancelledStep = step.key === 'cancelled';

            // For cancelled bookings: all steps before the cancelled step are completed; the cancelled step itself is current
            const isCompleted = isCancelled
              ? !isCancelledStep && index < visibleSteps.length - 1
              : index < currentStatusIndex;
            const isCurrent = isCancelled ? isCancelledStep : index === currentStatusIndex;

            return (
              <div key={step.key} className="flex items-stretch gap-3">
                {/* Icon + connector line column */}
                <div className="relative flex flex-col items-center shrink-0">
                  <div
                    className={cn(
                      'relative z-10 rounded-full p-1 border-2',
                      isCancelledStep
                        ? 'bg-red-500 border-red-500'
                        : isCompleted
                          ? 'bg-green-500 border-green-500'
                          : isCurrent
                            ? 'bg-green-500 border-green-500'
                            : 'bg-white border-gray-300',
                      isCurrent && !isCancelledStep && 'ring-4 ring-green-100',
                      isCurrent && isCancelledStep && 'ring-4 ring-red-100'
                    )}
                  >
                    {isCompleted || isCurrent ? (
                      <Check className="h-4 w-4 text-white" />
                    ) : (
                      <Circle className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  {/* Connector line — always centered under the icon */}
                  {index < visibleSteps.length - 1 && (
                    <div
                      className={cn('w-0.5 flex-1', isCompleted ? 'bg-green-500' : 'bg-gray-200')}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-6">
                  <p
                    className={cn(
                      'font-medium',
                      isCancelledStep
                        ? 'text-red-600'
                        : isCurrent
                          ? 'text-green-600'
                          : isCompleted
                            ? 'text-gray-900'
                            : 'text-gray-400'
                    )}
                  >
                    {step.label}
                  </p>
                  {/* Show date only once per step, prioritizing specific milestone dates or history */}
                  {(() => {
                    let dateToShow = null;

                    if (isCancelledStep) {
                      dateToShow = booking.cancellationDetails?.cancelledAt;
                    } else {
                      // 1. Check status history for this specific step
                      const historyEntry = booking.statusHistory?.find(
                        (h) => h.status === step.key
                      );

                      if (historyEntry) {
                        dateToShow = historyEntry.timestamp;
                      }
                      // 2. Fallback to specific milestone fields if history is missing
                      else if (index === 0 && (isCompleted || isCurrent)) {
                        dateToShow = booking.createdAt;
                      } else if (
                        step.key === 'assigned' &&
                        booking.assignedAt &&
                        (isCompleted || isCurrent)
                      ) {
                        dateToShow = booking.assignedAt;
                      } else if (
                        step.key === 'delivered' &&
                        booking.podDetails?.deliveredAt &&
                        (isCompleted || isCurrent)
                      ) {
                        dateToShow = booking.podDetails.deliveredAt;
                      }
                      // 3. Fallback to updatedAt for the current active step
                      else if (isCurrent) {
                        dateToShow = booking.updatedAt;
                      }
                    }

                    if (dateToShow) {
                      return (
                        <p className="text-sm text-muted-foreground">{formatDate(dateToShow)}</p>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
