# Dashboard API Integration - Quick Reference

## What Was Done

Successfully replaced all placeholder content in the MeatyMusic dashboard with real API data using React Query hooks. The dashboard now displays live song counts, workflow statuses, recent activity, and library statistics.

---

## Key File Modified

```
/home/user/MeatyMusic/apps/web/src/app/(dashboard)/dashboard/page.tsx
```
**Lines**: 540 | **Type**: Client Component

---

## New Features

### 1. Real Metrics
- Total Songs count from API
- In Progress workflows count
- Completed workflows count
- Failed workflows count
- Success rate calculation

### 2. Recent Songs List
- Last 5 songs with creation time
- Status badges (draft, validated, rendering, rendered, failed)
- Links to song detail pages
- Empty state with CTA

### 3. Recent Activity Feed
- Last 5 workflow runs
- Status indicators with icons
- Current node display
- Links to workflow run details

### 4. Library Stats
- Entity counts for all 5 types
- Interactive links to entity pages
- Hover effects

### 5. Loading & Error States
- Skeleton loaders with shimmer
- Error fallback with retry
- Empty states with helpful messages

---

## API Hooks Used

```typescript
useSongs()              // Songs list
useWorkflowRuns()       // Workflow runs list
useStyles()             // Styles count
useLyricsList()         // Lyrics count
usePersonas()           // Personas count
useProducerNotesList()  // Producer notes count
useBlueprints()         // Blueprints count
```

---

## Dependencies Added

```json
{
  "date-fns": "^4.1.0"
}
```

---

## Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Start Services
```bash
# Terminal 1: Start backend
cd services/api
docker-compose up

# Terminal 2: Start frontend
cd apps/web
pnpm dev
```

### 3. View Dashboard
Navigate to: `http://localhost:3000/dashboard`

---

## Data Flow

```
Dashboard Component
    ↓
React Query Hooks (parallel fetching)
    ↓
API Client (/lib/api)
    ↓
FastAPI Backend
    ↓
PostgreSQL Database
```

---

## Key Components

### Internal Components (in page.tsx)
- `MetricCard` - Displays metrics with icon and trend
- `MetricCardSkeleton` - Loading state
- `SongListItem` - Individual song row
- `SongItemSkeleton` - Loading state
- `ActivityItem` - Workflow run row
- `ActivityItemSkeleton` - Loading state
- `EntityStatItem` - Library stat row
- `StatusItem` - System status indicator
- `StepCard` - Getting started step

### External Components Used
- `Button` from `@meatymusic/ui`
- `Card` from `@meatymusic/ui`
- `Skeleton` from `@meatymusic/ui`
- `LoadingErrorFallback` from `@meatymusic/ui`
- Icons from `lucide-react`

---

## Status Badge Colors

| Status | Color | Background |
|--------|-------|------------|
| draft | Gray | `bg-panel` |
| validated | Blue | `bg-info/10` |
| rendering | Orange | `bg-warning/10` |
| rendered | Green | `bg-success/10` |
| failed | Red | `bg-danger/10` |

| Workflow | Color | Icon |
|----------|-------|------|
| running | Blue | Clock |
| completed | Green | CheckCircle |
| failed | Red | AlertCircle |
| cancelled | Gray | AlertCircle |

---

## Responsive Breakpoints

| Breakpoint | Width | Metrics Layout | Main Layout |
|------------|-------|----------------|-------------|
| Mobile | < 768px | 1 column | Stacked |
| Tablet | 768px+ | 2 columns | Stacked |
| Desktop | 1024px+ | 4 columns | 2:1 split |

---

## Testing Commands

```bash
# Type check
cd apps/web
npx tsc --noEmit

# Lint
npm run lint

# Build
npm run build

# Run tests (if available)
npm test
```

---

## Common Issues & Solutions

### Issue: "Cannot find module '@meatymusic/ui'"
**Solution**: Build UI package first
```bash
pnpm --filter @meatymusic/ui build
```

### Issue: "date-fns not found"
**Solution**: Install dependencies
```bash
pnpm install
```

### Issue: Dashboard shows 0 for all metrics
**Solution**:
1. Check backend API is running
2. Verify database has data
3. Check browser console for errors
4. Verify API_URL environment variable

### Issue: Loading state never resolves
**Solution**:
1. Check network tab for failed requests
2. Verify API endpoints are correct
3. Check CORS settings
4. Check authentication

---

## API Endpoints Used

```
GET /api/v1/songs?limit=5&sort=created_at:desc
GET /api/v1/workflows/runs?limit=10&sort=created_at:desc
GET /api/v1/styles
GET /api/v1/lyrics
GET /api/v1/personas
GET /api/v1/producer-notes
GET /api/v1/blueprints
```

---

## Performance Optimizations

1. **Parallel Fetching**: All hooks run simultaneously
2. **Pagination**: Limited to 5-10 items per section
3. **Stale Time**: React Query caching configured
4. **No Over-fetching**: Only fetch needed fields
5. **Optimistic Rendering**: Show skeletons immediately

---

## Next Steps (Recommended)

### High Priority
1. Add WebSocket for real-time workflow updates
2. Implement health check API for system status
3. Add error boundary for better error handling
4. Add unit tests for components

### Medium Priority
1. Add trend charts for metrics
2. Add date range filters
3. Add dashboard customization
4. Improve mobile layout

### Low Priority
1. Add export functionality
2. Add dashboard widgets
3. Add user preferences
4. Add keyboard shortcuts

---

## Related Documentation

- **Integration Summary**: `/home/user/MeatyMusic/DASHBOARD_INTEGRATION_SUMMARY.md`
- **Code Examples**: `/home/user/MeatyMusic/DASHBOARD_CODE_EXAMPLES.md`
- **Visual Layout**: `/home/user/MeatyMusic/DASHBOARD_VISUAL_LAYOUT.md`
- **Testing Checklist**: `/home/user/MeatyMusic/DASHBOARD_INTEGRATION_CHECKLIST.md`

---

## Support

### TypeScript Types
All types imported from: `/home/user/MeatyMusic/apps/web/src/types/api.ts`

### API Hooks
Located in: `/home/user/MeatyMusic/apps/web/src/hooks/api/`

### UI Components
Package: `@meatymusic/ui`
Source: `/home/user/MeatyMusic/packages/ui/`

### Routes Config
File: `/home/user/MeatyMusic/apps/web/src/config/routes.ts`

---

## Screenshots Location

Screenshots should be taken of:
1. Dashboard with data (full view)
2. Metrics cards (close-up)
3. Recent songs section
4. Recent activity section
5. Library stats
6. Loading state
7. Empty state
8. Error state
9. Mobile view
10. Tablet view

Save screenshots to: `/home/user/MeatyMusic/docs/screenshots/dashboard/`

---

## Git Commit Message Template

```
feat(dashboard): integrate real API data

- Replace placeholder metrics with API data
- Add recent songs and activity sections
- Implement library stats with entity counts
- Add loading and error states
- Install date-fns for timestamp formatting

Files modified:
- apps/web/src/app/(dashboard)/dashboard/page.tsx

Dependencies added:
- date-fns@^4.1.0

Resolves: #[issue-number]
```

---

## Changelog Entry

```markdown
## [Unreleased]

### Added
- Real-time API data integration for dashboard
- Recent songs list with status badges
- Recent workflow activity feed
- Library statistics for all entity types
- Loading skeletons with shimmer animation
- Error fallback with retry functionality
- Empty states with helpful messages

### Changed
- Dashboard page now uses React Query hooks
- Metrics display real counts from database
- Timestamps show relative time (e.g., "2 hours ago")

### Dependencies
- Added date-fns@^4.1.0 for date formatting
```

---

**Created**: 2025-11-17
**Version**: 1.0.0
**Status**: ✅ Complete and Ready for Testing
