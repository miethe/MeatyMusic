# Development Guide

Comprehensive guide to developing MeatyMusic AMCS web application.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Adding New Features](#adding-new-features)
5. [Testing Guidelines](#testing-guidelines)
6. [Code Style and Conventions](#code-style-and-conventions)
7. [Debugging Tips](#debugging-tips)
8. [Common Issues and Solutions](#common-issues-and-solutions)

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Docker and Docker Compose (for backend services)
- Git

### Initial Setup

```bash
# Clone repository
git clone https://github.com/your-org/meatymusic.git
cd meatymusic

# Install dependencies
pnpm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env.local

# Start development server
pnpm --filter @meatymusic/web dev
```

### Environment Variables

Create `apps/web/.env.local`:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/events

# Development Auth Bypass (for MCP/agents - DEV ONLY)
NEXT_PUBLIC_DEV_AUTH_BYPASS_SECRET=your-super-secret-token

# Optional: OpenTelemetry
NEXT_PUBLIC_OTEL_ENDPOINT=http://localhost:4318/v1/traces
```

### Running the Development Server

```bash
# Start web app only
pnpm --filter @meatymusic/web dev

# Start all services (backend + frontend)
pnpm dev

# Access at:
# - Web App: http://localhost:3000
# - Backend API: http://localhost:8000
# - API Docs: http://localhost:8000/docs
```

## Project Structure

```
apps/web/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── (auth)/           # Auth pages (no shell)
│   │   ├── (dashboard)/      # Dashboard pages (with shell)
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   │
│   ├── components/           # React components
│   │   ├── songs/            # Song-related components
│   │   ├── workflow/         # Workflow components
│   │   ├── entities/         # Entity editors
│   │   │   └── common/       # Shared editor components
│   │   └── layout/           # Layout components
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── api/              # API query hooks
│   │   ├── useAuth.ts        # Authentication hook
│   │   ├── useDebounce.ts    # Utility hooks
│   │   └── useWorkflowWebSocket.ts  # WebSocket hook
│   │
│   ├── lib/                  # Utilities and configurations
│   │   ├── api/              # API client
│   │   ├── query/            # React Query config
│   │   └── utils.ts          # Helper functions
│   │
│   ├── stores/               # Zustand stores
│   │   ├── uiStore.ts        # UI state
│   │   └── workflowStore.ts  # Workflow state
│   │
│   ├── types/                # TypeScript types
│   │   └── api/              # API types
│   │
│   └── config/               # App configuration
│       └── routes.ts         # Route constants
│
├── docs/                     # Documentation
├── public/                   # Static assets
└── package.json
```

### Key Directories

- **`app/`**: Next.js pages using App Router
- **`components/`**: Reusable React components
- **`hooks/`**: Custom hooks for API and utilities
- **`lib/`**: Core utilities and configurations
- **`stores/`**: Client-side state management
- **`types/`**: TypeScript type definitions

## Development Workflow

### Creating a New Branch

```bash
# Feature branch
git checkout -b feat/new-feature

# Bug fix branch
git checkout -b fix/bug-description

# Documentation branch
git checkout -b docs/update-guide
```

### Making Changes

1. **Read relevant documentation**
   - Component guide for UI work
   - State management guide for data flow
   - Entity editors guide for editor work

2. **Make incremental changes**
   - Start with types
   - Add API hooks
   - Create components
   - Write tests

3. **Test locally**
   - Run dev server
   - Test functionality
   - Check console for errors

4. **Commit changes**
   ```bash
   git add .
   git commit -m "feat(component): add new feature"
   ```

### Commit Message Format

Follow Conventional Commits:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

**Examples:**
```bash
feat(songs): add song cloning functionality
fix(workflow): resolve WebSocket reconnection issue
docs(api): update API integration guide
refactor(stores): simplify workflow store actions
```

### Pull Request Process

1. **Push branch**
   ```bash
   git push origin feat/new-feature
   ```

2. **Create PR**
   - Use descriptive title
   - Reference related issues
   - Add screenshots for UI changes

3. **Address review comments**
   - Make requested changes
   - Push updates to same branch

4. **Merge**
   - Squash and merge for clean history
   - Delete branch after merge

## Adding New Features

### Adding a New Component

**Step 1: Create component file**

```tsx
// src/components/myFeature/MyComponent.tsx

'use client';

import { useState } from 'react';
import { Button } from '@meatymusic/ui';

export interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const [isActive, setIsActive] = useState(false);

  return (
    <div>
      <h3>{title}</h3>
      <Button onClick={() => setIsActive(!isActive)}>
        {isActive ? 'Active' : 'Inactive'}
      </Button>
    </div>
  );
}
```

**Step 2: Export from index**

```tsx
// src/components/myFeature/index.ts

export { MyComponent } from './MyComponent';
export type { MyComponentProps } from './MyComponent';
```

**Step 3: Use in page**

```tsx
// src/app/(dashboard)/my-page/page.tsx

import { MyComponent } from '@/components/myFeature';

export default function MyPage() {
  return <MyComponent title="Hello" />;
}
```

### Adding a New Route

**Step 1: Add route constant**

```typescript
// src/config/routes.ts

export const ROUTES = {
  // ... existing routes
  MY_FEATURE: '/my-feature',
  MY_FEATURE_DETAIL: (id: string) => `/my-feature/${id}`,
};
```

**Step 2: Add navigation item** (if needed)

```typescript
// src/config/routes.ts

export const NAV_ITEMS = [
  // ... existing items
  {
    name: 'My Feature',
    href: ROUTES.MY_FEATURE,
    icon: 'Star',
  },
];
```

**Step 3: Create page**

```tsx
// src/app/(dashboard)/my-feature/page.tsx

export default function MyFeaturePage() {
  return (
    <div>
      <h1>My Feature</h1>
    </div>
  );
}
```

### Adding a New Entity

**Step 1: Define types**

```typescript
// src/types/api/entities/myEntity.ts

export interface MyEntityBase {
  name: string;
  description: string;
}

export interface MyEntity extends MyEntityBase {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface MyEntityCreate extends MyEntityBase {}
export interface MyEntityUpdate extends Partial<MyEntityBase> {}
```

**Step 2: Create API client**

```typescript
// src/lib/api/myEntity.ts

import { apiClient } from './client';
import type { MyEntity, MyEntityCreate, MyEntityUpdate } from '@/types/api';

export const myEntityApi = {
  list: (filters?: any) =>
    apiClient.get<{ items: MyEntity[] }>('/my-entities', { params: filters }),

  get: (id: string) =>
    apiClient.get<MyEntity>(`/my-entities/${id}`),

  create: (data: MyEntityCreate) =>
    apiClient.post<MyEntity>('/my-entities', data),

  update: (id: string, data: MyEntityUpdate) =>
    apiClient.patch<MyEntity>(`/my-entities/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/my-entities/${id}`),
};
```

**Step 3: Create API hooks**

```typescript
// src/hooks/api/useMyEntity.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { myEntityApi } from '@/lib/api';
import { queryKeys } from '@/lib/query/config';
import { useUIStore } from '@/stores';

export function useMyEntities(filters?: any) {
  return useQuery({
    queryKey: queryKeys.myEntities.list(filters),
    queryFn: () => myEntityApi.list(filters),
  });
}

export function useMyEntity(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.myEntities.detail(id!),
    queryFn: () => myEntityApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateMyEntity() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: myEntityApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myEntities.lists() });
      addToast(`Created ${data.name}`, 'success');
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to create', 'error');
    },
  });
}
```

**Step 4: Create editor component**

See [Entity Editors Guide](./ENTITY_EDITORS.md) for detailed instructions.

**Step 5: Create pages**

```tsx
// List page
// src/app/(dashboard)/entities/my-entity/page.tsx

// Create page
// src/app/(dashboard)/entities/my-entity/new/page.tsx

// Detail page
// src/app/(dashboard)/entities/my-entity/[id]/page.tsx

// Edit page
// src/app/(dashboard)/entities/my-entity/[id]/edit/page.tsx
```

## Testing Guidelines

### Running Tests

```bash
# Run all tests
pnpm --filter @meatymusic/web test

# Run tests in watch mode
pnpm --filter @meatymusic/web test:watch

# Run tests with coverage
pnpm --filter @meatymusic/web test:coverage
```

### Unit Testing Components

```tsx
// src/components/songs/__tests__/SongCard.test.tsx

import { render, screen } from '@testing-library/react';
import { SongCard } from '../SongCard';

describe('SongCard', () => {
  it('renders song title', () => {
    const song = {
      id: '123',
      title: 'Test Song',
      status: 'draft',
    };

    render(<SongCard song={song} />);

    expect(screen.getByText('Test Song')).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', () => {
    const onEdit = jest.fn();
    const song = { id: '123', title: 'Test', status: 'draft' };

    render(<SongCard song={song} onEdit={onEdit} />);

    const editButton = screen.getByText('Edit');
    editButton.click();

    expect(onEdit).toHaveBeenCalled();
  });
});
```

### Testing Hooks

```tsx
// src/hooks/api/__tests__/useSongs.test.ts

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSongs } from '../useSongs';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

test('useSongs fetches songs', async () => {
  const { result } = renderHook(() => useSongs(), {
    wrapper: createWrapper(),
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toBeDefined();
});
```

### Integration Testing

```tsx
// src/app/(dashboard)/songs/__tests__/page.test.tsx

import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SongsPage from '../page';

test('SongsPage displays song list', async () => {
  const queryClient = new QueryClient();

  render(
    <QueryClientProvider client={queryClient}>
      <SongsPage />
    </QueryClientProvider>
  );

  // Wait for songs to load
  const songCard = await screen.findByText(/test song/i);
  expect(songCard).toBeInTheDocument();
});
```

## Code Style and Conventions

### TypeScript

Always use TypeScript with strong typing:

```tsx
// Good
interface Props {
  title: string;
  count: number;
}

function MyComponent({ title, count }: Props) {
  // ...
}

// Bad
function MyComponent({ title, count }: any) {
  // ...
}
```

### Component Structure

```tsx
// 1. Imports
import { useState } from 'react';
import { Button } from '@meatymusic/ui';
import type { Song } from '@/types/api';

// 2. Types
interface MyComponentProps {
  song: Song;
  onAction?: () => void;
}

// 3. Component
export function MyComponent({ song, onAction }: MyComponentProps) {
  // 4. Hooks
  const [isActive, setIsActive] = useState(false);

  // 5. Handlers
  const handleClick = () => {
    setIsActive(!isActive);
    onAction?.();
  };

  // 6. Render
  return (
    <div>
      <h3>{song.title}</h3>
      <Button onClick={handleClick}>Click</Button>
    </div>
  );
}
```

### Naming Conventions

```tsx
// Components: PascalCase
export function SongCard() {}

// Hooks: camelCase with 'use' prefix
export function useSongs() {}

// Types/Interfaces: PascalCase
interface SongCardProps {}
type SongStatus = 'draft' | 'validated';

// Constants: UPPER_SNAKE_CASE
const MAX_SONGS = 100;

// Functions: camelCase
function formatSongTitle() {}

// Files:
// - Components: PascalCase (SongCard.tsx)
// - Hooks: camelCase (useSongs.ts)
// - Utilities: camelCase (formatters.ts)
```

### Import Organization

```tsx
// 1. React and external libraries
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal utilities and hooks
import { useSongs } from '@/hooks/api';
import { queryKeys } from '@/lib/query/config';

// 3. Components
import { SongCard } from '@/components/songs';
import { Button } from '@meatymusic/ui';

// 4. Types
import type { Song } from '@/types/api';

// 5. Styles (if needed)
import './styles.css';
```

## Debugging Tips

### React DevTools

Install React DevTools browser extension for:
- Component tree inspection
- Props and state debugging
- Performance profiling

### React Query DevTools

Enable in development:

```tsx
// src/app/layout.tsx

import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

### Console Logging

```tsx
// Debug component renders
function MyComponent({ song }: { song: Song }) {
  console.log('[MyComponent] Rendering with song:', song);

  useEffect(() => {
    console.log('[MyComponent] Song changed:', song);
  }, [song]);

  // ...
}
```

### WebSocket Debugging

```tsx
useWorkflowWebSocket({
  enabled: true,
  onEvent: (event) => {
    console.log('[WebSocket] Event received:', {
      type: event.node_name || 'run',
      phase: event.phase,
      data: event.data,
    });
  },
  onError: (error) => {
    console.error('[WebSocket] Error:', error);
  },
});
```

### Network Debugging

Check browser DevTools Network tab for:
- API request/response
- WebSocket messages
- Request timing
- Error responses

## Common Issues and Solutions

### Issue: WebSocket Not Connecting

**Problem:** WebSocket connection fails or repeatedly disconnects

**Solutions:**
1. Check WebSocket URL in `.env.local`
2. Ensure backend is running
3. Check browser console for errors
4. Verify no proxy blocking WebSocket

```tsx
// Debug WebSocket connection
const { isConnected, connectionError } = useWorkflowWebSocket({
  enabled: true,
  onConnect: () => console.log('✅ WebSocket connected'),
  onDisconnect: () => console.log('❌ WebSocket disconnected'),
  onError: (error) => console.error('WebSocket error:', error),
});
```

### Issue: Stale Data in UI

**Problem:** UI shows outdated data after mutations

**Solutions:**
1. Check cache invalidation in mutation
2. Verify query keys are correct
3. Use React Query DevTools to inspect cache

```tsx
const updateSong = useUpdateSong(songId);

// Ensure invalidation is working
updateSong.mutate(data, {
  onSuccess: () => {
    // Invalidate queries
    queryClient.invalidateQueries({
      queryKey: queryKeys.songs.detail(songId),
    });
  },
});
```

### Issue: Component Re-Renders Too Often

**Problem:** Component renders excessively, causing performance issues

**Solutions:**
1. Use selectors with Zustand stores
2. Memoize expensive computations
3. Use React.memo for components

```tsx
// Bad: Causes re-render on any store change
const store = useUIStore();

// Good: Only re-renders when theme changes
const theme = useUIStore(state => state.theme);

// Memoize expensive computation
const processedData = useMemo(() => {
  return expensiveOperation(data);
}, [data]);
```

### Issue: TypeScript Errors

**Problem:** Type errors when using API responses

**Solutions:**
1. Ensure types are imported correctly
2. Check backend API matches TypeScript types
3. Use type guards when needed

```tsx
import type { Song } from '@/types/api';

function isSong(data: unknown): data is Song {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'title' in data
  );
}

const { data } = useSong(songId);
if (isSong(data)) {
  // TypeScript knows data is Song
  console.log(data.title);
}
```

### Issue: Environment Variables Not Loading

**Problem:** `process.env.NEXT_PUBLIC_*` returns undefined

**Solutions:**
1. Ensure variable has `NEXT_PUBLIC_` prefix for client-side
2. Restart dev server after changing `.env.local`
3. Check variable name matches exactly

```bash
# ✅ Good: Client-side accessible
NEXT_PUBLIC_API_URL=http://localhost:8000

# ❌ Bad: Only accessible server-side
API_URL=http://localhost:8000
```

## Performance Tips

### Code Splitting

```tsx
// Lazy load heavy components
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false, // Disable server-side rendering if not needed
});
```

### Image Optimization

```tsx
import Image from 'next/image';

<Image
  src="/album-art.jpg"
  alt="Album art"
  width={300}
  height={300}
  priority // For above-the-fold images
/>
```

### Bundle Analysis

```bash
# Analyze bundle size
ANALYZE=true pnpm build

# Opens bundle analyzer in browser
```

## See Also

- [Component Usage Guide](./COMPONENTS.md) - Component patterns
- [State Management Guide](./STATE_MANAGEMENT.md) - State management
- [Entity Editors Guide](./ENTITY_EDITORS.md) - Creating editors
- [Routing Guide](./ROUTING.md) - Navigation patterns
- [WebSocket Guide](./WEBSOCKET.md) - Real-time updates

## External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest/docs/react/overview)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

## Support

For development questions or issues:
1. Check this documentation
2. Review Phase 5 context files in `.claude/context/`
3. Check existing implementations for patterns
4. Ask in team chat
