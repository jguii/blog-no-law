---
phase: 01-esqueleto-no-ar-com-testes-e-ci
plan: 09
subsystem: infra
tags: [github-actions, ci, gitleaks, rulesets, postgrest, dependabot, security]

requires:
  - phase: 01-esqueleto-no-ar-com-testes-e-ci
    provides: "01-08 turbo e pre-push (verify), 01-06 smoke do PostgREST, 01-14 gates de HTML bruto e do PostgREST anônimo, 01-04 prepare-test-db e migrations"
provides:
  - "Repositório público jguii/blog-no-law endurecido (secret scanning, push protection, GITHUB_TOKEN somente leitura, aprovação de PR externo)"
  - "Repositório privado jguii/blog-no-law-backups (com README, pronto para releases do 01-13)"
  - "Bootstrap docs-only da main (6cedd23) e ruleset main-protegida (id 27773237) ativo antes do push da branch da fase"
  - "CI com lint, typecheck, test-api, test-web, postgrest-anon, secrets e agregador ci-ok"
  - "Gates de HTML bruto e PostgREST anônimo ligados na CI e no verify do pre-push"
  - "Dependabot agrupado (actions e npm)"
affects: [01-10, 01-11, 01-12, 01-13, deploy, ci]

actuals:
  tokens: 6500
  tasks: 3
  commits: 4

plan_head_before: 81b239f7ea681749e94e69ee845dec3e16870a3b
plan_head_after: 1a93f0259368b82dcc82858252b7a3418c0190ca

tech-stack:
  added: ["gitleaks 8.30.1 (binário local, sha256 conferido)", "gitleaks/gitleaks-action v3.0.0", "postgrest/postgrest v16.5 (imagem por digest, só na CI)"]
  patterns:
    - "Job agregador ci-ok (always(), reprova failure, cancelled e skipped) como único check obrigatório"
    - "Teste node:test que lê o workflow como texto para fixar a forma da CI (scripts/ci-gates.test.mjs)"
    - "Portão com autoteste: o job dá SELECT a anon de propósito e exige LEAK"
    - "Ações de terceiros fixadas por SHA de commit com a tag em comentário"

key-files:
  created:
    - .github/workflows/ci.yml
    - .github/dependabot.yml
    - .gitleaks.toml
    - scripts/ci-gates.test.mjs
  modified:
    - package.json

key-decisions:
  - "Allowlist do gitleaks com três literais exatos ancorados (^...$): os dois do plano mais a chave fictícia de fixture que o histórico já continha"
  - "Repositório criado sem --source (gh não reconhece o worktree) e remote origin adicionado à mão"
  - "Branch da fase empurrada por HEAD:refs/heads/gsd/phase-01-... a partir do worktree do executor"
  - "Merge só por merge commit no ruleset; sem bypass actors; ci-ok preso ao integration_id 15368 (GitHub Actions)"

patterns-established:
  - "Todo job novo da CI entra na linha única needs: [...] do ci-ok; o teste confere inclusão"
  - "Credencial real nunca entra na allowlist do gitleaks: rotacionar em vez de liberar"

requirements-completed: [QA-04, SEC-03, SEC-04]

coverage:
  - id: D1
    description: "Repositório público endurecido, com varredura gitleaks do histórico antes do primeiro push e só .claude/CLAUDE.md rastreado em .claude/ (D-07, D-12)"
    requirement: SEC-03
    verification:
      - kind: other
        ref: "gitleaks git --redact --no-banner . => no leaks found; git ls-files .claude; gh api repos/jguii/blog-no-law (push protection enabled)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Bootstrap docs-only da main e ruleset main-protegida ativo (PR, ci-ok, sem force push nem deleção, só merge commit) antes do push da branch da fase (D-08, D-13)"
    requirement: QA-04
    verification:
      - kind: other
        ref: "gh api repos/jguii/blog-no-law/rules/branches/main (deletion,non_fast_forward,pull_request,required_status_checks; ci-ok); ls-tree do tip anterior ao ruleset com 0 caminhos fora da lista"
        status: pass
    human_judgment: false
  - id: D3
    description: "CI completa com ci-ok verde no PR da fase (lint, typecheck, test-api, test-web, secrets, postgrest-anon)"
    requirement: QA-04
    verification:
      - kind: other
        ref: "gh run 44840440974: todos os 7 jobs com conclusão success"
        status: pass
      - kind: unit
        ref: "scripts/ci-gates.test.mjs (7 testes)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Gate de HTML bruto e portão PostgREST anônimo pré-merge (com autoteste de LEAK) ligados na CI e no verify do pre-push"
    requirement: SEC-04
    verification:
      - kind: integration
        ref: "job postgrest-anon do run 44840440974: POSTGREST_ANON_BLOCKED e POSTGREST_GATE_SELFTEST_OK no log"
        status: pass
      - kind: unit
        ref: "pnpm run test:scripts (26 testes) e pnpm run check:raw-html (RAW_HTML_OK)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Dependabot agrupado para github-actions e npm"
    verification:
      - kind: unit
        ref: "scripts/ci-gates.test.mjs#ligação dos gates: dependabot cobre github-actions e npm com os cinco grupos"
        status: pass
    human_judgment: true
    rationale: "A presença do arquivo é testada, mas o comportamento real do Dependabot (PRs agrupados) só aparece na primeira rodada semanal."

duration: 10min
completed: 2026-11-20
status: complete
---

# Phase 1 Plan 09: CI e publicação do repositório Summary

**Repositório público `jguii/blog-no-law` endurecido, `main` nascida só com docs e protegida por ruleset que exige `ci-ok`, e CI no GitHub Actions (7 jobs, todos verdes) com os gates de HTML bruto e de PostgREST anônimo, mais Dependabot agrupado.**

## Performance

- **Duração:** 10 min nesta continuação (Task 1 já resolvida pelo autor)
- **Início:** 2026-11-20T23:48:46Z
- **Fim:** 2026-11-20T23:58:29Z
- **Tarefas:** 3 (Task 1 checkpoint resolvido antes; Tasks 2 e 3 executadas aqui)
- **Arquivos:** 5 (4 criados, 1 modificado)

## Accomplishments

- Task 1 (checkpoint humano) resolvida em 2026-11-20 pelo autor ("gh ok"): `gh` 2.105.0 instalado por tarball de release oficial em `~/.local/bin` (sha256 conferido, sem apt nem sudo), autenticado como `jguii` com escopos `repo`, `workflow`, `write:packages`, `read:org`, `gist`; nomes padrão `blog-no-law` (público) e `blog-no-law-backups` (privado). Decisão de privacidade do autor: os 88 commits de `main` e da branch da fase foram reescritos com e-mail `163598860+jguii@users.noreply.github.com`; por isso os SHAs citados em SUMMARYs anteriores são pré-reescrita (histórico esperado, não editar).
- Repositórios criados: https://github.com/jguii/blog-no-law (público) e https://github.com/jguii/blog-no-law-backups (privado, `private=true`).
- Endurecimento via API: secret scanning e push protection `enabled`; `default_workflow_permissions=read`, `can_approve_pull_request_reviews=false`; `approval_policy=all_external_contributors`.
- Varredura `gitleaks git --redact --no-banner .` sobre todo o histórico (78 commits, `git log --all`): "no leaks found" antes do primeiro push. D-12: `git ls-files .claude` e todo o histórico listam só `.claude/CLAUDE.md`.
- Bootstrap D-13: `git ls-tree -r --name-only main` listou 15 caminhos, todos em `.claude/CLAUDE.md`, `.gitignore`, `.planning/**`, `assets/**`; `git push -u origin main` empurrou a `main` local `6cedd23e68717ab2695643196465d77f8b0eacb7` (o texto do plano cita `b817f34`, o SHA pré-reescrita; mesmo conteúdo docs-only).
- Ruleset `main-protegida` (id **27773237**, criado 2026-11-20T20:52:01-03:00, `enforcement` active, sem `bypass_actors`) com `deletion`, `non_fast_forward`, `pull_request` (0 aprovações, só `merge`) e `required_status_checks` (`ci-ok`, `integration_id` 15368). Criado antes de qualquer push da branch da fase. A API aceitou todos os campos sem ajuste.
- PR de rascunho https://github.com/jguii/blog-no-law/pull/1 (branch `gsd/phase-01-esqueleto-no-ar-com-testes-e-ci`).
- CI (`.github/workflows/ci.yml`): gatilhos `pull_request` (main), `push` (main) e `workflow_dispatch`, sem `paths`, `permissions: contents: read`, `concurrency` com cancel-in-progress. Jobs: `lint`, `typecheck`, `test-api` (Postgres de serviço), `test-web`, `postgrest-anon`, `secrets`, `ci-ok`. Run 44839938429 (Task 2) e run 44840440974 (Task 3, commit `1a93f02`) verdes.
- Job `postgrest-anon` (D-14): PostgREST `v16.5` por digest, GET anônimo em todas as relações de `public` (`_prisma_migrations heartbeat`) imprime `POSTGREST_ANON_BLOCKED`; autoteste concede `SELECT` a `anon`, o smoke acusa `LEAK heartbeat 200` e o job imprime `POSTGREST_GATE_SELFTEST_OK`.
- Gates ligados: `package.json` com `check:raw-html` e `test:scripts`, `verify` os roda antes do `turbo run` (herdado pelo pre-push), job `lint` os roda também.

### SHAs das ações fixadas (resolvidos com `gh api repos/{acao}/commits/{tag}`)

| Ação | Tag | SHA |
| --- | --- | --- |
| actions/checkout | v7.0.1 | 3d3c42e5aac5ba805825da76410c181273ba90b1 |
| pnpm/action-setup | v6.1.1 | 73e46992e05b19abd31f2f3c20e0e7370d762115 |
| actions/setup-node | v7.1.0 | 949feb2413d6458794dcd2491c4babbbce0c15c1 |
| gitleaks/gitleaks-action | v3.0.0 | e0c47f4f8be36e29cdc102c57e68cb5cbf0e8d1e |

Imagem do PostgREST: `postgrest/postgrest:v16.5@sha256:1347d7552b88f17832912c06afbf7c43209af6eeeb60834b04aae12c9bd9d5cc` (digest puxado e testado localmente).

## Task Commits

1. **Task 1: gh instalado e autenticado** - sem commit (checkpoint humano, resolvido pelo autor)
2. **Task 2 (tracer): CI e publicação**
   - RED `53a9d68` (test: ci-ok e gitleaks falham em asserção; evidência RED validada por `gsd check tdd-red-evidence` = `RED_EVIDENCE_OK`)
   - GREEN `01c5139` (ci: workflow com ci-ok e `.gitleaks.toml`)
3. **Task 3: gates na CI e Dependabot**
   - RED `ff2cb81` (test: 5 casos novos falham em asserção, os 2 do Task 2 seguem verdes)
   - GREEN `1a93f02` (feat: gates, postgrest-anon, Dependabot)

**Último SHA empurrado para a branch remota da fase:** `1a93f0259368b82dcc82858252b7a3418c0190ca`.

## TDD Gate Compliance

RED (`test(01-09)`) precede GREEN (`ci(01-09)`/`feat(01-09)`) nos dois ciclos. RED do Task 2: semantic assessment: os dois casos falham em `assert.notEqual(..., '')` porque `ci.yml` e `.gitleaks.toml` não existem, ou seja, na asserção planejada e pelo motivo certo. RED do Task 3: 5 falhas em asserção (scripts ausentes no `package.json`, gates ausentes no `lint`, job `postgrest-anon` e `dependabot.yml` inexistentes, `postgrest-anon` fora do `needs`). Sem REFACTOR.

## Files Created/Modified

- `.github/workflows/ci.yml` - CI de 7 jobs, ações fixadas por SHA, `ci-ok` agregador
- `.github/dependabot.yml` - `github-actions` e `npm` (grupos prisma, nestjs, sentry, next-react, pino)
- `.gitleaks.toml` - regras padrão (`useDefault`) e allowlist de literais exatos de teste local
- `scripts/ci-gates.test.mjs` - 7 testes `node:test` da forma da CI, do gitleaks e da ligação dos gates
- `package.json` - scripts `check:raw-html`, `test:scripts` e `verify` estendido

## Decisions Made

- Cada entrada da allowlist do gitleaks é um literal inteiro ancorado (`^...$`); a guarda do teste reprova qualquer outra forma (T-01-45).
- O ruleset segue o plano sem alterações; nenhum `bypass_actors`, então nem o dono empurra direto na `main` depois do bootstrap.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Terceiro literal na allowlist do gitleaks**
- **Found during:** Task 2 (varredura do histórico)
- **Issue:** `gitleaks git` acusou 1 achado (`generic-api-key`) em `scripts/smoke-postgrest.test.mjs` (commit do 01-14): a chave fictícia de fixture `sb_publishable_TESTKEY_abc123XYZ` do servidor falso. Sem liberar, o histórico não passaria e o primeiro push ficaria bloqueado; o histórico não pode ser reescrito de novo.
- **Fix:** Adicionado um terceiro literal exato ancorado à allowlist (além de `app_api_local_test` e `postgres:postgres`). No Task 3 a guarda do gitleaks foi reforçada: cada entrada tem de ser literal ancorado, sem regex genérica. Não é credencial real.
- **Files modified:** `.gitleaks.toml`, `scripts/ci-gates.test.mjs`
- **Verification:** `gitleaks git` volta a "no leaks found"; guarda verde.
- **Committed in:** `01c5139` (config) e `ff2cb81` (guarda)

**2. [Rule 3 - Blocking] `gh repo create --source=.` não reconhece o worktree**
- **Found during:** Task 2, passo 4
- **Issue:** `gh repo create jguii/blog-no-law --public --source=. --remote=origin` falhou com "current directory is not a git repository" dentro do worktree.
- **Fix:** Criei o repositório sem `--source` e adicionei `origin` com `git remote add origin https://github.com/jguii/blog-no-law.git`.
- **Verification:** `git push` e `gh` funcionaram normalmente depois.

### Adaptações de execução em worktree (pedidas pelo orquestrador)

- Push da branch da fase por `git push origin HEAD:refs/heads/gsd/phase-01-esqueleto-no-ar-com-testes-e-ci` (o ref local dessa branch não tinha os commits do executor); sempre fast-forward, sem `--force`.
- PR criado com `--repo jguii/blog-no-law --body-file`, corpo terminando com a linha de atribuição do Claude Code.
- `git push -u origin main` empurrou o ref local `main` (`6cedd23`), que passou a rastrear `origin/main` na config local; nenhum outro ref local foi alterado.
- O pre-push (`pnpm run verify` com o compose de teste do próprio worktree) rodou nos dois pushes e passou; compose derrubado com `down -v` no fim.

**Total de desvios:** 2 corrigidos automaticamente (Rule 3), mais as adaptações acima.
**Impacto no plano:** nenhum no escopo; o literal extra é uma fixture fictícia, e a guarda ficou mais estrita que a do plano.

## Issues Encountered

- Na simulação local do PostgREST, `--network host` não alcança o loopback do WSL no Docker Desktop; para reproduzir o job localmente usei `-p 127.0.0.1:3000:3000` e `host.docker.internal`. Na CI (runner Linux) o `--network host` do plano funcionou de primeira.
- O autoteste do portão depende da linha única que a migration insere em `heartbeat` (`INSERT INTO heartbeat DEFAULT VALUES`); se uma migration futura remover essa linha, o autoteste daria `200 []` em vez de `LEAK` e o job falharia, o que é o comportamento desejado (alerta de portão sem sentido).
- `gh run list --workflow ci.yml` sem `--repo` não resolve o repositório a partir do worktree; todos os comandos `gh` usaram `--repo jguii/blog-no-law`.

## Authentication Gates

Task 1 (instalação e login do `gh`) foi o gate de autenticação, resolvido pelo autor antes desta continuação. Nenhum gate novo.

## User Setup Required

Nenhum além do já feito na Task 1. Sem segredos de produção criados no GitHub (fora do escopo deste plano).

## Known Stubs

Nenhum.

## Next Phase Readiness

- A `main` do remoto tem só docs; todo código chega por PR com `ci-ok` verde. O 01-10 acrescenta o job E2E ao `needs` do `ci-ok` (linha única) e o 01-12 dispara o deploy a partir do run de CI na `main`.
- Pendente para o orquestrador: o PR #1 segue em rascunho; o merge para a `main` acontece só depois dos demais planos, por PR.

## Self-Check: PASSED

- Arquivos presentes: `.github/workflows/ci.yml`, `.github/dependabot.yml`, `.gitleaks.toml`, `scripts/ci-gates.test.mjs`, `package.json`.
- Commits na branch: `53a9d68`, `01c5139`, `ff2cb81`, `1a93f02` (todos ancestrais do HEAD; `git rev-list --count 81b239f..HEAD` = 4 antes deste SUMMARY).
- Verificações finais: `node --test scripts/ci-gates.test.mjs` 7/7; `pnpm run test:scripts` 26/26; `pnpm run check:raw-html` RAW_HTML_OK; prettier OK; `ci-ok` e `postgrest-anon` com conclusão `success` no último run da branch.

---
*Phase: 01-esqueleto-no-ar-com-testes-e-ci*
*Completed: 2026-11-20*
