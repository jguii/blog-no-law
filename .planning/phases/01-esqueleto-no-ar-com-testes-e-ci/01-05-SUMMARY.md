---
phase: 01-esqueleto-no-ar-com-testes-e-ci
plan: 05
subsystem: api
tags: [prisma, prisma-adapter-pg, postgres, terminus, health, nestjs, vitest, rls]
requires:
  - phase: 01-04
    provides: "Postgres de teste (compose.test.yaml), prepareTestDb, papel app_api, tabela heartbeat com RLS, projeto Vitest int"
  - phase: 01-02
    provides: "DATABASE_PROBE, StatusService, UnconfiguredDatabaseProbe, /health/live, loadEnv"
provides:
  - "PrismaService (PrismaClient + PrismaPg, pool max 5, timeout de conexão 5 s) conectado como app_api"
  - "PrismaDatabaseProbe: leitura real de heartbeat com timeout de 2 s, nunca lança"
  - "DatabaseHealthIndicator (Terminus 12 up()/down()) e rotas GET /health/ready e GET /health (alias)"
  - "/status com db real e dbLatencyMs inteiro em detail=full"
  - "Smoke local completo (Postgres do compose + API + Next) exigindo db 'up' na home"
affects: [01-06, 01-07, 01-08, 01-13, ci, deploy]
actuals:
  tokens: 13000
  tasks: 2
  commits: 3
plan_head_before: e2edff2dc29623777adc6f97b7e582080c766b15
plan_head_after: 8ef356bc1e9667881009e8ced99369d6e5081648
tech-stack:
  added: ["@prisma/client@7.10.1", "@prisma/adapter-pg@7.10.1", "@nestjs/terminus@12.1.0"]
  patterns:
    - "Probe de banco atrás da porta DatabaseProbe: implementação real só quando DATABASE_URL existe"
    - "Health em duas camadas: live sem dependência, ready/health lendo o banco"
    - "Timeout do probe (Promise.race) envolve a espera por conexão do pool"
    - "Logs de falha só com err.name e código, nunca a mensagem do driver"
key-files:
  created:
    - apps/api/src/prisma/prisma.service.ts
    - apps/api/src/prisma/prisma-database.probe.ts
    - apps/api/src/health/database.indicator.ts
    - apps/api/test/db.int-spec.ts
  modified:
    - apps/api/package.json
    - apps/api/src/app.module.ts
    - apps/api/src/health/health.controller.ts
    - scripts/smoke-local.sh
    - pnpm-lock.yaml
key-decisions:
  - "PrismaPg 7.10.1 aceita PoolConfig direto (max, connectionTimeoutMillis, idleTimeoutMillis): não foi preciso criar um Pool do pg à mão (Assumption A11 confirmada)"
  - "Sem alteração em allowBuilds: os três pacotes novos não têm script de build bloqueado"
  - "O módulo de teste do Nest usa TestingLogger (só imprime error); o teste de vazamento passa um ConsoleLogger com warn e error, senão a asserção sobre logs seria vazia"
  - "smoke-local.sh deixa o Postgres do compose de pé ao final (a limpeza é responsabilidade do chamador/CI)"
requirements-completed: [OPS-01, QA-01, SEC-04]
coverage:
  - id: D1
    description: "/health/ready e /health leem heartbeat como app_api e respondem 200 com database up; 503 com database down quando o banco falha"
    requirement: OPS-01
    verification:
      - kind: integration
        ref: "apps/api/test/db.int-spec.ts#GET /health/ready responde 200 com database up"
        status: pass
      - kind: integration
        ref: "apps/api/test/db.int-spec.ts#porta fechada > /health/live continua 200 e /health/ready responde 503 com database down, no mesmo app"
        status: pass
    human_judgment: false
  - id: D2
    description: "/status traz db real e dbLatencyMs inteiro >= 0 só em detail=full; com banco fora do ar ou travado responde 200 com db down em menos de 3 s"
    requirement: OPS-01
    verification:
      - kind: integration
        ref: "apps/api/test/db.int-spec.ts#GET /status?detail=full traz dbLatencyMs inteiro >= 0"
        status: pass
      - kind: integration
        ref: "apps/api/test/db.int-spec.ts#servidor TCP que aceita a conexão e nunca responde > /status responde em menos de 3000 ms com db down"
        status: pass
    human_judgment: false
  - id: D3
    description: "Falha de banco não registra a senha nem a URL de conexão nos logs (T-01-09)"
    requirement: SEC-04
    verification:
      - kind: integration
        ref: "apps/api/test/db.int-spec.ts#porta fechada > a falha é logada sem a credencial nem a URL de conexão"
        status: pass
      - kind: integration
        ref: "apps/api/test/db.int-spec.ts#servidor TCP que aceita a conexão e nunca responde > a espera pelo banco travado também não vaza a credencial nos logs"
        status: pass
    human_judgment: false
  - id: D4
    description: "Walking Skeleton local completo: home do Next mostra db 'up' lendo Postgres real como app_api"
    requirement: QA-01
    verification:
      - kind: other
        ref: "bash scripts/smoke-local.sh (SMOKE_LOCAL_OK)"
        status: pass
    human_judgment: false
duration: 22min
completed: 2026-11-20
status: complete
---

# Phase 01 Plan 05: API lê o banco real como app_api Summary

**PrismaService com adapter pg (pool 5, timeouts explícitos), probe de heartbeat com teto de 2 s, health em duas camadas via Terminus 12 e /status com db real, provado contra Postgres de verdade, com porta fechada e servidor TCP travado.**

## Performance

- **Duration:** 22 min
- **Started:** 2026-11-20T19:14Z (aprox.)
- **Completed:** 2026-11-20T19:36Z
- **Tasks:** 2
- **Files modified:** 9 (4 novos, 5 editados)

## Accomplishments

- `GET /health/ready` e `GET /health` leem a linha `heartbeat` pelo Prisma como `app_api` e respondem 200 (`info.database.status = up`); com o banco fora, 503 (`error.database.status = down`). `GET /health/live` segue sem dependência.
- `GET /status` traz `db` real; `dbLatencyMs` inteiro só em `detail=full`.
- Banco com porta fechada ou servidor TCP que aceita e nunca responde: `/status` 200 com `db: down` em cerca de 2 s (abaixo do limite de 3 s), `/health/ready` 503 e `/health/live` 200.
- Logs de falha só com nome e código do erro (`falha na leitura do banco: ProbeTimeoutError (sem-codigo)`); teste procura a senha de teste e `postgresql://` na saída capturada.
- `scripts/smoke-local.sh` sobe o Postgres do compose, prepara `blog_smoke`, roda a API com `DATABASE_URL` do `app_api` e exige `api-db` "up" na home e `api-db-latency` em `/?detail=full`. `SMOKE_LOCAL_OK` obtido.

## Task Commits

1. **Task 1 (tracer): `/health/ready` e `/status` leem heartbeat, home mostra "up"**
   - RED: `f947b72` (test)
   - GREEN: `f42fec6` (feat)
2. **Task 2 (tdd): banco fora do ar ou travado não derruba a API** - `8ef356b` (test; não houve commit `fix`, ver "TDD Gate Compliance")

**Plan metadata:** commit `docs(01-05)` seguinte (SUMMARY).

## Files Created/Modified

- `apps/api/src/prisma/prisma.service.ts` - `PrismaService extends PrismaClient`, `PrismaPg` com `max: 5`, `connectionTimeoutMillis: 5000`, `idleTimeoutMillis: 30000`; `onModuleDestroy` chama `$disconnect()`
- `apps/api/src/prisma/prisma-database.probe.ts` - `PrismaDatabaseProbe.check()`: `heartbeat.findUnique({ where: { id: 1 } })` em `Promise.race` com 2000 ms, `latencyMs` inteiro, log sem texto de erro do driver
- `apps/api/src/health/database.indicator.ts` - `DatabaseHealthIndicator.isHealthy()` com `HealthIndicatorService.check('database').up()/down()`
- `apps/api/src/health/health.controller.ts` - `live` (sem dependências), `ready` e `overall` (`/health`) com `@HealthCheck()`
- `apps/api/src/app.module.ts` - importa `TerminusModule`; com `DATABASE_URL` provê `PrismaService` + `PrismaDatabaseProbe`, sem ela mantém `UnconfiguredDatabaseProbe`
- `apps/api/test/db.int-spec.ts` - 11 testes de integração (5 com banco no ar, 3 com porta fechada, 3 com servidor TCP travado)
- `apps/api/package.json`, `pnpm-lock.yaml` - três dependências exatas; `build` e `typecheck` rodam `prisma generate` antes do `tsc`
- `scripts/smoke-local.sh` - smoke completo com banco

## Decisions Made

- `PrismaPg` 7.10.1 recebe o `PoolConfig` diretamente; nenhum `Pool` manual foi necessário (Assumption A11 confirmada, `Pool` do `pg` não precisou ser criado).
- Terminus 12.1: `HealthIndicatorService.check(key).up()/down()`; falha vira 503 pelo `HealthCheckService.check`. O log padrão do Terminus ("Health Check has failed!") traz só `{"database":{"status":"down"}}`, sem detalhes.
- Injeção com `@Inject(Classe)` explícito nos construtores novos, sem depender de `emitDecoratorMetadata` sob Vite 8/Oxc.
- Nenhuma alteração em `pnpm-workspace.yaml`: os pacotes novos não pedem build script.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `@blog/shared` não estava compilado no worktree**
- **Found during:** Task 1 (primeira execução do RED)
- **Issue:** `Cannot find package '@blog/shared/status'`: o `dist` é gitignored e o worktree novo não o tinha.
- **Fix:** `pnpm install --frozen-lockfile` e `pnpm --filter @blog/shared build` (nenhum arquivo versionado alterado).
- **Verification:** o RED passou a falhar na asserção, não no import.

**2. [Rule 1 - Bug de teste] TestingLogger do Nest escondia o `warn` do probe**
- **Found during:** Task 2 (primeira rodada dos testes de log)
- **Issue:** o módulo de teste do Nest usa `TestingLogger`, que só imprime `error`; os testes de vazamento falhavam por log vazio, não pelo comportamento. Passar `logger: ['warn','error']` não bastou (só ajusta níveis do logger atual).
- **Fix:** o helper do teste cria o app com `logger: new ConsoleLogger({ logLevels: ['warn', 'error'] })` e cada teste de log exige a frase `falha na leitura do banco`, para a asserção negativa não ser vazia.
- **Files modified:** `apps/api/test/db.int-spec.ts`
- **Committed in:** `8ef356b`

**2 deviations auto-fixed (1 blocking de ambiente, 1 bug de teste).** Impacto: nenhum no escopo; sem mudança de código de produção.

### Execução do TDD da Task 2

Os comportamentos da Task 2 (teto de 2 s cobrindo a aquisição de conexão, probe sem lançar, indicador sem vazar detalhes) já nasceram no código da Task 1, então a rodada RED da Task 2 não teve falha real de comportamento: dos 11 testes, os 6 novos de cenário de falha passaram de primeira (os 2 de log só falharam por causa do TestingLogger, item 2 acima). Em vez de fabricar um RED, foi feita uma checagem de mutação: com `PROBE_TIMEOUT_MS = 60000` (sem o teto), os dois testes do servidor TCP travado falham ("expected 5017 to be less than 3000" e "expected 5011 to be less than 3000"), provando que o teste enxerga a regressão; a mutação foi revertida (probe idêntico ao commit `f42fec6`). Por isso não existe commit `fix(01-05)`: não houve mudança de código.

## TDD Gate Compliance

- **RED (Task 1):** `f947b72`. Evidência do classificador `gsd check tdd-red-evidence`: `RED_EVIDENCE_OK` (`target_test_failed`). Alvo: `GET /status traz db up quando o banco responde`; esperado `db: up`, recebido `db: down` (UnconfiguredDatabaseProbe). Avaliação semântica: o alvo executou e falhou na asserção planejada, pelo motivo certo (probe ainda não ligado ao banco); `GET /health/ready` falhou com 404, também pelo motivo certo.
- **GREEN (Task 1):** `f42fec6`, todos os testes de int, http e unit verdes, smoke com `SMOKE_LOCAL_OK`.
- **Task 2:** commit `test(01-05)` `8ef356b` sem GREEN subsequente: o comportamento já existia desde `f42fec6` (ver acima). Sinalizado como desvio de disciplina, mitigado pela checagem de mutação. O gate `feat` posterior ao `test` da Task 2 não existe; o `feat(01-05)` da Task 1 precede o `test` da Task 2.
- **REFACTOR:** não houve.

## Issues Encountered

- O sandbox do worktree recusou comandos compostos (`&&` com `git`, `$(...)` com `git`, here-docs de vários arquivos): foram divididos em chamadas simples e arquivos criados pela ferramenta Write. O ledger de commits do plano foi gravado direto em `.git/worktrees/<id>/gsd-plan-head-before-01-05`.
- Nenhum problema de produto.

## Verification Results

- `pnpm --filter @blog/api test:integration`: 21 passed (10 RLS + 11 db)
- `pnpm --filter @blog/api test:http`: 5 passed; `pnpm --filter @blog/api test`: 9 passed
- `pnpm --filter @blog/api typecheck`: ok
- `bash scripts/smoke-local.sh`: `SMOKE_LOCAL_OK`
- `grep -rn "err.message\|error.message" apps/api/src/prisma`: sem ocorrências

## User Setup Required

None - nenhuma configuração de serviço externo.

## Threat Surface

Sem superfície nova além do planejado: `/health` e `/health/ready` são rotas públicas que só expõem `up/down` e latência em ms (T-01-10, aceito). Mitigações T-01-09 (log sem credencial) e T-01-39 (teto de 2 s, pool 5, timeout de conexão 5 s) cobertas por teste.

## Next Phase Readiness

- Pronto para 01-13 (keep-alive de leitura via UptimeRobot em `/health`) e para o deploy: o `build` da API já roda `prisma generate`.
- Atenção para o 01-08: ao introduzir o `turbo.json`, o `typecheck` deve perder o `prisma generate` e todas as tarefas que usam o cliente passam a depender do `build` do `@blog/api` (como previsto no plano).
- A imagem Docker (plano futuro) precisa copiar `src/generated/prisma` para `dist/generated` (o `tsc` já emite ali).

## Known Stubs

Nenhum.

---
*Phase: 01-esqueleto-no-ar-com-testes-e-ci*
*Completed: 2026-11-20*
