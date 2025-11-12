# UI Components

This directory will contain MeatyMusic AMCS React components in Phase 5:

## Planned Component Structure

### Song Creation Flow
- **SongCreator/** - Multi-step song creation wizard
- **EntityEditors/** - Form components for each entity type
  - StyleEditor
  - LyricsEditor
  - PersonaEditor
  - ProducerNotesEditor
- **ConstraintValidators/** - Real-time validation feedback

### Workflow Visualization
- **WorkflowDashboard/** - Real-time workflow monitoring
- **WorkflowGraph/** - Visual node execution graph
- **EventStream/** - Live event feed with metrics

### Artifact Viewers
- **ArtifactViewer/** - Display generated artifacts
- **StylePreview/** - Style specification display
- **LyricsDisplay/** - Formatted lyrics with sections
- **ComposedPromptViewer/** - Final prompt display with metadata

### Shared/UI Components
- **Layout/** - Page layouts and navigation
- **Forms/** - Reusable form components
- **DataDisplay/** - Tables, cards, lists
- **Feedback/** - Toasts, alerts, loading states

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
