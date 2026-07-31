import { defineConfig } from '@playwright/test';

export default defineConfig({
  expect: { timeout: 8_000 },
  fullyParallel: false,
  reporter: 'line',
  testDir: './tests/golden',
  timeout: 45_000,
  use: {
    baseURL: 'http://127.0.0.1:5180',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run preview:golden',
    reuseExistingServer: false,
    timeout: 30_000,
    url: 'http://127.0.0.1:5180'
  }
});
