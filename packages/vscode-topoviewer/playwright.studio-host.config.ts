import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/studio-host',
  timeout: 45_000,
  reporter: [['list']],
  webServer: {
    command: 'npm run vscode:studio-host',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: 'http://127.0.0.1:5176/src/studio-test-host/'
  },
  use: {
    baseURL: 'http://127.0.0.1:5176/src/studio-test-host/',
    browserName: 'chromium',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    viewport: { width: 1440, height: 920 }
  }
});
