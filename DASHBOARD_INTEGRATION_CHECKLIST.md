# Dashboard API Integration - Testing Checklist

## Pre-Flight Checks

### Environment Setup
- [ ] Backend API is running on `http://localhost:8000`
- [ ] Frontend dev server is running on `http://localhost:3000`
- [ ] Database has been migrated and seeded
- [ ] Redis is running for caching
- [ ] All environment variables are set

### Dependencies Verification
```bash
# Check if date-fns is installed
grep "date-fns" apps/web/package.json

# Verify React Query is configured
grep "@tanstack/react-query" apps/web/package.json

# Check UI components are available
ls packages/ui/dist/components/Skeleton
```

---

## Functional Testing

### 1. Initial Load
- [ ] Dashboard loads without console errors
- [ ] Loading skeletons appear briefly
- [ ] Metrics cards populate with real data
- [ ] Page transitions are smooth

### 2. Metrics Cards
- [ ] **Total Songs** displays correct count
- [ ] **In Progress** shows running workflow count
- [ ] **Completed** shows completed workflow count
- [ ] **Failed** shows failed workflow count
- [ ] Success rate calculation is accurate (completed / total)
- [ ] Icons render correctly
- [ ] Hover effects work on metric cards

### 3. Recent Songs List
- [ ] Shows up to 5 most recent songs
- [ ] Song titles display correctly
- [ ] Timestamps show relative time (e.g., "2 hours ago")
- [ ] Status badges show correct colors:
  - [ ] Draft = Gray
  - [ ] Validated = Blue
  - [ ] Rendering = Yellow/Orange
  - [ ] Rendered = Green
  - [ ] Failed = Red
- [ ] Clicking a song navigates to detail page
- [ ] Hover effect changes background
- [ ] Empty state shows when no songs exist
- [ ] "View All" button links to songs list page

### 4. Recent Activity Section
- [ ] Shows up to 5 most recent workflow runs
- [ ] Status badges display correctly:
  - [ ] Running = Blue with Clock icon
  - [ ] Completed = Green with CheckCircle icon
  - [ ] Failed = Red with AlertCircle icon
  - [ ] Cancelled = Gray with AlertCircle icon
- [ ] Current node displays (e.g., "STYLE node")
- [ ] Timestamps show relative time
- [ ] Clicking activity item navigates to workflow run detail
- [ ] Empty message shows when no activity exists

### 5. Library Stats Section
- [ ] Styles count is accurate
- [ ] Lyrics count is accurate
- [ ] Personas count is accurate
- [ ] Producer Notes count is accurate
- [ ] Blueprints count is accurate
- [ ] Icons render for each entity type
- [ ] Clicking stat navigates to entity list page
- [ ] Hover effect changes text to primary color

### 6. Quick Actions
- [ ] All buttons render correctly
- [ ] "New Song" button links to song creation page
- [ ] "Browse Styles" links to styles list
- [ ] "Browse Lyrics" links to lyrics list
- [ ] "Browse Personas" links to personas list
- [ ] Hover effects work on all buttons

### 7. System Status
- [ ] API status shows "Operational"
- [ ] Workflow Engine status shows "Operational"
- [ ] Database status shows "Operational"
- [ ] Status indicators use correct colors

### 8. Getting Started Section
- [ ] All 3 step cards display
- [ ] Text is readable and correct
- [ ] Section remains at bottom of page

---

## Edge Cases & Error Handling

### Loading States
- [ ] Skeleton loaders appear during initial load
- [ ] Skeleton loaders have shimmer animation
- [ ] Loading state doesn't flash if data loads quickly
- [ ] Multiple skeleton rows show for list items

### Empty States
- [ ] Empty song state shows correct icon and message
- [ ] "Create Your First Song" button appears
- [ ] Empty activity message shows when no workflows
- [ ] Entity counts show 0 when no items exist

### Error States
- [ ] Error fallback displays if songs API fails
- [ ] Error message is clear and actionable
- [ ] Retry button works and refetches data
- [ ] Other sections still load if one API fails
- [ ] Console shows helpful error details (dev mode)

### Data Edge Cases
- [ ] Works with 0 songs
- [ ] Works with 1 song
- [ ] Works with 100+ songs (pagination)
- [ ] Handles songs with very long titles (truncation)
- [ ] Handles workflows with no current_node
- [ ] Handles workflows with missing timestamps
- [ ] Success rate handles division by zero
- [ ] All null/undefined values have fallbacks

---

## Performance Testing

### Load Time
- [ ] Dashboard loads in < 2 seconds (empty DB)
- [ ] Dashboard loads in < 3 seconds (100 songs)
- [ ] No unnecessary API calls on mount
- [ ] React Query caches data properly

### Network Efficiency
- [ ] All entity API calls happen in parallel
- [ ] No duplicate requests on initial load
- [ ] Pagination limits work (5 songs, 10 workflows)
- [ ] Data doesn't refetch unnecessarily

### Rendering Performance
- [ ] No layout shifts during loading
- [ ] Smooth animations (60fps)
- [ ] No janky scrolling
- [ ] Hover effects are instant

---

## Responsive Design Testing

### Mobile (375px)
- [ ] Metrics stack vertically (1 column)
- [ ] Songs list is full width
- [ ] Sidebar sections stack below main content
- [ ] All text is readable
- [ ] Touch targets are at least 44x44px
- [ ] No horizontal scrolling

### Tablet (768px)
- [ ] Metrics show 2 columns
- [ ] Layout is balanced
- [ ] Cards have appropriate spacing

### Desktop (1280px+)
- [ ] Metrics show 4 columns
- [ ] Songs section is 2/3 width
- [ ] Sidebar is 1/3 width
- [ ] Content doesn't stretch too wide
- [ ] Max width container works

---

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab key cycles through all interactive elements
- [ ] Enter key activates links and buttons
- [ ] Focus indicators are visible
- [ ] No keyboard traps

### Screen Readers
- [ ] Page title is read correctly
- [ ] Section headings are announced
- [ ] Status badges include text, not just color
- [ ] Links have descriptive text
- [ ] Buttons have clear labels

### Color Contrast
- [ ] All text meets WCAG AA contrast (4.5:1)
- [ ] Status badges are distinguishable
- [ ] Icons are visible against backgrounds
- [ ] Focus indicators have sufficient contrast

### Motion
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Loading states don't flicker
- [ ] Transitions are smooth but not distracting

---

## Integration Testing

### With Other Pages
- [ ] Navigate from dashboard to song detail
- [ ] Navigate from dashboard to workflow run detail
- [ ] Navigate from dashboard to entity list pages
- [ ] Navigate from dashboard to song creation
- [ ] Navigate back to dashboard (data refreshes)

### With Real Data Flow
- [ ] Create a new song → appears in Recent Songs
- [ ] Start a workflow → appears in Recent Activity
- [ ] Complete a workflow → metrics update
- [ ] Fail a workflow → Failed count increases
- [ ] Delete a song → Total Songs decreases

### With Authentication
- [ ] Dashboard loads for authenticated users
- [ ] Dashboard redirects if not authenticated
- [ ] Data is filtered by tenant_id
- [ ] No cross-tenant data leakage

---

## Browser Testing

### Modern Browsers
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS 14+)
- [ ] Chrome Mobile (Android)

### Features to Verify
- [ ] CSS Grid layout works
- [ ] Flexbox works
- [ ] CSS animations work
- [ ] date-fns formatting works
- [ ] Icons render correctly
- [ ] Font loading works

---

## Code Quality Checks

### TypeScript
```bash
# Run TypeScript check
cd apps/web
npx tsc --noEmit
```
- [ ] No TypeScript errors
- [ ] All imports resolve
- [ ] Types are correctly inferred

### ESLint
```bash
# Run linter
cd apps/web
npm run lint
```
- [ ] No linting errors
- [ ] No unused variables
- [ ] No console.log statements (except dev)

### Build
```bash
# Production build
cd apps/web
npm run build
```
- [ ] Build succeeds
- [ ] No build warnings
- [ ] Bundle size is reasonable

---

## Documentation Review

- [ ] Code is well-commented
- [ ] Component props have JSDoc comments
- [ ] Complex logic has explanatory comments
- [ ] README is updated (if needed)
- [ ] Integration summary is accurate

---

## Deployment Checklist

### Pre-Deploy
- [ ] All tests pass
- [ ] No console errors in dev mode
- [ ] Environment variables are documented
- [ ] API endpoints are correct
- [ ] Feature flags are set correctly

### Post-Deploy
- [ ] Verify dashboard loads in production
- [ ] Check performance in production
- [ ] Monitor error logs for issues
- [ ] Verify analytics are tracking
- [ ] Test on real devices

---

## Known Issues & Limitations

### Current Limitations
1. System Status is hardcoded (no health check API)
2. Success rate only uses workflows from current page
3. No real-time updates (requires manual refresh)
4. No time range filters (shows all-time data)

### Future Enhancements
1. Add WebSocket for real-time updates
2. Add charts for trends over time
3. Add filters for date ranges
4. Add search functionality
5. Add export to CSV/PDF
6. Add customizable dashboard widgets

---

## Regression Testing (After Changes)

If any of these files change, re-test the dashboard:
- [ ] `apps/web/src/hooks/api/useSongs.ts`
- [ ] `apps/web/src/hooks/api/useWorkflows.ts`
- [ ] `apps/web/src/types/api/entities.ts`
- [ ] `apps/web/src/types/api/workflows.ts`
- [ ] `apps/web/src/lib/api/songs.ts`
- [ ] `apps/web/src/lib/api/workflows.ts`
- [ ] Backend API endpoints (`/api/v1/songs`, `/api/v1/workflows`)

---

## Performance Benchmarks

### Target Metrics
- [ ] First Contentful Paint < 1.8s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3.9s
- [ ] Cumulative Layout Shift < 0.1
- [ ] First Input Delay < 100ms

### Lighthouse Scores (Target)
- [ ] Performance: > 90
- [ ] Accessibility: > 95
- [ ] Best Practices: > 90
- [ ] SEO: > 90

---

## Sign-Off

### Developer Checklist
- [ ] Code reviewed
- [ ] Tests written (if applicable)
- [ ] Documentation updated
- [ ] Changes logged in CHANGELOG (if applicable)

### QA Checklist
- [ ] Functional testing complete
- [ ] Edge cases tested
- [ ] Responsive design verified
- [ ] Accessibility verified

### Product Owner Checklist
- [ ] Requirements met
- [ ] User experience is acceptable
- [ ] Performance is acceptable
- [ ] Ready for production

---

**Version**: 1.0.0
**Status**: Ready for Testing
**Date**: 2025-11-17
**Tested By**: ________________
**Approved By**: ________________
