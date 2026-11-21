import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// O SDK é substituído por mocks: nada de rede e nenhum DSN real (os DSNs abaixo são fictícios).
const sentry = vi.hoisted(() => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureRequestError: vi.fn(),
  captureRouterTransitionStart: vi.fn(),
}));

vi.mock('@sentry/nextjs', () => sentry);

const FAKE_DSN = 'https://public@o0.ingest.sentry.example/1';

// T-01-56: tudo que pode carregar dado pessoal fica desligado. No SDK 11.x o `sendDefaultPii`
// foi substituído por `dataCollection` (o tipo `DataCollection` do @sentry/core 11.12.0 não o tem).
const PII_OFF = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [],
  urlQueryParams: false,
};

beforeEach(() => {
  vi.resetModules();
  sentry.init.mockReset();
  sentry.captureException.mockReset();
  sentry.captureRequestError.mockReset();
  sentry.captureRouterTransitionStart.mockReset();
  // Ambiente de partida sem DSN, qualquer que seja o do desenvolvedor ou da CI.
  vi.stubEnv('SENTRY_DSN', '');
  vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sentry do web: servidor (sentry.server.config)', () => {
  it('não inicializa o SDK sem SENTRY_DSN', async () => {
    await import('../sentry.server.config');

    expect(sentry.init).not.toHaveBeenCalled();
  });

  it('inicializa uma vez com DSN, ambiente, release, amostragem de 5% e sem dado pessoal', async () => {
    vi.stubEnv('SENTRY_DSN', FAKE_DSN);
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('VERCEL_GIT_COMMIT_SHA', 'abc1234');

    await import('../sentry.server.config');

    expect(sentry.init).toHaveBeenCalledTimes(1);
    expect(sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: FAKE_DSN,
        environment: 'preview',
        release: 'abc1234',
        tracesSampleRate: 0.05,
        dataCollection: PII_OFF,
      }),
    );
  });
});

describe('Sentry do web: navegador (instrumentation-client)', () => {
  it('não inicializa o SDK sem o DSN público', async () => {
    await import('../instrumentation-client');

    expect(sentry.init).not.toHaveBeenCalled();
  });

  it('inicializa uma vez com amostragem de 5%, sem dado pessoal e sem integrações extras', async () => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', FAKE_DSN);

    await import('../instrumentation-client');

    expect(sentry.init).toHaveBeenCalledTimes(1);
    const options: Record<string, unknown> = sentry.init.mock.calls[0]?.[0];
    expect(options).toEqual(
      expect.objectContaining({
        dsn: FAKE_DSN,
        tracesSampleRate: 0.05,
        dataCollection: PII_OFF,
      }),
    );
    expect(options).not.toHaveProperty('integrations');
  });
});

describe('Sentry do web: instrumentation (register e onRequestError)', () => {
  it('register() inicializa no runtime nodejs e não inicializa no edge; onRequestError é o captureRequestError do SDK', async () => {
    vi.stubEnv('SENTRY_DSN', FAKE_DSN);
    const instrumentation = await import('../instrumentation');

    vi.stubEnv('NEXT_RUNTIME', 'edge');
    await instrumentation.register();
    expect(sentry.init).not.toHaveBeenCalled();

    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    await instrumentation.register();
    expect(sentry.init).toHaveBeenCalledTimes(1);

    expect(instrumentation.onRequestError).toBe(sentry.captureRequestError);
  });
});
