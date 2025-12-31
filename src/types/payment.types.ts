export interface Payment {
  _id: string;
  booking: {
    _id: string;
    bookingId: string;
    customer: {
      _id: string;
      companyName: string;
      contactPerson?: {
        name: string;
        phone: string;
        email?: string;
      };
    };
    pickup?: {
      city: string;
    };
    drop?: {
      city: string;
    };
    materialType?: string;
    truckTypeNeeded?: string;
  };
  
  amount: number;
  advanceAmount?: number;
  balanceAmount?: number;
  paymentType?: 'advance' | 'balance' | 'full';
  paymentMethod?: 'online' | 'neft' | 'rtgs' | 'cash';
  paymentStatus: 'unpaid' | 'paid' | 'partial' | 'failed';
  transactionId?: string;
  transactionReference?: string;
  paidAt?: string;
  markedReceivedBy?: {
    _id: string;
    name: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentFilters {
  paymentStatus?: string;
  paymentMethod?: string;
  paymentType?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
}
