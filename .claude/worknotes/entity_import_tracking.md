# Entity Import Feature - Implementation Tracking

**Started**: 2025-11-17
**Status**: In Progress
**Feature**: JSON file import for all entity types with provenance tracking

## Overview

Implement entity import functionality allowing users to import Style, Lyrics, Persona, ProducerNotes, and Blueprint entities via JSON file upload from dashboard, entity pages, and song creation workflow.

## Key Decisions

- **Modal UI**: Single modal with entity type dropdown
- **Import Scope**: Single entity per file (no bulk import for MVP)
- **Workflow Integration**: Import button alongside Create/Library in workflow
- **Provenance**: Track `imported_at` timestamp and `import_source_filename`

## Implementation Progress

### Phase 1: Documentation ✅
- [x] PRD created at `/docs/project_plans/PRDs/entity_import.prd.md`
- [x] Tracking document created

### Phase 2: Backend (In Progress)
- [ ] Add import metadata to schemas (5 files)
- [ ] Create database migration
- [ ] Implement import endpoint for styles
- [ ] Implement import endpoint for lyrics
- [ ] Implement import endpoint for personas
- [ ] Implement import endpoint for producer notes
- [ ] Implement import endpoint for blueprints

### Phase 3: Frontend Components (Pending)
- [ ] FileUpload component
- [ ] ImportPreview component
- [ ] ImportModal component

### Phase 4: API Clients (Pending)
- [ ] Add import method to 5 API clients
- [ ] Create useImport React Query hook

### Phase 5: UI Integration (Pending)
- [ ] Dashboard import button
- [ ] Entity list pages import buttons (5 pages)
- [ ] Song creation workflow integration

### Phase 6: Testing (Pending)
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing all entity types

### Phase 7: Finalization (Pending)
- [ ] Commit all changes

## Files Modified

### Backend
**Schemas** (5 files):
- [ ] `/services/api/app/schemas/style.py`
- [ ] `/services/api/app/schemas/lyrics.py`
- [ ] `/services/api/app/schemas/persona.py`
- [ ] `/services/api/app/schemas/producer_notes.py`
- [ ] `/services/api/app/schemas/blueprint.py`

**Endpoints** (5 files):
- [ ] `/services/api/app/api/v1/endpoints/styles.py`
- [ ] `/services/api/app/api/v1/endpoints/lyrics.py`
- [ ] `/services/api/app/api/v1/endpoints/personas.py`
- [ ] `/services/api/app/api/v1/endpoints/producer_notes.py`
- [ ] `/services/api/app/api/v1/endpoints/blueprints.py`

**Migrations**:
- [ ] New migration file for import metadata columns

### Frontend
**Components** (3 new files):
- [ ] `/apps/web/src/components/import/FileUpload.tsx`
- [ ] `/apps/web/src/components/import/ImportPreview.tsx`
- [ ] `/apps/web/src/components/import/ImportModal.tsx`

**API Clients** (5 files):
- [ ] `/apps/web/src/lib/api/styles.ts`
- [ ] `/apps/web/src/lib/api/lyrics.ts`
- [ ] `/apps/web/src/lib/api/personas.ts`
- [ ] `/apps/web/src/lib/api/producerNotes.ts`
- [ ] `/apps/web/src/lib/api/blueprints.ts`

**Hooks** (1 new file):
- [ ] `/apps/web/src/hooks/api/useImport.ts`

**Pages** (7 files):
- [ ] `/apps/web/src/app/(dashboard)/dashboard/page.tsx`
- [ ] `/apps/web/src/app/(dashboard)/entities/styles/page.tsx`
- [ ] `/apps/web/src/app/(dashboard)/entities/lyrics/page.tsx`
- [ ] `/apps/web/src/app/(dashboard)/entities/personas/page.tsx`
- [ ] `/apps/web/src/app/(dashboard)/entities/producer-notes/page.tsx`
- [ ] `/apps/web/src/app/(dashboard)/entities/blueprints/page.tsx`
- [ ] `/apps/web/src/app/(dashboard)/songs/new/page.tsx`

## Technical Notes

### Import Metadata Schema
```python
imported_at: Optional[datetime] = None
import_source_filename: Optional[str] = None
```

### Import Endpoint Pattern
```python
@router.post("/import", response_model=EntityResponse, status_code=201)
async def import_entity(
    file: UploadFile = File(...),
    service: EntityService = Depends(get_entity_service)
) -> EntityResponse:
    # Validate file type
    # Parse JSON
    # Validate against schema
    # Add import metadata
    # Create entity
```

### Frontend Import Flow
1. User clicks "Import" button
2. ImportModal opens (with entity type selector if from dashboard)
3. FileUpload accepts .json file (max 10MB)
4. JSON parsed and validated client-side
5. ImportPreview shows validation status
6. POST to `/api/v1/[entities]/import`
7. Success: toast notification, modal closes, query invalidates
8. Error: display field-level validation errors

## Challenges & Solutions

### Challenge 1: Entity Type Selection
**Solution**: Conditional rendering of entity type dropdown - hidden when context pre-selects type (entity pages, workflow)

### Challenge 2: Validation Error Display
**Solution**: ImportPreview component with field-level error highlighting and clear messages

### Challenge 3: Workflow Integration
**Solution**: Add import as third option alongside Create/Library, auto-select imported entity

## Testing Strategy

### Unit Tests
- Schema validation logic
- JSON parsing edge cases
- File type/size validation

### Integration Tests
- End-to-end import for each entity type
- Error handling and display
- Query invalidation

### Manual Testing
- Import from all 3 locations (dashboard, entity pages, workflow)
- All 5 entity types
- Valid and invalid JSON
- File size limits
- Non-JSON files

## Success Metrics

- Import success rate > 95% for valid JSON
- < 2 second import time per entity
- Clear error messages for all validation failures
- Zero security vulnerabilities

## Timeline

- **Documentation**: 30 min ✅
- **Backend**: 4 hours (In Progress)
- **Frontend Components**: 4 hours
- **API Clients**: 1 hour
- **Integration**: 3 hours
- **Testing**: 2 hours
- **Total**: ~14 hours

## Next Steps

1. Add import metadata fields to all backend schemas
2. Create database migration
3. Implement import endpoints (start with styles as reference)
4. Create frontend components
5. Wire up API clients and hooks
6. Integrate into UI
7. Test thoroughly
8. Commit

---

**Last Updated**: 2025-11-17
