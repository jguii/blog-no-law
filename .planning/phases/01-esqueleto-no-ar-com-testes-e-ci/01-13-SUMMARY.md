---
phase: 01-esqueleto-no-ar-com-testes-e-ci
plan: 13
subsystem: infra
tags: [backup, age, pg_dump, pg_restore, github-actions, keep-alive, supabase, uptimerobot, ops, runbook]

requires:
  - phase: 01-esqueleto-no-ar-com-testes-e-ci
    provides: "deploy-api.yml (SHAs fixados, Environment production), verify-db-security.mjs --as-app, forma canônica de TLS (01-06), política de keep-alive da Render (01-11), baseline com app_api/RLS/heartbeat (01-05/01-06)"
provides:
  - ".github/workflows/backup.yml na main: heartbeat diário + pg_dump | age + release privada + retenção de 30 dias por publishedAt"
  - "ops/backup/age-recipients.txt: destinatário age público"
  - "verify-db-security.mjs --heartbeat-fresh (saída HEARTBEAT_FRESH)"
  - "scripts/restore-drill.sh: restore cronometrado (RESTORE_OK tag= seconds= / RESTORE_FAIL {checagem}), DRILL_PLATFORM_ROLES=(supabase_admin)"
  - "scripts/backup-workflow.test.mjs (7 guardas) e scripts/restore-drill.test.mjs (6 casos)"
  - "docs/runbooks/backup-restore.md e docs/runbooks/rotacao-segredos.md"
  - "Monitores UptimeRobot de 5 min em /health/live e /health/ready; releases db-* em blog-no-law-backups"
affects: [fase 3 (escopo do dump com o schema auth), fase 4 (jobs e sono da API), fase 5 (Storage fora do dump), /gsd-ship (PR final leva o fix de publishedAt à main)]

actuals:
  tokens: 14500
  tasks: 3
  commits: 11
plan_head_before: 3ef522b59d28a71f3b1f28f8c566a48693857524
plan_head_after: ffd7cedc8bdb4d75b66db8258c905247e8a1d59d

tech-stack:
  added: [age (pacote apt do Ubuntu 24.04 no runner; age 1.2.1 local do autor)]
  patterns:
    - "Cliente libpq em container postgres:17 com -e DB_URL por nome, CA montada só leitura e PGSSLROOTCERT absoluto"
    - "Dump nunca em claro: pg_dump | age -R no backup e age -d | pg_restore no restore, só pelo pipe"
    - "Idade de release do GitHub sempre por publishedAt (createdAt é a data do commit alvo da tag)"
    - "Drill com executáveis falsos (gh, age, docker) no PATH e env montado do zero"

key-files:
  created:
    - .github/workflows/backup.yml
    - ops/backup/age-recipients.txt
    - scripts/backup-workflow.test.mjs
    - scripts/restore-drill.sh
    - scripts/restore-drill.test.mjs
    - docs/runbooks/backup-restore.md
    - docs/runbooks/rotacao-segredos.md
  modified:
    - apps/api/scripts/verify-db-security.mjs

key-decisions:
  - "Retenção e escolha do último backup medem a release por publishedAt; createdAt é a data do commit alvo e é igual para todas as releases do repositório de backups"
  - "Restore com pg_restore --no-owner --clean --if-exists --exit-on-error: o dump de --schema=public traz CREATE SCHEMA public, que um banco novo já tem"
  - "DRILL_PLATFORM_ROLES=(supabase_admin): o dump mantém os ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin do Supabase"
  - "Drill com auth TCP scram (--auth-host=scram-sha-256) e senha de uso único do app_api: a leitura de runtime é um login com senha de verdade"
  - "seconds do RESTORE_OK mede do download ao fim das checagens (RTO prático), com a imagem postgres:17 já baixada"
  - "TAG/NAME calculados num passo próprio logo após o checkout, para o passo final if: always() sempre ter NAME definido"

patterns-established:
  - "Testes de workflow como texto: helper runBlocks junta continuações e ignora o mapa defaults.run"
  - "Scripts operacionais imprimem um marcador final (RESTORE_OK/RESTORE_FAIL {checagem}) e limpam containers no trap"

requirements-completed: [OPS-03]

coverage:
  - id: D1
    description: "backup.yml com as guardas de gatilhos/concorrência/runner, age do arquivo do Ubuntu, TLS canônico, dump cifrado no pipe com privilégios, retenção depois do release por publishedAt, SHAs fixados sem tracing"
    requirement: OPS-03
    verification:
      - kind: unit
        ref: "scripts/backup-workflow.test.mjs (7 testes, guardas 1-7)"
        status: pass
      - kind: other
        ref: "grep gate do <verify> da Task 2 sobre .github/workflows/backup.yml"
        status: pass
    human_judgment: false
  - id: D2
    description: "Release cifrada no repositório privado criada por um run real do backup.yml na main"
    requirement: OPS-03
    verification:
      - kind: integration
        ref: "gh release list --json tagName,publishedAt (< 7200 s) + gh release view (.dump.age 10113 bytes); run 44957527489 success"
        status: pass
    human_judgment: false
  - id: D3
    description: "Heartbeat de produção fresco (< 2 h) depois do run do backup"
    requirement: OPS-03
    verification:
      - kind: integration
        ref: "NODE_EXTRA_CA_CERTS=... node apps/api/scripts/verify-db-security.mjs --as-app --heartbeat-fresh -> HEARTBEAT_FRESH"
        status: pass
    human_judgment: false
  - id: D4
    description: "Restore drill: o último backup real restaurado num Postgres 17 descartável, com privilégio do app_api vindo do backup, anon negado e leitura real de heartbeat como app_api"
    requirement: OPS-03
    verification:
      - kind: unit
        ref: "scripts/restore-drill.test.mjs (6 casos)"
        status: pass
      - kind: integration
        ref: "bash scripts/restore-drill.sh -> RESTORE_OK tag=db-20261121T223555Z seconds=8"
        status: pass
    human_judgment: false
  - id: D5
    description: "Runbooks de backup/restore (registro do drill, alerta dos 60 dias, Fontes de keep-alive) e de rotação de segredos (sete itens, D-07)"
    requirement: OPS-03
    verification:
      - kind: other
        ref: "checagens de aceite por grep (drill, 60 dias, Fontes de keep-alive x render.md, sete itens, D-07) + prettier --check"
        status: pass
    human_judgment: false
  - id: D6
    description: "Monitores do UptimeRobot (/health/live e /health/ready) Up há algumas horas, sem quedas longas"
    requirement: OPS-03
    verification: []
    human_judgment: true
    rationale: "<human-check> da Task 3: só o autor vê o painel do UptimeRobot, e o histórico de horas ainda não existe; fica para a UAT da fase"

duration: 24min
completed: 2026-11-21
status: complete
---

# Phase 1 Plan 13: Backup noturno cifrado, restore drill e keep-alive Summary

**Backup diário às 05:17 UTC (`UPDATE heartbeat` + `pg_dump --schema=public | age -R` para releases do repositório privado, retenção de 30 dias por `publishedAt`) rodando na `main`, restaurado de verdade uma vez (`RESTORE_OK tag=db-20261121T223555Z seconds=8`, com o `app_api` lendo `heartbeat` por login com senha), mais runbooks de backup/restore e de rotação de segredos.**

## Performance

- **Duration:** cerca de 24 min de relógio (22:26:36Z a 22:50Z), incluindo o merge e o dispatch feitos pelo orquestrador entre as Tasks 2 e 3
- **Started:** 2026-11-21T22:26:36Z
- **Completed:** 2026-11-21T22:50:00Z
- **Tasks:** 3 de 3
- **Files modified:** 8 (7 criados, 1 alterado)

## Accomplishments

- **Task 1 (checkpoint humano, verificado em 2026-11-21):** chave age gerada, privada em `~/.config/blog-no-law/backup.age.key` (modo 600, cópia no gerenciador de senhas confirmada pelo autor); chave pública `age1v6tkfntd0qaur5vr5u2gc7335ksyc4t46gpaqj6j9jpm602wgcdqlm8jw8` (casa `^age1[0-9a-z]{58}$`); secret `BACKUP_REPO_TOKEN` no Environment `production` (gravado 2026-11-21T21:45:34Z, validade de 1 ano); `Política de keep-alive (D-03): RISCO_ACEITO` em `docs/runbooks/render.md`; dois monitores UptimeRobot de 5 min em `/health/live` e `/health/ready` (HEAD 200 nos dois).
- **Task 2 (tracer):** `backup.yml` escrito por TDD (RED `6b7cf0c`, GREEN `8d2e0fc`), variável `BACKUP_REPO=jguii/blog-no-law-backups` no Environment `production`, repositório de backups privado. O orquestrador fez push, abriu o PR #7 (todos os checks verdes, `ci-ok` incluso) e mergeou com merge commit `fa5ee76aabf1a349410694e669458393e514dfb6` (segundo merge no meio da fase, exceção da D-13). Dispatch do Backup na `main`: run `44957527489`, todos os passos `success`; `age --version` no runner = **`1.1.1`**; log `Backup cifrado: db-20261121T223555Z.dump.age (10113 bytes)`; release `db-20261121T223555Z` com o asset de 10113 bytes. `verify-db-security.mjs --as-app --heartbeat-fresh` → `PASS heartbeat_fresh`, `APP_API_OK`, `HEARTBEAT_FRESH`. O `Deploy API` disparado pelo merge (run `44957670712`) terminou `success` no SHA `fa5ee76`.
- **Correção da retenção (Rule 1):** a retenção passou de `createdAt` para `publishedAt` (RED `acdf917`, GREEN `012dc84`); sem isso, por volta de 2026-12-20 o job apagaria todos os backups.
- **Task 3:** `restore-drill.sh` com 6 testes de executáveis falsos (RED `ebaf056`, GREEN `5b63a78`), mais um ciclo RED/GREEN (`ee9c44a`, `4990b43`) pelo que o drill real revelou. Drill real em 2026-11-21T22:43:20Z: **`RESTORE_OK tag=db-20261121T223555Z seconds=8`**, sem `RESTORE_FAIL` e sem `error:` do `pg_restore`; o container do drill sumiu (`docker ps -a` sem ele; o `api-pedidos-api-1` não foi tocado). Runbooks `backup-restore.md` e `rotacao-segredos.md` (`ffd7ced`).

## Task Commits

1. **Task 1: chave age, token e UptimeRobot** - sem commit (checkpoint humano sobre estado externo)
2. **Task 2 RED** - `6b7cf0c` (test) `test(01-13): add failing backup workflow tests and heartbeat freshness check`
3. **Task 2 GREEN** - `8d2e0fc` (feat) `feat(01-13): nightly encrypted backup to a private repository`
4. **Resumo parcial** - `e44ccb6` (docs), mergeado no worktree por `5efbe31`
5. **Fix da retenção RED** - `acdf917` (test) `test(01-13): retention must use publishedAt`
6. **Fix da retenção GREEN** - `012dc84` (fix) `fix(01-13): base backup retention on publishedAt`
7. **Task 3 RED** - `ebaf056` (test) `test(01-13): add failing restore drill tests`
8. **Task 3 GREEN** - `5b63a78` (feat) `feat(01-13): add timed restore drill`
9. **Drill real RED** - `ee9c44a` (test) `test(01-13): restore must replace the target's existing public schema`
10. **Drill real GREEN** - `4990b43` (fix) `fix(01-13): restore drill passes against the real backup`
11. **Runbooks** - `ffd7ced` (docs) `docs(01-13): record restore drill and secret rotation runbooks`

**Plan metadata:** `docs(01-13): complete backup plan summary`

## TDD evidence

**Task 2, RED (workflow):** `node --test --test-reporter=tap scripts/backup-workflow.test.mjs` → exit 1, 6/6 falhando com `ERR_ASSERTION` (`.github/workflows/backup.yml precisa existir`). Classificador → `RED_EVIDENCE_OK`. Semântica: os alvos rodaram e falharam na asserção planejada, sem erro de carga. **RED de ponta a ponta:** `--heartbeat-fresh` em produção → `FAIL heartbeat_fresh idade_s=90345 (máximo 7200)`. **GREEN:** 6/6; 9 mutações do `backup.yml` derrubaram ao menos uma guarda cada.

**Fix da retenção, RED:** guarda 7 nova; `node --test --test-reporter=tap scripts/backup-workflow.test.mjs` → `# tests 7`, `# pass 6`, `# fail 1`, só a guarda 7, com `ERR_ASSERTION` "a lista de releases pede tagName e publishedAt" (o bloco ainda tinha `--json tagName,createdAt`). Classificador → `RED_EVIDENCE_OK` (`target_test_failed`). Semântica: falha na asserção do comportamento planejado. **GREEN:** 7/7 e `prettier --check` limpo. Dry-run do filtro novo contra o repositório real (só listagem): corte de 30 dias seleciona nada; corte em "agora + 1 s" seleciona `db-20261121T223555Z` (o filtro funciona e mede pela publicação: `age_pub_s=165` contra `age_created_s=82074`).

**Task 3, RED:** `node --test --test-reporter=tap scripts/restore-drill.test.mjs` → `# tests 6`, `# pass 0`, `# fail 6`, todos com `ERR_ASSERTION` "scripts/restore-drill.sh precisa existir". Classificador → `RED_EVIDENCE_OK` (alvo caso 1). Semântica: falha da asserção planejada, não de carga do teste. **GREEN:** 6/6.

**Drill real, RED:** o primeiro drill real parou com `ERROR: schema "public" already exists` (`CREATE SCHEMA public`); a asserção nova do caso 1 (`--clean --if-exists` no `pg_restore`) falhou sozinha (5/6). **GREEN:** 6/6 com `--clean --if-exists`; o segundo drill real parou com `role "supabase_admin" does not exist` (privilégios padrão do Supabase), resolvido por `DRILL_PLATFORM_ROLES=(supabase_admin)`; o terceiro deu `RESTORE_OK`.

## Checks da Task 3 e do plano

| Check | Resultado |
|---|---|
| `node --test scripts/restore-drill.test.mjs` | PASS, 6/6 |
| `node --test scripts/backup-workflow.test.mjs` | PASS, 7/7 |
| `bash scripts/restore-drill.sh` | PASS, `RESTORE_OK tag=db-20261121T223555Z seconds=8` |
| Gate de grep do drill (`has_table_privilege('app_api'`, `-U app_api`, sem `--no-privileges` no drill e no `backup.yml`) | PASS |
| `prettier --check` dos runbooks e do teste do drill; `pnpm run format:check` | PASS |
| `pnpm run test:scripts` | PASS, 59/59 |
| Release recente (verificação do plano com **`publishedAt`** no lugar de `createdAt`) | PASS, `db-20261121T223555Z`, `.dump.age` 10113 bytes |
| `--as-app --heartbeat-fresh` em produção (22:46Z) | PASS, `APP_API_OK`, `HEARTBEAT_FRESH` |
| `gh api repos/jguii/blog-no-law-backups --jq .private` | `true` |
| Estado do workflow `backup.yml` | `active` |
| `git ls-files '*.dump*'` | vazio |
| Auth do drill exige senha por TCP (sonda descartável fora do repositório) | sem senha: `fe_sendauth: no password supplied`; senha errada: `password authentication failed`; senha certa: `1` |
| `<human-check>` UptimeRobot Up há horas | **Fica para a UAT da fase** (não executável pelo executor; os monitores existem desde a Task 1) |

## Files Created/Modified

- `.github/workflows/backup.yml` - backup noturno: age do apt, guarda de TLS canônico, heartbeat, dump cifrado no pipe, release privada, retenção de 30 dias por `publishedAt`, limpeza `if: always()`
- `ops/backup/age-recipients.txt` - destinatário age público
- `scripts/backup-workflow.test.mjs` - 7 guardas `node:test` lendo o workflow como texto
- `apps/api/scripts/verify-db-security.mjs` - flag `--heartbeat-fresh`
- `scripts/restore-drill.sh` - restore cronometrado num `postgres:17` descartável em `127.0.0.1:54330`, com checagens de runtime e limpeza no `trap`
- `scripts/restore-drill.test.mjs` - 6 casos com `gh`, `age` e `docker` falsos
- `docs/runbooks/backup-restore.md` - procedimento, primeiro backup, registro do drill, restore em produção, Fontes de keep-alive, alerta dos 60 dias
- `docs/runbooks/rotacao-segredos.md` - inventário e rotação de sete segredos, "segredo vazou" (D-07)

## Decisions Made

- A idade de uma release do GitHub é sempre lida de `publishedAt` (retenção do `backup.yml` e escolha do último backup no drill).
- O drill restaura com `--clean --if-exists` e cria `supabase_admin` NOLOGIN antes do restore; o runbook registra a lista `DRILL_PLATFORM_ROLES`.
- A leitura de runtime do drill é um login real com senha: o container usa `--auth-host=scram-sha-256` e o `app_api` recebe uma senha de uso único (passada ao `psql` por `-e PGPASSWORD`, nome sem valor).
- `seconds` do `RESTORE_OK` mede do download ao fim das checagens (RTO prático), com a imagem já baixada.
- O drill escolhe o último backup ordenando todas as releases `db-*` por `publishedAt` em vez de `gh release list --limit 1` (a ordem padrão do GitHub segue a data de criação, que empata).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Retenção baseada em `createdAt` apagaria todos os backups**
- **Found during:** depois da Task 2 (orquestrador, comparando a release real)
- **Issue:** o `createdAt` de uma release é a data do commit alvo da tag. A release `db-20261121T223555Z` tem `createdAt` 2026-11-20T23:50:58Z (o único commit do repositório de backups) e `publishedAt` 2026-11-21T22:36:07Z. Por volta de 2026-12-20 o passo de retenção apagaria todas as releases, inclusive a recém-publicada.
- **Fix:** `--json tagName,publishedAt` e `(.publishedAt | fromdateiso8601) < $cutoff`; guarda 7 proíbe `createdAt` no workflow. A verificação de release do plano foi rodada com `publishedAt` no lugar de `createdAt`, e o runbook descreve a checagem de frescor com `publishedAt`.
- **Files modified:** `scripts/backup-workflow.test.mjs`, `.github/workflows/backup.yml`
- **Verification:** RED 6/7 (só a guarda 7), GREEN 7/7, dry-run do filtro contra o repositório real.
- **Committed in:** `acdf917` (RED), `012dc84` (GREEN)
- **Nota:** a `main` ainda tem a versão com `createdAt` (merge `fa5ee76`); o fix chega à `main` no PR final da fase. O bug não pode disparar antes de cerca de **2026-12-20** (30 dias depois do commit de 2026-11-20 do repositório de backups).

**2. [Rule 1 - Bug] `pg_restore` falhava em `CREATE SCHEMA public`**
- **Found during:** Task 3, primeiro drill real
- **Issue:** `pg_dump --schema=public` emite `CREATE SCHEMA public`; um banco novo já tem o schema, e com `--exit-on-error` o restore parava (`schema "public" already exists`).
- **Fix:** `pg_restore --no-owner --clean --if-exists --exit-on-error` (troca o `public` vazio do destino pelo do backup, com os privilégios do backup). Asserção nova no caso 1.
- **Files modified:** `scripts/restore-drill.test.mjs`, `scripts/restore-drill.sh`
- **Verification:** RED do caso 1, GREEN 6/6, drill real `RESTORE_OK`.
- **Committed in:** `ee9c44a` (RED), `4990b43` (GREEN)

**3. [Rule 3 - Blocking, previsto no plano] `DRILL_PLATFORM_ROLES=(supabase_admin)`**
- **Found during:** Task 3, segundo drill real
- **Issue:** `role "supabase_admin" does not exist` em `ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public ...` do dump.
- **Fix:** o papel entra na lista `DRILL_PLATFORM_ROLES`, criado NOLOGIN antes do restore; a lista está registrada no runbook.
- **Files modified:** `scripts/restore-drill.sh`, `docs/runbooks/backup-restore.md`
- **Committed in:** `4990b43`, `ffd7ced`

**4. [Rule 1 - Bug] `gh release list --limit 1` não garante o último backup**
- **Found during:** Task 3 (implementação)
- **Issue:** a ordem padrão da lista de releases segue a data de criação, que é a mesma para todas as releases deste repositório (ver desvio 1).
- **Fix:** o drill lista até 200 releases e escolhe a `db-*` com maior `publishedAt`.
- **Files modified:** `scripts/restore-drill.sh`
- **Committed in:** `5b63a78`

**5. [Rule 3 - Blocking] Ledger do plano fora do git-dir**
- **Found during:** início da execução (Task 2)
- **Issue:** o isolamento do worktree recusa escrever em `.git/worktrees/...` (ledger e sentinela de cwd) e comandos `git` compostos.
- **Fix:** base do plano = `EXPECTED_BASE` do orquestrador (`3ef522b...`); `commits` medido com `git rev-list --count 3ef522b..HEAD` = 11 (10 sem o merge `5efbe31` do worktree). O registro de evidência RED foi escrito na raiz do worktree só durante a classificação e apagado em seguida (nunca commitado).

**6. [Rule 1 - Bug] Helper `runBlocks` do teste tratava `defaults.run` como comando** (Task 2, `8d2e0fc`): o helper ignora `run:` sem valor; asserções intactas.

---

**Total deviations:** 6 auto-fixed (4 bugs, 2 bloqueios)
**Impact on plan:** todos necessários para o backup e o restore funcionarem de verdade; sem aumento de escopo.

## Issues Encountered

- Comandos `git` compostos e escritas em `.git/worktrees` são recusados pelo isolamento do worktree; checagens foram feitas em comandos simples e em scripts do scratchpad.
- O restore em um projeto Supabase de verdade não foi ensaiado (o `postgres` do Supabase não é superusuário nem membro de `supabase_admin`). O runbook marca o procedimento de produção como não testado e diz como tratar o erro esperado.

## Known Stubs

Nenhum.

## User Setup Required

Já feito na Task 1 (chave age, `BACKUP_REPO_TOKEN`, UptimeRobot). Lembrete: o `BACKUP_REPO_TOKEN` vence por volta de 2027-11-21 (`rotacao-segredos.md`).

## Next Phase Readiness

- OPS-03 atendido: backup noturno cifrado e privado fora do Supabase, restaurado uma vez (8 s), e keep-alive diário (escrita do `backup.yml` + UptimeRobot com RISCO_ACEITO).
- **Pendências para a UAT da fase:** `<human-check>` do UptimeRobot (os dois monitores Up há algumas horas, sem quedas longas).
- **Para o `/gsd-ship`:** o PR final leva à `main` o fix de `publishedAt` (`012dc84`) antes de ~2026-12-20.
- **Fase 3/5:** revisar o escopo do dump (schema `auth`, Storage) e o restore.

## Self-Check: PASSED

- FOUND: `.github/workflows/backup.yml`, `ops/backup/age-recipients.txt`, `scripts/backup-workflow.test.mjs`, `apps/api/scripts/verify-db-security.mjs`, `scripts/restore-drill.sh`, `scripts/restore-drill.test.mjs`, `docs/runbooks/backup-restore.md`, `docs/runbooks/rotacao-segredos.md`
- FOUND como ancestrais de HEAD: `6b7cf0c`, `8d2e0fc`, `e44ccb6`, `acdf917`, `012dc84`, `ebaf056`, `5b63a78`, `ee9c44a`, `4990b43`, `ffd7ced`

---
*Phase: 01-esqueleto-no-ar-com-testes-e-ci*
*Completed: 2026-11-21*
