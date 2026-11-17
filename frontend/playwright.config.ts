import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright end-to-end tests.
 *
 * Prerequisites:
 *   - Backend running on port 3001 with migrations applied (npm run start:dev in /backend)
 *   - PostgreSQL database connected
 *
 * The frontend is started automatically via webServer below.
 *
 * Run:
 *   npm run test:e2e          (from /frontend)
 *
 * With a running backend:
 *   RUN_E2E=true npm run test:e2e
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Start the Next.js dev server before running tests.
  // The backend is expected to already be running on port 3001.
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
