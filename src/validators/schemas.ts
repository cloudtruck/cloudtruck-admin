import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Assign driver schema
export const assignDriverSchema = z.object({
  driverId: z.string().min(1, 'Driver is required'),
  vehicleId: z.string().min(1, 'Vehicle is required'),
  notes: z.string().optional(),
});

export type AssignDriverFormData = z.infer<typeof assignDriverSchema>;

// Update booking status schema
export const updateBookingStatusSchema = z.object({
  status: z.string().min(1, 'Status is required'),
  notes: z.string().optional(),
});

export type UpdateBookingStatusFormData = z.infer<typeof updateBookingStatusSchema>;

// Mark payment as received schema
export const markPaymentReceivedSchema = z.object({
  transactionReference: z.string().min(1, 'Transaction reference is required'),
  paidAt: z.string().min(1, 'Payment date is required'),
  notes: z.string().optional(),
});

export type MarkPaymentReceivedFormData = z.infer<typeof markPaymentReceivedSchema>;

// Add vehicle schema
export const addVehicleSchema = z.object({
  vehicleNumber: z.string().min(1, 'Vehicle number is required'),
  truckType: z.string().min(1, 'Truck type is required'),
  length: z.object({
    value: z.number().positive('Length must be positive'),
    unit: z.enum(['ft', 'm']),
  }),
  capacity: z.object({
    value: z.number().positive('Capacity must be positive'),
    unit: z.enum(['kg', 'tons']),
  }),
  bodyType: z.enum(['open', 'closed', 'container']),
  ownerId: z.string().optional(),
  driverId: z.string().optional(),
});

export type AddVehicleFormData = z.infer<typeof addVehicleSchema>;

// Driver approval schema
export const driverApprovalSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().optional(),
});

export type DriverApprovalFormData = z.infer<typeof driverApprovalSchema>;

// Add note schema
export const addNoteSchema = z.object({
  note: z.string().min(1, 'Note cannot be empty'),
});

export type AddNoteFormData = z.infer<typeof addNoteSchema>;

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
