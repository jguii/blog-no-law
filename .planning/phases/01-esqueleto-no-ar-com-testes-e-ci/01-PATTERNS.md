# Phase 1: Esqueleto no ar com testes e CI - Pattern Map

**Mapped:** 2026-11-17
**Files analyzed:** 62 (novos/modificados)
**Analogs found:** 1 / 62 em-repo (apenas `.gitignore`); todos os demais seguem excertos de `01-RESEARCH.md`

## Regra geral (leia primeiro)

Repositório greenfield. `git ls-files` (fora de `.planning/`) lista apenas `.claude/CLAUDE.md`, `.gitignore` e `assets/brand/*.jpg`. Não existe código de aplicação. `.claude/gsd-core|agents|commands|hooks|scripts` é tooling GSD (não rastreado, D-12) e NÃO é analog. Todo analog abaixo é, portanto, uma secção de `01-RESEARCH.md` (chamada `RESEARCH §...`). Esta fase CRIA os padrões que as próximas seguem. Nenhum caminho de espelho/gitignored foi usado.

Convenções obrigatórias vindas de RESEARCH §"Code Examples" (template oficial Nest 12 ESM) e CLAUDE.md: `"type": "module"`, `module/moduleResolution: nodenext`, imports relativos com `.js`, `emitDecoratorMetadata` + `experimentalDecorators`, `target ES2023`, `types: ["vitest/globals","node"]`, TS `~6.0.3`, pins exatos de Prisma 7.10.1, Vitest 4.1.12 (não 5), ESLint 9.39.x no web, oxlint na API com `typescript/no-floating-promises: error`.

## File Classification

### Root / tooling

| Arquivo | Role | Data Flow | Analog | Match |
|---|---|---|---|---|
| `.gitignore` (MOD) | config | n/a | `.gitignore` atual (3 linhas de estilo) | exact (estender) |
| `package.json` (raiz, `packageManager`) | config | n/a | RESEARCH §Standard Stack (pnpm 12.21.0), Pitfall 9 | research |
| `pnpm-workspace.yaml` (`allowBuilds`) | config | n/a | RESEARCH Pitfall 9 | research |
| `turbo.json` | config | batch | RESEARCH Pitfall 8, Pattern "Pre-push" | research |
| `tsconfig.base.json` | config | n/a | RESEARCH §Code Examples (valores `ts-esm/tsconfig.json`) | research |
| `.husky/pre-push` | config/hook | batch | RESEARCH QA-03 (Husky 9.1.7 + `turbo run`) | research |
| `compose.test.yaml` | config | request-response | RESEARCH Wave 0 Gaps, A7 (`supabase/postgres:17.x`, healthcheck) | research |
| `.dockerignore` | config | n/a | RESEARCH Pitfall 10 (excluir `.env*`) | research |
| `.claude/CLAUDE.md` (MOD: remover Oracle/Caddy/arm64) | docs | n/a | RESEARCH Open Question 5; CONTEXT canonical_refs | exact (editar existente) |
| `vercel.json` (`regions: ["iad1"]`) | config | n/a | RESEARCH D-04 | research |

### packages/shared

| Arquivo | Role | Data Flow | Analog | Match |
|---|---|---|---|---|
| `packages/shared/package.json`, `tsconfig.json` (build `tsc` -> ESM `dist`, `workspace:*`) | config | n/a | CLAUDE.md "Monorepo layout" | research |
| `packages/shared/src/status.ts` (+ `index.ts`) | model (contrato Zod) | transform | RESEARCH Pattern 3 | research (exato) |
| `packages/shared/src/status.test.ts` (RED: `?detail=bogus` inválido) | test | transform | RESEARCH Pattern 3 | research |

### apps/api

| Arquivo | Role | Data Flow | Analog |
|---|---|---|---|
| `apps/api/package.json`, `tsconfig*.json`, `nest-cli.json` | config | n/a | RESEARCH §Code Examples (scripts/tsconfig do template) |
| `apps/api/vitest.config.ts`, `vitest.config.e2e.ts`, `vitest.config.int.ts` | config | n/a | RESEARCH §Code Examples (`ts-esm/vitest.config.ts`) |
| `apps/api/.oxlintrc.json` | config | n/a | RESEARCH §Code Examples (`no-floating-promises`) |
| `apps/api/src/main.ts` | bootstrap | request-response | RESEARCH §"main.ts do esqueleto" |
| `apps/api/src/instrument.ts` | config (Sentry) | event-driven | RESEARCH Pitfall 11, Open Q 6 |
| `apps/api/src/app.module.ts` | module | n/a | RESEARCH §Logs Pino (LoggerModule.forRoot) |
| `apps/api/src/config/env.ts` (+ teste) | utility | transform | RESEARCH Alternatives (`loadEnv()` Zod manual), D-02 (`TRUST_PROXY_HOPS` default 1) |
| `apps/api/src/health/*` (live + ready, indicator Prisma) | controller | request-response | RESEARCH Pattern 5 |
| `apps/api/src/status/status.controller.ts` (+ service, teste) | controller | request-response | RESEARCH Pattern 3 |
| `apps/api/src/prisma/prisma.service.ts` | service | CRUD | RESEARCH Pitfall 6/7, A11 (pool `max` 5-10, timeout) |
| `apps/api/src/debug/*` (`_debug/error`, `_debug/proxy` temporários) | controller | request-response | RESEARCH §"Rota de erro", Open Q 2 |
| `apps/api/prisma/schema.prisma`, `prisma.config.ts` | config | n/a | RESEARCH Pitfall 7 |
| `apps/api/prisma/migrations/<ts>_baseline/migration.sql` | migration | batch | RESEARCH Pattern 4 |
| `apps/api/test/*.e2e-spec.ts` (400, Helmet, CORS, logs redact) | test | request-response | RESEARCH §main.ts (CORS), §Logs Pino, SEC-03 |
| `apps/api/test/rls.int-spec.ts`, `global-setup.ts` | test | CRUD | RESEARCH §"Teste de integração do RLS" |
| `apps/api/Dockerfile` | config | n/a | RESEARCH §Dockerfile |

### apps/web

| Arquivo | Role | Data Flow | Analog |
|---|---|---|---|
| `apps/web/package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs` | config | n/a | CLAUDE.md (Next 16, ESLint 9.39.x flat, `react/no-danger`) |
| `apps/web/app/layout.tsx` (`<html lang="pt-BR">`), `app/page.tsx` | component (RSC) | request-response | RESEARCH Pitfall 2, Arch diagram |
| `apps/web/lib/api.ts` (+ teste) | service | request-response | RESEARCH Pitfall 2 (`AbortSignal.timeout(5000)`), Pattern 3 (`parse`) |
| `apps/web/proxy.ts` (somente se necessário; nunca `middleware.ts`) | middleware | request-response | CLAUDE.md "What NOT to use" |
| `apps/web/vitest.config.ts` | config | n/a | RESEARCH Standard Stack (happy-dom opcional) |
| `apps/web/playwright.config.ts`, `e2e/home.spec.ts` (axe) | test | request-response | RESEARCH QA-02, Validation Architecture |
| `apps/web/sentry.*.config.ts` | config | event-driven | RESEARCH Sentry (dois projetos, `tracesSampleRate` baixo) |

### CI/CD e scripts

| Arquivo | Role | Data Flow | Analog |
|---|---|---|---|
| `.github/workflows/ci.yml` | config (CI) | batch | RESEARCH Pattern 2 (`ci-ok`) |
| `.github/workflows/deploy-api.yml` | config (CD) | batch | RESEARCH Pattern 6 |
| `.github/workflows/backup.yml` | config (cron) | batch | RESEARCH §"Backup noturno" |
| `.github/dependabot.yml` | config | n/a | CLAUDE.md (Dependabot para Actions, grupos Prisma/Nest) |
| `scripts/check-no-raw-html.mjs`, `scripts/raw-html-allowlist.json` (vazia) | utility | file-I/O | RESEARCH Pitfall 12 |
| `scripts/smoke-postgrest.sh` | utility | request-response | RESEARCH §"Verificação PostgREST" |
| `scripts/restore-drill.sh` | utility | batch | RESEARCH fim de §"Backup noturno" |
| `scripts/verify-prepush.sh` | utility/test | batch | RESEARCH Validation (QA-03) |

### Docs

| Arquivo | Role | Analog |
|---|---|---|
| `docs/runbooks/render.md`, `plano-b-railway.md`, `backup-restore.md`, `rotacao-segredos.md` | docs | RESEARCH D-11, Pitfalls 3/4/10, Open Q 2 |
| `docs/bdd/home.feature.md` (Dado/Quando/Então, antes do E2E) | docs/spec | RESEARCH Wave 0 Gaps |

## Pattern Assignments

### `.gitignore` (MOD) - único analog em-repo

**Analog:** `/home/jgui/Blog No Law/.gitignore` (arquivo atual: comentário `# ...` + padrão por bloco). Seguir o mesmo estilo (comentário por bloco) e ACRESCENTAR, antes do primeiro push (D-12): `.claude/gsd-core/`, `.claude/agents/`, `.claude/commands/`, `.claude/hooks/`, `.claude/scripts/`, `.claude/.gsd-profile`, `.claude/gsd-file-manifest.json`, `.claude/gsd-install-state.json`, `.claude/settings.local.json`. Também: `node_modules/`, `dist/`, `.turbo/`, `.next/`, `.env*` (com `!.env.example`), `apps/api/src/generated/`, `playwright-report/`, `test-results/`.

### `packages/shared/src/status.ts` (model, transform)

**Follow:** RESEARCH Pattern 3. Excerto a copiar:
```typescript
import { z } from 'zod';
export const statusQuerySchema = z.strictObject({ detail: z.enum(['basic', 'full']).default('basic') });
export const statusResponseSchema = z.object({
  service: z.literal('api'), version: z.string(), commit: z.string(),
  db: z.enum(['up', 'down']), time: z.iso.datetime(),
});
export type StatusResponse = z.infer<typeof statusResponseSchema>;
```
Nota: `z.iso.datetime()` é `[ASSUMED]`; o teste RED confirma. SDD: o schema e seu teste vêm ANTES de controller e página.

### `apps/api/src/main.ts` (bootstrap)

**Follow:** RESEARCH §"main.ts do esqueleto". Pontos: `loadEnv()` antes de tudo; `NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true })`; `app.set('trust proxy', env.TRUST_PROXY_HOPS)`; `helmet` com `defaultSrc: ["'none'"]`; `enableCors` com allowlist (origem fora = sem header `access-control-allow-origin`); `useGlobalPipes(new StandardSchemaValidationPipe())`; `listen(env.PORT, '0.0.0.0')`; top-level `await`. Imports relativos com `.js`. Observação: o excerto importa `StandardSchemaValidationPipe` de `@nestjs/common` (`[CITED: docs.nestjs.com]`); confirmar no RED.

### `apps/api/src/config/env.ts` (utility, transform)

**Follow:** RESEARCH "Alternatives Considered" (`loadEnv()` com Zod manual, não `@nestjs/config`). Variáveis mínimas citadas na pesquisa: `PORT`, `TRUST_PROXY_HOPS` (default 1), `CORS_ORIGINS`, `LOG_LEVEL`, `DEBUG_ROUTES_ENABLED` (default false), `DATABASE_URL` (app_api), `GIT_SHA`, `SENTRY_DSN`. Falha rápida no boot; usar `z.coerce` onde vier string. Sem analog em código: escrever teste RED primeiro.

### `apps/api/src/health/*` e `status/*` (controller, request-response)

**Follow:** RESEARCH Pattern 5 e Pattern 3.
- `GET /health/live`: zero dependências (alvo do `healthCheckPath` da Render).
- `GET /health/ready` (+ alias `/health`): Terminus `up()/down()` com indicador Prisma lendo `heartbeat` como `app_api`; 503 se o banco cair; devolver `dbLatencyMs` (A4).
- `GET /status`: `@Get('status') get(@Query({ schema: statusQuerySchema }) q)`; resposta validada por `statusResponseSchema`; `commit` vem de `GIT_SHA`.
- Testes com `Test.createTestingModule` + `supertest` (`*.e2e-spec.ts`); RED: `?detail=bogus` => 400.

### `apps/api/src/prisma/prisma.service.ts` (service, CRUD)

**Follow:** RESEARCH Pitfall 6/7 e A11. `PrismaPg` com pool pequeno (`max` 5-10, `connectionTimeoutMillis`); se o adapter não aceitar opções, criar `Pool` do `pg` e passar ao adapter. Client gerado: `provider = "prisma-client"`, `output = "../src/generated/prisma"`, `moduleFormat = "esm"`; import com `.js`. Conectar como `app_api` pelo pooler session 5432 (usuário `app_api.<ref>`). CA do Supabase via `NODE_EXTRA_CA_CERTS` (Open Q 7).

### `apps/api/prisma.config.ts` (config)

**Follow:** RESEARCH Pitfall 7: `import "dotenv/config"`; `datasource.url` = `MIGRATE_DATABASE_URL` (credencial `postgres`); `directUrl` não existe no v7. Pins exatos `7.10.1` para `prisma`, `@prisma/client`, `@prisma/adapter-pg`.

### `apps/api/prisma/migrations/<ts>_baseline/migration.sql` (migration, batch)

**Follow:** RESEARCH Pattern 4 (SQL completo: `CREATE ROLE app_api LOGIN NOSUPERUSER NOBYPASSRLS ...`, `ALTER DEFAULT PRIVILEGES ... REVOKE ALL ... FROM anon, authenticated, service_role`, tabela `heartbeat` com `CHECK (id = 1)`, `ENABLE ROW LEVEL SECURITY`, `GRANT SELECT ... TO app_api`, `CREATE POLICY ... TO app_api`, RLS em `_prisma_migrations`). Senha do `app_api` NUNCA no git (passo manual, `ALTER ROLE`). Migrations futuras: expand/contract (Pattern 6, passo 2). Atenção: `_prisma_migrations` só existe depois do primeiro deploy; validar a ordem no spike (A7).

### `apps/api/test/rls.int-spec.ts` (test, CRUD)

**Follow:** RESEARCH §"Teste de integração do RLS": consultar `pg_class` + `pg_namespace` (`relkind='r'`, `nspname='public'`) e exigir `relrowsecurity = true` em todas; `pg_roles` para `app_api` (`rolbypassrls`/`rolsuper` falsos); `SET ROLE anon; select * from heartbeat` falha com `42501`. Setup global: subir `compose.test.yaml`, aplicar `prisma migrate deploy` com `postgres`. `turbo.json` deve declarar `DATABASE_URL_TEST` em `env`/`passThroughEnv` e `prisma/migrations/**` em `inputs` (Pitfall 8).

### `apps/api/Dockerfile` (config)

**Follow:** RESEARCH §Dockerfile (multi-stage `node:26-bookworm-slim`, `pnpm --filter api --prod deploy /out`, `USER node`, `ARG GIT_SHA`, `CMD node --enable-source-maps --import ./dist/instrument.js dist/main.js`). Marcado `[ASSUMED]`: validar no spike de Wave 0 (fallback `--legacy`, A10). Amd64 apenas (D-10). `.dockerignore` exclui `.env*`.

### `apps/api/src/instrument.ts` e rota `_debug/error` (Sentry)

**Follow:** RESEARCH Pitfall 11 (carregar por `node --import`, não por `import` na 1a linha) e §"Rota de erro" (`DEBUG_ROUTES_ENABLED`, 404 quando desligada). `SentryGlobalFilter`; `tracesSampleRate` baixo. A sonda de `trust proxy` (Open Q 2) é rota temporária sob a mesma flag; remover depois.

### `apps/web/app/page.tsx` e `apps/web/lib/api.ts` (component RSC + service)

**Follow:** RESEARCH Pitfall 2 e Pattern 3: busca no servidor (BFF), `fetch(url, { signal: AbortSignal.timeout(5000), cache: 'no-store' })`, `statusResponseSchema.parse()`, e UI de degradação ("API indisponível") em vez de 500. Next 16: `params`/`cookies()`/`headers()` assíncronos; sem `middleware.ts`. Página mínima, sem identidade visual (Fase 2). Sem `dangerouslySetInnerHTML`.

### `apps/web/eslint.config.mjs` e `scripts/check-no-raw-html.mjs` (SEC-03)

**Follow:** RESEARCH Pitfall 12: regra `react/no-danger` no flat config (ESLint 9.39.x) E script que falha em qualquer `dangerouslySetInnerHTML` em `apps/web`, com allowlist de caminhos explícita e vazia em `scripts/raw-html-allowlist.json` (a Fase 6 acrescenta o componente de JSON-LD). Teste do script: fixture com ocorrência => exit != 0.

### `apps/web/playwright.config.ts` e `e2e/home.spec.ts` (test)

**Follow:** RESEARCH QA-02 / Validation Architecture: Playwright 1.65.1 + `@axe-core/playwright` 4.14.0; só na CI, com API e web construídos e Postgres de serviço; `pnpm exec playwright install --with-deps chromium`. Cenários Dado/Quando/Então escritos antes em `docs/bdd/`. Teste: home mostra commit/status do banco; axe sem violações.

### `.husky/pre-push` e `scripts/verify-prepush.sh` (hook)

**Follow:** RESEARCH QA-03: Husky 9.1.7 chamando `pnpm turbo run lint typecheck test test:integration`; `docker compose -f compose.test.yaml up --wait` idempotente antes dos testes de integração; E2E fora do hook. `verify-prepush.sh` injeta falha e espera exit != 0. CI é o portão real (`--no-verify` burla o hook). O hook não pode depender de nada em `.claude/` (D-12).

### `.github/workflows/ci.yml` (CI)

**Follow:** RESEARCH Pattern 2. Jobs: `lint`, `typecheck`, `test-api`, `test-web`, `e2e`, `secrets` (gitleaks, action v3.0.0), `docker-build`, e agregador:
```yaml
ci-ok:
  if: always()
  needs: [lint, typecheck, test-api, test-web, e2e, secrets, docker-build]
  runs-on: ubuntu-latest
  steps:
    - run: |
        echo '${{ toJSON(needs) }}' | grep -q '"result": "\(failure\|cancelled\|skipped\)"' && exit 1 || exit 0
```
Regras: gatilho `pull_request` (nunca `pull_request_target`), `permissions: contents: read`, ações de terceiros por SHA (checkout v7.0.1, setup-node v7.1.0, pnpm/action-setup v6.1.1), `services: postgres` com `supabase/postgres:17.x`. Ruleset da `main` (só `ci-ok`) via `gh api` DEPOIS da primeira execução (os nomes de check só existem então).

### `.github/workflows/deploy-api.yml` (CD)

**Follow:** RESEARCH Pattern 6, ordem fixa: (1) build `linux/amd64` + push `ghcr.io/<owner>/<repo>-api:<sha>`; (2) `prisma migrate deploy` com credencial `postgres` (GitHub Environment `production`); (3) `curl` no deploy hook da Render com `imgURL` (sem `-v`; URL é segredo); (4) polling de `/status` até `commit == github.sha` (limite 10 min); (5) `scripts/smoke-postgrest.sh`. Pacote GHCR torna-se público manualmente após o 1o push (Pitfall 10). Fallback se a Render não aceitar imagem (A1): runtime Docker + hook com `ref`.

### `.github/workflows/backup.yml` (cron)

**Follow:** RESEARCH §"Backup noturno": `cron: '17 5 * * *'` + `workflow_dispatch`, `environment: production`, `set +x`; step 1 `UPDATE public.heartbeat` (keep-alive por escrita real); step 2 `pg_dump -Fc --no-owner --schema=public` com papel `postgres` (NUNCA `app_api`: dump sai vazio, Pitfall 5) canalizado a `age -r "$AGE_RECIPIENT"` sem arquivo em claro e sem artifact (D-07); `gh release create` no repo privado de backups (token fine-grained de 1 repo); retenção 30 dias via `gh release list --json` + `jq`. Cliente `postgres:17` (A6: confirmar `SHOW server_version`).

### `scripts/smoke-postgrest.sh` (utility)

**Follow:** RESEARCH §"Verificação PostgREST":
```bash
code=$(curl -s -o /tmp/body -w '%{http_code}' -H "apikey: $SUPABASE_PUBLISHABLE_KEY" "$SUPABASE_URL/rest/v1/heartbeat?select=*")
test "$code" != "200" -o "$(cat /tmp/body)" = "[]"
```
Chave publishable entra como *variable*, não secret. Comportamento do PostgREST é `[ASSUMED]` (A8).

### `scripts/restore-drill.sh` e `docs/runbooks/backup-restore.md`

**Follow:** RESEARCH fim de §"Backup noturno": Postgres de rascunho (`supabase/postgres:17.x` ou `postgres:17` + `CREATE ROLE app_api/anon/authenticated`), `age -d -i chave_privada.txt | pg_restore --no-owner -d ...`, conferir `heartbeat` e `_prisma_migrations`, cronometrar e anotar no runbook. Chave privada fica offline com o autor.

### `compose.test.yaml` (config)

**Follow:** RESEARCH Wave 0 Gaps / A7: serviço `supabase/postgres:17.x` com `healthcheck`, porta local dedicada, volume efêmero; usado por `docker compose up --wait` no pre-push e espelhado em `services:` na CI. Fallback: `postgres:17` + SQL de bootstrap dos papéis.

## Shared Patterns

### Contrato Zod único (SDD)
**Source:** RESEARCH Pattern 3. **Apply to:** `packages/shared`, `status.controller.ts`, `apps/web/lib/api.ts`, E2E. Schema e teste antes do código; `z.strictObject` em mutações; campos novos de contrato sempre opcionais (Pitfall 13).

### Segredos em repo público
**Source:** RESEARCH Pitfall 1, Security Domain. **Apply to:** todos os workflows e scripts. `permissions: contents: read`, segredos só em `env:` do step, `set +x`, nunca `curl -v`, sem artifact de dump, gitleaks + push protection, `.env.example` sem valores reais.

### ESM Nest 12
**Source:** RESEARCH §Code Examples (template). **Apply to:** todo arquivo `.ts` de `apps/api` e `packages/shared`. Imports relativos com `.js`; `await` no top level; scripts `start:prod`, `lint` (`oxlint --type-aware src/ test/`), `test` (`vitest run`), `test:e2e` (`vitest run --config ./vitest.config.e2e.ts`).

### Logs com redação
**Source:** RESEARCH §"Logs Pino com redação". **Apply to:** `app.module.ts`. `redact.paths`: `req.headers.authorization`, `req.headers.cookie`, `res.headers["set-cookie"]`, `*.token`, `*.password`, `censor: '[REDACTED]'`. Teste: enviar `Authorization: Bearer abc`, capturar saída, `abc` não aparece.

### Tolerância a sono da API
**Source:** RESEARCH D-03, Pitfall 2/3. **Apply to:** `apps/web/lib/api.ts`, qualquer job futuro. Timeout curto + fallback; sem estado em memória; crons críticos fora de `@nestjs/schedule`; um único web service grátis por workspace Render.

### Segurança de banco
**Source:** RESEARCH Pattern 4, Pitfall 5/6. **Apply to:** migrations, `prisma.service.ts`, backup. Runtime `app_api` (sem bypass); migrations e dump com `postgres`; sempre pooler session 5432 (IPv4).

### TDD/BDD
**Source:** CLAUDE.md Constraints; RESEARCH Wave 0 Gaps. **Apply to:** todo plano. Teste RED primeiro por tarefa; cenários em `docs/bdd/` viram o E2E.

## No Analog Found (usar RESEARCH, conforme acima)

Todos os arquivos, exceto `.gitignore` e `.claude/CLAUDE.md` (edição de existentes). Itens sem excerto pronto na pesquisa e que exigem spike (Wave 0): Dockerfile com `pnpm deploy` (A10), Sentry ESM com `--import` (Open Q 6), imagem `supabase/postgres` como `services:` (A7), `PrismaPg` com opções de pool (A11), `apps/web/proxy.ts`/Sentry web (sem excerto), `next.config.ts` e `vercel.json` (só a região `iad1` está documentada), `turbo.json` (apenas as regras de env/inputs do Pitfall 8), `.github/dependabot.yml`.

## Metadata

**Analog search scope:** `git ls-files` completo do repo; `.gitignore`; `01-CONTEXT.md`; `01-RESEARCH.md` (783 linhas, lido por inteiro).
**Files scanned:** 4 rastreados fora de `.planning/`.
**Pattern extraction date:** 2026-11-17
