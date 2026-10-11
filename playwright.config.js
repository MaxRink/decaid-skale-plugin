const {defineConfig} = require('@playwright/test');

module.exports = defineConfig({
  testDir: './test',
  outputDir: 'test-results',
  reporter: [['list'], ['html', {outputFolder: 'playwright-report', open: 'never'}]],
  use: {trace: 'retain-on-failure', screenshot: 'only-on-failure'},
  timeout: 30_000,
});
