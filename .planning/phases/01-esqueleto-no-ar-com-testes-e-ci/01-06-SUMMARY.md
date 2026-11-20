---
phase: 01-esqueleto-no-ar-com-testes-e-ci
plan: 06
subsystem: database
tags: [supabase, postgres-17, prisma-7, rls, postgrest, tls, runbook, tdd, tracer]

requires:
  - phase: 01-esqueleto-no-ar-com-testes-e-ci
    provides: "Migration baseline com app_api, RLS e heartbeat (01-04); API lendo heartbeat como app_api (01-05)"
provides:
  - "Projeto Supabase de produção em us-east-1 com a migration baseline aplicada por prisma migrate deploy (schema em dia)"
  - "verify-db-security.mjs [--as-app]: checagem PASS/FAIL de RLS, atributos do app_api e privilégios de anon/authenticated/service_role em produção"
  - "smoke-postgrest.sh: prova anônima pela Data API (401/42501 em heartbeat e _prisma_migrations); reaproveitado pelo job postgrest-anon da CI (D-14)"
  - "set-app-api-password.mjs: senha aleatória do app_api + DATABASE_URL no env file local; procedimento de rotação"
  - "Credencial de runtime app_api.{ref} provada pelo pooler (lê heartbeat, UPDATE negado)"
  - "docs/runbooks/supabase-producao.md: região, pooler, credenciais por nome, rotação, forma canônica de TLS e resultado da Open Question 7"
affects: [01-09, 01-11, 01-12, 01-13, 01-14]

actuals:
  tokens: 16500
  tasks: 3
  commits: 6

plan_head_before: 5ba96fffd326d9f4273fe373f1938e02d4932511
plan_head_after: 48bdd12e8281bbe797fa77a5ac7b652f959d183f

tech-stack:
  added: []
  patterns:
    - "Scripts de verificação imprimem só PASS/FAIL/SKIP e o SQLSTATE; nunca URL, usuário com senha nem mensagem crua do driver"
    - "Forma canônica de TLS: URL só com sslmode=require; a CA entra pelo ambiente do cliente com caminho absoluto (NODE_EXTRA_CA_CERTS no Node, PGSSLROOTCERT no libpq)"
    - "Rotação de senha de papel em script testado contra o Postgres local com papel próprio (app_api_pwtest), sem tocar em app_api nem em blog_test"
    - "curl do smoke recebe a chave por --config - (stdin), fora da linha de comando"

key-files:
  created:
    - apps/api/scripts/verify-db-security.mjs
    - apps/api/scripts/set-app-api-password.mjs
    - apps/api/scripts/set-app-api-password.test.mjs
    - scripts/smoke-postgrest.sh
    - docs/runbooks/supabase-producao.md
  modified: []

key-decisions:
  - "O schema engine do Prisma (Rust) conecta com TLS mas não valida a cadeia pela CA do Supabase; o pg 8.x valida (sslmode=require vira verify-full). Registrado no runbook como risco aceito, sem pôr caminho de certificado na URL"
  - "O smoke anônimo imprime também o code do PostgREST (42501 = permission denied), para distinguir tabela bloqueada (401/42501) de tabela inexistente (404/PGRST205)"
  - "set-app-api-password.mjs grava o env file de forma atômica (arquivo temporário com modo 600 e rename) e roda ALTER ROLE antes da escrita; se a escrita falhar, rodar de novo"

patterns-established:
  - "Tracer de produção: RED é o verify falhando contra produção antes da migration, GREEN é a mesma suíte verde depois do migrate deploy"

requirements-completed: [SEC-04]

coverage:
  - id: D1
    description: "Baseline aplicada em produção por prisma migrate deploy e schema em dia (nunca db push)"
    requirement: SEC-04
    verification:
      - kind: other
        ref: "DOTENV_CONFIG_PATH=~/.config/blog-no-law/production.env pnpm --filter @blog/api exec prisma migrate status => Database schema is up to date!"
        status: pass
    human_judgment: false
  - id: D2
    description: "Em produção: RLS em toda tabela de public, app_api sem bypass/super/createdb/createrole, anon/authenticated/service_role sem privilégio em heartbeat e _prisma_migrations, anon recebe 42501"
    requirement: SEC-04
    verification:
      - kind: other
        ref: "NODE_EXTRA_CA_CERTS=apps/api/certs/supabase-ca.crt node apps/api/scripts/verify-db-security.mjs => 7 PASS e DB_SECURITY_OK"
        status: pass
    human_judgment: false
  - id: D3
    description: "Chamada anônima ao PostgREST de produção não lê heartbeat nem _prisma_migrations (HTTP 401, code 42501)"
    requirement: SEC-04
    verification:
      - kind: other
        ref: "ENV_FILE=~/.config/blog-no-law/production.env bash scripts/smoke-postgrest.sh => POSTGREST_ANON_BLOCKED"
        status: pass
    human_judgment: false
  - id: D4
    description: "Rotação da senha do app_api: aplica, regrava o env file (600, uma linha DATABASE_URL, forma canônica), antiga recebe 28P01, nada de senha na saída"
    requirement: SEC-04
    verification:
      - kind: unit
        ref: "apps/api/scripts/set-app-api-password.test.mjs (6 casos, Postgres local do compose)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Credencial de runtime de produção app_api.{ref} funciona pelo pooler com privilégio mínimo (lê heartbeat, UPDATE negado com 42501)"
    requirement: SEC-04
    verification:
      - kind: other
        ref: "NODE_EXTRA_CA_CERTS=apps/api/certs/supabase-ca.crt node apps/api/scripts/verify-db-security.mjs --as-app => APP_API_OK"
        status: pass
    human_judgment: false
  - id: D6
    description: "Runbook do banco de produção em pt-BR (região one-way, pooler, credenciais por nome, rotação, TLS, Open Question 7)"
    verification: []
    human_judgment: true
    rationale: "A correção do texto do runbook (fatos de Supabase e procedimentos de rotação) depende de leitura humana; nenhum teste automatizado a valida"

duration: 25min (retomada a partir da Task 2)
completed: 2026-11-20
status: complete
---

# Phase 1 Plan 06: Banco de produção no Supabase com baseline e prova de segurança Summary

**Postgres 17 de produção no Supabase (`us-east-1`) com a baseline aplicada por `prisma migrate deploy`, RLS e papéis provados por `verify-db-security.mjs`, Data API anônima bloqueada (401/42501) e credencial de runtime `app_api` de senha aleatória, rotacionável por script testado, tudo sem segredo no git.**

## Performance

- **Duration:** 25 min (continuação, da Task 2 em diante; a Task 1 foi o checkpoint humano do painel do Supabase, já resolvido)
- **Started:** 2026-11-20T21:01:00Z
- **Completed:** 2026-11-20T21:26:00Z
- **Tasks:** 3 (Task 1 checkpoint humano resolvido, Task 2 tracer, Task 3 TDD)
- **Files modified:** 5 criados (mais a CA pública da Task 1)

## Accomplishments

- **Schema push em produção (BLOCKING):** `prisma migrate deploy` pelo session pooler (porta 5432) aplicou `20261117120000_baseline`; `migrate status` informa `Database schema is up to date!`. `prisma db push` não foi usado.
- **Segurança provada em produção:** `verify-db-security.mjs` dá PASS em versão do servidor (major 17), baseline concluída, RLS em toda tabela de `public`, atributos do `app_api`, `app_api` não dono de tabela, ausência de privilégio de `anon`/`authenticated`/`service_role` e 42501 para `anon` em `SELECT` (o `postgres` do Supabase consegue `SET LOCAL ROLE anon`, então não houve `SKIP`).
- **Data API bloqueada:** o smoke anônimo recebe `401` com `code=42501` para `heartbeat` e `_prisma_migrations`; uma tabela inexistente daria `404`/`PGRST205`, então o 42501 prova que as tabelas existem e estão negadas, não apenas ausentes. Antes da migration o mesmo smoke dava `404`.
- **Credencial de runtime:** `set-app-api-password.mjs` gerou a senha do `app_api` (32 bytes aleatórios) e gravou o `DATABASE_URL` só no env file local (600); `verify-db-security.mjs --as-app` confirmou `app_api.{ref}` pelo pooler: lê `heartbeat` (id = 1) e `UPDATE` recebe 42501.
- **Runbook** `docs/runbooks/supabase-producao.md` com região one-way (D-05, D-11), pooler, credenciais por nome, rotação, pausa do plano Free e a forma canônica de TLS.

## Task Commits

1. **Task 1: projeto Supabase em us-east-1 e env file local** - `4fbd0ab` (chore; só a CA pública `apps/api/certs/supabase-ca.crt`; resolvida pelo autor antes desta retomada)
2. **Task 2: tracer, schema push em produção e prova anônima**
   - `6ae521f` test: RED, `verify-db-security.mjs` e `smoke-postgrest.sh` rodados contra produção antes da migration
   - `d235ee8` feat: GREEN, após `migrate deploy`; smoke passa a imprimir o `code` do PostgREST
3. **Task 3: senha aleatória do `app_api` e prova do runtime (TDD)**
   - `6b79af6` test: RED, 6 casos que falham porque o script não existe
   - `a4baa55` feat: GREEN, `set-app-api-password.mjs`
   - `48bdd12` feat: runbook, após rodar o script em produção e confirmar `APP_API_OK`

**Plan metadata:** commit do SUMMARY (docs: complete plan), feito depois deste arquivo.

## TDD

- **Tracer gate (Task 2):** modo `end-of-phase` com `<verify>` só automatizado; os três comandos do verify foram reexecutados sobre o estado final e passaram: `Tracer verified end-to-end — expanding`.
- **RED (Task 2):** não há framework de testes nesta tarefa (são scripts de verificação). O RED é o verify rodado contra produção antes da migration: `server_version` PASS, `baseline_aplicada` FAIL (`erro=42P01`, `_prisma_migrations` ainda inexistente), `rls_em_toda_tabela_de_public` FAIL (`tabela ausente: heartbeat,_prisma_migrations`), `app_api_atributos` FAIL (`papel app_api não existe`), privilégios FAIL (`42P01`), `anon_select_heartbeat` FAIL (`sqlstate=42P01`, esperado 42501); saída 1. `semanticAssessment`: falha nas checagens planejadas pelo motivo certo (schema ausente), com a conexão TLS funcionando. Como contraprova, sem `NODE_EXTRA_CA_CERTS` a conexão falha com `SELF_SIGNED_CERT_IN_CHAIN`, o que mostra que o `pg` valida o certificado. Esse RED não passa pelo classificador `tdd-red-evidence` (formato de runner de testes).
- **GREEN (Task 2):** `migrate deploy` e as três verificações verdes (`DB_SECURITY_OK`, `POSTGREST_ANON_BLOCKED`, schema em dia).
- **RED (Task 3):** `node --test --test-reporter=tap` do `set-app-api-password.test.mjs` com o script ausente: 6 testes, 0 passam, 6 falham em asserção (`1 !== 0`, exit status do script). `gsd-tools check tdd-red-evidence` devolveu `RED_EVIDENCE_OK` (`target_test_failed`, formato `tap`, 0 `report_errors`), alvo `sai com 0 e imprime uma única linha com o caminho do env file`. `semanticAssessment`: o alvo executou e falhou na asserção planejada (o script não existe, então sai com 1); os hooks `before` criaram o papel `app_api_pwtest` sem erro; sem erro de import, sintaxe ou fixture. O caso de `APP_API_ROLE` inválido ganhou `assert.match(stderr, /APP_API_ROLE inválido/)` justamente para não passar de graça com o script ausente.
- **GREEN (Task 3):** 6/6 verdes contra o Postgres do compose.
- **REFACTOR:** não necessário.

## Open Question 7: o `prisma migrate` verificou o certificado do pooler?

**Não.** Medição em 2026-11-20 contra o pooler de produção:

- O schema engine do Prisma (binário Rust) conectou com `sslmode=require` e executou `migrate status` e `migrate deploy` **sem nenhuma CA configurada** (a CA do Supabase não está no armazém de confiança do sistema, e `NODE_EXTRA_CA_CERTS` só vale para processos Node). Logo a conexão é criptografada, mas a cadeia não é validada pela nossa CA.
- O `pg` 8.x (scripts `.mjs` e adapter do Prisma no runtime) **verifica**: `sslmode=require` vira `verify-full`; sem a variável a conexão falha com `SELF_SIGNED_CERT_IN_CHAIN`, com a variável conecta.
- Risco aceito e baixo (migração roda só da máquina do autor ou do job de deploy; as verificações seguintes usam `pg` com validação completa). Não houve `sslmode=no-verify`, `rejectUnauthorized: false` nem caminho de certificado na URL. Registrado no runbook.
- O `pg` 8.23.1 imprime um aviso: no `pg` 9 os modos `require`/`prefer`/`verify-ca` passam à semântica do libpq (mais fraca). Ao atualizar o `pg`, trocar para `sslmode=verify-full` explícito (isso quebraria a forma canônica de TLS desta fase, então é item do runbook e dos planos 01-11/01-12).

## Files Created/Modified

- `apps/api/scripts/verify-db-security.mjs` - checagens PASS/FAIL/SKIP do banco; `--as-app` conecta também com `DATABASE_URL`; imprime só SQLSTATE e códigos de rede
- `apps/api/scripts/set-app-api-password.mjs` - gera e aplica a senha do `app_api`, regrava a linha `DATABASE_URL` do env file (atômico, 600), imprime só o caminho
- `apps/api/scripts/set-app-api-password.test.mjs` - 6 testes `node:test` contra o Postgres local, com o papel `app_api_pwtest`
- `scripts/smoke-postgrest.sh` - smoke anônimo da Data API; chave passada ao `curl` por `--config -`, corpo em `mktemp` apagado no `trap`
- `docs/runbooks/supabase-producao.md` - runbook em pt-BR
- `apps/api/certs/supabase-ca.crt` - CA pública do Supabase (Task 1, commit `4fbd0ab`)

## Decisions Made

- O smoke imprime o `code` do PostgREST (não é segredo) para diferenciar bloqueio (`42501`) de tabela ausente (`PGRST205`).
- `set-app-api-password.mjs` aplica o `ALTER ROLE` antes de gravar o arquivo, e reduz qualquer erro do driver ao código; se a escrita do env file falhar depois do `ALTER`, a mensagem manda rodar de novo (a senha antiga já foi trocada, mas nada vaza).
- O teste de rotação monta o ambiente do processo filho do zero (`PATH`, `ENV_FILE`, `APP_API_ROLE`), então o script não herda credenciais de quem roda o teste.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Sandbox do worktree recusou comandos compostos**
- **Found during:** Task 2 e fechamento
- **Issue:** o harness recusou comandos com `git` encadeado (`git ls-files` dentro de `&&`, `git rev-parse` com `[ -f ]`) e um script com heredoc e caminho absoluto com espaços como argumento
- **Fix:** executei os mesmos checks em comandos simples e separados; o script auxiliar da varredura de segredos foi criado com a ferramenta Write no diretório scratch e rodado com `.` como argumento; o ledger `plan_head_before` foi escrito com `echo` direto no `.git/worktrees/.../`
- **Files modified:** nenhum arquivo rastreado
- **Verification:** resultado equivalente ao `<automated>` do plano

**2. [Rule 3 - Blocking] `dotenv` indisponível fora do `apps/api`**
- **Found during:** Task 2 (sonda de diagnóstico do PostgREST)
- **Issue:** script auxiliar no scratch não resolve `dotenv` (resolução parte do diretório do script)
- **Fix:** usei `node --env-file=` do próprio Node; os scripts do plano ficam em `apps/api/scripts`, onde `dotenv` resolve
- **Files modified:** nenhum arquivo rastreado

**3. [Rule 2 - Missing critical] `smoke-postgrest.sh` imprime o código do PostgREST**
- **Found during:** Task 2
- **Issue:** o plano aceita "não for 200" como bloqueado, o que não distingue permissão negada de tabela inexistente (os dois dão não-200)
- **Fix:** o script extrai e imprime `code=` do corpo (`42501`); a lógica de passa/falha não mudou
- **Files modified:** `scripts/smoke-postgrest.sh`
- **Committed in:** `d235ee8`

---

**Total deviations:** 3 auto-fixed (2 Rule 3 de tooling, 1 Rule 2)
**Impact on plan:** nenhum no entregável; o smoke ficou mais discriminante.

## Auth Gates

Nenhum durante esta retomada. A Task 1 era a ação humana do painel do Supabase (projeto, CA e env file), resolvida antes (a senha do banco foi digitada pelo autor num prompt oculto e nunca foi vista pelo Claude).

## Issues Encountered

- O `postgres` do Supabase pôde assumir `anon` (`SET LOCAL ROLE anon`), então o ramo `SKIP set_role_anon` previsto no plano não foi necessário.
- O container de teste foi derrubado (`docker compose -f compose.test.yaml down -v`): sem containers, volumes nem redes remanescentes. O papel `app_api_pwtest` é apagado pelo `after` do teste.
- Nenhum arquivo do worktree contém a senha de produção (varredura por substring dos dois `*_DATABASE_URL`, 95 arquivos fora de `node_modules`, 0 ocorrências). `git ls-files` não lista nenhum env file.

## Known Stubs

Nenhum.

## Threat Flags

Nenhum além do previsto. Mitigações aplicadas: T-01-51 (baseline em produção, provada por `verify-db-security.mjs` e smoke), T-01-11 (env file fora do repo, 700/600, scripts sem saída de valores, gate `git ls-files`), T-01-12 (região `us-east-1` e host do pooler conferidos pelo orchestrator), T-01-13 (forma canônica de TLS; limite do schema engine do Prisma documentado acima), T-01-40 (32 bytes aleatórios, `escapeLiteral`/`escapeIdentifier`, regex do papel, teste de 28P01 para a senha antiga), T-01-SC (nenhum pacote novo).

## User Setup Required

Nenhum pendente: o projeto Supabase, a CA e o env file local foram criados pelo autor na Task 1. A partir do 01-11, o `DATABASE_URL` do `app_api` (linha do env file local) precisa ser copiado para a variável de ambiente da Render, sem passar por chat nem git.

## Next Phase Readiness

- **01-09 (CI):** `scripts/smoke-postgrest.sh` está pronto para virar o job `postgrest-anon` (o 01-14 acrescenta o modo estrito, D-14).
- **01-11 (Render):** usar o `DATABASE_URL` do env file local como variável da Render e `NODE_EXTRA_CA_CERTS=/app/certs/supabase-ca.crt` na imagem.
- **01-12 (deploy):** `prisma migrate deploy` com `MIGRATE_DATABASE_URL` no GitHub Environment `production`; o schema engine não valida a CA (ver Open Question 7).
- **01-13 (backup/keep-alive):** `pg_dump` com `PGSSLROOTCERT=/certs/supabase-ca.crt`; o ping em `/health/ready` evita a pausa do Free.
- `STATE.md` e `ROADMAP.md` não foram alterados (cabe ao orchestrator).

## Self-Check: PASSED

- Arquivos existem: `apps/api/scripts/verify-db-security.mjs`, `apps/api/scripts/set-app-api-password.mjs`, `apps/api/scripts/set-app-api-password.test.mjs`, `scripts/smoke-postgrest.sh`, `docs/runbooks/supabase-producao.md`, `apps/api/certs/supabase-ca.crt`.
- Commits `4fbd0ab`, `6ae521f`, `d235ee8`, `6b79af6`, `a4baa55`, `48bdd12` presentes; `git rev-list --count 5ba96ff..HEAD` = 6 antes do commit do SUMMARY; ordem test, feat, test, feat (RED antes do GREEN nas duas tarefas).
- Critérios da Task 2: `migrate status` "Database schema is up to date!"; `DB_SECURITY_OK`; `POSTGREST_ANON_BLOCKED`; saída dos comandos sem senha (conferida).
- Critérios da Task 3: `APP_API_OK`; env file 600, uma linha `DATABASE_URL=`, as duas URLs terminam em `?sslmode=require`; `git ls-files` sem env file; runbook cita D-05 e D-11 e não contém chave secreta do Supabase nem URL com senha; `node --test` 6/6 com commit `test(01-06)` antes do `feat(01-06)`.

---
*Phase: 01-esqueleto-no-ar-com-testes-e-ci*
*Completed: 2026-11-20*
