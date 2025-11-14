# WP-N8: E2E Testing Suite
**Detailed Implementation Plan for Playwright Setup and User Journey Tests**

**Work Package**: WP-N8
**Status**: Ready for Implementation
**Duration**: 2 weeks | **Story Points**: 55
**Owner**: QA Automation Engineer
**Success Criteria**: All core user journeys tested, multi-tenant isolation verified

---

## Overview

E2E testing suite covers end-to-end user workflows from song creation through workflow execution and results viewing.

**Four Phases**:

1. **Playwright Infrastructure Setup** (13 story points)
   - Configuration for multiple browsers
   - Authentication fixtures
   - API mocking (optional, for speed)
   - Test data factories

2. **User Journey Tests** (21 story points)
   - Create song from scratch
   - Edit entities and re-run workflow
   - View workflow progress and results
   - Clone and iterate on existing song

3. **Edge Case & Stress Tests** (13 story points)
   - Network interruptions
   - Concurrent workflow executions
   - Large SDSs (20+ sections)
   - Error recovery scenarios

4. **CI/CD Integration** (8 story points)
   - GitHub Actions workflow
   - Test reporting and artifacts
   - Performance monitoring

---

## Detailed Task Breakdown

### Task N8.1: Playwright Infrastructure (13 story points)

#### N8.1.1: Playwright Configuration (3 story points)

**File**: `apps/web/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Optional: add Firefox, WebKit
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

**Configuration Features**:
- Retries: 2 on CI (handle flakiness)
- Parallel execution (but serialized in CI for auth)
- Screenshot/trace on failure
- HTML report generation
- Auto-startup of dev server

---

#### N8.1.2: Authentication Fixtures (4 story points)

**File**: `apps/web/e2e/fixtures/auth.ts`

**Goals**:
- Create reusable auth context
- Generate test users
- Handle JWT tokens
- Support multi-tenant isolation

**Implementation**:

```typescript
import { test as base, expect } from '@playwright/test'
import { APIRequestContext } from '@playwright/test'

type AuthContext = {
  token: string
  userId: string
  email: string
  tenantId: string
}

export const test = base.extend<{ auth: AuthContext }>({
  auth: async ({ page }, use) => {
    // Generate test user
    const email = `test-${Date.now()}@example.com`
    const testUser = await createTestUser(email)

    // Store token
    const authContext: AuthContext = {
      token: testUser.token,
      userId: testUser.id,
      email: testUser.email,
      tenantId: testUser.tenantId,
    }

    // Set auth state in browser
    await page.context().addCookies([
      {
        name: 'auth-token',
        value: testUser.token,
        domain: 'localhost',
        path: '/',
      }
    ])

    await use(authContext)

    // Cleanup
    await deleteTestUser(testUser.id)
  },
})

export { expect }

async function createTestUser(email: string) {
  // Mock Clerk user creation or use test endpoint
  // Return: { id, token, email, tenantId }
}

async function deleteTestUser(userId: string) {
  // Cleanup
}
```

**Multi-Tenant Isolation**:
- Each test gets unique user + tenant
- Tests isolated from each other
- Verify one tenant cannot access another's data

---

#### N8.1.3: Test Data Factories (3 story points)

**Files**: `apps/web/e2e/fixtures/data.ts`

**Goal**: Generate valid test data (SDS, styles, lyrics, etc.)

```typescript
export class TestDataFactory {
  constructor(private auth: AuthContext) {}

  async createSong(overrides?: Partial<SongInput>) {
    const song = {
      title: `Test Song ${Date.now()}`,
      description: 'Auto-generated test song',
      ...overrides,
    }
    return await api.createSong(song, { auth: this.auth })
  }

  async createStyle(overrides?: Partial<StyleInput>) {
    const style = {
      genre_detail: { primary: 'Pop' },
      tempo_bpm: 120,
      key: { primary: 'C major' },
      mood: ['upbeat'],
      tags: [],
      ...overrides,
    }
    return await api.createStyle(style, { auth: this.auth })
  }

  async createLyrics(overrides?: Partial<LyricsInput>) {
    const lyrics = {
      language: 'en',
      section_order: ['Verse', 'Chorus', 'Verse', 'Chorus'],
      pov: '1st',
      tense: 'present',
      ...overrides,
    }
    return await api.createLyrics(lyrics, { auth: this.auth })
  }

  // ... factories for other entities
}
```

**Usage in Tests**:
```typescript
test('create song and run workflow', async ({ page, auth }) => {
  const factory = new TestDataFactory(auth)
  const song = await factory.createSong({ title: 'My Test Song' })
  // ... proceed with test
})
```

---

#### N8.1.4: Base Test Fixtures (3 story points)

**File**: `apps/web/e2e/fixtures/index.ts`

**Features**:
- Reusable auth context
- Test data factory
- API client with auth
- Helper functions (wait for, click, fill, etc.)

```typescript
export { test, expect } from './auth'

// Re-export factories
export { TestDataFactory } from './data'

// Helper functions
export async function waitForWorkflowComplete(
  page: Page,
  runId: string,
  timeout: number = 60000
) {
  await page.waitForFunction(
    (id) => {
      const statusElement = document.querySelector(`[data-test="run-${id}-status"]`)
      return statusElement?.textContent === 'completed' || 'failed'
    },
    runId,
    { timeout }
  )
}

export async function fillEditor(page: Page, fieldLabel: string, value: string) {
  const input = page.locator(`label:has-text("${fieldLabel}") ~ input`)
  await input.fill(value)
}
```

---

### Task N8.2: User Journey Tests (21 story points)

**Core User Journeys** to test:

#### N8.2.1: Create Song Journey (7 story points)

**File**: `apps/web/e2e/workflows/create-song.spec.ts`

**Scenario**: User creates a new song from scratch

```typescript
import { test, expect } from '../fixtures'

test.describe('Create Song Journey', () => {
  test('create song with all entities', async ({ page, auth }) => {
    // Step 1: Navigate to dashboard
    await page.goto('/')
    await expect(page).toHaveTitle(/Dashboard/)

    // Step 2: Click "New Song"
    await page.click('button:has-text("New Song")')
    await page.waitForURL(/\/songs\/new/)

    // Step 3: Fill song details
    await page.fill('input[name="title"]', 'My Awesome Song')
    await page.fill('textarea[name="description"]', 'A song about testing')

    // Step 4: Select genre (Style)
    await page.click('text=Select Genre')
    await page.click('text=Pop')

    // Step 5: Set tempo range
    await page.fill('input[name="tempo_min"]', '120')
    await page.fill('input[name="tempo_max"]', '130')

    // Step 6: Add mood
    await page.click('text=Add Mood')
    await page.click('text=Upbeat')

    // Step 7: Navigate to Lyrics
    await page.click('button:has-text("Next: Lyrics")')

    // Step 8: Create lyrics sections
    await page.fill('textarea[name="verse_1"]', 'Verse lyrics here...')
    await page.fill('textarea[name="chorus"]', 'Chorus lyrics here...')

    // Step 9: Review and Submit
    await page.click('button:has-text("Next: Review")')
    await expect(page.locator('[data-test="sds-preview"]')).toBeVisible()

    // Step 10: Submit
    await page.click('button:has-text("Create Song")')

    // Verify success
    await expect(page).toHaveURL(/\/songs\/[a-f0-9-]+/)
    await expect(page.locator('text=Song created successfully')).toBeVisible()
  })

  test('validate required fields', async ({ page, auth }) => {
    await page.goto('/songs/new')

    // Try submit without title
    await page.click('button:has-text("Create Song")')

    // Should show validation error
    await expect(page.locator('text=Title is required')).toBeVisible()
  })

  test('auto-save draft', async ({ page, auth }) => {
    // Fill partial form
    await page.goto('/songs/new')
    await page.fill('input[name="title"]', 'Draft Song')

    // Wait for auto-save
    await page.waitForTimeout(2000)

    // Reload page
    await page.reload()

    // Title should be preserved
    await expect(page.locator('input[name="title"]')).toHaveValue('Draft Song')
  })
})
```

---

#### N8.2.2: Edit and Re-run Workflow (7 story points)

**File**: `apps/web/e2e/workflows/edit-entities.spec.ts`

**Scenario**: User edits song entities and re-runs workflow

```typescript
import { test, expect } from '../fixtures'

test.describe('Edit and Re-run Workflow', () => {
  test('edit style and re-run workflow', async ({ page, auth }) => {
    const factory = new TestDataFactory(auth)

    // Create initial song
    const song = await factory.createSong()
    const style = await factory.createStyle({ genre: 'Pop' })

    // Navigate to song
    await page.goto(`/songs/${song.id}`)

    // Click edit style
    await page.click('[data-test="edit-style"]')
    await page.waitForURL(/\/styles\/[a-f0-9-]+/)

    // Modify genre
    await page.click('text=Select Genre')
    await page.click('text=Rock')

    // Save
    await page.click('button:has-text("Save Style")')

    // Return to song
    await page.goBack()

    // Re-run workflow
    await page.click('button:has-text("Run Workflow")')

    // Workflow should execute with new style
    await expect(page.locator('[data-test="workflow-status"]')).toContainText('Running')
  })

  test('edit lyrics and update metrics', async ({ page, auth }) => {
    const factory = new TestDataFactory(auth)
    const song = await factory.createSong()

    await page.goto(`/songs/${song.id}`)

    // Edit lyrics
    await page.click('[data-test="edit-lyrics"]')

    // Modify verse
    const verseTextarea = page.locator('textarea[name="verse_1"]')
    await verseTextarea.clear()
    await verseTextarea.fill('Brand new verse with different syllable count...')

    // Save
    await page.click('button:has-text("Save Lyrics")')

    // Verify update
    await expect(page.locator('text=Lyrics updated')).toBeVisible()
  })
})
```

---

#### N8.2.3: Run Workflow and View Results (4 story points)

**File**: `apps/web/e2e/workflows/run-workflow.spec.ts`

**Scenario**: User launches workflow and monitors execution

```typescript
import { test, expect } from '../fixtures'

test.describe('Run Workflow', () => {
  test('launch workflow and monitor progress', async ({ page, auth }) => {
    const factory = new TestDataFactory(auth)
    const song = await factory.createSong()

    await page.goto(`/songs/${song.id}`)

    // Click "Generate"
    await page.click('button:has-text("Generate")')

    // Wait for run creation
    await page.waitForURL(/\/workflows\/[a-f0-9-]+/)

    // Monitor node progression
    // PLAN should complete first
    await expect(page.locator('[data-test="node-PLAN"]')).toHaveClass(/completed/)

    // STYLE should start
    await expect(page.locator('[data-test="node-STYLE"]')).toHaveClass(/running|completed/)

    // Wait for completion
    await page.waitForFunction(
      () => {
        const node = document.querySelector('[data-test="node-REVIEW"]')
        return node?.classList.contains('completed')
      },
      { timeout: 120000 }
    )

    // View results
    await expect(page.locator('[data-test="composed-prompt"]')).toBeVisible()
    await expect(page.locator('[data-test="validation-scores"]')).toBeVisible()
  })

  test('view artifacts and export', async ({ page, auth }) => {
    // Navigate to completed workflow
    const factory = new TestDataFactory(auth)
    const song = await factory.createSong()
    // (assume workflow already ran)

    await page.goto(`/songs/${song.id}/results`)

    // View artifacts
    await expect(page.locator('[data-test="style-artifact"]')).toBeVisible()
    await expect(page.locator('[data-test="lyrics-artifact"]')).toBeVisible()
    await expect(page.locator('[data-test="composed-prompt"]')).toBeVisible()

    // Copy prompt
    await page.click('button[data-test="copy-prompt"]')
    await expect(page.locator('text=Copied')).toBeVisible()

    // Download JSON
    const downloadPromise = page.waitForEvent('download')
    await page.click('button[data-test="download-json"]')
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('.json')
  })

  test('clone song for iteration', async ({ page, auth }) => {
    const factory = new TestDataFactory(auth)
    const song = await factory.createSong()

    await page.goto(`/songs/${song.id}`)

    // Click Clone
    await page.click('button:has-text("Clone Song")')

    // Verify new song created
    await page.waitForURL(/\/songs\/[a-f0-9-]+/)

    // Should have same entities as original
    await expect(page.locator('[data-test="song-title"]')).toContainText('Copy of')
  })
})
```

---

#### N8.2.4: Multi-Tenant Isolation (3 story points)

**File**: `apps/web/e2e/workflows/multi-tenant.spec.ts`

**Scenario**: Verify tenant isolation via E2E

```typescript
import { test, expect } from '../fixtures'

test.describe('Multi-Tenant Isolation', () => {
  test('tenant A cannot access tenant B songs', async ({ context }) => {
    // Create two test users (different tenants)
    const auth1 = await createTestAuth(context, 'user1@example.com')
    const auth2 = await createTestAuth(context, 'user2@example.com')

    // User 1 creates song
    const page1 = await context.newPage()
    const factory1 = new TestDataFactory(auth1)
    const song1 = await factory1.createSong({ title: 'User 1 Song' })

    // User 2 tries to access user 1's song (via URL)
    const page2 = await context.newPage()
    await page2.addInitEvent('load', () => {
      localStorage.setItem('auth-token', auth2.token)
    })

    await page2.goto(`/songs/${song1.id}`)

    // Should get 403 or redirect to dashboard
    await expect(page2).toHaveURL(/\/(dashboard|songs)/)
    await expect(page2.locator('text=Access Denied')).toBeVisible()
  })

  test('tenant A list contains only their songs', async ({ page, auth }) => {
    const factory = new TestDataFactory(auth)

    // Create 3 songs
    const songs = await Promise.all([
      factory.createSong({ title: 'Song 1' }),
      factory.createSong({ title: 'Song 2' }),
      factory.createSong({ title: 'Song 3' }),
    ])

    // List songs
    await page.goto('/songs')

    // Should see exactly 3 songs
    const songRows = page.locator('[data-test="song-row"]')
    await expect(songRows).toHaveCount(3)

    // Verify titles
    for (const song of songs) {
      await expect(page.locator(`text="${song.title}"`)).toBeVisible()
    }
  })
})
```

---

### Task N8.3: Edge Case Tests (13 story points)

#### N8.3.1: Network Interruption Handling (4 story points)

**File**: `apps/web/e2e/edge-cases/network-interruption.spec.ts`

```typescript
import { test, expect } from '../fixtures'

test.describe('Network Interruption Handling', () => {
  test('resume workflow after network reconnect', async ({ page, context }) => {
    const factory = new TestDataFactory(auth)
    const song = await factory.createSong()

    await page.goto(`/songs/${song.id}`)
    await page.click('button:has-text("Generate")')

    // Wait for PLAN to complete
    await page.waitForFunction(
      () => document.querySelector('[data-test="node-PLAN"]')?.classList.contains('completed'),
      { timeout: 30000 }
    )

    // Simulate offline
    await context.setOffline(true)

    // Wait some time
    await page.waitForTimeout(2000)

    // Go back online
    await context.setOffline(false)

    // Workflow should continue or recover
    await expect(page.locator('[data-test="connection-status"]')).toContainText('Connected')

    // Should eventually complete
    await page.waitForFunction(
      () => document.querySelector('[data-test="node-REVIEW"]')?.classList.contains('completed'),
      { timeout: 120000 }
    )
  })

  test('handle API timeout gracefully', async ({ page }) => {
    // Create slow API response mock
    const factory = new TestDataFactory(auth)
    const song = await factory.createSong()

    // Simulate slow network
    await page.route('**/api/v1/**', async (route) => {
      await new Promise(r => setTimeout(r, 5000)) // 5 second delay
      await route.continue()
    })

    await page.goto(`/songs/${song.id}`)

    // Should show loading indicator
    await expect(page.locator('[data-test="loading"]')).toBeVisible()

    // After 30 sec, should timeout
    await page.waitForTimeout(30000)

    // Should show error or retry
    await expect(page.locator('text=Connection Timeout|Try Again')).toBeVisible()
  })
})
```

---

#### N8.3.2: Concurrent Workflow Execution (4 story points)

**File**: `apps/web/e2e/edge-cases/concurrent-runs.spec.ts`

```typescript
import { test, expect } from '../fixtures'

test.describe('Concurrent Workflow Execution', () => {
  test('run multiple workflows simultaneously', async ({ page, auth }) => {
    const factory = new TestDataFactory(auth)

    // Create 3 songs
    const songs = await Promise.all([
      factory.createSong({ title: 'Song 1' }),
      factory.createSong({ title: 'Song 2' }),
      factory.createSong({ title: 'Song 3' }),
    ])

    // Start 3 workflows in parallel
    for (const song of songs) {
      const context = page.context()
      const newPage = await context.newPage()
      await newPage.goto(`/songs/${song.id}`)
      await newPage.click('button:has-text("Generate")')
    }

    // Monitor all workflows
    await page.goto('/workflows')

    // Should show 3 running workflows
    const workflowRows = page.locator('[data-test="workflow-row"]')
    await expect(workflowRows).toHaveCount(3)

    // Wait for all to complete
    await page.waitForFunction(
      () => {
        const rows = document.querySelectorAll('[data-test="workflow-row"]')
        return Array.from(rows).every(
          (row) => row.getAttribute('data-status') === 'completed'
        )
      },
      { timeout: 300000 } // 5 minutes
    )
  })
})
```

---

#### N8.3.3: Large SDS Handling (3 story points)

**File**: `apps/web/e2e/edge-cases/large-sds.spec.ts`

```typescript
import { test, expect } from '../fixtures'

test.describe('Large SDS Handling', () => {
  test('handle 20+ section song', async ({ page, auth }) => {
    const factory = new TestDataFactory(auth)

    // Create SDS with many sections
    const sds = await factory.createSong()
    const lyrics = await factory.createLyrics({
      section_order: [
        ...Array(5).fill('Verse'),
        ...Array(3).fill('Chorus'),
        ...Array(2).fill('Bridge'),
        'Outro'
      ]
    })

    await page.goto(`/songs/${sds.id}`)

    // Should render without performance issues
    await expect(page).toHaveTitle(/Song/)

    // Open lyrics editor
    await page.click('[data-test="edit-lyrics"]')

    // Should handle scrolling through many sections
    const sections = page.locator('[data-test="section-input"]')
    await expect(sections).toHaveCount(11) // 5 + 3 + 2 + 1

    // Should be able to scroll
    await page.evaluate(() => window.scrollBy(0, 1000))

    // Run workflow
    await page.goBack()
    await page.click('button:has-text("Generate")')

    // Workflow should complete despite size
    await page.waitForFunction(
      () => document.querySelector('[data-test="node-REVIEW"]')?.classList.contains('completed'),
      { timeout: 180000 }
    )
  })

  test('handle character limit warnings', async ({ page, auth }) => {
    const factory = new TestDataFactory(auth)
    const sds = await factory.createSong()

    // Create very long lyrics
    const longText = 'A'.repeat(5000)
    const lyrics = await factory.createLyrics({
      verse_1: longText
    })

    await page.goto(`/songs/${sds.id}`)
    await page.click('[data-test="edit-lyrics"]')

    // Should show character count warning
    await expect(page.locator('text=Character limit exceeded')).toBeVisible()
  })
})
```

---

#### N8.3.4: Error Recovery (2 story points)

**File**: `apps/web/e2e/edge-cases/error-recovery.spec.ts`

```typescript
import { test, expect } from '../fixtures'

test.describe('Error Recovery', () => {
  test('recover from validation failure', async ({ page, auth }) => {
    // Create song with problematic entities
    // (e.g., missing required fields in blueprint)

    await page.goto('/songs/new')

    // Fill minimal data
    await page.fill('input[name="title"]', 'Test Song')

    // Submit without proper style setup
    await page.click('button:has-text("Create Song")')

    // Should show validation error
    await expect(page.locator('text=Style is required')).toBeVisible()

    // Fix and retry
    await page.click('[data-test="edit-style"]')
    // ... fill style

    // Should submit successfully now
    await page.click('button:has-text("Create Song")')
  })

  test('retry failed workflow node', async ({ page, auth }) => {
    // Create song and run workflow
    // Mock failure in STYLE node

    await page.goto('/songs/123/workflow')

    // Should show failed node
    await expect(page.locator('[data-test="node-STYLE"][data-status="failed"]')).toBeVisible()

    // Click retry
    await page.click('button[data-test="retry-STYLE"]')

    // Should re-execute from that node
    await expect(page.locator('[data-test="node-STYLE"]')).toHaveClass(/running/)
  })
})
```

---

### Task N8.4: CI/CD Integration (8 story points)

#### N8.4.1: GitHub Actions Workflow (4 story points)

**File**: `.github/workflows/e2e-tests.yml`

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  e2e:
    timeout-minutes: 60
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: meatymusic_test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Start backend
        run: docker compose up -d api
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/meatymusic_test

      - name: Wait for backend
        run: |
          until curl -f http://localhost:8000/health; do
            sleep 1
          done
        timeout-minutes: 5

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          BASE_URL: http://localhost:3000
          API_URL: http://localhost:8000

      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

      - name: Publish test results
        if: always()
        uses: EnricoMi/publish-unit-test-result-action@v2
        with:
          files: |
            test-results/**/*.xml
          check_name: E2E Test Results
```

---

#### N8.4.2: Test Reporting & Monitoring (4 story points)

**Package.json Scripts**:
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:report": "playwright show-report"
  }
}
```

**Reporting Setup**:
- HTML report in `playwright-report/`
- JUnit XML for CI integration
- Screenshot/video on failure
- Trace files for debugging

**Performance Monitoring**:
- Track test execution time per run
- Alert if tests exceed time budget (30 min)
- Monitor flakiness (retry counts)

---

## Test Environment Configuration

### Required Environment Variables

```bash
# .env.test
BASE_URL=http://localhost:3000
API_URL=http://localhost:8000
DATABASE_URL=postgresql://postgres:test@localhost:5432/meatymusic_test
CLERK_SECRET_KEY=test_secret
CLERK_FRONTEND_API=test_api
```

### Local Development Setup

```bash
# Install Playwright
npm install -D @playwright/test

# Run tests locally
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run specific test file
npx playwright test e2e/workflows/create-song.spec.ts

# Debug single test
npx playwright test e2e/workflows/create-song.spec.ts --debug
```

---

## Acceptance Criteria

### For Each Test

- [ ] Test has clear, descriptive name
- [ ] Test setup creates necessary data
- [ ] All assertions are explicit
- [ ] Test cleans up after itself
- [ ] No hardcoded IDs or values
- [ ] Retry logic for async operations
- [ ] Reasonable timeout values

### Overall

- [ ] All smoke tests pass locally and in CI
- [ ] All journey tests pass
- [ ] Edge case coverage adequate
- [ ] Multi-tenant isolation verified
- [ ] No flaky tests (100% pass rate)
- [ ] Test execution < 30 minutes in CI
- [ ] HTML reports generated
- [ ] Documentation complete

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Smoke test pass rate | 100% |
| Journey test pass rate | 100% |
| Edge case coverage | 8/8 tests |
| CI execution time | < 30 min |
| Test flakiness | 0% (no retries) |
| Multi-tenant isolation | Verified |

---

## Timeline

**Week 1**:
- Day 1-2: Playwright setup + fixtures
- Day 3-5: User journey tests (create, run, view)

**Week 2**:
- Day 6-8: Edge case tests
- Day 9-10: CI/CD integration + flakiness fixes

---

## Dependencies & Next Steps

**Dependencies**:
- Backend API (ready)
- Frontend deployed (ready)
- Database (ready)

**Blockers**: None

**Next Steps**:
1. Set up Playwright infrastructure
2. Implement auth and data factories
3. Write journey tests
4. Add edge case tests
5. Integrate with CI/CD
6. Monitor and fix flaky tests

---

**Document Version**: 1.0
**Created**: 2025-11-14
**Status**: Ready for Implementation
