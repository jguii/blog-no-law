import { defineConfig } from 'vitest/config';

// Valores do template oficial Nest 12 ESM: tsconfigPaths do Vite 8 e globals.
// Dois projetos: `unit` (src/**/*.spec.ts) e `http` (test/**/*.http-spec.ts).
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
    ],
  },
});
