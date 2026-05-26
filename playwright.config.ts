import { defineConfig, devices } from '@playwright/test';
import { getDevWorkbenchBaseUrl, getPlaywrightPort, getRealWorkbenchBaseUrl } from './tests/e2e/support/runtime-config';

const realBackendRun = process.env.PLAYWRIGHT_REAL_BACKEND === 'true';
const port = getPlaywrightPort(realBackendRun);
const forceWebServer = process.env.PLAYWRIGHT_FORCE_WEBSERVER === 'true';
const realWorkbenchBaseURL = getRealWorkbenchBaseUrl();
const devWorkbenchBaseURL = getDevWorkbenchBaseUrl();
const baseURL = process.env.PLAYWRIGHT_BASE_URL || (realBackendRun ? realWorkbenchBaseURL : devWorkbenchBaseURL);
const useWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER ? process.env.PLAYWRIGHT_SKIP_WEBSERVER !== 'true' : forceWebServer || !realBackendRun;
const serverMode = process.env.PLAYWRIGHT_SERVER_MODE || 'preview';

function getWebServerCommand() {
  if (serverMode === 'dev') {
    return `npm run dev:workbench -- --host 127.0.0.1 --port ${port}`;
  }

  return `npm run build-only:workbench && npm run preview -- --host 127.0.0.1 --port ${port}`;
}

const reporters: Parameters<typeof defineConfig>[0]['reporter'] = [['list'], ['html', { open: 'never' }]];

if (process.env.PLAYWRIGHT_JSON_OUTPUT_FILE) {
  reporters.push(['json', { outputFile: process.env.PLAYWRIGHT_JSON_OUTPUT_FILE }]);
}

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: reporters,
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1440, height: 960 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: useWebServer
    ? {
        command: getWebServerCommand(),
        port,
        reuseExistingServer: !process.env.CI,
        timeout: serverMode === 'dev' ? 120 * 1000 : 300 * 1000,
      }
    : undefined,
});
