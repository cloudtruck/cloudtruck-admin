export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

export * from './auth.types';
export * from './booking.types';
export * from './driver.types';
export * from './vehicle.types';
export * from './payment.types';
export * from './customer.types';
export * from './tracking.types';
export * from './organization.types';
