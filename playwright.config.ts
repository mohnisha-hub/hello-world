import { defineConfig, devices } from "@playwright/test";

const hasDb = Boolean(process.env.DATABASE_URL?.startsWith("postgres"));

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: hasDb
    ? {
        command: "npx next dev --hostname 127.0.0.1 --port 3000",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          ...process.env,
          AUTH_SECRET: process.env.AUTH_SECRET || "test-auth-secret-32-characters-min",
          AUTH_URL: "http://127.0.0.1:3000",
          ADMIN_USERNAME: process.env.ADMIN_USERNAME || "mohnisha",
        },
      }
    : undefined,
});
