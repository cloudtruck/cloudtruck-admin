export enum PartBUpdateReason {
  VehicleBreakdown = 'Vehicle Breakdown',
  MultiVehicleShipment = 'Multi-vehicle Shipment',
  EmergencyReplacement = 'Emergency Replacement',
  CustomsDelay = 'Customs Delay',
  Other = 'Other',
}

export enum EwayBillStatus {
  Active = 'active',
  Expired = 'expired',
  Expiring = 'expiring',
  Cancelled = 'cancelled',
}

export enum PartBSyncStatus {
  AutoSynced = 'auto-synced',
  Pending = 'pending',
  ManualOverride = 'manual-override',
}

export interface PartADetails {
  consignorGSTIN: string;
  consignorLegalName: string;
  consignorTradeName?: string;
  consignorAddress: string;
  consignorState: string;
  consigneeGSTIN: string;
  consigneeLegalName: string;
  consigneeTradeName?: string;
  consigneeAddress: string;
  consigneeState: string;
  documentNumber: string;
  documentType: string;
  documentDate: string;
  items: Array<{
    hsnCode: string;
    description: string;
    quantity: number;
    unit: string;
    taxableValue: number;
    cgstRate?: number;
    sgstRate?: number;
    igstRate?: number;
    cessRate?: number;
  }>;
  totalValue: number;
  totalTax: number;
}

export interface PartBDetails {
  vehicleNumber: string;
  transporterId: string;
  transporterName?: string;
  modeOfTransport: string;
  transportDocumentNumber?: string;
  transportDocumentDate?: string;
}

export interface PartBHistoryEntry {
  _id: string;
  eventType: 'auto-synced' | 'manual-update' | 'creation' | 'cancellation';
  timestamp: string;
  updatedBy: {
    _id: string;
    name: string;
    email: string;
  };
  oldVehicleNumber?: string;
  newVehicleNumber: string;
  reason?: PartBUpdateReason;
  notes?: string;
}

export interface EwayBill {
  _id: string;
  ewayBillNumber: string;
  booking?: {
    _id: string;
    bookingId: string;
  };
  partA: PartADetails;
  partB: PartBDetails;
  status: EwayBillStatus;
  validFrom: string;
  validUntil: string;
  autoSynced: boolean;
  partBHistory: PartBHistoryEntry[];
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface EwayBillFilters {
  status?: EwayBillStatus | '';
  dateFrom?: string;
  dateTo?: string;
  partBStatus?: 'auto-synced' | 'pending' | '';
  search?: string;
  bookingId?: string;
}

export interface CreateEwayBillRequest {
  bookingId?: string;
  partA: PartADetails;
  partB: PartBDetails;
}

export interface UpdatePartBRequest {
  vehicleNumber: string;
  reason: PartBUpdateReason;
  notes?: string;
}

export interface GSTVerificationResponse {
  success: boolean;
  legalName?: string;
  tradeName?: string;
  address?: string;
  state?: string;
  error?: string;
}
