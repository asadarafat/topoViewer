const testPort = Number(process.env.TOPOVIEWER_TEST_PORT || 5183);
const baseURL = `http://127.0.0.1:${testPort}`;

export default {
  testDir: './tests',
  testIgnore: ['**/unit/**'],
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}-linux{ext}',
  timeout: 30000,
  reporter: [['list']],
  webServer: {
    command: `npm run dev -- --port ${testPort}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120000
  },
  use: {
    browserName: 'chromium',
    baseURL,
    viewport: { width: 1600, height: 950 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  }
};
