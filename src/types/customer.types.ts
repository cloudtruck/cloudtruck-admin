export interface Customer {
  _id: string;
  userId?: string;
  companyName: string;
  gstNumber?: string;
  gstDocument?: string;
  contactPerson?: {
    name: string;
    phone: string;
    email?: string;
  };
  phone?: string;
  email?: string;
  address?: {
    street?: string;
    city: string;
    state: string;
    pincode?: string;
  };
  kycStatus: 'pending' | 'verified' | 'rejected' | 'not-submitted';
  status: 'active' | 'inactive' | 'blocked' | 'pending';
  totalBookings?: number;
  lastBookingDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFilters {
  kycStatus?: string;
  status?: string;
  search?: string;
  city?: string;
}
