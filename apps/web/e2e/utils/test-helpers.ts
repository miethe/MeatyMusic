/**
 * Shared Test Helpers
 *
 * Common utilities for E2E tests to reduce boilerplate and improve reliability.
 * Phase 5, Task 5.1
 */

import { Page, expect } from '@playwright/test';

/**
 * Wait for page to be fully loaded and ready
 */
export async function waitForPageReady(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Get connection status text from the page
 */
export async function getConnectionStatus(page: Page): Promise<string> {
  const badge = page
    .getByRole('status')
    .filter({ hasText: /connected|connecting|reconnecting|disconnected/i });

  return (await badge.textContent()) || '';
}

/**
 * Get current workflow node name
 */
export async function getCurrentNode(page: Page): Promise<string> {
  const node = page
    .locator('[aria-label*="Current node"]')
    .or(page.locator('text=/Current.*:/'));

  return (await node.textContent()) || '';
}

/**
 * Get event count in event log
 */
export async function getEventCount(page: Page): Promise<number> {
  const events = page
    .locator('[role="log"] [role="listitem"]')
    .or(page.locator('.event-log-item'));

  return await events.count();
}

/**
 * Wait for workflow to reach a specific node
 */
export async function waitForNode(
  page: Page,
  nodeName: string,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 10000 } = options;

  await expect(page.getByText(new RegExp(nodeName, 'i')).first()).toBeVisible({
    timeout,
  });
}

/**
 * Wait for connection status to match a pattern
 */
export async function waitForConnectionStatus(
  page: Page,
  statusPattern: RegExp,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 5000 } = options;

  await expect(page.getByText(statusPattern).first()).toBeVisible({ timeout });
}

/**
 * Get all event log items as text array
 */
export async function getEventLogItems(page: Page): Promise<string[]> {
  const events = page
    .locator('[role="log"] [role="listitem"]')
    .or(page.locator('.event-log-item'));

  const count = await events.count();
  const items: string[] = [];

  for (let i = 0; i < count; i++) {
    const text = await events.nth(i).textContent();
    if (text) {
      items.push(text);
    }
  }

  return items;
}

/**
 * Check if an element is visible without throwing
 */
export async function isElementVisible(page: Page, selector: string): Promise<boolean> {
  try {
    const element = page.locator(selector);
    return await element.isVisible();
  } catch {
    return false;
  }
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(page: Page, selector: string): Promise<void> {
  await page.locator(selector).scrollIntoViewIfNeeded();
}

/**
 * Take a screenshot with a descriptive name
 */
export async function takeScreenshot(
  page: Page,
  name: string,
  options: { fullPage?: boolean } = {}
): Promise<void> {
  const { fullPage = false } = options;

  await page.screenshot({
    path: `test-results/screenshots/${name}-${Date.now()}.png`,
    fullPage,
  });
}

/**
 * Wait for a specific number of events to appear
 */
export async function waitForEventCount(
  page: Page,
  count: number,
  options: { timeout?: number; operator?: '>=' | '>' | '=' | '<' | '<=' } = {}
): Promise<void> {
  const { timeout = 10000, operator = '>=' } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const currentCount = await getEventCount(page);

    const condition =
      operator === '>='
        ? currentCount >= count
        : operator === '>'
          ? currentCount > count
          : operator === '='
            ? currentCount === count
            : operator === '<'
              ? currentCount < count
              : currentCount <= count;

    if (condition) {
      return;
    }

    await page.waitForTimeout(100);
  }

  throw new Error(
    `Timeout waiting for event count to be ${operator} ${count} (current: ${await getEventCount(page)})`
  );
}

/**
 * Get workflow progress percentage
 */
export async function getWorkflowProgress(page: Page): Promise<number> {
  const progressBar = page.locator('[role="progressbar"]');

  if ((await progressBar.count()) > 0) {
    const value = await progressBar.getAttribute('aria-valuenow');
    return value ? parseInt(value, 10) : 0;
  }

  // Try to find percentage text
  const percentageText = page.locator('text=/%/');
  if ((await percentageText.count()) > 0) {
    const text = await percentageText.first().textContent();
    const match = text?.match(/(\d+)%/);
    return match ? parseInt(match[1], 10) : 0;
  }

  return 0;
}

/**
 * Check if workflow is complete
 */
export async function isWorkflowComplete(page: Page): Promise<boolean> {
  const completedText = page.getByText(/completed|success|finished|done/i);
  return (await completedText.count()) > 0;
}

/**
 * Check if workflow failed
 */
export async function hasWorkflowFailed(page: Page): Promise<boolean> {
  const errorText = page.getByText(/error|fail/i);
  return (await errorText.count()) > 0;
}

/**
 * Get metrics from the page
 */
export async function getMetrics(page: Page): Promise<Record<string, number>> {
  const metrics: Record<string, number> = {};

  // Try to extract common metrics
  const metricsSection = page.locator('[class*="metrics"]').or(page.locator('text=/score|duration/i'));

  if ((await metricsSection.count()) > 0) {
    const text = await metricsSection.first().textContent();

    if (text) {
      // Parse metrics from text (e.g., "Score: 0.88", "Duration: 21s")
      const scoreMatch = text.match(/score[:\s]+(\d+\.?\d*)/i);
      if (scoreMatch) {
        metrics.score = parseFloat(scoreMatch[1]);
      }

      const durationMatch = text.match(/duration[:\s]+(\d+)/i);
      if (durationMatch) {
        metrics.duration = parseInt(durationMatch[1], 10);
      }
    }
  }

  return metrics;
}

/**
 * Simulate slow network conditions
 */
export async function simulateSlowNetwork(page: Page, delayMs: number = 100) {
  await page.route('**/*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.continue();
  });
}

/**
 * Clear all route mocks
 */
export async function clearRouteMocks(page: Page) {
  await page.unroute('**/*');
}

/**
 * Measure page load performance
 */
export async function measurePageLoad(page: Page): Promise<{
  domContentLoaded: number;
  load: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
}> {
  const performanceMetrics = await page.evaluate(() => {
    const timing = performance.timing;
    const paintEntries = performance.getEntriesByType('paint');

    return {
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      load: timing.loadEventEnd - timing.navigationStart,
      firstPaint: paintEntries.find((e) => e.name === 'first-paint')?.startTime,
      firstContentfulPaint: paintEntries.find((e) => e.name === 'first-contentful-paint')
        ?.startTime,
    };
  });

  return performanceMetrics;
}

/**
 * Get memory usage (Chrome only)
 */
export async function getMemoryUsage(page: Page): Promise<{
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
} | null> {
  return await page.evaluate(() => {
    // @ts-ignore - Chrome-specific
    if (performance.memory) {
      return {
        // @ts-ignore
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        // @ts-ignore
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        // @ts-ignore
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      };
    }
    return null;
  });
}

/**
 * Measure frame rate over a duration
 */
export async function measureFrameRate(
  page: Page,
  durationMs: number = 2000
): Promise<number> {
  return await page.evaluate((duration) => {
    return new Promise<number>((resolve) => {
      let frames = 0;
      const start = performance.now();

      const countFrames = () => {
        frames++;
        const elapsed = performance.now() - start;

        if (elapsed < duration) {
          requestAnimationFrame(countFrames);
        } else {
          const fps = (frames / elapsed) * 1000;
          resolve(fps);
        }
      };

      requestAnimationFrame(countFrames);
    });
  }, durationMs);
}

/**
 * Assert no console errors
 */
export async function assertNoConsoleErrors(page: Page) {
  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Wait a bit to collect errors
  await page.waitForTimeout(1000);

  expect(errors).toHaveLength(0);
}

/**
 * Print test context information
 */
export function logTestContext(context: {
  test: string;
  browser?: string;
  viewport?: { width: number; height: number };
}) {
  console.log('='.repeat(80));
  console.log(`Test: ${context.test}`);
  if (context.browser) {
    console.log(`Browser: ${context.browser}`);
  }
  if (context.viewport) {
    console.log(`Viewport: ${context.viewport.width}x${context.viewport.height}`);
  }
  console.log('='.repeat(80));
}
