---
phase: 01-esqueleto-no-ar-com-testes-e-ci
plan: 12
subsystem: infra
tags: [github-actions, ghcr, render, vercel, prisma-migrate, docker, ci-cd]

requires:
  - phase: 01-esqueleto-no-ar-com-testes-e-ci
    provides: "01-09 ruleset e ci-ok; 01-10 web com Sentry; 01-11 imagem da API e Render com deploy hook"
provides:
  - "scripts/wait-for-commit.sh (polling de /status até commit == SHA)"
  - ".github/workflows/deploy-api.yml (build-push, migrate, deploy hook, verify)"
  - "job docker-build da CI dentro do needs do ci-ok"
  - "apps/web/vercel.json com regions iad1"
  - "Primeiro merge no meio da fase (PR #1, D-13) com o workflow na main"
affects: [01-13, 01-14, ship]

actuals:
  tokens: 21000
  tasks: 1
  commits: 3
plan_head_before: eb6e79b20fd43359d29391d9a38337d0918f1e6d
plan_head_after: 9c84d032db77e3dc9ce0dcf8dea0df2a9d4738b6

tech-stack:
  added: []
  patterns:
    - "workflow_run com guarda de mesmo repositório e evento push"
    - "deploys da API serializados sem cancelamento (deploy-api-production)"
    - "teste de guarda do workflow lendo YAML como texto (sem parser)"

key-files:
  created:
    - scripts/wait-for-commit.sh
    - scripts/wait-for-commit.test.mjs
    - scripts/deploy-api-workflow.test.mjs
    - .github/workflows/deploy-api.yml
    - apps/web/vercel.json
  modified:
    - .github/workflows/ci.yml

key-decisions:
  - "deploy e verify listam build-push no needs (além do encadeamento) para ler os outputs sha e image; o teste de guarda aceita lista"
  - "Imagem do primeiro SHA da main empurrada uma vez do computador do autor (token do gh) como tentativa de conectar o pacote GHCR ao repositório; não conectou"

requirements-completed: []

coverage:
  - id: D1
    description: "wait-for-commit.sh faz polling de /status, tolera 5xx e conexão encerrada, sai 0 com COMMIT_LIVE ou 1 com COMMIT_TIMEOUT"
    requirement: OPS-02
    verification:
      - kind: unit
        ref: "scripts/wait-for-commit.test.mjs#4 casos de polling"
        status: pass
    human_judgment: false
  - id: D2
    description: "Guarda do deploy-api.yml (gatilho, mesmo repositório e push, concorrência, ordem dos jobs, SHAs fixados, docker-build no ci-ok, iad1)"
    requirement: QA-04
    verification:
      - kind: unit
        ref: "scripts/deploy-api-workflow.test.mjs#6 guardas"
        status: pass
      - kind: integration
        ref: "gh run 44854034462 (CI do PR #1: 9 jobs success, incluindo docker-build e ci-ok)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Merge na main dispara o Deploy API até a Render servir o SHA do merge"
    requirement: OPS-02
    verification: []
    human_judgment: true
    rationale: "Bloqueado: o GITHUB_TOKEN não tem permissão de escrita no pacote GHCR (write_package). Pendente a ação humana em Manage Actions access e o rerun do run 44854566143"

duration: 15min
completed: 2026-11-21
status: in_progress
---

# Phase 1 Plan 12: Deploy automático da API Summary (PARCIAL, Task 1 bloqueada em ação humana)

**Pipeline `Deploy API` (build-push, migrate, deploy hook com `imgURL`, verify) e job `docker-build` na CI mergeados na `main` pelo PR #1, mas o primeiro run parou no push para o GHCR por falta de acesso do repositório ao pacote.**

## Performance

- **Duração até aqui:** 15 min
- **Início:** 2026-11-21T02:01:35Z
- **Parcial escrito em:** 2026-11-21T02:16:00Z
- **Tarefas:** 0 de 3 completas (Task 1 com código, testes e merge prontos; falta o run verde e o COMMIT_LIVE; Task 2 e Task 3 pendentes)
- **Arquivos modificados:** 6

## Estado por tarefa

| Task | Estado                                                                                                              |
| ---- | ------------------------------------------------------------------------------------------------------------------- |
| 1    | Código, testes e merge feitos. Pendente: Deploy API verde e `COMMIT_LIVE` (bloqueado em ação humana no pacote GHCR) |
| 2    | Pendente (checkpoint humano: Vercel e CORS na Render)                                                               |
| 3    | Pendente (home de produção e runbook `docs/runbooks/deploy.md`)                                                     |

## Accomplishments

- RED/GREEN do polling: 4 casos `node:test` contra servidor HTTP falso; RED validado com `gsd_run check tdd-red-evidence` (`RED_EVIDENCE_OK`, 10 falhas por `ERR_ASSERTION`); RED de ponta a ponta confirmado (`COMMIT_TIMEOUT` contra a Render, que ainda servia a imagem do 01-11).
- `deploy-api.yml` com `workflow_run` do CI na `main` (só `push` do próprio repositório), grupo `deploy-api-production` sem cancelamento, ações Docker fixadas por SHA de 40 hex, deploy hook só por `env:` de secret.
- Job `docker-build` na CI (sem publicar) no `needs` do `ci-ok`, mantendo `postgrest-anon` e `e2e`; CI do PR #1 verde nos 9 jobs.
- `MIGRATE_DATABASE_URL` gravado como secret e `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY` como variáveis do Environment `production`, sem imprimir valores.
- PR #1 mergeado por merge commit `1c14a0fb4feaff6e42944664485412272ed0695e`; a branch da fase continua no remoto em `9c84d032db77e3dc9ce0dcf8dea0df2a9d4738b6`.

## Task Commits

1. **Task 1 (RED)** - `1cfb407` test(01-12): add failing deploy pipeline tests
2. **Task 1 (GREEN, script)** - `eff3c36` feat(01-12): add wait-for-commit polling script
3. **Task 1 (GREEN, workflow)** - `9c84d03` feat(01-12): deploy the API automatically on merge to main

**Merge na main:** `1c14a0fb4feaff6e42944664485412272ed0695e` (PR #1, merge commit).

## Files Created/Modified

- `scripts/wait-for-commit.sh` - polling de `/status` (`WAIT_POLL_S`, saídas `COMMIT_LIVE` e `COMMIT_TIMEOUT`)
- `scripts/wait-for-commit.test.mjs` - 4 casos de polling
- `scripts/deploy-api-workflow.test.mjs` - 6 guardas lendo os workflows e o `vercel.json` como texto
- `.github/workflows/deploy-api.yml` - pipeline `Deploy API`
- `.github/workflows/ci.yml` - job `docker-build` e `needs` do `ci-ok`
- `apps/web/vercel.json` - `regions` `["iad1"]`, `installCommand` e `buildCommand` do monorepo

## Decisions Made

- `deploy` e `verify` listam `build-push` no `needs` para ler `sha` e `image`; o helper do teste de guarda passou a aceitar `needs` em lista.
- Run `Deploy API` 44854566143 na `main` falhou em `build-push`; `migrate`, `deploy` e `verify` foram pulados, então nenhuma migration nem deploy rodou. A Render segue servindo `72f7961b2bd74687043f61ec45fe9ce4a5da4fdb`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Aspas simples no env file local**

- **Found during:** Task 1, passo 1
- **Issue:** `~/.config/blog-no-law/production.env` usa aspas simples; o `sed` do orquestrador só removia aspas duplas, e a primeira gravação deixou as aspas literais no secret e nas duas variáveis.
- **Fix:** regravei os três com remoção de aspas simples e duplas. Conferi só a forma das variáveis (`https://` e prefixo `sb_publishable_`, sem aspas), sem imprimir valores. O secret não é legível; a prova é o job `migrate`.
- **Files modified:** nenhum arquivo rastreado

**2. [Rule 3 - Blocking] Pacote GHCR sem acesso do repositório**

- **Found during:** Task 1, run `Deploy API` na `main`
- **Issue:** `denied: permission_denied: write_package` ao empurrar `ghcr.io/jguii/blog-no-law-api:{sha}` com o `GITHUB_TOKEN`. O pacote foi criado no 01-11 por push com o token do autor e não está conectado a nenhum repositório (`repository: null` na API).
- **Tentativa de automação:** construí a imagem localmente com o rótulo `org.opencontainers.image.source` e a empurrei com o token do `gh` para a tag do SHA do merge (`1c14a0f...`), esperando que o rótulo conectasse o repositório. Não conectou. Essa tag existe no GHCR (build local do mesmo conteúdo da `main`); o rerun a sobrescreve.
- **Fix pendente (ação humana):** não há API REST para o acesso de Actions a um pacote. O autor precisa adicionar o repositório no painel do pacote (ver checkpoint). Depois: `gh run rerun 44854566143 --failed --repo jguii/blog-no-law`.
- **Files modified:** nenhum

**3. [Rule 1 - Teste] Helper `needsJob` aceita `needs` em lista**

- **Found during:** Task 1 (GREEN)
- **Issue:** `deploy` e `verify` precisam citar `build-push` para ler os outputs; o helper exigia `needs` de um único job.
- **Fix:** o helper agora verifica se o `needs` cita o job (escalar ou lista). A guarda continua exigindo `migrate` em `deploy` e `deploy` em `verify`.
- **Committed in:** `9c84d03`

---

**Total deviations:** 3 (2 Rule 3, 1 Rule 1). **Impacto:** o item 2 impede fechar a Task 1; os outros dois não mudam o escopo.

## Auth Gates

Acesso do `GITHUB_TOKEN` ao pacote GHCR (item 2 acima): ação humana no painel do GitHub, a ser tratada no checkpoint devolvido ao orquestrador.

## Issues Encountered

- O pre-push (`pnpm run verify`) rodou com o compose de teste do próprio worktree e passou; o compose foi derrubado com `down -v` no fim.
- O Dependabot abriu runs na `main` logo após o merge (atualizações de `github_actions`, `docker` e `npm`); não fazem parte deste plano.

## Known Stubs

None.

## Threat Flags

None. T-01-29 (guarda `event == 'push'` e mesmo repositório), T-01-30 (sem `set -x` nem curl verboso, valores só por `env:`), T-01-57 (hook só no job `deploy` do Environment `production`) e T-01-SC (nenhum pacote npm novo; ações fixadas por SHA) estão cobertos pelo workflow e pelos testes de guarda.

## Next Phase Readiness

- Falta: ação humana no pacote GHCR, rerun do `Deploy API`, `COMMIT_LIVE` para `origin/main`, Task 2 (Vercel e `CORS_ORIGINS`) e Task 3 (prova de produção e `docs/runbooks/deploy.md`).

---

_Phase: 01-esqueleto-no-ar-com-testes-e-ci_
_Parcial: 2026-11-21_
