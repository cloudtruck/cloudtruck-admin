'use client';

import Link from 'next/link';
import { Truck, MapPin, User, Clock, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { Booking } from '@/types';
import { formatDistanceToNow } from '@/lib/date-utils';

interface LiveTripCardProps {
  booking: Booking;
  onViewDetails: (booking: Booking) => void;
}

export function LiveTripCard({ booking, onViewDetails }: LiveTripCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-8">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <Link
                href={`/bookings/${booking._id}`}
                className="text-lg font-semibold hover:underline"
              >
                {booking.bookingId}
              </Link>
              <p className="text-sm text-muted-foreground">
                {booking.customer.companyName}
              </p>
            </div>
            <StatusBadge status={booking.status} type="booking" />
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">{booking.pickup.city}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {booking.pickup.address}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-6">
              <div className="h-8 w-px bg-border" />
            </div>
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">{booking.drop.city}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {booking.drop.address}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {booking.driver && (
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <Link
                  href={`/drivers/${booking.driver._id}`}
                  className="hover:underline"
                >
                  {booking.driver.name}
                </Link>
              </div>
            )}
            {booking.vehicle && (
              <div className="flex items-center gap-1">
                <Truck className="h-4 w-4" />
                <span>{booking.vehicle.vehicleNumber}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                Updated {formatDistanceToNow(booking.updatedAt, { addSuffix: true })}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(booking)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Track
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
