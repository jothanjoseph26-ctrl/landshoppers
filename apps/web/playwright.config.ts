import { defineConfig, devices } from '@playwright/test'

/** Run from `apps/web` (`pnpm run test:e2e`). Optionally set PLAYWRIGHT_BASE_URL if the server is already up. */
export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        /**
         * CI: run `pnpm run build` first, then `next start` comes up quickly.
         * Local: `next dev` can exceed 3m on slow disks; override with PLAYWRIGHT_BASE_URL if you already have a server.
         */
        command: process.env.CI ? 'npx next start -p 3000' : 'npx next dev -p 3000',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: !process.env.CI,
        timeout: process.env.CI ? 120_000 : 540_000,
      },
})
