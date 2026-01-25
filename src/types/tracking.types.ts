export interface TrackingLocation {
  _id: string;
  booking: string;
  driver: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  city?: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
  createdAt: string;
}

export interface TrackingHistory {
  locations: TrackingLocation[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface PlannedRoute {
  polyline: string;
  distance: number;
  duration: number;
  calculatedAt: string;
}
