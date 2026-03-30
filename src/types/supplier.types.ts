import type { BankAccount } from './driver.types';
export type { BankAccount };

export interface SupplierDocument {
  _id: string;
  url: string;
  fileType?: string;
  originalName?: string;
}

export interface Supplier {
  _id: string;
  supplierType: 'company' | 'individual';
  // Identity anchors — one will be set depending on supplierType
  user?: { _id: string; phone: string; email?: string; status?: string };
  driver?: { _id: string; name: string; phone?: string };
  displayName: string;
  companyName?: string;
  gstin?: string;
  companyRegistrationNumber?: string;
  panNumber?: string;
  aadharNumber?: string;
  phone: string;
  email?: string;
  city?: string;
  verificationStatus: 'pending' | 'documents-submitted' | 'verified' | 'rejected';
  verifiedBy?: { _id: string; name: string };
  verifiedAt?: string;
  rejectionReason?: string;
  documents?: {
    gstCertificate?: SupplierDocument;
    companyRegistration?: SupplierDocument;
    cancelledCheque?: SupplierDocument;
    panDocument?: SupplierDocument;
    aadharDocument?: SupplierDocument;
  };
  bankDetails?: {
    accountNumber?: string; // masked: ****1234
    ifscCode?: string;
    accountHolderName?: string;
    bankName?: string;
  };
  bankAccounts?: BankAccount[];
  // totalVehicles intentionally absent — derived live from Vehicle collection
  fleetStats: {
    totalDrivers: number;
    activeDrivers: number;
  };
  performance: {
    totalBookings: number;
    completedBookings: number;
    totalRevenue: number;
  };
  isBlacklisted: boolean;
  blacklistReason?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierPaymentRecord {
  _id: string;
  supplier: { _id: string; displayName: string; companyName?: string };
  booking: { _id: string; bookingId: string };
  amount: number;
  paymentType: 'advance' | 'balance' | 'detention' | 'adjustment';
  paymentMethod: 'neft' | 'rtgs' | 'cheque' | 'cash' | 'upi';
  /** Two-step: pending → approved (manager) → paid (accounts + UTR) */
  status: 'pending' | 'approved' | 'paid' | 'failed' | 'cancelled';
  referenceNumber?: string;
  transactionDate?: string;
  paidAt?: string;
  remarks?: string;
  bankDetailsSnapshot?: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    bankName?: string;
  };
  requestedBy?: { _id: string; name: string };
  requestedAt: string;
  approvedBy?: { _id: string; name: string };
  approvedAt?: string;
  paidBy?: { _id: string; name: string };
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierAvailableDriver {
  _id: string;
  name: string;
  phone: string;
  avatar?: string;
  availability: 'available' | 'on-trip' | 'offline';
  currentBooking?: string | null;
  nextBooking?: string | null;
  licenseNumber?: string;
  vehicles: Array<{
    _id: string;
    vehicleNumber: string;
    truckType: string;
    availability: string;
  }>;
}

export interface SupplierFilters {
  supplierType?: 'company' | 'individual';
  verificationStatus?: string;
  isBlacklisted?: boolean;
  search?: string;
  city?: string;
  page?: number;
  limit?: number;
}

export interface CreateSupplierPayload {
  displayName: string;
  companyName: string;
  phone: string;
  panNumber: string;
  gstin?: string;
  aadharNumber?: string;
  companyRegistrationNumber?: string;
  email?: string;
  city?: string;
  bankDetails?: {
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
    bankName?: string;
  };
}
