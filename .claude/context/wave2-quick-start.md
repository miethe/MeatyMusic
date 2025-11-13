# Wave 2 Quick Start Guide

## Before You Begin

Read these documents in order:
1. **phase5-wave1a-summary.md** - High-level overview (5 min read)
2. **phase5-component-mapping.md** - Visual component mappings (10 min read)
3. **phase5-frontend-architecture.md** - Complete architecture guide (30 min read)

## Wave 2A: First Steps

### Step 1: Create Song API Client (30 min)

**File**: `/Users/miethe/dev/homelab/development/MeatyMusic/apps/web/src/lib/api/songs.ts`

**Template**: Copy from `/Users/miethe/dev/homelab/development/meatyprompts/apps/web/src/lib/api/prompts.ts`

**Changes**:
```tsx
// Replace:
promptsApi → songsApi
Prompt → Song
PromptCreate → SongCreate
PromptUpdate → SongUpdate
PromptFilters → SongFilters

// API endpoints:
'/api/v1/prompts' → '/api/v1/songs'
```

**Key Functions**:
- `list(filters)` - Get paginated songs
- `get(id)` - Get single song
- `create(data)` - Create new song
- `update(id, data)` - Update song
- `delete(id)` - Delete song
- `getEntities(id)` - Get linked entities (NEW)
- `startWorkflow(id, config)` - Start workflow (NEW)

### Step 2: Create React Query Hooks (30 min)

**File**: `/Users/miethe/dev/homelab/development/MeatyMusic/apps/web/src/hooks/queries/useSongs.ts`

**Template**: Copy from `/Users/miethe/dev/homelab/development/meatyprompts/apps/web/src/hooks/queries/usePrompts.ts`

**Changes**:
```tsx
// Query keys
export const songQueryKeys = {
  all: ['songs'] as const,
  lists: () => [...songQueryKeys.all, 'list'] as const,
  list: (filters?: SongFilters) => [...songQueryKeys.lists(), filters] as const,
  details: () => [...songQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...songQueryKeys.details(), id] as const,
};

// Hooks
export function useSongs(filters?: SongFilters) { ... }
export function useSong(id: string | undefined) { ... }
export function useInfiniteSongs(filters?: SongFilters) { ... }
```

**Stale Time**: Set to 30s (songs are frequently updated during workflows)

### Step 3: Create Mutation Hooks (30 min)

**File**: `/Users/miethe/dev/homelab/development/MeatyMusic/apps/web/src/hooks/mutations/useSongMutations.ts`

**Template**: Copy patterns from `/Users/miethe/dev/homelab/development/meatyprompts/apps/web/src/hooks/mutations/usePromptMutations.ts`

**Key Mutations**:
```tsx
export function useCreateSong() { ... }
export function useUpdateSong() { ... }  // With optimistic updates
export function useDeleteSong() { ... }
export function useToggleFavorite() { ... }
```

### Step 4: Create SongCard Component (2 hours)

**File**: `/Users/miethe/dev/homelab/development/MeatyMusic/apps/web/src/components/songs/SongCard.tsx`

**Template**: Copy from `/Users/miethe/dev/homelab/development/meatyprompts/packages/ui/src/components/PromptCard/PromptCard.tsx`

**Major Changes**:
1. **Props**: Remove `promptType`, `model`, add `genre`, `mood[]`, `workflowState`, `entities`
2. **Header**: Display genre badge instead of version
3. **MetaStrip**: Show mood chips (max 3) + status badge
4. **Body**: Replace bodyPreview with EntitySummary component (4 cards)
5. **Actions**: Change "Run" → "View Workflow", "Fork" → "Clone"

**Visual Reference**: See `phase5-component-mapping.md` for layout diagram

### Step 5: Create SongList Component (1 hour)

**File**: `/Users/miethe/dev/homelab/development/MeatyMusic/apps/web/src/components/songs/SongList.tsx`

**Template**: Copy from `/Users/miethe/dev/homelab/development/meatyprompts/apps/web/src/components/prompts/PromptList.tsx`

**Changes**:
1. Update filters: `genres`, `moods`, `status`
2. Update empty states: "No songs yet" → "Create Your First Song"
3. Update card usage: `<PromptCardItem />` → `<SongCardItem />`
4. Update navigation: `/prompts/new` → `/songs/new`

### Step 6: Create Song List Route (30 min)

**File**: `/Users/miethe/dev/homelab/development/MeatyMusic/apps/web/src/app/(app)/songs/page.tsx`

**Template**:
```tsx
'use client';

import { SongList } from '@/components/songs/SongList';
import { useSongFilters } from '@/hooks/useSongFilters';

export default function SongsPage() {
  const { filters, setFilter } = useSongFilters();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Songs</h1>
        <Button onClick={() => router.push('/songs/new')}>
          Create Song
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <GenreFilter value={filters.genres} onChange={(v) => setFilter('genres', v)} />
        <MoodFilter value={filters.moods} onChange={(v) => setFilter('moods', v)} />
        <StatusFilter value={filters.status} onChange={(v) => setFilter('status', v)} />
      </div>

      {/* Song List */}
      <SongList filters={filters} />
    </div>
  );
}
```

### Step 7: Update Sidebar Navigation (15 min)

**File**: `/Users/miethe/dev/homelab/development/MeatyMusic/apps/web/src/components/layouts/AppSidebar.tsx`

**Changes**:
```tsx
const navigation = [
  { name: 'Home', href: '/dashboard', icon: HomeIcon },
  { name: 'Songs', href: '/songs', icon: MusicIcon },  // NEW
  {
    name: 'Library',
    icon: FolderIcon,
    children: [
      { name: 'Styles', href: '/styles' },      // NEW
      { name: 'Lyrics', href: '/lyrics' },      // NEW
      { name: 'Personas', href: '/personas' },  // NEW
      { name: 'Blueprints', href: '/blueprints' },  // NEW
      { name: 'Sources', href: '/sources' },    // NEW
    ]
  },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];
```

### Step 8: Test Basic Flow (30 min)

**Manual Testing Checklist**:
- [ ] Navigate to `/songs` - list displays
- [ ] Create new song - form works
- [ ] Edit song - updates reflected
- [ ] Delete song - confirmation + removal
- [ ] Bulk select songs - checkboxes work
- [ ] Filter by genre - results update
- [ ] Search songs - full-text search works
- [ ] Pagination - load more works

## Wave 2B: Entity Editors

### Next Steps (Week 2)

1. **StyleEditor** (`components/styles/StyleEditor.tsx`)
   - Template: Use `PromptBlocks` pattern
   - Form fields: Genre, tempo (range), key, mood (multi-select), tags, instrumentation
   - Validation: Zod schema from `schemas/style`

2. **LyricsEditor** (`components/lyrics/LyricsEditor.tsx`)
   - Template: Use Lexical editor from MP
   - Section management: Verse, Chorus, Bridge, Outro
   - Features: Rhyme scheme selector, syllable counter, source picker

3. **PersonaSelector** (`components/personas/PersonaSelector.tsx`)
   - Template: Similar to `AttachContextDialog` from MP
   - Features: Search/filter, create new, preview vocal range

4. **ProducerNotesEditor** (`components/producer/ProducerNotesEditor.tsx`)
   - Custom component
   - Features: Structure builder (drag-drop sections), hooks counter, mix params

## Common Patterns

### Pattern 1: Query Hook with Filters

```tsx
export function useSongs(filters?: SongFilters) {
  return useQuery({
    queryKey: songQueryKeys.list(filters),
    queryFn: () => songsApi.list(filters),
    staleTime: 30 * 1000,  // 30s
  });
}
```

### Pattern 2: Mutation with Optimistic Update

```tsx
export function useUpdateSong() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => songsApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: songQueryKeys.detail(id) });
      const previous = queryClient.getQueryData(songQueryKeys.detail(id));
      if (previous) {
        queryClient.setQueryData(songQueryKeys.detail(id), { ...previous, ...data });
      }
      return { previous };
    },
    onError: (_err, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(songQueryKeys.detail(id), context.previous);
      }
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: songQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: songQueryKeys.lists() });
    },
  });
}
```

### Pattern 3: Bulk Selection

```tsx
const selection = useBulkSelection({
  allItems: songs,
  onSelectionChange: (selectedIds) => {
    console.log('Selected:', selectedIds.size);
  },
});

// Usage
<SongCard
  selectable
  selected={selection.isSelected(song.id)}
  hasActiveSelection={selection.hasActiveSelection}
  onSelectionChange={(checked) => selection.toggleSelection(song.id)}
/>
```

## Troubleshooting

### Issue: "Cannot find module '@/lib/api/songs'"

**Fix**: Ensure TypeScript paths are configured in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue: "Query key not found"

**Fix**: Check that query keys are defined correctly:
```tsx
// Incorrect (missing 'as const')
all: ['songs']

// Correct
all: ['songs'] as const
```

### Issue: "Optimistic update not working"

**Fix**: Ensure you're canceling queries before updating:
```tsx
await queryClient.cancelQueries({ queryKey: songQueryKeys.detail(id) });
```

## Resources

**MeatyPrompts Reference Files**:
- `/apps/web/src/lib/api/prompts.ts` - API client pattern
- `/apps/web/src/hooks/queries/usePrompts.ts` - Query hooks pattern
- `/apps/web/src/components/prompts/PromptList.tsx` - List component pattern
- `/packages/ui/src/components/PromptCard/PromptCard.tsx` - Card component pattern

**Documentation**:
- React Query: https://tanstack.com/query/latest/docs/react/overview
- Zustand: https://docs.pmnd.rs/zustand/getting-started/introduction
- Next.js App Router: https://nextjs.org/docs/app/building-your-application/routing

**Architecture Docs**:
- `phase5-frontend-architecture.md` - Complete architecture
- `phase5-component-mapping.md` - Component mappings
- `phase5-wave1a-summary.md` - Overview

## Success Metrics

**Wave 2A Complete When**:
- [ ] Can create, list, view, edit, delete songs
- [ ] Song list supports filtering by genre/mood/status
- [ ] Bulk selection works (checkboxes, Cmd+A, Escape)
- [ ] Navigation works (sidebar, breadcrumbs)
- [ ] Loading states display correctly
- [ ] Error handling works (toast notifications)
- [ ] All TypeScript types are correct (no `any`)
- [ ] No console errors or warnings

---

**Estimated Time**: 6-8 hours for Wave 2A
**Ready to Start**: Yes (all architecture decisions made)
**Next Document**: Start with Step 1 (Song API Client)
