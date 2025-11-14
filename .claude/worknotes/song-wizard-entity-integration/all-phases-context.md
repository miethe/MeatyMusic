# Song Wizard Entity Integration - Working Context

**Purpose:** Token-efficient context for resuming work across AI turns

---

## Current State

**Branch:** claude/song-wizard-entity-integration-01WVmHEgGGR8QKZtgtMzhTs8
**Last Commit:** 7d60b67 docs(planning): add Phase 2B implementation plan for wizard entity integration
**Current Task:** Setting up tracking infrastructure and delegating first work package

---

## Implementation Scope

**Phase 2B** integrates existing entity editors into the Song Creation Wizard:
- Replace placeholder steps with functional editors (StyleEditor, LyricsEditor, PersonaEditor, ProducerNotesEditor)
- Implement wizard state management for multi-entity data collection
- Create sequential entity submission workflow
- Enhance review step to display all collected data
- Handle optional entity creation (skip functionality)

**Key Constraint:** All entity editors are production-ready - NO modifications to editors required, only wizard orchestration.

---

## Key Architecture Patterns

### Wizard Structure
- File: `apps/web/src/app/(dashboard)/songs/new/page.tsx`
- Steps 0-5: Song Info, Style, Lyrics, Persona, Producer Notes, Review
- Currently: Steps 0 & 5 implemented, steps 1-4 are placeholders

### Entity Editor Pattern (ALL editors follow this)
```typescript
interface EditorProps {
  songId?: string;           // Required for song-linked entities
  initialValue?: Partial<EntityBase>;
  onSave: (entity: EntityCreate) => void;
  onCancel: () => void;
  className?: string;
}
```

### React Query Hooks Available
- `useCreateSong()`, `useCreateStyle()`, `useCreateLyrics()`, `useCreatePersona()`, `useCreateProducerNotes()`
- `useUpdateSong(id)` - For linking entity references

---

## Work Package Delegation Strategy

| WP | Tasks | Subagent | Rationale |
|----|-------|----------|-----------|
| WP2B-1 | State Management | frontend-developer or ui-engineer-enhanced | Complex state logic with React hooks |
| WP2B-2 | Style Editor Integration | ui-engineer-enhanced | UI component integration |
| WP2B-3 | Remaining Editors | ui-engineer-enhanced | UI component integration (batch work) |
| WP2B-4 | Review Step Enhancement | ui-engineer-enhanced | UI component creation |
| WP2B-5 | Submission Flow | frontend-developer | Complex async orchestration with React Query |
| WP2B-6 | UX Polish | ui-engineer-enhanced | UX enhancements and edge cases |

---

## Key Files

### Wizard
- `apps/web/src/app/(dashboard)/songs/new/page.tsx` - Main wizard component

### Entity Editors (No modifications needed)
- `apps/web/src/components/entities/StyleEditor.tsx`
- `apps/web/src/components/entities/LyricsEditor.tsx`
- `apps/web/src/components/entities/PersonaEditor.tsx`
- `apps/web/src/components/entities/ProducerNotesEditor.tsx`

### API Hooks
- `apps/web/src/hooks/api/useSongs.ts`
- `apps/web/src/hooks/api/useStyles.ts`
- `apps/web/src/hooks/api/useLyrics.ts`
- `apps/web/src/hooks/api/usePersonas.ts`
- `apps/web/src/hooks/api/useProducerNotes.ts`

### Types
- `apps/web/src/types/api/entities.ts`

---

## PRD References

- `website_app.prd.md:62-70` - Multi-step wizard flow
- `website_app.prd.md:80-86` - UX requirements (progressive disclosure, real-time feedback)
- `style.prd.md`, `lyrics.prd.md`, `persona.prd.md`, `producer_notes.prd.md` - Entity validation rules

---

## Important Learnings

(To be populated as development proceeds)

---

## Quick Reference

### Frontend Development
```bash
# Start dev server
pnpm --filter "./apps/web" dev

# Run tests
pnpm --filter "./apps/web" test -- --testPathPattern="wizard"

# Type check
pnpm --filter "./apps/web" typecheck

# Build check
pnpm --filter "./apps/web" build
```

---

**Last Updated:** 2025-11-14
