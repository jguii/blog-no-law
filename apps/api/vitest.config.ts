import { defineConfig } from 'vitest/config';

// Valores do template oficial Nest 12 ESM: tsconfigPaths do Vite 8 e globals.
// Três projetos: `unit` (src/**/*.spec.ts), `http` (test/**/*.http-spec.ts) e
// `int` (test/**/*.int-spec.ts, contra um Postgres real preparado pelo global-setup).
// O nome `test:http` é proposital: `test:e2e` fica reservado ao Playwright do web.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    projects: [
      {
        extends: true,
        test: { name: 'unit', include: ['src/**/*.spec.ts'] },
      },
      {
        extends: true,
        test: { name: 'http', include: ['test/**/*.http-spec.ts'] },
      },
      {
        extends: true,
        test: {
          name: 'int',
          include: ['test/**/*.int-spec.ts'],
          globalSetup: ['test/global-setup.int.ts'],
          // Os testes compartilham um único banco descartável: nada de arquivos em paralelo.
          fileParallelism: false,
          testTimeout: 30000,
          hookTimeout: 120000,
        },
      },
    ],
  },
});
