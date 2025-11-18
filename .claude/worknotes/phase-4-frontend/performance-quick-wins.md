# Performance Quick Wins - Immediate Implementation Guide

**Priority**: Implement these in the next 2-3 days for maximum impact with minimal effort.

---

## 1. Lazy Load Entity Editors (HIGHEST IMPACT)

**Impact**: -200KB initial bundle, -1.5s to -2.0s TTI
**Time**: 2-3 hours
**Complexity**: Low

### Implementation

Create a new file: `apps/web/src/components/entities/LazyEditors.tsx`

```typescript
import { lazy } from 'react';

// Lazy load all editors
export const StyleEditor = lazy(() =>
  import('./StyleEditor').then(m => ({ default: m.StyleEditor }))
);

export const LyricsEditor = lazy(() =>
  import('./LyricsEditor').then(m => ({ default: m.LyricsEditor }))
);

export const PersonaEditor = lazy(() =>
  import('./PersonaEditor').then(m => ({ default: m.PersonaEditor }))
);

export const ProducerNotesEditor = lazy(() =>
  import('./ProducerNotesEditor').then(m => ({ default: m.ProducerNotesEditor }))
);

export const BlueprintEditor = lazy(() =>
  import('./BlueprintEditor').then(m => ({ default: m.BlueprintEditor }))
);

// Shared skeleton
export function EditorSkeleton() {
  return (
    <div className="animate-pulse p-6 space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="h-32 bg-gray-200 rounded" />
      <div className="h-32 bg-gray-200 rounded" />
      <div className="h-32 bg-gray-200 rounded" />
    </div>
  );
}
```

### Update imports across codebase

**Before**:
```typescript
import { StyleEditor } from '@/components/entities/StyleEditor';
```

**After**:
```typescript
import { Suspense } from 'react';
import { StyleEditor, EditorSkeleton } from '@/components/entities/LazyEditors';

// In component
<Suspense fallback={<EditorSkeleton />}>
  <StyleEditor {...props} />
</Suspense>
```

**Files to update**:
- `apps/web/src/app/(dashboard)/entities/styles/[id]/page.tsx`
- `apps/web/src/app/(dashboard)/entities/lyrics/[id]/page.tsx`
- `apps/web/src/app/(dashboard)/entities/personas/[id]/page.tsx`
- `apps/web/src/app/(dashboard)/entities/producer-notes/[id]/page.tsx`
- `apps/web/src/app/(dashboard)/entities/blueprints/[id]/page.tsx`
- `apps/web/src/app/(dashboard)/songs/new/page.tsx` (if editors used there)

---

## 2. Add React.memo() to Editors (HIGH IMPACT)

**Impact**: -60% to -80% re-renders, +30% responsiveness
**Time**: 1 hour
**Complexity**: Low

### StyleEditor.tsx

```typescript
// Add to top of file
import { memo, useMemo, useCallback } from 'react';

// Change function declaration
export const StyleEditor = memo(function StyleEditor({
  initialValue = {},
  onSave,
  onCancel,
  className = '',
  showLibrarySelector = false,
}: StyleEditorProps) {
  // ... existing state setup ...

  // Replace validateForm() with memoized version
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

    if (formData.mood && formData.mood.length > 5) {
      errors.push({
        field: 'mood',
        message: 'Too many moods may cause conflicting directions',
        severity: 'warning',
      });
    }

    return errors;
  }, [formData.name, formData.genre, formData.instrumentation, formData.mood]);

  // Remove useEffect for validation - use memoized value instead

  // Memoize handleSave
  const handleSave = useCallback(() => {
    const hasErrors = validationErrors.some((e) => e.severity === 'error');
    if (hasErrors) return;
    onSave(formData as StyleCreate);
  }, [validationErrors, formData, onSave]);

  // Memoize updateField
  const updateField = useCallback(<K extends keyof StyleBase>(
    field: K,
    value: StyleBase[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // ... rest of component unchanged ...
});
```

### Apply same pattern to:
- `LyricsEditor.tsx`
- `PersonaEditor.tsx`
- `ProducerNotesEditor.tsx`
- `BlueprintEditor.tsx`

**Search & replace pattern**:
1. Add `memo` import
2. Wrap component: `export const MyEditor = memo(function MyEditor({ ... }) { ... });`
3. Convert `useEffect` validation to `useMemo`
4. Wrap callbacks with `useCallback`

---

## 3. Remove Duplicate Syntax Highlighters (MEDIUM IMPACT)

**Impact**: -150KB bundle
**Time**: 1-2 hours
**Complexity**: Medium

### Update package.json

**Remove**:
```json
"react-syntax-highlighter": "^16.1.0",
"prismjs": "^1.30.0",
```

**Keep only**:
```json
"shiki": "^3.13.0",
```

### Create lazy-loaded code preview component

`apps/web/src/components/common/CodePreview.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import type { BundledLanguage, BundledTheme } from 'shiki';

interface CodePreviewProps {
  code: string;
  language: BundledLanguage;
  theme?: BundledTheme;
  className?: string;
}

export function CodePreview({
  code,
  language,
  theme = 'github-dark',
  className = '',
}: CodePreviewProps) {
  const [html, setHtml] = useState<string>('');

  useEffect(() => {
    async function highlight() {
      // Dynamically import shiki only when needed
      const { codeToHtml } = await import('shiki');

      const highlighted = await codeToHtml(code, {
        lang: language,
        theme,
      });

      setHtml(highlighted);
    }

    highlight();
  }, [code, language, theme]);

  if (!html) {
    return (
      <div className={`animate-pulse bg-gray-800 rounded ${className}`}>
        <pre className="p-4">
          <code className="text-gray-400">Loading...</code>
        </pre>
      </div>
    );
  }

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

### Lazy load when needed

```typescript
import { lazy, Suspense } from 'react';

const CodePreview = lazy(() => import('@/components/common/CodePreview'));

// Usage
<Suspense fallback={<CodePreviewSkeleton />}>
  <CodePreview code={composedPrompt} language="yaml" />
</Suspense>
```

---

## 4. Debounce ChipSelector Input (MEDIUM IMPACT)

**Impact**: +50% typing responsiveness
**Time**: 30 minutes
**Complexity**: Low

### Create debounce hook

`apps/web/src/hooks/useDebounce.ts`:

```typescript
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

### Update ChipSelector.tsx

```typescript
import { memo, useMemo, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

export const ChipSelector = memo(function ChipSelector({
  label,
  value,
  onChange,
  suggestions = [],
  // ... other props
}: ChipSelectorProps) {
  const [inputValue, setInputValue] = useState('');

  // Debounce input for filtering
  const debouncedInput = useDebounce(inputValue, 200);

  // Memoize filtered suggestions
  const filteredSuggestions = useMemo(() => {
    if (!debouncedInput.trim()) return [];

    const lowerInput = debouncedInput.toLowerCase();
    return suggestions
      .filter(s =>
        s.toLowerCase().includes(lowerInput) &&
        !value.includes(s)
      )
      .slice(0, 5); // Limit to 5 suggestions
  }, [debouncedInput, suggestions, value]);

  // Immediate UI update, debounced filtering
  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  // ... rest unchanged
});
```

---

## 5. Add Virtualization to List Pages (HIGH IMPACT)

**Impact**: -95% render time for large lists
**Time**: 1 hour per page
**Complexity**: Medium

### Example: Styles List Page

`apps/web/src/app/(dashboard)/entities/styles/page.tsx`:

```typescript
'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useStyles } from '@/hooks/api/useStyles';

export default function StylesPage() {
  const { data, isLoading } = useStyles();
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data?.items?.length ?? 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated row height in pixels
    overscan: 5, // Render 5 extra items above/below viewport
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title="Styles" />

      <div
        ref={parentRef}
        className="h-[calc(100vh-200px)] overflow-auto"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const style = data?.items[virtualRow.index];
            if (!style) return null;

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <StyleCard style={style} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

### Apply to all list pages:
- `apps/web/src/app/(dashboard)/entities/lyrics/page.tsx`
- `apps/web/src/app/(dashboard)/entities/personas/page.tsx`
- `apps/web/src/app/(dashboard)/entities/producer-notes/page.tsx`
- `apps/web/src/app/(dashboard)/entities/blueprints/page.tsx`
- `apps/web/src/app/(dashboard)/songs/page.tsx`

---

## 6. Optimize React Query Caching

**Impact**: +30% cache hit rate, -20% API calls
**Time**: 30 minutes
**Complexity**: Low

### Update query config

`apps/web/src/lib/query/config.ts`:

```typescript
// Add staleTime configuration by entity type
export const getStaleTime = (type: 'BLUEPRINTS' | 'ENTITIES' | 'WORKFLOW' | 'SONGS') => {
  switch (type) {
    case 'BLUEPRINTS':
      return 1000 * 60 * 60; // 1 hour - blueprints rarely change

    case 'ENTITIES':
      return 1000 * 60 * 5; // 5 minutes - normal entities

    case 'WORKFLOW':
      return 1000 * 30; // 30 seconds - workflows change frequently

    case 'SONGS':
      return 1000 * 60 * 2; // 2 minutes

    default:
      return 1000 * 60 * 5;
  }
};
```

### Update hooks

```typescript
// apps/web/src/hooks/api/useStyles.ts
export function useStyles(filters?: StyleFilters) {
  return useQuery({
    queryKey: queryKeys.styles.list(filters as Record<string, unknown> | undefined),
    queryFn: () => stylesApi.list(filters),
    staleTime: getStaleTime('ENTITIES'), // Use configured staleTime
  });
}

// apps/web/src/hooks/api/useBlueprints.ts
export function useBlueprints(filters?: BlueprintFilters) {
  return useQuery({
    queryKey: queryKeys.blueprints.list(filters as Record<string, unknown> | undefined),
    queryFn: () => blueprintsApi.list(filters),
    staleTime: getStaleTime('BLUEPRINTS'), // Longer cache for blueprints
  });
}
```

---

## 7. Add Bundle Analyzer

**Impact**: Visibility into bundle composition
**Time**: 15 minutes
**Complexity**: Very Low

### Update next.config.js

```javascript
// apps/web/next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config
};

module.exports = withBundleAnalyzer(nextConfig);
```

### Add npm script

```json
// apps/web/package.json
{
  "scripts": {
    "analyze": "ANALYZE=true next build"
  }
}
```

### Usage

```bash
pnpm --filter "./apps/web" analyze
```

This will generate an interactive bundle analysis in your browser.

---

## 8. Throttle WebSocket Updates (MEDIUM IMPACT)

**Impact**: -50% CPU usage during workflow, +60% UI responsiveness
**Time**: 1 hour
**Complexity**: Medium

### Create throttle hook

`apps/web/src/hooks/useThrottle.ts`:

```typescript
import { useCallback, useRef } from 'react';

export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastRun = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRun.current;

      if (timeSinceLastRun >= delay) {
        // Execute immediately if enough time has passed
        callback(...args);
        lastRun.current = now;
      } else {
        // Schedule execution for remaining time
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRun.current = Date.now();
        }, delay - timeSinceLastRun);
      }
    },
    [callback, delay]
  );
}
```

### Update WorkflowEventLog.tsx

```typescript
import { useThrottle } from '@/hooks/useThrottle';

function WorkflowEventLog() {
  const [events, setEvents] = useState<Event[]>([]);

  // Throttle to max 10 updates per second
  const throttledAddEvent = useThrottle((newEvent: Event) => {
    setEvents(prev => [newEvent, ...prev].slice(0, 1000)); // Keep max 1000
  }, 100);

  useEffect(() => {
    // WebSocket setup
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (message) => {
      const event = JSON.parse(message.data);
      throttledAddEvent(event);
    };

    return () => ws.close();
  }, [throttledAddEvent]);

  // ... rest of component
}
```

---

## Implementation Checklist

### Day 1: Bundle Reduction (4-5 hours)
- [ ] Create LazyEditors.tsx (#1)
- [ ] Update all editor imports to use lazy loading
- [ ] Test that editors still load correctly
- [ ] Add bundle analyzer (#7)
- [ ] Run bundle analysis and compare

### Day 2: Component Optimization (4-5 hours)
- [ ] Add memo to StyleEditor (#2)
- [ ] Add memo to LyricsEditor (#2)
- [ ] Add memo to PersonaEditor (#2)
- [ ] Add memo to ProducerNotesEditor (#2)
- [ ] Add memo to BlueprintEditor (#2)
- [ ] Test editor performance with React DevTools Profiler

### Day 3: Refinements (3-4 hours)
- [ ] Create useDebounce hook (#4)
- [ ] Update ChipSelector with debouncing (#4)
- [ ] Remove duplicate syntax highlighters (#3)
- [ ] Create CodePreview component with shiki (#3)
- [ ] Update React Query config (#6)
- [ ] Test all changes

---

## Measurement

After implementing each day's changes, measure:

```bash
# Build and analyze
pnpm --filter "./apps/web" analyze

# Run Lighthouse (production build)
pnpm --filter "./apps/web" build
pnpm --filter "./apps/web" start
# Open Chrome DevTools > Lighthouse > Run
```

**Expected Results After 3 Days**:
- Bundle size: -40% to -50%
- TTI: -40% to -50%
- Lighthouse Performance: 85-90
- Editor responsiveness: +30% to +50%

---

## Testing Commands

```bash
# Development
pnpm --filter "./apps/web" dev

# Production build
pnpm --filter "./apps/web" build

# Bundle analysis
pnpm --filter "./apps/web" analyze

# Type check
pnpm --filter "./apps/web" typecheck

# Run tests
pnpm --filter "./apps/web" test
```

---

**Last Updated**: 2025-11-17
**Next Review**: After Day 3 implementation
