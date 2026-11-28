import { defineConfig } from 'vitest/config';

// Dois projetos, como na API: `unit` (lib, components e app: *.test.ts e *.test.tsx)
// e `int` (test/**/*.int-spec.ts e .tsx).
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    environment: 'node',
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: [
            'lib/**/*.test.{ts,tsx}',
            'components/**/*.test.{ts,tsx}',
            'app/**/*.test.{ts,tsx}',
          ],
        },
      },
      {
        extends: true,
        test: { name: 'int', include: ['test/**/*.int-spec.{ts,tsx}'], testTimeout: 15000 },
      },
    ],
  },
});
