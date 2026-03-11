export interface Driver {
  _id: string;
  userId: string;
  name: string;
  phone: string;
  email?: string;
  profilePhoto?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  licensePhoto?: string;
  aadhaarNumber?: string;
  aadhaarPhoto?: string;
  panNumber?: string;
  panPhoto?: string;
  chequePhoto?: string;
  tdsDocument?: string;
  gstin?: string;
  bankDetails?: {
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
  };
  status: 'available' | 'on-trip' | 'offline' | 'blocked';
  isVerified: boolean;
  verifiedAt?: string;
  kycStatus?: string;
  accountInfoStatus?: string;
  rejectionReason?: string;
  rejectedAt?: string;
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
  lastDropCity?: string;
  isReturnTrip?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DriverFilters {
  status?: string;
  isVerified?: boolean;
  kycStatus?: string;
  accountInfoStatus?: string;
  isBlacklisted?: boolean;
  search?: string;
  truckType?: string;
  city?: string;
}
