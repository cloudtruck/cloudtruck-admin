'use client';

import React, { useState, useEffect } from 'react';
import { GoogleMap, Marker, InfoWindow, MarkerClusterer } from '@react-google-maps/api';
import { useTrackingWebSocket } from '@/hooks/useWebSocket';
import { getTruckIcon } from '@/lib/maps';
import { StatusBadge } from '@/components/common/StatusBadge';
import { format } from 'date-fns';
import { MapPin, Navigation, Truck } from 'lucide-react';
import type { Booking } from '@/types';
import type { TrackingLocation } from '@/types/tracking.types';

interface LiveTrip extends Booking {
  lastLocation?: TrackingLocation;
}

interface LiveTrackingMapProps {
  trips: LiveTrip[];
}

const mapContainerStyle = {
  width: '100%',
  height: '70vh',
};

const defaultCenter = {
  lat: 20.5937, // Center of India
  lng: 78.9629,
};

const options = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

export function LiveTrackingMap({ trips }: LiveTrackingMapProps) {
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [realtimeUpdates, setRealtimeUpdates] = useState<Record<string, TrackingLocation>>({});
  const { onLocationUpdate, subscribeToBooking } = useTrackingWebSocket();

  const tripsWithUpdates = trips.map(trip => ({
    ...trip,
    lastLocation: realtimeUpdates[trip._id] || trip.lastLocation
  })) as LiveTrip[];

  const selectedTrip = tripsWithUpdates.find(t => t._id === selectedTripId);

  useEffect(() => {
    // Subscribe to all active trips for real-time updates
    trips.forEach(trip => {
      subscribeToBooking(trip._id);
    });
  }, [trips, subscribeToBooking]);

  useEffect(() => {
    const unsubscribe = onLocationUpdate((data: unknown) => {
      const update = data as TrackingLocation;
      setRealtimeUpdates(prev => ({
        ...prev,
        [update.booking]: update
      }));
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [onLocationUpdate]);

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      zoom={5}
      center={defaultCenter}
      options={options}
    >
      <MarkerClusterer>
        {(clusterer) => (
          <>
            {tripsWithUpdates
              .filter(trip => trip.lastLocation?.location?.coordinates)
              .map((trip) => (
                <Marker
                  key={trip._id}
                  position={{
                    lat: trip.lastLocation!.location.coordinates[1],
                    lng: trip.lastLocation!.location.coordinates[0],
                  }}
                  clusterer={clusterer}
                  onClick={() => setSelectedTripId(trip._id)}
                  title={trip.bookingId}
                  icon={getTruckIcon(trip.status, trip.lastLocation?.heading)}
                />
              ))}
          </>
        )}
      </MarkerClusterer>

      {selectedTrip && selectedTrip.lastLocation && (
        <InfoWindow
          position={{
            lat: selectedTrip.lastLocation.location.coordinates[1],
            lng: selectedTrip.lastLocation.location.coordinates[0],
          }}
          onCloseClick={() => setSelectedTripId(null)}
        >
          <div className="p-2 min-w-[200px]">
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-sm">{selectedTrip.bookingId}</span>
              <StatusBadge status={selectedTrip.status} />
            </div>
            
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-red-500" />
                <span className="font-medium">{selectedTrip.pickup.city} → {selectedTrip.drop.city}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Truck className="h-3 w-3 text-blue-500" />
                <span>{selectedTrip.driver?.name || 'No driver'}</span>
              </div>

              {selectedTrip.lastLocation.speed !== undefined && (
                <div className="flex items-center gap-1">
                  <Navigation className="h-3 w-3 text-green-500" />
                  <span>Speed: {Math.round(selectedTrip.lastLocation.speed)} km/h</span>
                </div>
              )}

              <div className="mt-2 text-[10px] text-muted-foreground border-t pt-1">
                Last update: {format(new Date(selectedTrip.lastLocation.timestamp || selectedTrip.lastLocation.createdAt), 'PPpp')}
              </div>
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
