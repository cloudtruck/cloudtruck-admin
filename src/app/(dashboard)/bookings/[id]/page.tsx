'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { CustomerInfo } from '@/components/bookings/CustomerInfo';
import { RouteMap } from '@/components/bookings/RouteMap';
import { StatusTimeline } from '@/components/bookings/StatusTimeline';
import { PaymentInfo } from '@/components/bookings/PaymentInfo';
import { DocumentsSection } from '@/components/bookings/DocumentsSection';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { bookingApi } from '@/lib/api';
import { Booking } from '@/types';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Package,
  Truck,
  Calendar,
  Weight,
  FileText,
  UserCheck,
  Ban,
} from 'lucide-react';
import { toast } from 'sonner';

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await bookingApi.getById(bookingId);
      setBooking(response.data.data);
    } catch (err: unknown) {
      console.error('Failed to fetch booking details:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to load booking details');
      toast.error('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDriver = () => {
    toast.info('Assign driver modal will open here');
    // TODO: Implement assign driver modal
  };

  const handleUpdateStatus = () => {
    toast.info('Update status modal will open here');
    // TODO: Implement update status modal
  };

  const handleCancelBooking = () => {
    toast.info('Cancel booking confirmation will open here');
    // TODO: Implement cancel booking confirmation
  };

  const handleAddNote = () => {
    toast.info('Add note modal will open here');
    // TODO: Implement add note modal
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error || 'Booking not found'}</p>
          <Button onClick={fetchBookingDetails}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{booking.bookingId}</h1>
            <p className="text-muted-foreground">View and manage booking details</p>
          </div>
        </div>
        <StatusBadge status={booking.status} type="booking" />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {!booking.driver && (
          <Button onClick={handleAssignDriver}>
            <UserCheck className="h-4 w-4 mr-2" />
            Assign Driver
          </Button>
        )}
        <Button variant="outline" onClick={handleUpdateStatus}>
          <FileText className="h-4 w-4 mr-2" />
          Update Status
        </Button>
        <Button variant="outline" onClick={handleAddNote}>
          <FileText className="h-4 w-4 mr-2" />
          Add Note
        </Button>
        {booking.status !== 'cancelled' && booking.status !== 'closed' && (
          <Button variant="destructive" onClick={handleCancelBooking}>
            <Ban className="h-4 w-4 mr-2" />
            Cancel Booking
          </Button>
        )}
      </div>

      {/* Booking Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Material Type</p>
                <p className="font-medium">{booking.materialType}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Weight className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Weight</p>
                <p className="font-medium">
                  {booking.weight.value} {booking.weight.unit}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Truck className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Truck Type</p>
                <p className="font-medium">{booking.truckTypeNeeded}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Load Date/Time</p>
                <p className="font-medium">
                  {format(new Date(booking.loadDateTime), 'dd MMM yyyy, hh:mm a')}
                </p>
              </div>
            </div>
          </div>

          {booking.additionalInstructions && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-2">Additional Instructions</p>
              <p className="text-sm">{booking.additionalInstructions}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Driver & Vehicle Info (if assigned) */}
      {booking.driver && booking.vehicle && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Assigned Driver & Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Driver Details</p>
                <p className="text-lg font-semibold">{booking.driver.name}</p>
                {booking.driver.phone && (
                  <p className="text-sm text-muted-foreground">{booking.driver.phone}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Vehicle Details</p>
                <p className="text-lg font-semibold">{booking.vehicle.vehicleNumber}</p>
                <p className="text-sm text-muted-foreground">{booking.vehicle.truckType}</p>
              </div>
            </div>
            {booking.assignedAt && (
              <p className="text-sm text-muted-foreground mt-4">
                Assigned on {format(new Date(booking.assignedAt), 'dd MMM yyyy, hh:mm a')}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Customer Info and Status */}
        <div className="lg:col-span-2 space-y-6">
          <CustomerInfo booking={booking} />
          <RouteMap booking={booking} />
          <DocumentsSection booking={booking} />
        </div>

        {/* Right Column - Timeline and Payment */}
        <div className="space-y-6">
          <StatusTimeline booking={booking} />
          <PaymentInfo booking={booking} />
        </div>
      </div>
    </div>
  );
}
