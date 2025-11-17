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
| Commit | Pending |
