export interface Driver {
  _id: string;
  userId: string;
  name: string;
  phone: string;
  email?: string;
  profilePhoto?: string;
  licenseNumber?: string;
  licensePhoto?: string;
  aadharNumber?: string;
  aadharPhoto?: string;
  panNumber?: string;
  panPhoto?: string;
  bankDetails?: {
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
  };
  status: 'available' | 'on-trip' | 'offline' | 'blocked';
  isVerified: boolean;
  verifiedAt?: string;
  isBlacklisted: boolean;
  blacklistReason?: string;
  preferredTruckTypes?: string[];
  currentLocation?: {
    type: 'Point';
    coordinates: [number, number];
  };
  lastActive?: string;
  totalTrips?: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DriverFilters {
  status?: string;
  isVerified?: boolean;
  isBlacklisted?: boolean;
  search?: string;
  truckType?: string;
  city?: string;
}
