// Parte pura da configuração do Sentry, lida direto do ambiente. Fica fora do `instrument.ts`
// para ser testável sem inicializar o SDK. Não importa nada da aplicação (o `instrument.ts`
// carrega antes dela por `--import`).
export type SentryEnvOptions = {
  dsn: string;
  environment: string | undefined;
  release: string | undefined;
};

// Sem SENTRY_DSN (dev, testes, CI) devolve undefined e o SDK nem é inicializado.
export function sentryEnvOptions(source: NodeJS.ProcessEnv): SentryEnvOptions | undefined {
  const dsn = source['SENTRY_DSN'];
  if (dsn === undefined || dsn === '') return undefined;
  return {
    dsn,
    environment: source['SENTRY_ENVIRONMENT'] ?? source['NODE_ENV'],
    release: source['GIT_SHA'],
  };
}
