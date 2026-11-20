import { defineConfig } from 'vitest/config';

// Dois projetos, como na API: `unit` (lib/**/*.test.ts) e `int` (test/**/*.int-spec.ts).
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    environment: 'node',
    projects: [
      {
        extends: true,
        test: { name: 'unit', include: ['lib/**/*.test.ts'] },
      },
      {
        extends: true,
        test: { name: 'int', include: ['test/**/*.int-spec.ts'], testTimeout: 15000 },
      },
    ],
  },
});
