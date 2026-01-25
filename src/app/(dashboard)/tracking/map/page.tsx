'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { trackingApi } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Booking } from '@/types';
import type { TrackingLocation } from '@/types/tracking.types';
import Link from 'next/link';
import { GoogleMapWrapper } from '@/components/tracking/GoogleMapWrapper';
import { LiveTrackingMap } from '@/components/tracking/LiveTrackingMap';

export default function MapViewPage() {
  const [trips, setTrips] = useState<(Booking & { lastLocation?: TrackingLocation })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveTrips();
  }, []);

  const fetchLiveTrips = async () => {
    setLoading(true);
    try {
      const response = await trackingApi.getLiveTrips();
      // Adjust according to API response structure
      const data = response.data?.data || [];
      setTrips(data);
    } catch (error) {
      console.error('Failed to fetch live trips:', error);
      toast.error('Failed to fetch live trips');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Map View"
        description={`${trips?.length || 0} active shipment${(trips?.length || 0) !== 1 ? 's' : ''} on map`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchLiveTrips} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/tracking/live-trips">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Link>
            </Button>
          </div>
        }
      />

      <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
        <GoogleMapWrapper>
          <LiveTrackingMap trips={trips} />
        </GoogleMapWrapper>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {trips.map((trip) => (
          <div key={trip._id} className="border rounded-lg p-4 bg-card hover:bg-accent/5 transition-colors cursor-pointer">
            <div className="flex justify-between items-start mb-1">
              <p className="font-semibold text-primary">{trip.bookingId}</p>
              <div className={`h-2 w-2 rounded-full ${trip.lastLocation ? 'bg-green-500' : 'bg-gray-300'}`} title={trip.lastLocation ? 'Live' : 'Offline'} />
            </div>
            <p className="text-sm font-medium">
              {trip.pickup.city} → {trip.drop.city}
            </p>
            {trip.driver && (
              <p className="text-xs text-muted-foreground mt-1">
                Driver: {trip.driver.name}
              </p>
            )}
            {trip.lastLocation && (
              <div className="mt-2 text-[10px] text-muted-foreground">
                Last seen: {format(new Date(trip.lastLocation.timestamp || trip.lastLocation.createdAt), 'HH:mm')}
                {trip.lastLocation.speed ? ` • ${Math.round(trip.lastLocation.speed)} km/h` : ''}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
