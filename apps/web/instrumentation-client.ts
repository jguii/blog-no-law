import * as Sentry from '@sentry/nextjs';

// Navegador (projeto Sentry do web, OPS-01). Sem o DSN público o SDK nem é inicializado.
// Sem integração de replay (privacidade e tamanho do bundle): nenhuma chave `integrations`.
// O Next troca `process.env.NEXT_PUBLIC_*` por texto literal no build, por isso o acesso é direto.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.05,
    // T-01-56: no SDK 11.x `sendDefaultPii` foi substituído por `dataCollection`.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    },
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
