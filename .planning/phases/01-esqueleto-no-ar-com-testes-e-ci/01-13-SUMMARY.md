---
phase: 01-esqueleto-no-ar-com-testes-e-ci
plan: 13
subsystem: infra
tags: [backup, age, pg_dump, github-actions, keep-alive, supabase, ops]

requires:
  - phase: 01-esqueleto-no-ar-com-testes-e-ci
    provides: "deploy-api.yml (SHAs fixados, Environment production), verify-db-security.mjs --as-app, forma canônica de TLS (01-06), política de keep-alive da Render (01-11)"
provides:
  - ".github/workflows/backup.yml: heartbeat + pg_dump | age + release privada + retenção de 30 dias (na branch, ainda não na main)"
  - "ops/backup/age-recipients.txt: destinatário age público"
  - "verify-db-security.mjs --heartbeat-fresh (saída HEARTBEAT_FRESH)"
  - "scripts/backup-workflow.test.mjs: 6 guardas node:test do backup.yml"
affects: [01-13 Task 3 (restore drill), fase 3 (escopo do dump com Auth), fase 5 (Storage)]

actuals:
  tokens: 4900
  tasks: 1
  commits: 2
plan_head_before: 3ef522b59d28a71f3b1f28f8c566a48693857524
plan_head_after: 8d2e0fcfccc1f12cecce0305fb92b671a8fe4e21

tech-stack:
  added: [age (pacote apt do Ubuntu 24.04, só no runner)]
  patterns:
    - "Cliente libpq em container postgres:17 com -e DB_URL por nome, CA montada só leitura e PGSSLROOTCERT absoluto"
    - "Segredo de dump nunca em claro: pg_dump | age -R direto no pipe"

key-files:
  created:
    - .github/workflows/backup.yml
    - ops/backup/age-recipients.txt
    - scripts/backup-workflow.test.mjs
  modified:
    - apps/api/scripts/verify-db-security.mjs

key-decisions:
  - "TAG/NAME calculados num passo próprio logo após o checkout, para o passo final if: always() sempre ter NAME definido (com guarda ${NAME:-})"
  - "Retenção só apaga tags com prefixo db- e createdAt anterior a 30 dias, filtradas por jq; roda depois do gh release create"
  - "defaults.run.shell: bash e set -euo pipefail como primeira linha de todo run"

patterns-established:
  - "Testes de workflow como texto: helper runBlocks junta continuações e ignora o mapa defaults.run"

requirements-completed: []

coverage:
  - id: D1
    description: "backup.yml com as seis guardas (gatilhos/concorrência/runner, age do arquivo do Ubuntu, TLS canônico, dump cifrado no pipe com privilégios, retenção depois do release, SHAs fixados sem tracing)"
    requirement: OPS-03
    verification:
      - kind: unit
        ref: "scripts/backup-workflow.test.mjs (6 testes)"
        status: pass
      - kind: other
        ref: "grep gate do <verify> da Task 2 sobre .github/workflows/backup.yml"
        status: pass
    human_judgment: false
  - id: D2
    description: "Release cifrada no repositório privado criada por um run real do backup.yml na main"
    requirement: OPS-03
    verification:
      - kind: other
        ref: "gh release list/view no repositório de backups (checagem de release < 2 h com .dump.age não vazio)"
        status: fail
    human_judgment: true
    rationale: "Depende do merge na main e do dispatch feitos pelo orquestrador; ainda RED"
  - id: D3
    description: "Heartbeat de produção fresco (< 2 h) depois do primeiro run"
    requirement: OPS-03
    verification:
      - kind: integration
        ref: "NODE_EXTRA_CA_CERTS=... node apps/api/scripts/verify-db-security.mjs --as-app --heartbeat-fresh"
        status: fail
    human_judgment: true
    rationale: "Depende do run do backup.yml na main; ainda RED (idade_s=90505)"

duration: 5min
completed: 2026-11-21
status: in-progress
---

# Phase 1 Plan 13: Backup noturno cifrado e keep-alive (PARCIAL) Summary

**Workflow `backup.yml` (heartbeat real + `pg_dump -Fc --schema=public | age -R` para releases do repositório privado `blog-no-law-backups`, retenção de 30 dias) escrito por TDD e verde nas 6 guardas; aguarda merge na `main` e o primeiro dispatch pelo orquestrador.**

> Status: **in-progress**. Task 1 concluída (checkpoint humano). Task 2 concluída até o commit GREEN; faltam push → PR → `ci-ok` → merge (merge commit) → `gh workflow run backup.yml --ref main` (orquestrador). Task 3 não iniciada.

## Performance

- **Duration:** cerca de 5 min (execução da Task 2 até o GREEN)
- **Started:** 2026-11-21T22:26:36Z
- **Completed (parcial):** 2026-11-21T22:31:01Z
- **Tasks:** 1 de 3 completa, Task 2 em andamento (GREEN local; falta o run na main)
- **Files modified:** 4

## Accomplishments

- Task 1 (checkpoint humano, verificado pelo orquestrador em 2026-11-21): chave age gerada, privada em `~/.config/blog-no-law/backup.age.key` (modo 600, cópia no gerenciador de senhas confirmada pelo autor); chave pública `age1v6tkfntd0qaur5vr5u2gc7335ksyc4t46gpaqj6j9jpm602wgcdqlm8jw8` (casa `^age1[0-9a-z]{58}$`); secret `BACKUP_REPO_TOKEN` no Environment `production`; política `Política de keep-alive (D-03): RISCO_ACEITO` em `docs/runbooks/render.md`; dois monitores UptimeRobot de 5 min em `/health/live` e `/health/ready` (HEAD 200 nos dois).
- Task 2, RED: `scripts/backup-workflow.test.mjs` com 6 guardas, todas falhando em asserção antes do workflow existir; flag `--heartbeat-fresh` em `verify-db-security.mjs` falhando contra produção.
- Task 2, passo 1: `ops/backup/age-recipients.txt` com a chave pública e comentários `#` (a chave privada fica offline).
- Task 2, passo 2: variável `BACKUP_REPO=jguii/blog-no-law-backups` no Environment `production` (`gh variable get` confirma). Repositório de backups é privado (`gh api ... --jq .private` → `true`) e tem 1 commit na `main` (pré-requisito do `gh release create`).
- Task 2, passo 3/4: `.github/workflows/backup.yml` escrito e formatado; 6/6 testes verdes; gate de grep e `prettier --check` verdes; `test:scripts` 52/52.

## Task Commits

1. **Task 1: chave age, token e UptimeRobot** - sem commit (checkpoint humano sobre estado externo)
2. **Task 2 RED** - `6b7cf0c` (test) `test(01-13): add failing backup workflow tests and heartbeat freshness check`
3. **Task 2 GREEN** - `8d2e0fc` (feat) `feat(01-13): nightly encrypted backup to a private repository`

**Partial summary:** `docs(01-13): partial summary (awaiting merge to main)`

## TDD evidence

**RED (workflow):** `node --test --test-reporter=tap scripts/backup-workflow.test.mjs` → exit 1, `# tests 6`, `# pass 0`, `# fail 6`; cada caso falhou com `ERR_ASSERTION` e `error: '.github/workflows/backup.yml precisa existir'`. Classificador: `gsd-tools check tdd-red-evidence` → `RED_EVIDENCE_OK` (`reason: target_test_failed`, alvo `guarda 1: ...`). Avaliação semântica: os 6 testes alvo rodaram e falharam na asserção planejada (o arquivo do workflow não existia), sem erro de carregamento, sintaxe ou descoberta.

**RED (ponta a ponta, heartbeat):** `NODE_EXTRA_CA_CERTS="$PWD/apps/api/certs/supabase-ca.crt" node apps/api/scripts/verify-db-security.mjs --as-app --heartbeat-fresh` → exit 1; todas as checagens anteriores `PASS` e `FAIL heartbeat_fresh idade_s=90345 (máximo 7200)` (ninguém gravou no `heartbeat` desde a migration).

**GREEN (workflow):** `node --test scripts/backup-workflow.test.mjs` → `# tests 6`, `# pass 6`, `# fail 0`. Checagem extra de mutação (fora do repositório): cada uma de 9 mutações do `backup.yml` (`--no-privileges`, `cancel-in-progress: true`, `ubuntu-latest`, PGSSLROOTCERT relativo, dump redirecionado para arquivo, ação por tag, `set -x`, `if: success()` no último passo, `-e DB_URL=valor`) derrubou ao menos uma guarda; arquivo restaurado e reconferido.

**Ainda RED (dependem do run na main, esperado):**
- Checagem de release (`gh release list ... < 7200 s` + `.dump.age` > 0): exit 1, `TAG=[]` (nenhuma release ainda; `jq` em `.[0]` nulo).
- `--heartbeat-fresh`: exit 1, `FAIL heartbeat_fresh idade_s=90505 (máximo 7200)`.

## Checks automáticos da Task 2 (fora os que dependem do run)

| Check | Resultado |
|---|---|
| `node --test scripts/backup-workflow.test.mjs` | PASS, 6/6 |
| Gate de grep (`ubuntu-24.04`, `apt-get install`, `PGSSLROOTCERT=/certs/supabase-ca.crt`, `NON_CANONICAL_TLS_URL`, sem `sslrootcert=`/`--no-privileges`/`releases/download`) | PASS, exit 0 |
| `pnpm exec prettier --check --ignore-unknown` nos 3 arquivos | PASS |
| `pnpm run format:check` (árvore inteira) | PASS |
| `pnpm run test:scripts` | PASS, 52/52 |
| Contém `17 5 * * *`, `workflow_dispatch`, `cancel-in-progress: false`, `age -R ops/backup/age-recipients.txt` | PASS |
| `grep -n upload-artifact` / `grep -nE 'pg_dump[^|]*>'` / `grep -n releases/download` | vazios (PASS) |
| `gh release create` (linha 109) antes de `gh release delete` (linha 122) | PASS |
| `gh api repos/jguii/blog-no-law-backups --jq .private` | `true` (PASS) |
| YAML carrega (`python3 yaml.safe_load`), 9 passos | PASS |
| `git ls-files '*.dump*'` | vazio (PASS) |
| `age --version` do run | PENDENTE (sai do log do primeiro run na main) |
| Release recente no repositório privado | RED (esperado, aguarda dispatch) |
| `--heartbeat-fresh` em produção | RED (esperado, aguarda dispatch) |

## Files Created/Modified

- `.github/workflows/backup.yml` - backup noturno: age do apt, guarda de TLS canônico, heartbeat, dump cifrado no pipe, release privada, retenção de 30 dias, limpeza `if: always()`
- `ops/backup/age-recipients.txt` - destinatário age público (com comentários `#`, aceitos por `age -R`)
- `scripts/backup-workflow.test.mjs` - 6 guardas `node:test` lendo o workflow como texto
- `apps/api/scripts/verify-db-security.mjs` - flag `--heartbeat-fresh` (exige `--as-app`; `beat_at` < 2 h lido como `app_api`; imprime `HEARTBEAT_FRESH`)

## Decisions Made

- `TAG`/`NAME` são definidos num passo próprio logo depois do checkout (exportados por `$GITHUB_ENV`), para que o passo final `if: always()` encontre `NAME` mesmo quando o dump falha; a limpeza ainda tem a guarda `${NAME:-}` para o caso de falha no checkout.
- A retenção filtra por `jq` só tags `db-*` com `createdAt` anterior a `date -u -d '30 days ago'`, e nunca roda se o upload falhou (passos sequenciais sob `set -e`).
- O passo de dump confere o arquivo cifrado (`test -s` e cabeçalho `age-encryption.org/v1` dos primeiros 21 bytes) e imprime só o nome e o tamanho.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Helper `runBlocks` do teste tratava `defaults.run` como comando**
- **Found during:** Task 2 (GREEN)
- **Issue:** o `backup.yml` declara `defaults: run: shell: bash`; o helper lia esse `run:` sem valor como um bloco vazio e a guarda 6 acusava "run sem set -euo pipefail".
- **Fix:** o helper ignora `run:` sem valor (é um mapa, não um comando). As asserções não mudaram.
- **Files modified:** `scripts/backup-workflow.test.mjs`
- **Verification:** 6/6 verdes e as 9 mutações continuam derrubando guardas.
- **Committed in:** `8d2e0fc`

**2. [Rule 3 - Blocking] Ledger do plano fora do git-dir**
- **Found during:** início da execução
- **Issue:** o isolamento do worktree recusou comandos que escrevem em `.git/worktrees/...` (ledger `gsd-plan-head-before-01-13` e sentinela de cwd).
- **Fix:** base registrada no scratchpad da sessão; o valor é o `EXPECTED_BASE` dado pelo orquestrador (`3ef522b...`) e `commits` foi medido com `git rev-list --count 3ef522b..HEAD` = 2.
- **Files modified:** nenhum
- **Committed in:** n/a

---

**Total deviations:** 2 auto-fixed (1 bug no helper de teste, 1 bloqueio de ambiente)
**Impact on plan:** nenhum efeito no comportamento do workflow; sem aumento de escopo.

## Issues Encountered

- `git` e caminhos com `.github` em comandos compostos são recusados pelo isolamento do worktree; as checagens foram postas num script no scratchpad.

## User Setup Required

Já feito na Task 1 (chave age, `BACKUP_REPO_TOKEN`, UptimeRobot). A variável `BACKUP_REPO` foi gravada pelo executor.

## Next Phase Readiness

- **Orquestrador:** push da branch, PR da branch da fase para a `main`, esperar `ci-ok`, `gh pr merge --merge` (merge commit, D-13), `gh workflow run backup.yml --ref main --repo jguii/blog-no-law` e `gh run watch --exit-status`. Depois, reexecutar a checagem de release e `--heartbeat-fresh` (devem ficar verdes) e anotar o `age --version` do log no SUMMARY.
- **Task 3** (restore drill e runbooks) começa depois do primeiro release real.

## Self-Check: PASSED

- FOUND: `.github/workflows/backup.yml`, `ops/backup/age-recipients.txt`, `scripts/backup-workflow.test.mjs`, `apps/api/scripts/verify-db-security.mjs`
- FOUND: `6b7cf0c` e `8d2e0fc` como ancestrais de HEAD

---
*Phase: 01-esqueleto-no-ar-com-testes-e-ci*
*Parcial: 2026-11-21*
