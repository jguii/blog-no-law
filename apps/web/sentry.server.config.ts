import * as Sentry from '@sentry/nextjs';

// Servidor do web (projeto Sentry do web, OPS-01). Sem SENTRY_DSN (dev, testes, CI, build) o SDK
// nem é inicializado. O DSN vem só do ambiente: nunca fica no repositório público.
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: 0.05,
    // T-01-56: no SDK 11.x `sendDefaultPii` foi substituído por `dataCollection`. Tudo que pode
    // carregar dado pessoal fica desligado: usuário, cookies, headers, corpos e query string.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    },
  });
}
