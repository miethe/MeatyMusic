# Bug Fixes: November 2025

## 2025-11-14
| Aspect | Value |
|--------|-------|
| Bug | TypeScript error: 'data' implicitly has type 'any' |
| Fix | Replaced `any` with `Record<string, unknown>`, added explicit type casts |
| File | apps/web/src/app/(dashboard)/songs/new/page.tsx:882 |
| Commit | 2c2c0bd |

| Aspect | Value |
|--------|-------|
| Bug | ESLint error: 'song_id' is assigned but never used |
| Fix | Prefixed with underscore: `song_id: _song_id` (intentional destructure) |
| File | apps/web/src/app/(dashboard)/songs/new/page.tsx:519,565 |
| Commit | 2c2c0bd |

| Aspect | Value |
|--------|-------|
| Bug | TypeScript error: 'isPending' declared but never read |
| Fix | Removed unused variable declaration |
| File | apps/web/src/app/(dashboard)/songs/new/page.tsx:648 |
| Commit | 2c2c0bd |

| Aspect | Value |
|--------|-------|
| Bug | TypeScript error: Property 'workflow' does not exist on type 'Song' |
| Fix | Removed conditional check for song.workflow, always show empty state |
| File | apps/web/src/app/(dashboard)/songs/[id]/page.tsx:232 |
| Commit | d848e14 |

| Aspect | Value |
|--------|-------|
| Bug | Entity creation failures - async/sync session mismatch |
| Fix | Fixed sync/async session mismatch, added get_db_session alias, commented out unused async dependencies |
| File | services/api/app/api/dependencies.py, services/api/app/core/dependencies.py |
| Commit | b3fb1c1 |

| Aspect | Value |
|--------|-------|
| Bug | White text on white backgrounds in entity editors |
| Fix | Updated background/text colors for proper contrast, fixed slider visibility |
| Files | StyleEditor, SongEditor, PersonaEditor, LyricsEditor, ProducerNotesEditor, BlueprintEditor |
| Commit | b3fb1c1 |

| Aspect | Value |
|--------|-------|
| Enhancement | Missing library selection in song creation flow |
| Fix | Added LibrarySelector component and integrated across all entity editors |
| File | apps/web/src/components/entities/common/LibrarySelector.tsx |
| Commit | b3fb1c1 |

| Aspect | Value |
|--------|-------|
| Bug | Style entity creation button has no effect - API not wired |
| Fix | Replaced basic form with StyleEditor component, connected useStyles/useCreateStyle hooks, added proper loading/error states |
| Files | apps/web/src/app/(dashboard)/entities/styles/new/page.tsx, apps/web/src/app/(dashboard)/entities/styles/page.tsx, apps/web/src/app/(dashboard)/entities/styles/[id]/page.tsx |
| Commit | Pending |

| Aspect | Value |
|--------|-------|
| Bug | Field name mismatches: tempo_min/tempo_max vs bpm_min/bpm_max, moods vs mood |
| Fix | Updated field references to match TypeScript schema (bpm_min/bpm_max, mood) |
| Files | apps/web/src/app/(dashboard)/entities/styles/page.tsx, apps/web/src/app/(dashboard)/entities/styles/[id]/page.tsx |
| Commit | Pending |

| Aspect | Value |
|--------|-------|
| Enhancement | Added missing STYLE_EDIT route for style editing page |
| Fix | Added STYLE_EDIT route to routes configuration |
| File | apps/web/src/config/routes.ts |
| Commit | bf65e74 |

| Aspect | Value |
|--------|-------|
| Bug | TypeScript build error: Property 'tags' does not exist on type 'Style' |
| Fix | Changed `style.tags` to `style.tags_positive` and `style.tags_negative` to match schema |
| File | apps/web/src/app/(dashboard)/entities/styles/[id]/page.tsx |
| Commit | 82a9fba |
| Aspect | Value |
|--------|-------|
| Bug | All entity pages (Lyrics, Personas, ProducerNotes, Blueprints) had placeholder code not wired to API |
| Fix | Wired all entity list/create/detail pages to existing Editor components and API hooks, added loading/error/empty states |
| Files | All pages under entities/lyrics/, entities/personas/, entities/producer-notes/, entities/blueprints/ (12 files total) |
| Commit | Pending |

| Aspect | Value |
|--------|-------|
| Enhancement | Added missing edit routes for all entities |
| Fix | Added LYRICS_EDIT, PERSONA_EDIT, PRODUCER_NOTE_EDIT, BLUEPRINT_EDIT routes |
| File | apps/web/src/config/routes.ts |
| Commit | Pending |

## 2025-11-17
| Aspect | Value |
|--------|-------|
| Bug | TypeScript error: BlueprintEditor missing showLibrarySelector prop |
| Fix | Added showLibrarySelector prop with full library selection functionality (consistent with other editors) |
| File | apps/web/src/components/entities/BlueprintEditor.tsx |
| Commit | f5a53d4 |

| Aspect | Value |
|--------|-------|
| Bug | TypeScript error: Reduce operator type mismatch with Record<string, unknown> in Lyrics pages |
| Fix | Added explicit type annotations (sum: number) and type guards (typeof) for section properties |
| Files | apps/web/src/app/(dashboard)/entities/lyrics/[id]/page.tsx, apps/web/src/app/(dashboard)/entities/lyrics/page.tsx |
| Commit | f5a53d4 |

| Aspect | Value |
|--------|-------|
| Bug | TypeScript error: Property 'name' does not exist on type 'Lyrics' |
| Fix | Generated title from themes array instead of non-existent lyrics.name |
| Files | apps/web/src/app/(dashboard)/entities/lyrics/[id]/page.tsx, apps/web/src/app/(dashboard)/entities/lyrics/page.tsx |
| Commit | f5a53d4 |

| Aspect | Value |
|--------|-------|
| Bug | TypeScript error: LyricsEditor & ProducerNotesEditor require songId but /new pages don't provide it |
| Fix | Made songId prop optional (songId?: string) to allow standalone entity creation |
| Files | apps/web/src/components/entities/LyricsEditor.tsx, apps/web/src/components/entities/ProducerNotesEditor.tsx |
| Commit | f5a53d4 |

| Aspect | Value |
|--------|-------|
| Bug | TypeScript error: Property 'gender' and 'delivery_styles' do not exist on type 'Persona' |
| Fix | Replaced persona.gender with persona.voice and persona.delivery_styles with persona.delivery |
| File | apps/web/src/app/(dashboard)/entities/personas/page.tsx |
| Commit | f5a53d4 |

| Aspect | Value |
|--------|-------|
| Bug | All API endpoints returning 401 Unauthorized - DEV_AUTH_BYPASS not working in Docker |
| Fix | Updated infra/.env.docker: enabled DEV_AUTH_BYPASS_ENABLED=true, set secret and user ID, fixed ports (8000/3000 instead of 8030/3030). Docker restart doesn't reload .env - required full down/up cycle |
| File | infra/.env.docker |
| Commit | Pending |

| Aspect | Value |
|--------|-------|
| Bug | Song creation failed with psycopg2.errors.NumericValueOutOfRange: integer out of range (global_seed=1763319120112) |
| Fix | Changed songs.global_seed from INTEGER (32-bit) to BIGINT (64-bit) in Song model and database migration |
| Files | services/api/app/models/song.py, services/api/alembic/versions/20251117_1430_698242fd277f_fix_songs_global_seed_bigint.py |
| Commit | 764d196 |

| Aspect | Value |
|--------|-------|
| Bug | GET /songs failed with ValueError: badly formed hexadecimal UUID string - DEV_AUTH_BYPASS_USER_ID had invalid default |
| Fix | Fixed config default from "dev-user-00000000..." to valid UUID "00000000-0000-0000-0000-000000000000", added error handling in dependencies.py |
| Files | services/api/app/core/config.py:261, services/api/app/core/dependencies.py:90,412 |
| Commit | 824e9b9 |

| Aspect | Value |
|--------|-------|
| Bug | /styles endpoint failed with AttributeError: 'StyleRepository' object has no attribute 'list' - BaseRepository missing list() method |
| Fix | Added list() method to BaseRepository with limit/offset pagination, added model_class attribute to all entity repositories (Style, Persona, Blueprint, ProducerNotes, WorkflowRun) |
| Files | services/api/app/repositories/base.py:310-365, services/api/app/repositories/style_repo.py:23, persona_repo.py, blueprint_repo.py, producer_notes_repo.py, workflow_run_repo.py |
| Commit | Pending |

| Aspect | Value |
|--------|-------|
| Bug | Endpoint handlers using 'await' on synchronous repository methods causing runtime errors |
| Fix | Removed 'await' from all repository method calls across 5 endpoint files (styles, personas, blueprints, producer_notes, workflow_runs). Repository methods are sync; only service methods are async |
| Files | services/api/app/api/v1/endpoints/styles.py, personas.py, blueprints.py, producer_notes.py, workflow_runs.py |
| Commit | Pending |

**Note**: Docker daemon not running - services need restart to test fixes. Code changes validated syntactically.
