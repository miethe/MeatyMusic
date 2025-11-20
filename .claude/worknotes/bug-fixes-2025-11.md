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
| Commit | 5379b4f |

| Aspect | Value |
|--------|-------|
| Bug | Endpoint handlers using 'await' on synchronous repository methods causing runtime errors |
| Fix | Removed 'await' from all repository method calls across 5 endpoint files (styles, personas, blueprints, producer_notes, workflow_runs). Repository methods are sync; only service methods are async |
| Files | services/api/app/api/v1/endpoints/styles.py, personas.py, blueprints.py, producer_notes.py, workflow_runs.py |
| Commit | 5379b4f |

| Aspect | Value |
|--------|-------|
| Bug | Song creation failed with 400: "Song has no blueprint reference" - SDS compiler requires blueprint_id but schema allows it to be optional |
| Fix | Made SDS compilation conditional on blueprint_id presence. Allows incremental song building where entities are added progressively. SDS compilation deferred until blueprint is provided |
| File | services/api/app/api/v1/endpoints/songs.py:108-179 |
| Commit | 00f534e |

| Aspect | Value |
|--------|-------|
| Bug | /entities/lyrics failed with ValueError: model_class must be provided or set as class attribute - 6 repositories missing model_class |
| Fix | Added model_class attribute to LyricsRepository, ComposedPromptRepository, SourceRepository, SongRepository, WorkflowEventRepository, NodeExecutionRepository |
| Files | services/api/app/repositories/lyrics_repo.py:24, composed_prompt_repo.py:24, source_repo.py:23, song_repo.py:27, workflow_event_repo.py:24, node_execution_repo.py:23 |
| Commit | 5c60ad8 |

| Aspect | Value |
|--------|-------|
| Bug | Lyrics endpoint using 'await' on synchronous repo.list() method causing "object list can't be used in 'await' expression" |
| Fix | Removed 'await' from service.repo.list() call - BaseRepository.list() is synchronous (uses SQLAlchemy sync API) |
| File | services/api/app/api/v1/endpoints/lyrics.py:94 |
| Commit | 5c60ad8 |

| Aspect | Value |
|--------|-------|
| Bug | CORS policy blocking frontend requests from localhost:3000 - wildcard allow_origins=["*"] with credentials=True causes browser violations |
| Fix | Changed to explicit allowed origins: localhost:3000, localhost:19006, 127.0.0.1:3000. Added expose_headers=["*"] |
| File | services/api/main.py:58-71 |
| Commit | 5c60ad8 |

| Aspect | Value |
|--------|-------|
| Bug | Slider components (Tempo, Energy Level, etc.) not rendering - invalid Tailwind classes not in design system |
| Fix | Replaced undefined classes with proper tokens: border-3→border-2, background-tertiary→bg-elevated, accent-primary→primary, accent-error→red-500, border-accent→border-primary |
| Files | apps/web/src/components/entities/common/RangeSlider.tsx, apps/web/src/components/entities/StyleEditor.tsx |
| Commit | 5c60ad8 |

| Aspect | Value |
|--------|-------|
| Bug | Song card navigation broken - clicking song cards in /songs list had no effect, unable to navigate to detail page |
| Fix | Added navigation handlers (onSongClick, onViewWorkflow, onEdit, onClone, onDelete) to SongList component, set interactive prop on Card component to enable cursor-pointer styling. Card component properly passes onClick through {...props} |
| Files | apps/web/src/app/(dashboard)/songs/page.tsx, apps/web/src/components/songs/SongCard.tsx |
| Commit | 26f2156 |

| Aspect | Value |
|--------|-------|
| Bug | TypeScript error: 'sort' does not exist in type 'SongFilters' or 'WorkflowRunFilters' |
| Fix | Removed unsupported sort parameters from useSongs and useWorkflowRuns calls - backend defaults to created_at desc |
| File | apps/web/src/app/(dashboard)/dashboard/page.tsx:47,53 |
| Commit | 9964177 |

| Aspect | Value |
|--------|-------|
| Bug | TypeScript error: Property 'interactive' does not exist on type 'CardProps' - wrong Card component exported |
| Fix | Removed duplicate legacy Card export, added CardProps type export to Card/index.ts. SongCard now uses advanced Card component with interactive prop support |
| Files | packages/ui/src/components/index.ts:112, packages/ui/src/components/Card/index.ts:2 |
| Commit | 9964177 |

## 2025-11-18
| Aspect | Value |
|--------|-------|
| Bug | 404 error: workflow runs API endpoint not found - frontend calling /api/v1/workflows/runs but backend serves /api/v1/workflow-runs |
| Fix | Updated frontend API endpoint paths from '/workflows/runs' to '/workflow-runs' (hyphen instead of slash) to match backend routing |
| File | apps/web/src/config/api.ts:45-50 |
| Commit | b892466 |

| Aspect | Value |
|--------|-------|
| Bug | 404 error: song edit page not found - /songs/{id}/edit route defined but page component missing |
| Fix | Created song edit page component with form for updating song properties (title, description, genre, mood, global_seed) |
| File | apps/web/src/app/(dashboard)/songs/[id]/edit/page.tsx |
| Commit | b892466 |

| Aspect | Value |
|--------|-------|
| Bug | TypeScript error: useUpdateSong() expects 1 argument but got 0; extra_metadata fields have unknown type |
| Fix | Pass songId to useUpdateSong(songId) hook, update mutateAsync to only pass data, add type assertions for extra_metadata fields |
| File | apps/web/src/app/(dashboard)/songs/[id]/edit/page.tsx:25,41-44,68 |
| Commit | 8666155 |

## 2025-11-20
| Aspect | Value |
|--------|-------|
| Bug | TypeScript errors: Invalid Button component size/variant types - "default" and "premium" not valid |
| Fix | Replaced invalid types: size="default"→"md", variant="default"→"primary", variant="premium"→"primary" across 8 UI components. Updated type interfaces to only allow valid variants |
| Files | BulkActions.tsx, ConfirmDialog.tsx, DatePicker.tsx, EmptyState.tsx, ErrorDisplay.tsx, error-fallback.tsx, error-layout.tsx, session-warning.tsx |
| Commit | d1dfed5 |

| Aspect | Value |
|--------|-------|
| Bug | TypeScript error: Module '@/types/api' has no exported member 'ProfanityCheckResult' - type defined but not exported from barrel |
| Fix | Added ProfanityViolation and ProfanityCheckResult to type exports in index.ts. Types were defined in entities.ts but missing from central barrel export |
| File | apps/web/src/types/api/index.ts:25-26 |
| Commit | efd8e7c |

| Aspect | Value |
|--------|-------|
| Bug | TypeScript error: Axios headers type incompatible with getFilenameFromHeaders - expected Record<string, string> but got complex axios header type |
| Fix | Updated function signature to accept Record<string, string \| string[] \| undefined> \| any for axios compatibility |
| File | apps/web/src/lib/api/utils.ts:30 |
| Commit | efd8e7c |
