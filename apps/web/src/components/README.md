# UI Components

MeatyMusic AMCS React components for Phase 5:

## Component Structure

### Song Management
- **songs/** - Song list, cards, and management
  - `SongCard.tsx` - Song display card with workflow state
  - `SongList.tsx` - Paginated song list with filters

### Entity Editors
- **entities/** - Form components for all entity types
  - `StyleEditor.tsx` - Genre, tempo, mood, instrumentation
  - `LyricsEditor.tsx` - Section structure, rhyme scheme, themes
  - `PersonaEditor.tsx` - Voice characteristics, influences, policy
  - `ProducerNotesEditor.tsx` - Arrangement structure, hooks, mix parameters
  - `SongEditor.tsx` - Top-level song configuration
  - `BlueprintEditor.tsx` - Genre rules and evaluation rubrics

#### Common Entity Components
- **entities/common/** - Reusable form components
  - `ChipSelector.tsx` - Multi-select chip input with autocomplete
  - `RangeSlider.tsx` - Dual-handle range selector with presets
  - `SectionEditor.tsx` - Drag-and-drop section ordering
  - `RhymeSchemeInput.tsx` - Visual rhyme pattern editor
  - `EntityPreviewPanel.tsx` - Live JSON preview with validation

### Workflow Visualization
- **workflow/** - Real-time workflow monitoring
  - `WorkflowGraph.tsx` - Visual node execution graph
  - `WorkflowStatus.tsx` - Status indicators and badges
  - `NodeDetails.tsx` - Node-level execution details
  - `ArtifactPreview.tsx` - Generated artifact viewer

## Implementation Reference

See:
- Phase 5 implementation plan: `/docs/project_plans/impl_tracking/bootstrap-phase-5/`
- Website/App PRD: `/docs/project_plans/PRDs/website_app.prd.md`
- Design guidelines: `/docs/designs/`

## Infrastructure Preserved

This directory maintains component infrastructure:
- Infrastructure hooks available in `/apps/web/src/hooks/`
- Utility libraries in `/apps/web/src/lib/`
- Shared UI components from `/packages/ui/`

Components will use:
- React 18+ with TypeScript
- Tailwind CSS for styling
- Shadcn/UI component library
- React Hook Form for forms
- Zustand for state management
