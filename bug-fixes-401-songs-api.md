# Bug Fixes: 401 Unauthorized on /songs API Endpoints

## Issues Fixed

### 1. Missing Clerk Environment Variables in Docker
- **Bug**: Docker Compose missing `CLERK_JWKS_URL`, `CLERK_JWT_ISSUER`, `CLERK_JWKS_CACHE_TTL`
- **Fix**: Added missing environment variables to `docker-compose.yml` (lines 74-76)

### 2. UUID vs VARCHAR Type Mismatch
- **Bug**: Database columns `users.id`, `tenants.id`, `user_preferences.id` defined as VARCHAR(36) instead of UUID
- **Fix**:
  - Updated `UUIDv7Mixin` in `app/db/functions/uuid_v7.py` to use `UUID(as_uuid=True)`
  - Created migration `20251117_1022_47a5cb79a5cb_fix_uuid_column_types.py` to convert existing columns

### 3. Dev Bypass Missing Tenant Creation
- **Bug**: Dev auth bypass attempted to create users without tenant_id, violating NOT NULL constraint
- **Fix**: Updated `get_security_context` in `app/core/dependencies.py` to create default tenant (`00000000-0000-0000-0000-000000000001`) before creating dev user

### 4. Missing AMCS Table Security Patterns
- **Bug**: Songs and other AMCS tables missing from `TABLE_PATTERNS`, causing "No security pattern defined" errors
- **Fix**: Added 11 AMCS tables to `TABLE_PATTERNS` in `app/core/security/table_patterns.py` with USER_OWNED pattern

### 5. Tenant ID Not Propagated to Records
- **Bug**: `UnifiedRowGuard._assign_user_ownership()` only set owner_id but not tenant_id for BaseModel descendants
- **Fix**: Updated `app/core/security/unified_row_guard.py` to set both owner_id and tenant_id when model has both fields

### 6. Incorrect Docker Compose Paths
- **Bug**: Build context paths using `../` instead of `./` relative to project root
- **Fix**: Updated all context and volume paths in `docker-compose.yml`

## Option 1: Simplify to Dev-Only Authentication (Implemented)

### 7. Removed Clerk/JWT Dependencies
- **Why**: No frontend auth UI implemented, Clerk values were placeholders
- **Fix**:
  - Removed all Clerk imports and JWT validation from `app/core/dependencies.py`
  - Kept only dev bypass authentication mechanism
  - Removed Clerk environment variables from `docker-compose.yml`
  - Simplified `.env` to remove Clerk configuration
  - Added TODO comments for future production JWT auth
- **Result**: Clean dev-only authentication system, ~70 lines of code removed

### 8. Removed Header Requirement for Dev Bypass
- **Why**: Browser usage requires seamless local development without header configuration
- **Fix**:
  - Modified `get_current_user_token()` to automatically bypass when `DEV_AUTH_BYPASS_ENABLED=true`
  - Removed `X-Dev-Auth-Bypass` header requirement
  - Removed `DEV_AUTH_BYPASS_SECRET` validation
  - Updated config warning to reflect automatic authentication
- **Result**: Zero-config local development - just start the server and use the app

## Validation
- ✅ GET /api/v1/songs returns 200 with empty list
- ✅ Dev auth bypass working automatically (no headers required)
- ✅ Swagger UI accessible at http://localhost:8000/docs
- ✅ Database UUID types correct
- ✅ Tenant and user creation working
- ✅ Simplified authentication (no Clerk dependencies)
- ✅ Zero-config browser access for local development
