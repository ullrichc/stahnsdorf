import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local for Firebase credentials
dotenv.config({ path: resolve(__dirname, '.env.local') });

// CRITICAL: Force emulator mode so Playwright never hits the live backend
process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = 'true';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1, // Sequential: Firebase Emulator has global state
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000', // No basePath in dev mode
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
