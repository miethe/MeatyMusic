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
