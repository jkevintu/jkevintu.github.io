import { defineConfig, devices } from '@playwright/test';

const PORT = 4323;
// 設 BASE_URL 就直接測線上站（例如 BASE_URL=https://jkevintu.com npm run test:e2e）
const remote = process.env.BASE_URL;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: remote ?? `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: remote
    ? undefined
    : {
        command: `npx astro preview --port ${PORT} --ignore-lock`,
        port: PORT,
        reuseExistingServer: !process.env.CI,
      },
});
