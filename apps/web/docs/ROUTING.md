# Routing and Navigation Guide

Comprehensive guide to routing and navigation in MeatyMusic AMCS using Next.js App Router.

## Table of Contents

1. [Route Structure Overview](#route-structure-overview)
2. [Route Groups](#route-groups)
3. [Navigation Patterns](#navigation-patterns)
4. [AppShell and Sidebar Navigation](#appshell-and-sidebar-navigation)
5. [Breadcrumb Generation](#breadcrumb-generation)
6. [Protected Routes](#protected-routes)
7. [Route Parameters](#route-parameters)
8. [Navigation Examples](#navigation-examples)

## Route Structure Overview

MeatyMusic uses Next.js App Router with a file-based routing system:

```
app/
├── (auth)/                  # Auth route group (no shell)
│   ├── sign-in/
│   │   └── page.tsx
│   └── sign-up/
│       └── page.tsx
│
├── (dashboard)/             # Dashboard route group (with AppShell)
│   ├── dashboard/
│   │   └── page.tsx
│   ├── songs/
│   │   ├── page.tsx                  # /songs
│   │   ├── new/
│   │   │   └── page.tsx              # /songs/new
│   │   └── [id]/
│   │       ├── page.tsx              # /songs/[id]
│   │       ├── edit/
│   │       │   └── page.tsx          # /songs/[id]/edit
│   │       ├── workflow/
│   │       │   └── page.tsx          # /songs/[id]/workflow
│   │       └── runs/
│   │           ├── page.tsx          # /songs/[id]/runs
│   │           └── [runId]/
│   │               └── page.tsx      # /songs/[id]/runs/[runId]
│   │
│   ├── entities/
│   │   ├── styles/
│   │   │   ├── page.tsx              # /entities/styles
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # /entities/styles/new
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # /entities/styles/[id]
│   │   │       └── edit/
│   │   │           └── page.tsx      # /entities/styles/[id]/edit
│   │   ├── lyrics/
│   │   ├── personas/
│   │   ├── producer-notes/
│   │   ├── blueprints/
│   │   └── sources/
│   │
│   ├── settings/
│   │   ├── page.tsx                  # /settings
│   │   ├── profile/
│   │   ├── preferences/
│   │   └── api-keys/
│   │
│   └── layout.tsx                    # Dashboard layout with AppShell
│
├── workflows/
│   └── [id]/
│       └── page.tsx                  # /workflows/[id]
│
├── layout.tsx                        # Root layout
└── page.tsx                          # Home page
```

## Route Groups

Route groups organize routes without affecting URL structure.

### (auth) Group

Routes without AppShell for authentication:

```tsx
// app/(auth)/layout.tsx

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
```

### (dashboard) Group

Routes with AppShell navigation:

```tsx
// app/(dashboard)/layout.tsx

import { AppShell } from '@/components/layout/AppShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
```

## Navigation Patterns

### Using Route Constants

Always use route constants from `config/routes.ts`:

```tsx
import { ROUTES } from '@/config/routes';
import { useRouter } from 'next/navigation';

function MySongCard({ song }: { song: Song }) {
  const router = useRouter();

  return (
    <div>
      <h3>{song.title}</h3>
      <button onClick={() => router.push(ROUTES.SONG_DETAIL(song.id))}>
        View Details
      </button>
      <button onClick={() => router.push(ROUTES.SONG_WORKFLOW(song.id))}>
        View Workflow
      </button>
    </div>
  );
}
```

### Link Component

For declarative navigation:

```tsx
import Link from 'next/link';
import { ROUTES } from '@/config/routes';

function SongsList({ songs }: { songs: Song[] }) {
  return (
    <div>
      {songs.map(song => (
        <Link
          key={song.id}
          href={ROUTES.SONG_DETAIL(song.id)}
          className="block p-4 hover:bg-gray-100"
        >
          {song.title}
        </Link>
      ))}
    </div>
  );
}
```

### useRouter Hook

For programmatic navigation:

```tsx
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/config/routes';

function CreateSongForm() {
  const router = useRouter();
  const createSong = useCreateSong();

  const handleSubmit = async (data: SongCreate) => {
    createSong.mutate(data, {
      onSuccess: (song) => {
        // Navigate to new song
        router.push(ROUTES.SONG_DETAIL(song.id));
      },
    });
  };

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}
```

### Back Navigation

```tsx
import { useRouter } from 'next/navigation';

function EditPage() {
  const router = useRouter();

  return (
    <div>
      <button onClick={() => router.back()}>
        Back
      </button>
    </div>
  );
}
```

### Navigation with Query Parameters

```tsx
import { useRouter, useSearchParams } from 'next/navigation';
import { ROUTES } from '@/config/routes';

function SongsList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (status: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('status', status);
    router.push(`${ROUTES.SONGS}?${params.toString()}`);
  };

  return (
    <select onChange={(e) => handleFilterChange(e.target.value)}>
      <option value="draft">Draft</option>
      <option value="validated">Validated</option>
      <option value="rendered">Rendered</option>
    </select>
  );
}
```

## AppShell and Sidebar Navigation

### Navigation Configuration

Edit `config/routes.ts` to customize sidebar navigation:

```typescript
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
      // ... more children
    ],
  },
  {
    name: 'Settings',
    href: ROUTES.SETTINGS,
    icon: 'Settings',
  },
];
```

### Adding New Navigation Items

```typescript
// Add new top-level item
{
  name: 'Analytics',
  href: '/analytics',
  icon: 'BarChart',
}

// Add nested item
{
  name: 'Tools',
  icon: 'Wrench',
  children: [
    {
      name: 'Tag Manager',
      href: '/tools/tags',
    },
    {
      name: 'Blueprint Editor',
      href: '/tools/blueprints',
    },
  ],
}
```

### Custom Icons

Available icons in AppShell:

```typescript
import {
  Home,
  Music2,
  Library,
  Settings,
  // Add more from lucide-react
  BarChart,
  Wrench,
  User,
  // ...
} from 'lucide-react';

// Update getIcon function in AppShell.tsx
function getIcon(iconName?: string) {
  const icons = {
    Home,
    Music2,
    Library,
    Settings,
    BarChart,
    Wrench,
    User,
  };
  return iconName ? icons[iconName as keyof typeof icons] : undefined;
}
```

### Active Route Highlighting

AppShell automatically highlights active routes:

```tsx
// In AppShell.tsx
const pathname = usePathname();
const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

<Link
  className={cn(
    'flex items-center gap-3 px-3 py-2 rounded-lg',
    isActive
      ? 'bg-primary/10 text-primary'
      : 'text-muted-foreground hover:bg-accent/50'
  )}
>
  {item.name}
</Link>
```

## Breadcrumb Generation

### Automatic Breadcrumbs

Use `getBreadcrumbs` utility:

```tsx
import { usePathname } from 'next/navigation';
import { getBreadcrumbs } from '@/config/routes';

function PageHeader() {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <nav>
      {breadcrumbs.map((crumb, i) => (
        <span key={i}>
          {crumb.href ? (
            <Link href={crumb.href}>{crumb.label}</Link>
          ) : (
            <span>{crumb.label}</span>
          )}
          {i < breadcrumbs.length - 1 && ' / '}
        </span>
      ))}
    </nav>
  );
}
```

### Breadcrumb Examples

```tsx
// /songs
// → Songs

// /songs/new
// → Songs / New

// /songs/abc-123
// → Songs / ...

// /songs/abc-123/workflow
// → Songs / ... / Workflow

// /entities/styles
// → Library / Styles

// /entities/styles/new
// → Library / Styles / New
```

### Custom Breadcrumbs

```tsx
import { PageHeader } from '@/components/layout/PageHeader';

function SongDetailPage({ song }: { song: Song }) {
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Songs', href: '/songs' },
    { label: song.title }, // No href = current page
  ];

  return (
    <PageHeader
      title={song.title}
      breadcrumbs={breadcrumbs}
    />
  );
}
```

## Protected Routes

### Authentication Middleware

```typescript
// middleware.ts

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  // Development bypass for MCP/agent testing
  // Full JWT authentication will be added in Phase 2+
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

### Checking Authentication

```tsx
import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';

function ProtectedPage() {
  const { isSignedIn, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isSignedIn) redirect('/sign-in');

  return <div>Protected content</div>;
}
```

### Role-Based Access

```tsx
import { useAuth } from '@/hooks/useAuth';

function AdminPage() {
  const { user, hasRole } = useAuth();

  if (!hasRole('admin')) {
    return <div>Access denied</div>;
  }

  return <div>Admin content</div>;
}
```

## Route Parameters

### Dynamic Routes

```tsx
// app/songs/[id]/page.tsx

export default function SongDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: song } = useSong(params.id);

  if (!song) return <div>Loading...</div>;

  return <div>{song.title}</div>;
}
```

### Multiple Parameters

```tsx
// app/songs/[id]/runs/[runId]/page.tsx

export default function RunDetailPage({
  params,
}: {
  params: { id: string; runId: string };
}) {
  const { data: song } = useSong(params.id);
  const { data: run } = useWorkflowRun(params.runId);

  return (
    <div>
      <h1>{song?.title}</h1>
      <WorkflowStatus run={run} />
    </div>
  );
}
```

### Search Parameters

```tsx
// app/songs/page.tsx

import { useSearchParams } from 'next/navigation';

export default function SongsPage() {
  const searchParams = useSearchParams();

  const status = searchParams.get('status') || 'all';
  const genre = searchParams.get('genre');

  const { data: songs } = useSongs({
    status: status === 'all' ? undefined : [status],
    genre,
  });

  return <SongsList songs={songs?.items || []} />;
}
```

### Reading Parameters in Client Components

```tsx
'use client';

import { useParams, useSearchParams } from 'next/navigation';

function MyClientComponent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const songId = params.id as string;
  const tab = searchParams.get('tab') || 'overview';

  return (
    <div>
      <h1>Song {songId}</h1>
      <Tabs activeTab={tab} />
    </div>
  );
}
```

## Navigation Examples

### Complete Song Navigation

```tsx
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/config/routes';
import {
  useSong,
  useStartWorkflow,
  useCancelWorkflow,
  useDeleteSong,
} from '@/hooks/api';

function SongActions({ songId }: { songId: string }) {
  const router = useRouter();
  const { data: song } = useSong(songId);
  const startWorkflow = useStartWorkflow();
  const deleteSong = useDeleteSong();

  const handleEdit = () => {
    router.push(ROUTES.SONG_EDIT(songId));
  };

  const handleViewWorkflow = () => {
    router.push(ROUTES.SONG_WORKFLOW(songId));
  };

  const handleStartWorkflow = () => {
    startWorkflow.mutate({
      song_id: songId,
      global_seed: Math.floor(Math.random() * 1000000),
    }, {
      onSuccess: () => {
        router.push(ROUTES.SONG_WORKFLOW(songId));
      },
    });
  };

  const handleDelete = () => {
    if (confirm('Delete this song?')) {
      deleteSong.mutate(songId, {
        onSuccess: () => {
          router.push(ROUTES.SONGS);
        },
      });
    }
  };

  return (
    <div className="flex gap-2">
      <button onClick={handleEdit}>Edit</button>
      <button onClick={handleViewWorkflow}>View Workflow</button>
      <button onClick={handleStartWorkflow}>Start Workflow</button>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
}
```

### Entity Navigation

```tsx
import { ROUTES } from '@/config/routes';

function EntitySummaryCard({ song }: { song: Song }) {
  const router = useRouter();

  const navigateToEntity = (type: string, id: string) => {
    switch (type) {
      case 'style':
        router.push(ROUTES.ENTITIES.STYLE_DETAIL(id));
        break;
      case 'lyrics':
        router.push(ROUTES.ENTITIES.LYRICS_DETAIL(id));
        break;
      case 'persona':
        router.push(ROUTES.ENTITIES.PERSONA_DETAIL(id));
        break;
      case 'producer':
        router.push(ROUTES.ENTITIES.PRODUCER_NOTE_DETAIL(id));
        break;
    }
  };

  return (
    <div>
      {song.style_id && (
        <button onClick={() => navigateToEntity('style', song.style_id)}>
          View Style
        </button>
      )}
      {song.lyrics_id && (
        <button onClick={() => navigateToEntity('lyrics', song.lyrics_id)}>
          View Lyrics
        </button>
      )}
    </div>
  );
}
```

### Workflow Navigation

```tsx
import { ROUTES } from '@/config/routes';

function WorkflowRunsList({ songId }: { songId: string }) {
  const { data: runs } = useWorkflowRuns({ song_id: songId });
  const router = useRouter();

  return (
    <div>
      {runs?.items.map(run => (
        <div key={run.id} className="p-4 border rounded">
          <div>Run {run.id}</div>
          <div>Status: {run.status}</div>
          <button
            onClick={() => router.push(ROUTES.SONG_RUN_DETAIL(songId, run.id))}
          >
            View Details
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Conditional Navigation

```tsx
function ConditionalNavigation({ song }: { song: Song }) {
  const router = useRouter();

  const handleNext = () => {
    if (song.status === 'draft') {
      // Draft → Edit
      router.push(ROUTES.SONG_EDIT(song.id));
    } else if (song.status === 'validated') {
      // Validated → Start workflow
      router.push(ROUTES.SONG_WORKFLOW(song.id));
    } else if (song.status === 'rendered') {
      // Rendered → View results
      router.push(ROUTES.SONG_DETAIL(song.id));
    }
  };

  return <button onClick={handleNext}>Next Step</button>;
}
```

### Navigation with Confirmation

```tsx
function NavigateWithConfirmation() {
  const router = useRouter();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(true);

  const handleNavigate = (href: string) => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Leave anyway?')) {
        router.push(href);
      }
    } else {
      router.push(href);
    }
  };

  return (
    <button onClick={() => handleNavigate('/songs')}>
      Back to Songs
    </button>
  );
}
```

## Error Pages

### Not Found (404)

```tsx
// app/not-found.tsx

import Link from 'next/link';
import { ROUTES } from '@/config/routes';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">404 - Not Found</h1>
      <p className="mb-8">The page you're looking for doesn't exist.</p>
      <Link href={ROUTES.DASHBOARD} className="btn-primary">
        Go to Dashboard
      </Link>
    </div>
  );
}
```

### Error Boundary

```tsx
// app/error.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Route error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <p className="mb-8">{error.message}</p>
      <div className="flex gap-4">
        <button onClick={reset}>Try again</button>
        <button onClick={() => router.push('/')}>Go home</button>
      </div>
    </div>
  );
}
```

## Best Practices

### Use Route Constants

Always use route constants instead of hardcoded strings:

```tsx
// Good
import { ROUTES } from '@/config/routes';
router.push(ROUTES.SONG_DETAIL(songId));

// Bad
router.push(`/songs/${songId}`);
```

### Type-Safe Route Parameters

```tsx
// Good
ROUTES.SONG_RUN_DETAIL(songId, runId)  // TypeScript ensures both params

// Bad
`/songs/${songId}/runs/${runId}`  // No type checking
```

### Prefetch for Better Performance

```tsx
<Link
  href={ROUTES.SONG_DETAIL(song.id)}
  prefetch={true}  // Prefetch on hover
>
  {song.title}
</Link>
```

### Loading States

```tsx
import { useRouter } from 'next/navigation';
import { useState } from 'react';

function NavigateButton() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleClick = async () => {
    setIsNavigating(true);
    await someAsyncOperation();
    router.push('/songs');
  };

  return (
    <button onClick={handleClick} disabled={isNavigating}>
      {isNavigating ? 'Loading...' : 'Go to Songs'}
    </button>
  );
}
```

## See Also

- [Component Usage Guide](./COMPONENTS.md) - Navigation components
- [Development Guide](./DEVELOPMENT.md) - Development workflow
- [State Management Guide](./STATE_MANAGEMENT.md) - Route state management

## References

- Next.js App Router: https://nextjs.org/docs/app
- Next.js Navigation: https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating
- Route Config: `apps/web/src/config/routes.ts`
- AppShell: `apps/web/src/components/layout/AppShell.tsx`
