'use client';

import { useState, useCallback } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { GoogleMapWrapper } from '@/components/tracking/GoogleMapWrapper';
import { Input } from '@/components/ui/input';
import { Search, Inbox } from 'lucide-react';
import Link from 'next/link';
import type { Vehicle } from '@/types';

// ─── Map config ───────────────────────────────────────────────────────────────

const MAP_CONTAINER = { width: '100%', height: '590px' };
const DEFAULT_CENTER = { lat: 11.0, lng: 77.5 }; // South India
const DEFAULT_ZOOM = 6;

// ─── Inner map (needs to be inside GoogleMapWrapper) ─────────────────────────

function MapInner({ vehicles }: { vehicles: Vehicle[] }) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [search, setSearch] = useState('');
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');

  const onLoad = useCallback((m: google.maps.Map) => setMap(m), []);
  const onUnmount = useCallback(() => setMap(null), []);

  // Vehicles with known coordinates
  const mapped = vehicles.filter(
    (v) =>
      v.lastKnownLocation?.coordinates?.[0] &&
      v.lastKnownLocation?.coordinates?.[1]
  );

  const filtered = search
    ? mapped.filter((v) =>
        v.vehicleNumber.toLowerCase().includes(search.toLowerCase())
      )
    : mapped;

  const sidebarList = search
    ? vehicles.filter((v) =>
        v.vehicleNumber.toLowerCase().includes(search.toLowerCase())
      )
    : vehicles;

  return (
    <div className="flex gap-0 border rounded overflow-hidden bg-white">
      {/* ── Map ── */}
      <div className="relative flex-1">
        {/* Map / Satellite toggle */}
        <div className="absolute top-3 left-3 z-10 flex rounded overflow-hidden shadow-sm border bg-white text-xs font-medium">
          <button
            onClick={() => setMapType('roadmap')}
            className={`px-3 py-1.5 transition-colors ${mapType === 'roadmap' ? 'bg-white text-gray-800' : 'bg-gray-100 text-gray-500'}`}
          >
            Map
          </button>
          <button
            onClick={() => setMapType('satellite')}
            className={`px-3 py-1.5 transition-colors ${mapType === 'satellite' ? 'bg-white text-gray-800' : 'bg-gray-100 text-gray-500'}`}
          >
            Satellite
          </button>
        </div>

        <GoogleMap
          mapContainerStyle={MAP_CONTAINER}
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          onLoad={onLoad}
          onUnmount={onUnmount}
          mapTypeId={mapType}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            zoomControl: true,
          }}
        >
          {filtered.map((vehicle) => {
            const [lng, lat] = vehicle.lastKnownLocation!.coordinates;
            return (
              <Marker
                key={vehicle._id}
                position={{ lat, lng }}
                title={vehicle.vehicleNumber}
                onClick={() => setSelected(vehicle)}
              />
            );
          })}

          {selected && selected.lastKnownLocation && (
            <InfoWindow
              position={{
                lat: selected.lastKnownLocation.coordinates[1],
                lng: selected.lastKnownLocation.coordinates[0],
              }}
              onCloseClick={() => setSelected(null)}
            >
              <div className="text-xs space-y-1 min-w-[120px]">
                <p className="font-semibold text-blue-600 text-sm">
                  {selected.vehicleNumber}
                </p>
                <p className="text-gray-600">{selected.truckType}</p>
                <p className="text-gray-500 capitalize">{selected.availability}</p>
                <Link
                  href={`/vehicles/${selected._id}`}
                  className="text-blue-500 hover:underline"
                >
                  View details →
                </Link>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      {/* ── Right sidebar ── */}
      <div className="w-64 border-l flex flex-col bg-white">
        {/* Search */}
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="search Truck"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {sidebarList.length === 0 ? (
            <div className="flex flex-col items-center gap-2 text-gray-400 py-12">
              <Inbox className="h-8 w-8 opacity-30" />
              <span className="text-sm">No data</span>
            </div>
          ) : (
            sidebarList.map((vehicle) => {
              const hasLocation = !!vehicle.lastKnownLocation?.coordinates;
              return (
                <button
                  key={vehicle._id}
                  onClick={() => {
                    if (hasLocation && map) {
                      const [lng, lat] = vehicle.lastKnownLocation!.coordinates;
                      map.panTo({ lat, lng });
                      map.setZoom(12);
                      setSelected(vehicle);
                    }
                  }}
                  className={`w-full text-left px-3 py-2.5 border-b hover:bg-blue-50 transition-colors
                    ${selected?._id === vehicle._id ? 'bg-blue-50' : ''}`}
                >
                  <p className="text-sm font-semibold text-blue-600">
                    {vehicle.vehicleNumber}
                  </p>
                  <p className="text-xs text-gray-500">
                    {vehicle.truckType}
                    {!hasLocation && (
                      <span className="ml-1 text-gray-300">· no GPS</span>
                    )}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function VehicleMapView({ vehicles }: { vehicles: Vehicle[] }) {
  return (
    <GoogleMapWrapper>
      <MapInner vehicles={vehicles} />
    </GoogleMapWrapper>
  );
}
