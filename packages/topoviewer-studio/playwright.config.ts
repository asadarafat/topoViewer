import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  timeout: 45_000,
  fullyParallel: false,
  // Two workers avoid Monaco/Chromium swap contention on the 8-core reference runner.
  workers: 2,
  reporter: 'list',
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  use: {
    baseURL: 'http://127.0.0.1:5177/',
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'npm run preview:performance',
    url: 'http://127.0.0.1:5177/',
    reuseExistingServer: false,
    timeout: 30_000
  }
});
