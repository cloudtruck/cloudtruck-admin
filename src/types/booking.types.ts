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
  images?: string[];
  createdAt: string;
  updatedAt: string;
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

export interface BookingStats {
  newRequests: number;
  assigned: number;
  inTransit: number;
  delivered: number;
  podPending: number;
  total: number;
}
