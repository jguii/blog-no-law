---
phase: 01-esqueleto-no-ar-com-testes-e-ci
verified: 2026-11-27T02:45:00Z
status: passed
score: 5/5 must-haves verified
covered_files:
  - ".github/workflows/backup.yml"
  - ".github/workflows/ci.yml"
  - ".github/workflows/deploy-api.yml"
  - ".husky/pre-push"
  - ".planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-01-PLAN.md"
  - ".planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-01-SUMMARY.md"
  - ".planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-02-PLAN.md"
  - ".planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-02-SUMMARY.md"
  - ".planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-03-PLAN.md"
  - ".planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-03-SUMMARY.md"
  - ".planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-04-PLAN.md"
  - ".planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-04-SUMMARY.md"
  - ".planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-05-PLAN.md"
  - ".planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-05-SUMMARY.md"
  - ".planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-06-PLAN.md"
  - ".planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-06-SUMMARY.md"
  - ".planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-07-PLAN.md"
  - ".planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-07-SUMMARY.md"
  - ".planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-08-PLAN.md"
  - ".planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-08-SUMMARY.md"
  - ".planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-09-PLAN.md"
  - ".planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-09-SUMMARY.md"
  - ".planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-10-PLAN.md"
  - ".planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-10-SUMMARY.md"
  - ".planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-11-PLAN.md"
  - ".planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-11-SUMMARY.md"
  - ".planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-12-PLAN.md"
  - ".planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-12-SUMMARY.md"
  - ".planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-13-PLAN.md"
  - ".planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-13-SUMMARY.md"
  - ".planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-14-PLAN.md"
  - ".planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-14-SUMMARY.md"
  - "apps/api/Dockerfile"
  - "apps/api/prisma/migrations/20261117120000_baseline/migration.sql"
  - "apps/api/prisma/migrations/20261122120000_revoke_function_execute/migration.sql"
  - "apps/api/src/app.setup.ts"
  - "apps/api/src/config/env.spec.ts"
  - "apps/api/src/config/env.ts"
  - "apps/api/src/health/health.controller.ts"
  - "apps/api/src/instrument.ts"
  - "apps/api/src/sentry-options.ts"
  - "apps/api/src/status/status.controller.ts"
  - "apps/api/test/rls.int-spec.ts"
  - "apps/api/test/security.http-spec.ts"
  - "apps/web/app/page.tsx"
  - "apps/web/e2e/home.spec.ts"
  - "apps/web/lib/api.ts"
  - "docs/runbooks/plano-b-railway.md"
  - "docs/runbooks/render.md"
  - "package.json"
  - "scripts/check-no-raw-html.mjs"
  - "scripts/verify-prepush.sh"
  - "turbo.json"
covered_digest: "v4:sha256:5a854b71bb6005ce22b23f652a5f4916e1f1f25cbeeea1e75b81e3805787c54a"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 5/5
  gaps_closed: []
  gaps_remaining: []
  regressions: []
  human_items_resolved: "6/6 em 01-UAT.md (status complete, cada item com evidence)"
---

# Phase 1: Esqueleto no ar com testes e CI. Relatório de verificação

**Objetivo da fase:** Como desenvolvedor do Blog No Law, quero ter um esqueleto Next.js + NestJS + Supabase publicado em produção e protegido por testes, CI e backups, para que toda funcionalidade nasça testada e implantada desde o primeiro commit.
**Verificado em:** 2026-11-27T02:45:00Z
**HEAD verificado:** `b95a2e8` (branch `gsd/phase-01-esqueleto-no-ar-com-testes-e-ci`, 13 commits de docs/teste/fix à frente de `origin/main` = `e92302e`)
**Status:** passed
**Re-verificação:** Sim. O relatório anterior (human_needed, 5/5) ficou obsoleto porque arquivos cobertos mudaram: correções do code review (WR-01/02/04/05 e a segunda rodada WR-01 `digitsOnly` e WR-02/IN-04 dos runbooks) e a evidência humana do UAT.
**Modo:** mvp (a meta é uma user story válida; o resultado "toda funcionalidade nasça testada e implantada" foi checado pelas verdades abaixo)

Resumo: as cinco verdades do ROADMAP continuam comprovadas no HEAD atual, sem regressão. Os seis itens humanos do relatório anterior foram executados e estão em `01-UAT.md` (status complete, 6/6 pass, cada um com linha `evidence:`); eles entram aqui como evidência humana, não como pendência. Não restam itens humanos, lacunas nem bloqueios. Há avisos não bloqueantes (ver "Anti-padrões" e "Observações").

## Atingimento do objetivo

### Verdades observáveis (critérios de sucesso do ROADMAP)

| # | Verdade | Status | Evidência |
|---|---------|--------|-----------|
| 1 | Qualquer pessoa abre o site na Vercel e vê dados da API NestJS na Render, servidor a servidor, por HTTPS; o mesmo container já subiu uma vez na Railway | VERIFIED | Consultas vivas agora: `GET https://blog-no-law-api.onrender.com/status` devolve `{service:"api", commit:"e92302ea...", db:"up"}`; a home da Vercel mostra `data-testid="api-commit"` = `e92302ea7288a803435f59b8c6802822ba8d724b` (= `origin/main`), `api-db` = `up` e `api-time` mudando a cada chamada. `apps/web/lib/api.ts` busca no servidor. Railway: boot único documentado em `docs/runbooks/plano-b-railway.md`; UAT 2 registra a issue `BLOG-NO-LAW-API-2` vinda do ambiente `railway-planob` (release `e92302e`), e UAT 3 registra a remoção do projeto (conta com zero projetos, `*.up.railway.app` responde 404), conforme D-11 (boot único, não standby). |
| 2 | Push com lint/typecheck/teste falhando é bloqueado pelo pre-push; PR para `main` só mergeia com CI verde (Vitest API+web com Postgres real, Playwright E2E com axe) | VERIFIED | `.husky/pre-push` e `scripts/verify-prepush.sh` não mudaram desde a prova ponta a ponta do relatório anterior (A/B/E bloqueados, C/D passam); `scripts/prepush-wiring.test.mjs` e `ci-gates.test.mjs` passam agora (`test:scripts`: 63/63). Ruleset `main-protegida` (via `gh api`, agora): `enforcement: active`, `bypass_actors: []`, regras `pull_request`, `required_status_checks` com contexto `ci-ok`, `deletion` e `non_fast_forward`. `ci.yml` `ci-ok` depende de lint, typecheck, test-api, test-web, e2e, secrets, postgrest-anon, docker-build e falha em `failure`/`cancelled`/`skipped`. PR #8 `MERGED` como `e92302e` com todos os checks SUCCESS (lint, typecheck, test-api, test-web, e2e, postgrest-anon, docker-build, secrets, ci-ok). |
| 3 | `/health` informa se a API vive e se o banco responde; erro provocado aparece no Sentry; logs em JSON estruturado, sem tokens nem segredos | VERIFIED | `health.controller.ts` (live sem dependência; ready e `/health` consultam o banco). Rodei agora `pnpm turbo run lint typecheck test test:http`: 13/13 tarefas ok; `test:http` 36/36, incluindo `logging.http-spec.ts` (11) e `sentry.http-spec.ts` (6, com envio ao ingest local pelo build real em ESM). Integração com Postgres real, que o relatório anterior havia pulado: subi `compose.test.yaml` e rodei `turbo run test:integration`: `db.int-spec.ts` 11 + `rls.int-spec.ts` 11 passam (inclui `/health/ready` 503 em menos de 3000 ms com banco derrubado e sem vazar credencial nos logs). Evidência humana (UAT 2): a issue `BLOG-NO-LAW-API-2` "Error: sentry-smoke" chegou ao Sentry em 2026-11-27T01:33Z, com stack trace e sem headers; ambiente `production` passou a aparecer depois de recolar o DSN na Render. Produção: `GET /_debug/error` retorna 404. |
| 4 | API rejeita entrada inválida, responde com headers do Helmet e recusa origens fora do CORS; CI falha se o web renderizar HTML bruto | VERIFIED | Produção agora: `GET /status?detail=bogus` retorna 400; preflight com `Origin: https://evil.example` retorna 404 sem nenhum `access-control-*`. `security.http-spec.ts` 14/14 passam (headers do Helmet, CSP `default-src 'none'`, `frame-ancestors 'none'`, HSTS, nosniff). `node scripts/check-no-raw-html.mjs` retorna `RAW_HTML_OK` no HEAD; os testes do gate (`check-no-raw-html.test.mjs`, incluindo as regressões do WR-04: ignora só no root web, varre `.mts/.cts/.cjs`) passam dentro dos 63/63. Gate ligado ao job `lint` da CI e a `pnpm run verify`. |
| 5 | Chamada anônima direta à Data API do Supabase não lê nenhuma tabela (RLS em todas, conferido pela CI); API usa papel sem bypass; backup noturno fora do Supabase, privado, restaurado uma vez; keep-alive diário impede a pausa | VERIFIED | `rls.int-spec.ts` 11/11 passam agora contra Postgres real (`supabase/postgres:17.12`): sem privilégios de `anon`/`authenticated`/`service_role`, RLS em toda tabela de `public`, `app_api` sem bypass e sem posse. A migration `20261122120000_revoke_function_execute` (WR-02) fecha também o EXECUTE de funções futuras para PUBLIC e para os papéis do Supabase, com teste em `rls.int-spec.ts`. Job `postgrest-anon` verde no PR #8. Backup: `backup.yml` na `main` usa `publishedAt` na retenção (linha 121; o prazo de 2026-12-20 foi cumprido pelo PR #8 em 2026-11-22). Runs agendados do Backup em `main` (`gh run list`): sucesso em 22, 23, 24 e 26/11; falha em 25/11 (HTTP 500 transitório da API do GitHub, já registrado como follow-up adiado em `01-UAT.md`). Drill de restauração `RESTORE_OK` registrado em `docs/runbooks/backup-restore.md` (relatório anterior). UAT 5: UptimeRobot com `/health/live` e `/health/ready` Up, 100% em 1 e 7 dias. |

**Pontuação:** 5/5 verdades verificadas, 0 presentes mas sem verificação comportamental.

### Itens humanos do relatório anterior (resolvidos no `01-UAT.md`)

| UAT | Item | Resultado | Evidência registrada |
|-----|------|-----------|----------------------|
| 1 | Sonda de trust proxy na Render | pass | Com hops=1 o `clientIp` era IP interno 10.x; `TRUST_PROXY_HOPS=3` aplicado (Deploy API run 45925442066) e a sonda `probe-1795744851` registrou `clientIp == cf-connecting-ip`. Regra corrigida em `docs/runbooks/render.md` (linha 26 mostra `3`). |
| 2 | Evento `sentry-smoke` no Sentry | pass | DSN com chave pública inexistente corrigido; issue `BLOG-NO-LAW-API-2` recebida. |
| 3 | Apagar o plano B na Railway | pass | Projeto apagado em 2026-11-26; conta com zero projetos. |
| 4 | Home de produção em janela limpa | pass | Home com commit, banco up e horário; `?detail=full` mostra latência (6 ms). Reconfirmei por curl agora (commit `e92302e`, db up). |
| 5 | UptimeRobot e primeiro backup agendado | pass | 100% de uptime; backups agendados com sucesso. Confirmado também por `gh run list`. |
| 6 | PR final na `main` antes de 2026-12-20 | pass | PR #8 mergeado em 2026-11-22 (`e92302e`), confirmado por `gh pr view`. |

### Artefatos obrigatórios

| Artefato | Esperado | Status | Detalhes |
|----------|----------|--------|----------|
| `packages/shared/src/status.ts` | Contrato Zod `/status` | VERIFIED | Usado pela API e por `apps/web/lib/api.ts` |
| `apps/api/src/app.setup.ts` | Helmet, CORS, pipe Zod, trust proxy | VERIFIED | Provado por `security.http-spec.ts` |
| `apps/api/src/config/env.ts` | Env validada por Zod, falha rápida | VERIFIED | `digitsOnly` (WR-01) presente em `PORT` e `TRUST_PROXY_HOPS`; `env.spec.ts` 14/14 (RED `2a9f473`, GREEN `9645002`) |
| `apps/api/src/health/health.controller.ts` | live/ready/health | VERIFIED | Coberto por `app.http-spec.ts` e `db.int-spec.ts` |
| `apps/api/prisma/migrations/*baseline*` e `*revoke_function_execute*` | `app_api` sem bypass, RLS, EXECUTE fechado | VERIFIED | `rls.int-spec.ts` 11/11 |
| `apps/api/src/instrument.ts`, `sentry-options.ts` | Sentry sem PII, vazio = ausente | VERIFIED | `sentry-options.spec.ts` e `sentry.http-spec.ts` |
| `apps/web/app/page.tsx` + `lib/api.ts` | Home RSC com dados da API | VERIFIED | Dados fluem em produção |
| `apps/web/e2e/home.spec.ts` | E2E + axe | VERIFIED | Job `e2e` verde no PR #8 (não reexecutado localmente) |
| `.husky/pre-push`, `scripts/verify-prepush.sh`, `turbo.json` | Portão local | VERIFIED | Arquivos de hook inalterados; wiring coberto por `prepush-wiring.test.mjs`; `turbo.json` agora passa `SENTRY_*` ao build (WR-05) |
| `.github/workflows/{ci,deploy-api,backup}.yml` | CI com `ci-ok`, deploy, backup | VERIFIED | Runs reais em `main` (ver acima) |
| `scripts/check-no-raw-html.mjs` | Gate de HTML bruto | VERIFIED | `RAW_HTML_OK`; testes de fixture insegura/segura passam |
| `docs/runbooks/*` (6) | Operação | VERIFIED | `render.md` e `plano-b-railway.md` atualizados (hops=3 medido; plano B não copia `TRUST_PROXY_HOPS`, mede com a sonda no host novo) |

### Verificação de ligações-chave

| De | Para | Via | Status | Detalhes |
|----|------|-----|--------|----------|
| `apps/web/app/page.tsx` | API `/status` | `getStatus()` servidor a servidor | WIRED | Home de produção mostra o commit da API |
| `StatusController` | `@blog/shared/status` | `@Query({ schema })` e `statusResponseSchema.parse` | WIRED | 400 em produção com `detail=bogus` |
| `main.ts` | `configureApp` | chamada direta | WIRED | Testes HTTP usam a mesma função |
| `loadEnv` | `TRUST_PROXY_HOPS` -> `app.setup.ts` | `digitsOnly` -> `trust proxy` | WIRED | `/__probe/ip` nos testes: com hops=1 devolve o último IP do XFF, com 2 o penúltimo, com 0 o socket |
| `HealthController` | banco | `DatabaseHealthIndicator` -> Prisma como `app_api` | WIRED | `db: up` em produção; 503 com banco caído (`db.int-spec.ts`) |
| `ci.yml` `ci-ok` | ruleset `main-protegida` | `required_status_checks` | WIRED | Confirmado via `gh api` agora |
| CI na `main` | `deploy-api.yml` | `workflow_run` / dispatch | WIRED | Último Deploy API `success` em `e92302e` |
| `backup.yml` | repositório privado e `heartbeat` | `pg_dump | age` + `gh release create` | WIRED | Runs agendados com sucesso |
| `check-no-raw-html.mjs` | CI e pre-push | job `lint` e `verify` | WIRED | Presente nos dois |
| `turbo.json` | `next build` (Sentry) | `passThroughEnv` | WIRED | WR-05 corrigido com teste de wiring (`64ad2b9`, `63b213b`) |

### Rastreio de fluxo de dados (Nível 4)

| Artefato | Variável | Fonte | Produz dado real | Status |
|----------|----------|-------|------------------|--------|
| `apps/web/app/page.tsx` | `result.data` (commit, db, time) | `/status` -> `SELECT` em `heartbeat` como `app_api` | Sim (commit = SHA da `main`, horário muda por chamada) | FLOWING |
| `HealthController.ready` | estado do banco | `DatabaseHealthIndicator` -> consulta real | Sim | FLOWING |

### Verificações comportamentais

| Comportamento | Comando | Resultado | Status |
|---------------|---------|-----------|--------|
| Lint, typecheck, unit e HTTP | `pnpm turbo run lint typecheck test test:http` | 13/13 tarefas ok; `test:http` 36/36 | PASS |
| `env.ts` (WR-01 `digitsOnly`) | `vitest run --project unit src/config/env.spec.ts` | 14/14 | PASS |
| Integração com Postgres real | `docker compose -f compose.test.yaml up -d --wait` + `turbo run test:integration` | `db.int-spec` 11 + `rls.int-spec` 11 passam; `set-app-api-password` 6/6 | PASS |
| Testes dos scripts da raiz | `pnpm run test:scripts` | 63 passam, 0 falham | PASS |
| Gate de HTML bruto | `node scripts/check-no-raw-html.mjs` | `RAW_HTML_OK` (exit 0) | PASS |
| Formatação | `prettier --check .` | todos os arquivos conformes | PASS |
| Produção: web e API | `curl` na home e em `/status` | 200, commit `e92302e`, db `up` | PASS |
| Produção: validação | `GET /status?detail=bogus` | 400 | PASS |
| Produção: CORS | preflight com origem `evil.example` | 404, sem `access-control-*` | PASS |
| Produção: rota de debug | `GET /_debug/error` | 404 | PASS |
| E2E Playwright + axe | não reexecutado aqui | Evidência: job `e2e` SUCCESS no PR #8 (merge `e92302e`); nenhum arquivo de `apps/web` mudou depois | SKIP, coberto pela CI |
| `verify-prepush.sh` (A/B/C/D/E) | não reexecutado aqui | Hook e script inalterados desde a prova anterior; wiring testado em `prepush-wiring.test.mjs` | SKIP, coberto por evidência anterior e teste de wiring |

O container Postgres de teste foi derrubado ao final (`docker compose down`); nenhum arquivo-fonte foi alterado.

### Execução de sondas

Não há `probe-*.sh` convencionais. As sondas equivalentes (`verify-prepush.sh`, `smoke-postgrest.sh`, `verify-remote-api.sh`, `restore-drill.sh`, `smoke-container.sh`, `wait-for-commit.sh`) têm testes em `scripts/*.test.mjs`, todos passando em `test:scripts` (63/63). A sonda de trust proxy da Render foi executada pelo autor e registrada no UAT 1.

### Cobertura de requisitos

IDs de todos os `requirements:` dos 14 PLAN.md, comparados com REQUIREMENTS.md e com o ROADMAP (QA-01, QA-02, QA-03, QA-04, OPS-01, OPS-02, OPS-03, SEC-03, SEC-04):

| Requisito | Planos | Descrição | Status | Evidência |
|-----------|--------|-----------|--------|-----------|
| QA-01 | 01-01, 01-02, 01-03, 01-04, 01-05 | Vitest na API e no web, incluindo Postgres real | SATISFIED | `test`, `test:http`, `test:integration` rodados agora; `test-api` na CI com Postgres real |
| QA-02 | 01-10 | Playwright E2E com axe | SATISFIED | `home.spec.ts` com `AxeBuilder`; job `e2e` verde no PR #8 |
| QA-03 | 01-08 | Pre-push bloqueia lint, typecheck e testes | SATISFIED | `.husky/pre-push` -> `pnpm run verify`; prova ponta a ponta do relatório anterior; wiring testado |
| QA-04 | 01-09, 01-10, 01-12 | CI no GitHub Actions; `main` protegida | SATISFIED | Ruleset ativo com `ci-ok`, sem bypass; PR #8 mergeado com tudo verde |
| OPS-01 | 01-02, 01-05, 01-07, 01-10, 01-11 | Logs estruturados, Sentry, health check | SATISFIED | Testes de logging/Sentry/health; issue no Sentry confirmada (UAT 2) |
| OPS-02 | 01-11, 01-12 | Vercel + API em Docker na Render com HTTPS; Railway testado ao menos uma vez | SATISFIED | Produção respondendo; boot da Railway documentado e provado por evento no Sentry (UAT 2); serviço removido (UAT 3) |
| OPS-03 | 01-13 | Backup noturno externo e privado; keep-alive | SATISFIED | Runs agendados com sucesso, drill `RESTORE_OK`, retenção por `publishedAt` na `main`, UptimeRobot 100% |
| SEC-03 | 01-01, 01-02, 01-03, 01-07, 01-09, 01-14 | Validação, Helmet, CORS, sem HTML bruto | SATISFIED | Verdade 4 |
| SEC-04 | 01-04, 01-05, 01-06, 01-09, 01-14 | RLS em todas as tabelas, API com papel sem bypass | SATISFIED | Verdade 5 |

Requisitos órfãos: nenhum. REQUIREMENTS.md mapeia exatamente esses 9 IDs à Fase 1 e todos aparecem em pelo menos um plano.

Pendência de rastreabilidade (documental, não de código): em `.planning/REQUIREMENTS.md` só QA-04, OPS-02 e OPS-03 estão `[x]/Complete`; QA-01, QA-02, QA-03, OPS-01, SEC-03 e SEC-04 continuam `[ ]/Pending` e devem ser marcados quando a fase for aceita (feito pelo fechamento da fase, não por este verificador).

### Anti-padrões encontrados

| Arquivo | Linha | Padrão | Severidade | Impacto |
|---------|-------|--------|------------|---------|
| (arquivos da fase) | n/a | `TBD`/`FIXME`/`XXX`, `TODO`/`HACK`/`PLACEHOLDER` | Nenhum | Varredura em apps, packages, scripts, .github, .husky, docs e ops: zero ocorrências |
| `status.service.ts`, `health.controller.ts` | n/a | WR-03: endpoints públicos que consultam o banco sem cache nem limite | Aviso (adiado) | Rate limit é SEC-02 na Fase 7; `01-REVIEW-DISPOSITION.md` marca `deferred` com motivo |
| `scripts/smoke-postgrest.sh` | 57, 77-80 | WR-06: smoke pós-deploy trata 404/5xx como bloqueado e cobre duas tabelas fixas | Aviso (adiado) | O portão pré-merge é estrito e foi provado; ampliar a lista quando a Fase 3+ criar tabelas |
| `.github/workflows/backup.yml` | n/a | Sem retry no `gh release create` com 5xx do GitHub | Aviso (adiado) | Backup de 25/11 perdido por HTTP 500 transitório; follow-up registrado em `01-UAT.md` |
| IN-01, IN-02, IN-03, IN-05, IN-06 | n/a | Informativos do review | Info (adiados) | Todos `deferred` com motivo em `01-REVIEW-DISPOSITION.md` (`open: 0`) |

Corrigidos e verificados nesta rodada: WR-01 (env vazio/espaço/`0x2`, `digitsOnly`), WR-02 (migration de EXECUTE e runbook do plano B), WR-04 (gate de HTML bruto), WR-05 (Sentry no build via Turborepo) e IN-04 (datas dos runbooks em UTC). Nenhum aviso adiado bloqueia a meta.

### Observações (não bloqueiam)

- **Branch à frente da produção.** Produção roda `e92302e` (= `origin/main`). Os commits posteriores da branch (13, `b95a2e8` no HEAD) ainda não foram mergeados nem estão todos no remoto (`origin/gsd/phase-01...` está em `88e8ae5`). A correção WR-01 em `apps/api/src/config/env.ts` está só na branch, não implantada. Impacto na produção hoje: nenhum, pois `TRUST_PROXY_HOPS=3` e `PORT` já são dígitos decimais puros e passam por `digitsOnly` sem mudar de valor. O merge do PR de fechamento aplicará a correção.
- **Evidência de CI.** O E2E e a CI completa vêm do PR #8 (merge `e92302e`); os commits posteriores da branch mexem em `env.ts`/`env.spec.ts`, runbooks e documentação, e a parte de código foi reexecutada localmente (unit, HTTP, integração, scripts) com sucesso.

### Itens para verificação humana

Nenhum. Os seis itens do relatório anterior estão resolvidos em `01-UAT.md` (6/6 pass).

### Resumo das lacunas

Não há lacunas. O esqueleto Next + NestJS + Supabase está em produção (`e92302e`), protegido por pre-push, CI obrigatória na `main` (ruleset sem bypass, `ci-ok`), RLS provado no banco e por um PostgREST real na CI, observabilidade (logs JSON redigidos, health, Sentry com evento recebido) e backup cifrado agendado com restauração comprovada. Status `passed`.

---

_Verificado: 2026-11-27T02:45:00Z_
_Verificador: Claude (gsd-verifier)_
