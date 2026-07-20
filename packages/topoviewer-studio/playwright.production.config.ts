import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/parity',
  testMatch: 'studio-golden-authoring.spec.ts',
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5177/',
    browserName: 'chromium',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    viewport: { height: 920, width: 1440 }
  },
  webServer: {
    command: 'npm run preview:performance',
    url: 'http://127.0.0.1:5177/',
    reuseExistingServer: false,
    timeout: 30_000
  }
});
