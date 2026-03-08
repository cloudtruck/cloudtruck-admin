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
  owner?: string | {
    _id: string;
    name: string;
    phone?: string;
  };
  driver?: string | {
    _id: string;
    name: string;
    phone?: string;
  };
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
  search?: string;
  isVerified?: boolean;
  verificationStatus?: string;
}
