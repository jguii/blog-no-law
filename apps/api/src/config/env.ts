import { readFileSync } from 'node:fs';
import { z } from 'zod';

export const APP_ENV = Symbol('APP_ENV');

// Origin = esquema https + host [+ porta], sem caminho nem barra final.
const ORIGIN_PATTERN =
  /^https:\/\/[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*(:\d{1,5})?$/i;

// Painéis de PaaS costumam deixar variáveis opcionais em branco: vazio vale como ausente.
const emptyToUndefined = (value: unknown): unknown => (value === '' ? undefined : value);

const corsOrigins = z
  .string()
  .default('')
  .transform((raw) =>
    raw
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0),
  )
  .pipe(
    z.array(
      z.string().regex(ORIGIN_PATTERN, 'deve ser um origin https://host[:porta], sem caminho'),
    ),
  );

export const envSchema = z
  .object({
    // Toda chave passa por emptyToUndefined (WR-01): vazio cai no default ou em "ausente",
    // nunca em 0 (`z.coerce.number()` faria '' virar 0) nem em erro de boot.
    PORT: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(65535).default(3001)),
    NODE_ENV: z.preprocess(
      emptyToUndefined,
      z.enum(['development', 'test', 'production']).default('development'),
    ),
    GIT_SHA: z.preprocess(emptyToUndefined, z.string().min(1).default('dev')),
    // Saltos de proxy confiáveis (D-02): 1 atrás da Render; nunca `true`.
    TRUST_PROXY_HOPS: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().min(0).max(3).default(1),
    ),
    CORS_ORIGINS: z.preprocess(emptyToUndefined, corsOrigins),
    LOG_LEVEL: z.preprocess(
      emptyToUndefined,
      z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    ),
    // z.stringbool entende 'true'/'false' de verdade; Boolean('false') seria true.
    DEBUG_ROUTES_ENABLED: z.preprocess(emptyToUndefined, z.stringbool().default(false)),
    DATABASE_URL: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .regex(/^postgres(ql)?:\/\//, 'deve começar com postgres:// ou postgresql://')
        .optional(),
    ),
    SENTRY_DSN: z.preprocess(emptyToUndefined, z.url().optional()),
    SENTRY_ENVIRONMENT: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && env.DATABASE_URL === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['DATABASE_URL'],
        message: 'obrigatória quando NODE_ENV=production',
      });
    }
  });

export type AppEnv = z.output<typeof envSchema> & { version: string };

// `src/config` e `dist/config` ficam na mesma profundidade, então o mesmo caminho serve nos dois.
function readPackageVersion(): string {
  const raw = readFileSync(new URL('../../package.json', import.meta.url), 'utf8');
  return (JSON.parse(raw) as { version: string }).version;
}

// Falha rápida no boot. A mensagem só traz `chave: motivo`; o valor recebido nunca entra
// (DATABASE_URL e SENTRY_DSN carregam segredos).
export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((issue) => {
      const key = issue.path.map(String).join('.') || '(env)';
      return `${key}: ${issue.message}`;
    });
    throw new Error(`Variáveis de ambiente inválidas: ${lines.join('; ')}`);
  }
  return { ...parsed.data, version: readPackageVersion() };
}
