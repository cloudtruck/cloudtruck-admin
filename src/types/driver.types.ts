export interface BankAccount {
  _id: string;
  accountNumber?: string; // masked: ****1234
  ifscCode?: string;
  accountHolderName?: string;
  bankName?: string;
  branchName?: string;
  isPrimary: boolean;
}

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
    bankName?: string;
  };
  bankAccounts?: BankAccount[];
  status: 'available' | 'on-trip' | 'offline' | 'blocked';
  isVerified: boolean;
  verifiedAt?: string;
  kycStatus?: string;
  accountInfoStatus?: string;
  rejectionReason?: string;
  rejectedAt?: string;
  isBlacklisted: boolean;
  blacklistReason?: string;
  driverRole?: 'individual' | 'employee';
  supplierOwner?: { _id: string; displayName: string; companyName?: string };
  isApprovedBySupplier?: boolean;
  preferredTruckTypes?: string[];
  vehicles?: Array<{ _id: string; vehicleNumber: string; truckType: string }>;
  currentLocation?: {
    type: 'Point';
    coordinates: [number, number];
  };
  lastActive?: string;
  totalTrips?: number;
  rating?: number;
  city?: string;
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
