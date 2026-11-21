import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

// Flat config do ESLint 9 (o `next lint` foi removido no Next 16).
// SEC-03: HTML bruto do React é proibido; o gate de CI com allowlist vazia vem no plano 01-14.
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'next-env.d.ts',
    'node_modules/**',
    'playwright-report/**',
    'test-results/**',
  ]),
  {
    rules: {
      'react/no-danger': 'error',
    },
  },
]);
