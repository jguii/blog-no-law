---
phase: 01-esqueleto-no-ar-com-testes-e-ci
plan: 04
subsystem: database
tags: [postgres, prisma-7, rls, supabase, vitest, integration-tests, docker-compose, tdd, tracer]

requires:
  - phase: 01-esqueleto-no-ar-com-testes-e-ci
    provides: "Workspace pnpm (01-01), API NestJS com projetos Vitest unit e http (01-02)"
provides:
  - "compose.test.yaml: Postgres 17 (supabase/postgres:17.12.0.000) em 127.0.0.1:54329, com anon, authenticated e service_role"
  - "Migration baseline Prisma: papel app_api sem bypass, revoke de default privileges, tabela heartbeat com RLS e policy so para app_api, RLS em _prisma_migrations"
  - "prepareTestDb({ adminUrl, dbName, appApiPassword }): recria o banco, aplica a migration e define a senha de teste do app_api; tambem roda por linha de comando (PREPARED blog_test)"
  - "Projeto Vitest int (fileParallelism false) com global-setup que publica adminDbUrl e appApiUrl por inject()"
  - "rls.int-spec.ts: 10 testes de RLS, grants e atributos do app_api em SQL real"
  - "Prisma 7.10.1 configurado (prisma.config.ts, schema.prisma, scripts db:migrate e prisma:generate)"
affects: [01-05, 01-06, 01-08, 01-09, 01-10]

actuals:
  tokens: 4300
  tasks: 3
  commits: 4

plan_head_before: 6d2ea47862766408e58e16f7336af6645b1d936d
plan_head_after: 94c99149fd74f9a2e8293347f7d7be762cddde80

tech-stack:
  added:
    - "pg@8.23.1"
    - "prisma@7.10.1 (dev)"
    - "dotenv@18.0.10 (dev)"
    - "@types/pg@8.23.1 (dev, versao resolvida pelo registry em 2026-11-20)"
  patterns:
    - "RLS nasce na mesma migration que cria a tabela; o teste de integracao falha se aparecer tabela de public sem RLS"
    - "Papel de runtime criado na migration SEM senha (idempotente); a senha e definida fora do git"
    - "Banco de teste descartavel: global-setup apaga e recria blog_test a cada execucao"
    - "Teste de negacao confere current_user depois de SET LOCAL ROLE, para um SET ROLE negado (tambem 42501) nao gerar falso verde"
    - "Comparar so o SQLSTATE e juntar listas em string mantem a mensagem de falha em uma linha (relatorio TAP legivel pelo classificador de RED)"

key-files:
  created:
    - compose.test.yaml
    - apps/api/prisma.config.ts
    - apps/api/prisma/schema.prisma
    - apps/api/prisma/migrations/20261117120000_baseline/migration.sql
    - apps/api/prisma/migrations/migration_lock.toml
    - apps/api/scripts/prepare-test-db.mjs
    - apps/api/scripts/prepare-test-db.d.mts
    - apps/api/test/global-setup.int.ts
    - apps/api/test/rls.int-spec.ts
  modified:
    - apps/api/package.json
    - apps/api/vitest.config.ts
    - apps/api/tsconfig.json
    - pnpm-workspace.yaml
    - pnpm-lock.yaml

key-decisions:
  - "A imagem supabase/postgres:17.12.0.000 sobe e atende a Assumption A7: o papel postgres (nao superuser, com CREATEROLE e CREATEDB) cria papel e banco, e a imagem ja traz anon, authenticated e service_role; nao foi preciso cair para postgres:17"
  - "allowBuilds libera so @prisma/engines e prisma (postinstall que baixa o schema engine); nenhum outro pacote foi liberado"
  - "@prisma/client e @prisma/adapter-pg (lista aprovada) NAO foram instalados aqui: este plano so roda migrate deploy; entram no 01-05, que conecta a API como app_api"
  - "prisma.config.ts le MIGRATE_DATABASE_URL com process.env e cai para string vazia, entao prisma generate funciona sem banco (build da imagem e da CI)"
  - "Declaracao de tipos prepare-test-db.d.mts ao lado do .mjs, para o global-setup e o teste em TypeScript importarem o script sem any implicito"

patterns-established:
  - "Evidencia RED por reporter tap-flat, com expected de uma linha e alvo identificado pelo nome completo"
  - "Quando os casos ja passam por causa do tracer, a discriminacao e provada por mutacao local da migration, revertida com git checkout -- do arquivo"

requirements-completed: [SEC-04, QA-01]

coverage:
  - id: D1
    description: "Postgres 17 local com anon, authenticated e service_role sobe por docker compose -f compose.test.yaml up -d --wait"
    requirement: QA-01
    verification:
      - kind: other
        ref: "docker compose -f compose.test.yaml up -d --wait (container Healthy; psql confirma os tres papeis e PostgreSQL 17.12)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Migration baseline cria app_api com LOGIN, sem SUPERUSER, BYPASSRLS, CREATEDB e CREATEROLE, sem senha no git, de forma idempotente"
    requirement: SEC-04
    verification:
      - kind: integration
        ref: "apps/api/test/rls.int-spec.ts#papel app_api > tem login e nenhum privilégio de administração"
        status: pass
      - kind: integration
        ref: "apps/api/test/rls.int-spec.ts#preparo do banco de teste > prepareTestDb duas vezes no mesmo cluster (app_api já existe) termina sem erro"
        status: pass
      - kind: other
        ref: "grep -rinE \"password '|password \\\"\" apps/api/prisma/migrations nao imprime nada"
        status: pass
    human_judgment: false
  - id: D3
    description: "Toda tabela de public (inclusive _prisma_migrations) tem RLS ativo; a suite falha citando a tabela se aparecer uma sem RLS"
    requirement: SEC-04
    verification:
      - kind: integration
        ref: "apps/api/test/rls.int-spec.ts#RLS em todas as tabelas de public > toda tabela de public tem RLS ativo (inclusive _prisma_migrations)"
        status: pass
      - kind: other
        ref: "mutacao local: sem a linha ENABLE ROW LEVEL SECURITY de _prisma_migrations o teste falha com 'RLS desligado na tabela _prisma_migrations'"
        status: pass
    human_judgment: false
  - id: D4
    description: "anon e authenticated nao leem heartbeat (42501) e nao tem nenhum privilegio em heartbeat e _prisma_migrations; app_api le id = 1 e UPDATE, INSERT e SELECT em _prisma_migrations dao 42501"
    requirement: SEC-04
    verification:
      - kind: integration
        ref: "apps/api/test/rls.int-spec.ts (10 casos, acesso pela Data API e papel app_api)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Suite de integracao roda em serie num banco blog_test descartavel recriado no inicio, sem herdar estado de execucao interrompida"
    requirement: QA-01
    verification:
      - kind: integration
        ref: "pnpm --filter @blog/api test:integration (global-setup chama prepareTestDb; fileParallelism false no projeto int)"
        status: pass
      - kind: other
        ref: "node apps/api/scripts/prepare-test-db.mjs imprime PREPARED blog_test e nenhuma URL"
        status: pass
    human_judgment: false

duration: 8min (retomada a partir da Task 2)
completed: 2026-11-20
status: complete
---

# Phase 1 Plan 04: Postgres local e migration baseline com RLS Summary

**Migration baseline Prisma 7 em SQL puro que cria o papel `app_api` (sem bypass, sem senha no git), revoga os grants padrão do Supabase e liga RLS em `heartbeat` e `_prisma_migrations`, provada por 10 testes de integração em Postgres 17 real (`supabase/postgres`) preparado por `prepareTestDb`.**

## Performance

- **Duration:** 8 min (continuação, da Task 2 em diante; a Task 1 foi o checkpoint do Docker, já resolvido)
- **Started:** 2026-11-20T19:18:00Z
- **Completed:** 2026-11-20T19:26:00Z
- **Tasks:** 3 (Task 1 checkpoint humano resolvido, Task 2 tracer, Task 3 TDD)
- **Files modified:** 9 criados, 5 alterados (contando `pnpm-lock.yaml`)

## Accomplishments

- Tracer ponta a ponta: `docker compose -f compose.test.yaml up -d --wait` sobe o Postgres, `prisma migrate deploy` aplica a baseline como `postgres` e o teste prova que `anon` recebe 42501 e `app_api` lê `heartbeat` (`id = 1`).
- Segurança do banco (T-01-07, T-01-08, T-01-38): revoke dos default privileges, revoke explícito, RLS em toda tabela de `public` com teste que cita a tabela infratora, `app_api` verificado em `pg_roles`/`pg_tables`, e migration sem senha (`grep` vazio).
- `prepareTestDb` reutilizável (global-setup, smoke local do 01-05 e E2E da CI do 01-10): recria `blog_test`, aplica a migration, define a senha de teste e nunca imprime URL com senha; em caso de falha do Prisma, mascara as credenciais na mensagem.
- Suíte `int` serial e estável: 10 testes passam repetidas vezes sobre o mesmo cluster (o `app_api` já existe a partir da segunda execução).

## Task Commits

1. **Task 1: Ativar a integração WSL do Docker Desktop (D-09)** - sem commit (checkpoint humano). O orchestrator conferiu no WSL: Docker Server 29.9.3, `docker info` com código 0 e `docker compose version` = v5.7.0. O plano cita "v2...", mas o v5 é o mesmo CLI `docker compose` em versão mais nova; o critério (comando sai com código 0) foi atendido.
2. **Task 2: Tracer (Postgres local, baseline, teste RLS)**
   - `a2130d0` chore: andaime (compose, Prisma 7, `prepareTestDb` sem migration, global-setup, projeto `int`)
   - `b41868e` test: RED, o teste do `anon` falha com 42P01 em vez de 42501 (tabela inexistente)
   - `5330e88` feat: GREEN, migration baseline, model `Heartbeat` e senha de teste do `app_api`
3. **Task 3: Cobertura completa do RLS e dos atributos do `app_api` (TDD)**
   - `94c9914` test: 10 casos (RLS em todas as tabelas, atributos do papel, ownership, `has_table_privilege`, 42501 para `anon`/`authenticated`, restrições do `app_api`, idempotência)

**Plan metadata:** commit do SUMMARY (docs: complete plan), feito depois deste arquivo.

## TDD

- **Tracer gate (Task 2):** modo `end-of-phase` com `<verify>` só automatizado; o verify (`docker compose ... up -d --wait` e `pnpm --filter @blog/api test:integration`) foi reexecutado sobre o código commitado e passou (2/2): `Tracer verified end-to-end — expanding`.
- **RED (Task 2):** com o andaime (sem migration), o alvo `test/rls.int-spec.ts > RLS e papéis do banco (SEC-04) > como anon, SELECT em heartbeat falha com 42501` falhou com `expected '42P01' to be '42501'`. O segundo caso falhou por `password authentication failed for user "app_api"` (papel inexistente), que é erro de conexão e não serve de alvo. `gsd-tools check tdd-red-evidence` devolveu `RED_EVIDENCE_OK` (`target_test_failed`, formato `tap`, 0 `report_errors`). `semanticAssessment`: o alvo executou e falhou na asserção planejada (SQLSTATE 42P01 por tabela inexistente), sem erro de import, sintaxe ou fixture, e o andaime já criava o banco e os papéis do Supabase, então o global-setup não falhou.
- **GREEN (Task 2):** migration + model + senha do `app_api`; `test:integration` 2/2, `test` 9/9, `test:http` 5/5, `typecheck` e `build` limpos.
- **RED (Task 3):** os casos novos já passaram no primeiro run com a migration do tracer (10/10), como o plano prevê ("regressão protegida"). A discriminação foi provada por mutação local da migration, sem commit: (a) removida a linha `ALTER TABLE _prisma_migrations ENABLE ROW LEVEL SECURITY` — o alvo `toda tabela de public tem RLS ativo (inclusive _prisma_migrations)` falhou com `RLS desligado na tabela _prisma_migrations: expected false to be true`, `RED_EVIDENCE_OK`, 9 passes e 1 falha; (b) acrescentado `GRANT SELECT ON heartbeat TO anon` — falharam `como anon, ... 42501` (`expected 'sem erro' to be '42501'`) e o teste de privilégios (`expected 'anon SELECT em heartbeat' to be ''`). Ambas as mutações foram revertidas com `git checkout -- migration.sql`, e a suíte voltou a 10/10. `semanticAssessment`: as falhas são nas asserções planejadas, com o alvo executado.
- **GREEN (Task 3):** nenhuma alteração de produção foi necessária (a migration já cobria tudo); `test:integration` 10/10.
- **REFACTOR:** não necessário.

## Files Created/Modified

- `compose.test.yaml` - serviço `db-test` (`supabase/postgres:17.12.0.000`), `127.0.0.1:54329`, dados em `tmpfs`, healthcheck `pg_isready`
- `apps/api/prisma/migrations/20261117120000_baseline/migration.sql` - papel `app_api`, revoke dos defaults, `heartbeat`, RLS, policy, RLS em `_prisma_migrations`
- `apps/api/prisma/migrations/migration_lock.toml` - provider `postgresql`
- `apps/api/prisma/schema.prisma` - generator `prisma-client` ESM e model `Heartbeat`
- `apps/api/prisma.config.ts` - Prisma 7, `datasource.url` de `MIGRATE_DATABASE_URL`
- `apps/api/scripts/prepare-test-db.mjs`, `prepare-test-db.d.mts` - `prepareTestDb` e seus tipos
- `apps/api/test/global-setup.int.ts` - chama `prepareTestDb` e publica as URLs com `project.provide`
- `apps/api/test/rls.int-spec.ts` - 10 testes de integração
- `apps/api/vitest.config.ts` - projeto `int`
- `apps/api/package.json`, `apps/api/tsconfig.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml` - dependências, scripts `test:integration`, `db:migrate`, `prisma:generate`, `allowBuilds` do Prisma e `prisma.config.ts` no typecheck

## Pacotes instalados e versões

Todos exatos (`pnpm add -E`), da lista aprovada no 01-01 e só os que este plano precisa: `pg@8.23.1`; dev: `prisma@7.10.1`, `dotenv@18.0.10` e `@types/pg@8.23.1` (sem versão na lista; o registry resolveu `8.23.1` em 2026-11-20). `@prisma/client` e `@prisma/adapter-pg` (também aprovados) ficam para o 01-05. `allowBuilds` ganhou só `@prisma/engines` e `prisma`. O preinstall do `prisma` imprime um aviso de que só suporta Node 20.19+, 22.12+ e 24+ (a mensagem não lista o Node 26), mas termina com sucesso e `prisma --version`, `migrate deploy` e `generate` funcionam no Node 26.13.1.

## Decisions Made

- A imagem `supabase/postgres:17.12.0.000` cumpriu a Assumption A7 e foi mantida; o fallback `postgres:17` não foi necessário (o `prepareTestDb` continua criando os papéis que faltarem, então o fallback segue válido).
- O `postgres` da imagem não é superuser (`CREATEROLE`, `CREATEDB`, `BYPASSRLS`), e isso basta para criar o `app_api` e recriar o banco; por isso a migration não pode criar papel com `BYPASSRLS`, o que reforça a mitigação T-01-08.
- O teste de negação confere `current_user` depois de `SET LOCAL ROLE`, pois um `SET ROLE` negado também devolve 42501 e geraria falso verde.
- O teste de idempotência deriva a URL do cluster a partir de `inject('adminDbUrl')` (banco `postgres`), então respeita `DATABASE_URL_TEST_ADMIN` na CI.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `allowBuilds` bloqueou o install do Prisma**
- **Found during:** Task 2 (instalação)
- **Issue:** `pnpm add -D prisma@7.10.1` terminou com `ERR_PNPM_IGNORED_BUILDS` (`@prisma/engines`, `prisma`)
- **Fix:** o plano autoriza liberar só os pacotes do Prisma; `allowBuilds` ganhou exatamente esses dois e o `pnpm install` rodou os scripts
- **Files modified:** `pnpm-workspace.yaml`, `pnpm-lock.yaml`
- **Committed in:** `a2130d0`

**2. [Rule 3 - Blocking] Declaração de tipos para o script `.mjs`**
- **Found during:** Task 2 (typecheck)
- **Issue:** o `global-setup.int.ts` e o teste importam `prepare-test-db.mjs`; sem declaração, o `strict` falha com módulo sem tipos
- **Fix:** `apps/api/scripts/prepare-test-db.d.mts` (arquivo extra, fora da lista do plano) e `prisma.config.ts` incluído no `tsconfig.json` para entrar no typecheck
- **Files modified:** `apps/api/scripts/prepare-test-db.d.mts`, `apps/api/tsconfig.json`
- **Committed in:** `a2130d0`

**3. [Rule 3 - Blocking] RED por asserção exige andaime prévio**
- **Found during:** Task 2 (RED)
- **Issue:** sem `prepareTestDb` e global-setup, o RED falharia por import/fixture (INVALID_RED), não pela asserção
- **Fix:** commit `chore` de andaime (tudo menos a migration, o model e o `ALTER ROLE`), depois o `test` RED, mesmo padrão dos planos 01-01 a 01-03
- **Files modified:** ver commit `a2130d0`
- **Committed in:** `a2130d0`

**4. [Rule 3 - Blocking] Sandbox do worktree recusou comandos git compostos**
- **Found during:** fechamento
- **Issue:** o harness recusou um comando com `rev-list`, `rev-parse` e `log` encadeados
- **Fix:** comandos simples e separados, com o mesmo resultado
- **Files modified:** nenhum

---

**Total deviations:** 4 auto-fixed (todas Rule 3, de tooling, sem mudança de escopo)
**Impact on plan:** nenhum no entregável. Fora do texto do plano: o `.d.mts` extra, a liberação de `allowBuilds` (prevista como contingência) e o `docker compose` v5.7.0 no lugar do "v2..." citado.

## Auth Gates

Nenhum. O checkpoint da Task 1 era uma ação humana de configuração do Docker Desktop, resolvida antes desta retomada.

## Issues Encountered

- `prisma migrate deploy` sem pasta de migrations (andaime) sai com sucesso, o que permitiu o RED por asserção sem tratamento especial.
- O container de teste foi derrubado ao final (`docker compose -f compose.test.yaml down -v`): sem containers, volumes nem redes remanescentes.

## Known Stubs

Nenhum. `heartbeat` é tabela real, com uma linha fixa por desenho (`CHECK (id = 1)`); o `/health/ready` que a lê vem no 01-05.

## Threat Flags

Nenhum além do previsto. As mitigações do `<threat_model>` foram aplicadas e testadas: T-01-07 (revoke de defaults, revoke explícito e RLS em toda tabela, provados por 42501 e `has_table_privilege`), T-01-08 (`app_api` sem super, bypass, createdb e createrole, não dono, só `SELECT` em `heartbeat`), T-01-38 (migration sem senha; senha local é constante de teste definida por `ALTER ROLE` fora do git) e T-01-SC (só pacotes aprovados, versões exatas). A senha `app_api_local_test` e a `postgres` do compose são valores só de teste local.

## User Setup Required

None - no external service configuration required. (A ativação da integração WSL do Docker Desktop, declarada em `user_setup`, já foi feita pelo autor na Task 1.)

## Next Phase Readiness

- O 01-05 pode conectar a API como `app_api` (`DATABASE_URL` com o `appApiUrl` de `prepareTestDb`) e trocar `UnconfiguredDatabaseProbe` por uma leitura de `heartbeat`; ali entram `@prisma/client` e `@prisma/adapter-pg` (versões exatas `7.10.1`) e `pnpm --filter @blog/api prisma:generate`. Quem rodar `generate` sem esses pacotes gera `apps/api/src/generated/` (ignorado pelo git); removi o diretório antes de fechar.
- O 01-06 aplica a mesma migration em produção com a credencial `postgres` e define a senha do `app_api` fora do git; o `prepare-test-db.mjs` serve de referência do `ALTER ROLE`.
- O 01-08 (pre-push) e o 01-09 (CI) devem subir o compose (`docker compose -f compose.test.yaml up -d --wait`) antes de `test:integration`, ou espelhá-lo em `services:`; `DATABASE_URL_TEST_ADMIN` sobrescreve o admin padrão, e `turbo.json` precisa declarar essa variável e `prisma/migrations/**` nos inputs (Pitfall 8).
- `STATE.md` e `ROADMAP.md` não foram alterados (cabe ao orchestrator).

## Self-Check: PASSED

- Arquivos existem: `compose.test.yaml`, `apps/api/prisma.config.ts`, `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/20261117120000_baseline/migration.sql`, `apps/api/prisma/migrations/migration_lock.toml`, `apps/api/scripts/prepare-test-db.mjs`, `apps/api/scripts/prepare-test-db.d.mts`, `apps/api/test/global-setup.int.ts`, `apps/api/test/rls.int-spec.ts`.
- Commits `a2130d0`, `b41868e`, `5330e88`, `94c9914` presentes; `git rev-list --count 6d2ea47..HEAD` = 4 antes do commit do SUMMARY; ordem chore, test, feat, test.
- Critérios da Task 2: `migration.sql` com `NOBYPASSRLS` (1), `ENABLE ROW LEVEL SECURITY` (2) e `CREATE POLICY heartbeat_app_api_select` (1); `grep` de senha na pasta de migrations vazio; `"prisma": "7.10.1"` sem `^`; `node apps/api/scripts/prepare-test-db.mjs` imprime `PREPARED blog_test` e nenhuma URL; commit `test(01-04)` antes do `feat(01-04)`.
- Critérios da Task 3: `rls.int-spec.ts` contém `relrowsecurity`, `has_table_privilege`, `42501` e verifica `rolbypassrls` via `bypassrls=`; o teste de idempotência roda `prepareTestDb` duas vezes; a mutação de `_prisma_migrations` falha citando a tabela.
- Verificação do plano: `pnpm --filter @blog/api test:integration` 10/10 (>= 8), `test` 9/9, `test:http` 5/5, `typecheck` e `build` limpos; containers derrubados.

---
*Phase: 01-esqueleto-no-ar-com-testes-e-ci*
*Completed: 2026-11-20*
