export interface Booking {
  _id: string;
  bookingId: string;
  customer: {
    _id: string;
    companyName: string;
    contactPerson?: string;
    phone?: string;
  };
  pickup: {
    city: string;
    address: string;
    latLng: {
      type: 'Point';
      coordinates: [number, number];
    };
  };
  drop: {
    city: string;
    address: string;
    latLng: {
      type: 'Point';
      coordinates: [number, number];
    };
  };
  materialType: string;
  weight: {
    value: number;
    unit: 'kg' | 'tons';
  };
  truckTypeNeeded: string;
  length?: {
    value: number;
    unit: 'ft' | 'm';
  };
  bodyType?: string;
  loadDateTime: string;
  status: string;
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'failed';
  expectedAmount?: number;
  advanceRequired?: number;
  additionalInstructions?: string;
  isHazardous?: boolean;
  isFragile?: boolean;
  requiresTemperatureControl?: boolean;
  driver?: {
    _id: string;
    name: string;
    phone?: string;
  };
  vehicle?: {
    _id: string;
    vehicleNumber: string;
    truckType: string;
  };
  assignedAt?: string;
  podDetails?: {
    receiverName?: string;
    receiverPhone?: string;
    deliveredAt?: string;
    remarks?: string;
  };
  cancellationDetails?: {
    cancelledAt?: string;
    reason?: string;
  };
  statusHistory?: Array<{
    status: string;
    timestamp: string;
    notes?: string;
  }>;
  images?: string[];
  lastKnownLocation?: {
    type: 'Point';
    coordinates: [number, number];
  };
  lastLocationUpdate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingPayload {
  customerId: string;
  pickupCity: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropCity: string;
  dropAddress: string;
  dropLat: number;
  dropLng: number;
  materialType: string;
  weight: number;
  truckType: string;
  bodyType?: string;
  loadDate?: string;
  expectedAmount?: number;
  advanceRequired?: number;
  additionalInstructions?: string;
  isHazardous?: boolean;
  isFragile?: boolean;
  requiresTemperatureControl?: boolean;
}

export interface BookingFilters {
  status?: string;
  paymentStatus?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  truckType?: string;
  city?: string;
  customerId?: string;
  driverId?: string;
}

export interface ChangeMetric {
  value: number; // percent value, e.g., 12 for 12%
  isPositive: boolean;
}

export interface BookingStats {
  newRequests: number;
  assigned: number;
  inTransit: number;
  delivered: number;
  podPending: number;
  cancelled: number;
  total: number;

  // Period-over-period change metrics (percent)
  newRequestsChange?: ChangeMetric;
  assignedChange?: ChangeMetric;
  inTransitChange?: ChangeMetric;
  deliveredChange?: ChangeMetric;
  podPendingChange?: ChangeMetric;
}

export interface Activity {
  _id: string;
  type: 'booking_created' | 'driver_assigned' | 'status_update' | 'pod_uploaded' | 'payment_received';
  message: string;
  bookingId?: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

export interface TrendData {
  date: string;
  bookings: number;
  delivered: number;
}
