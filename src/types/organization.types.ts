// Organization-related type definitions

export interface RoleTemplate {
  _id: string;
  templateName: string;
  description: string;
  permissions: string[];
  category: 'operations' | 'finance' | 'support' | 'admin' | 'custom';
  isActive: boolean;
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Staff {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  role: 'staff' | 'operations' | 'admin' | 'super-admin';
  roleTemplate?: RoleTemplate | string;
  permissions: string[];
  status: 'active' | 'inactive' | 'blocked';
  branch?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MasterData {
  _id: string;
  category: 'truck-type' | 'material-type' | 'charge-type' | 'body-type' | 'document-type';
  key: string;
  displayName: string;
  description?: string;
  metadata?: Record<string, any>;
  displayOrder: number;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  _id: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  bankName: string;
  branchName: string;
  accountType: 'savings' | 'current';
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationSettings {
  _id: string;
  companyName: string;
  gstNumber?: string;
  bookingSeriesPrefix: string;
  podMandatory: boolean;
  advancePaymentPercentage: number;
  updatedAt: string;
  updatedBy?: string;
}

export interface Branch {
  _id: string;
  branchCode: string;
  branchName: string;
  assignedCities: string[];
  region: string;
  branchManager?: Staff | string;
  employees: (Staff | string)[];
  vehicles: string[];
  metrics: {
    bookingsCount: number;
    revenue: number;
    completionRate: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FieldPermission {
  _id: string;
  resource: string; // e.g., 'booking', 'customer', 'payment'
  field: string; // e.g., 'price', 'creditLimit', 'refund'
  action: 'read' | 'write' | 'update';
  permissionKey: string; // e.g., 'booking.update.price'
  description: string;
  category: string;
  isActive: boolean;
}

// Filter types
export interface StaffFilters {
  search?: string;
  department?: string;
  roleTemplate?: string;
  status?: string;
  branch?: string;
}

export interface MasterDataFilters {
  category?: string;
  isActive?: boolean;
  search?: string;
}

export interface BranchFilters {
  region?: string;
  isActive?: boolean;
  search?: string;
}

// Form data types
export interface CreateStaffData {
  name: string;
  email: string;
  phone?: string;
  department?: string;
  roleTemplate?: string;
  permissions?: string[];
  password: string;
}

export interface UpdateStaffData {
  name?: string;
  email?: string;
  phone?: string;
  department?: string;
  roleTemplate?: string;
  permissions?: string[];
  status?: string;
  branch?: string;
}

export interface CreateRoleTemplateData {
  templateName: string;
  description: string;
  permissions: string[];
  category: string;
}

export interface CreateMasterDataData {
  category: string;
  key: string;
  displayName: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface CreateAccountData {
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  bankName: string;
  branchName: string;
  accountType: 'savings' | 'current';
  isPrimary?: boolean;
}

export interface CreateBranchData {
  branchCode: string;
  branchName: string;
  assignedCities: string[];
  region: string;
  branchManager?: string;
}

export interface City {
  name: string;
  state?: string;
}
