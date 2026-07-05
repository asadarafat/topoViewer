export default {
  testDir: './tests',
  testIgnore: ['**/unit/**'],
  timeout: 30000,
  reporter: [['list']],
  webServer: {
    command: 'npm run vscode:harness',
    url: 'http://127.0.0.1:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },
  use: {
    browserName: 'chromium',
    baseURL: 'http://127.0.0.1:5174',
    viewport: { width: 1440, height: 920 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  }
};
