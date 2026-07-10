import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/parity',
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
    { name: 'chromium-narrow', use: { browserName: 'chromium', viewport: { height: 1024, width: 768 } } }
  ],
  use: {
    baseURL: 'http://127.0.0.1:5175',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    viewport: { height: 920, width: 1440 }
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5175/__topoviewer-studio-test-marker.json',
    reuseExistingServer: true,
    timeout: 30_000
  }
});
