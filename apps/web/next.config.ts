// No SDK 11.x o `withSentryConfig` saiu do pacote principal e vive em `@sentry/nextjs/config`.
import { withSentryConfig } from '@sentry/nextjs/config';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

const authToken = process.env.SENTRY_AUTH_TOKEN;

// O build funciona sem nenhuma variável do Sentry: sem SENTRY_AUTH_TOKEN nada é enviado ao Sentry
// (sem upload de source maps) e a telemetria do próprio plugin fica desligada.
export default withSentryConfig(nextConfig, {
  silent: true,
  telemetry: false,
  authToken,
  sourcemaps: { disable: authToken === undefined || authToken === '' },
});
