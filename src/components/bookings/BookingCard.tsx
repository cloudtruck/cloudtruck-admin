'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { format } from 'date-fns';
import { MapPin, Package, Calendar, Truck, Eye, UserCheck } from 'lucide-react';
import { Booking } from '@/types';
import { useRouter } from 'next/navigation';

interface BookingCardProps {
  booking: Booking;
  onAssignDriver?: (bookingId: string) => void;
}

export function BookingCard({ booking, onAssignDriver }: BookingCardProps) {
  const router = useRouter();

  const handleViewDetails = () => {
    router.push(`/bookings/${booking._id}`);
  };

  const handleAssignDriver = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAssignDriver?.(booking._id);
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleViewDetails}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header - Booking ID and Status */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Booking ID</p>
              <p className="text-lg font-bold">{booking.bookingId}</p>
            </div>
            <StatusBadge status={booking.status} type="booking" />
          </div>

          {/* Customer Info */}
          <div>
            <p className="text-sm font-medium text-muted-foreground">Customer</p>
            <p className="font-medium">{booking.customer?.companyName || 'N/A'}</p>
          </div>

          {/* Route */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Pickup</p>
                <p className="text-sm text-muted-foreground truncate">
                  {booking.pickup?.city || booking.pickup?.address || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Drop</p>
                <p className="text-sm text-muted-foreground truncate">
                  {booking.drop?.city || booking.drop?.address || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Material and Truck Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Material</p>
                <p className="text-sm font-medium">{booking.materialType || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Truck className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Truck Type</p>
                <p className="text-sm font-medium">{booking.truckTypeNeeded || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Load Date */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Load Date</p>
              <p className="text-sm font-medium">
                {booking.loadDateTime
                  ? format(new Date(booking.loadDateTime), 'dd MMM yyyy, hh:mm a')
                  : 'Not scheduled'}
              </p>
            </div>
          </div>

          {/* Payment Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Payment</span>
            <StatusBadge status={booking.paymentStatus} type="payment" />
          </div>

          {/* Driver Info (if assigned) */}
          {booking.driver && (
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
              <UserCheck className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Assigned Driver</p>
                <p className="text-sm font-medium">{booking.driver.name}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={handleViewDetails}>
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Button>
            {!booking.driver && (
              <Button size="sm" className="flex-1" onClick={handleAssignDriver}>
                <UserCheck className="h-4 w-4 mr-1" />
                Assign Driver
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
