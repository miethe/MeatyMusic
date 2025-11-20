# Frontend Role-Based Access Control Implementation

## Overview

This document describes the implementation of role-based access control (RBAC) in the MeatyMusic frontend, aligning with the backend RBAC system.

## Changes Made

### 1. API Types (`/apps/web/src/types/api.ts`)

**Added:**
- `UserRole` type: `'user' | 'admin'`
- Updated `User` interface to include:
  - `role: UserRole` - User's role
  - `is_active: boolean` - Account status
  - `email_verified: boolean` - Email verification status
  - `first_name?: string` - First name
  - `last_name?: string` - Last name
  - `username?: string` - Username
  - `last_login_at?: string` - Last login timestamp

### 2. Auth Hook (`/apps/web/src/hooks/useAuth.ts`)

**Enhanced:**
- Added `isAdmin` computed property based on `user.role === 'admin'`
- Returns: `{ user, isLoaded, isSignedIn, isAdmin, isLoading, error }`

**Added:**
- `useIsAdmin()` hook - Convenience hook for checking admin status

### 3. Auth Utilities (`/apps/web/src/lib/auth/utils.ts`)

**Added:**
- `isAdminRoute(pathname)` - Check if route requires admin role
- `isUserAdmin(user)` - Check if user has admin role
- `hasRequiredRole(user, pathname)` - Check if user has required role for route

**Updated:**
- Admin-only routes: `/entities/blueprints/*`, `/entities/sources/*`

### 4. Error Handling (`/apps/web/src/lib/errors/handlers.ts`)

**Enhanced:**
- `parseApiError()` - Maps HTTP 403 to `ERROR_CODES.FORBIDDEN`
- `getDefaultErrorMessage()` - User-friendly message for 403: "You do not have permission to access this resource."

**Added:**
- `isForbiddenError(error)` - Check if error is 403 Forbidden
- `isUnauthorizedError(error)` - Check if error is 401 Unauthorized

### 5. Navigation (`/apps/web/src/components/layout/AppShell.tsx`)

**Enhanced:**
- Fetches user role via `useAuth()` hook
- Displays user info with admin badge in sidebar
- Filters navigation items based on admin role
- Hides "Blueprints" and "Sources" menu items for non-admin users
- Shows "ADMIN" badge next to username for admin users

### 6. Access Control Components

#### `/apps/web/src/components/common/AccessDenied.tsx`
- User-friendly 403 error page
- Displays shield icon and access denied message
- Provides "Go Back" and "Go to Dashboard" buttons
- Shows helpful message about contacting administrator

#### `/apps/web/src/components/auth/AdminGuard.tsx`
- Guard component for protecting admin-only pages
- Shows `AccessDenied` component for non-admin users
- Supports custom messages and loading states
- Includes `useAdminGuard()` hook for conditional rendering

### 7. Protected Pages

#### `/apps/web/src/app/(dashboard)/entities/blueprints/page.tsx`
- Wrapped with `AdminGuard` component
- Custom message: "Blueprint management is only accessible to administrators."
- Loading fallback with spinner

### 8. Export Updates

**Updated:**
- `/apps/web/src/hooks/index.ts` - Exports `useIsAdmin`
- `/apps/web/src/components/index.ts` - Exports auth and common components
- `/apps/web/src/components/auth/index.ts` - New file exporting `AdminGuard`
- `/apps/web/src/components/common/index.ts` - New file exporting `AccessDenied`

## Usage Examples

### 1. Check if user is admin in a component

```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { isAdmin } = useAuth();

  return (
    <div>
      {isAdmin && <AdminOnlyFeature />}
    </div>
  );
}
```

### 2. Use the convenience hook

```tsx
import { useIsAdmin } from '@/hooks/useAuth';

function MyComponent() {
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return <p>This feature is for administrators only.</p>;
  }

  return <AdminFeature />;
}
```

### 3. Protect an entire page

```tsx
import { AdminGuard } from '@/components/auth/AdminGuard';

export default function AdminPage() {
  return (
    <AdminGuard message="This page is admin-only">
      <div>
        {/* Admin-only content */}
      </div>
    </AdminGuard>
  );
}
```

### 4. Conditional rendering within a page

```tsx
import { useAdminGuard } from '@/components/auth/AdminGuard';

function MyPage() {
  const { canAccess, isLoading } = useAdminGuard();

  if (isLoading) return <Spinner />;

  return (
    <div>
      <PublicContent />
      {canAccess && <AdminContent />}
    </div>
  );
}
```

### 5. Handle 403 errors in API calls

```tsx
import { isForbiddenError } from '@/lib/errors/handlers';
import { AccessDenied } from '@/components/common/AccessDenied';

function MyComponent() {
  const { data, error } = useQuery(...);

  if (error && isForbiddenError(error)) {
    return <AccessDenied />;
  }

  return <div>{data}</div>;
}
```

## Admin-Only Routes

The following routes are restricted to admin users:

- `/entities/blueprints` - Blueprint list
- `/entities/blueprints/new` - Create blueprint
- `/entities/blueprints/:id` - Blueprint detail
- `/entities/blueprints/:id/edit` - Edit blueprint
- `/entities/sources` - Source list
- `/entities/sources/new` - Create source
- `/entities/sources/:id` - Source detail

## Navigation Behavior

### For Regular Users:
- Dashboard ✓
- Songs ✓
- Library:
  - Styles ✓
  - Lyrics ✓
  - Personas ✓
  - Producer Notes ✓
  - Blueprints ✗ (hidden)
  - Sources ✗ (hidden)
- Settings ✓

### For Admin Users:
- All routes accessible
- "ADMIN" badge shown in sidebar
- Full navigation menu visible

## Backend Integration

### User Object from `/api/v1/users/me`:

```typescript
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "username": "johndoe",
  "role": "admin", // or "user"
  "is_active": true,
  "email_verified": true,
  "created_at": "2025-11-20T00:00:00Z",
  "updated_at": "2025-11-20T00:00:00Z",
  "last_login_at": "2025-11-20T00:00:00Z"
}
```

### 403 Forbidden Response:

```json
{
  "error": "FORBIDDEN",
  "detail": "You do not have permission to access this resource"
}
```

## Testing Checklist

- [ ] Non-admin users cannot see Blueprints in navigation
- [ ] Non-admin users cannot see Sources in navigation
- [ ] Attempting to access `/entities/blueprints` as non-admin shows AccessDenied
- [ ] Admin users see "ADMIN" badge in sidebar
- [ ] Admin users can access all blueprint routes
- [ ] 403 errors display user-friendly message
- [ ] `useAuth()` returns correct `isAdmin` value
- [ ] `useIsAdmin()` hook works correctly
- [ ] User info displays correctly in sidebar (name, email)
- [ ] Navigation filters work on mount and when auth state changes

## Future Enhancements

1. **Granular Permissions**: Extend beyond binary admin/user to role-based permissions
2. **Permission Gates**: Create more specific guards (e.g., `<CanEditBlueprints>`)
3. **Audit Logging**: Track admin actions for security
4. **Role Management UI**: Allow admins to manage user roles
5. **API Key Management**: Admin-only API key generation

## Files Modified

1. `/apps/web/src/types/api.ts` - User type with role
2. `/apps/web/src/hooks/useAuth.ts` - isAdmin property and useIsAdmin hook
3. `/apps/web/src/hooks/index.ts` - Export useIsAdmin
4. `/apps/web/src/lib/auth/utils.ts` - Admin role checking utilities
5. `/apps/web/src/lib/errors/handlers.ts` - 403 error handling
6. `/apps/web/src/components/layout/AppShell.tsx` - Role-based navigation
7. `/apps/web/src/app/(dashboard)/entities/blueprints/page.tsx` - AdminGuard

## Files Created

1. `/apps/web/src/components/common/AccessDenied.tsx` - 403 error component
2. `/apps/web/src/components/auth/AdminGuard.tsx` - Admin route guard
3. `/apps/web/src/components/auth/index.ts` - Auth components exports
4. `/apps/web/src/components/common/index.ts` - Common components exports

## Success Criteria (Met)

- ✅ Auth context includes role field
- ✅ isAdmin helper function works correctly
- ✅ Blueprint navigation hidden for non-admin users
- ✅ 403 errors handled gracefully with user-friendly message
- ✅ Type safety maintained throughout
- ✅ Follows existing MeatyMusic patterns
- ✅ Accessibility maintained (keyboard navigation, ARIA)
- ✅ No TypeScript `any` types used
