---
phase: 01-esqueleto-no-ar-com-testes-e-ci
plan: 11
subsystem: infra
tags: [docker, ghcr, render, railway, sentry, pnpm-deploy, smoke]

requires:
  - phase: 01-esqueleto-no-ar-com-testes-e-ci
    provides: "01-06 banco de produção e forma canônica de TLS; 01-09 CI e escopo write:packages; 01-14 estilo dos testes de smoke"
provides:
  - "Imagem linux/amd64 da API (apps/api/Dockerfile) publicada no GHCR como ghcr.io/jguii/blog-no-law-api:72f7961b2bd74687043f61ec45fe9ce4a5da4fdb (pacote ainda privado)"
  - "scripts/smoke-container.sh [--publish]: prova a imagem real contra o banco de produção e publica"
  - "GitHub Environment production restrito à main por custom branch policy"
affects: [01-12 deploy automatizado pelo hook, 01-13 monitores, Task 2 (checkpoint humano), Task 3 (verificação remota e runbooks)]

actuals:
  tokens: 3960
  tasks: 1
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Smoke de container com docker/git falsos no PATH e senha marcadora para provar que a URL do banco nunca vaza"
    - "DATABASE_URL entra no container só pelo nome (-e DATABASE_URL), com o valor no ambiente do comando"

key-files:
  created:
    - apps/api/Dockerfile
    - .dockerignore
    - scripts/smoke-container.sh
    - scripts/smoke-container.test.mjs
  modified:
    - apps/api/package.json

key-decisions:
  - "pnpm --filter @blog/api deploy --prod funcionou sem --legacy nem injectWorkspacePackages (Assumption A10 confirmada)"
  - "ENV PORT=10000 na imagem (padrão da Render) e HEALTHCHECK lê process.env.PORT dentro do node; o smoke sobrescreve para 3301"
  - "docker run com --memory 512m para espelhar o limite do plano Free; o container não imprime logs no smoke (mensagem crua de driver pode carregar dados da conexão)"
  - "IMAGE_OWNER (padrão jguii) configura dono do GHCR e do repositório, sem chamar gh no caminho comum"

requirements-completed: []  # OPS-02 e OPS-01 só fecham com as Tasks 2 e 3

coverage:
  - id: D1
    description: "Imagem amd64 da API roda local contra o banco de produção como app_api (health, /status com commit = SHA e db up, uid 1000, 95 MiB, sem segredos)"
    requirement: OPS-02
    verification:
      - kind: integration
        ref: "bash scripts/smoke-container.sh -> SMOKE_CONTAINER_OK"
        status: pass
      - kind: unit
        ref: "scripts/smoke-container.test.mjs (4 testes)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Imagem publicada no GHCR com a tag do commit feat(01-11) e Environment production restrito à main"
    requirement: OPS-02
    verification:
      - kind: integration
        ref: "docker manifest inspect ghcr.io/jguii/blog-no-law-api:72f7961...; gh api environments/production"
        status: pass
    human_judgment: false
  - id: D3
    description: "Render, Railway, Sentry e política de keep-alive (Tasks 2 e 3 ainda não executadas)"
    verification: []
    human_judgment: true
    rationale: "Depende de painéis externos e de leitura humana da AUP da Render; é o checkpoint da Task 2"

duration: 25min
completed: 2026-11-20
plan_head_before: 1df67a3a66e695b80db3145c62eb83d74eebae5b
plan_head_after: 72f7961b2bd74687043f61ec45fe9ce4a5da4fdb
commits: 2
status: halted
---

# Phase 1 Plan 11: Containerização da API (SUMMARY PARCIAL, Task 1 de 3) Summary

**Imagem Docker amd64 da API (multi-stage, `pnpm deploy --prod`, usuário não-root) provada localmente contra o banco de produção, publicada no GHCR com a tag do commit e Environment `production` restrito à `main`.**

Esta SUMMARY é parcial: a Task 1 (tracer) está concluída; a Task 2 (checkpoint humano) está pendente e a Task 3 será executada por um agente de continuação. Deve ser regravada ao final do plano.

## Performance

- **Duração:** cerca de 25 min (build e publicação incluídos)
- **Concluído em:** 2026-11-20
- **Tarefas:** 1 de 3 (Task 2 é checkpoint humano; Task 3 depende dele)
- **Arquivos:** 5 (4 criados, 1 modificado)

## Imagem publicada

- **Referência:** `ghcr.io/jguii/blog-no-law-api:72f7961b2bd74687043f61ec45fe9ce4a5da4fdb`
- **SHA gravado em** `~/.config/blog-no-law/published-image.sha` (fora do repositório). É o commit `feat(01-11): containerize the API`, que será ancestral da branch de fase depois do merge do worktree.
- **Visibilidade:** privada (padrão do GHCR). Tornar pública é o passo 1 da Task 2.
- `docker manifest inspect` da tag exata passou (com login). Credencial do GHCR removida com `docker logout` em seguida.

## Accomplishments

- `apps/api/Dockerfile` (contexto = raiz): estágio de build com `pnpm install --frozen-lockfile --filter @blog/api...`, `build` do shared e da API (inclui `prisma generate`) e `pnpm deploy --prod /out`; estágio final `node:26-bookworm-slim` com `USER node`, `ARG GIT_SHA`, label `org.opencontainers.image.source`, CA do Supabase copiada para `/app/certs` com `NODE_EXTRA_CA_CERTS` absoluto, `HEALTHCHECK` e `CMD` com `--import ./dist/instrument.js`.
- `.dockerignore` exclui `.env*`, `.claude`, `.planning`, `docs`, `assets`, código do web (fica só o `package.json`) e dumps.
- `scripts/smoke-container.sh`: valida a forma canônica de TLS antes do build (`NON_CANONICAL_TLS_URL`), recusa publicação com árvore suja (`DIRTY_TREE`), sobe o container com `-e DATABASE_URL` só pelo nome, confere `/health/live`, `/health/ready`, `/status` (`commit` = SHA, `db` up), uid diferente de 0, memória abaixo de 512 MiB, nenhum `.env*` em `/app` e nenhum `DATABASE_URL`/`SENTRY_DSN`/`HOOK` em `Config.Env`; com `--publish`, faz login no GHCR por `gh auth token`, tag, push, grava o SHA e faz logout.
- Resultado real contra produção: `SMOKE_CONTAINER_OK ... mem=95MiB uid=1000`, duas vezes (antes do commit e na publicação).
- GitHub Environment `production` criado com `custom_branch_policies: true` e a política `main` (tipo `branch`). Nenhum secret criado.

## Task Commits

1. **Task 1 (RED)** - `d0b62dc` (`test(01-11): add failing container smoke tests`)
2. **Task 1 (GREEN)** - `72f7961` (`feat(01-11): containerize the API`)

### Evidência RED (TDD)

- **Comando:** `node --test --test-reporter=tap scripts/smoke-container.test.mjs`, saída 1, 4 testes, 0 passaram, 4 falharam.
- **Classificador:** `gsd-tools check tdd-red-evidence` devolveu `RED_EVIDENCE_OK` (`target_test_failed`), alvo: `--publish com árvore suja: DIRTY_TREE, sem docker build, login nem push`.
- **Avaliação semântica:** os quatro falharam em asserção (`ERR_ASSERTION`): Dockerfile e `.dockerignore` inexistentes (texto vazio) e o script ausente (código de saída e marcadores esperados não apareceram). Nenhum erro de sintaxe, importação ou fixture.
- **GREEN:** os 4 passam; `pnpm run test:scripts` roda 30 testes verdes (26 anteriores + 4); `prettier --check .` verde.

## Files Created/Modified

- `apps/api/Dockerfile` - imagem multi-stage amd64 da API
- `.dockerignore` - exclui segredos, planejamento, docs e código do web
- `scripts/smoke-container.sh` - smoke local e publicação da imagem
- `scripts/smoke-container.test.mjs` - 4 testes com `docker` e `git` falsos
- `apps/api/package.json` - campo `files: ["dist"]` para o `pnpm deploy` copiar o build

## Decisions Made

- `pnpm deploy --prod` funcionou sem `--legacy` nem `injectWorkspacePackages` (Assumption A10 confirmada com pnpm 12.21.0).
- `PORT=10000` como padrão da imagem; o `HEALTHCHECK` usa a variável dentro do `node -e`.
- `--memory 512m` no `docker run` do smoke para refletir o plano Free; a medida de memória real foi de 95 MiB (Assumption A9 confirmada com folga).
- Logs do container não são impressos pelo smoke; em falha só sai um marcador `SMOKE_FAIL {checagem}`.

## Deviations from Plan

None - plan executed exactly as written. Observações sem impacto: o build imprime avisos `prisma:warn ... libssl/openssl` (a imagem slim não tem `openssl`; o runtime usa o adapter `pg`, sem engine, e o smoke passou) e um aviso do `npm` sobre scripts de instalação do `pnpm` global.

## Auth Gates

Nenhum. O `gh auth token` com escopo `write:packages` bastou para o push.

## Known Stubs

None.

## Threat Flags

None. Os mitigadores T-01-25, T-01-27 e T-01-46 desta tarefa estão verificados pelo próprio smoke (sem `.env*` na imagem, sem segredo em `Config.Env`, uid 1000, `DIRTY_TREE`).

## Próximos passos (pendentes)

- **Task 2 (checkpoint humano, `gate="blocking"`):** tornar o pacote público, criar Sentry, Render e Railway, gravar `RENDER_DEPLOY_HOOK_URL`, ler a política de keep-alive da Render.
- **Task 3:** `scripts/verify-remote-api.sh` (RED, GREEN), verificação em Render e Railway, runbooks `render.md` e `plano-b-railway.md`, ecossistema `docker` no Dependabot.

## Self-Check: PASSED

- Arquivos: `apps/api/Dockerfile`, `.dockerignore`, `scripts/smoke-container.sh`, `scripts/smoke-container.test.mjs` existem; `apps/api/package.json` tem `files`.
- Commits `d0b62dc` (RED) e `72f7961` (GREEN) existem na branch, nesta ordem.
- Tag `72f7961b2bd74687043f61ec45fe9ce4a5da4fdb` existe no GHCR e é o `HEAD` no momento da publicação; Environment `production` com `custom_branch_policies: true`.
