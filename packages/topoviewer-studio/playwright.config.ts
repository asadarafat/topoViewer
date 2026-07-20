import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  timeout: 30_000,
  fullyParallel: false,
  // Three workers keep Monaco-heavy authoring tests inside the 30-second contract on the 8-core reference runner.
  workers: 3,
  reporter: 'list',
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  use: {
    baseURL: 'http://127.0.0.1:5175',
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5175/__topoviewer-studio-test-marker.json',
    reuseExistingServer: true,
    timeout: 30_000
  }
});
