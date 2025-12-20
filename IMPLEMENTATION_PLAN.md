# Cloudtruck Admin Dashboard (Staff App) - Implementation Plan

## Executive Summary

A Next.js 16 admin dashboard for operations staff to manage bookings, assign drivers, track shipments, and oversee the entire trucking workflow. The implementation follows a phased approach with 4 weeks timeline.

---

## Tech Stack Confirmation

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **UI Library**: ShadCN UI
- **State Management**: Zustand
- **Validation**: Zod + React Hook Form
- **HTTP Client**: Axios with interceptors
- **Real-time**: Socket.io Client
- **Charts**: Recharts
- **Maps**: Leaflet / Google Maps
- **Excel Export**: xlsx

---

## Phase 1: Foundation (Week 1)

### 1.1 Project Setup & Configuration

**Tasks:**
- Initialize Next.js 16 project with TypeScript
- Configure Tailwind CSS
- Install and configure ShadCN UI
- Set up absolute imports (`@/`)
- Configure ESLint and Prettier
- Set up environment variables

**Files to create:**
```
next.config.js
tailwind.config.ts
tsconfig.json
.env.local
.eslintrc.json
.prettierrc
```

### 1.2 Authentication System

**Files to create:**
```
src/app/(auth)/login/page.tsx
src/app/(auth)/layout.tsx
src/store/authStore.ts
src/lib/axios.ts
src/lib/api.ts (auth methods)
src/validators/schemas.ts (login schema)
src/types/auth.types.ts
```

**Features:**
- Email/password login form
- JWT token storage in Zustand
- Axios interceptors for auth headers
- Token refresh logic (401 handling)
- Protected route middleware
- Logout functionality

**Components:**
- `LoginForm` - Email/password with validation
- `AuthProvider` - Client-side auth wrapper

### 1.3 Dashboard Layout

**Files to create:**
```
src/app/(dashboard)/layout.tsx
src/components/layout/Sidebar.tsx
src/components/layout/Header.tsx
src/components/layout/DashboardLayout.tsx
src/components/layout/UserMenu.tsx
```

**Features:**
- Collapsible sidebar with navigation
- Top header with user profile, notifications
- Responsive design (mobile hamburger menu)
- Active route highlighting
- Role-based menu items

**Navigation structure:**
```
- Dashboard (overview)
- Bookings
  - New Requests
  - All Bookings
  - Assign Driver
- Drivers
  - All Drivers
  - Available Drivers
  - Approvals
- Customers
  - All Customers
  - Pending Verification
- Vehicles
  - All Vehicles
  - Add Vehicle
- Tracking
  - Live Trips
  - Map View
- Payments
  - All Payments
  - Pending
- Reports
```

### 1.4 Common Components

**Files to create:**
```
src/components/common/DataTable.tsx
src/components/common/StatusBadge.tsx
src/components/common/LoadingSpinner.tsx
src/components/common/EmptyState.tsx
src/components/common/ErrorState.tsx
src/components/common/PageHeader.tsx
src/components/common/SearchBar.tsx
src/components/common/FilterDropdown.tsx
src/components/common/ExportButton.tsx
```

---

## Phase 2: Core Booking Management (Week 2)

### 2.1 Dashboard Overview Page

**File:** `src/app/(dashboard)/dashboard/page.tsx`

**Features:**
- Real-time counters:
  - New Requests
  - Assigned Today
  - In Transit
  - Delivered Today
  - POD Pending
- Recent activity feed
- Quick actions
- Charts (booking trends, status distribution)

**Components to create:**
```
src/components/dashboard/StatCard.tsx
src/components/dashboard/RecentActivity.tsx
src/components/dashboard/QuickActions.tsx
src/components/dashboard/BookingTrendsChart.tsx
src/components/dashboard/StatusDistributionChart.tsx
```

**Store:**
```typescript
// src/store/dashboardStore.ts
interface DashboardState {
  stats: {
    newRequests: number;
    assigned: number;
    inTransit: number;
    delivered: number;
    podPending: number;
  };
  recentActivity: Activity[];
  fetchStats: () => Promise<void>;
}
```

### 2.2 New Requests Inbox

**File:** `src/app/(dashboard)/bookings/new-requests/page.tsx`

**Features:**
- List of all bookings with status "created" or "under review"
- Card view with key info:
  - Booking ID
  - Customer name
  - Route (pickup → drop)
  - Truck type needed
  - Load date/time
  - Payment status
  - Created timestamp
- Filters:
  - Date range
  - Truck type
  - City
  - Customer
- Sorting options
- Pagination
- Quick actions:
  - View details
  - Assign driver
  - Update status
  - Add notes

**Components:**
```
src/components/bookings/BookingCard.tsx
src/components/bookings/BookingFilters.tsx
src/components/bookings/QuickAssignDialog.tsx
```

**Store:**
```typescript
// src/store/bookingStore.ts
interface BookingState {
  bookings: Booking[];
  filters: BookingFilters;
  pagination: Pagination;
  setBookings: (bookings: Booking[]) => void;
  setFilters: (filters: BookingFilters) => void;
  clearFilters: () => void;
}
```

### 2.3 Booking Detail Page

**File:** `src/app/(dashboard)/bookings/[id]/page.tsx`

**Features:**
- Full booking information
- Customer details (company, contact, GST)
- Route map with pickup and drop markers
- Material and truck specifications
- Status timeline
- Payment information
- Driver and vehicle details (if assigned)
- Documents section (cargo images)
- Notes and comments
- Action buttons:
  - Assign Driver
  - Update Status
  - Add Note
  - Download Invoice
  - Cancel Booking

**Components:**
```
src/components/bookings/BookingDetailHeader.tsx
src/components/bookings/CustomerInfo.tsx
src/components/bookings/RouteMap.tsx
src/components/bookings/StatusTimeline.tsx
src/components/bookings/PaymentInfo.tsx
src/components/bookings/AssignedDetails.tsx
src/components/bookings/DocumentsSection.tsx
src/components/bookings/NotesSection.tsx
src/components/bookings/ActionButtons.tsx
```

### 2.4 Driver Assignment Modal

**Component:** `src/components/bookings/AssignDriverModal.tsx`

**Features:**
- Search and filter available drivers:
  - By location (proximity to pickup)
  - By truck type
  - By availability status
- Display driver info:
  - Name, photo
  - Rating (placeholder for future)
  - Current location
  - Truck details
  - Last trip completed
- Select driver and vehicle
- Add assignment notes
- Confirm and assign

**Related files:**
```
src/components/drivers/DriverCard.tsx
src/components/drivers/DriverSearchFilters.tsx
src/hooks/useAvailableDrivers.ts
```

**API methods:**
```typescript
// src/lib/api.ts
export const bookingApi = {
  getAll: (params) => api.get('/bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  assignDriver: (id, data) => api.post(`/bookings/${id}/assign-driver`, data),
  updateStatus: (id, data) => api.patch(`/bookings/${id}/status`, data),
};
```

---

## Phase 3: Driver & Vehicle Management (Week 3)

### 3.1 All Drivers Page

**File:** `src/app/(dashboard)/drivers/page.tsx`

**Features:**
- DataTable with columns:
  - Name + Photo
  - Phone (masked)
  - Status (available, on-trip, offline)
  - Truck type
  - Total trips
  - Last active
  - Actions
- Filters:
  - Status
  - Truck type
  - City
- Search by name/phone
- Actions:
  - View details
  - Approve/Block
  - View trip history

**Components:**
```
src/components/drivers/DriverTable.tsx
src/components/drivers/DriverStatusBadge.tsx
src/components/drivers/DriverActions.tsx
```

### 3.2 Driver Detail Page

**File:** `src/app/(dashboard)/drivers/[id]/page.tsx`

**Features:**
- Profile information (name, photo, license)
- Contact details
- Documents (license, photo, bank details)
- Truck(s) owned/operated
- Trip history
- Performance metrics (placeholder)
- Status management
- Notes

**Components:**
```
src/components/drivers/DriverProfile.tsx
src/components/drivers/DriverDocuments.tsx
src/components/drivers/DriverVehicles.tsx
src/components/drivers/DriverTripHistory.tsx
```

### 3.3 Driver Approvals Page

**File:** `src/app/(dashboard)/drivers/approvals/page.tsx`

**Features:**
- List of drivers with status "pending verification"
- Review documents
- Approve or reject
- Add rejection reason

### 3.4 All Vehicles Page

**File:** `src/app/(dashboard)/vehicles/page.tsx`

**Features:**
- DataTable with columns:
  - Vehicle number
  - Truck type
  - Length/capacity
  - Body type
  - Owner/Driver
  - Status
  - Actions
- Filters and search
- Add new vehicle

**Components:**
```
src/components/vehicles/VehicleTable.tsx
src/components/vehicles/AddVehicleModal.tsx
src/components/vehicles/VehicleDocuments.tsx
```

### 3.5 Vehicle Detail Page

**File:** `src/app/(dashboard)/vehicles/[id]/page.tsx`

**Features:**
- Vehicle specifications
- RC document
- Ownership details
- Trip history
- Maintenance records (placeholder)

---

## Phase 4: Tracking & Payments (Week 4)

### 4.1 Live Trips Page

**File:** `src/app/(dashboard)/tracking/live-trips/page.tsx`

**Features:**
- List of bookings with status "in-transit"
- Real-time location updates (WebSocket)
- Columns:
  - Booking ID
  - Driver name
  - Route
  - Status
  - Last location
  - ETA (placeholder)
- Filter by city, driver, customer
- Click to view on map

**Components:**
```
src/components/tracking/LiveTripCard.tsx
src/components/tracking/LiveTripFilters.tsx
src/components/tracking/LocationBadge.tsx
```

**WebSocket integration:**
```typescript
// src/hooks/useTrackingWebSocket.ts
export function useTrackingWebSocket() {
  const { on, emit } = useWebSocket('/tracking');
  
  useEffect(() => {
    on('location-update', (data) => {
      // Update store with new location
    });
  }, []);
}
```

### 4.2 Map View Page

**File:** `src/app/(dashboard)/tracking/map/page.tsx`

**Features:**
- Full-screen map
- All in-transit bookings shown as markers
- Driver icon with direction
- Click marker to show trip details popup
- Route polyline (pickup to drop)
- Filter by status, driver, customer

**Components:**
```
src/components/tracking/TrackingMap.tsx
src/components/tracking/TripMarker.tsx
src/components/tracking/TripPopup.tsx
src/components/tracking/RoutePolyline.tsx
```

**Libraries:**
```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

### 4.3 Tracking Detail Modal

**Component:** `src/components/tracking/TrackingDetailModal.tsx`

**Features:**
- Map with current location
- Status timeline
- Location history
- Last updated timestamp
- Driver contact
- Add delay note
- Manual status update

### 4.4 All Payments Page

**File:** `src/app/(dashboard)/payments/page.tsx`

**Features:**
- DataTable with columns:
  - Booking ID
  - Customer
  - Amount
  - Payment status
  - Payment method
  - Date
  - Actions
- Filters:
  - Payment status
  - Date range
  - Payment method
- Mark as received (for NEFT/RTGS)
- Download invoice

**Components:**
```
src/components/payments/PaymentTable.tsx
src/components/payments/PaymentStatusBadge.tsx
src/components/payments/MarkAsReceivedModal.tsx
src/components/payments/DownloadInvoiceButton.tsx
```

### 4.5 Payment Detail Page

**File:** `src/app/(dashboard)/payments/[id]/page.tsx`

**Features:**
- Payment information
- Booking details
- Customer details
- Payment timeline
- Transaction reference
- Invoice download

---

## Phase 5: Advanced Features & Polish (Week 5)

### 5.1 Customer Management

**Files:**
```
src/app/(dashboard)/customers/page.tsx
src/app/(dashboard)/customers/[id]/page.tsx
```

**Features:**
- List all customers
- Customer profile
- Company details
- GST information
- Booking history
- Payment history
- KYC status

### 5.2 Reports & Export

**File:** `src/app/(dashboard)/reports/page.tsx`

**Features:**
- Date range selector
- Export options:
  - Bookings report
  - Payments report
  - Driver performance
  - Customer report
- Excel generation using `xlsx` library

**Implementation:**
```typescript
// src/lib/export.ts
import * as XLSX from 'xlsx';

export function exportToExcel(data: any[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
```

### 5.3 Notifications System

**Components:**
```
src/components/layout/NotificationBell.tsx
src/components/notifications/NotificationList.tsx
src/components/notifications/NotificationItem.tsx
```

**Features:**
- Real-time notifications (WebSocket)
- Notification badge count
- Dropdown with recent notifications
- Mark as read
- Notification types:
  - New booking created
  - Driver assigned
  - Status updated
  - Payment received
  - POD uploaded

### 5.4 Search & Filters

**Global search:**
```
src/components/layout/GlobalSearch.tsx
```

**Features:**
- Search across bookings, drivers, customers
- Keyboard shortcut (Ctrl+K)
- Recent searches
- Quick navigation

### 5.5 Settings Page

**File:** `src/app/(dashboard)/settings/page.tsx`

**Features:**
- Profile settings
- Change password
- Notification preferences
- Role and permissions display

---

## File Structure Summary

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   ├── bookings/
│   │   │   ├── page.tsx
│   │   │   ├── new-requests/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── drivers/
│   │   │   ├── page.tsx
│   │   │   ├── approvals/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── customers/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── vehicles/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── tracking/
│   │   │   ├── live-trips/page.tsx
│   │   │   └── map/page.tsx
│   │   ├── payments/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── settings/page.tsx
│   │   └── layout.tsx
│   ├── layout.tsx
│   └── error.tsx
├── components/
│   ├── ui/                    # ShadCN components (40+ components)
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── UserMenu.tsx
│   │   └── NotificationBell.tsx
│   ├── common/
│   │   ├── DataTable.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── EmptyState.tsx
│   │   ├── SearchBar.tsx
│   │   └── ExportButton.tsx
│   ├── dashboard/
│   │   ├── StatCard.tsx
│   │   ├── RecentActivity.tsx
│   │   └── BookingTrendsChart.tsx
│   ├── bookings/
│   │   ├── BookingCard.tsx
│   │   ├── BookingFilters.tsx
│   │   ├── BookingDetailHeader.tsx
│   │   ├── AssignDriverModal.tsx
│   │   ├── StatusTimeline.tsx
│   │   └── RouteMap.tsx
│   ├── drivers/
│   │   ├── DriverTable.tsx
│   │   ├── DriverCard.tsx
│   │   ├── DriverProfile.tsx
│   │   └── DriverSearchFilters.tsx
│   ├── tracking/
│   │   ├── TrackingMap.tsx
│   │   ├── LiveTripCard.tsx
│   │   └── TrackingDetailModal.tsx
│   ├── payments/
│   │   ├── PaymentTable.tsx
│   │   └── MarkAsReceivedModal.tsx
│   └── notifications/
│       └── NotificationList.tsx
├── lib/
│   ├── axios.ts
│   ├── api.ts
│   ├── utils.ts
│   ├── constants.ts
│   └── export.ts
├── store/
│   ├── authStore.ts
│   ├── bookingStore.ts
│   ├── driverStore.ts
│   ├── dashboardStore.ts
│   └── notificationStore.ts
├── types/
│   ├── booking.types.ts
│   ├── driver.types.ts
│   ├── vehicle.types.ts
│   ├── payment.types.ts
│   └── index.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useBookings.ts
│   ├── useDrivers.ts
│   ├── useWebSocket.ts
│   └── useTrackingWebSocket.ts
└── validators/
    └── schemas.ts
```

---

## API Integration Checklist

### Authentication APIs
- [ ] POST `/auth/staff/login` - Staff login
- [ ] POST `/auth/refresh-token` - Token refresh
- [ ] POST `/auth/logout` - Logout

### Booking APIs
- [ ] GET `/bookings` - List bookings (with filters)
- [ ] GET `/bookings/:id` - Get booking details
- [ ] POST `/bookings/:id/assign-driver` - Assign driver
- [ ] PATCH `/bookings/:id/status` - Update status
- [ ] POST `/bookings/:id/notes` - Add note
- [ ] GET `/bookings/stats` - Dashboard stats

### Driver APIs
- [ ] GET `/drivers` - List drivers
- [ ] GET `/drivers/:id` - Get driver details
- [ ] GET `/drivers/available` - Get available drivers
- [ ] PATCH `/drivers/:id/approve` - Approve driver
- [ ] PATCH `/drivers/:id/block` - Block driver

### Vehicle APIs
- [ ] GET `/vehicles` - List vehicles
- [ ] GET `/vehicles/:id` - Get vehicle details
- [ ] POST `/vehicles` - Add vehicle

### Tracking APIs
- [ ] GET `/tracking/booking/:id/latest` - Latest location
- [ ] GET `/tracking/booking/:id/history` - Location history
- [ ] WebSocket `/tracking` - Real-time updates

### Payment APIs
- [ ] GET `/payments` - List payments
- [ ] GET `/payments/:id` - Get payment details
- [ ] PATCH `/payments/:id/mark-received` - Mark as received

### Customer APIs
- [ ] GET `/customers` - List customers
- [ ] GET `/customers/:id` - Get customer details

---

## Implementation Timeline

### Week 1: Foundation
- Days 1-2: Project setup, authentication, Zustand stores
- Days 3-4: Dashboard layout, sidebar, header
- Day 5: Common components, DataTable

### Week 2: Core Booking Management
- Days 1-2: Dashboard overview, stat cards, charts
- Day 3: New requests inbox, booking cards
- Days 4-5: Booking detail page, assign driver modal

### Week 3: Driver & Vehicle Management
- Days 1-2: Drivers pages (list, detail, approvals)
- Days 3-4: Vehicles pages (list, detail)
- Day 5: Testing and bug fixes

### Week 4: Tracking & Payments
- Days 1-2: Live trips, map view, WebSocket integration
- Days 3-4: Payments pages
- Day 5: Integration testing

### Week 5: Polish & Advanced Features
- Days 1-2: Customer management, reports, export
- Days 3-4: Notifications, global search, settings
- Day 5: Final testing, documentation

---

## Dependencies Installation

```bash
# Core dependencies
npm install next@latest react@latest react-dom@latest
npm install typescript @types/react @types/node
npm install zustand
npm install axios
npm install socket.io-client
npm install zod
npm install react-hook-form @hookform/resolvers

# UI & Styling
npm install tailwindcss postcss autoprefixer
npm install @radix-ui/react-slot @radix-ui/react-dialog
npm install lucide-react
npm install class-variance-authority clsx tailwind-merge

# Charts & Maps
npm install recharts
npm install leaflet react-leaflet
npm install -D @types/leaflet

# Excel export
npm install xlsx

# Dev dependencies
npm install -D eslint eslint-config-next
npm install -D prettier prettier-plugin-tailwindcss
```

---

## Testing Strategy

### Manual Testing Checklist
- [ ] Login/logout flow
- [ ] Token refresh on 401
- [ ] All pages render correctly
- [ ] Filters and search work
- [ ] Pagination works
- [ ] Forms validate correctly
- [ ] API error handling
- [ ] Loading states display
- [ ] Empty states display
- [ ] WebSocket connection
- [ ] Real-time updates
- [ ] Mobile responsiveness
- [ ] Keyboard navigation
- [ ] Export to Excel

### Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

---

## Performance Optimization

1. **Code splitting**: Use dynamic imports for heavy components (maps, charts)
2. **Memoization**: Use `memo`, `useMemo`, `useCallback` for expensive operations
3. **Image optimization**: Use Next.js Image component
4. **API response caching**: Cache frequently accessed data
5. **Lazy loading**: Load data on demand with pagination
6. **WebSocket optimization**: Throttle location updates

---

## Security Considerations

1. **Authentication**: JWT tokens stored in Zustand persist
2. **Authorization**: Role-based access control
3. **API security**: All requests include auth token
4. **XSS prevention**: React escapes by default
5. **HTTPS**: Enforce in production
6. **Token refresh**: Automatic refresh on expiry
7. **Audit logging**: Log critical actions

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Build passes without errors
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings fixed
- [ ] Responsive design tested
- [ ] API endpoints correct
- [ ] WebSocket connection tested
- [ ] Error boundaries in place
- [ ] Loading states everywhere
- [ ] Toast notifications working

---

## Post-Launch Enhancements (Future)

1. **Advanced filters**: Save filter presets
2. **Bulk actions**: Assign multiple drivers at once
3. **Advanced analytics**: Performance dashboards
4. **Route optimization**: Suggest optimal routes
5. **Driver ratings**: Rating system
6. **SLA tracking**: Monitor delivery times
7. **Automated assignments**: ML-based driver matching
8. **Mobile app**: React Native version

---

## Support & Documentation

Create documentation for:
1. User guide for staff
2. API integration guide
3. Component library documentation
4. Deployment guide
5. Troubleshooting guide

---

**Total Estimated Effort**: 4-5 weeks for MVP with core features
**Team Size**: 1-2 frontend developers
**Status**: Ready to implement ✅
