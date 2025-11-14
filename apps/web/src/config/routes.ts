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

  // Dashboard
  DASHBOARD: '/dashboard',

  // Songs
  SONGS: '/songs',
  SONG_NEW: '/songs/new',
  SONG_DETAIL: (id: string) => `/songs/${id}`,
  SONG_EDIT: (id: string) => `/songs/${id}/edit`,
  SONG_WORKFLOW: (id: string) => `/songs/${id}/workflow`,
  SONG_RUNS: (id: string) => `/songs/${id}/runs`,
  SONG_RUN_DETAIL: (songId: string, runId: string) => `/songs/${songId}/runs/${runId}`,

  // Workflows
  WORKFLOWS: '/workflows',
  WORKFLOW_DETAIL: (id: string) => `/workflows/${id}`,

  // Entities
  ENTITIES: {
    STYLES: '/entities/styles',
    STYLE_NEW: '/entities/styles/new',
    STYLE_DETAIL: (id: string) => `/entities/styles/${id}`,

    LYRICS: '/entities/lyrics',
    LYRICS_NEW: '/entities/lyrics/new',
    LYRICS_DETAIL: (id: string) => `/entities/lyrics/${id}`,

    PERSONAS: '/entities/personas',
    PERSONA_NEW: '/entities/personas/new',
    PERSONA_DETAIL: (id: string) => `/entities/personas/${id}`,

    PRODUCER_NOTES: '/entities/producer-notes',
    PRODUCER_NOTE_NEW: '/entities/producer-notes/new',
    PRODUCER_NOTE_DETAIL: (id: string) => `/entities/producer-notes/${id}`,

    BLUEPRINTS: '/entities/blueprints',
    BLUEPRINT_NEW: '/entities/blueprints/new',
    BLUEPRINT_DETAIL: (id: string) => `/entities/blueprints/${id}`,

    SOURCES: '/entities/sources',
    SOURCE_NEW: '/entities/sources/new',
    SOURCE_DETAIL: (id: string) => `/entities/sources/${id}`,
  },

  // Settings
  SETTINGS: '/settings',
  SETTINGS_PROFILE: '/settings/profile',
  SETTINGS_PREFERENCES: '/settings/preferences',
  SETTINGS_API_KEYS: '/settings/api-keys',
} as const;

/**
 * Route categories for middleware and navigation
 */
export const ROUTE_CATEGORIES = {
  PUBLIC: ['/', '/sign-in', '/sign-up'],
  PROTECTED: ['/dashboard', '/songs', '/entities', '/workflows', '/settings'],
  AUTH: ['/sign-in', '/sign-up'],
} as const;

/**
 * Navigation items for sidebar
 */
export const NAV_ITEMS = [
  {
    name: 'Dashboard',
    href: ROUTES.DASHBOARD,
    icon: 'Home',
  },
  {
    name: 'Songs',
    href: ROUTES.SONGS,
    icon: 'Music2',
  },
  {
    name: 'Library',
    icon: 'Library',
    children: [
      {
        name: 'Styles',
        href: ROUTES.ENTITIES.STYLES,
      },
      {
        name: 'Lyrics',
        href: ROUTES.ENTITIES.LYRICS,
      },
      {
        name: 'Personas',
        href: ROUTES.ENTITIES.PERSONAS,
      },
      {
        name: 'Producer Notes',
        href: ROUTES.ENTITIES.PRODUCER_NOTES,
      },
      {
        name: 'Blueprints',
        href: ROUTES.ENTITIES.BLUEPRINTS,
      },
      {
        name: 'Sources',
        href: ROUTES.ENTITIES.SOURCES,
      },
    ],
  },
  {
    name: 'Settings',
    href: ROUTES.SETTINGS,
    icon: 'Settings',
  },
] as const;

/**
 * Breadcrumb generator
 */
export function getBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: { label: string; href?: string }[] = [];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;

    // Handle special cases
    if (segment === 'entities') {
      breadcrumbs.push({ label: 'Library', href: undefined });
    } else if (segment === 'new') {
      breadcrumbs.push({ label: 'New', href: undefined });
    } else if (segment === 'edit') {
      breadcrumbs.push({ label: 'Edit', href: undefined });
    } else if (segment === 'runs') {
      breadcrumbs.push({ label: 'Workflow Runs', href: currentPath });
    } else if (segment === 'workflow') {
      breadcrumbs.push({ label: 'Workflow', href: currentPath });
    } else if (segment.match(/^[0-9a-f-]{36}$/i)) {
      // UUID - will be replaced by actual name in components
      breadcrumbs.push({ label: '...', href: currentPath });
    } else {
      // Capitalize first letter
      const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      breadcrumbs.push({
        label,
        href: index < segments.length - 1 ? currentPath : undefined
      });
    }
  });

  return breadcrumbs;
}
