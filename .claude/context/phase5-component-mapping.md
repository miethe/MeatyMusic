# Phase 5: Component Mapping Reference

## Visual Component Migration Map

### Core Components

```
MeatyPrompts                  →  MeatyMusic
=====================================

PromptCard                    →  SongCard
├── Header (title, version)   →  Header (title, genre)
├── MetaStrip (tags, model)   →  MetaStrip (mood chips, status)
├── BodyPreview (text)        →  EntitySummary (4 entity cards)
├── Stats (runs, cost, time)  →  Stats (preserve)
└── Actions (Run, Edit, Fork) →  Actions (View Workflow, Edit, Clone)

PromptList                    →  SongList
├── useInfinitePrompts        →  useInfiniteSongs
├── BulkActionBar            →  BulkActionBar (preserve)
├── PromptCardItem           →  SongCardItem
└── Empty States             →  Empty States (adapt messaging)

EditPromptModal              →  SongWizard (NEW PATTERN)
├── Single modal with tabs   →  Multi-step wizard
├── Overview Tab             →  Step 1: Song Info
├── Blocks Tab               →  Step 2-5: Entity Editors
└── Runs Tab                 →  Step 6: Review & Launch

RunHistoryList               →  WorkflowRunList
├── RunHistoryItem           →  WorkflowRunItem
│   ├── Status badge         →  Workflow node badges
│   ├── Duration             →  Duration + node breakdown
│   └── Model info           →  Blueprint info
└── RunDetail                →  WorkflowNodeDetail
    ├── Output text          →  Artifact viewer
    └── Input text           →  SDS + node inputs
```

## Detailed Component Adaptations

### 1. PromptCard → SongCard

**What Changes**:
```tsx
// OLD (PromptCard)
<PromptCard
  title="Generate Product Description"
  version={3}
  promptType="user"
  model="gpt-4"
  tags={["marketing", "seo"]}
  metrics={{ runs: 45, successRate: 98 }}
  onRun={() => {}}
  onEdit={() => {}}
  onFork={() => {}}
/>

// NEW (SongCard)
<SongCard
  title="Summer Vibes"
  genre="Pop"
  mood={["upbeat", "catchy", "energetic"]}
  status="complete"
  workflowState={{
    currentNode: "REVIEW",
    completedNodes: ["PLAN", "STYLE", "LYRICS", "PRODUCER", "COMPOSE", "VALIDATE"],
    progress: 100
  }}
  entities={{
    style: { id: "style-1", name: "Pop Summer 2024" },
    lyrics: { id: "lyrics-1", name: "Summer Fun" },
    persona: { id: "persona-1", name: "Pop Star Voice" },
    producer: { id: "prod-1", name: "Upbeat Mix" }
  }}
  metrics={{ runs: 3, successRate: 100 }}
  onViewWorkflow={() => {}}
  onEdit={() => {}}
/>
```

**Visual Layout Changes**:
```
┌─────────────────────────────────────┐
│ [Checkbox] Summer Vibes   [Pop]    │  ← Header: title + genre badge
│ upbeat • catchy • energetic        │  ← MetaStrip: mood chips (max 3)
│ [Complete] ●●●●●●○○○○ 60%         │  ← Status + workflow progress
├─────────────────────────────────────┤
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐       │  ← Entity summary cards
│ │STYL││LYRI││PERS││PROD│       │
│ └────┘ └────┘ └────┘ └────┘       │
├─────────────────────────────────────┤
│ 3 runs • 100% success • $0.45     │  ← Stats row (preserved)
├─────────────────────────────────────┤
│ [View Workflow] [Edit] [⋮]         │  ← Actions row
└─────────────────────────────────────┘
```

### 2. PromptList → SongList

**What Changes**:
```tsx
// Filter changes
interface PromptFilters {           interface SongFilters {
  q?: string;                         q?: string;
  tags?: string[];              →     genres?: string[];
  models?: string[];            →     moods?: string[];
  promptTypes?: string[];       →     status?: string[];
  favorite?: boolean;                 favorite?: boolean;
}
```

**Empty State Changes**:
```
OLD: "No prompts yet"           NEW: "No songs yet"
  → "Create Your First Prompt"    → "Create Your First Song"

OLD: "No public prompts"        NEW: "No complete songs"
  → "View My Prompts"              → "Start a Workflow"
```

### 3. EditPromptModal → SongWizard

**Major Redesign**:
```
OLD Pattern (Single Modal)       NEW Pattern (Multi-Step Wizard)
====================            ============================

┌──────────────────────┐        ┌──────────────────────────┐
│ Edit Prompt          │        │ Create Song              │
│ [Overview][Blocks]   │        │ Step 1 of 6: Song Info   │
│ [Runs][Provenance]   │        │                          │
│                      │   →    │ [Progress: ●○○○○○]      │
│ (All tabs in one     │        │                          │
│  modal view)         │        │ (Linear wizard flow)     │
│                      │        │                          │
│ [Cancel] [Save]      │        │ [Back] [Next]            │
└──────────────────────┘        └──────────────────────────┘

Steps:
1. Song Info (name, genre, mood)
2. Style Editor (tempo, key, tags)
3. Lyrics Editor (sections, rhyme)
4. Persona Selector (voice)
5. Producer Notes (structure)
6. Review & Launch (SDS preview)
```

### 4. RunHistory → WorkflowRuns

**What Changes**:
```tsx
// OLD (Run)
interface PromptRun {
  id: string;
  status: 'success' | 'failed';
  output_text: string;
  model: string;
  cost: number;
  latency_ms: number;
}

// NEW (WorkflowRun)
interface WorkflowRun {
  id: string;
  status: 'running' | 'success' | 'failed';
  nodes: WorkflowNode[];           // ← NEW: per-node status
  artifacts: {                     // ← NEW: generated outputs
    style: StyleSpec;
    lyrics: LyricsSpec;
    composed_prompt: string;
  };
  scores: {                        // ← NEW: validation scores
    hook_density: 0.85;
    rhyme_tightness: 0.92;
  };
  fix_attempts: 1;                 // ← NEW: fix cycle count
}
```

**Visual Layout Changes**:
```
OLD (Prompt Run Item)                NEW (Workflow Run Item)
========================            ==========================

┌─────────────────────────┐        ┌──────────────────────────┐
│ ✓ gpt-4                 │        │ PLAN → STYLE → LYRICS    │
│ 1.2s • $0.003           │        │   ✓      ✓       ✓       │
│ 2 hours ago             │   →    │ → COMPOSE → VALIDATE → ✓ │
└─────────────────────────┘        │   ✓          ✓           │
                                   │ 45s • 1 fix • 92% score  │
                                   │ 2 hours ago              │
                                   └──────────────────────────┘
```

## New Components (No MP Equivalent)

### 1. WorkflowGraphVisualization

**Purpose**: Display workflow DAG with real-time node status

```
┌────────────────────────────────────────┐
│   Workflow: Summer Vibes Run #3        │
├────────────────────────────────────────┤
│                                        │
│        ┌────┐                          │
│        │PLAN│✓                         │
│        └─┬──┘                          │
│      ┌───┼───┐                         │
│   ┌──▼──┐┌─▼──┐┌──▼───┐               │
│   │STYLE││LYRI││PRODUC│               │
│   │  ✓  ││ ✓  ││  ✓   │               │
│   └──┬──┘└─┬──┘└──┬───┘               │
│      └─────┼──────┘                    │
│         ┌──▼──┐                        │
│         │COMPS│✓                       │
│         └──┬──┘                        │
│         ┌──▼────┐                      │
│         │VALIDT│✓                      │
│         └──┬────┘                      │
│         ┌──▼───┐                       │
│         │RENDER│⟳ (running)           │
│         └──────┘                       │
│                                        │
│ Legend: ✓ Complete  ⟳ Running         │
│         ✗ Failed    ○ Pending         │
└────────────────────────────────────────┘
```

### 2. EntitySummary Component

**Purpose**: Display linked entities in SongCard

```
┌──────────────────────────────────────┐
│ Entities                             │
├──────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐             │
│ │ Style   │ │ Lyrics  │             │
│ │ Pop 24  │ │ Summer  │             │
│ │ ✓       │ │ ✓       │             │
│ └─────────┘ └─────────┘             │
│ ┌─────────┐ ┌─────────┐             │
│ │ Persona │ │ Producer│             │
│ │ PopStar │ │ Upbeat  │             │
│ │ ✓       │ │ ✓       │             │
│ └─────────┘ └─────────┘             │
└──────────────────────────────────────┘
```

### 3. LyricsEditor with Section Management

**Purpose**: Edit lyrics with verse/chorus/bridge sections

```
┌──────────────────────────────────────┐
│ Lyrics Editor                        │
├──────────────────────────────────────┤
│ Section: [Verse 1 ▼] [+ Add]       │
│ ┌────────────────────────────────┐  │
│ │ Summer sun is shining bright   │  │
│ │ Dancing through the day and... │  │
│ └────────────────────────────────┘  │
│                                      │
│ Rhyme: [AABB ▼] Syllables: [8-10]  │
│                                      │
│ Section: [Chorus ▼] [+ Add]        │
│ ┌────────────────────────────────┐  │
│ │ Oh yeah, summer vibes          │  │
│ │ Feel the heat, feel alive...   │  │
│ └────────────────────────────────┘  │
│                                      │
│ [Add Verse] [Add Chorus] [Add...]  │
└──────────────────────────────────────┘
```

## Reusable Patterns from MP

### Pattern 1: Bulk Selection

**Preserve As-Is**:
```tsx
// apps/web/src/hooks/useBulkSelection.ts
const selection = useBulkSelection({
  allItems: songs,
  onSelectionChange: (selectedIds) => {
    trackEvent('songs_selection_changed', { count: selectedIds.size });
  },
});

// Features:
// - Shift+Click range selection
// - Cmd+A select all
// - Escape to clear
// - Checkbox visibility on hover
```

### Pattern 2: Filter Management

**Adapt for Songs**:
```tsx
// OLD (Prompts)
const { filters, setFilter } = usePromptFilters({
  tags: ['marketing'],
  models: ['gpt-4'],
});

// NEW (Songs)
const { filters, setFilter } = useSongFilters({
  genres: ['pop'],
  moods: ['upbeat', 'catchy'],
  status: ['complete'],
});
```

### Pattern 3: Modal-based Editing

**Preserve Pattern**:
```tsx
// Parallel routes for modal intercept
songs/[id]/
├── @modal/
│   └── (.)edit/          // Opens in modal
│       └── page.tsx
└── edit/                 // Direct navigation fallback
    └── page.tsx
```

## Quick Reference: Component Status

| Component | Status | Priority | Effort |
|-----------|--------|----------|--------|
| SongCard | Adapt | High | Medium |
| SongList | Adapt | High | Low |
| SongWizard | Create | High | High |
| StyleEditor | Create | High | Medium |
| LyricsEditor | Create | High | High |
| PersonaSelector | Create | High | Low |
| ProducerNotesEditor | Create | Medium | Medium |
| WorkflowGraphVisualization | Create | Medium | High |
| WorkflowRunList | Adapt | Medium | Low |
| WorkflowNodeDetail | Adapt | Medium | Low |
| ArtifactViewer | Create | Medium | Medium |

**Legend**:
- **Preserve**: Copy with minimal changes (<10% modified)
- **Adapt**: Reuse structure, modify content (10-40% modified)
- **Create**: Build from scratch using MP patterns (>40% new)

---

**Reference Document**: Use this alongside `/phase5-frontend-architecture.md` during Wave 2 implementation.
