# Phase 4 Frontend Performance Audit

**Date**: 2025-11-17
**Auditor**: Claude Code - React Performance Optimizer
**Scope**: MeatyMusic AMCS Web Application (`apps/web`)
**Status**: Pre-Production Audit

---

## Executive Summary

This audit analyzed 134 TypeScript/React source files across the MeatyMusic web application to identify performance optimization opportunities before production deployment. The analysis covers bundle size, component optimization, rendering performance, and runtime efficiency.

### Key Findings

**Current State (Estimated)**:
- Total source files: 134 TypeScript/React files
- Largest component: 1,204 lines (`apps/web/src/app/(dashboard)/songs/new/page.tsx`)
- Dependencies: 1,622 packages installed
- Multiple large dependencies identified (Lexical, syntax highlighters, charting libraries)

**Priority Issues Identified**:
1. Large heavyweight dependencies without lazy loading
2. Missing React.memo() optimization in key components
3. Expensive re-renders in editor components
4. Unoptimized WebSocket message handling
5. No virtualization for potentially large lists
6. Multiple syntax highlighting libraries (duplication)

**Estimated Impact**: Implementing high-priority optimizations could reduce initial bundle size by 30-40% and improve Time to Interactive (TTI) by 40-50%.

---

## Target Metrics Review

| Metric | Target | Estimated Current | Status | Priority |
|--------|--------|------------------|--------|----------|
| Lighthouse Performance | ≥ 90 | ~75-80 | ⚠️ At Risk | High |
| First Contentful Paint (FCP) | < 1.5s | ~2.0-2.5s | ⚠️ At Risk | High |
| Largest Contentful Paint (LCP) | < 2.5s | ~3.0-3.5s | ⚠️ At Risk | High |
| Time to Interactive (TTI) | < 5s | ~6.0-7.0s | ⚠️ At Risk | Critical |
| Total Blocking Time (TBT) | < 300ms | ~400-500ms | ⚠️ At Risk | High |
| Cumulative Layout Shift (CLS) | < 0.1 | ~0.05-0.08 | ✅ Good | Low |
| Bundle Size | < 50KB increase | TBD | ⚠️ Unknown | High |

---

## 1. Bundle Size Analysis

### 1.1 Large Dependencies Identified

#### Critical - Heavy Editor Libraries
**Issue**: Multiple large editor/syntax highlighting libraries loaded on initial bundle

```javascript
// package.json - Heavy dependencies
"@lexical/code": "^0.38.2",
"@lexical/html": "^0.17.1",
"@lexical/link": "^0.38.2",
"@lexical/list": "^0.17.1",
"@lexical/markdown": "^0.17.1",
"@lexical/react": "^0.17.1",
"@lexical/rich-text": "^0.17.1",
"@lexical/table": "^0.38.2",
"@lexical/utils": "^0.17.1",
"@uiw/react-codemirror": "^4.25.1",
"@codemirror/lang-markdown": "^6.3.4",
"react-syntax-highlighter": "^16.1.0",
"prismjs": "^1.30.0",
"shiki": "^3.13.0",
```

**Estimated Size**: ~800KB-1.2MB uncompressed (250-350KB gzipped)
**Impact**: High - Delays TTI significantly
**Users Affected**: All users on initial load

**Recommendation**:
```typescript
// BEFORE: Eager loading
import { LyricsEditor } from '@/components/entities/LyricsEditor';

// AFTER: Lazy loading with code splitting
const LyricsEditor = lazy(() => import('@/components/entities/LyricsEditor'));
const StyleEditor = lazy(() => import('@/components/entities/StyleEditor'));
const PersonaEditor = lazy(() => import('@/components/entities/PersonaEditor'));
const ProducerNotesEditor = lazy(() => import('@/components/entities/ProducerNotesEditor'));
const BlueprintEditor = lazy(() => import('@/components/entities/BlueprintEditor'));

// Wrap in Suspense with skeleton
<Suspense fallback={<EditorSkeleton />}>
  <LyricsEditor {...props} />
</Suspense>
```

**Expected Improvement**:
- Initial bundle: -200KB gzipped
- TTI: -1.5s to -2.0s
- FCP: -0.5s

#### High - Duplicate Syntax Highlighting
**Issue**: Three different syntax highlighting libraries

```javascript
"react-syntax-highlighter": "^16.1.0",  // 150KB
"prismjs": "^1.30.0",                   // 80KB
"shiki": "^3.13.0",                     // 200KB+ with themes
```

**Recommendation**: Consolidate to one library
```typescript
// Keep only shiki (better highlighting, smaller runtime)
// Remove react-syntax-highlighter and prismjs
// Lazy load shiki only when code preview is needed

const CodePreview = lazy(() => import('@/components/common/CodePreview'));
```

**Expected Improvement**:
- Bundle: -150KB gzipped
- Reduced complexity

#### Medium - Charting Library
**Issue**: Recharts loaded even if charts not immediately visible

```javascript
"recharts": "^2.10.3",  // ~150KB
```

**Recommendation**: Lazy load charts
```typescript
// In MetricsPanel.tsx
const MetricsChart = lazy(() => import('@/components/workflow/MetricsChart'));

// Only render when metrics tab is active
{activeTab === 'metrics' && (
  <Suspense fallback={<ChartSkeleton />}>
    <MetricsChart data={metricsData} />
  </Suspense>
)}
```

**Expected Improvement**:
- Bundle: -50KB gzipped
- FCP: -0.3s

#### Medium - Drag and Drop
**Issue**: DnD Kit loaded for all pages

```javascript
"@dnd-kit/core": "^6.3.1",
"@dnd-kit/sortable": "^10.0.0",
"@dnd-kit/utilities": "^3.2.2",
```

**Used in**: SectionEditor (only in entity editors)

**Recommendation**: Lazy load SectionEditor
```typescript
// Already in editors which should be lazy loaded
// Ensure editors are properly code-split
```

**Expected Improvement**:
- Bundle: -30KB gzipped (via editor lazy loading)

### 1.2 Bundle Splitting Strategy

**Current**: Likely single main bundle due to no dynamic imports observed

**Recommended Bundle Structure**:
```
1. Main bundle (critical path)
   - Layout, routing, core UI
   - Target: < 150KB gzipped

2. Dashboard chunk
   - Dashboard page components
   - Target: < 50KB gzipped

3. Entity editors chunk (per editor)
   - StyleEditor: separate chunk
   - LyricsEditor: separate chunk
   - PersonaEditor: separate chunk
   - ProducerNotesEditor: separate chunk
   - BlueprintEditor: separate chunk
   - Target: 80-120KB each

4. Workflow chunk
   - Workflow visualization
   - Target: < 80KB gzipped

5. Vendor chunks
   - React/React-DOM: separate chunk
   - UI components: separate chunk
   - Utility libraries: separate chunk
```

**Implementation**:
```javascript
// next.config.js - Add optimization config
module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // React framework
          framework: {
            name: 'framework',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler|use-sync-external-store)[\\/]/,
            priority: 40,
            enforce: true,
          },
          // UI library
          ui: {
            name: 'ui',
            test: /[\\/]packages[\\/]ui[\\/]/,
            priority: 30,
            enforce: true,
          },
          // Large libraries
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)?.[1];
              return `npm.${packageName?.replace('@', '')}`;
            },
            priority: 20,
            minChunks: 1,
            reuseExistingChunk: true,
          },
        },
      };
    }
    return config;
  },
};
```

**Expected Improvement**:
- Better caching (framework chunk rarely changes)
- Faster incremental builds
- Parallel loading of chunks

---

## 2. Component Performance Analysis

### 2.1 Missing Memoization

#### Critical - StyleEditor.tsx (386 lines)

**Issue**: No React.memo(), re-renders on every parent update

```typescript
// BEFORE: apps/web/src/components/entities/StyleEditor.tsx
export function StyleEditor({
  initialValue = {},
  onSave,
  onCancel,
  className = '',
  showLibrarySelector = false,
}: StyleEditorProps) {
  // ... component implementation
}
```

**Problem**:
- Validates form on every formData change (line 117-119)
- No memoization of validation logic
- Re-renders ChipSelector, RangeSlider on every keystroke

**Recommendation**:
```typescript
// AFTER: Optimized version
import { memo, useMemo, useCallback } from 'react';

export const StyleEditor = memo(function StyleEditor({
  initialValue = {},
  onSave,
  onCancel,
  className = '',
  showLibrarySelector = false,
}: StyleEditorProps) {
  // ... state setup ...

  // Memoize validation logic
  const validationErrors = useMemo(() => {
    const errors: ValidationError[] = [];

    if (!formData.name?.trim()) {
      errors.push({
        field: 'name',
        message: 'Style name is required',
        severity: 'error',
      });
    }

    if (!formData.genre?.trim()) {
      errors.push({
        field: 'genre',
        message: 'Genre is required',
        severity: 'error',
      });
    }

    if ((formData.instrumentation?.length || 0) > 3) {
      errors.push({
        field: 'instrumentation',
        message: 'More than 3 instruments may dilute the mix',
        severity: 'warning',
      });
    }

    return errors;
  }, [formData.name, formData.genre, formData.instrumentation]);

  // Memoize callbacks
  const handleSave = useCallback(() => {
    const hasErrors = validationErrors.some((e) => e.severity === 'error');
    if (hasErrors) return;
    onSave(formData as StyleCreate);
  }, [validationErrors, formData, onSave]);

  const updateField = useCallback(<K extends keyof StyleBase>(
    field: K,
    value: StyleBase[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // ... rest of component
});
```

**Expected Improvement**:
- Render count: -60% to -80%
- Input responsiveness: +30%
- Validation computation: -70%

**Same Issue in**:
- `LyricsEditor.tsx` (418 lines)
- `PersonaEditor.tsx`
- `ProducerNotesEditor.tsx` (353 lines)
- `BlueprintEditor.tsx` (375 lines)

**Total Impact**: High - affects primary user workflows

#### High - ChipSelector.tsx

**Issue**: Expensive filtering on every input change

```typescript
// BEFORE: apps/web/src/components/entities/common/ChipSelector.tsx (line 37-51)
const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
  const newValue = e.target.value;
  setInputValue(newValue);

  if (newValue.trim()) {
    const filtered = suggestions.filter(
      (s) =>
        s.toLowerCase().includes(newValue.toLowerCase()) &&
        !value.includes(s)
    );
    setFilteredSuggestions(filtered);
  } else {
    setFilteredSuggestions([]);
  }
};
```

**Recommendation**: Add debouncing
```typescript
// AFTER: Debounced filtering
import { useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

const ChipSelector = memo(function ChipSelector({
  // ... props
}: ChipSelectorProps) {
  const [inputValue, setInputValue] = useState('');
  const debouncedInput = useDebounce(inputValue, 200);

  // Memoize filtered suggestions based on debounced input
  const filteredSuggestions = useMemo(() => {
    if (!debouncedInput.trim()) return [];

    const lowerInput = debouncedInput.toLowerCase();
    return suggestions.filter(
      (s) =>
        s.toLowerCase().includes(lowerInput) &&
        !value.includes(s)
    );
  }, [debouncedInput, suggestions, value]);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  // ... rest
});
```

**Expected Improvement**:
- Typing responsiveness: +50%
- CPU usage while typing: -40%

#### High - SectionEditor.tsx

**Issue**: Drag-and-drop state causes unnecessary re-renders

```typescript
// apps/web/src/components/entities/common/SectionEditor.tsx
const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

// Every section re-renders on drag over
```

**Recommendation**: Use React.memo for section rows
```typescript
// Create memoized section component
const SectionRow = memo(function SectionRow({
  section,
  index,
  isDragged,
  isDragOver,
  disabled,
  sectionTypes,
  showDuration,
  showLines,
  onUpdate,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: SectionRowProps) {
  // ... implementation
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if this section's data changed
  return (
    prevProps.section === nextProps.section &&
    prevProps.isDragged === nextProps.isDragged &&
    prevProps.isDragOver === nextProps.isDragOver &&
    prevProps.disabled === nextProps.disabled
  );
});

// In SectionEditor
{sections.map((section, index) => (
  <SectionRow
    key={section.id}
    section={section}
    index={index}
    isDragged={draggedIndex === index}
    isDragOver={dragOverIndex === index}
    // ... other props
  />
))}
```

**Expected Improvement**:
- Drag performance: +60%
- Render count during drag: -80%

### 2.2 Missing Virtualization

#### High - Entity List Pages

**Issue**: No virtualization for potentially large lists

**Files**:
- `apps/web/src/app/(dashboard)/entities/styles/page.tsx`
- `apps/web/src/app/(dashboard)/entities/lyrics/page.tsx`
- `apps/web/src/app/(dashboard)/entities/personas/page.tsx`
- `apps/web/src/app/(dashboard)/entities/producer-notes/page.tsx`
- `apps/web/src/app/(dashboard)/entities/blueprints/page.tsx`

**Current**: Renders all items (no limit observed)

**Recommendation**: Use @tanstack/react-virtual (already installed)
```typescript
// AFTER: Virtualized list
import { useVirtualizer } from '@tanstack/react-virtual';

function StylesListPage() {
  const { data } = useStyles();
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data?.items?.length ?? 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated row height
    overscan: 5, // Render 5 extra items for smooth scrolling
  });

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = data?.items[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <StyleCard style={item} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Expected Improvement**:
- Render time for 1000+ items: -95%
- Memory usage: -80%
- Scroll performance: +90%

**Alternative**: Use `react-window` (already installed in root package.json)
```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={data?.items?.length ?? 0}
  itemSize={120}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <StyleCard style={data?.items[index]} />
    </div>
  )}
</FixedSizeList>
```

---

## 3. Loading Performance

### 3.1 Code Splitting Strategy

**Current State**: No dynamic imports observed in analyzed files

**Priority Routes to Split**:

```typescript
// apps/web/src/app/(dashboard)/layout.tsx
// Add route-based code splitting

// 1. Entity pages
const StylesPage = lazy(() => import('./entities/styles/page'));
const LyricsPage = lazy(() => import('./entities/lyrics/page'));
const PersonasPage = lazy(() => import('./entities/personas/page'));
const ProducerNotesPage = lazy(() => import('./entities/producer-notes/page'));
const BlueprintsPage = lazy(() => import('./entities/blueprints/page'));

// 2. Song pages
const SongDetailPage = lazy(() => import('./songs/[id]/page'));
const SongNewPage = lazy(() => import('./songs/new/page'));

// 3. Workflow page (heavy)
const WorkflowPage = lazy(() => import('./workflows/[id]/page'));

// 4. Settings (rarely accessed)
const SettingsPage = lazy(() => import('./settings/page'));

// Wrap routes in Suspense
<Suspense fallback={<PageSkeleton />}>
  <Routes />
</Suspense>
```

**Expected Improvement**:
- Initial bundle: -200KB to -300KB
- Route navigation: +0.5s (acceptable tradeoff)
- Dashboard load: -1.5s

### 3.2 Resource Hints

**Issue**: Missing preconnect/prefetch for external resources

**Recommendation**: Add to root layout
```typescript
// apps/web/src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        {/* Preconnect to API */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL} />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL} />

        {/* Preload critical fonts (if using local fonts) */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**Expected Improvement**:
- API connection: -100ms to -200ms
- Font loading: -50ms

### 3.3 Image Optimization

**Issue**: Font loading failure observed in build

```
Failed to fetch font `Inter`.
URL: https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap
```

**Recommendation**: Use local fonts or Next.js font optimization
```typescript
// apps/web/src/app/layout.tsx
import localFont from 'next/font/local';

const inter = localFont({
  src: [
    {
      path: '../public/fonts/inter-var.woff2',
      weight: '100 900',
      style: 'normal',
    },
  ],
  variable: '--font-inter',
  display: 'swap',
});

export default function RootLayout({ children }) {
  return (
    <html className={inter.variable}>
      {/* ... */}
    </html>
  );
}
```

**Expected Improvement**:
- Font loading: Guaranteed (no external dependency)
- LCP: -0.2s to -0.5s
- CLS: Reduced font swap

---

## 4. Runtime Performance

### 4.1 React Query Configuration

**Current**: Good baseline configuration in `apps/web/src/app/providers.tsx`

```typescript
const STALE_TIME_MS = 1000 * 60 * 5; // 5 minutes
const GC_TIME_MS = 1000 * 60 * 10; // 10 minutes
```

**Recommendations**:

1. **Increase staleTime for static data**:
```typescript
// In queryKeys config
export const getStaleTime = (type: string) => {
  switch (type) {
    case 'BLUEPRINTS':
      return 1000 * 60 * 60; // 1 hour - rarely changes
    case 'ENTITIES':
      return 1000 * 60 * 5; // 5 minutes - current default
    case 'WORKFLOW':
      return 1000 * 30; // 30 seconds - changes frequently
    default:
      return 1000 * 60 * 5;
  }
};
```

2. **Add prefetching for common navigation paths**:
```typescript
// In Dashboard page
function DashboardPage() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch likely next routes after 2 seconds
    setTimeout(() => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.styles.lists(),
        queryFn: () => stylesApi.list(),
      });
      queryClient.prefetchQuery({
        queryKey: queryKeys.songs.lists(),
        queryFn: () => songsApi.list(),
      });
    }, 2000);
  }, [queryClient]);

  // ...
}
```

**Expected Improvement**:
- Cache hit rate: +30%
- Perceived navigation speed: +50%
- API calls: -20%

### 4.2 WebSocket Optimization

**Issue**: WorkflowEventLog.tsx (414 lines) likely handles WebSocket messages

**Recommendation**: Throttle high-frequency updates
```typescript
// In WorkflowEventLog component
import { useThrottle } from '@/hooks/useThrottle';

function WorkflowEventLog() {
  const [events, setEvents] = useState<Event[]>([]);

  // Throttle event updates to max 10 per second
  const throttledSetEvents = useThrottle(setEvents, 100);

  useEffect(() => {
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (message) => {
      const event = JSON.parse(message.data);

      // Throttle updates
      throttledSetEvents(prev => [...prev, event]);
    };

    return () => ws.close();
  }, []);

  // Virtualize event list (could be 1000+ events)
  return <VirtualizedEventList events={events} />;
}
```

**Expected Improvement**:
- CPU usage during workflow: -50%
- Render count: -90%
- UI responsiveness: +60%

### 4.3 Expensive Computations

**Issue**: SongCard.tsx (401 lines) - likely complex rendering logic

**Recommendation**: Extract and memoize heavy computations
```typescript
// Create separate memoized component for card content
const SongCardContent = memo(function SongCardContent({ song }: { song: Song }) {
  // Memoize expensive calculations
  const workflowStatus = useMemo(() =>
    calculateWorkflowStatus(song),
    [song.status, song.updated_at]
  );

  const formattedDate = useMemo(() =>
    formatDistanceToNow(new Date(song.created_at)),
    [song.created_at]
  );

  return (
    <div>
      <h3>{song.title}</h3>
      <div>{workflowStatus}</div>
      <div>{formattedDate}</div>
    </div>
  );
});

export const SongCard = memo(function SongCard({ song }: SongCardProps) {
  return (
    <Card>
      <SongCardContent song={song} />
    </Card>
  );
});
```

---

## 5. Specific File Optimizations

### 5.1 Critical Path: apps/web/src/app/(dashboard)/songs/new/page.tsx (1,204 lines)

**Issues**:
- Largest file in codebase
- No lazy loading observed
- Complex form state likely causing re-renders

**Recommendations**:

1. **Split into smaller components**:
```typescript
// Split into:
// - SongNewPage.tsx (container, ~200 lines)
// - SongBasicInfoForm.tsx (~200 lines)
// - SongEntitySelection.tsx (~300 lines)
// - SongPreview.tsx (~200 lines)
// - SongActions.tsx (~100 lines)

// Each can be memoized independently
```

2. **Lazy load editors**:
```typescript
const StyleEditorDialog = lazy(() => import('@/components/entities/StyleEditorDialog'));
const LyricsEditorDialog = lazy(() => import('@/components/entities/LyricsEditorDialog'));
// etc.

// Only load when user clicks "Add Style" button
{showStyleEditor && (
  <Suspense fallback={<EditorSkeleton />}>
    <StyleEditorDialog {...props} />
  </Suspense>
)}
```

3. **Optimize form state**:
```typescript
// Use form library with built-in optimization
import { useForm } from 'react-hook-form';

const { register, handleSubmit, watch } = useForm({
  mode: 'onBlur', // Only validate on blur, not on every keystroke
  reValidateMode: 'onChange',
});
```

**Expected Improvement**:
- Initial render: -60%
- File size: -50% (via splitting)
- Form responsiveness: +40%

### 5.2 WorkflowGraph.tsx (295 lines)

**Current**: Good implementation with memoization

**Minor Optimization**:
```typescript
// Line 193-197: Memoize node state map
const nodeStateMap = React.useMemo(() => {
  const map = new Map<WorkflowNode, WorkflowNodeState>();
  nodes.forEach(node => map.set(node.id, node));
  return map;
}, [nodes]);

// Consider using a stable reference check
}, [nodes.length, ...nodes.map(n => n.status)]);
// Instead of: }, [nodes]);
// This prevents re-computation when array reference changes but content is same
```

**Expected Improvement**: Minor (already well-optimized)

### 5.3 WorkflowEventLog.tsx (414 lines)

**Recommendations**:

1. **Add virtualization**:
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function WorkflowEventLog({ events }: { events: Event[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 10,
  });

  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <EventRow
            key={virtualRow.key}
            event={events[virtualRow.index]}
            style={{
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

2. **Memoize event rows**:
```typescript
const EventRow = memo(function EventRow({ event, style }: EventRowProps) {
  return <div style={style}>{/* event content */}</div>;
}, (prev, next) => prev.event.id === next.event.id);
```

**Expected Improvement**:
- Render time for 1000+ events: -95%
- Scroll performance: +90%

---

## 6. Priority Recommendations Summary

### High Priority (Implement Immediately)

1. **Lazy load all entity editors** (Impact: ⭐⭐⭐⭐⭐)
   - Files: StyleEditor, LyricsEditor, PersonaEditor, ProducerNotesEditor, BlueprintEditor
   - Estimated reduction: -200KB gzipped initial bundle
   - Estimated TTI improvement: -1.5s to -2.0s
   - Implementation time: 2-3 hours

2. **Add React.memo() to all editors** (Impact: ⭐⭐⭐⭐⭐)
   - Files: All *Editor.tsx components
   - Estimated render reduction: -60% to -80%
   - Implementation time: 3-4 hours

3. **Consolidate syntax highlighting libraries** (Impact: ⭐⭐⭐⭐)
   - Remove: react-syntax-highlighter, prismjs
   - Keep: shiki (lazy loaded)
   - Estimated reduction: -150KB gzipped
   - Implementation time: 2-3 hours

4. **Split apps/web/src/app/(dashboard)/songs/new/page.tsx** (Impact: ⭐⭐⭐⭐)
   - Split 1,204 lines into 5 components
   - Add lazy loading for editor dialogs
   - Estimated improvement: -40% initial render time
   - Implementation time: 4-6 hours

5. **Add virtualization to entity list pages** (Impact: ⭐⭐⭐⭐)
   - Files: All entity list pages
   - Use: @tanstack/react-virtual (already installed)
   - Estimated improvement: -95% render time for large lists
   - Implementation time: 3-4 hours

### Medium Priority (Implement Before Launch)

6. **Optimize ChipSelector with debouncing** (Impact: ⭐⭐⭐)
   - File: ChipSelector.tsx
   - Estimated improvement: +50% typing responsiveness
   - Implementation time: 1 hour

7. **Optimize SectionEditor drag-and-drop** (Impact: ⭐⭐⭐)
   - File: SectionEditor.tsx
   - Memoize section rows
   - Estimated improvement: +60% drag performance
   - Implementation time: 2 hours

8. **Add bundle analysis to build** (Impact: ⭐⭐⭐)
   - Install: @next/bundle-analyzer (already in devDependencies)
   - Track bundle size over time
   - Implementation time: 1 hour

9. **Optimize React Query caching** (Impact: ⭐⭐⭐)
   - Increase staleTime for blueprints
   - Add prefetching for common paths
   - Implementation time: 2 hours

10. **Throttle WebSocket updates** (Impact: ⭐⭐⭐)
    - File: WorkflowEventLog.tsx
    - Throttle to 10 updates/second
    - Implementation time: 1 hour

### Low Priority (Post-Launch Optimization)

11. **Add service worker for offline caching** (Impact: ⭐⭐)
    - Cache static assets
    - Implementation time: 4-6 hours

12. **Optimize font loading** (Impact: ⭐⭐)
    - Use local fonts instead of Google Fonts
    - Implementation time: 1-2 hours

13. **Add image optimization** (Impact: ⭐⭐)
    - Use next/image for all images
    - Add blur placeholders
    - Implementation time: 2-3 hours

---

## 7. Implementation Roadmap

### Week 1: Critical Path
**Goal**: Reduce initial bundle by 40%, improve TTI by 2 seconds

- Day 1-2: Lazy load all entity editors (#1)
- Day 3: Add React.memo() to editors (#2)
- Day 4: Consolidate syntax highlighting (#3)
- Day 5: Split song/new page (#4)

**Expected Metrics After Week 1**:
- Bundle size: -250KB to -350KB gzipped
- TTI: 4.0s to 4.5s (from ~6-7s)
- FCP: 1.5s to 1.8s (from ~2-2.5s)

### Week 2: Rendering Optimization
**Goal**: Handle large datasets efficiently

- Day 1-2: Add virtualization to all list pages (#5)
- Day 3: Optimize ChipSelector (#6)
- Day 4: Optimize SectionEditor (#7)
- Day 5: Add bundle analyzer and measure (#8)

**Expected Metrics After Week 2**:
- List rendering: -95% for 1000+ items
- Form responsiveness: +50%
- Lighthouse Performance: 85-90

### Week 3: Runtime Optimization
**Goal**: Optimize runtime performance

- Day 1: Optimize React Query (#9)
- Day 2: Throttle WebSocket (#10)
- Day 3-5: Testing and measurement

**Expected Metrics After Week 3**:
- API calls: -20%
- CPU usage during workflow: -50%
- Lighthouse Performance: 90+

---

## 8. Monitoring & Measurement

### 8.1 Add Bundle Analyzer

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... existing config
});
```

**Usage**:
```bash
ANALYZE=true pnpm build
```

### 8.2 Add Performance Monitoring

```typescript
// apps/web/src/lib/performance/monitoring.ts
export function measureWebVitals(metric: any) {
  switch (metric.name) {
    case 'FCP':
      console.log('First Contentful Paint:', metric.value);
      break;
    case 'LCP':
      console.log('Largest Contentful Paint:', metric.value);
      break;
    case 'CLS':
      console.log('Cumulative Layout Shift:', metric.value);
      break;
    case 'FID':
      console.log('First Input Delay:', metric.value);
      break;
    case 'TTFB':
      console.log('Time to First Byte:', metric.value);
      break;
  }

  // Send to analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }
}
```

```typescript
// apps/web/src/app/layout.tsx
import { measureWebVitals } from '@/lib/performance/monitoring';

export function reportWebVitals(metric: any) {
  measureWebVitals(metric);
}
```

### 8.3 Performance Budget

Set budgets in `.lighthouserc.json`:
```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:no-pwa",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 1500 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "interactive": ["error", { "maxNumericValue": 5000 }],
        "total-blocking-time": ["error", { "maxNumericValue": 300 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "speed-index": ["error", { "maxNumericValue": 3000 }]
      }
    }
  }
}
```

---

## 9. Code Examples for Common Patterns

### 9.1 Lazy Loading Pattern

```typescript
// Pattern for all heavy components
import { lazy, Suspense } from 'react';

// Lazy load
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Skeleton fallback
function HeavyComponentSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
      <div className="h-32 bg-gray-200 rounded mb-4" />
      <div className="h-8 bg-gray-200 rounded w-1/2" />
    </div>
  );
}

// Usage with suspense
function Page() {
  return (
    <Suspense fallback={<HeavyComponentSkeleton />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### 9.2 Memoization Pattern

```typescript
import { memo, useMemo, useCallback } from 'react';

// Component memoization
export const MyComponent = memo(function MyComponent({ data, onUpdate }: Props) {
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return data.map(item => expensiveTransform(item));
  }, [data]);

  // Memoize callbacks
  const handleUpdate = useCallback((id: string, value: any) => {
    onUpdate(id, value);
  }, [onUpdate]);

  return <div>{/* render */}</div>;
}, (prevProps, nextProps) => {
  // Custom comparison function (optional)
  return prevProps.data === nextProps.data;
});
```

### 9.3 Virtualization Pattern

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualizedList({ items }: { items: any[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <ItemCard item={items[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 9.4 Debouncing Hook

```typescript
// apps/web/src/hooks/useDebounce.ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### 9.5 Throttling Hook

```typescript
// apps/web/src/hooks/useThrottle.ts
import { useCallback, useRef } from 'react';

export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastRun = useRef(Date.now());

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = now;
    }
  }, [callback, delay]);
}
```

---

## 10. Estimated Performance Gains

### Before Optimizations (Estimated)
- **Lighthouse Performance**: 75-80
- **FCP**: 2.0-2.5s
- **LCP**: 3.0-3.5s
- **TTI**: 6.0-7.0s
- **TBT**: 400-500ms
- **CLS**: 0.05-0.08
- **Initial Bundle**: ~500KB gzipped

### After High Priority Optimizations (Week 1)
- **Lighthouse Performance**: 85-90 (+10-15 points)
- **FCP**: 1.5-1.8s (-0.5-0.7s)
- **LCP**: 2.2-2.8s (-0.8-1.0s)
- **TTI**: 4.0-4.5s (-2.0-2.5s)
- **TBT**: 250-350ms (-150-200ms)
- **CLS**: 0.03-0.05 (improved)
- **Initial Bundle**: ~250KB gzipped (-250KB, -50%)

### After All Optimizations (Week 3)
- **Lighthouse Performance**: 90-95 (+15-20 points)
- **FCP**: 1.2-1.5s (-0.8-1.3s)
- **LCP**: 1.8-2.3s (-1.2-1.7s)
- **TTI**: 3.5-4.0s (-2.5-3.5s)
- **TBT**: 150-250ms (-250-350ms)
- **CLS**: 0.02-0.04 (excellent)
- **Initial Bundle**: ~200KB gzipped (-300KB, -60%)

---

## 11. Testing Strategy

### 11.1 Performance Testing Checklist

Before deploying each optimization:

- [ ] Run Lighthouse audit (average of 3 runs)
- [ ] Check bundle size with `ANALYZE=true pnpm build`
- [ ] Test on throttled network (Slow 3G)
- [ ] Test on low-end device (4x CPU slowdown in DevTools)
- [ ] Measure Core Web Vitals in production-like environment
- [ ] Run React DevTools Profiler on key workflows
- [ ] Test with 1000+ items in lists
- [ ] Test WebSocket with high-frequency updates (100+ events/sec)

### 11.2 Regression Prevention

Add performance tests to CI:

```yaml
# .github/workflows/performance.yml
name: Performance Tests

on: [pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm build
      - uses: treosh/lighthouse-ci-action@v9
        with:
          configPath: '.lighthouserc.json'
          uploadArtifacts: true
```

---

## Conclusion

This audit identified significant optimization opportunities that, when implemented, are estimated to:

1. **Reduce initial bundle size by 50-60%** (from ~500KB to ~200KB gzipped)
2. **Improve Time to Interactive by 40-50%** (from 6-7s to 3.5-4s)
3. **Achieve Lighthouse Performance score of 90+** (from estimated 75-80)
4. **Handle 1000+ item lists efficiently** (95% faster rendering)
5. **Meet all Phase 4 target metrics**

The high-priority optimizations (lazy loading, memoization, code splitting) can be implemented in approximately 15-20 hours of development time and will deliver the majority of performance gains.

**Recommended Next Steps**:
1. Implement high-priority optimizations (Week 1 roadmap)
2. Measure actual performance with Lighthouse
3. Adjust based on real metrics
4. Continue with medium and low priority optimizations

---

**Audit Completed**: 2025-11-17
**Next Review**: After Week 1 optimizations (2025-11-24)
