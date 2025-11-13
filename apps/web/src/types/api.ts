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
export * from './api';

/**
 * Legacy User Type (from MeatyPrompts)
 * TODO: Replace with AMCS-specific user/auth types in Phase 6
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
}
