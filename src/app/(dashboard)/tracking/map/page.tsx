'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { bookingApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Booking } from '@/types';
import Link from 'next/link';

export default function MapViewPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveTrips();
  }, []);

  const fetchActiveTrips = async () => {
    setLoading(true);
    try {
      const response = await bookingApi.getAll({
        status: 'assigned,driver-en-route,reached-pickup,loaded,in-transit,reached-destination',
        limit: 100,
      });
      setBookings(response.data?.data?.bookings || []);
    } catch (error) {
      console.error('Failed to fetch trips:', error);
      toast.error('Failed to fetch trips');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Map View"
        description={`${bookings?.length || 0} active shipment${(bookings?.length || 0) !== 1 ? 's' : ''} on map`}
        // actions={
        //   <Button asChild variant="outline" size="sm">
        //     <Link href="/tracking/live-trips">
        //       <ArrowLeft className="h-4 w-4 mr-2" />
        //       Back to List
        //     </Link>
        //   </Button>
        // }
      />

      <div className="border rounded-lg bg-muted/50 p-8">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">Map Integration Coming Soon</p>
          <p className="text-sm">
            Leaflet/Google Maps integration will be implemented here
          </p>
          <p className="text-xs mt-4">
            Features:
            <br />
            • Real-time truck locations with markers
            <br />
            • Route polylines from pickup to drop
            <br />
            • Click markers for trip details
            <br />
            • Auto-refresh every 30 seconds
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.map((booking) => (
            <div key={booking._id} className="border rounded-lg p-4 bg-card">
              <p className="font-semibold">{booking.bookingId}</p>
              <p className="text-sm text-muted-foreground">
                {booking.pickup.city} → {booking.drop.city}
              </p>
              {booking.driver && (
                <p className="text-xs text-muted-foreground mt-1">
                  Driver: {booking.driver.name}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
