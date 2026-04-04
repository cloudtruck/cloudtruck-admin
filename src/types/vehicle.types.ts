export interface Vehicle {
  _id: string;
  vehicleNumber: string;
  truckType: string;
  length: {
    value: number;
    unit: 'ft' | 'meter';
  };
  capacity: {
    value: number;
    unit: 'kg' | 'tons';
  };
  bodyType: string;
  rcDocument?: string;
  expiryDates?: {
    insurance?: string;
    fitness?: string;
    permit?: string;
    pollution?: string;
  };
  isVerified?: boolean;
  hasGPS?: boolean;
  hasFASTag?: boolean;
  ownerRef?: {
    kind: 'Driver' | 'Supplier';
    item:
      | string
      | {
          _id: string;
          name?: string;
          displayName?: string;
          companyName?: string;
          phone?: string;
        };
  };
  owner?:
    | string
    | {
        _id: string;
        name: string;
        phone?: string;
      };
  driver?:
    | string
    | {
        _id: string;
        name: string;
        phone?: string;
      };
  supplierOwner?: string | { _id: string };
  ownershipType?: 'own' | 'leased' | 'attached';
  registrationCity?: string;
  lastKnownLocation?: { type: 'Point'; coordinates: [number, number] };
  stats?: {
    totalTrips?: number;
    completedTrips?: number;
    lastTripDate?: string;
  };
  supplierCount?: number;
  region?: string;
  remarks?: string;
  status: 'active' | 'inactive' | 'under-maintenance' | 'retired';
  availability: 'available' | 'on-trip' | 'maintenance' | 'offline';
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export interface VehicleFilters {
  status?: string;
  truckType?: string;
  bodyType?: string;
  minCapacity?: number;
  search?: string;
  isVerified?: boolean;
  verificationStatus?: string;
  ownershipType?: 'own' | 'leased' | 'attached' | ('own' | 'leased' | 'attached')[];
}
