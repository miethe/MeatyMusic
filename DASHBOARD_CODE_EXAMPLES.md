# Dashboard API Integration - Code Examples

## Key Code Patterns

### 1. React Query Hook Integration

#### Before (Placeholder)
```typescript
// Old static placeholder
<MetricCard
  title="Total Songs"
  value="0"
  icon={<Music2 className="w-5 h-5" />}
  trend="+0 this week"
  trendDirection="neutral"
/>
```

#### After (Real API Data)
```typescript
// Fetch data with React Query
const {
  data: songsData,
  isLoading: songsLoading,
  error: songsError,
  refetch: refetchSongs
} = useSongs({ limit: 5, sort: 'created_at:desc' });

// Compute metric
const totalSongs = songsData?.page_info?.total_count || 0;

// Render with real data
<MetricCard
  title="Total Songs"
  value={totalSongs.toString()}
  icon={<Music2 className="w-5 h-5" />}
  trend={`${totalSongs > 0 ? 'Active' : 'Get started'}`}
  trendDirection="neutral"
/>
```

---

### 2. Loading State Pattern

#### Skeleton Loader Component
```typescript
function MetricCardSkeleton() {
  return (
    <Card className="p-8 bg-surface border-border shadow-elev1">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-12 rounded-lg" />
      </div>
      <Skeleton className="h-9 w-16 mb-3" />
      <Skeleton className="h-4 w-32" />
    </Card>
  );
}
```

#### Usage in Dashboard
```typescript
{songsLoading || workflowsLoading ? (
  <>
    <MetricCardSkeleton />
    <MetricCardSkeleton />
    <MetricCardSkeleton />
    <MetricCardSkeleton />
  </>
) : (
  <>
    <MetricCard title="Total Songs" value={totalSongs.toString()} ... />
    <MetricCard title="In Progress" value={inProgress.toString()} ... />
    <MetricCard title="Completed" value={completed.toString()} ... />
    <MetricCard title="Failed" value={failed.toString()} ... />
  </>
)}
```

---

### 3. Error Handling Pattern

#### Global Error Fallback
```typescript
// Show error state if critical data fails
if (songsError) {
  return (
    <div className="min-h-screen">
      <PageHeader
        title="Dashboard"
        description="Welcome to MeatyMusic AMCS - Your music creation workspace"
      />
      <div className="container mx-auto px-4 py-8">
        <LoadingErrorFallback
          error={songsError as Error}
          retry={() => {
            refetchSongs();
            refetchWorkflows();
          }}
        />
      </div>
    </div>
  );
}
```

---

### 4. Recent Songs List Pattern

#### Song List Item Component
```typescript
function SongListItem({ song }: { song: Song }) {
  const statusColors = {
    draft: 'text-text-muted bg-panel',
    validated: 'text-info bg-info/10',
    rendering: 'text-warning bg-warning/10',
    rendered: 'text-success bg-success/10',
    failed: 'text-danger bg-danger/10',
  };

  const statusColor = statusColors[song.status || 'draft'];

  return (
    <Link href={ROUTES.SONG_DETAIL(song.id)}>
      <div className="flex items-center justify-between p-4 rounded-lg hover:bg-panel transition-colors cursor-pointer group">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Music2 className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-text-strong truncate group-hover:text-primary transition-colors">
              {song.title}
            </h3>
            <p className="text-sm text-text-muted">
              {formatDistanceToNow(new Date(song.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
          {song.status || 'draft'}
        </div>
      </div>
    </Link>
  );
}
```

#### Rendering with Empty State
```typescript
{songsLoading ? (
  <div className="space-y-4">
    <SongItemSkeleton />
    <SongItemSkeleton />
    <SongItemSkeleton />
  </div>
) : songsData?.items && songsData.items.length > 0 ? (
  <div className="space-y-3">
    {songsData.items.map((song) => (
      <SongListItem key={song.id} song={song} />
    ))}
  </div>
) : (
  <div className="text-center py-16">
    <div className="w-20 h-20 mx-auto mb-6 rounded-xl bg-panel flex items-center justify-center">
      <Music2 className="w-10 h-10 text-text-muted" />
    </div>
    <h3 className="text-lg font-medium text-text-strong mb-3">No songs yet</h3>
    <p className="text-text-muted mb-8 max-w-md mx-auto">
      Create your first song to get started with MeatyMusic AMCS
    </p>
    <Link href={ROUTES.SONG_NEW}>
      <Button>
        <Plus className="w-4 h-4 mr-2" />
        Create Your First Song
      </Button>
    </Link>
  </div>
)}
```

---

### 5. Workflow Activity Pattern

#### Activity Item Component
```typescript
function ActivityItem({ workflow }: { workflow: WorkflowRun }) {
  const statusConfig: Record<WorkflowRunStatus, { color: string; icon: React.ReactNode; label: string }> = {
    running: {
      color: 'text-info bg-info/10',
      icon: <Clock className="w-3 h-3" />,
      label: 'Running'
    },
    completed: {
      color: 'text-success bg-success/10',
      icon: <CheckCircle2 className="w-3 h-3" />,
      label: 'Completed'
    },
    failed: {
      color: 'text-danger bg-danger/10',
      icon: <AlertCircle className="w-3 h-3" />,
      label: 'Failed'
    },
    cancelled: {
      color: 'text-text-muted bg-panel',
      icon: <AlertCircle className="w-3 h-3" />,
      label: 'Cancelled'
    },
  };

  const status = statusConfig[workflow.status || 'running'];

  return (
    <Link href={ROUTES.SONG_RUN_DETAIL(workflow.song_id, workflow.run_id)}>
      <div className="flex items-start justify-between p-3 rounded-lg hover:bg-panel transition-colors cursor-pointer group">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
              {status.icon}
              {status.label}
            </span>
          </div>
          <p className="text-sm text-text-base truncate">
            {workflow.current_node ? `${workflow.current_node} node` : 'Workflow run'}
          </p>
          <p className="text-xs text-text-muted">
            {formatDistanceToNow(new Date(workflow.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    </Link>
  );
}
```

---

### 6. Library Stats Pattern

#### Entity Stats Component
```typescript
function EntityStatItem({
  label,
  count,
  icon,
  href
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="flex items-center justify-between py-2 group cursor-pointer">
        <div className="flex items-center gap-3">
          <div className="text-text-muted group-hover:text-primary transition-colors">
            {icon}
          </div>
          <span className="text-sm font-medium text-text-base group-hover:text-primary transition-colors">
            {label}
          </span>
        </div>
        <span className="text-sm font-semibold text-text-strong">
          {count}
        </span>
      </div>
    </Link>
  );
}
```

#### Usage with Real Data
```typescript
{/* Entity Stats */}
<Card className="p-8 bg-surface border-border shadow-elev1">
  <h2 className="text-xl font-semibold text-text-strong mb-6">Library Stats</h2>
  <div className="space-y-4">
    <EntityStatItem
      label="Styles"
      count={stylesData?.page_info?.total_count || 0}
      icon={<Settings className="w-4 h-4" />}
      href={ROUTES.ENTITIES.STYLES}
    />
    <EntityStatItem
      label="Lyrics"
      count={lyricsData?.page_info?.total_count || 0}
      icon={<FileText className="w-4 h-4" />}
      href={ROUTES.ENTITIES.LYRICS}
    />
    <EntityStatItem
      label="Personas"
      count={personasData?.page_info?.total_count || 0}
      icon={<User className="w-4 h-4" />}
      href={ROUTES.ENTITIES.PERSONAS}
    />
    <EntityStatItem
      label="Producer Notes"
      count={producerNotesData?.page_info?.total_count || 0}
      icon={<ListMusic className="w-4 h-4" />}
      href={ROUTES.ENTITIES.PRODUCER_NOTES}
    />
    <EntityStatItem
      label="Blueprints"
      count={blueprintsData?.page_info?.total_count || 0}
      icon={<Map className="w-4 h-4" />}
      href={ROUTES.ENTITIES.BLUEPRINTS}
    />
  </div>
</Card>
```

---

### 7. Metrics Computation Pattern

#### Workflow Status Metrics
```typescript
// Fetch workflow runs
const {
  data: workflowsData,
  isLoading: workflowsLoading,
  refetch: refetchWorkflows
} = useWorkflowRuns({ limit: 10, sort: 'created_at:desc' });

// Compute metrics from workflow data
const inProgress = workflowsData?.items.filter(w => w.status === 'running').length || 0;
const completed = workflowsData?.items.filter(w => w.status === 'completed').length || 0;
const failed = workflowsData?.items.filter(w => w.status === 'failed').length || 0;

// Calculate success rate
const successRate = completed > 0
  ? Math.round((completed / Math.max(completed + failed, 1)) * 100)
  : 0;
```

---

### 8. Date Formatting Pattern

#### Using date-fns
```typescript
import { formatDistanceToNow } from 'date-fns';

// In component
<p className="text-sm text-text-muted">
  {formatDistanceToNow(new Date(song.created_at), { addSuffix: true })}
</p>

// Output examples:
// - "2 hours ago"
// - "3 days ago"
// - "just now"
```

---

### 9. Conditional Rendering Pattern

#### Three-State Rendering (Loading, Empty, Data)
```typescript
{songsLoading ? (
  // Loading state
  <div className="space-y-4">
    <SongItemSkeleton />
    <SongItemSkeleton />
    <SongItemSkeleton />
  </div>
) : songsData?.items && songsData.items.length > 0 ? (
  // Data state
  <div className="space-y-3">
    {songsData.items.map((song) => (
      <SongListItem key={song.id} song={song} />
    ))}
  </div>
) : (
  // Empty state
  <div className="text-center py-16">
    <EmptyStateContent />
  </div>
)}
```

---

### 10. Type-Safe Status Badge Pattern

#### Status Color Mapping
```typescript
const statusColors: Record<SongStatus | 'draft', string> = {
  draft: 'text-text-muted bg-panel',
  validated: 'text-info bg-info/10',
  rendering: 'text-warning bg-warning/10',
  rendered: 'text-success bg-success/10',
  failed: 'text-danger bg-danger/10',
};

const statusColor = statusColors[song.status || 'draft'];
```

#### Workflow Status Config
```typescript
const statusConfig: Record<WorkflowRunStatus, {
  color: string;
  icon: React.ReactNode;
  label: string
}> = {
  running: {
    color: 'text-info bg-info/10',
    icon: <Clock className="w-3 h-3" />,
    label: 'Running'
  },
  completed: {
    color: 'text-success bg-success/10',
    icon: <CheckCircle2 className="w-3 h-3" />,
    label: 'Completed'
  },
  // ... more statuses
};
```

---

## Import Structure

### All Required Imports
```typescript
import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Card, Skeleton, LoadingErrorFallback } from '@meatymusic/ui';
import {
  Music2,
  Plus,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  User,
  Settings,
  ListMusic,
  Map
} from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useSongs } from '@/hooks/api/useSongs';
import { useWorkflowRuns } from '@/hooks/api/useWorkflows';
import { useStyles } from '@/hooks/api/useStyles';
import { useLyricsList } from '@/hooks/api/useLyrics';
import { usePersonas } from '@/hooks/api/usePersonas';
import { useProducerNotesList } from '@/hooks/api/useProducerNotes';
import { useBlueprints } from '@/hooks/api/useBlueprints';
import { formatDistanceToNow } from 'date-fns';
import type { Song, WorkflowRun, WorkflowRunStatus } from '@/types/api';
```

---

## Best Practices Demonstrated

### 1. Null Safety
```typescript
// Always provide fallback values
const totalSongs = songsData?.page_info?.total_count || 0;

// Conditional access with optional chaining
{songsData?.items?.length > 0 && (
  // Render logic
)}
```

### 2. Loading States
```typescript
// Show loading before checking data
{isLoading ? (
  <Skeleton />
) : data ? (
  <RealComponent data={data} />
) : null}
```

### 3. Error Boundaries
```typescript
// Fail fast for critical data
if (songsError) {
  return <ErrorFallback retry={refetch} />;
}
```

### 4. Semantic Keys
```typescript
// Use unique IDs for list keys
{songs.map((song) => (
  <SongItem key={song.id} song={song} />
))}
```

### 5. Accessibility
```typescript
// Semantic HTML and ARIA
<Link href={href}>
  <div className="group cursor-pointer" role="button" tabIndex={0}>
    {content}
  </div>
</Link>
```

---

## Performance Patterns

### 1. Parallel Fetching
```typescript
// All hooks run in parallel, not sequential
const songs = useSongs();
const workflows = useWorkflows();
const styles = useStyles();
// ... all fetch simultaneously
```

### 2. Memoization
```typescript
// React Query automatically memoizes
// No need for useMemo on derived data that's cheap to compute
const count = workflowsData?.items.filter(w => w.status === 'running').length || 0;
```

### 3. Pagination
```typescript
// Limit results to avoid over-fetching
useSongs({ limit: 5, sort: 'created_at:desc' })
useWorkflowRuns({ limit: 10, sort: 'created_at:desc' })
```

---

## Testing Examples

### Unit Test Example
```typescript
describe('SongListItem', () => {
  it('renders song title and status', () => {
    const song: Song = {
      id: '123',
      title: 'Test Song',
      status: 'draft',
      created_at: new Date().toISOString(),
      // ... other fields
    };

    render(<SongListItem song={song} />);

    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('draft')).toBeInTheDocument();
  });
});
```

### Integration Test Example
```typescript
describe('Dashboard', () => {
  it('displays song count from API', async () => {
    const mockData = {
      items: [/* ... */],
      page_info: { total_count: 42 }
    };

    mockUseSongs.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null
    });

    render(<DashboardPage />);

    expect(await screen.findByText('42')).toBeInTheDocument();
  });
});
```

---

**File**: `/home/user/MeatyMusic/apps/web/src/app/(dashboard)/dashboard/page.tsx`
**Lines**: 540
**Last Updated**: 2025-11-17
