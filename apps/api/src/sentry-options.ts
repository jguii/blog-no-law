// Parte pura da configuração do Sentry, lida direto do ambiente. Fica fora do `instrument.ts`
// para ser testável sem inicializar o SDK. Não importa nada da aplicação (o `instrument.ts`
// carrega antes dela por `--import`).
export type SentryEnvOptions = {
  dsn: string;
  environment: string | undefined;
  release: string | undefined;
};

// Mesma regra do `config/env.ts` (WR-01): variável vazia vale como ausente.
function read(source: NodeJS.ProcessEnv, key: string): string | undefined {
  const value = source[key];
  return value === '' ? undefined : value;
}

// Sem SENTRY_DSN (dev, testes, CI) devolve undefined e o SDK nem é inicializado.
export function sentryEnvOptions(source: NodeJS.ProcessEnv): SentryEnvOptions | undefined {
  const dsn = read(source, 'SENTRY_DSN');
  if (dsn === undefined) return undefined;
  return {
    dsn,
    environment: read(source, 'SENTRY_ENVIRONMENT') ?? read(source, 'NODE_ENV'),
    release: read(source, 'GIT_SHA'),
  };
}
