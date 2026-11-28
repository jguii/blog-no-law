// No SDK 11.x o `withSentryConfig` saiu do pacote principal e vive em `@sentry/nextjs/config`.
import { withSentryConfig } from '@sentry/nextjs/config';
import type { NextConfig } from 'next';
// Extensão `.ts` explícita: o Next carrega esta config pelo resolvedor TypeScript nativo do Node.
import { securityHeaders } from './lib/security-headers.ts';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return securityHeaders({
      isDev: process.env.NODE_ENV === 'development',
      sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    });
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
