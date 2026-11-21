---
phase: "1"
slug: "esqueleto-no-ar-com-testes-e-ci"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-15"
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.12 (`@blog/shared`, `@blog/api`, `@blog/web` com projetos `unit` e `int`); Supertest 7.3.2 (testes `test:http` da API); Playwright 1.65.1 + `@axe-core/playwright` 4.14.0 (E2E, só na CI); `node:test` (testes da raiz, rodados pelo `test:scripts`: gates do 01-14, ligação do pre-push do 01-08, ligação da CI do 01-09, e scripts e workflows de deploy e backup do 01-11 ao 01-13, com servidor HTTP falso ou executáveis falsos no `PATH`, sem Docker, rede externa nem produção); scripts bash de prova (`smoke-local.sh`, `verify-prepush.sh`, `smoke-container.sh`, `verify-remote-api.sh`, `wait-for-commit.sh`, `restore-drill.sh`); Postgres real `supabase/postgres` 17 por `compose.test.yaml` (local) e `services` (CI) |
| **Config file** | Nenhum existe hoje (greenfield). Nascem nos tracers: Vitest do `packages/shared` (01-01), `apps/api/vitest.config.ts` (01-02, projeto de integração no 01-04), `apps/web/vitest.config.ts` (01-03), `compose.test.yaml` (01-04), `turbo.json` e `.husky/pre-push` (01-08), `.github/workflows/ci.yml` (01-09), `apps/web/playwright.config.ts` (01-10) |
| **Quick run command** | `pnpm turbo run lint typecheck test` (a partir da wave 7, quando o 01-08 cria o `turbo.json`); nas waves 1 a 6, o `<automated>` da própria tarefa (por exemplo `pnpm --filter @blog/api test`) |
| **Full suite command** | Local: `docker compose -f compose.test.yaml up -d --wait && pnpm run verify` (a partir da wave 8: `format:check`, `check:raw-html`, `test:scripts` e `turbo run lint typecheck test test:http test:integration`). CI: o check `ci-ok` (acrescenta `test-web`, `postgrest-anon`, `secrets`, `e2e` e `docker-build`) |
| **Estimated runtime** | Estimativa, sem medição: rápido ~30 a 60 segundos com o cache do Turborepo; suíte local ~180 a 300 segundos; `ci-ok` ~8 a 12 minutos |

---

## Sampling Rate

- **After every task commit:** Run o `<automated>` da tarefa (mapa abaixo); a partir da wave 7, também `pnpm turbo run lint typecheck test`
- **After every plan wave:** waves 1 a 3: `pnpm -r run test` (e `pnpm --filter @blog/web test:integration` a partir da wave 3); waves 4 a 6: acrescentar `docker compose -f compose.test.yaml up -d --wait && pnpm --filter @blog/api test:integration` e `node --test scripts/` (wave 6); wave 7 em diante: `pnpm run verify` com o compose no ar; wave 8 em diante: `ci-ok` verde no último run da branch da fase
- **Before `/gsd-verify-work`:** `ci-ok` verde no PR da fase, smokes de produção verdes (`smoke-postgrest.sh`, `verify-remote-api.sh`, `restore-drill.sh`) e os itens da tabela Manual-Only conferidos
- **Max feedback latency:** 60 seconds para os comandos locais por tarefa. Exceções declaradas com `<latency>accepted-slow</latency>` nos planos: 01-11 Task 1 (build da imagem, 2 a 6 min) e Task 3 (cold start da Render, até 5 min), 01-12 Task 1 (deploy real, 5 a 12 min) e Task 3 (até 2 min). As checagens que leem o resultado do run da CI (01-09 Tasks 2 e 3, 01-10 Tasks 1 e 2) só consultam a API do GitHub (segundos), mas o run que elas leem leva o tempo do Actions (~8 a 12 min)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | QA-01 | T-01-SC | Nenhum pacote npm é instalado sem aprovação humana; os SUS são mostrados ao autor | manual (checkpoint; exceção TDD: checkpoint humano) | — (checkpoint:human-verify) | n/a | ⬜ pending |
| 1-01-02 | 01 | 1 | QA-01, SEC-03 | T-01-01 | Só `.claude/CLAUDE.md` é rastreado em `.claude/`; o contrato Zod rejeita payload fora do schema | unit + contrato (TDD: RED sobre `status.ts` provisório com `z.any()`, falha em asserção, evidência TAP do Vitest) | `pnpm --filter @blog/shared test` (+ import do `dist` e checagem `git ls-files .claude` / `git check-ignore`) | ❌ RED na tarefa | ⬜ pending |
| 1-01-03 | 01 | 1 | — (D-01, D-02, D-11) | — | N/A | gate de documento (grep; exceção TDD: só documentação) | `for f in .claude/CLAUDE.md .planning/research/STACK.md; do ... grep -c '^### Infrastructure (Render + Railway + Docker)' ...; done` | ✅ arquivos existem | ⬜ pending |
| 1-02-01 | 02 | 2 | QA-01 | T-01-04 | `GET /status` de um processo Nest real devolve JSON válido pelo contrato | http + smoke de processo | `pnpm --filter @blog/shared build && pnpm --filter @blog/api test:http` (+ `node apps/api/dist/main.js` na porta 3101) | ❌ RED na tarefa | ⬜ pending |
| 1-02-02 | 02 | 2 | SEC-03, OPS-01 | T-01-03, T-01-04 | `loadEnv()` falha rápido sem citar valores; query inválida recebe 400 | unit + http | `pnpm --filter @blog/api test && pnpm --filter @blog/api test:http && pnpm --filter @blog/api typecheck` | ❌ RED na tarefa | ⬜ pending |
| 1-03-01 | 03 | 3 | QA-01 | T-01-37 | A home busca no servidor (BFF); a URL da API não vai para o bundle | smoke full-stack local | `bash scripts/smoke-local.sh` | ❌ RED na tarefa | ⬜ pending |
| 1-03-02 | 03 | 3 | SEC-03 | T-01-05, T-01-06 | `react/no-danger` = error; API fora do ar vira "API indisponível", sem 500 | unit + sonda de lint + smoke | `pnpm --filter @blog/web test && pnpm --filter @blog/web lint && pnpm --filter @blog/web typecheck`; sonda do ESLint por stdin; `bash scripts/smoke-local.sh --degraded` | ❌ RED na tarefa | ⬜ pending |
| 1-03-03 | 03 | 3 | QA-01 | — | N/A | integration (fetch real) | `pnpm --filter @blog/web test:integration` | ❌ RED na tarefa | ⬜ pending |
| 1-04-01 | 04 | 4 | QA-01 | — | N/A | manual (checkpoint; exceção TDD: checkpoint humano) | — (integração WSL do Docker Desktop) | n/a | ⬜ pending |
| 1-04-02 | 04 | 4 | SEC-04, QA-01 | T-01-07, T-01-08 | `anon` é negado e `app_api` lê `heartbeat` no Postgres real | integration | `docker compose -f compose.test.yaml up -d --wait && pnpm --filter @blog/api test:integration` | ❌ RED na tarefa | ⬜ pending |
| 1-04-03 | 04 | 4 | SEC-04 | T-01-07, T-01-08, T-01-38 | RLS em toda tabela de `public`; `app_api` sem BYPASSRLS nem SUPERUSER | integration | `docker compose -f compose.test.yaml up -d --wait && pnpm --filter @blog/api test:integration` | ❌ RED na tarefa | ⬜ pending |
| 1-05-01 | 05 | 5 | OPS-01, QA-01, SEC-04 | T-01-10 | `/health/ready` e `/status` leem `heartbeat` como `app_api`, sem detalhe sensível no corpo | integration + http + smoke | `docker compose -f compose.test.yaml up -d --wait && pnpm --filter @blog/api test:integration && pnpm --filter @blog/api test:http`; `bash scripts/smoke-local.sh` | ❌ RED na tarefa | ⬜ pending |
| 1-05-02 | 05 | 5 | OPS-01 | T-01-09, T-01-39 | Banco fora do ar ou travado devolve 503 sem derrubar a API; log sem a senha | integration | `docker compose -f compose.test.yaml up -d --wait && pnpm --filter @blog/api test:integration` | ❌ RED na tarefa | ⬜ pending |
| 1-06-01 | 06 | 5 | SEC-04 | T-01-11, T-01-12 | Env file de produção com permissão 600 fora do repositório; região `us-east-1` | manual (checkpoint; exceção TDD: checkpoint humano) | — (painel do Supabase) | n/a | ⬜ pending |
| 1-06-02 | 06 | 5 | SEC-04 | T-01-13, T-01-51 | Baseline aplicada por `migrate deploy`; RLS e grants conferidos; PostgREST anônimo sem linhas | smoke de produção | `prisma migrate status` (com `DOTENV_CONFIG_PATH`); `node apps/api/scripts/verify-db-security.mjs`; `ENV_FILE=... bash scripts/smoke-postgrest.sh` | ❌ RED na tarefa | ⬜ pending |
| 1-06-03 | 06 | 5 | SEC-04 | T-01-11, T-01-40 | `app_api` com senha aleatória lê e não escreve; URLs na forma canônica de TLS; a rotação nunca imprime a senha | integration (`node:test`, Postgres local, papel `app_api_pwtest`) + smoke de produção | `docker compose -f compose.test.yaml up -d --wait && node --test apps/api/scripts/set-app-api-password.test.mjs`; `node apps/api/scripts/verify-db-security.mjs --as-app` + checagem do env file (600, duas URLs `?sslmode=require`) | ❌ RED na tarefa | ⬜ pending |
| 1-07-01 | 07 | 6 | SEC-03 | T-01-15, T-01-17 | Headers do Helmet, CORS por allowlist e trust proxy no mesmo `configureApp` | http | `pnpm --filter @blog/api test:http -- security` | ❌ RED na tarefa | ⬜ pending |
| 1-07-02 | 07 | 6 | OPS-01 | T-01-14 | Logs JSON com redação de `authorization`, cookies e tokens | http | `pnpm --filter @blog/api test:http -- logging` | ❌ RED na tarefa | ⬜ pending |
| 1-07-03 | 07 | 6 | OPS-01 | T-01-16, T-01-24 | Sentry carregado por `--import`; `/_debug/error` desligada por padrão | http (dist real) | `pnpm --filter @blog/shared build && pnpm --filter @blog/api build && pnpm --filter @blog/api test:http` | ❌ RED na tarefa | ⬜ pending |
| 1-14-01 | 14 | 6 | SEC-03 | T-01-49 | HTML bruto em `apps/web` fora da allowlist falha; allowlist podre falha | unit (`node:test`) + gate real | `node --test scripts/check-no-raw-html.test.mjs && node scripts/check-no-raw-html.mjs` | ❌ RED na tarefa | ⬜ pending |
| 1-14-02 | 14 | 6 | SEC-04 | T-01-47, T-01-59 | Modo estrito só aceita 42501 ou `[]`; requisição anônima de verdade; chave nunca impressa; o teste termina sozinho (script rodado por `spawn` assíncrono, `timeout` por caso, `curl` com `--max-time`) | unit (`node:test`, servidor falso no mesmo processo) + smoke de produção | `node --test scripts/` (11 casos, menos de 60 s); `ENV_FILE="$HOME/.config/blog-no-law/production.env" bash scripts/smoke-postgrest.sh` | ❌ RED na tarefa | ⬜ pending |
| 1-08-01 | 08 | 7 | QA-03 | T-01-18, T-01-41 | Push com teste ou tipo quebrado é bloqueado; hook e `turbo.json` sem `.claude/`; num checkout limpo o cliente Prisma é gerado antes de qualquer tarefa do `@blog/api` que o usa | unit (`node:test`, ligação lida como texto; TDD) + script (remote descartável) + grafo do Turborepo + execução sem `src/generated` | `node --test scripts/prepush-wiring.test.mjs` (5 casos); `bash scripts/verify-prepush.sh`; `pnpm exec turbo run ... --filter=@blog/api --dry=json` com `PRISMA_ORDER_OK`; `rm -rf apps/api/src/generated && pnpm exec turbo run test:integration --filter=@blog/api --force` | ❌ RED na tarefa | ⬜ pending |
| 1-08-02 | 08 | 7 | QA-03 | T-01-18 | Push com lint ou formatação quebrados é bloqueado | unit (`node:test`, ligação de lint e formatação; TDD) + lint + script | `node --test scripts/prepush-wiring.test.mjs` (8 casos); `pnpm run format:check && pnpm turbo run lint`; `bash scripts/verify-prepush.sh` | ❌ RED na tarefa | ⬜ pending |
| 1-09-01 | 09 | 8 | QA-04 | — | N/A | manual (checkpoint; exceção TDD: checkpoint humano) | — (`gh auth status` com os quatro escopos) | n/a | ⬜ pending |
| 1-09-02 | 09 | 8 | QA-04 | T-01-19, T-01-20, T-01-22, T-01-44, T-01-45 | Repo público com push protection; `main` só com docs antes do ruleset; ruleset exige `ci-ok`; `ci-ok` reprova `failure`, `cancelled` e `skipped`; allowlist do gitleaks sem regra desligada nem caminho | unit (`node:test`, guardas do `ci-ok` e do gitleaks lidas como texto; TDD) + formatação + smoke de configuração (`gh api`) + run da CI | `node --test scripts/ci-gates.test.mjs && pnpm exec prettier --check --ignore-unknown .github/workflows/ci.yml scripts/ci-gates.test.mjs` (2 casos); `gh repo view` + `gh api repos/$R/rules/branches/main`; checagem ruleset x bootstrap; `gh run view "$ID"` com `ci-ok` = success | ❌ RED na tarefa | ⬜ pending |
| 1-09-03 | 09 | 8 | SEC-03, SEC-04, QA-04 | T-01-43, T-01-50, T-01-52 | Gates ligados no `verify` e na CI; `postgrest-anon` no `needs` do `ci-ok` com autoteste; teste de ligação protege contra edições futuras do workflow | unit (`node:test` sobre `ci.yml`, `package.json` e Dependabot) + formatação + grep + run da CI | `node --test scripts/ci-gates.test.mjs` (7 casos: 2 do Task 2 + 5); `pnpm exec prettier --check --ignore-unknown .github/workflows/ci.yml .github/dependabot.yml scripts/ci-gates.test.mjs package.json`; `pnpm run test:scripts && pnpm run check:raw-html`; gates de grep em `ci.yml`; `gh run view` com `postgrest-anon` e `ci-ok` = success | ❌ RED na tarefa | ⬜ pending |
| 1-10-01 | 10 | 9 | QA-02, QA-04 | T-01-23, T-01-55 | E2E + axe no `needs` do `ci-ok`; relatório sem segredos | e2e (CI) + formatação | `gh run view "$ID"` com `e2e,ci-ok` = `success,success`; `pnpm exec prettier --check --ignore-unknown` nos arquivos da tarefa | ❌ RED na tarefa | ⬜ pending |
| 1-10-02 | 10 | 9 | QA-02 | — | N/A (cenários "Ver detalhes" e "API indisponível") | e2e (CI) + formatação | `test "$(grep -cE "test\(['\"]@e2e " apps/web/e2e/home.spec.ts)" -ge 3 && gh run view ...`; `pnpm exec prettier --check --ignore-unknown` nos arquivos da tarefa | ❌ RED na tarefa | ⬜ pending |
| 1-10-03 | 10 | 9 | OPS-01 | T-01-56 | Sentry do web só inicializa com DSN (servidor, cliente e `register()` só no runtime nodejs); `sendDefaultPii: false`; build sem DSN | unit (Vitest com o SDK em mock; TDD) + build + grep + formatação | `pnpm --filter @blog/web exec vitest run --project unit lib/sentry-init.test.ts` (5 casos); `pnpm --filter @blog/web build && grep -q "tracesSampleRate: 0.05" ...`; `pnpm exec prettier --check --ignore-unknown` nos arquivos da tarefa | ❌ RED na tarefa | ⬜ pending |
| 1-11-01 | 11 | 9 | OPS-02 | T-01-25, T-01-27, T-01-46 | Imagem sem `.env*` nem segredo em `Config.Env`, uid diferente de 0, menos de 512 MiB; tag = commit; URL do banco passada ao container só por nome | unit (`node:test`, `docker` e `git` falsos; TDD) + formatação + pre-check + smoke de container | `node --test scripts/smoke-container.test.mjs` (4 casos); `pnpm exec prettier --check --ignore-unknown apps/api/package.json scripts/smoke-container.test.mjs`; `bash -n scripts/smoke-container.sh && ... docker build --check ...`; `bash scripts/smoke-container.sh` (accepted-slow); tag gravada no GHCR + Environment `production` | ❌ RED na tarefa | ⬜ pending |
| 1-11-02 | 11 | 9 | OPS-02 | T-01-26, T-01-28, T-01-48 | Deploy hook só como secret; sem Blueprint; política de keep-alive da Render lida (A2) | manual (checkpoint; exceção TDD: estado externo) | — (painéis GHCR, Sentry, Render, Railway; AUP e termos da Render) | n/a | ⬜ pending |
| 1-11-03 | 11 | 9 | OPS-02, OPS-01 | T-01-48, T-01-53, T-01-54 | `/_debug/error` = 404 na Render; headers do Helmet; runbooks sem segredo; linha `Política de keep-alive (D-03):` registrada | unit (`node:test`, servidor HTTP falso; TDD) + formatação + gate de documento + smoke remoto | `node --test scripts/verify-remote-api.test.mjs` (6 casos); `pnpm exec prettier --check --ignore-unknown docs/runbooks/render.md docs/runbooks/plano-b-railway.md .github/dependabot.yml scripts/verify-remote-api.test.mjs`; `bash -n scripts/verify-remote-api.sh && grep ... docs/runbooks/render.md ...`; `bash scripts/verify-remote-api.sh "$URL" "$C"` (accepted-slow) | ❌ RED na tarefa | ⬜ pending |
| 1-12-01 | 12 | 10 | OPS-02, QA-04 | T-01-29, T-01-30, T-01-57 | Deploy só a partir da `main` do próprio repositório; nenhum log com segredo; ações fixadas por SHA | unit (`node:test`: polling contra servidor falso e guarda do workflow lida como texto; TDD) + gate do workflow + formatação + deploy real | `node --test scripts/wait-for-commit.test.mjs scripts/deploy-api-workflow.test.mjs` (10 casos); gates de grep em `deploy-api.yml` e `ci.yml`; `pnpm exec prettier --check --ignore-unknown` em `deploy-api.yml`, `ci.yml`, `vercel.json` e nos dois testes; `gh run watch "$ID" --exit-status && bash scripts/wait-for-commit.sh ...` (accepted-slow) | ❌ RED na tarefa | ⬜ pending |
| 1-12-02 | 12 | 10 | OPS-02 | T-01-31 | Ambiente Preview da Vercel sem segredos | manual (checkpoint; exceção TDD: estado externo) | — (painel da Vercel) | n/a | ⬜ pending |
| 1-12-03 | 12 | 10 | OPS-02 | T-01-32 | Home de produção (iad1) mostra o commit da `main` e banco `up` | gate de documento + formatação + smoke de produção (exceção TDD: documentação e leitura de estado externo) | `D=docs/runbooks/deploy.md && test -s "$D" && ...`; `pnpm exec prettier --check --ignore-unknown docs/runbooks/deploy.md`; `curl` da home com `x-vercel-id` em `iad1` (accepted-slow) | ❌ na tarefa | ⬜ pending |
| 1-13-01 | 13 | 11 | OPS-03 | T-01-34 | Chave privada offline (600); token só no Environment; monitores conforme a política de keep-alive | manual (checkpoint; exceção TDD: estado externo) | — (age-keygen, token fine-grained, UptimeRobot) | n/a | ⬜ pending |
| 1-13-02 | 13 | 11 | OPS-03 | T-01-33, T-01-36, T-01-58, T-01-61, T-01-SC | Dump cifrado no pipe, com privilégios, e publicado só em release privada; TLS na forma canônica; `age` do arquivo assinado do Ubuntu; heartbeat de produção fresco | unit (`node:test`, guardas do workflow lidas como texto; TDD) + gate do workflow + formatação + checagem de release + checagem de produção | `node --test scripts/backup-workflow.test.mjs` (6 casos); gate de grep em `backup.yml` (`PGSSLROOTCERT`, `NON_CANONICAL_TLS_URL`, `apt-get install`, `ubuntu-24.04`); `pnpm exec prettier --check --ignore-unknown .github/workflows/backup.yml apps/api/scripts/verify-db-security.mjs scripts/backup-workflow.test.mjs`; `gh release list ... .dump.age` com tamanho > 0; `node apps/api/scripts/verify-db-security.mjs --as-app --heartbeat-fresh` | ❌ RED na tarefa | ⬜ pending |
| 1-13-03 | 13 | 11 | OPS-03 | T-01-35, T-01-36, T-01-60 | Restore real num Postgres descartável com linhas, baseline, RLS, policy, privilégio do `app_api` vindo do backup e leitura real de `heartbeat` como `app_api` | unit (`node:test`, `gh`, `age` e `docker` falsos; TDD) + formatação + restore drill | `node --test scripts/restore-drill.test.mjs` (6 casos); `pnpm exec prettier --check --ignore-unknown docs/runbooks/backup-restore.md docs/runbooks/rotacao-segredos.md scripts/restore-drill.test.mjs`; `bash scripts/restore-drill.sh` (+ gate de grep: `has_table_privilege('app_api'`, `-U app_api`) | ❌ RED na tarefa | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*File Exists: "❌ RED na tarefa" = o teste ou script é criado pela própria tarefa antes da implementação (primeiro movimento RED); "❌ na tarefa" = criado pela própria tarefa junto com o que ele verifica; "n/a" = checkpoint humano. Nenhum `<verify>` da fase usa `<automated>MISSING`. Os comandos longos estão abreviados com `...`; o texto exato é o do `<verify>` de cada plano.*

*TDD (CLAUDE.md, RED -> GREEN -> REFACTOR obrigatório): nos planos 01-01, 01-08, 01-09, 01-11, 01-12, 01-13 e 01-14, toda tarefa que escreve script ou lógica testável é `tdd="true"`, com `<behavior>` e um RED em `node:test` ou Vitest que falha em asserção (evidência TAP) antes da implementação. As demais tarefas desses planos trazem uma linha `TDD exception:` com o motivo: checkpoint humano, estado externo ou só documentação. No 01-10, a Task 3 (Sentry do web) é `tdd="true"` com RED em Vitest.*

*Formatação: o `format:check` (`prettier --check .`) roda no `verify` do pre-push e no job `lint` da CI sobre a árvore inteira. O 01-08 formata de uma vez os arquivos dos planos 01-01 a 01-07 e 01-14; de 01-09 em diante, toda tarefa que escreve arquivo formatável roda `pnpm exec prettier --write --ignore-unknown` nos arquivos dela antes do commit e tem um `<automated>` com `pnpm exec prettier --check --ignore-unknown` restrito a esses arquivos (restrito para não depender de outro plano da mesma wave).*

---

## Wave 0 Requirements

Não há plano separado de Wave 0 e nenhum `<verify>` usa `<automated>MISSING`. O projeto é greenfield: cada peça de infraestrutura de teste nasce no primeiro movimento (RED) do tracer que a usa, antes do código que ela verifica.

- [ ] Instalação dos frameworks pela lista aprovada no 01-01 Task 1 (Vitest 4.1.12, Vite 8.3.8, Supertest 7.3.2, Playwright 1.65.1, `@axe-core/playwright` 4.14.0), com versões exatas
- [ ] Vitest do `packages/shared` + `src/status.test.ts` — 01-01 Task 2 (QA-01, contrato SDD)
- [ ] `apps/api/vitest.config.ts` + `test/app.http-spec.ts` — 01-02 Task 1 (QA-01)
- [ ] `docs/bdd/home.feature.md` (cenários Dado/Quando/Então), `apps/web/vitest.config.ts` (projetos `unit` e `int`) e `scripts/smoke-local.sh` — 01-03 Tasks 1 e 3 (QA-01, BDD antes do E2E)
- [ ] `compose.test.yaml` (`supabase/postgres` 17), `apps/api/scripts/prepare-test-db.mjs`, `test/global-setup.int.ts` e `test/rls.int-spec.ts` — 01-04 Task 2 (SEC-04), depois do Docker no WSL (01-04 Task 1)
- [ ] `apps/api/scripts/set-app-api-password.test.mjs` (`node:test` contra o Postgres local) — 01-06 Task 3 (SEC-04); a partir do 01-08 roda no `test:integration` do `@blog/api`
- [ ] `scripts/check-no-raw-html.test.mjs` e `scripts/smoke-postgrest.test.mjs` (`node:test`) — 01-14 (SEC-03, SEC-04)
- [ ] `scripts/ci-gates.test.mjs` (`node:test` da ligação dos gates na CI) — 01-09 Task 3 (SEC-03, SEC-04, QA-04)
- [ ] `scripts/prepush-wiring.test.mjs` (`node:test` da ligação do portão local) — 01-08 Tasks 1 e 2 (QA-03), escrito antes do `turbo.json` e do hook
- [ ] `turbo.json`, `.husky/pre-push` e `scripts/verify-prepush.sh` — 01-08 Task 1 (QA-03)
- [ ] `.github/workflows/ci.yml` com o agregador `ci-ok` — 01-09 Task 2 (QA-04)
- [ ] `apps/web/playwright.config.ts` + `e2e/home.spec.ts` com axe — 01-10 Task 1 (QA-02); `playwright install --with-deps chromium` só no runner da CI
- [ ] `scripts/smoke-container.sh` (01-11 Task 1), `scripts/verify-remote-api.sh` (01-11 Task 3), `scripts/wait-for-commit.sh` (01-12 Task 1) e `scripts/restore-drill.sh` (01-13 Task 3) — OPS-02, OPS-03
- [ ] Testes `node:test` escritos antes desses scripts e dos workflows (RED): `scripts/smoke-container.test.mjs` e `scripts/verify-remote-api.test.mjs` (01-11 Tasks 1 e 3), `scripts/wait-for-commit.test.mjs` e `scripts/deploy-api-workflow.test.mjs` (01-12 Task 1), `scripts/backup-workflow.test.mjs` e `scripts/restore-drill.test.mjs` (01-13 Tasks 2 e 3) — OPS-02, OPS-03; rodam no `test:scripts` sem Docker, rede externa nem produção

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Aprovação em lote dos pacotes npm marcados SUS | QA-01 (T-01-SC) | Legitimidade de pacote exige julgamento humano; o gate nunca é auto-aprovado | 01-01 Task 1: o autor confere os quatro grupos do passo 9 na página de cada pacote em npmjs.com e responde "aprovado" |
| Integração WSL do Docker Desktop | QA-01 | Configuração do Docker Desktop no Windows, fora do alcance do Claude | 01-04 Task 1 |
| Projeto Supabase em `us-east-1` e env file de produção | SEC-04 | Painel e conta do autor; região one-way (D-05) | 01-06 Task 1; o Claude confere permissão 600, chaves e host do pooler sem imprimir valores |
| Instalação e login do `gh` | QA-04 | Exige `sudo` e navegador | 01-09 Task 1; `gh auth status` com os quatro escopos |
| Pacote GHCR público, contas Sentry/Render/Railway e leitura da política de keep-alive da Render | OPS-02, OPS-01 | Passos de painel sem API sem credencial extra; a AUP da Render não pôde ser lida pela pesquisa (Assumption A2) | 01-11 Task 2; resultado registrado em `docs/runbooks/render.md` (gate de grep na Task 3) |
| Evento `sentry-smoke` no projeto `blog-no-law-api` | OPS-01 | Sem token de API do Sentry (opt-out registrado no COVERAGE.md) | 01-11 Task 3, `<human-check>` |
| `clientIp` da sonda de `trust proxy` no log da Render | OPS-01 (D-02) | Os logs da Render só aparecem no painel | 01-11 Task 3, `<human-check>`; ajustar `TRUST_PROXY_HOPS` pela regra do runbook |
| Serviço da Railway removido após a evidência | OPS-02 (custo zero) | Ação de painel | 01-11 Task 3, `<human-check>` |
| Importar o web na Vercel e liberar o domínio no CORS | OPS-02 | Integração Git feita no painel da Vercel | 01-12 Task 2 |
| Home de produção em janela anônima, com "Ver detalhes" | OPS-02 | Conferência visual da página | 01-12 Task 3, `<human-check>` |
| Chave `age`, token fine-grained do repositório de backups e monitores do UptimeRobot | OPS-03 | Segredos nunca passam pelo chat; monitores dependem da política registrada no 01-11 | 01-13 Task 1 |
| Monitores Up no UptimeRobot (ou nenhum monitor contra a Render se a política for PROIBE) | OPS-03 (D-03) | Painel do UptimeRobot | 01-13 Task 3, `<human-check>` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s (exceções `accepted-slow` declaradas nos planos 01-11 e 01-12)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending (o `nyquist_compliant` continua `false` até a validação pós-execução pelo `/gsd-validate-phase`)
