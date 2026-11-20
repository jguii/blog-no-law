import { readFileSync } from 'node:fs';
import { loadEnv } from './env.js';

const packageVersion = (
  JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as {
    version: string;
  }
).version;

function errorOf(source: Record<string, string>): Error | undefined {
  try {
    loadEnv(source);
  } catch (error) {
    return error as Error;
  }
  return undefined;
}

describe('loadEnv', () => {
  it('devolve os defaults quando o ambiente está vazio', () => {
    const env = loadEnv({});

    expect(env.PORT).toBe(3001);
    expect(env.NODE_ENV).toBe('development');
    expect(env.GIT_SHA).toBe('dev');
    expect(env.TRUST_PROXY_HOPS).toBe(1);
    expect(env.CORS_ORIGINS).toEqual([]);
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.DEBUG_ROUTES_ENABLED).toBe(false);
    expect(env.DATABASE_URL).toBeUndefined();
    expect(env.SENTRY_DSN).toBeUndefined();
    expect(env.version).toBe(packageVersion);
  });

  it('converte PORT para número', () => {
    expect(loadEnv({ PORT: '10000' }).PORT).toBe(10000);
  });

  it('interpreta DEBUG_ROUTES_ENABLED como booleano de verdade, sem coerção ingênua', () => {
    expect(loadEnv({ DEBUG_ROUTES_ENABLED: 'false' }).DEBUG_ROUTES_ENABLED).toBe(false);
    expect(loadEnv({ DEBUG_ROUTES_ENABLED: 'true' }).DEBUG_ROUTES_ENABLED).toBe(true);
  });

  it('separa CORS_ORIGINS por vírgula em uma lista de origins', () => {
    const env = loadEnv({ CORS_ORIGINS: 'https://a.vercel.app,https://b.vercel.app' });

    expect(env.CORS_ORIGINS?.join(' ')).toBe('https://a.vercel.app https://b.vercel.app');
  });

  it('rejeita item de CORS_ORIGINS que não seja origin (caminho ou barra final)', () => {
    expect(() => loadEnv({ CORS_ORIGINS: 'https://a.vercel.app/' })).toThrow(/CORS_ORIGINS/);
    expect(() => loadEnv({ CORS_ORIGINS: 'https://a.vercel.app/blog' })).toThrow(/CORS_ORIGINS/);
  });

  it('rejeita TRUST_PROXY_HOPS fora da faixa 0 a 3', () => {
    expect(() => loadEnv({ TRUST_PROXY_HOPS: '9' })).toThrow(/TRUST_PROXY_HOPS/);
  });

  it('falha citando só o nome da chave e nunca o valor (T-01-03)', () => {
    const error = errorOf({ DATABASE_URL: 'mysql://user:s3cr3t@h/db' });

    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toContain('DATABASE_URL');
    expect(error?.message).not.toContain('s3cr3t');
  });

  it('exige DATABASE_URL em produção', () => {
    expect(() => loadEnv({ NODE_ENV: 'production' })).toThrow(/DATABASE_URL/);
  });

  it('aceita produção com DATABASE_URL postgres', () => {
    const env = loadEnv({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://app_api.ref:pw@pooler.example.com:5432/postgres',
    });

    expect(env.NODE_ENV).toBe('production');
    expect(env.DATABASE_URL).toContain('postgresql://');
  });
});
