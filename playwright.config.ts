import { defineConfig } from "@playwright/test";

const external = Boolean(process.env.TEST_BASE_URL);
const port = 3120;

export default defineConfig({
  testDir: "tests/browser",
  fullyParallel: false,
  use: {
    baseURL: process.env.TEST_BASE_URL || `http://127.0.0.1:${port}`,
    launchOptions: { executablePath: process.env.CHROMIUM_PATH },
    screenshot: "only-on-failure",
  },
  reporter: "list",
  webServer: external
    ? undefined
    : {
        command: `npx next dev --port ${port}`,
        url: `http://127.0.0.1:${port}`,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
