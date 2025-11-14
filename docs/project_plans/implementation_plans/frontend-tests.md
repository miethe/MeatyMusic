# WP-N7: Frontend Testing Expansion
**Detailed Implementation Plan for Entity Editors, API Client, and Page Tests**

**Work Package**: WP-N7
**Status**: Ready for Implementation
**Duration**: 2 weeks | **Story Points**: 55
**Owner**: Frontend Developer + QA Automation Engineer
**Success Criteria**: ≥70% coverage across all tested modules

---

## Overview

Frontend testing expansion covers three distinct areas:

1. **Entity Editor Unit Tests** (21 story points)
   - StyleEditor, LyricsEditor, PersonaEditor, ProducerNotesEditor, SourceEditor, BlueprintEditor
   - Form validation, submission, error handling
   - Accessibility and keyboard navigation

2. **API Client Tests** (13 story points)
   - Mock API responses for all entity operations
   - Error handling and retry logic
   - Authentication and authorization

3. **Page Integration Tests** (13 story points)
   - Dashboard, Songs list, Workflow page
   - Navigation flows and data loading states
   - Multi-component integration

4. **Coverage Analysis & Gaps** (8 story points)
   - Coverage reporting
   - Gap identification
   - Missing test scenarios

**Target Coverage**: ≥70% overall (up from 30%)

---

## Detailed Task Breakdown

### Task N7.1: Entity Editor Unit Tests (21 story points)

**Scope**: Unit tests for all entity editor components

#### N7.1.1: StyleEditor Tests (3 story points)
**File**: `apps/web/src/components/editors/__tests__/StyleEditor.test.tsx`

**Scenarios to Test**:
1. **Happy Path**
   - Render editor with empty form
   - Fill in all fields (genre, tempo range, key, mood, energy, tags, instrumentation)
   - Submit form successfully
   - Verify data shape matches schema

2. **Validation**
   - Tempo range validation (min ≤ max)
   - Energy vs tempo conflict detection (e.g., slow + high energy)
   - Tag conflict matrix enforcement
   - Required field validation (genre, tempo, key)
   - Max instrumentation (3 items)

3. **UI Interactions**
   - Multi-select chips for mood, instrumentation, tags
   - Slider for tempo range (both handles)
   - Dropdown for genre and energy
   - Real-time JSON preview
   - Form reset

4. **Error Handling**
   - API error on submission (show error message)
   - Network timeout
   - Validation error display

5. **Accessibility**
   - Tab navigation through all fields
   - ARIA labels on sliders and selects
   - Error messages associated with fields
   - Keyboard-only form completion

**Test File Structure**:
```typescript
describe('StyleEditor', () => {
  describe('rendering', () => {
    it('renders empty form initially')
    it('renders with initial data')
  })

  describe('validation', () => {
    it('validates tempo range')
    it('detects energy vs tempo conflict')
    it('enforces tag conflict matrix')
    it('validates required fields')
  })

  describe('interactions', () => {
    it('updates form on input change')
    it('submits valid form')
    it('shows validation errors')
  })

  describe('accessibility', () => {
    it('has proper ARIA labels')
    it('supports keyboard navigation')
    it('associates errors with fields')
  })
})
```

---

#### N7.1.2: LyricsEditor Tests (3 story points)
**File**: `apps/web/src/components/editors/__tests__/LyricsEditor.test.tsx`

**Scenarios to Test**:
1. **Form Rendering**
   - Section order editor (Verse, Chorus, Bridge)
   - Lyric text areas per section
   - Collapsible advanced options
   - Source citation selector

2. **Section Management**
   - Add new section
   - Remove section (except chorus)
   - Reorder sections
   - Verify at least one chorus required

3. **Validation**
   - Section order contains at least one Chorus
   - Syllable counting per line (highlight deviations)
   - Hook strategy vs chorus count
   - Profanity flagging if explicit=false
   - Max lines constraint

4. **Source Integration**
   - Select sources with checkboxes
   - Weight distribution (0-1.0, normalized)
   - Add/remove sources
   - Display weight validation

5. **Advanced Features**
   - Rhyme scheme input
   - POV, tense dropdowns
   - Imagery density slider
   - Hook strategy selection

**Key Test Patterns**:
```typescript
describe('LyricsEditor', () => {
  describe('section management', () => {
    it('requires at least one Chorus')
    it('allows adding/removing sections')
    it('validates hook strategy vs chorus count')
  })

  describe('syllable counting', () => {
    it('counts syllables per line')
    it('highlights deviations from target')
  })

  describe('sources', () => {
    it('loads available sources')
    it('normalizes weights to 1.0')
    it('validates source selection')
  })
})
```

---

#### N7.1.3: PersonaEditor Tests (2 story points)
**File**: `apps/web/src/components/editors/__tests__/PersonaEditor.test.tsx`

**Test Coverage**:
- Name and kind (artist/band) inputs
- Voice description textarea
- Vocal range dropdown
- Delivery style chips (multi-select)
- Influences autocomplete (with living artist warning)
- Policy toggles (public_release, disallow_named_style_of)
- Form submission and validation
- Accessibility (tab order, ARIA labels)

---

#### N7.1.4: ProducerNotesEditor Tests (2 story points)
**File**: `apps/web/src/components/editors/__tests__/ProducerNotesEditor.test.tsx`

**Test Coverage**:
- Structure editor (reorderable section list)
- Hooks count input
- Per-section tags and duration inputs
- Section alignment warnings
- Mix settings (LUFS, reverb, stereo width)
- Template loading (ABAB, ABABCBB)
- Form validation and submission

---

#### N7.1.5: SourceEditor Tests (2 story points)
**File**: `apps/web/src/components/editors/__tests__/SourceEditor.test.tsx`

**Test Coverage**:
- Source kind selection (file, web, API)
- Config input (file path, base URL, auth token)
- Scopes multi-select
- Weight slider (0-1.0)
- Allow/deny lists with conflict detection
- Provenance toggle
- MCP server selector
- Form submission

---

#### N7.1.6: BlueprintEditor Tests (2 story points)
**File**: `apps/web/src/components/editors/__tests__/BlueprintEditor.test.tsx`

**Test Coverage**:
- Genre and version inputs
- Rules section (tempo range, required sections, banned terms, lexicon)
- Rubric section (weight sliders normalizing to 1.0, threshold inputs)
- Section line count guidance
- Preview charts
- Blueprint validation

---

### Task N7.2: API Client Tests (13 story points)

**Scope**: Tests for API client methods (mock responses, error handling, retries)

#### N7.2.1: API Client Infrastructure (3 story points)
**File**: `apps/web/src/lib/api/__tests__/client.test.ts`

**Test Setup**:
1. **Mock API Server**
   - Use MSW (Mock Service Worker) or jest.mock
   - Mock all endpoints (songs, styles, lyrics, personas, etc.)
   - Mock error responses (400, 401, 404, 500)

2. **Authentication**
   - Mock JWT tokens
   - Test auth interceptor
   - Test 401 handling (redirect to login)

3. **Error Handling**
   - Network errors
   - Timeout handling
   - Error response formatting
   - Retry logic (exponential backoff)

**Test Patterns**:
```typescript
describe('API Client', () => {
  beforeEach(() => {
    // Setup MSW mocks
  })

  describe('authentication', () => {
    it('includes JWT in Authorization header')
    it('refreshes token on 401')
    it('redirects to login on auth failure')
  })

  describe('error handling', () => {
    it('handles network errors gracefully')
    it('retries on transient errors')
    it('formats error responses')
  })
})
```

---

#### N7.2.2: Entity-Specific API Tests (10 story points)
Create parallel test files for each entity:

**N7.2.2a**: Songs API Tests (2 story points)
- POST `/songs` (create)
- GET `/songs/{id}` (retrieve)
- PUT `/songs/{id}` (update)
- GET `/songs` (list with pagination)
- POST `/songs/{id}/runs` (launch workflow)

**N7.2.2b**: Styles API Tests (2 story points)
- POST, GET, PUT, DELETE `/styles`
- List with filters (genre, mood)
- Pagination handling

**N7.2.2c**: Lyrics API Tests (2 story points)
- POST, GET, PUT, DELETE `/lyrics`
- Section validation
- Profanity check validation

**N7.2.2d**: Personas API Tests (1 story points)
- Full CRUD operations
- Living artist name normalization

**N7.2.2e**: Other Entities (ProducerNotes, Sources, Blueprints) (3 story points)
- CRUD tests for each
- Error response handling

**Mock Response Structure**:
```typescript
// apps/web/src/__tests__/fixtures/api-responses.ts
export const mockStyleResponse = {
  id: 'style-123',
  genre_detail: { primary: 'Pop' },
  tempo_bpm: [120, 130],
  // ... full schema
}

export const mockErrorResponse = {
  errors: [
    { code: 'VALIDATION_ERROR', message: 'Invalid tempo range' }
  ]
}
```

---

### Task N7.3: Page Integration Tests (13 story points)

**Scope**: Component-level tests for page routes

#### N7.3.1: Dashboard Page Tests (4 story points)
**File**: `apps/web/app/__tests__/dashboard.test.tsx`

**Test Scenarios**:
1. **Initial Load**
   - Fetch recent songs
   - Fetch pending jobs
   - Display quick action buttons

2. **Song List Display**
   - Render song cards
   - Show creation date, last modified
   - Click to navigate to song

3. **Pending Jobs**
   - Show workflow status
   - Update in real-time (mock WebSocket)
   - Cancel button functionality

4. **Quick Actions**
   - "New Song" button (navigate)
   - "View All Songs" button
   - Workflow launching from cards

5. **Loading States**
   - Skeleton loaders while fetching
   - Empty state when no songs
   - Error state on API failure

---

#### N7.3.2: Songs Page Tests (5 story points)
**File**: `apps/web/app/__tests__/songs.test.tsx`

**Test Scenarios**:
1. **Song List**
   - List all songs with pagination
   - Filter by genre, creation date
   - Sort by name, date, status
   - Search functionality

2. **Song Details**
   - Fetch song by ID
   - Display SDS summary
   - Show all entities (style, lyrics, personas)

3. **Edit Workflow**
   - Click to edit entity
   - Open entity editor modal
   - Submit changes
   - Verify list updates

4. **Create Song**
   - Click "New Song"
   - Multi-step form navigation
   - Preview SDS
   - Submit to create

5. **Delete Song**
   - Confirm dialog appears
   - Delete on confirm
   - List updates
   - Show success toast

---

#### N7.3.3: Workflow Page Tests (4 story points)
**File**: `apps/web/app/__tests__/workflows.test.tsx`

**Test Scenarios**:
1. **Workflow Visualization**
   - Render workflow graph (PLAN → REVIEW)
   - Show node status (pending, running, complete, failed)
   - Display durations

2. **Real-Time Updates** (mock WebSocket)
   - Node completes → status updates
   - Progress bar advances
   - Event log appends

3. **Artifacts Panel**
   - Display generated prompts
   - Show validation scores
   - Copy-to-clipboard buttons
   - Expandable sections

4. **Controls**
   - Retry failed node
   - Cancel running workflow
   - Download artifacts

---

### Task N7.4: Coverage Analysis & Gaps (8 story points)

#### N7.4.1: Coverage Reporting (3 story points)

**Setup**:
```bash
# In vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['apps/web/src/components', 'apps/web/src/lib/api'],
      exclude: ['**/*.test.ts', '**/__tests__'],
      lines: 70,
      statements: 70,
      functions: 70,
      branches: 70
    }
  }
})
```

**Report Generation**:
- Run: `npm run test:coverage` in `apps/web`
- Output: `coverage/` directory
- CI check: Enforce minimum 70%

---

#### N7.4.2: Gap Identification (3 story points)

**Process**:
1. Run coverage report
2. Identify files <70% coverage
3. List uncovered branches/lines
4. Prioritize by component criticality
5. Add tests for gaps

**Gap Categories**:
- Form validation edge cases
- Error scenarios
- Accessibility features
- Advanced options (hidden by default)

---

#### N7.4.3: Documentation (2 story points)

**Create**: `apps/web/TESTING.md`

**Contents**:
- How to run tests (`npm test`)
- How to run with coverage (`npm run test:coverage`)
- Test file organization
- How to add new tests
- Mocking patterns
- Common test utilities

---

## Test Infrastructure Setup

### Fixtures & Mocks

**Create**: `apps/web/src/__tests__/`

```
__tests__/
├── fixtures/
│   ├── api-responses.ts    # Mock API data
│   ├── sds-sample.json     # Sample SDS
│   ├── styles-data.ts      # Style test data
│   ├── lyrics-data.ts      # Lyrics test data
│   └── personas-data.ts    # Persona test data
├── mocks/
│   ├── msw-handlers.ts     # MSW route handlers
│   └── auth.ts             # Auth mocks
└── setup.ts                # Global test config
```

**Example Mock Setup**:
```typescript
// apps/web/src/__tests__/mocks/msw-handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/v1/styles/:id', async ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      genre_detail: { primary: 'Pop' },
      // ... full response
    })
  }),

  http.post('/api/v1/styles', async ({ request }) => {
    return HttpResponse.json({ id: 'new-style-id' }, { status: 201 })
  }),

  // ... other routes
]
```

### Test Utilities

**Create**: `apps/web/src/__tests__/utils.ts`

```typescript
// Helper for rendering components with providers
export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={testQueryClient}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    ),
    ...options,
  })
}

// Helper for waiting on API calls
export async function waitForApiCall(
  method: string,
  url: string,
  timeout: number = 1000
) {
  // Implementation
}
```

---

## Acceptance Criteria

### For Each Entity Editor Test

- [ ] Happy path test passing
- [ ] All form fields have tests
- [ ] Validation rules tested
- [ ] Error cases covered
- [ ] Accessibility checks passing
- [ ] ≥80% coverage for component

### For API Client Tests

- [ ] All CRUD operations tested
- [ ] Error responses handled
- [ ] Auth interceptor working
- [ ] Retry logic validated
- [ ] ≥80% API client coverage

### For Page Tests

- [ ] Component renders without errors
- [ ] User interactions work
- [ ] Data flows correctly
- [ ] Navigation works
- [ ] Loading/error states display
- [ ] ≥70% page coverage

### Overall

- [ ] Frontend coverage ≥70% across all tested modules
- [ ] All tests passing locally (`npm test`)
- [ ] All tests passing in CI (GitHub Actions)
- [ ] Coverage report generated
- [ ] Documentation complete

---

## Implementation Timeline

### Week 1 (Days 1-5): Editor Tests

**Day 1-2**: StyleEditor + LyricsEditor tests
- Set up test infrastructure
- Create mocks and fixtures
- Write StyleEditor tests
- Write LyricsEditor tests

**Day 3**: PersonaEditor + ProducerNotesEditor tests

**Day 4**: SourceEditor + BlueprintEditor tests

**Day 5**: API client infrastructure setup
- Create MSW handlers
- Set up auth mocks
- Create test fixtures

### Week 2 (Days 6-10): API + Page Tests

**Day 6-7**: Entity-specific API tests
- Songs, Styles, Lyrics API tests
- Personas, ProducerNotes, Sources tests

**Day 8-9**: Page integration tests
- Dashboard, Songs, Workflow pages

**Day 10**: Coverage analysis + gap filling
- Generate coverage report
- Identify and test gaps
- Documentation

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|---|
| Frontend coverage | ≥70% | `npm run test:coverage` |
| Entity editor tests | 6/6 | All test files exist and pass |
| API client coverage | ≥80% | Coverage report for api/ directory |
| Page tests | 3/3 | Dashboard, Songs, Workflow tests pass |
| Test pass rate | 100% | All tests passing in CI |
| Test execution time | <30 sec | `npm test` completes in CI |

---

## Dependencies & Blockers

**Dependencies**:
- React Testing Library (already in use)
- Vitest (already configured)
- MSW (need to add if not present)

**Blockers**: None — all infrastructure ready

**Related Tickets**:
- WP-N8 (E2E tests can run in parallel)
- WP-N9 (Can run after N7 completes)

---

## Next Steps

1. Set up test infrastructure (fixtures, mocks, utilities)
2. Implement editor tests (N7.1)
3. Implement API client tests (N7.2)
4. Implement page tests (N7.3)
5. Run coverage analysis and fill gaps (N7.4)
6. Generate final coverage report
7. Document test patterns for team

---

**Document Version**: 1.0
**Created**: 2025-11-14
**Status**: Ready for Implementation
