'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { GoogleMap, Marker, Polyline } from '@react-google-maps/api';
import { trackingApi } from '@/lib/api';
import { decodePolyline } from '@/lib/maps';
import { GoogleMapWrapper } from './GoogleMapWrapper';
import type { Booking } from '@/types';
import type { TrackingLocation, PlannedRoute } from '@/types/tracking.types';

interface ShipmentRouteMapProps {
  booking: Booking;
  currentLocation?: TrackingLocation;
  height?: string;
}

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

export function ShipmentRouteMap({ booking, currentLocation, height = '400px' }: ShipmentRouteMapProps) {
  const [routePath, setRoutePath] = useState<{ lat: number; lng: number }[]>([]);
  const [plannedPath, setPlannedPath] = useState<{ lat: number; lng: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const pickupPos = useMemo(() => {
    const loc = booking.pickup?.latLng;
    return {
      lat: loc?.coordinates[1] || 0,
      lng: loc?.coordinates[0] || 0,
    };
  }, [booking.pickup]);

  const dropPos = useMemo(() => {
    const loc = booking.drop?.latLng;
    return {
      lat: loc?.coordinates[1] || 0,
      lng: loc?.coordinates[0] || 0,
    };
  }, [booking.drop]);

  const currentPos = useMemo(() => {
    if (!currentLocation?.location?.coordinates) return null;
    return {
      lat: currentLocation.location.coordinates[1],
      lng: currentLocation.location.coordinates[0],
    };
  }, [currentLocation]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [historyRes, plannedRes] = await Promise.allSettled([
          trackingApi.getHistory(booking._id, { limit: 1000 }),
          trackingApi.getPlannedRoute(booking._id)
        ]);

        if (historyRes.status === 'fulfilled' && historyRes.value.data?.success) {
          const locations = historyRes.value.data.data.locations;
          if (locations.length > 0) {
            const path = locations.map(loc => ({
              lat: loc.location.coordinates[1],
              lng: loc.location.coordinates[0]
            }));
            setRoutePath(path);
          }
        }

        if (plannedRes.status === 'fulfilled' && plannedRes.value.data?.success) {
          const polyline = plannedRes.value.data.data.polyline;
          if (polyline) {
            setPlannedPath(decodePolyline(polyline));
          }
        }

        if (plannedRes.status === 'rejected' || !plannedRes.value.data?.data?.polyline) {
           // If no planned route, fallback to straight line if no history
           if (routePath.length === 0) {
             setPlannedPath([pickupPos, dropPos]);
           }
        }
      } catch (error) {
        console.error('Failed to fetch tracking data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [booking._id, pickupPos, dropPos]);

  const center = useMemo(() => {
    if (currentPos) return currentPos;
    return {
      lat: (pickupPos.lat + dropPos.lat) / 2,
      lng: (pickupPos.lng + dropPos.lng) / 2,
    };
  }, [currentPos, pickupPos, dropPos]);

  return (
    <GoogleMapWrapper>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height }}
        center={center}
        zoom={7}
        options={mapOptions}
      >
        {/* Pickup Marker */}
        <Marker
          position={pickupPos}
          label={{
            text: 'P',
            color: 'white',
            fontWeight: 'bold'
          }}
          title={`Pickup: ${booking.pickup.city}`}
        />

        {/* Drop Marker */}
        <Marker
          position={dropPos}
          label={{
            text: 'D',
            color: 'white',
            fontWeight: 'bold'
          }}
          title={`Drop: ${booking.drop.city}`}
        />

        {/* Current Location Marker */}
        {currentPos && (
          <Marker
            position={currentPos}
            icon={{
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 5,
              fillColor: '#3b82f6',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#ffffff',
              rotation: currentLocation?.heading || 0,
            }}
            title="Current Location"
          />
        )}

        {/* Route History Polyline */}
        {routePath.length > 0 && (
          <Polyline
            path={routePath}
            options={{
              strokeColor: '#3b82f6',
              strokeOpacity: 0.8,
              strokeWeight: 4,
            }}
          />
        )}
        
        {/* Planned Route Polyline */}
        {plannedPath.length > 0 && (
          <Polyline
            path={plannedPath}
            options={{
              strokeColor: '#94a3b8',
              strokeOpacity: 0.6,
              strokeWeight: 2,
              icons: [{
                icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 2 },
                offset: '0',
                repeat: '10px'
              }],
            }}
          />
        )}
      </GoogleMap>
    </GoogleMapWrapper>
  );
}
