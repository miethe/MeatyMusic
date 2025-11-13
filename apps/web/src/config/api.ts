/**
 * API configuration
 */

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 2,
} as const;

/**
 * API endpoints
 * Will be populated in Phase 3 with actual MeatyMusic routes
 */
export const API_ENDPOINTS = {
  // User endpoints
  USER_ME: '/api/v1/users/me',
  USER_PREFERENCES: '/api/v1/users/me/preferences',

  // Song endpoints (placeholder)
  SONGS: '/api/v1/songs',
  SONG_DETAIL: (id: string) => `/api/v1/songs/${id}`,

  // Persona endpoints (placeholder)
  PERSONAS: '/api/v1/personas',
  PERSONA_DETAIL: (id: string) => `/api/v1/personas/${id}`,

  // Style endpoints (placeholder)
  STYLES: '/api/v1/styles',
  STYLE_DETAIL: (id: string) => `/api/v1/styles/${id}`,
} as const;
