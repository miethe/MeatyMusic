# Entity Import Feature PRD

## Overview

Enable users to import entity definitions (Style, Lyrics, Persona, ProducerNotes, Blueprint) via JSON file upload from dashboard, entity list pages, and song creation workflow.

## Goals

1. **Streamline Entity Creation**: Allow power users to quickly populate the system with pre-defined entities
2. **Enable Entity Sharing**: Support sharing entity libraries between users and systems
3. **Ensure Data Quality**: Validate all imported entities against schemas before persistence
4. **Track Provenance**: Maintain import metadata for audit and debugging purposes

## User Stories

- As a user, I want to import a Style definition from a JSON file so I can quickly populate my library
- As a user, I want to see validation errors before importing so I can fix issues in my JSON
- As a user, I want to import entities from the dashboard, entity pages, or during song creation for flexibility
- As a user, I want imported entities to track their source file for provenance

## Technical Specification

### Import Flow

1. User clicks "Import" button (dashboard, entity page, or workflow step)
2. Modal opens with:
   - Entity type dropdown (if not pre-selected from context)
   - File upload area (drag-drop or click to browse)
   - File type validation (.json only, max 10MB)
3. User selects/drops JSON file
4. Client-side JSON parsing and preview
5. Server-side validation against entity schema
6. On validation success:
   - Entity created with import metadata
   - Success toast notification
   - Modal closes
   - Query invalidation refreshes lists
7. On validation failure:
   - Detailed error display with field-level issues
   - User can fix and retry

### Import Metadata

All imported entities track:
- `imported_at`: Timestamp of import (ISO 8601)
- `import_source_filename`: Original filename for provenance

These fields are nullable (null for manually created entities).

### API Endpoints

For each entity type (`styles`, `lyrics`, `personas`, `producer_notes`, `blueprints`):

```
POST /api/v1/[entities]/import
```

**Request**:
- Content-Type: `multipart/form-data`
- Field: `file` (JSON file)

**Response** (Success - 201):
```json
{
  "id": "uuid",
  "name": "Imported Style Name",
  "imported_at": "2025-11-17T10:30:00Z",
  "import_source_filename": "my_style.json",
  ...entity-specific fields
}
```

**Response** (Validation Error - 400):
```json
{
  "detail": "Validation failed",
  "errors": [
    {"field": "tempo", "message": "must be between 40 and 200"},
    {"field": "energy", "message": "must be between 0 and 10"}
  ]
}
```

### JSON Format

Import JSON must match the entity schema output format. Examples:

**Style**:
```json
{
  "name": "Upbeat Pop",
  "genre": "pop",
  "tempo": 128,
  "key": "C",
  "energy": 8,
  "mood": ["uplifting", "energetic"],
  "instrumentation": ["synth", "drums", "bass"]
}
```

**Lyrics**:
```json
{
  "title": "Summer Days",
  "language": "en",
  "sections": [
    {"type": "verse", "content": "..."},
    {"type": "chorus", "content": "..."}
  ],
  "constraints": {
    "explicit": false,
    "max_length": 240
  }
}
```

See entity PRDs for complete schema definitions.

### Frontend Components

**FileUpload Component** (`/apps/web/src/components/import/FileUpload.tsx`)
- Drag-drop zone with visual feedback
- File type validation (.json only)
- File size limit (10MB)
- Error states for invalid files
- Upload icon and clear instructions

**ImportPreview Component** (`/apps/web/src/components/import/ImportPreview.tsx`)
- Pretty-printed JSON display
- Validation status per field
- Error highlighting with messages
- Success indicators

**ImportModal Component** (`/apps/web/src/components/import/ImportModal.tsx`)
- Entity type dropdown (conditional - hidden when pre-selected)
- FileUpload integration
- ImportPreview integration
- Loading states during upload/validation
- Error display for server-side validation
- Import confirmation button (disabled until valid)
- Cancel button to close modal

### Integration Points

**1. Dashboard** (`/apps/web/src/app/(dashboard)/dashboard/page.tsx`)
- "Import" button next to "Create Song" in PageHeader actions
- Opens ImportModal with entity type dropdown
- After import: success toast, modal closes

**2. Entity List Pages** (5 pages)
- `/entities/styles/page.tsx`
- `/entities/lyrics/page.tsx`
- `/entities/personas/page.tsx`
- `/entities/producer-notes/page.tsx`
- `/entities/blueprints/page.tsx`

Each page:
- "Import" button next to "Create [Entity]" button
- Opens ImportModal pre-selected for that entity type
- After import: query invalidation refreshes list

**3. Song Creation Workflow** (`/apps/web/src/app/(dashboard)/songs/new/page.tsx`)
- Each entity step has three options:
  - "Create New" (existing)
  - "Select from Library" (existing, not yet implemented)
  - "Import" (new)
- Import button opens ImportModal pre-selected for step entity type
- After import: entity auto-selected in workflow, continue to next step

### Validation Rules

All validation enforced on both client and server:

**Common**:
- Required fields must be present
- Field types must match schema
- String length limits enforced
- Enum values validated

**Entity-Specific**:
- **Style**: Tempo (40-200 BPM), Energy (0-10), valid genre/key
- **Lyrics**: Valid section types, language code, constraint ranges
- **Persona**: Vocal range format, valid gender/age
- **ProducerNotes**: Valid structure types, hook position
- **Blueprint**: Valid rubric weights (0-1), genre compatibility

See `/schemas/[entity].schema.json` for complete validation rules.

## Success Criteria

- ✅ Import button visible on dashboard with entity type selection
- ✅ Import button on all 5 entity list pages (pre-selected entity type)
- ✅ Import button in song creation workflow for each entity step
- ✅ Client-side JSON validation with preview
- ✅ Server-side schema validation with detailed errors
- ✅ Import metadata persisted (timestamp, filename)
- ✅ Success/error toast notifications
- ✅ Query invalidation refreshes entity lists
- ✅ Import success rate > 95% for valid JSON
- ✅ Clear error messages for validation failures
- ✅ < 2 second import time for single entity

## Out of Scope (Future Enhancements)

- Bulk import (multiple entities in one file)
- Raw text import with AI processing
- Export functionality (inverse operation)
- Import templates library
- Import from URL
- Drag-drop directly onto entity lists
- Import history/audit log UI
- Rollback/undo import

## Technical Dependencies

- Backend: FastAPI, SQLAlchemy, Pydantic schemas
- Frontend: React, React Query, Zustand, Tailwind
- Validation: Existing JSON schemas in `/schemas/`
- UI Components: Modal, Button, Upload icons from `@meatymusic/ui`

## Database Schema Changes

Add nullable columns to all entity tables:

```sql
ALTER TABLE styles ADD COLUMN imported_at TIMESTAMP NULL;
ALTER TABLE styles ADD COLUMN import_source_filename VARCHAR(255) NULL;

ALTER TABLE lyrics ADD COLUMN imported_at TIMESTAMP NULL;
ALTER TABLE lyrics ADD COLUMN import_source_filename VARCHAR(255) NULL;

ALTER TABLE personas ADD COLUMN imported_at TIMESTAMP NULL;
ALTER TABLE personas ADD COLUMN import_source_filename VARCHAR(255) NULL;

ALTER TABLE producer_notes ADD COLUMN imported_at TIMESTAMP NULL;
ALTER TABLE producer_notes ADD COLUMN import_source_filename VARCHAR(255) NULL;

ALTER TABLE blueprints ADD COLUMN imported_at TIMESTAMP NULL;
ALTER TABLE blueprints ADD COLUMN import_source_filename VARCHAR(255) NULL;
```

Migration file: `/services/api/app/alembic/versions/[timestamp]_add_import_metadata.py`

## Testing Requirements

### Unit Tests
- Backend: Schema validation logic
- Backend: Import endpoint error handling
- Frontend: FileUpload component file type validation
- Frontend: JSON parsing and preview logic

### Integration Tests
- End-to-end import flow for each entity type
- Validation error display
- Success flow with query invalidation
- Import metadata persistence

### Manual Testing Checklist
- [ ] Import valid Style JSON from dashboard
- [ ] Import valid Style JSON from styles list page
- [ ] Import valid Style JSON from workflow
- [ ] Import invalid JSON shows field-level errors
- [ ] Non-JSON file rejected with clear error
- [ ] Large file (>10MB) rejected
- [ ] Success toast appears after import
- [ ] Imported entity appears in list
- [ ] Import metadata visible in entity details
- [ ] Repeat for Lyrics, Persona, ProducerNotes, Blueprint

## Implementation Timeline

**Phase 1: Backend** (4 hours)
- Schema updates
- Database migration
- Import endpoints (all 5 entities)

**Phase 2: Frontend Components** (4 hours)
- FileUpload component
- ImportPreview component
- ImportModal component
- React Query hooks

**Phase 3: Integration** (3 hours)
- Dashboard button
- Entity page buttons (5 pages)
- Workflow integration

**Phase 4: Testing** (2 hours)
- Unit tests
- Integration tests
- Manual testing

**Total**: 13 hours

## Observability

Import events emitted to telemetry:

```json
{
  "event": "entity_import",
  "entity_type": "style",
  "success": true,
  "validation_errors": 0,
  "file_size_bytes": 1024,
  "duration_ms": 234,
  "source_filename": "my_style.json"
}
```

Metrics tracked:
- Import success rate per entity type
- Import duration (P50, P95, P99)
- Validation error frequency
- File size distribution

## Security Considerations

- File size limit prevents DOS attacks
- JSON parsing with size limits
- Schema validation prevents injection
- No arbitrary file execution
- Multipart upload limits enforced
- Rate limiting on import endpoints

## References

- Entity Schemas: `/schemas/[entity].schema.json`
- Entity PRDs: `/docs/project_plans/PRDs/[entity].prd.md`
- Frontend Components: `@meatymusic/ui` package
- API Patterns: `/services/api/app/api/v1/endpoints/`

---

**Last Updated**: 2025-11-17
**Status**: In Development
**Owner**: MeatyMusic Team
