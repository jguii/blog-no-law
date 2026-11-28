import { defineConfig, devices } from '@playwright/test';

// E2E dos cenários @e2e de docs/bdd/*.feature.md. Roda só na CI (D-09); o pre-push não usa Playwright.
// Pré-requisitos (a CI faz tudo isso antes de chamar `playwright test`):
//   1. `pnpm turbo run build --filter=@blog/web --filter=@blog/api` (dist da API e .next do web);
//   2. um Postgres de teste com o banco `blog_e2e` migrado (`TEST_DB_NAME=blog_e2e node apps/api/scripts/prepare-test-db.mjs`).
const API_PORT = 3201;
const WEB_PORT = 3200;
const DEGRADED_WEB_PORT = 3202;
const CLOSED_PORT = 9;
const HOST = '127.0.0.1';

// Credencial só de teste local: o papel `app_api` do banco descartável criado por prepare-test-db.mjs.
const DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  'postgresql://app_api:app_api_local_test@127.0.0.1:54329/blog_e2e';

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://${HOST}:${WEB_PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // API compilada, carregada como em produção (`--import ./dist/instrument.js`).
      command: 'node --enable-source-maps --import ./dist/instrument.js dist/main.js',
      cwd: '../api',
      url: `http://${HOST}:${API_PORT}/health/live`,
      reuseExistingServer: !isCI,
      timeout: 60_000,
      env: {
        PORT: String(API_PORT),
        GIT_SHA: 'e2e-sha',
        NODE_ENV: 'test',
        DATABASE_URL,
        SENTRY_DSN: '',
      },
    },
    {
      // Web normal: o servidor do Next (BFF) fala com a API; o navegador nunca chama a API.
      command: `pnpm exec next start -p ${WEB_PORT} -H ${HOST}`,
      url: `http://${HOST}:${WEB_PORT}/`,
      reuseExistingServer: !isCI,
      timeout: 60_000,
      env: {
        API_URL: `http://${HOST}:${API_PORT}`,
        SENTRY_DSN: '',
        NEXT_PUBLIC_SENTRY_DSN: '',
      },
    },
    {
      // Web degradado (D-03): a mesma build apontada para uma porta fechada, como se a API tivesse caído.
      command: `pnpm exec next start -p ${DEGRADED_WEB_PORT} -H ${HOST}`,
      url: `http://${HOST}:${DEGRADED_WEB_PORT}/`,
      reuseExistingServer: !isCI,
      timeout: 60_000,
      env: {
        API_URL: `http://${HOST}:${CLOSED_PORT}`,
        SENTRY_DSN: '',
        NEXT_PUBLIC_SENTRY_DSN: '',
      },
    },
  ],
});
