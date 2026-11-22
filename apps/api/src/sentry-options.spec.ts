import { sentryEnvOptions } from './sentry-options.js';

const DSN = 'https://public@o1.ingest.sentry.io/1';

describe('sentryEnvOptions', () => {
  it('não inicializa o Sentry sem SENTRY_DSN ou com SENTRY_DSN vazio', () => {
    expect(sentryEnvOptions({})).toBeUndefined();
    expect(sentryEnvOptions({ SENTRY_DSN: '' })).toBeUndefined();
  });

  it('usa SENTRY_ENVIRONMENT, GIT_SHA e o DSN recebidos', () => {
    expect(
      sentryEnvOptions({
        SENTRY_DSN: DSN,
        SENTRY_ENVIRONMENT: 'production',
        NODE_ENV: 'production',
        GIT_SHA: 'abc1234',
      }),
    ).toEqual({ dsn: DSN, environment: 'production', release: 'abc1234' });
  });

  it('cai no NODE_ENV quando SENTRY_ENVIRONMENT está ausente', () => {
    expect(sentryEnvOptions({ SENTRY_DSN: DSN, NODE_ENV: 'test' })?.environment).toBe('test');
  });
});
