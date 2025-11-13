# Component Usage Guide

Comprehensive guide to using the MeatyMusic AMCS component library.

## Table of Contents

1. [Component Library Structure](#component-library-structure)
2. [Song Components](#song-components)
3. [Workflow Components](#workflow-components)
4. [Entity Editor Components](#entity-editor-components)
5. [Common Components](#common-components)
6. [Layout Components](#layout-components)
7. [Import Patterns](#import-patterns)
8. [Accessibility Features](#accessibility-features)

## Component Library Structure

Components are organized by domain in `apps/web/src/components/`:

```
components/
├── songs/           # Song list, card, and display components
├── workflow/        # Workflow execution and monitoring
├── entities/        # Entity editors (Style, Lyrics, Persona, etc.)
│   └── common/      # Shared editor components
└── layout/          # App shell, headers, navigation
```

## Song Components

### SongCard

Displays song metadata, workflow status, entity links, and actions.

**Location:** `components/songs/SongCard.tsx`

**Props:**

```typescript
interface SongCardProps {
  song: Song;                          // Song entity
  workflowStatus?: WorkflowRunStatus;  // Current workflow status
  workflowState?: WorkflowState;       // Workflow execution state
  entities?: EntitySummary;            // Linked entities
  metrics?: SongMetrics;               // Usage metrics
  selectable?: boolean;                // Enable checkbox selection
  selected?: boolean;                  // Selection state
  hasActiveSelection?: boolean;        // Any card selected
  size?: 'compact' | 'standard' | 'xl'; // Card size
  state?: 'default' | 'processing' | 'complete' | 'failed'; // Visual state

  // Callbacks
  onViewWorkflow?: () => void;
  onEdit?: () => void;
  onClone?: () => void;
  onDelete?: () => void;
  onSelectionChange?: (selected: boolean, event: React.ChangeEvent) => void;
  onCardClick?: () => void;
  onEntityClick?: (type: 'style' | 'lyrics' | 'persona' | 'producer', id: string) => void;
}
```

**Basic Usage:**

```tsx
import { SongCard } from '@/components/songs/SongCard';
import { useSong } from '@/hooks/api';

function SongDisplay({ songId }: { songId: string }) {
  const { data: song } = useSong(songId);

  if (!song) return null;

  return (
    <SongCard
      song={song}
      onEdit={() => router.push(`/songs/${song.id}/edit`)}
      onViewWorkflow={() => router.push(`/songs/${song.id}/workflow`)}
    />
  );
}
```

**With Workflow State:**

```tsx
import { useWorkflowStore } from '@/stores';

function SongCardWithWorkflow({ songId }: { songId: string }) {
  const { data: song } = useSong(songId);
  const run = useWorkflowStore(state => state.getRunBySongId(songId));

  const workflowState = run ? {
    currentNode: run.currentNode,
    completedNodes: Array.from(run.nodes.entries())
      .filter(([_, node]) => node.status === 'success')
      .map(([name, _]) => name),
    failedNodes: Array.from(run.nodes.entries())
      .filter(([_, node]) => node.status === 'failed')
      .map(([name, _]) => name),
    progress: calculateProgress(run),
  } : undefined;

  return (
    <SongCard
      song={song}
      workflowStatus={run?.status}
      workflowState={workflowState}
      size="xl"
    />
  );
}
```

**Selection Mode:**

```tsx
function SelectableSongList() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { data: songs } = useSongs();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {songs?.items.map(song => (
        <SongCard
          key={song.id}
          song={song}
          selectable
          selected={selectedIds.has(song.id)}
          hasActiveSelection={selectedIds.size > 0}
          onSelectionChange={(selected) => {
            const newSelection = new Set(selectedIds);
            selected ? newSelection.add(song.id) : newSelection.delete(song.id);
            setSelectedIds(newSelection);
          }}
        />
      ))}
    </div>
  );
}
```

### SongList

Displays a grid or list of songs with filtering and pagination.

**Location:** `components/songs/SongList.tsx`

**Props:**

```typescript
interface SongListProps {
  songs: Song[];
  isLoading?: boolean;
  onSongClick?: (song: Song) => void;
  variant?: 'grid' | 'list';
  showFilters?: boolean;
}
```

**Usage:**

```tsx
import { SongList } from '@/components/songs/SongList';
import { useSongs } from '@/hooks/api';

function SongsPage() {
  const { data, isLoading } = useSongs({ status: ['draft', 'validated'] });

  return (
    <SongList
      songs={data?.items || []}
      isLoading={isLoading}
      onSongClick={(song) => router.push(`/songs/${song.id}`)}
      variant="grid"
      showFilters
    />
  );
}
```

## Workflow Components

### WorkflowGraph

Displays workflow execution as an interactive graph.

**Location:** `components/workflow/WorkflowGraph.tsx`

**Props:**

```typescript
interface WorkflowGraphProps {
  runId: string;
  orientation?: 'horizontal' | 'vertical';
  onNodeClick?: (nodeId: WorkflowNode) => void;
  className?: string;
}
```

**Usage:**

```tsx
import { WorkflowGraph } from '@/components/workflow/WorkflowGraph';
import { useWorkflowStore } from '@/stores';

function WorkflowVisualization({ runId }: { runId: string }) {
  const selectNode = useWorkflowStore(state => state.selectNode);

  return (
    <WorkflowGraph
      runId={runId}
      orientation="horizontal"
      onNodeClick={(nodeId) => selectNode(nodeId)}
    />
  );
}
```

### WorkflowStatus

Displays compact workflow status with progress indicator.

**Location:** `components/workflow/WorkflowStatus.tsx`

**Props:**

```typescript
interface WorkflowStatusProps {
  runId: string;
  variant?: 'compact' | 'detailed';
  showActions?: boolean;
  onCancel?: () => void;
}
```

**Usage:**

```tsx
import { WorkflowStatus } from '@/components/workflow/WorkflowStatus';
import { useCancelWorkflow } from '@/hooks/api';

function SongDetailHeader({ songId, runId }: Props) {
  const cancelWorkflow = useCancelWorkflow();

  return (
    <WorkflowStatus
      runId={runId}
      variant="detailed"
      showActions
      onCancel={() => cancelWorkflow.mutate(songId)}
    />
  );
}
```

### NodeDetails

Displays detailed information about a workflow node.

**Location:** `components/workflow/NodeDetails.tsx`

**Props:**

```typescript
interface NodeDetailsProps {
  runId: string;
  nodeId: WorkflowNode;
  className?: string;
}
```

**Usage:**

```tsx
import { NodeDetails } from '@/components/workflow/NodeDetails';
import { useWorkflowStore } from '@/stores';

function WorkflowNodePanel({ runId }: { runId: string }) {
  const selectedNodeId = useWorkflowStore(state => state.selectedNodeId);

  if (!selectedNodeId) return <div>Select a node to view details</div>;

  return <NodeDetails runId={runId} nodeId={selectedNodeId} />;
}
```

### MetricsPanel

Displays workflow metrics and validation scores.

**Location:** `components/workflow/MetricsPanel.tsx`

**Usage:**

```tsx
import { MetricsPanel } from '@/components/workflow/MetricsPanel';

function WorkflowMetrics({ runId }: { runId: string }) {
  return <MetricsPanel runId={runId} />;
}
```

## Entity Editor Components

### StyleEditor

Editor for Style entity with genre, tempo, mood, instrumentation.

**Location:** `components/entities/StyleEditor.tsx`

**Props:**

```typescript
interface StyleEditorProps {
  initialValue?: Partial<StyleBase>;
  onSave: (style: StyleCreate) => void;
  onCancel: () => void;
  className?: string;
}
```

**Usage:**

```tsx
import { StyleEditor } from '@/components/entities/StyleEditor';
import { useCreateStyle } from '@/hooks/api';

function CreateStylePage() {
  const createStyle = useCreateStyle();
  const router = useRouter();

  return (
    <StyleEditor
      onSave={(style) => {
        createStyle.mutate(style, {
          onSuccess: () => router.push('/entities/styles'),
        });
      }}
      onCancel={() => router.back()}
    />
  );
}
```

**Edit Mode:**

```tsx
function EditStylePage({ id }: { id: string }) {
  const { data: style } = useStyle(id);
  const updateStyle = useUpdateStyle(id);

  if (!style) return <div>Loading...</div>;

  return (
    <StyleEditor
      initialValue={style}
      onSave={(updates) => {
        updateStyle.mutate(updates);
      }}
      onCancel={() => router.back()}
    />
  );
}
```

### LyricsEditor

Editor for Lyrics entity with sections, rhyme scheme, meter.

**Location:** `components/entities/LyricsEditor.tsx`

**Props:**

```typescript
interface LyricsEditorProps {
  initialValue?: Partial<LyricsBase>;
  onSave: (lyrics: LyricsCreate) => void;
  onCancel: () => void;
  className?: string;
}
```

**Usage:**

```tsx
import { LyricsEditor } from '@/components/entities/LyricsEditor';

function CreateLyricsPage() {
  const createLyrics = useCreateLyrics();

  return (
    <LyricsEditor
      onSave={(lyrics) => createLyrics.mutate(lyrics)}
      onCancel={() => router.back()}
    />
  );
}
```

### PersonaEditor

Editor for Persona entity with vocal range, influences, style preferences.

**Location:** `components/entities/PersonaEditor.tsx`

**Usage:**

```tsx
import { PersonaEditor } from '@/components/entities/PersonaEditor';

function CreatePersonaPage() {
  const createPersona = useCreatePersona();

  return (
    <PersonaEditor
      onSave={(persona) => createPersona.mutate(persona)}
      onCancel={() => router.back()}
    />
  );
}
```

### ProducerNotesEditor

Editor for Producer Notes with arrangement, mix targets, effects.

**Location:** `components/entities/ProducerNotesEditor.tsx`

**Usage:**

```tsx
import { ProducerNotesEditor } from '@/components/entities/ProducerNotesEditor';

function CreateProducerNotesPage() {
  const createProducerNotes = useCreateProducerNotes();

  return (
    <ProducerNotesEditor
      onSave={(notes) => createProducerNotes.mutate(notes)}
      onCancel={() => router.back()}
    />
  );
}
```

### BlueprintEditor

Editor for Blueprint with genre rules, constraints, scoring.

**Location:** `components/entities/BlueprintEditor.tsx`

**Usage:**

```tsx
import { BlueprintEditor } from '@/components/entities/BlueprintEditor';

function CreateBlueprintPage() {
  const createBlueprint = useCreateBlueprint();

  return (
    <BlueprintEditor
      onSave={(blueprint) => createBlueprint.mutate(blueprint)}
      onCancel={() => router.back()}
    />
  );
}
```

### SongEditor

Editor for Song entity that combines all other entities.

**Location:** `components/entities/SongEditor.tsx`

**Usage:**

```tsx
import { SongEditor } from '@/components/entities/SongEditor';

function CreateSongPage() {
  const createSong = useCreateSong();

  return (
    <SongEditor
      onSave={(song) => createSong.mutate(song)}
      onCancel={() => router.back()}
    />
  );
}
```

## Common Components

These shared components are used across entity editors.

### ChipSelector

Multi-select chip input with autocomplete suggestions.

**Location:** `components/entities/common/ChipSelector.tsx`

**Props:**

```typescript
interface ChipSelectorProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  suggestions?: string[];
  maxChips?: number;
  error?: string;
  warning?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helpText?: string;
}
```

**Usage:**

```tsx
import { ChipSelector } from '@/components/entities/common/ChipSelector';

function MyForm() {
  const [moods, setMoods] = useState<string[]>([]);

  return (
    <ChipSelector
      label="Mood"
      value={moods}
      onChange={setMoods}
      suggestions={['upbeat', 'melancholic', 'energetic', 'calm']}
      maxChips={5}
      placeholder="Add mood tags..."
      helpText="Describe the emotional tone"
    />
  );
}
```

**With Validation:**

```tsx
const [tags, setTags] = useState<string[]>([]);
const error = tags.length === 0 ? 'At least one tag required' : undefined;

<ChipSelector
  label="Tags"
  value={tags}
  onChange={setTags}
  error={error}
  required
/>
```

### RangeSlider

Single value or range slider with presets.

**Location:** `components/entities/common/RangeSlider.tsx`

**Props:**

```typescript
interface RangeSliderProps {
  label: string;
  min: number;
  max: number;
  value: number | [number, number];
  onChange: (value: number | [number, number]) => void;
  unit?: string;
  presets?: { label: string; value: [number, number] }[];
  required?: boolean;
  helpText?: string;
}
```

**Usage:**

```tsx
import { RangeSlider } from '@/components/entities/common/RangeSlider';

function TempoSelector() {
  const [bpm, setBpm] = useState<[number, number]>([120, 140]);

  return (
    <RangeSlider
      label="Tempo (BPM)"
      min={40}
      max={220}
      value={bpm}
      onChange={(value) => setBpm(value as [number, number])}
      unit=" BPM"
      presets={[
        { label: 'Slow (60-80)', value: [60, 80] },
        { label: 'Moderate (80-120)', value: [80, 120] },
        { label: 'Fast (120-160)', value: [120, 160] },
      ]}
      helpText="Select a single value or range for tempo flexibility"
    />
  );
}
```

### SectionEditor

Editor for song sections (verse, chorus, bridge).

**Location:** `components/entities/common/SectionEditor.tsx`

**Props:**

```typescript
interface SectionEditorProps {
  sections: LyricsSection[];
  onChange: (sections: LyricsSection[]) => void;
  maxSections?: number;
}
```

**Usage:**

```tsx
import { SectionEditor } from '@/components/entities/common/SectionEditor';

function LyricsSections() {
  const [sections, setSections] = useState<LyricsSection[]>([
    { type: 'verse', lines: [''], order: 0 },
    { type: 'chorus', lines: [''], order: 1 },
  ]);

  return (
    <SectionEditor
      sections={sections}
      onChange={setSections}
      maxSections={10}
    />
  );
}
```

### RhymeSchemeInput

Input for rhyme scheme patterns (AABB, ABAB, etc.).

**Location:** `components/entities/common/RhymeSchemeInput.tsx`

**Usage:**

```tsx
import { RhymeSchemeInput } from '@/components/entities/common/RhymeSchemeInput';

function RhymeSchemeSelector() {
  const [scheme, setScheme] = useState('AABB');

  return (
    <RhymeSchemeInput
      value={scheme}
      onChange={setScheme}
      suggestions={['AABB', 'ABAB', 'ABCB', 'AAAA']}
    />
  );
}
```

### EntityPreviewPanel

Live preview panel showing entity JSON and validation errors.

**Location:** `components/entities/common/EntityPreviewPanel.tsx`

**Props:**

```typescript
interface EntityPreviewPanelProps {
  entity: Record<string, unknown>;
  validationErrors: ValidationError[];
}
```

**Usage:**

```tsx
import { EntityPreviewPanel } from '@/components/entities/common/EntityPreviewPanel';

function EntityForm() {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState<ValidationError[]>([]);

  return (
    <div className="flex">
      <div className="flex-1">{/* Form fields */}</div>
      <EntityPreviewPanel entity={formData} validationErrors={errors} />
    </div>
  );
}
```

## Layout Components

### AppShell

Main application layout with sidebar navigation.

**Location:** `components/layout/AppShell.tsx`

**Props:**

```typescript
interface AppShellProps {
  children: React.ReactNode;
}
```

**Usage:**

```tsx
import { AppShell } from '@/components/layout/AppShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
```

**Navigation Configuration:**

Edit `config/routes.ts` to customize sidebar navigation:

```typescript
export const NAV_ITEMS = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: 'Home',
  },
  {
    name: 'Songs',
    href: '/songs',
    icon: 'Music2',
    children: [
      { name: 'All Songs', href: '/songs' },
      { name: 'New Song', href: '/songs/new' },
    ],
  },
  // ...
];
```

### PageHeader

Page header with breadcrumbs and actions.

**Location:** `components/layout/PageHeader.tsx`

**Props:**

```typescript
interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
}
```

**Usage:**

```tsx
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@meatymusic/ui';

function SongsPage() {
  return (
    <>
      <PageHeader
        title="Songs"
        description="Manage your song library"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Songs', href: '/songs' },
        ]}
        actions={
          <Button onClick={() => router.push('/songs/new')}>
            Create Song
          </Button>
        }
      />
      {/* Page content */}
    </>
  );
}
```

## Import Patterns

### Component Imports

```tsx
// Song components
import { SongCard, SongList } from '@/components/songs';

// Workflow components
import {
  WorkflowGraph,
  WorkflowStatus,
  NodeDetails,
  MetricsPanel,
} from '@/components/workflow';

// Entity editors
import {
  StyleEditor,
  LyricsEditor,
  PersonaEditor,
  ProducerNotesEditor,
  BlueprintEditor,
  SongEditor,
} from '@/components/entities';

// Common editor components
import {
  ChipSelector,
  RangeSlider,
  SectionEditor,
  RhymeSchemeInput,
  EntityPreviewPanel,
} from '@/components/entities/common';

// Layout components
import { AppShell, PageHeader } from '@/components/layout';
```

### UI Library Imports

```tsx
// Import from @meatymusic/ui package
import {
  Button,
  Card,
  Badge,
  Checkbox,
  Progress,
  Dialog,
  Tabs,
} from '@meatymusic/ui';
```

### Type Imports

```tsx
import type { Song, Style, Lyrics } from '@/types/api';
import type { WorkflowRun, WorkflowNode } from '@/types/api';
```

## Accessibility Features

All components implement comprehensive accessibility:

### Keyboard Navigation

- **Tab**: Navigate between interactive elements
- **Enter/Space**: Activate buttons and controls
- **Escape**: Close dialogs and dropdowns
- **Arrow keys**: Navigate within lists and grids

### ARIA Attributes

Components use proper ARIA attributes:

```tsx
// SongCard implements
<Card
  role="article"
  aria-label={`Song: ${song.title}`}
  tabIndex={0}
>
  <Button
    aria-label={`Edit song ${song.title}`}
    onClick={onEdit}
  >
    Edit
  </Button>
</Card>

// ChipSelector implements
<input
  aria-label={label}
  aria-required={required}
  aria-invalid={!!error}
  aria-describedby={helpText ? 'help-text' : undefined}
/>
```

### Screen Reader Support

All components provide screen reader context:

- Form labels associated with inputs
- Error messages announced on change
- Status updates announced dynamically
- Progress indicators include text descriptions

### Focus Management

- Visible focus indicators on all interactive elements
- Focus trapped in modal dialogs
- Focus returned to trigger after closing modals
- Skip links for keyboard users

### Color and Contrast

- All text meets WCAG AA contrast ratios
- Status indicated by more than color alone
- High contrast mode support
- Dark mode support

## Best Practices

1. **Always provide callbacks**: Components work best when all callbacks are provided

2. **Use TypeScript**: All components are fully typed for best experience

3. **Handle loading states**: Show loading indicators for async operations

4. **Implement error boundaries**: Wrap components in error boundaries

5. **Optimize re-renders**: Use React.memo for expensive components

6. **Test accessibility**: Use keyboard and screen readers to test

## See Also

- [State Management Guide](./STATE_MANAGEMENT.md) - React Query and Zustand patterns
- [Entity Editors Developer Guide](./ENTITY_EDITORS.md) - Creating custom editors
- [Routing and Navigation Guide](./ROUTING.md) - Navigation patterns
- [Development Guide](./DEVELOPMENT.md) - Development workflow

## Support

For component issues or feature requests, refer to:
- Wave 1 Components: `.claude/context/phase5-wave1a-summary.md`
- Wave 2 Integration: `.claude/context/phase5-component-mapping.md`
- Design Specs: `.claude/context/phase5-design-specs.md`
