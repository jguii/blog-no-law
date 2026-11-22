---
phase: 01-esqueleto-no-ar-com-testes-e-ci
reviewed: 2026-11-21T00:00:00Z
depth: standard
files_reviewed: 95
files_reviewed_list:
  - .dockerignore
  - .github/dependabot.yml
  - .github/workflows/backup.yml
  - .github/workflows/ci.yml
  - .github/workflows/deploy-api.yml
  - .gitignore
  - .gitleaks.toml
  - .husky/pre-push
  - .oxlintrc.json
  - .prettierignore
  - .prettierrc.json
  - apps/api/Dockerfile
  - apps/api/package.json
  - apps/api/prisma.config.ts
  - apps/api/prisma/migrations/20261117120000_baseline/migration.sql
  - apps/api/prisma/migrations/migration_lock.toml
  - apps/api/prisma/schema.prisma
  - apps/api/scripts/prepare-test-db.d.mts
  - apps/api/scripts/prepare-test-db.mjs
  - apps/api/scripts/set-app-api-password.mjs
  - apps/api/scripts/set-app-api-password.test.mjs
  - apps/api/scripts/verify-db-security.mjs
  - apps/api/src/app.module.ts
  - apps/api/src/app.setup.ts
  - apps/api/src/config/env.spec.ts
  - apps/api/src/config/env.ts
  - apps/api/src/debug/debug.controller.ts
  - apps/api/src/health/database.indicator.ts
  - apps/api/src/health/health.controller.ts
  - apps/api/src/instrument.ts
  - apps/api/src/main.ts
  - apps/api/src/prisma/prisma-database.probe.ts
  - apps/api/src/prisma/prisma.service.ts
  - apps/api/src/status/status.controller.ts
  - apps/api/src/status/status.service.ts
  - apps/api/test/app.http-spec.ts
  - apps/api/test/db.int-spec.ts
  - apps/api/test/global-setup.int.ts
  - apps/api/test/logging.http-spec.ts
  - apps/api/test/rls.int-spec.ts
  - apps/api/test/security.http-spec.ts
  - apps/api/test/sentry.http-spec.ts
  - apps/api/tsconfig.build.json
  - apps/api/tsconfig.json
  - apps/api/vitest.config.ts
  - apps/web/app/global-error.tsx
  - apps/web/app/layout.tsx
  - apps/web/app/page.tsx
  - apps/web/e2e/home.spec.ts
  - apps/web/eslint.config.mjs
  - apps/web/instrumentation-client.ts
  - apps/web/instrumentation.ts
  - apps/web/lib/api.test.ts
  - apps/web/lib/api.ts
  - apps/web/lib/sentry-init.test.ts
  - apps/web/next.config.ts
  - apps/web/package.json
  - apps/web/playwright.config.ts
  - apps/web/sentry.server.config.ts
  - apps/web/test/home.int-spec.ts
  - apps/web/tsconfig.json
  - apps/web/vercel.json
  - apps/web/vitest.config.ts
  - compose.test.yaml
  - ops/backup/age-recipients.txt
  - package.json
  - packages/shared/package.json
  - packages/shared/src/status.test.ts
  - packages/shared/src/status.ts
  - packages/shared/tsconfig.build.json
  - packages/shared/tsconfig.json
  - pnpm-workspace.yaml
  - scripts/__fixtures__/raw-html/safe/page.tsx
  - scripts/__fixtures__/raw-html/unsafe/page.tsx
  - scripts/backup-workflow.test.mjs
  - scripts/check-no-raw-html.mjs
  - scripts/check-no-raw-html.test.mjs
  - scripts/ci-gates.test.mjs
  - scripts/deploy-api-workflow.test.mjs
  - scripts/prepush-wiring.test.mjs
  - scripts/raw-html-allowlist.json
  - scripts/restore-drill.sh
  - scripts/restore-drill.test.mjs
  - scripts/smoke-container.sh
  - scripts/smoke-container.test.mjs
  - scripts/smoke-local.sh
  - scripts/smoke-postgrest.sh
  - scripts/smoke-postgrest.test.mjs
  - scripts/verify-prepush.sh
  - scripts/verify-remote-api.sh
  - scripts/verify-remote-api.test.mjs
  - scripts/wait-for-commit.sh
  - scripts/wait-for-commit.test.mjs
  - tsconfig.base.json
  - turbo.json
findings:
  critical: 0
  warning: 6
  info: 6
  total: 12
  necessity: 0
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-11-21
**Depth:** standard
**Files Reviewed:** 95
**Status:** issues_found

## Summary

Foram revisados os arquivos da fase 1: API NestJS, web Next, baseline SQL, workflows de CI, deploy e backup, e os scripts de operação com seus testes. A base é sólida. Os segredos não vazam nos logs, as ações do GitHub estão fixadas por SHA, o deploy é restrito a CI verde de `push` na `main`, o backup é cifrado no pipe e o papel `app_api` não tem bypass de RLS. Não há achado crítico.

Os pontos que merecem correção antes de seguir para as próximas fases:

- Uma lacuna latente de privilégio em funções que o SQL de baseline diz fechar.
- Tratamento inconsistente de variável de ambiente vazia, que pode desligar `trust proxy` sem aviso.
- Endpoints públicos que consultam o banco sem cache nem limite.
- Dois portões de segurança (HTML bruto e smoke de produção) que passam mais do que deveriam.
- Um token do Sentry que não chega ao build do Next por causa do modo estrito do Turborepo.

Não há achados de necessidade (`necessity`). Os seams de teste (`DatabaseProbe`, `logDestination`) e o `UnconfiguredDatabaseProbe` têm uso real.

Já conhecidos, não reportados de novo: retenção do backup por `createdAt`, já corrigida nesta branch com `publishedAt`, e a tag flutuante `postgres:17` no `backup.yml` e no restore-drill.

## Critical Issues

Nenhum.

## Warnings

### WR-01: Variável de ambiente vazia tratada de forma inconsistente (GIT_SHA quebra o boot; TRUST_PROXY_HOPS vira 0 em silêncio)

**File:** `apps/api/src/config/env.ts:10-38`, `apps/api/Dockerfile:31-32`
**Issue:** O comentário diz que "vazio vale como ausente", mas `emptyToUndefined` só é aplicado a `DATABASE_URL`, `SENTRY_DSN` e `SENTRY_ENVIRONMENT`. Medido com o Zod 4 do repositório, com a string vazia:

- `GIT_SHA` (`z.string().min(1).default('dev')`) falha.
- `PORT` (`z.coerce.number().min(1)`) falha, pois `''` vira 0.
- `DEBUG_ROUTES_ENABLED` (`z.stringbool()`) falha.
- `TRUST_PROXY_HOPS` (`z.coerce.number().min(0)`) é aceito como 0.

Consequências concretas:

1. `ARG GIT_SHA` sem valor seguido de `ENV GIT_SHA=$GIT_SHA` grava `GIT_SHA=""` na imagem. Um `docker build` sem `--build-arg` (o job `docker-build` da CI faz isso) produz uma imagem que não sobe, com a mensagem `GIT_SHA: ...`. Só o `smoke-container.sh` e o `deploy-api.yml` passam o argumento.
2. Um painel de PaaS que deixa `TRUST_PROXY_HOPS` em branco desliga `trust proxy` sem erro. Todo cliente passa a ter o IP do proxy da Render, o que quebra o `clientIp` dos logs agora e o throttle por IP do SEC-02 depois.
3. `instrument.ts:12` usa `??`, então `SENTRY_ENVIRONMENT=''` vira `environment: ''` no Sentry. O `env.ts` trata o mesmo valor como ausente.

**Fix:**
```ts
// env.ts: aplicar a regra a todas as chaves com default
GIT_SHA: z.preprocess(emptyToUndefined, z.string().min(1).default('dev')),
PORT: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(65535).default(3001)),
TRUST_PROXY_HOPS: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).max(3).default(1)),
LOG_LEVEL: z.preprocess(emptyToUndefined, z.enum([...]).default('info')),
DEBUG_ROUTES_ENABLED: z.preprocess(emptyToUndefined, z.stringbool().default(false)),
```
No Dockerfile, use `ARG GIT_SHA=dev`. No `instrument.ts`, use `|| process.env['NODE_ENV']`. Acrescente casos de string vazia ao `env.spec.ts`.

### WR-02: Baseline não fecha o EXECUTE de PUBLIC em funções (a promessa do comentário não se cumpre)

**File:** `apps/api/prisma/migrations/20261117120000_baseline/migration.sql:14-18`
**Issue:** O comentário afirma que o revoke faz "toda tabela, sequência e função futura nascer sem esse acesso". No Postgres, funções recebem `EXECUTE` para `PUBLIC` por padrão, e `anon` e `authenticated` herdam de `PUBLIC`.

`ALTER DEFAULT PRIVILEGES ... IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, ...` só remove os grants por esquema do Supabase. Um `REVOKE ... FROM PUBLIC` com `IN SCHEMA` não retira o default global de `PUBLIC`.

Hoje não existe função em `public`, então não há exposição. A primeira função SQL (helper de RLS, trigger, RPC) criada por uma migration futura nasce chamável por `anon` via `/rest/v1/rpc/...`. Nada nos testes ou no portão `postgrest-anon` cobre isso, porque o portão só faz GET em tabelas e views.

**Fix:**
```sql
-- global (sem IN SCHEMA), para o papel que roda as migrations
ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated, service_role;
```
Estenda o `rls.int-spec.ts` e o `verify-db-security.mjs` com uma checagem de `has_function_privilege` em uma função de prova criada e descartada, ou numa consulta a `pg_proc` do schema `public`.

### WR-03: Endpoints públicos que consultam o banco, sem cache nem limite, e amplificados pela home

**File:** `apps/api/src/status/status.service.ts:33`, `apps/api/src/health/health.controller.ts:21-31`, `apps/web/app/page.tsx:5,14`
**Issue:** `GET /status`, `/health` e `/health/ready` são anônimos e cada chamada faz uma consulta ao Postgres (pool `max: 5`, free tier do Supabase). A home do web é `force-dynamic` com `cache: 'no-store'`, então cada visita de visitante gera outra consulta.

Não há `@nestjs/throttler`. O SEC-02 está previsto só para a Fase 7, então até lá qualquer cliente pode saturar o pool e o Supabase com GETs baratos. O monitor de uptime e o deploy também chamam esses endpoints, e um pool saturado derruba o `ready` e o `/status` em produção.

**Fix:** Sem trazer a Fase 7 para cá, cacheie o resultado do probe por poucos segundos no `PrismaDatabaseProbe`, com TTL de 3 a 5 s e uma única consulta em voo (promise compartilhada). Assim o custo no banco deixa de depender do tráfego. Registre no roadmap que o throttle de `/status` e `/health*` entra com o SEC-02.

### WR-04: O gate de HTML bruto ignora diretórios por nome em qualquer profundidade e certas extensões

**File:** `scripts/check-no-raw-html.mjs:14-21,48-57`
**Issue:** `IGNORED_DIRS` (`coverage`, `test-results`, `playwright-report`, `.next`, `node_modules`) é aplicado a qualquer diretório em qualquer nível de `apps/web`. Um segmento de rota ou pasta de componentes chamado `coverage` (por exemplo `app/coverage/page.tsx`) nunca é varrido.

`EXTENSIONS` também omite `.mts`, `.cts` e `.cjs`. A checagem é por substring, então uma construção como `{ ['dangerously' + 'SetInnerHTML']: ... }` passa. O gate é descrito como "segunda camada independente" do `react/no-danger`, que cobre o caso comum. Mesmo assim a promessa de independência é falsa para esses casos.

**Fix:** Ignore só diretórios de artefato na raiz de `apps/web` (por exemplo `{root}/.next`, `{root}/coverage`, `{root}/playwright-report`, `{root}/test-results`) e `node_modules` em qualquer nível. Inclua `.mts`, `.cts` e `.cjs` em `EXTENSIONS`. Adicione um teste com uma pasta `coverage/` contendo a fixture insegura.

### WR-05: `SENTRY_AUTH_TOKEN` não chega ao `next build` no modo estrito do Turborepo (source maps do web nunca sobem)

**File:** `turbo.json:3-8`, `apps/web/next.config.ts:23-31`
**Issue:** O `next.config.ts` lê `process.env.SENTRY_AUTH_TOKEN` e desliga o upload de source maps quando ele está ausente. O Vercel roda `pnpm turbo run build --filter=@blog/web` (`vercel.json`). O Turborepo 2 usa `envMode: strict` por padrão e só repassa à tarefa as variáveis declaradas em `env`, `globalEnv` ou `passThroughEnv`. O `turbo.json` não declara nenhuma variável do Sentry.

Mesmo com o token configurado na Vercel, o plugin enxerga `undefined` e desliga os source maps em silêncio (`sourcemaps.disable = true`). Os stack traces do OPS-01 no frontend chegam minificados, sem erro nem aviso.

**Fix:**
```json
"build": {
  "dependsOn": ["^build"],
  "outputs": [...],
  "passThroughEnv": ["SENTRY_AUTH_TOKEN", "SENTRY_ORG", "SENTRY_PROJECT"]
}
```
Use `passThroughEnv`, não `env`, para o token não entrar no hash do cache. Confirme no primeiro deploy se o upload acontece.

### WR-06: O smoke de produção do PostgREST trata 404 e 5xx como "bloqueado" e só testa duas tabelas fixas

**File:** `scripts/smoke-postgrest.sh:57,77-80`, `.github/workflows/deploy-api.yml:137-141`
**Issue:** No modo padrão (usado pelo job `verify` do deploy), qualquer resposta diferente de 200 conta como bloqueio. Uma URL errada (404), uma queda do PostgREST ou da Data API do Supabase (5xx) fazem o job passar com `POSTGREST_ANON_BLOCKED`. O teste `smoke-postgrest.test.mjs` fixa esse comportamento ("404 passa como no 01-06").

A lista de tabelas também é fixa (`heartbeat _prisma_migrations`). Toda tabela criada nas fases seguintes fica fora da prova pós-deploy. Só o portão da CI é dinâmico, e ele roda contra um banco recém-migrado, não contra o Supabase de produção, onde grants manuais do painel poderiam divergir.

**Fix:** No `verify`, rode com `POSTGREST_STRICT=1` e aceite apenas `42501` ou `[]`. Isso exige que o smoke use a chave publishable de verdade e que a resposta anônima seja determinística. Gere `TABLES` dinamicamente a partir do catálogo de produção (consulta com o papel de migração, já disponível no job `migrate`) ou exporte a lista do próprio schema Prisma.

## Info

### IN-01: `getStatus` não normaliza `API_URL` com barra final

**File:** `apps/web/lib/api.ts:44`
**Issue:** A chamada usa `${baseUrl}/status?...`. Um `API_URL=https://x.onrender.com/` (comum em painéis) gera `//status`, que o Express responde 404. A home mostra "API indisponível" sem pista do motivo. Os scripts do repositório já fazem `${1%/}`.
**Fix:** `const baseUrl = (raw ?? '').replace(/\/+$/, '')` antes do uso, ou valide `API_URL` com `new URL()`.

### IN-02: `wait-for-commit.sh` aceita base URL vazia e gasta o limite inteiro

**File:** `scripts/wait-for-commit.sh:17-25`, `.github/workflows/deploy-api.yml:133-135`
**Issue:** Com `vars.API_BASE_URL` não definida, `$1` é uma string vazia. O contador de argumentos passa e o script faz polling de `/status` por 600 s, até `COMMIT_TIMEOUT`, sem dizer que a variável está vazia.
**Fix:** Falhe cedo com saída 2 quando `BASE` estiver vazio ou não casar com `^https?://`.

### IN-03: `restore-drill.sh` diagnostica a chave errada como `pg_restore`

**File:** `scripts/restore-drill.sh:104-110`
**Issue:** Quando o `age -d` falha (chave errada ou arquivo corrompido), o `pg_restore` recebe entrada vazia e também falha. Como `STATUS[1]` é checado antes de `STATUS[0]`, o relatório diz `RESTORE_FAIL pg_restore`, não `age_decrypt`. O caso de teste 5 só cobre `pg_restore` falhando sozinho, e a ordem fica sem cobertura.
**Fix:** Teste `STATUS[0]` (age) primeiro e acrescente um caso `FAKE_AGE_EXIT=1` ao `restore-drill.test.mjs`.

### IN-04: `set-app-api-password.mjs` envia a senha em texto claro dentro do `ALTER ROLE`

**File:** `apps/api/scripts/set-app-api-password.mjs:77-79`
**Issue:** `ALTER ROLE ... PASSWORD '<literal>'` trafega e pode ser registrado em claro no log do servidor (`log_statement` e `log_min_error_statement`), no Supabase em produção. O script cuida de não imprimir a senha localmente, mas o lado do servidor não é controlado. É um achado de julgamento, não provado para o Supabase.
**Fix:** Calcule o verificador SCRAM-SHA-256 no cliente e envie `PASSWORD 'SCRAM-SHA-256$...'`. O Postgres aceita o verificador e nunca vê a senha.

### IN-05: Comentários desatualizados e duplicação da imagem do Postgres de teste

**File:** `apps/api/src/status/status.service.ts:12`, `apps/web/eslint.config.mjs:6`, `.github/workflows/ci.yml:67,116,162`, `compose.test.yaml:6`
**Issue:** O `status.service.ts` diz que o "01-05 troca a implementação por uma leitura real", mas isso já aconteceu (`PrismaDatabaseProbe`). O `eslint.config.mjs` diz que o gate de CI "vem no plano 01-14", e ele já existe. A tag `supabase/postgres:17.12.0.000` aparece em quatro lugares, só com comentário "mesma imagem", sem teste que impeça divergência. O Dependabot só cobre o Dockerfile da API, não o compose nem os `services` do workflow.
**Fix:** Atualize os dois comentários. Adicione um teste em `ci-gates.test.mjs` que compare a tag do compose com as do `ci.yml`, ou centralize a versão.

### IN-06: Backup só do schema `public`: restauração futura sem `auth.users`

**File:** `.github/workflows/backup.yml:98`, `scripts/restore-drill.sh:93-99`
**Issue:** O dump usa `--schema=public`. Isso é correto para a Fase 1, que só tem `heartbeat`. Quando as Fases 2 e 3 criarem `profiles` e outras tabelas com chave para `auth.users` e dados do Storage, um restore só de `public` não é completo, e o restore drill atual não detecta isso (cria só os papéis da baseline). Decisão consciente a registrar, não um defeito hoje.
**Fix:** Ao introduzir a primeira FK para `auth.users`, decida o escopo: dump de `auth` (apenas as tabelas necessárias) ou procedimento de recriação por Discord ID. Atualize o drill e o runbook `docs/runbooks/backup-restore.md`.

---

_Reviewed: 2026-11-21_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
