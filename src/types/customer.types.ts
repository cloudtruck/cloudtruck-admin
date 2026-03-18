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
  paymentTerms?: 'prepaid' | 'postpaid' | 'credit';
  totalBookings?: number;
  lastBookingDate?: string;
  createdAt: string;
  updatedAt: string;

  // Extended profile fields
  pan?: string;
  transporter?: string;
  customerType?: string;
  podType?: string;
  customerAdmin?: string;
  materialType?: string;
  customerCode?: string;
  companyType?: string;
  locations?: Array<{
    _id?: string;
    source?: string;
    pincode?: string;
    loadingPoint?: string;
    locationName?: string;
    address?: string;
    supervisor?: string;
    createdAt?: string;
  }>;
  charges?: Array<{
    _id?: string;
    type?: string;
    amount?: number;
    remarks?: string;
    chargeType?: 'add' | 'reduce';
    createdAt?: string;
  }>;
  comments?: Array<{
    _id?: string;
    topic?: string;
    comment?: string;
    createdBy?: string;
    createdAt?: string;
  }>;
}

export interface CustomerFilters {
  kycStatus?: string;
  status?: string;
  search?: string;
  city?: string;
}
