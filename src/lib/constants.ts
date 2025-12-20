export const BOOKING_STATUSES = [
  { value: 'created', label: 'Created' },
  { value: 'under-review', label: 'Under Review' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'driver-en-route', label: 'Driver En Route' },
  { value: 'reached-pickup', label: 'Reached Pickup' },
  { value: 'loaded', label: 'Loaded' },
  { value: 'in-transit', label: 'In Transit' },
  { value: 'reached-destination', label: 'Reached Destination' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'pod-received', label: 'POD Received' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

export const PAYMENT_STATUSES = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
] as const;

export const DRIVER_STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'on-trip', label: 'On Trip' },
  { value: 'offline', label: 'Offline' },
  { value: 'blocked', label: 'Blocked' },
] as const;

export const TRUCK_TYPES = [
  { value: '14-ft', label: '14 ft' },
  { value: '17-ft', label: '17 ft' },
  { value: '19-ft', label: '19 ft' },
  { value: 'container', label: 'Container' },
  { value: 'open-body', label: 'Open Body' },
] as const;

export const BODY_TYPES = [
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'container', label: 'Container' },
] as const;

export const MATERIAL_TYPES = [
  { value: 'fmcg', label: 'FMCG' },
  { value: 'steel', label: 'Steel' },
  { value: 'tiles', label: 'Tiles' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'food-grains', label: 'Food Grains' },
  { value: 'textiles', label: 'Textiles' },
  { value: 'machinery', label: 'Machinery' },
  { value: 'chemicals', label: 'Chemicals' },
  { value: 'other', label: 'Other' },
] as const;

export const STAFF_ROLES = [
  { value: 'staff', label: 'Staff' },
  { value: 'operations', label: 'Operations' },
  { value: 'admin', label: 'Admin' },
  { value: 'super-admin', label: 'Super Admin' },
] as const;

export const PAYMENT_METHODS = [
  { value: 'online', label: 'Online (PhonePe)' },
  { value: 'neft', label: 'NEFT' },
  { value: 'rtgs', label: 'RTGS' },
  { value: 'cash', label: 'Cash' },
] as const;

export const ITEMS_PER_PAGE = 20;

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';
