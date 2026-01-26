# Role Template Management UI

Complete role-based access control (RBAC) management interface for Cloudtruck Admin Panel.

## Overview

The role template management system provides a comprehensive UI for managing permissions and role templates across the organization. This includes creating custom role templates, assigning permissions, and integrating with employee management.

## Features

### 1. Role Templates List (`/organization/roles`)
- View all role templates in a paginated table
- Filter by category (Operations, Management, Finance, Customer Service, Technical)
- Filter by status (Active/Inactive)
- Search by template name
- Clear all filters button
- Real-time data updates after mutations

### 2. Role Template Table
- **Columns:**
  - Template Name
  - Category with badge
  - Description
  - Permission Count (badge)
  - Employee Count (badge)
  - Status (Active/Inactive badge)
  - Actions (dropdown menu)

- **Actions:**
  - View Details (opens drawer)
  - Edit Template (opens modal)
  - Delete Template (with confirmation dialog)

### 3. Create Role Template
- Form fields:
  - Template Name (required)
  - Template Key (auto-generated from name, e.g., "operations-manager")
  - Category (select from 5 options)
  - Description (optional)
  - Permissions (via PermissionSelector)

- Permission selection via accordion grouped by resource
- Real-time validation and error handling
- Success/error toast notifications

### 4. Edit Role Template
- Pre-filled form with existing data
- Update name, key, category, description
- Modify permissions dynamically
- Warning message: "Changes will affect X employees using this template"
- Confirmation before saving

### 5. View Role Template Details
- Sheet drawer from right side
- **Displays:**
  - Template name and category
  - Status badge
  - Complete description
  - Permissions grouped by resource (Booking, Driver, Vehicle, etc.)
  - Permission count per resource (badge)
  - Total permission count

### 6. Advanced Permission Selector
- **Features:**
  - Search functionality across all permissions
  - Accordion grouping by resource (15 resources)
  - Select All / Deselect All buttons (global)
  - Resource-level checkboxes (select all in a group)
  - Individual permission checkboxes
  - Indeterminate state for partial selection
  - Badge showing selected count per resource
  - Max height with scroll for long lists
  - Fetches from `/api/v1/permissions/grouped` endpoint

- **Resources (15 total):**
  - Booking (8 permissions)
  - Driver (8 permissions)
  - Vehicle (6 permissions)
  - Customer (8 permissions)
  - Payment (6 permissions)
  - E-way Bill (6 permissions)
  - Tracking (3 permissions)
  - Staff (5 permissions)
  - Organization (2 permissions)
  - Master Data (5 permissions)
  - Reports (2 permissions)
  - Dashboard (1 permission)
  - Document (2 permissions)
  - Notification (2 permissions)
  - User (2 permissions)

### 7. Employee Integration
- AddEmployeeModal dynamically fetches active role templates
- Dropdown shows template name + permission count
- Optional field with helper text
- Loading state while fetching
- Auto-assigns permissions on employee creation

## Components

### Frontend (`admin/src/`)

1. **Page Component**
   - File: `app/(dashboard)/organization/roles/page.tsx`
   - Main page with filters and table
   - Client component with state management

2. **RoleTemplateTable**
   - File: `components/organization/RoleTemplateTable.tsx`
   - Table with CRUD actions
   - Delete confirmation dialog
   - Integrates with EditModal and DetailDrawer

3. **AddRoleTemplateModal**
   - File: `components/organization/AddRoleTemplateModal.tsx`
   - Create new role template
   - Form validation with error handling
   - PermissionSelector integration

4. **EditRoleTemplateModal**
   - File: `components/organization/EditRoleTemplateModal.tsx`
   - Edit existing template
   - Pre-filled form data
   - Warning about affected employees

5. **RoleTemplateDetailDrawer**
   - File: `components/organization/RoleTemplateDetailDrawer.tsx`
   - Sheet drawer component
   - Permissions grouped by resource
   - Read-only view

6. **PermissionSelector**
   - File: `components/organization/PermissionSelector.tsx`
   - Complex permission selection UI
   - Search, accordion, checkboxes
   - Indeterminate states

7. **useRoleTemplates Hook**
   - File: `hooks/useRoleTemplates.ts`
   - Custom hook for data fetching
   - Fetches role templates and permissions
   - Centralized API calls

### Backend (`backend/src/`)

1. **Permission Controller**
   - File: `controllers/permission.controller.js`
   - 6 endpoints: getAllPermissions, getPermissionById, createPermission, updatePermission, deletePermission, getGroupedPermissions
   - Request/response handling

2. **Permission Service**
   - File: `services/permission.service.js`
   - Business logic for permissions
   - Validation and error handling
   - Audit logging

3. **Permission Routes**
   - File: `routes/permission.routes.js`
   - Route definitions
   - Authentication middleware
   - Future: Add permission checks for admin-only routes

## API Endpoints

### Permissions

#### Get All Permissions
```
GET /api/v1/permissions
Query Params:
  - resource: string (optional)
  - action: string (optional)
  - isActive: boolean (optional)

Response:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "key": "booking.create",
      "name": "Create Booking",
      "resource": "booking",
      "action": "create",
      "description": "...",
      "isActive": true
    }
  ],
  "message": "Permissions fetched successfully"
}
```

#### Get Grouped Permissions
```
GET /api/v1/permissions/grouped

Response:
{
  "success": true,
  "data": {
    "booking": [
      { "key": "booking.create", "name": "Create Booking", ... },
      { "key": "booking.read", "name": "View Bookings", ... }
    ],
    "driver": [...]
  }
}
```

#### Get Permission by ID
```
GET /api/v1/permissions/:id
```

#### Create Permission (Admin)
```
POST /api/v1/permissions
Body:
{
  "key": "resource.action",
  "name": "Permission Name",
  "resource": "resource-name",
  "action": "action-name",
  "description": "Description"
}
```

#### Update Permission (Admin)
```
PUT /api/v1/permissions/:id
Body: Partial permission object
```

#### Delete Permission (Admin)
```
DELETE /api/v1/permissions/:id
(Soft delete - sets isActive: false)
```

### Role Templates

#### Get All Role Templates
```
GET /api/v1/role-templates
Query Params:
  - category: string (optional)
  - isActive: boolean (optional)
  - search: string (optional)

Response:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "templateName": "Operations Manager",
      "templateKey": "operations-manager",
      "category": "operations",
      "description": "...",
      "permissions": ["permission_id_1", "permission_id_2", ...],
      "employeeCount": 5,
      "isActive": true
    }
  ]
}
```

#### Get Role Template by ID
```
GET /api/v1/role-templates/:id
(Populates permission details)
```

#### Create Role Template
```
POST /api/v1/role-templates
Body:
{
  "templateName": "Custom Role",
  "templateKey": "custom-role",
  "category": "operations",
  "description": "Description",
  "permissions": ["permission_id_1", "permission_id_2"]
}
```

#### Update Role Template
```
PUT /api/v1/role-templates/:id
Body: Partial template object
```

#### Delete Role Template
```
DELETE /api/v1/role-templates/:id
(Soft delete)
```

## Data Flow

### Create Role Template Flow:
1. User clicks "Create Role Template"
2. Modal opens with empty form
3. User fills name, key, category, description
4. User selects permissions via PermissionSelector
5. PermissionSelector fetches grouped permissions from API
6. User searches/filters permissions
7. User selects permissions (individual or resource-level)
8. User submits form
9. POST request to `/api/v1/role-templates`
10. Success: Modal closes, table refreshes, success toast
11. Error: Error message displayed, modal stays open

### Edit Role Template Flow:
1. User clicks "Edit" in table dropdown
2. Modal opens with pre-filled data
3. GET request to fetch template details (if not in cache)
4. PermissionSelector pre-selects existing permissions
5. User modifies fields/permissions
6. User submits form
7. PUT request to `/api/v1/role-templates/:id`
8. Success: Modal closes, table refreshes, success toast
9. Error: Error message displayed

### Assign Role to Employee Flow:
1. User opens AddEmployeeModal
2. Modal opens and fetches active role templates
3. GET request to `/api/v1/role-templates?isActive=true`
4. Dropdown populated with template options
5. User selects role template (optional)
6. User fills other employee details
7. User submits form
8. POST request to `/api/v1/staff` with roleTemplate ID
9. Backend auto-assigns permissions from template
10. Success: Employee created with permissions

## State Management

- **Local State:** React `useState` for modal open/close, form data
- **Server State:** Custom hooks (`useRoleTemplates`) for API data
- **Form State:** Controlled components with validation
- **Permission State:** Array of selected permission IDs

## Validation

### Frontend:
- Template name: Required, min 3 chars
- Template key: Required, lowercase with hyphens, unique
- Category: Required, select from predefined list
- Permissions: At least 1 permission required

### Backend:
- Duplicate key check
- Permission ID validation
- User authentication check
- Audit logging for all operations

## Error Handling

- API errors displayed via toast notifications
- Form validation errors shown inline
- Network errors caught and displayed
- Loading states during async operations

## Security

- All routes require authentication (`verifyJWT` middleware)
- Admin-only routes need permission checks (TODO)
- Audit logging for create/update/delete operations
- Soft delete (isActive: false) instead of hard delete

## Accessibility

- Keyboard navigation support
- ARIA labels on interactive elements
- Focus management in modals
- Screen reader friendly

## Responsive Design

- Mobile-first approach
- Responsive table with horizontal scroll
- Stacked layout on small screens
- Touch-friendly buttons and dropdowns

## Performance

- Lazy loading of modal components
- Debounced search in PermissionSelector
- Optimized re-renders with React.memo (where needed)
- Pagination for large datasets

## Testing Checklist

- [x] Role templates page loads and displays data
- [x] Filtering by category works
- [x] Filtering by status works
- [x] Search by name works
- [x] Add modal opens and closes
- [x] Permission selector displays grouped permissions
- [x] Permission selector search works
- [x] Permission selector select all/deselect all works
- [x] Resource-level checkbox selects all in group
- [x] Edit modal pre-fills data
- [x] Detail drawer shows complete info
- [x] Delete confirmation works
- [x] AddEmployeeModal fetches templates dynamically
- [ ] Backend permissions API tested
- [ ] Full CRUD flow tested end-to-end
- [ ] Permission checks on admin routes
- [ ] Audit logs verify correctly

## Future Enhancements

1. **Role Template Cloning**
   - Duplicate existing template with modifications
   - "Clone" action in dropdown menu

2. **Bulk Permission Assignment**
   - Select multiple templates
   - Assign/remove permissions in bulk

3. **Role Analytics**
   - Most used templates
   - Permission usage statistics
   - Template adoption rate

4. **Permission Impact Analysis**
   - Show which roles use a specific permission
   - Warning when deleting/modifying permissions

5. **Role Comparison**
   - Compare permissions between two templates
   - Side-by-side view

6. **Permission Groups**
   - Create logical permission groups
   - Assign entire groups to templates

7. **Role Template Versioning**
   - Track changes to templates over time
   - Rollback to previous versions

8. **Advanced Filtering**
   - Filter by permission count
   - Filter by employee count
   - Multi-select category filter

## Known Issues

None at the moment.

## Dependencies

- `@radix-ui/react-dialog` - Modal/dialog components
- `@radix-ui/react-dropdown-menu` - Action dropdown
- `@radix-ui/react-accordion` - Permission grouping
- `@radix-ui/react-checkbox` - Permission selection
- `lucide-react` - Icons
- `sonner` - Toast notifications
- `axios` - HTTP client

## Related Documentation

- [RBAC_SEED_README.md](../../../backend/src/scripts/RBAC_SEED_README.md) - Seed scripts documentation
- [PROJECT_TRACKER.md](../../../PROJECT_TRACKER.md) - Overall project progress
- [ADMIN_PROGRESS.md](../../ADMIN_PROGRESS.md) - Frontend implementation status

## Files Summary

**Frontend (7 files):**
- `app/(dashboard)/organization/roles/page.tsx`
- `components/organization/RoleTemplateTable.tsx`
- `components/organization/AddRoleTemplateModal.tsx`
- `components/organization/EditRoleTemplateModal.tsx`
- `components/organization/RoleTemplateDetailDrawer.tsx`
- `components/organization/PermissionSelector.tsx`
- `hooks/useRoleTemplates.ts`

**Backend (3 files):**
- `controllers/permission.controller.js`
- `services/permission.service.js`
- `routes/permission.routes.js`

**Modified Files (2):**
- `components/organization/AddEmployeeModal.tsx` - Dynamic role template fetch
- `routes/index.js` - Registered permissions routes

**Total:** 12 files (10 new, 2 modified)

---

**Last Updated:** January 26, 2026  
**Status:** ✅ Complete - Ready for testing  
**Next:** Add permission checks to admin-only endpoints
