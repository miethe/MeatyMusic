/**
 * Application route constants
 * Centralized route definitions to avoid magic strings
 */

export const ROUTES = {
  // Public routes
  HOME: '/',

  // Auth routes
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',

  // Protected app routes
  DASHBOARD: '/dashboard',
  SONGS: '/songs',
  SONG_DETAIL: (id: string) => `/songs/${id}`,
  SONG_MODAL: (id: string) => `/songs?view=${id}`,
  SONG_NEW: '/songs/new',
  SONG_EDIT_MODAL: (id: string) => `/songs?edit=${id}`,
  LIBRARY: '/library',
  PERSONAS: '/personas',
  PERSONA_DETAIL: (id: string) => `/personas/${id}`,
  PERSONA_NEW: '/personas/new',
  PERSONA_EDIT: (id: string) => `/personas/${id}/edit`,
  STYLES: '/styles',
  STYLE_DETAIL: (id: string) => `/styles/${id}`,

  // Settings
  SETTINGS: '/settings',
} as const;

/**
 * Route categories for middleware and navigation
 */
export const ROUTE_CATEGORIES = {
  PUBLIC: ['/', '/sign-in', '/sign-up'],
  PROTECTED: ['/dashboard', '/songs', '/library', '/personas', '/styles', '/settings'],
  AUTH: ['/sign-in', '/sign-up'],
} as const;
