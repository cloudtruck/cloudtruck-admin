'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Booking } from '@/types';
import { MapPin, Navigation } from 'lucide-react';

interface RouteMapProps {
  booking: Booking;
}

export function RouteMap({ booking }: RouteMapProps) {
  // TODO: Implement actual map integration with Leaflet or Google Maps
  // For now, showing a placeholder

  const pickupCoords = booking.pickup.latLng.coordinates;
  const dropCoords = booking.drop.latLng.coordinates;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Route Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Map Placeholder */}
        <div className="relative w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center space-y-4">
            <Navigation className="h-16 w-16 text-muted-foreground mx-auto" />
            <div>
              <p className="text-lg font-medium text-muted-foreground">
                Map View (Coming Soon)
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Interactive route map will be displayed here
              </p>
            </div>
          </div>
        </div>

        {/* Route Details */}
        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Pickup Location</p>
              <p className="text-sm text-green-700">{booking.pickup.city}</p>
              <p className="text-xs text-green-600 mt-1">{booking.pickup.address}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Coordinates: {pickupCoords[1].toFixed(6)}, {pickupCoords[0].toFixed(6)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <MapPin className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Drop Location</p>
              <p className="text-sm text-red-700">{booking.drop.city}</p>
              <p className="text-xs text-red-600 mt-1">{booking.drop.address}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Coordinates: {dropCoords[1].toFixed(6)}, {dropCoords[0].toFixed(6)}
              </p>
            </div>
          </div>

          {/* Distance Info (Placeholder) */}
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900">Estimated Distance</p>
            <p className="text-lg font-bold text-blue-900">~350 km</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
