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
  { value: '14ft', label: '14 ft' },
  { value: '17ft', label: '17 ft' },
  { value: '19ft', label: '19 ft' },
  { value: '20ft', label: '20 ft' },
  { value: '22ft', label: '22 ft' },
  { value: '24ft', label: '24 ft' },
  { value: '32ft', label: '32 ft' },
  { value: 'container-20ft', label: '20 ft Container' },
  { value: 'container-40ft', label: '40 ft Container' },
  { value: 'open-body', label: 'Open Body' },
  { value: 'closed-body', label: 'Closed Body' },
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

// Organization constants
export const ROLE_TEMPLATE_CATEGORIES = [
  { value: 'operations', label: 'Operations' },
  { value: 'finance', label: 'Finance' },
  { value: 'support', label: 'Customer Support' },
  { value: 'admin', label: 'Admin' },
  { value: 'custom', label: 'Custom' },
] as const;

export const MASTER_DATA_CATEGORIES = [
  { value: 'truck-type', label: 'Truck Type' },
  { value: 'material-type', label: 'Material Type' },
  { value: 'charge-type', label: 'Charge Type' },
  { value: 'body-type', label: 'Body Type' },
  { value: 'document-type', label: 'Document Type' },
] as const;

export const DEPARTMENTS = [
  { value: 'operations', label: 'Operations' },
  { value: 'finance', label: 'Finance' },
  { value: 'support', label: 'Customer Support' },
  { value: 'sales', label: 'Sales' },
  { value: 'admin', label: 'Admin' },
  { value: 'management', label: 'Management' },
  { value: 'traffic', label: 'Traffic' },
] as const;

export const ACCOUNT_TYPES = [
  { value: 'savings', label: 'Savings' },
  { value: 'current', label: 'Current' },
] as const;

export const REGIONS = [
  { value: 'north', label: 'North' },
  { value: 'south', label: 'South' },
  { value: 'east', label: 'East' },
  { value: 'west', label: 'West' },
  { value: 'central', label: 'Central' },
] as const;

// Default role templates (to be seeded)
export const DEFAULT_ROLE_TEMPLATES = [
  {
    templateName: 'Operations Manager',
    description: 'Full access to booking operations, driver assignment, and tracking',
    permissions: [
      'booking.read',
      'booking.create',
      'booking.update',
      'booking.assign',
      'booking.cancel',
      'driver.read',
      'driver.update',
      'vehicle.read',
      'tracking.read',
    ],
    category: 'operations',
  },
  {
    templateName: 'Finance User',
    description: 'Access to payments, invoices, and financial reports',
    permissions: [
      'booking.read',
      'booking.update.price',
      'payment.read',
      'payment.update',
      'payment.refund',
      'customer.read',
      'customer.update.creditLimit',
      'reports.finance',
    ],
    category: 'finance',
  },
  {
    templateName: 'Customer Support',
    description: 'Customer queries, booking status updates, and basic operations',
    permissions: [
      'booking.read',
      'booking.update.status',
      'customer.read',
      'driver.read',
      'vehicle.read',
      'tracking.read',
    ],
    category: 'support',
  },
];

// Top 91 Indian cities for autocomplete
export const INDIAN_CITIES = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Ahmedabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Jaipur',
  'Surat',
  'Lucknow',
  'Kanpur',
  'Nagpur',
  'Indore',
  'Thane',
  'Bhopal',
  'Visakhapatnam',
  'Pimpri-Chinchwad',
  'Patna',
  'Vadodara',
  'Ghaziabad',
  'Ludhiana',
  'Agra',
  'Nashik',
  'Faridabad',
  'Meerut',
  'Rajkot',
  'Kalyan-Dombivli',
  'Vasai-Virar',
  'Varanasi',
  'Srinagar',
  'Aurangabad',
  'Dhanbad',
  'Amritsar',
  'Navi Mumbai',
  'Allahabad',
  'Ranchi',
  'Howrah',
  'Coimbatore',
  'Jabalpur',
  'Gwalior',
  'Vijayawada',
  'Jodhpur',
  'Madurai',
  'Raipur',
  'Kota',
  'Chandigarh',
  'Guwahati',
  'Solapur',
  'Hubballi-Dharwad',
  'Tiruchirappalli',
  'Bareilly',
  'Mysore',
  'Tiruppur',
  'Gurgaon',
  'Aligarh',
  'Jalandhar',
  'Bhubaneswar',
  'Salem',
  'Mira-Bhayandar',
  'Warangal',
  'Thiruvananthapuram',
  'Guntur',
  'Bhiwandi',
  'Saharanpur',
  'Gorakhpur',
  'Bikaner',
  'Amravati',
  'Noida',
  'Jamshedpur',
  'Bhilai',
  'Cuttack',
  'Firozabad',
  'Kochi',
  'Nellore',
  'Bhavnagar',
  'Dehradun',
  'Durgapur',
  'Asansol',
  'Rourkela',
  'Nanded',
  'Kolhapur',
  'Ajmer',
  'Akola',
  'Gulbarga',
  'Jamnagar',
  'Ujjain',
  'Loni',
  'Siliguri',
  'Jhansi',
  'Ulhasnagar',
  'Jammu',
  'Sangli-Miraj-Kupwad',
  'Mangalore',
  'Erode',
  'Belgaum',
  'Ambattur',
  'Tirunelveli',
  'Malegaon',
  'Gaya',
] as const;
