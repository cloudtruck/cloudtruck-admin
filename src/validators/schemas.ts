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
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// Branch schema
export const branchSchema = z.object({
  branchCode: z
    .string()
    .min(2)
    .max(10)
    .regex(/^[A-Z0-9]+$/, 'Branch code must be uppercase alphanumeric'),
  branchName: z.string().min(2, 'Branch name must be at least 2 characters'),
  region: z.string().min(1, 'Region is required'),
  assignedCities: z.array(z.string()).min(1, 'At least one city is required'),
  contactDetails: z
    .object({
      email: z.string().email('Invalid email').optional().or(z.literal('')),
      phone: z
        .string()
        .regex(/^\d{10}$/, 'Phone must be 10 digits')
        .optional()
        .or(z.literal('')),
    })
    .optional(),
  branchManager: z.string().optional(),
  trafficCoordinator: z.string().optional(),
});
export type BranchFormData = z.infer<typeof branchSchema>;

// Account schema
export const accountSchema = z.object({
  accountNumber: z.string().regex(/^\d{9,18}$/, 'Account number must be 9-18 digits'),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format'),
  accountHolderName: z.string().min(2, 'Account holder name must be at least 2 characters'),
  bankName: z.string().min(1, 'Bank name is required'),
  branchName: z.string().optional(),
  accountType: z.enum(['savings', 'current', 'od']),
  isPrimary: z.boolean().optional(),
  upiId: z.string().optional().or(z.literal('')),
  swiftCode: z.string().optional().or(z.literal('')),
});
export type AccountFormData = z.infer<typeof accountSchema>;

// Organization address schema
export const orgAddressSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  country: z.string().default('India'),
  gstin: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format')
    .optional()
    .or(z.literal('')),
  pan: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format')
    .optional()
    .or(z.literal('')),
  series: z.string().max(10).optional().or(z.literal('')),
  accountNo: z.string().optional().or(z.literal('')),
  isPrimary: z.boolean().optional(),
});
export type OrgAddressFormData = z.infer<typeof orgAddressSchema>;

// Employee schema
export const employeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^(\+91)?[6-9]\d{9}$/, 'Invalid Indian phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  department: z.string().min(1, 'Department is required'),
  roleTemplate: z.string().min(1, 'Role template is required'),
  branch: z.string().optional(),
  designation: z.string().optional(),
});
export type EmployeeFormData = z.infer<typeof employeeSchema>;

// Lane schema
export const laneSchema = z
  .object({
    displayName: z.string().min(2, 'Display name must be at least 2 characters'),
    sourceKey: z.string().min(1, 'Source location is required'),
    destinationKey: z.string().min(1, 'Destination location is required'),
    truckType: z.string().min(1, 'Truck type is required'),
    customerPrice: z
      .number({ error: 'Customer price must be a number' })
      .min(0, 'Price must be non-negative'),
    supplierPrice: z
      .number({ error: 'Supplier price must be a number' })
      .min(0, 'Price must be non-negative'),
    totalKm: z
      .number({ error: 'Total KM must be a number' })
      .min(1, 'Distance must be at least 1 KM'),
    totalDays: z
      .number({ error: 'Total days must be a number' })
      .int()
      .min(1, 'Days must be at least 1'),
  })
  .refine((data) => data.sourceKey !== data.destinationKey, {
    message: 'Source and destination cannot be the same',
    path: ['destinationKey'],
  })
  .refine((data) => data.customerPrice >= data.supplierPrice, {
    message: 'Customer price must be greater than or equal to supplier price',
    path: ['customerPrice'],
  });
export type LaneFormData = z.infer<typeof laneSchema>;
