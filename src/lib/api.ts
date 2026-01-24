/* eslint-disable @typescript-eslint/no-unused-vars */
import api from './axios';
import type {
  ApiResponse,
  Booking,
  BookingFilters,
  BookingStats,
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
  EwayBill,
  EwayBillFilters,
  CreateEwayBillRequest,
  UpdatePartBRequest,
  GSTVerificationResponse,
} from '@/types';

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
  getActivities: (params?: { limit?: number }) => api.get<ApiResponse<any>>('/bookings/dashboard/activities', { params }),
  getTrends: (params?: { days?: number }) => api.get<ApiResponse<any>>('/bookings/dashboard/trends', { params }),
  getStatusBreakdown: () => api.get<ApiResponse<Record<string, number>>>('/bookings/dashboard/status'),

  create: (data: Partial<Booking>) => api.post<ApiResponse<Booking>>('/bookings', data),

  updateStatus: (id: string, data: { status: string; notes?: string }) =>
    api.patch<ApiResponse<Booking>>(`/bookings/${id}/status`, data),

  assignDriver: (id: string, data: { driverId: string; vehicleId: string; notes?: string }) =>
    api.post<ApiResponse<Booking>>(`/bookings/${id}/assign-driver`, data),

  addNote: (id: string, data: { note: string }) =>
    api.post<ApiResponse<{ note: { text: string; createdAt: string; createdBy: string } }>>(`/bookings/${id}/notes`, data),

  cancel: (id: string, data: { reason: string }) =>
    api.post<ApiResponse<Booking>>(`/bookings/${id}/cancel`, data),

  getDocuments: (id: string) =>
    api.get<ApiResponse<{ documents: Array<{ _id: string; type: string; url: string; uploadedAt: string }> }>>(`/bookings/${id}/documents`),
};

// ============================================================================
// Driver APIs
// ============================================================================

export const driverApi = {
  getAll: (params?: DriverFilters & { page?: number; limit?: number }) =>
    api.get<ApiResponse<{ drivers: Driver[]; pagination: Pagination }>>('/drivers', { params }),

  getById: (id: string) => api.get<ApiResponse<Driver>>(`/drivers/${id}`),

  create: (data: any) => api.post<ApiResponse<Driver>>('/drivers', data),

  update: (id: string, data: Partial<Driver>) => api.patch<ApiResponse<Driver>>(`/drivers/${id}`, data),

  getAvailable: (params?: { truckType?: string; city?: string; lat?: number; lng?: number; matchPickupCity?: string }) =>
    api.get<ApiResponse<Driver[]>>('/drivers/available', { params }),

  approve: (id: string, data?: { notes?: string }) =>
    api.post<ApiResponse<Driver>>(`/drivers/${id}/verify`, data || {}),

  reject: (id: string, data: { reason: string }) =>
    api.post<ApiResponse<Driver>>(`/drivers/${id}/reject`, data),

  block: (id: string, data: { reason: string }) =>
    api.post<ApiResponse<Driver>>(`/drivers/${id}/blacklist`, data),

  unblock: (id: string) =>
    api.post<ApiResponse<Driver>>(`/drivers/${id}/remove-blacklist`, {}),

  updateStatus: (id: string, data: { status: string }) =>
    api.patch<ApiResponse<Driver>>(`/drivers/${id}/status`, data),

  getTripHistory: (id: string, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<{ trips: Booking[]; pagination: Pagination }>>(
      `/drivers/${id}/trip-history`,
      { params }
    ),
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

  update: (id: string, data: Partial<Vehicle>) => api.patch<ApiResponse<Vehicle>>(`/vehicles/${id}`, data),

  verify: (id: string) => api.post<ApiResponse<Vehicle>>(`/vehicles/${id}/verify`, {}),

  delete: (id: string) => api.delete<ApiResponse<null>>(`/vehicles/${id}`),

  getByDriver: (driverId: string) =>
    api.get<ApiResponse<Vehicle[]>>(`/vehicles/driver/${driverId}`),
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
};

// ============================================================================
// Tracking APIs
// ============================================================================

export const trackingApi = {
  getLatest: (bookingId: string) =>
    api.get<ApiResponse<TrackingLocation>>(`/tracking/${bookingId}/last-location`),

  getHistory: (bookingId: string, params?: { page?: number; limit?: number; startDate?: string; endDate?: string }) =>
    api.get<ApiResponse<TrackingHistory>>(`/tracking/${bookingId}/history`, { params }),

  getLiveTrips: () => api.get<ApiResponse<Array<Booking & { lastLocation: TrackingLocation }>>>('/tracking/live-trips'),
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
    api.get<ApiResponse<{ notifications: Notification[]; pagination: Pagination }>>('/notifications', {
      params,
    }),

  markAsRead: (id: string) => api.patch<ApiResponse<null>>(`/notifications/${id}/read`),

  markAllAsRead: () => api.patch<ApiResponse<null>>('/notifications/mark-all-read'),

  getUnreadCount: () => api.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),
};

// ============================================================================
// Staff APIs
// ============================================================================

interface Staff {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  phone?: string;
  createdAt: string;
}

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
  create: (data: any) =>
    api.post<ApiResponse<any>>('/eway-bills', data),

  getAll: (params?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    partBStatus?: string;
    search?: string;
    bookingId?: string;
    page?: number;
    limit?: number;
  }) =>
    api.get<ApiResponse<{ ewayBills: any[]; pagination: Pagination }>>('/eway-bills', {
      params,
    }),

  getById: (id: string) =>
    api.get<ApiResponse<any>>(`/eway-bills/${id}`),

  getHistory: (id: string) =>
    api.get<ApiResponse<{ history: any[] }>>(`/eway-bills/${id}/history`),

  updatePartB: (id: string, data: { vehicleNumber: string; reason: string; notes?: string }) =>
    api.put<ApiResponse<any>>(`/eway-bills/${id}/part-b`, data),

  cancel: (id: string, data: { reason: string }) =>
    api.patch<ApiResponse<any>>(`/eway-bills/${id}/cancel`, data),

  verifyGSTIN: (gstin: string) =>
    api.post<ApiResponse<{
      legalName: string;
      tradeName?: string;
      address: string;
      state: string;
    }>>('/eway-bills/verify-gstin', { gstin }),
};

