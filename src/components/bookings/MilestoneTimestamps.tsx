'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Booking } from '@/types';
import { Clock } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

interface MilestoneTimestampsProps {
  booking: Booking;
}

export function MilestoneTimestamps({ booking }: MilestoneTimestampsProps) {
  const sh = (status: string) => booking.statusHistory?.find((h) => h.status === status)?.timestamp;

  const indent = booking.createdAt;
  const confirmed = booking.assignedAt || sh('assigned');
  const sIn = sh('reached-pickup') || sh('loaded');
  const sOut = sh('in-transit');
  const dIn = sh('reached-destination');
  const dOut = booking.podDetails?.deliveredAt || sh('delivered');
  const eta = booking.expectedDeliveryDate;

  const milestones = [
    { label: 'Indent (Created)', value: indent },
    { label: 'Confirmed (Assigned)', value: confirmed },
    { label: 'Source In (S-In)', value: sIn },
    { label: 'Source Out (S-Out)', value: sOut },
    { label: 'ETA', value: eta },
    { label: 'Destination In (D-In)', value: dIn },
    { label: 'Destination Out (D-Out)', value: dOut },
  ];

  // Only show if at least one milestone beyond indent is recorded
  const hasData = milestones.slice(1).some((m) => m.value);
  if (!hasData) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Milestone Timestamps
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {milestones.map((m) => (
            <div key={m.label} className="space-y-0.5">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className={`text-sm font-medium ${m.value ? 'text-gray-900' : 'text-gray-300'}`}>
                {m.value ? formatDate(m.value, 'dd-MMM-yy HH:mm') : '—'}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
