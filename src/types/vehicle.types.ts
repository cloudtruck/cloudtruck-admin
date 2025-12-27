export interface Vehicle {
  _id: string;
  vehicleNumber: string;
  truckType: string;
  length: {
    value: number;
    unit: 'ft' | 'm';
  };
  capacity: {
    value: number;
    unit: 'kg' | 'tons';
  };
  bodyType: 'open' | 'closed' | 'container';
  rcDocument?: string;
  fitnessExpiry?: string;
  permitExpiry?: string;
  isVerified?: boolean;
  hasGPS?: boolean;
  hasFASTag?: boolean;
  owner?: {
    _id: string;
    name: string;
  };
  driver?: {
    _id: string;
    name: string;
  };
  status: 'available' | 'on-trip' | 'maintenance' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface VehicleFilters {
  status?: string;
  truckType?: string;
  bodyType?: string;
  search?: string;
  isVerified?: boolean;
}
