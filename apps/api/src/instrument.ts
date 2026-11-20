import * as Sentry from '@sentry/nestjs';

// Carregado por `node --import ./dist/instrument.js` ANTES de qualquer código da aplicação:
// em ESM o SDK precisa registrar os hooks de módulo antes dos imports da app.
// Por isso este arquivo não importa nada da aplicação e lê o ambiente direto.
// Sem SENTRY_DSN (dev, testes, CI) o SDK nem é inicializado.
const dsn = process.env['SENTRY_DSN'];

if (dsn !== undefined && dsn !== '') {
  Sentry.init({
    dsn,
    environment: process.env['SENTRY_ENVIRONMENT'] ?? process.env['NODE_ENV'],
    release: process.env['GIT_SHA'],
    tracesSampleRate: 0.05,
    // T-01-24: no SDK 11.x `sendDefaultPii` foi substituído por `dataCollection`. Aqui tudo que
    // pode carregar dado pessoal fica desligado: usuário, cookies, headers, corpos e query string.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    },
  });
}
