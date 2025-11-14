# Bug Fixes: November 2025

## 2025-11-14
| Aspect | Value |
|--------|-------|
| Bug | TypeScript error: Property 'workflow' does not exist on type 'Song' |
| Fix | Removed conditional check for song.workflow, always show empty state |
| File | apps/web/src/app/(dashboard)/songs/[id]/page.tsx:232 |
| Commit | d848e14 |
