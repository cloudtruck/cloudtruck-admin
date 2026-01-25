'use client';

import React from 'react';
import { useJsApiLoader, type Libraries } from '@react-google-maps/api';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface GoogleMapWrapperProps {
  children: React.ReactNode;
}

// Explicitly use the Libraries type from the package to resolve union mismatch
const libraries = ["geometry", "places"] as unknown as Libraries;

export function GoogleMapWrapper({ children }: GoogleMapWrapperProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  if (loadError) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600">
        <p>Error loading Google Maps. Please check your API key.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center rounded-lg border border-gray-100 bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground font-medium">Loading maps...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
