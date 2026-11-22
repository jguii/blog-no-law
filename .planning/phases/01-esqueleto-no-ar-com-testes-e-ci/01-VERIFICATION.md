---
phase: 01-esqueleto-no-ar-com-testes-e-ci
verified: 2026-11-21T23:10:00Z
status: human_needed
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
  - "apps/api/prisma/migrations/20261117120000_baseline/migration.sql"
  - "apps/api/src/app.setup.ts"
  - "apps/api/src/health/health.controller.ts"
  - "apps/api/src/instrument.ts"
  - "apps/api/src/status/status.controller.ts"
  - "apps/api/test/rls.int-spec.ts"
  - "apps/api/test/security.http-spec.ts"
  - "apps/web/app/page.tsx"
  - "apps/web/e2e/home.spec.ts"
  - "apps/web/lib/api.ts"
  - "package.json"
  - "scripts/check-no-raw-html.mjs"
  - "scripts/verify-prepush.sh"
  - "turbo.json"
covered_digest: "v4:sha256:a9954fb0f3fb0b1795d50908a57667fb9e42d6b50e35b4276b8f67a016e4513c"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Render > Logs: achar a linha de log com x-request-id probe-1795226167, ler o campo clientIp e comparar com o IP público da máquina de origem; ajustar TRUST_PROXY_HOPS conforme docs/runbooks/render.md (secao 'Sonda do trust proxy')"
    expected: "clientIp igual ao IP público do cliente mantém TRUST_PROXY_HOPS=1; IP interno da Render/Cloudflare pede TRUST_PROXY_HOPS=2. O runbook ainda registra 'pendente (1 até a leitura)'."
    why_human: "O painel de logs da Render não é acessível pelo verificador; o número de proxies à frente da Render não é documentado oficialmente."
  - test: "Sentry (projeto blog-no-law-api): confirmar que chegou a issue 'sentry-smoke' (environments render/production e railway-planob; x-request-id sentry-smoke-20261121T015607Z listado em docs/runbooks/plano-b-railway.md)"
    expected: "Issue 'Error: sentry-smoke' visível, sem headers, cookies, corpo nem query string anexados (dataCollection desligado)."
    why_human: "O painel do Sentry exige login do autor. O envio pelo SDK sobre o build real em ESM foi provado por teste automatizado contra um ingest local (apps/api/test/sentry.http-spec.ts), mas o recebimento no serviço externo não é verificável daqui."
  - test: "Railway: apagar o serviço do plano B (Settings -> Delete service)"
    expected: "Nenhum serviço consumindo o trial de US$ 5; a evidência do boot único permanece em docs/runbooks/plano-b-railway.md."
    why_human: "Ação manual no painel da Railway. O serviço mantém /_debug/error ligado, o que o torna uma superfície desnecessária enquanto existir."
  - test: "Abrir https://blog-no-law.vercel.app numa janela anônima e clicar em 'Ver detalhes'"
    expected: "A home mostra serviço, versão, commit (= SHA da main), banco 'up' e, após o clique, 'Latência do banco' em ms."
    why_human: "Verificação visual/real no navegador. Por curl já confirmei HTTP 200, commit fa5ee76 e api-db=up, mas a latência só aparece com ?detail=full renderizado no navegador."
  - test: "UptimeRobot: conferir que os monitores de /health/live e /health/ready estão Up há várias horas, sem quedas longas"
    expected: "Dois monitores de 5 min com histórico Up contínuo."
    why_human: "Só o autor vê o painel; o histórico de horas ainda não existe (plano 01-13, tarefa 3). Relacionado: o primeiro disparo agendado do Backup (cron 17 5 * * *) ainda não aconteceu; só há o run manual (workflow_dispatch). Conferir amanhã que o run por schedule aparece e termina em sucesso."
  - test: "PRAZO: fazer o PR final da fase (/gsd-ship) chegar na main antes de 2026-12-20"
    expected: "backup.yml da main passa a usar publishedAt na retenção (hoje a main ainda usa createdAt)."
    why_human: "Decisão de calendário. O repositório de backups tem um único commit (2026-11-20); o createdAt de toda release herda essa data (docs/runbooks/backup-restore.md, linha 25). Cerca de 30 dias depois, a retenção da main apagaria todas as releases, inclusive a recém-publicada. Confirmei por diff que backup.yml em origin/main ainda tem createdAt e o da branch da fase tem publishedAt."
---

# Phase 1: Esqueleto no ar com testes e CI. Relatório de verificação

**Objetivo da fase:** Como desenvolvedor do Blog No Law, quero ter um esqueleto Next.js + NestJS + Supabase publicado em produção e protegido por testes, CI e backups, para que toda funcionalidade nasça testada e implantada desde o primeiro commit.
**Verificado em:** 2026-11-21T23:10:00Z
**Status:** human_needed
**Re-verificação:** Não, verificação inicial.
**Modo:** mvp (a meta é uma user story válida; o resultado "toda funcionalidade nasça testada e implantada" foi checado pelas verdades abaixo)

Resumo: nenhuma lacuna de código encontrada. As cinco verdades do ROADMAP estão comprovadas por código, por testes que rodei agora e por consultas vivas à produção e ao GitHub. Restam apenas itens humanos (painéis externos, uma leitura de log, uma exclusão manual na Railway) e um prazo de calendário (retenção do backup na main).

## Atingimento do objetivo

### Verdades observáveis (critérios de sucesso do ROADMAP)

| # | Verdade | Status | Evidência |
|---|---------|--------|-----------|
| 1 | Qualquer pessoa abre o site na Vercel e vê dados da API NestJS na Render, servidor a servidor, por HTTPS; o mesmo container já subiu uma vez na Railway | VERIFIED | `curl https://blog-no-law.vercel.app/` retorna HTTP 200, `x-vercel-id: gru1::iad1::...`, `data-testid="api-commit"` = `fa5ee76aabf1a349410694e669458393e514dfb6` e `api-db` = `up`. `GET https://blog-no-law-api.onrender.com/status` devolve JSON `{service, version, commit=fa5ee76..., db:"up"}`. `apps/web/lib/api.ts` busca no servidor (RSC, `API_URL` sem prefixo público, `AbortSignal.timeout(5000)`, degradação para "API indisponível"). Railway: boot único documentado em `docs/runbooks/plano-b-railway.md` (URL, data, REMOTE_API_OK com `--expect-debug`); não consigo reconfirmar ao vivo porque o serviço é de boot único por decisão D-11. |
| 2 | Push com lint/typecheck/teste falhando é bloqueado pelo pre-push; PR para `main` só mergeia com CI verde (Vitest API+web com Postgres real, Playwright E2E com axe) | VERIFIED | Rodei `bash scripts/verify-prepush.sh`: caso A (teste falhando) bloqueado, B (erro de tipo) bloqueado, E (promessa flutuante, lint) bloqueado, C (limpo) passa, D (repetido) passa com FULL TURBO, `PREPUSH_VERIFY_OK`, working tree intacta. `core.hooksPath=.husky/_`; `.husky/pre-push` roda `docker compose up --wait` e `pnpm run verify`. Ruleset ativo `main-protegida` (via `gh api`): sem bypass, exige PR, `required_status_checks: ci-ok`, bloqueia deleção e non-fast-forward. `ci.yml`: `ci-ok` agrega lint, typecheck, test-api (Postgres `supabase/postgres:17.12`), test-web, e2e (Playwright + `@axe-core/playwright`, WCAG A/AA), postgrest-anon, docker-build, secrets; trata `skipped` e `cancelled` como falha. PR #7 `MERGED` como `fa5ee76` com todos os checks SUCCESS (inclusive `ci-ok`). |
| 3 | `/health` informa se a API vive e se o banco responde; erro provocado aparece no Sentry; logs em JSON sem tokens nem segredos | VERIFIED (a chegada no painel do Sentry é item humano) | `health.controller.ts`: `live` sem dependência (health check da Render), `ready` e `/health` consultam o banco via `DatabaseHealthIndicator` (503 se cair). Rodei `turbo run lint typecheck test test:http`: 13/13 tarefas ok; `test:http` 36 testes ok, incluindo `logging.http-spec.ts` (11: JSON válido, `authorization`/`cookie`/`x-api-key` viram `[REDACTED]`, token literal nunca na saída, `req.id` por requisição) e `sentry.http-spec.ts` (6: `/_debug/error` 404 sem flag, 500 sem stack com flag, SDK envia envelope com `sentry-smoke` a um ingest local, boot real por `node --import ./dist/instrument.js`). Em produção, `/_debug/error` responde 404. `instrument.ts` desliga PII (`dataCollection`). A issue no painel do Sentry fica no item humano 2. |
| 4 | API rejeita entrada inválida, responde com headers do Helmet e recusa origens fora do CORS; CI falha se o web renderizar HTML bruto | VERIFIED | `app.setup.ts`: `StandardSchemaValidationPipe` global, Helmet (CSP `default-src 'none'`, `frame-ancestors 'none'`), CORS por allowlist exata sem credenciais, `trust proxy` por contagem de hops. Em produção: `GET /status?detail=bogus` retorna 400; preflight de `Origin: https://evil.example` retorna 404 sem nenhum `access-control-*`; resposta traz `content-security-policy`, `strict-transport-security`, `x-content-type-options: nosniff`. `security.http-spec.ts` (14 testes) passou. Gate de HTML bruto: `check-no-raw-html.mjs --root .../unsafe` sai com código 1 e imprime `page.tsx:4`; `--root .../safe` sai 0 com `RAW_HTML_OK`; `apps/web` real: `RAW_HTML_OK`. Ligado no job `lint` da CI e em `pnpm run verify` (pre-push); ESLint `react/no-danger: error` como primeira camada. |
| 5 | Chamada anônima direta à Data API do Supabase não lê nenhuma tabela (RLS ativo em todas, conferido pela CI); API usa papel sem bypass; backup noturno fora do Supabase, privado, restaurado uma vez; keep-alive diário impede a pausa | VERIFIED (com ressalvas registradas nos itens humanos 5 e 6) | `migration.sql` baseline: `app_api` criado com `LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE`, `ALTER DEFAULT PRIVILEGES ... REVOKE ALL` de `anon/authenticated/service_role`, RLS em `heartbeat` e `_prisma_migrations`, `app_api` só com `SELECT` e política própria. `rls.int-spec.ts` cobre: nenhum privilégio de `anon`/`authenticated`/`service_role`, RLS ativo em toda tabela de `public`, `app_api` sem privilégios de administração, não dono de tabela, `UPDATE`/`INSERT` negados com 42501. Job `postgrest-anon` da CI sobe um PostgREST real (imagem por digest) sobre as migrations e exige GET anônimo bloqueado em toda relação de `public`, com autoteste que provoca um vazamento e exige o `LEAK`; passou no PR #7. Deploy API run 44957670712 `success` com `POSTGREST_ANON_BLOCKED` em produção. Backup: `backup.yml` (heartbeat `UPDATE` + `pg_dump -Fc | age` + release em repositório privado + retenção depois do upload), run 44957527489 `success`, release `db-20261121T223555Z` (10113 bytes, `.dump.age`); drill registrado em `docs/runbooks/backup-restore.md` linha 86: `RESTORE_OK tag=db-20261121T223555Z seconds=8`; `HEARTBEAT_FRESH`. O repositório de backups é privado (decisão registrada; a variável `BACKUP_REPO` fica em environment e não pude lê-la, o que é o comportamento desejado). |

**Pontuação:** 5/5 verdades verificadas, 0 presentes mas sem verificação comportamental.

### Artefatos obrigatórios

| Artefato | Esperado | Status | Detalhes |
|----------|----------|--------|----------|
| `packages/shared/src/status.ts` | Contrato Zod `/status` | VERIFIED | Usado por `status.controller.ts` (query e saída) e `apps/web/lib/api.ts` (parse da resposta) |
| `apps/api/src/app.setup.ts` | Helmet, CORS, pipe Zod, trust proxy | VERIFIED | Chamado por `main.ts` e pelos testes HTTP |
| `apps/api/src/health/health.controller.ts` | live/ready/health | VERIFIED | Indicador consulta `heartbeat`; coberto por `app.http-spec.ts` |
| `apps/api/prisma/migrations/20261117120000_baseline/migration.sql` | app_api sem bypass, RLS | VERIFIED | Provado por `rls.int-spec.ts` e pelo PostgREST na CI |
| `apps/web/app/page.tsx` + `lib/api.ts` | Home RSC com dados da API | VERIFIED | Dados fluem (ver Data-Flow) |
| `apps/web/e2e/home.spec.ts` | E2E + axe | VERIFIED | 3 cenários `@e2e` mapeados em `docs/bdd/home.feature.md` |
| `.husky/pre-push`, `scripts/verify-prepush.sh`, `turbo.json` | Portão local | VERIFIED | Prova ponta a ponta executada agora |
| `.github/workflows/ci.yml` | CI com `ci-ok` | VERIFIED | SHAs fixados, permissões mínimas, `persist-credentials: false` |
| `.github/workflows/deploy-api.yml` | Imagem, migration, hook, verificação | VERIFIED | Só dispara de `push` na `main` do próprio repositório |
| `.github/workflows/backup.yml` | Backup cifrado + keep-alive | VERIFIED (na branch); ver ressalva da main | Run manual com sucesso; main ainda com `createdAt` |
| `scripts/check-no-raw-html.mjs` | Gate de HTML bruto | VERIFIED | Fixture insegura falha, segura passa |
| `scripts/restore-drill.sh` | Restore cronometrado | VERIFIED | 6 testes + drill real registrado |
| `docs/runbooks/*` (6) | Operação | VERIFIED | render, plano-b-railway, supabase-producao, deploy, backup-restore, rotacao-segredos existem |

### Verificação de ligações-chave

| De | Para | Via | Status | Detalhes |
|----|------|-----|--------|----------|
| `apps/web/app/page.tsx` | `apps/api` `/status` | `getStatus()` -> `fetch(API_URL/status?detail=)` servidor a servidor | WIRED | Confirmado em produção: a home mostra o commit da API |
| `StatusController` | `@blog/shared/status` | `@Query({ schema })` e `statusResponseSchema.parse` | WIRED | Entrada e saída validadas |
| `main.ts` | `configureApp` | chamada direta | WIRED | Os testes HTTP usam a mesma função |
| `HealthController` | banco | `DatabaseHealthIndicator` -> probe Prisma como `app_api` | WIRED | `db: up` em produção |
| `.husky/pre-push` | `pnpm run verify` | script do hook | WIRED | Provado por `verify-prepush.sh` |
| `ci.yml` `ci-ok` | ruleset `main-protegida` | `required_status_checks` com contexto `ci-ok` | WIRED | Confirmado via `gh api` |
| `ci.yml` (push na main) | `deploy-api.yml` | `workflow_run` | WIRED | Deploy run 44957670712 disparado pelo CI da main |
| `backup.yml` | `heartbeat` e repositório privado | `psql update` + `gh release create` | WIRED | Run 44957527489 e `HEARTBEAT_FRESH` |
| `check-no-raw-html.mjs` | CI e pre-push | job `lint` e script `verify` | WIRED | Presente nos dois |

### Rastreio de fluxo de dados (Nível 4)

| Artefato | Variável | Fonte | Produz dado real | Status |
|----------|----------|-------|------------------|--------|
| `apps/web/app/page.tsx` | `result.data` (commit, db, time) | `/status` da API -> `SELECT` em `heartbeat` como `app_api` | Sim (commit de produção = SHA da main, horário muda a cada chamada) | FLOWING |
| `HealthController.ready` | estado do banco | `DatabaseHealthIndicator` -> consulta real | Sim | FLOWING |

### Verificações comportamentais

| Comportamento | Comando | Resultado | Status |
|---------------|---------|-----------|--------|
| Pre-push bloqueia o que deve | `bash scripts/verify-prepush.sh` | A, B, E bloqueados; C e D passam; `PREPUSH_VERIFY_OK` | PASS |
| Testes dos scripts da raiz | `pnpm run test:scripts` | 59 passam, 0 falham | PASS |
| Gate de HTML bruto | `node scripts/check-no-raw-html.mjs` (real, unsafe, safe) | `RAW_HTML_OK`; unsafe sai 1 com `page.tsx:4`; safe sai 0 | PASS |
| Lint, typecheck, unit e HTTP | `pnpm turbo run lint typecheck test test:http` | 13/13 tarefas ok (cache FULL TURBO); `test:http` 36/36 | PASS |
| Produção: web | `curl https://blog-no-law.vercel.app/` | 200, `iad1`, commit `fa5ee76`, db `up` | PASS |
| Produção: validação | `GET /status?detail=bogus` | 400 | PASS |
| Produção: CORS | preflight com origem `evil.example` | sem `access-control-*` | PASS |
| Produção: rota de debug | `GET /_debug/error` | 404 | PASS |
| Integração com Postgres (rls, db) | não reexecutada aqui: o Postgres de teste do compose não estava no ar | Prova vem da CI (PR #7, `test-api` e `postgrest-anon` verdes) e do `pnpm run verify` local informado pelo orquestrador | SKIP, coberta por evidência da CI |

### Execução de sondas

Não há `probe-*.sh` convencionais neste repositório. As sondas equivalentes são `scripts/verify-prepush.sh`, `scripts/smoke-postgrest.sh`, `scripts/verify-remote-api.sh` e `scripts/restore-drill.sh`, cada uma com testes em `scripts/*.test.mjs` (todos passando em `test:scripts`). `verify-prepush.sh` rodei; as demais dependem de segredos ou de Docker de produção e vêm da evidência dos runs de CI e do deploy.

### Cobertura de requisitos

Os IDs de todos os `requirements:` dos 14 PLAN.md, comparados com REQUIREMENTS.md:

| Requisito | Planos | Descrição | Status | Evidência |
|-----------|--------|-----------|--------|-----------|
| QA-01 | 01-01, 01-02, 01-03, 01-04, 01-05 | Vitest na API e no web, incluindo Postgres real | SATISFIED | `test`, `test:http`, `test:integration` em ambos; `test-api` na CI com `supabase/postgres:17.12` |
| QA-02 | 01-10 | Playwright E2E com axe | SATISFIED | `apps/web/e2e/home.spec.ts` com `AxeBuilder` (WCAG A/AA); job `e2e` na CI, verde no PR #7 |
| QA-03 | 01-08 | Pre-push bloqueia lint, typecheck e testes | SATISFIED | `verify-prepush.sh` executado agora, `PREPUSH_VERIFY_OK` |
| QA-04 | 01-09, 01-10, 01-12 | CI no GitHub Actions; `main` protegida exige checks verdes | SATISFIED | Ruleset `main-protegida` ativo com `ci-ok`; PR #7 mergeado com tudo verde |
| OPS-01 | 01-02, 01-05, 01-07, 01-10, 01-11 | Logs estruturados, Sentry, health check | SATISFIED no código; chegada ao Sentry é item humano | Ver verdade 3 |
| OPS-02 | 01-11, 01-12 | Vercel + API em Docker na Render com HTTPS; Railway testado ao menos uma vez | SATISFIED | Produção respondendo; boot da Railway documentado; serviço da Railway ainda precisa ser apagado (item humano 3) |
| OPS-03 | 01-13 | Backup noturno externo e privado; keep-alive | SATISFIED na execução manual; ver prazo | Run 44957527489, drill `RESTORE_OK`, `HEARTBEAT_FRESH`; primeiro run agendado e retenção da main nos itens humanos 5 e 6 |
| SEC-03 | 01-01, 01-02, 01-03, 01-07, 01-09, 01-14 | Validação, Helmet, CORS, sem HTML bruto | SATISFIED | Ver verdade 4 |
| SEC-04 | 01-04, 01-05, 01-06, 01-09, 01-14 | RLS em todas as tabelas, API com papel sem bypass | SATISFIED | Ver verdade 5 |

Requisitos órfãos: nenhum. REQUIREMENTS.md mapeia exatamente QA-01..04, OPS-01..03, SEC-03 e SEC-04 à Fase 1, e todos aparecem em pelo menos um plano.

Pendência de rastreabilidade (não é lacuna de código): em `.planning/REQUIREMENTS.md` só QA-04, OPS-02 e OPS-03 estão marcados `[x]/Complete`. QA-01, QA-02, QA-03, OPS-01, SEC-03 e SEC-04 continuam `Pending` e devem ser marcados quando a fase for aceita.

### Anti-padrões encontrados

| Arquivo | Linha | Padrão | Severidade | Impacto |
|---------|-------|--------|------------|---------|
| (arquivos da fase) | n/a | `TBD`/`FIXME`/`XXX` | Nenhum | Varredura de apps, packages, scripts, .github, .husky, docs e ops: zero ocorrências |
| `apps/api/prisma/.../migration.sql` | 14-18 | Revoke de funções não cobre `PUBLIC` (REVIEW WR-02) | Aviso | Hoje não há função em `public`; vira problema na primeira função criada por migration futura |
| `apps/api/src/config/env.ts` | 10-38 | String vazia tratada de forma inconsistente (WR-01) | Aviso | `TRUST_PROXY_HOPS=''` vira 0 em silêncio |
| `apps/api/src/status/status.service.ts`, `health.controller.ts` | n/a | Endpoints públicos que consultam o banco sem cache/limite (WR-03) | Aviso | Throttle só chega na Fase 7 (SEC-02) |
| `scripts/check-no-raw-html.mjs` | 14-21, 48-57 | Ignora diretórios por nome e extensões `.mts/.cts/.cjs` (WR-04) | Aviso | Segunda camada de SEC-03 tem furos teóricos; a primeira (ESLint) cobre o caso comum |
| `turbo.json` / `next.config.ts` | n/a | `SENTRY_AUTH_TOKEN` não passa ao build (WR-05) | Aviso | Source maps do web não sobem |
| `scripts/smoke-postgrest.sh` | 57, 77-80 | Smoke de produção aceita 404/5xx como bloqueado (WR-06) | Aviso | O portão pré-merge é estrito e foi provado; o smoke pós-deploy é mais fraco que parece |

Os seis avisos vêm de `01-REVIEW.md` (0 críticos); `01-REVIEW-DISPOSITION.md` os mantém `open`. Nenhum bloqueia a meta da fase. Recomendo tratá-los na Fase 3 ou antes (WR-02 antes de qualquer função SQL; WR-01 junto com a leitura do `clientIp`).

### Itens para verificação humana

Detalhados no frontmatter (`human_verification`):

1. Leitura de `clientIp` na Render e ajuste de `TRUST_PROXY_HOPS`.
2. Issue `sentry-smoke` no Sentry.
3. Apagar o serviço da Railway.
4. Home de produção em janela anônima com "Ver detalhes" mostrando latência.
5. UptimeRobot Up por várias horas e primeiro run agendado do Backup.
6. Prazo: levar o PR final da fase à main antes de 2026-12-20, por causa da retenção por `createdAt` ainda presente na `main`.

### Resumo das lacunas

Não há lacunas que bloqueiem a meta. A fase entrega um esqueleto Next + NestJS + Supabase em produção, protegido por pre-push, CI obrigatória na `main`, RLS provado no banco e por um PostgREST real na CI, observabilidade (logs JSON redigidos, health, Sentry no código) e backup cifrado com restauração comprovada. O que sobra são conferências em painéis externos e um prazo de calendário, que por isso classificam o status como `human_needed` e não `passed`. A produção atual (`fa5ee76`) é idêntica à branch da fase em `apps/` e `packages/` (diff vazio contra `origin/main`); só `backup.yml`, scripts e documentação diferem.

---

_Verificado: 2026-11-21T23:10:00Z_
_Verificador: Claude (gsd-verifier)_
