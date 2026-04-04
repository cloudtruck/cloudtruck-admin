import api from './axios';
import type {
  ApiResponse,
  Booking,
  BookingFilters,
  BookingStats,
  CreateBookingPayload,
  Driver,
  DriverFilters,
  Vehicle,
  VehicleFilters,
  Payment,
  PaymentFilters,
  Customer,
  CustomerFilters,
  TrackingLocation,
  TrackingHistory,
  Pagination,
  LoginCredentials,
  AuthResponse,
  Activity,
  TrendData,
  EwayBill,
  EwayBillFilters,
  CreateEwayBillRequest,
  UpdatePartBRequest,
  GSTVerificationResponse,
  PartBHistoryEntry,
  Staff,
  RoleTemplate,
  MasterData,
  Account,
  OrganizationSettings,
  OrgAddress,
  DeleteRequestPagination,
  Branch,
  PlannedRoute,
  WalletTransaction,
  UnloadingTruck,
  Supplier,
  SupplierFilters,
  SupplierPaymentRecord,
  CreateSupplierPayload,
  SupplierAvailableDriver,
} from '@/types';

interface BankAccountPayload {
  _id?: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName?: string;
  branchName?: string;
  isPrimary?: boolean;
}

// ============================================================================
// Authentication APIs
// ============================================================================

export const authApi = {
  login: (credentials: LoginCredentials) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login/staff', credentials),

  logout: () => api.post<ApiResponse<null>>('/auth/logout'),

  refreshToken: () => api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh-token'),

  getCurrentUser: () => api.get<ApiResponse<AuthResponse>>('/auth/me'),
};

// ============================================================================
// Booking APIs
// ============================================================================

export const bookingApi = {
  getAll: (params?: BookingFilters & { page?: number; limit?: number }) =>
    api.get<ApiResponse<{ bookings: Booking[]; pagination: Pagination }>>('/bookings', {
      params,
    }),

  getById: (id: string) => api.get<ApiResponse<Booking>>(`/bookings/${id}`),

  update: (id: string, data: Partial<Booking>) =>
    api.patch<ApiResponse<Booking>>(`/bookings/${id}`, data),

  getStats: () => api.get<ApiResponse<BookingStats>>('/bookings/stats'),

  // Dashboard
  getActivities: (params?: { limit?: number }) =>
    api.get<ApiResponse<Activity[]>>('/bookings/dashboard/activities', { params }),
  getTrends: (params?: { days?: number }) =>
    api.get<ApiResponse<TrendData[]>>('/bookings/dashboard/trends', { params }),
  getStatusBreakdown: () =>
    api.get<ApiResponse<Record<string, number>>>('/bookings/dashboard/status'),
  getBranchKpi: () =>
    api.get<ApiResponse<{ live: unknown[]; history: unknown[] }>>('/bookings/dashboard/branch-kpi'),
  getDriverStats: () => api.get<ApiResponse<unknown[]>>('/bookings/dashboard/driver-stats'),
  getRingCounts: () =>
    api.get<ApiResponse<Record<string, number>>>('/bookings/dashboard/ring-counts'),

  create: (data: CreateBookingPayload) => api.post<ApiResponse<Booking>>('/bookings', data),

  updateStatus: (id: string, data: { status: string; notes?: string }) =>
    api.patch<ApiResponse<Booking>>(`/bookings/${id}/status`, data),

  assignDriver: (id: string, data: { driverId: string; vehicleId: string; notes?: string }) =>
    api.post<ApiResponse<Booking>>(`/bookings/${id}/assign-driver`, data),

  addNote: (id: string, data: { text: string }) =>
    api.post<ApiResponse<any>>(`/bookings/${id}/notes`, data),

  getAuditLogs: (id: string) => api.get<ApiResponse<any[]>>(`/bookings/${id}/audit-logs`),

  cancel: (id: string, data: { reason: string }) =>
    api.post<ApiResponse<Booking>>(`/bookings/${id}/cancel`, data),

  getDocuments: (id: string) =>
    api.get<
      ApiResponse<{
        documents: Array<{ _id: string; type: string; url: string; uploadedAt: string }>;
      }>
    >(`/bookings/${id}/documents`),

  getAllPaymentRequests: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<{ requests: unknown[]; pagination: Pagination }>>(
      '/bookings/payment-requests',
      { params }
    ),

  processPaymentRequest: (
    bookingId: string,
    requestId: string,
    action: 'pay' | 'reject',
    data?: { utrNumber?: string; rejectionReason?: string }
  ) =>
    api.patch<ApiResponse<unknown>>(
      `/bookings/${bookingId}/payment-requests/${requestId}/${action}`,
      data || {}
    ),

  getUnloadingTrucks: (params: { dropCity: string; truckType?: string; limit?: number }) =>
    api.get<ApiResponse<UnloadingTruck[]>>('/bookings/unloading-trucks', { params }),
};

// ============================================================================
// Document APIs
// ============================================================================

export const documentApi = {
  uploadLR: (bookingId: string, files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    return api.post<ApiResponse<any>>(`/documents/booking/${bookingId}/lr`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadPOD: (bookingId: string, file: File, body?: Record<string, string>) => {
    const fd = new FormData();
    fd.append('pod', file);
    if (body) Object.entries(body).forEach(([k, v]) => fd.append(k, v));
    return api.post<ApiResponse<any>>(`/documents/booking/${bookingId}/pod`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadLoadingMemo: (bookingId: string, files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    return api.post<ApiResponse<any>>(`/documents/booking/${bookingId}/loading-images`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadOtherDocuments: (bookingId: string, files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    return api.post<ApiResponse<any>>(`/documents/booking/${bookingId}/other-documents`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getLR: (bookingId: string) => api.get<ApiResponse<any>>(`/documents/booking/${bookingId}/lr`),
  getPOD: (bookingId: string) => api.get<ApiResponse<any>>(`/documents/booking/${bookingId}/pod`),
  deleteDocument: (docId: string) => api.delete<ApiResponse<any>>(`/documents/${docId}`),
  deleteLR: (bookingId: string) =>
    api.delete<ApiResponse<any>>(`/documents/booking/${bookingId}/lr`),
};

// ============================================================================
// Driver APIs
// ============================================================================

export const driverApi = {
  getAll: (
    params?: DriverFilters & {
      page?: number;
      limit?: number;
      driverRole?: 'individual' | 'employee';
      supplierOwner?: string;
      kycStatus?: string;
    }
  ) => api.get<ApiResponse<{ drivers: Driver[]; pagination: Pagination }>>('/drivers', { params }),

  getById: (id: string) => api.get<ApiResponse<Driver>>(`/drivers/${id}`),

  create: (data: Partial<Driver>) => api.post<ApiResponse<Driver>>('/drivers', data),

  update: (id: string, data: Partial<Driver>) =>
    api.patch<ApiResponse<Driver>>(`/drivers/${id}`, data),

  getAvailable: (params?: {
    truckType?: string;
    city?: string;
    lat?: number;
    lng?: number;
    matchPickupCity?: string;
  }) => api.get<ApiResponse<Driver[]>>('/drivers/available', { params }),

  approve: (id: string, data?: { notes?: string }) =>
    api.post<ApiResponse<Driver>>(`/drivers/${id}/verify`, data || {}),

  reject: (id: string, data: { reason: string }) =>
    api.post<ApiResponse<Driver>>(`/drivers/${id}/reject`, data),

  block: (id: string, data: { reason: string }) =>
    api.post<ApiResponse<Driver>>(`/drivers/${id}/blacklist`, data),

  unblock: (id: string) => api.post<ApiResponse<Driver>>(`/drivers/${id}/remove-blacklist`, {}),

  updateStatus: (id: string, data: { status: string }) =>
    api.patch<ApiResponse<Driver>>(`/drivers/${id}/status`, data),

  getTripHistory: (id: string, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<{ trips: Booking[]; pagination: Pagination }>>(
      `/drivers/${id}/trip-history`,
      { params }
    ),

  addBankAccount: (id: string, data: Omit<BankAccountPayload, '_id'>) =>
    api.post<ApiResponse<Driver>>(`/drivers/${id}/bank-accounts`, data),

  updateBankAccount: (id: string, accountId: string, data: Partial<BankAccountPayload>) =>
    api.patch<ApiResponse<Driver>>(`/drivers/${id}/bank-accounts/${accountId}`, data),

  removeBankAccount: (id: string, accountId: string) =>
    api.delete<ApiResponse<Driver>>(`/drivers/${id}/bank-accounts/${accountId}`),
};

// ============================================================================
// Vehicle APIs
// ============================================================================

export const vehicleApi = {
  getAll: (params?: VehicleFilters & { page?: number; limit?: number }) =>
    api.get<ApiResponse<{ vehicles: Vehicle[]; pagination: Pagination }>>('/vehicles', {
      params,
    }),

  getById: (id: string) => api.get<ApiResponse<Vehicle>>(`/vehicles/${id}`),

  create: (data: Partial<Vehicle>) => api.post<ApiResponse<Vehicle>>('/vehicles', data),

  update: (id: string, data: Partial<Vehicle>) =>
    api.patch<ApiResponse<Vehicle>>(`/vehicles/${id}`, data),

  verify: (id: string) => api.post<ApiResponse<Vehicle>>(`/vehicles/${id}/verify`, {}),

  reject: (id: string, data: { reason: string }) =>
    api.post<ApiResponse<Vehicle>>(`/vehicles/${id}/reject`, data),

  delete: (id: string) => api.delete<ApiResponse<null>>(`/vehicles/${id}`),

  getByDriver: (driverId: string) =>
    api.get<ApiResponse<Vehicle[]>>(`/vehicles/driver/${driverId}`),

  getNotes: (id: string) => api.get<ApiResponse<unknown[]>>(`/vehicles/${id}/notes`),

  addNote: (id: string, data: { text: string }) =>
    api.post<ApiResponse<unknown>>(`/vehicles/${id}/notes`, data),
};

// ============================================================================
// Payment APIs
// ============================================================================

export const paymentApi = {
  getAll: (params?: PaymentFilters & { page?: number; limit?: number }) =>
    api.get<ApiResponse<{ payments: Payment[]; pagination: Pagination }>>('/payments', {
      params,
    }),

  getById: (id: string) => api.get<ApiResponse<Payment>>(`/payments/${id}`),

  getByBooking: (bookingId: string) =>
    api.get<ApiResponse<Payment[]>>(`/payments/booking/${bookingId}`),

  markAsReceived: (
    id: string,
    data: { transactionReference: string; paidAt: string; notes?: string }
  ) => api.patch<ApiResponse<Payment>>(`/payments/${id}/mark-received`, data),

  downloadInvoice: (id: string) => api.get(`/payments/${id}/invoice`, { responseType: 'blob' }),
};

// ============================================================================
// Customer APIs
// ============================================================================

export const customerApi = {
  getAll: (params?: CustomerFilters & { page?: number; limit?: number }) =>
    api.get<ApiResponse<{ customers: Customer[]; pagination: Pagination }>>('/customers', {
      params,
    }),

  getById: (id: string) => api.get<ApiResponse<Customer>>(`/customers/${id}`),

  update: (id: string, data: Partial<Customer>) =>
    api.patch<ApiResponse<Customer>>(`/customers/${id}`, data),

  getPending: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<{ customers: Customer[]; pagination: Pagination }>>('/customers/pending', {
      params,
    }),

  approve: (id: string) => api.patch<ApiResponse<Customer>>(`/customers/${id}/approve`),

  reject: (id: string, data: { reason: string }) =>
    api.patch<ApiResponse<Customer>>(`/customers/${id}/reject`, data),

  block: (id: string, data: { reason: string }) =>
    api.patch<ApiResponse<Customer>>(`/customers/${id}/block`, data),

  unblock: (id: string) => api.patch<ApiResponse<Customer>>(`/customers/${id}/unblock`),

  getBookingHistory: (id: string, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<{ bookings: Booking[]; pagination: Pagination }>>(
      `/customers/${id}/bookings`,
      { params }
    ),

  getPaymentHistory: (id: string, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<{ payments: Payment[]; pagination: Pagination }>>(
      `/customers/${id}/payments`,
      { params }
    ),

  addLocation: (id: string, data: any) =>
    api.post<ApiResponse<Customer>>(`/customers/${id}/locations`, data),

  removeLocation: (id: string, locId: string) =>
    api.delete<ApiResponse<Customer>>(`/customers/${id}/locations/${locId}`),

  addCharge: (
    id: string,
    data: { type: string; amount: number; remarks?: string; chargeType: 'add' | 'reduce' }
  ) => api.post<ApiResponse<Customer>>(`/customers/${id}/charges`, data),

  removeCharge: (id: string, chargeId: string) =>
    api.delete<ApiResponse<Customer>>(`/customers/${id}/charges/${chargeId}`),

  addComment: (id: string, data: { topic: string; comment: string }) =>
    api.post<ApiResponse<Customer>>(`/customers/${id}/comments`, data),

  getComments: (id: string) => api.get<ApiResponse<any[]>>(`/customers/${id}/comments`),

  create: (data: {
    phone: string;
    email?: string;
    companyName: string;
    contactPerson?: string;
    city?: string;
    gstNumber?: string;
    pan?: string;
    companyType?: string;
    customerType?: string;
    paymentTerms?: 'advance' | 'credit' | 'cod';
    address?: string;
    state?: string;
    pincode?: string;
  }) => api.post<ApiResponse<Customer>>('/customers', data),

  delete: (id: string) => api.delete<ApiResponse<null>>(`/customers/${id}`),
};

// ============================================================================
// Tracking APIs
// ============================================================================

export const trackingApi = {
  getLatest: (bookingId: string) =>
    api.get<ApiResponse<TrackingLocation>>(`/tracking/${bookingId}/last-location`),

  getHistory: (
    bookingId: string,
    params?: { page?: number; limit?: number; startDate?: string; endDate?: string }
  ) => api.get<ApiResponse<TrackingHistory>>(`/tracking/${bookingId}/history`, { params }),

  getPlannedRoute: (bookingId: string) =>
    api.get<ApiResponse<PlannedRoute>>(`/tracking/${bookingId}/planned-route`),

  getLiveTrips: () =>
    api.get<ApiResponse<Array<Booking & { lastLocation: TrackingLocation }>>>(
      '/tracking/live-trips'
    ),
};

// ============================================================================
// Notification APIs
// ============================================================================

interface Notification {
  _id: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export const notificationApi = {
  getAll: (params?: { page?: number; limit?: number; read?: boolean }) =>
    api.get<ApiResponse<{ notifications: Notification[]; pagination: Pagination }>>(
      '/notifications',
      {
        params,
      }
    ),

  markAsRead: (id: string) => api.patch<ApiResponse<null>>(`/notifications/${id}/read`),

  markAllAsRead: () => api.patch<ApiResponse<null>>('/notifications/mark-all-read'),

  getUnreadCount: () => api.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),
};

// ============================================================================
// Staff APIs
// ============================================================================

export const staffApi = {
  getAll: (params?: { page?: number; limit?: number; role?: string; status?: string }) =>
    api.get<ApiResponse<{ staff: Staff[]; pagination: Pagination }>>('/staff', { params }),

  getById: (id: string) => api.get<ApiResponse<Staff>>(`/staff/${id}`),

  create: (data: Partial<Staff>) => api.post<ApiResponse<Staff>>('/staff', data),

  update: (id: string, data: Partial<Staff>) => api.patch<ApiResponse<Staff>>(`/staff/${id}`, data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.patch<ApiResponse<null>>('/staff/change-password', data),
};

// ============================================================================
// Export APIs
// ============================================================================

export const exportApi = {
  bookings: (params?: BookingFilters) =>
    api.get('/exports/bookings', { params, responseType: 'blob' }),

  payments: (params?: PaymentFilters) =>
    api.get('/exports/payments', { params, responseType: 'blob' }),

  drivers: (params?: DriverFilters) =>
    api.get('/exports/drivers', { params, responseType: 'blob' }),

  customers: (params?: CustomerFilters) =>
    api.get('/exports/customers', { params, responseType: 'blob' }),
};

// ============================================================================
// E-way Bill APIs
// ============================================================================

export const ewayBillApi = {
  create: (data: CreateEwayBillRequest) => api.post<ApiResponse<EwayBill>>('/eway-bills', data),

  getAll: (params?: EwayBillFilters & { page?: number; limit?: number }) =>
    api.get<ApiResponse<{ ewayBills: EwayBill[]; pagination: Pagination }>>('/eway-bills', {
      params,
    }),

  getById: (id: string) => api.get<ApiResponse<EwayBill>>(`/eway-bills/${id}`),

  getHistory: (id: string) =>
    api.get<ApiResponse<{ history: PartBHistoryEntry[] }>>(`/eway-bills/${id}/history`),

  updatePartB: (id: string, data: UpdatePartBRequest) =>
    api.put<ApiResponse<EwayBill>>(`/eway-bills/${id}/part-b`, data),

  cancel: (id: string, data: { reason: string }) =>
    api.patch<ApiResponse<EwayBill>>(`/eway-bills/${id}/cancel`, data),

  sync: (ewayBillNumber: string) =>
    api.post<ApiResponse<EwayBill>>('/eway-bills/sync', { ewayBillNumber }),

  verifyGSTIN: (gstin: string) =>
    api.post<ApiResponse<GSTVerificationResponse>>('/eway-bills/verify-gstin', { gstin }),
};

// ============================================================================
// Organization APIs
// ============================================================================

// Role Template APIs
export const roleTemplateApi = {
  list: (params?: { category?: string; isActive?: boolean }) =>
    api.get<ApiResponse<RoleTemplate[]>>('/role-templates', { params }),

  getById: (id: string) => api.get<ApiResponse<RoleTemplate>>(`/role-templates/${id}`),

  create: (data: Partial<RoleTemplate>) =>
    api.post<ApiResponse<RoleTemplate>>('/role-templates', data),

  update: (id: string, data: Partial<RoleTemplate>) =>
    api.patch<ApiResponse<{ template: RoleTemplate; affectedEmployees: number }>>(
      `/role-templates/${id}`,
      data
    ),

  delete: (id: string) => api.delete<ApiResponse<null>>(`/role-templates/${id}`),

  getCategories: () =>
    api.get<ApiResponse<Array<{ value: string; label: string }>>>('/role-templates/categories'),
};

// Staff/Employee APIs (extended)
export const employeeApi = {
  list: (params?: {
    department?: string;
    roleTemplate?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get<ApiResponse<{ staff: Staff[]; pagination: Pagination }>>('/staff', { params }),

  getById: (id: string) => api.get<ApiResponse<Staff>>(`/staff/${id}`),

  create: (data: Partial<Staff>) => api.post<ApiResponse<Staff>>('/staff', data),

  update: (id: string, data: Partial<Staff>) => api.patch<ApiResponse<Staff>>(`/staff/${id}`, data),

  delete: (id: string) => api.delete<ApiResponse<null>>(`/staff/${id}`),

  updateRoleTemplate: (id: string, roleTemplateId: string) =>
    api.patch<ApiResponse<Staff>>(`/staff/${id}`, { roleTemplate: roleTemplateId }),
};

// Master Data APIs
export const masterDataApi = {
  list: (params?: { category?: string; isActive?: boolean }) =>
    api.get<ApiResponse<MasterData[]>>('/master-data', { params }),

  getByCategory: (category: string, includeInactive = true) =>
    api.get<ApiResponse<MasterData[]>>(
      `/master-data/category/${category}?includeInactive=${includeInactive}`
    ),

  getById: (id: string) => api.get<ApiResponse<MasterData>>(`/master-data/${id}`),

  create: (data: Partial<MasterData> | FormData) =>
    api.post<ApiResponse<MasterData>>('/master-data', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    }),

  update: (id: string, data: Partial<MasterData> | FormData) =>
    api.patch<ApiResponse<MasterData>>(`/master-data/${id}`, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    }),

  reorder: (items: Array<{ id: string; displayOrder: number }>) =>
    api.patch<ApiResponse<null>>('/master-data/reorder', { items }),

  delete: (id: string) => api.delete<ApiResponse<null>>(`/master-data/${id}`),

  getCategories: () =>
    api.get<ApiResponse<Array<{ value: string; label: string; icon: string }>>>(
      '/master-data/categories'
    ),
};

// Org Address APIs
export const addressApi = {
  list: () => api.get<ApiResponse<OrgAddress[]>>('/organization/addresses'),

  create: (data: Omit<OrgAddress, '_id' | 'isPrimary' | 'isActive'>) =>
    api.post<ApiResponse<OrgAddress>>('/organization/addresses', data),

  update: (id: string, data: Partial<OrgAddress>) =>
    api.patch<ApiResponse<OrgAddress>>(`/organization/addresses/${id}`, data),

  setPrimary: (id: string) =>
    api.patch<ApiResponse<OrgAddress>>(`/organization/addresses/${id}/primary`, {}),

  delete: (id: string) => api.delete<ApiResponse<null>>(`/organization/addresses/${id}`),
};

// Account APIs
export const accountApi = {
  list: () => api.get<ApiResponse<Account[]>>('/accounts'),

  getById: (id: string) => api.get<ApiResponse<Account>>(`/accounts/${id}`),

  getPrimary: () => api.get<ApiResponse<Account>>('/accounts/primary'),

  create: (data: Partial<Account>) => api.post<ApiResponse<Account>>('/accounts', data),

  update: (id: string, data: Partial<Account>) =>
    api.patch<ApiResponse<Account>>(`/accounts/${id}`, data),

  setPrimary: (id: string) => api.patch<ApiResponse<Account>>(`/accounts/${id}/primary`, {}),

  delete: (id: string) => api.delete<ApiResponse<null>>(`/accounts/${id}`),
};

// Organization Settings APIs
export const organizationSettingsApi = {
  getSettings: () => api.get<ApiResponse<OrganizationSettings>>('/organization/settings'),

  updateSettings: (data: Partial<OrganizationSettings>) =>
    api.patch<ApiResponse<OrganizationSettings>>('/organization/settings', data),

  updateCompanyInfo: (data: Partial<OrganizationSettings>) =>
    api.patch<ApiResponse<OrganizationSettings>>('/organization/settings/company', data),

  updateBookingConfig: (data: Partial<OrganizationSettings>) =>
    api.patch<ApiResponse<OrganizationSettings>>('/organization/settings/booking-config', data),

  updateOperationalSettings: (data: Partial<OrganizationSettings>) =>
    api.patch<ApiResponse<OrganizationSettings>>('/organization/settings/operational', data),

  updateNotificationSettings: (data: Partial<OrganizationSettings>) =>
    api.patch<ApiResponse<OrganizationSettings>>('/organization/settings/notifications', data),

  updateTaxSettings: (data: Partial<OrganizationSettings>) =>
    api.patch<ApiResponse<OrganizationSettings>>('/organization/settings/tax', data),

  getNextBookingNumber: () =>
    api.get<ApiResponse<{ bookingNumber: string }>>('/organization/settings/next-booking-number'),

  updateDeletionPolicy: (data: { requireApprovalFor: string[] }) =>
    api.patch<ApiResponse<{ requireApprovalFor: string[] }>>(
      '/organization/settings/deletion-policy',
      data
    ),
};

// Branch APIs
export const branchApi = {
  list: (params?: { region?: string; isActive?: boolean }) =>
    api.get<ApiResponse<Branch[]>>('/branches', { params }),

  getById: (id: string) => api.get<ApiResponse<Branch>>(`/branches/${id}`),

  create: (data: Partial<Branch>) => api.post<ApiResponse<Branch>>('/branches', data),

  update: (id: string, data: Partial<Branch>) =>
    api.patch<ApiResponse<Branch>>(`/branches/${id}`, data),

  delete: (id: string) => api.delete<ApiResponse<null>>(`/branches/${id}`),

  assignEmployee: (branchId: string, staffId: string) =>
    api.patch<ApiResponse<Branch>>(`/branches/${branchId}/employees/${staffId}`, {}),

  removeEmployee: (branchId: string, staffId: string) =>
    api.delete<ApiResponse<Branch>>(`/branches/${branchId}/employees/${staffId}`),

  setBranchManager: (branchId: string, staffId: string) =>
    api.patch<ApiResponse<Branch>>(`/branches/${branchId}`, { branchManager: staffId }),

  setTrafficCoordinator: (branchId: string, staffId: string) =>
    api.patch<ApiResponse<Branch>>(`/branches/${branchId}`, { trafficCoordinator: staffId }),

  getMetrics: (id: string) => api.get<ApiResponse<unknown>>(`/branches/${id}/metrics`),
};

// City Search API
export const cityApi = {
  search: (query: string) =>
    api.get<ApiResponse<string[]>>('/cities/search', { params: { q: query } }),
};

// Market Rates API
export const marketRateApi = {
  getAll: (params?: {
    origin?: string;
    destination?: string;
    truckType?: string;
    page?: number;
    limit?: number;
  }) => api.get<ApiResponse<{ rates: any[]; pagination: Pagination }>>('/market-rates', { params }),
  getCities: () => api.get<ApiResponse<string[]>>('/market-rates/cities'),
  getTrends: (params?: { origin?: string; destination?: string; days?: number }) =>
    api.get<ApiResponse<any[]>>('/market-rates/trends', { params }),
};

// Support Tickets API
export const supportTicketApi = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<{ tickets: any[]; pagination: Pagination }>>('/support-tickets', {
      params,
    }),
  getById: (id: string) => api.get<ApiResponse<any>>(`/support-tickets/${id}`),
  reply: (id: string, data: { message: string }) =>
    api.post<ApiResponse<any>>(`/support-tickets/${id}/reply`, data),
};

// Audit Logs API
export const auditApi = {
  getAll: (params?: {
    action?: string;
    entityType?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => api.get<ApiResponse<{ logs: any[]; pagination: Pagination }>>('/audit', { params }),
  getStats: () => api.get<ApiResponse<any>>('/audit/stats'),
  getEntityHistory: (entityType: string, entityId: string) =>
    api.get<ApiResponse<any[]>>(`/audit/entity/${entityType}/${entityId}`),
};

// Wallet / Payouts API
export const walletApi = {
  getAllPayouts: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<ApiResponse<{ payouts: WalletTransaction[]; pagination: Pagination }>>(
      '/wallet/payouts/all',
      { params }
    ),

  approvePayout: (transactionId: string, data?: { utrNumber?: string }) =>
    api.patch<ApiResponse<WalletTransaction>>(
      `/wallet/payouts/${transactionId}/approve`,
      data || {}
    ),

  rejectPayout: (transactionId: string, data: { reason: string }) =>
    api.patch<ApiResponse<WalletTransaction>>(`/wallet/payouts/${transactionId}/reject`, data),
};

// ============================================================================
// Supplier APIs
// ============================================================================

export const supplierApi = {
  getAll: (params?: SupplierFilters) =>
    api.get<ApiResponse<{ items: Supplier[]; pagination: Pagination }>>('/suppliers', { params }),

  getById: (id: string) => api.get<ApiResponse<Supplier>>(`/suppliers/${id}`),

  create: (data: CreateSupplierPayload) => api.post<ApiResponse<Supplier>>('/suppliers', data),

  update: (id: string, data: Partial<Supplier>) =>
    api.patch<ApiResponse<Supplier>>(`/suppliers/${id}`, data),

  delete: (id: string) => api.delete<ApiResponse<null>>(`/suppliers/${id}`),

  verify: (id: string) => api.post<ApiResponse<Supplier>>(`/suppliers/${id}/verify`),

  reject: (id: string, reason: string) =>
    api.post<ApiResponse<Supplier>>(`/suppliers/${id}/reject`, { reason }),

  blacklist: (id: string, reason: string) =>
    api.post<ApiResponse<Supplier>>(`/suppliers/${id}/blacklist`, { reason }),

  removeBlacklist: (id: string) =>
    api.post<ApiResponse<Supplier>>(`/suppliers/${id}/remove-blacklist`),

  getFleetDrivers: (id: string, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<{ items: Driver[]; pagination: Pagination }>>(
      `/suppliers/${id}/fleet/drivers`,
      { params }
    ),

  addDriver: (id: string, driverId: string) =>
    api.post<ApiResponse<Driver>>(`/suppliers/${id}/fleet/drivers`, { driverId }),

  removeDriver: (id: string, driverId: string) =>
    api.delete<ApiResponse<null>>(`/suppliers/${id}/fleet/drivers/${driverId}`),

  addVehicle: (id: string, vehicleId: string) =>
    api.post<ApiResponse<any>>(`/suppliers/${id}/fleet/vehicles`, { vehicleId }),

  removeVehicle: (id: string, vehicleId: string) =>
    api.delete<ApiResponse<null>>(`/suppliers/${id}/fleet/vehicles/${vehicleId}`),

  getFleetVehicles: (id: string, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<{ items: any[]; pagination: Pagination }>>(
      `/suppliers/${id}/fleet/vehicles`,
      { params }
    ),

  getBookings: (id: string, params?: { page?: number; limit?: number; status?: string }) =>
    api.get<ApiResponse<{ items: any[]; pagination: Pagination }>>(`/suppliers/${id}/bookings`, {
      params,
    }),

  getDashboard: (id: string) => api.get<ApiResponse<any>>(`/suppliers/${id}/dashboard`),

  addBankAccount: (id: string, data: Omit<BankAccountPayload, '_id'>) =>
    api.post<ApiResponse<Supplier>>(`/suppliers/${id}/bank-accounts`, data),

  updateBankAccount: (id: string, accountId: string, data: Partial<BankAccountPayload>) =>
    api.patch<ApiResponse<Supplier>>(`/suppliers/${id}/bank-accounts/${accountId}`, data),

  removeBankAccount: (id: string, accountId: string) =>
    api.delete<ApiResponse<Supplier>>(`/suppliers/${id}/bank-accounts/${accountId}`),

  getAvailableDrivers: (id: string) =>
    api.get<ApiResponse<SupplierAvailableDriver[]>>(`/suppliers/${id}/available-drivers`),

  // Supplier payments
  getPayments: (params?: {
    supplierId?: string;
    bookingId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) =>
    api.get<ApiResponse<{ items: SupplierPaymentRecord[]; pagination: Pagination }>>(
      '/supplier-payments',
      { params }
    ),

  getPaymentById: (paymentId: string) =>
    api.get<ApiResponse<SupplierPaymentRecord>>(`/supplier-payments/${paymentId}`),

  createPayment: (data: {
    supplierId: string;
    bookingId: string;
    amount: number;
    paymentType: string;
    paymentMethod: string;
    remarks?: string;
  }) => api.post<ApiResponse<SupplierPaymentRecord>>('/supplier-payments', data),

  approvePayment: (paymentId: string) =>
    api.post<ApiResponse<SupplierPaymentRecord>>(`/supplier-payments/${paymentId}/approve`),

  markPaid: (paymentId: string, data: { referenceNumber: string; transactionDate?: string }) =>
    api.post<ApiResponse<SupplierPaymentRecord>>(`/supplier-payments/${paymentId}/mark-paid`, data),

  rejectPayment: (paymentId: string, reason: string) =>
    api.post<ApiResponse<SupplierPaymentRecord>>(`/supplier-payments/${paymentId}/reject`, {
      reason,
    }),

  getSupplierLedger: (supplierId: string, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<any>>(`/supplier-payments/supplier/${supplierId}/ledger`, { params }),

  uploadDocument: (id: string, docType: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<Supplier>>(`/suppliers/${id}/documents/${docType}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Delete Request APIs
export const deleteRequestsApi = {
  create: (data: {
    resource: string;
    resourceId: string;
    resourceModel: string;
    reason?: string;
  }) => api.post<ApiResponse<null>>('/delete-requests', data),

  listPending: (params?: { status?: string; resource?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<DeleteRequestPagination>>('/delete-requests', { params }),

  listMine: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<DeleteRequestPagination>>('/delete-requests/mine', { params }),

  approve: (id: string) => api.post<ApiResponse<null>>(`/delete-requests/${id}/approve`),

  reject: (id: string, rejectionReason: string) =>
    api.post<ApiResponse<null>>(`/delete-requests/${id}/reject`, { rejectionReason }),
};
