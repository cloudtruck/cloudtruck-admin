'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Clock, Phone, Navigation, MessageSquare, Edit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { AddNoteModal } from '@/components/bookings/AddNoteModal';
import { UpdateStatusModal } from '@/components/bookings/UpdateStatusModal';
import { trackingApi } from '@/lib/api';
import type { Booking, TrackingLocation } from '@/types';
import { formatDate } from '@/lib/date-utils';
import { formatDistance } from 'date-fns';
import Link from 'next/link';
import { ShipmentRouteMap } from './ShipmentRouteMap';
import { useTrackingWebSocket } from '@/hooks/useWebSocket';

interface TrackingDetailModalProps {
  booking: Booking | null;
  open: boolean;
  onCloseAction: () => void;
  onBookingUpdate?: () => void;
}

export function TrackingDetailModal({ booking, open, onCloseAction, onBookingUpdate }: TrackingDetailModalProps) {
  const [latestLocation, setLatestLocation] = useState<TrackingLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const { subscribeToBooking, unsubscribeFromBooking, onLocationUpdate } = useTrackingWebSocket();

  const fetchLatestLocation = useCallback(async () => {
    if (!booking) return;

    setLoading(true);
    try {
      const response = await trackingApi.getLatest(booking._id);
      setLatestLocation(response.data.data);
    } catch (error) {
      console.error('Failed to fetch location:', error);
      // toast.error('Failed to fetch latest location');
    } finally {
      setLoading(false);
    }
  }, [booking]);

  useEffect(() => {
    if (booking && open) {
      fetchLatestLocation();
      subscribeToBooking(booking._id);

      const unsubscribe = onLocationUpdate((data: unknown) => {
        const update = data as TrackingLocation;
        if (update.booking === booking._id) {
          setLatestLocation(update);
        }
      });

      return () => {
        unsubscribeFromBooking(booking._id);
        if (unsubscribe) unsubscribe();
      };
    }
  }, [booking, open, fetchLatestLocation, subscribeToBooking, unsubscribeFromBooking, onLocationUpdate]);

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onCloseAction}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Track Shipment: {booking.bookingId}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNoteModalOpen(true)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Note
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusModalOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Update Status
              </Button>
              <StatusBadge status={booking.status} type="booking" />
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Map Visualization */}
          <div className="rounded-lg overflow-hidden border bg-muted/20">
            <ShipmentRouteMap 
              booking={booking} 
              currentLocation={latestLocation || undefined} 
              height="300px" 
            />
          </div>

          {/* Route Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">{booking.pickup.city}</p>
                    <p className="text-sm text-muted-foreground">{booking.pickup.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pl-8">
                  <div className="h-8 w-px bg-border" />
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">{booking.drop.city}</p>
                    <p className="text-sm text-muted-foreground">{booking.drop.address}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Driver Info */}
          {booking.driver && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Driver</p>
                    <Link
                      href={`/drivers/${booking.driver._id}`}
                      className="text-lg font-semibold hover:underline"
                    >
                      {booking.driver.name}
                    </Link>
                    {booking.vehicle && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {booking.vehicle.vehicleNumber}
                      </p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${booking.driver.name}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      Contact
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Latest Location */}
          {loading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              </CardContent>
            </Card>
          ) : latestLocation ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Navigation className="h-5 w-5 text-blue-600" />
                      Latest Location
                    </h3>
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {latestLocation.timestamp ? formatDistance(new Date(latestLocation.timestamp), new Date(), {
                        addSuffix: true,
                      }) : 'N/A'}
                    </Badge>
                  </div>
                  {latestLocation.city && (
                    <p className="text-sm">
                      <span className="font-medium">City:</span> {latestLocation.city}
                    </p>
                  )}
                  {latestLocation.location?.coordinates && (
                    <p className="text-sm text-muted-foreground">
                      Coordinates: {latestLocation.location.coordinates[1].toFixed(6)},{' '}
                      {latestLocation.location.coordinates[0].toFixed(6)}
                    </p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={latestLocation.location?.coordinates ? `https://www.google.com/maps?q=${latestLocation.location.coordinates[1]},${latestLocation.location.coordinates[0]}` : '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        View on Google Maps
                      </a>
                    </Button>
                    <Button onClick={fetchLatestLocation} variant="ghost" size="sm">
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No location data available</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trip Details */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Material</p>
                  <p className="font-medium">{booking.materialType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Truck Type</p>
                  <p className="font-medium">{booking.truckTypeNeeded}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Weight</p>
                  <p className="font-medium">
                    {booking.weight?.value || 'N/A'} {booking.weight?.unit || ''}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {formatDate(booking.createdAt, 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>

      {/* Add Note Modal */}
      <AddNoteModal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        booking={booking}
        onSuccess={() => {
          onBookingUpdate?.();
          fetchLatestLocation(); // Refresh data
        }}
      />

      {/* Update Status Modal */}
      <UpdateStatusModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        booking={booking}
        onSuccess={() => {
          onBookingUpdate?.();
          fetchLatestLocation(); // Refresh data
        }}
      />
    </Dialog>
  );
}
