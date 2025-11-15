/**
 * Playwright Global Setup
 *
 * Runs once before all tests.
 * Use for environment setup, database seeding, etc.
 *
 * Phase 5, Task 5.4
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test suite setup...');

  // Create screenshots directory if it doesn't exist
  const fs = require('fs');
  const path = require('path');

  const screenshotsDir = path.join(__dirname, '../test-results/screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('✅ E2E test suite setup complete');
}

export default globalSetup;
