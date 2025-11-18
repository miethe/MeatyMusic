/**
 * API configuration
 */

export const API_CONFIG = {
  BASE_URL: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1`,
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 2,
} as const;

/**
 * API endpoints
 * Note: BASE_URL already includes /api/v1, so these are relative to that
 */
export const API_ENDPOINTS = {
  // User endpoints
  USER_ME: '/users/me',
  USER_PREFERENCES: '/users/me/preferences',

  // Song endpoints
  SONGS: '/songs',
  SONG_DETAIL: (id: string) => `/songs/${id}`,

  // Persona endpoints
  PERSONAS: '/personas',
  PERSONA_DETAIL: (id: string) => `/personas/${id}`,

  // Style endpoints
  STYLES: '/styles',
  STYLE_DETAIL: (id: string) => `/styles/${id}`,

  // Lyrics endpoints
  LYRICS: '/lyrics',
  LYRICS_DETAIL: (id: string) => `/lyrics/${id}`,

  // Producer Notes endpoints
  PRODUCER_NOTES: '/producer-notes',
  PRODUCER_NOTES_DETAIL: (id: string) => `/producer-notes/${id}`,

  // Blueprint endpoints
  BLUEPRINTS: '/blueprints',
  BLUEPRINT_DETAIL: (id: string) => `/blueprints/${id}`,

  // Workflow endpoints
  WORKFLOW_RUNS: '/workflow-runs',
  WORKFLOW_RUN_DETAIL: (id: string) => `/workflow-runs/${id}`,
  WORKFLOW_EXECUTE: '/workflows/execute',
  WORKFLOW_RUN_PROGRESS: (id: string) => `/workflow-runs/${id}/progress`,
  WORKFLOW_RUN_SUMMARY: (id: string) => `/workflow-runs/${id}/summary`,
  WORKFLOW_RUN_CANCEL: (id: string) => `/workflow-runs/${id}/cancel`,
} as const;
