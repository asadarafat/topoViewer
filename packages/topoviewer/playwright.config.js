module.exports = {
  testDir: './tests',
  testIgnore: ['**/unit/**'],
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}-linux{ext}',
  timeout: 30000,
  reporter: [['list']],
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },
  use: {
    browserName: 'chromium',
    baseURL: 'http://127.0.0.1:5173',
    viewport: { width: 1600, height: 950 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  }
};
