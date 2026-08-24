export interface Booking {
  _id: string;
  bookingId: string;
  customer: {
    _id: string;
    companyName: string;
    contactPerson?: string;
    phone?: string;
    gst?: string;
    pan?: string;
    address?: { street?: string; city?: string; state?: string; pincode?: string; country?: string };
    billingAddress?: { street?: string; city?: string; state?: string; pincode?: string; country?: string };
  };
  pickup: {
    city: string;
    state?: string;
    address: string;
    pincode?: string;
    latLng: {
      type: 'Point';
      coordinates: [number, number];
    };
    contactPerson?: { name?: string; phone?: string; gstNumber?: string };
  };
  drop: {
    city: string;
    state?: string;
    address: string;
    pincode?: string;
    latLng: {
      type: 'Point';
      coordinates: [number, number];
    };
    contactPerson?: { name?: string; phone?: string; gstNumber?: string };
  };
  materialType: string;
  weight: {
    value: number;
    unit: 'kg' | 'tons' | 'quintal';
  };
  truckTypeNeeded: string;
  length?: {
    value: number;
    unit: 'ft' | 'm';
  };
  bodyType?: string;
  loadDateTime: string;
  status: string;
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'failed';
  expectedAmount?: number;
  advanceRequired?: number;
  additionalInstructions?: string;
  isHazardous?: boolean;
  isFragile?: boolean;
  requiresTemperatureControl?: boolean;
  driver?: {
    _id: string;
    name: string;
    phone?: string;
  };
  vehicle?: {
    _id: string;
    vehicleNumber: string;
    truckType: string;
  };
  assignedAt?: string;
  podDetails?: {
    receiverName?: string;
    receiverPhone?: string;
    deliveredAt?: string;
    remarks?: string;
    signatureUrl?: string;
    uploadedBy?: string | { _id: string; name: string };
    uploadedAt?: string;
    ackDate?: string;
    verifiedBy?: string | { _id: string; name: string };
    verifiedAt?: string;
    receivedBy?: string | { _id: string; name: string };
    approvedBy?: string | { _id: string; name: string };
    courier?: string;
    docketNo?: string;
    ackNo?: string;
  } | null;
  cancellationDetails?: {
    cancelledAt?: string;
    reason?: string;
  };
  statusHistory?: Array<{
    status: string;
    timestamp: string;
    notes?: string;
  }>;
  images?: string[];
  loadingDocuments?: Array<{ _id: string; url: string; fileType?: string }>;
  otherDocuments?: Array<{ _id: string; url: string; fileType?: string }>;
  lastKnownLocation?: {
    type: 'Point';
    coordinates: [number, number];
  };
  lastLocationUpdate?: string;
  laneCode?: string;
  isAdhoc?: boolean;
  loadType?: 'FTL' | 'LTL' | 'PTL' | null;
  exim?: 'domestic' | 'import' | 'export';
  trafficController?: { _id: string; name: string; phone?: string | null };
  supervisor?: { _id: string; name: string; phone?: string | null };
  // Location master data
  sourceCode?: string;
  destinationCode?: string;
  supplierEntity?: {
    _id: string;
    displayName: string;
    companyName?: string;
    supplierType?: string;
    phone?: string;
  };
  // Pricing
  supplierPrice?: number;
  customerPrice?: number;
  weightUnit?: 'kg' | 'tons' | 'quintal';
  ratePerTon?: boolean;
  // Indent lifecycle
  expiryTime?: string;
  postToSupplier?: boolean;
  remarks?: string;
  numberOfTrucks?: number;
  interestedDrivers?: string[];
  interestedCount?: number;
  marketTrucks?: number;
  matchedOwnCount?: number;
  matchedMarketCount?: number;
  // Post-creation operational
  lrNumber?: string;
  lrDetails?: {
    lrNumber?: string;
    lrDate?: string;
    remarks?: string;
    uploadedAt?: string;
    uploadedBy?: string | { _id: string; name: string };
    documents?: Array<{ _id: string; url: string; fileType?: string; originalName?: string }>;
  } | null;
  boeNumber?: string;
  jobNo?: string;
  hireChallan?: string;
  invoiceNo?: string;
  invoiceDate?: string;
  invoiceDueDate?: string;
  ewayBillNo?: string;
  shipmentNo?: string;
  containerNo?: string;
  poNumber?: string;
  supplier?: string | boolean;
  supplierType?: string;
  truckSubType?: string;
  bookedBy?: string | { _id: string; name: string };
  customerCharge?: number;
  supplierCharge?: number;
  expense?: number;
  supplierTds?: number;
  lastComment?: string;
  customerDetentionCharge?: number;
  supplierDetentionCharge?: number;
  actualKm?: number;
  createdByStaff?: { _id: string; name: string } | null;
  // Direct Load / Direct Invoice fields
  bookingType?: 'indent' | 'direct-load' | 'direct-invoice' | 'direct-lr';
  customerAdvancePct?: number;
  supplierAdvancePct?: number;
  customerOnDelivery?: number;
  customerPaysSupplier?: number;
  supplierPaysSupplier?: number;
  customerPodBalance?: number;
  supplierPodBalance?: number;
  invoiceTo?: 'Customer' | 'Supplier' | 'Both';
  invoiceParty?: 'consignor' | 'consignee' | 'customer';
  payTo?: 'Supplier' | 'Driver' | 'Customer';
  accountNo?: string;
  podType?: 'Hard' | 'Soft';
  tripKm?: number;
  expectedDeliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingPayload {
  customerId: string;
  pickupCity: string;
  pickupState?: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropCity: string;
  dropState?: string;
  dropAddress: string;
  dropLat: number;
  dropLng: number;
  materialType: string;
  weight: number;
  weightUnit?: 'kg' | 'tons' | 'quintal';
  truckType: string;
  bodyType?: string;
  numberOfTrucks?: number;
  loadDate?: string;
  expectedAmount?: number;
  advanceRequired?: number;
  additionalInstructions?: string;
  isHazardous?: boolean;
  isFragile?: boolean;
  requiresTemperatureControl?: boolean;
  // Digitify / indent fields
  laneCode?: string;
  sourceCode?: string;
  destinationCode?: string;
  supplierEntity?: string; // Supplier ObjectId for create/update payload
  loadType?: 'FTL' | 'LTL' | 'PTL' | null;
  exim?: 'domestic' | 'import' | 'export';
  trafficController?: string; // Staff ID for create/update payload
  supplierPrice?: number;
  customerPrice?: number;
  ratePerTon?: boolean;
  expiryTime?: string;
  postToSupplier?: boolean;
  remarks?: string;
  // Direct Load / Direct Invoice fields
  vehicleId?: string;
  driverId?: string;
  bookingType?: 'indent' | 'direct-load' | 'direct-invoice' | 'direct-lr';
  customerAdvancePct?: number;
  supplierAdvancePct?: number;
  customerOnDelivery?: number;
  customerPaysSupplier?: number;
  supplierPaysSupplier?: number;
  customerPodBalance?: number;
  supplierPodBalance?: number;
  invoiceTo?: 'Customer' | 'Supplier' | 'Both';
  invoiceParty?: 'consignor' | 'consignee' | 'customer';
  payTo?: 'Supplier' | 'Driver' | 'Customer';
  accountNo?: string;
  podType?: 'Hard' | 'Soft';
  tripKm?: number;
  // LR reference fields
  invoiceNo?: string;
  invoiceDate?: string;
  invoiceDueDate?: string;
  ewayBillNo?: string;
  pickupContactName?: string;
  pickupContactPhone?: string;
  pickupContactGst?: string;
  dropContactName?: string;
  dropContactPhone?: string;
  dropContactGst?: string;
}

export interface BookingFilters {
  status?: string;
  paymentStatus?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  truckType?: string;
  city?: string;
  customerId?: string;
  driverId?: string;
  bookingType?: 'indent' | 'direct-load' | 'direct-invoice' | 'direct-lr';
}

export interface ChangeMetric {
  value: number; // percent value, e.g., 12 for 12%
  isPositive: boolean;
}

export interface BookingStats {
  newRequests: number;
  assigned: number;
  inTransit: number;
  delivered: number;
  podPending: number;
  cancelled: number;
  total: number;

  // Period-over-period change metrics (percent)
  newRequestsChange?: ChangeMetric;
  assignedChange?: ChangeMetric;
  inTransitChange?: ChangeMetric;
  deliveredChange?: ChangeMetric;
  podPendingChange?: ChangeMetric;
}

export interface Activity {
  _id: string;
  type:
    'booking_created' | 'driver_assigned' | 'status_update' | 'pod_uploaded' | 'payment_received';
  message: string;
  bookingId?: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

export interface TrendData {
  date: string;
  bookings: number;
  delivered: number;
}

export interface UnloadingTruck {
  bookingId: string;
  bookingDbId: string;
  vehicle: { _id: string; vehicleNumber: string; truckType: string } | null;
  driver: { _id: string; name: string; phone: string } | null;
  dropCity: string;
  status: string;
  updatedAt: string;
}
