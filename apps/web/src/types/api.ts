/**
 * MeatyMusic AMCS API Types
 *
 * This file re-exports all API types from the /api directory for convenience.
 *
 * Phase 5 Wave 1G: TypeScript type generation from backend schemas
 * All types are manually generated from backend Pydantic schemas to ensure
 * type safety across the frontend-backend boundary.
 *
 * For detailed documentation, see: /types/api/README.md
 */

// Re-export all API types from the centralized location
export * from './api/index';

/**
 * User Role Type
 * Matches backend: app/models/enums.py - UserRole
 */
export type UserRole = 'user' | 'admin';

/**
 * User Type (from backend User model)
 * Matches backend: app/models/user.py - User
 * TODO: Add more fields as needed from backend schema
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  role: UserRole;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}
