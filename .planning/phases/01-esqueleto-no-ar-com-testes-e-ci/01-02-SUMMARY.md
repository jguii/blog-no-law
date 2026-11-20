---
phase: 01-esqueleto-no-ar-com-testes-e-ci
plan: 02
subsystem: api
tags: [nestjs, nest-12, esm, zod, standard-schema, vitest, supertest, tdd, tracer]

requires:
  - phase: 01-esqueleto-no-ar-com-testes-e-ci
    provides: "Contrato Zod do /status em @blog/shared/status (01-01) e workspace pnpm"
provides:
  - "@blog/api: API NestJS 12 ESM servindo GET /status (validado pelo contrato compartilhado) e GET /health/live"
  - "configureApp(app, env): configuração HTTP única usada pelo main.ts e pelos testes HTTP"
  - "loadEnv()/envSchema/APP_ENV/AppEnv: env validada por Zod com falha rápida e sem vazar valores"
  - "Porta DATABASE_PROBE + UnconfiguredDatabaseProbe (db: 'down' sem banco), para o 01-05 trocar por leitura real"
  - "Projetos Vitest unit e http; scripts build, start, typecheck, test, test:http"
affects: [01-03, 01-05, 01-07, 01-08, 01-09, 01-10, 01-11]

actuals:
  tokens: 5200
  tasks: 2
  commits: 5

plan_head_before: 4cc2dd0a26ef9c6cab59db53d0e6d99c68cac731
plan_head_after: 8b672aa36c3ab208ac73530cf4e93ae7613dcd08

tech-stack:
  added:
    - "@nestjs/common@12.5.0"
    - "@nestjs/core@12.5.0"
    - "@nestjs/platform-express@12.5.0"
    - "reflect-metadata@0.2.2"
    - "rxjs@7.8.2"
    - "zod@4.6.7"
    - "@nestjs/testing@12.5.0 (dev)"
    - "vitest@4.1.12 (dev)"
    - "vite@8.3.8 (dev)"
    - "supertest@7.3.2 (dev)"
    - "@types/supertest@7.2.1 (dev, versão resolvida pelo registry em 2026-11-20)"
    - "@types/node@26.6.6 (dev, mesma do 01-01)"
    - "typescript@6.0.3 (dev)"
  patterns:
    - "AppModule.forRoot(env) + configureApp(app, env): o teste HTTP exercita a mesma configuração de produção"
    - "Porta de infraestrutura por token (DATABASE_PROBE) com implementação real e permanente para o caso sem banco"
    - "Saída do controller também passa pelo contrato (statusResponseSchema.parse)"
    - "Erro de env monta só chave: motivo das issues do Zod, nunca o valor recebido"
    - "Testes: src/**/*.spec.ts (projeto unit) e test/**/*.http-spec.ts (projeto http); test:e2e fica reservado ao Playwright"

key-files:
  created:
    - apps/api/package.json
    - apps/api/tsconfig.json
    - apps/api/tsconfig.build.json
    - apps/api/vitest.config.ts
    - apps/api/src/main.ts
    - apps/api/src/app.module.ts
    - apps/api/src/app.setup.ts
    - apps/api/src/config/env.ts
    - apps/api/src/config/env.spec.ts
    - apps/api/src/status/status.controller.ts
    - apps/api/src/status/status.service.ts
    - apps/api/src/health/health.controller.ts
    - apps/api/test/app.http-spec.ts
  modified:
    - pnpm-lock.yaml

key-decisions:
  - "Injeção por metadata de decorators resolve no Vitest 4 + Vite 8 sem unplugin-swc: o controller injeta StatusService só pela classe e o teste HTTP passa"
  - "StandardSchemaValidationPipe é exportado de @nestjs/common 12.5.0 com o nome esperado; @Query({ schema }) funciona como documentado"
  - "Campos opcionais da env (DATABASE_URL, SENTRY_DSN, SENTRY_ENVIRONMENT) tratam string vazia como ausente, porque painéis de PaaS deixam variáveis em branco"
  - "CORS_ORIGINS aceita só https://host[:porta]; origins http (localhost) são recusados de propósito, pois o web é BFF e não há chamada de navegador à API em dev"
  - "main.ts importa reflect-metadata explicitamente (inofensivo se o Nest 12 já o carrega)"

patterns-established:
  - "TDD RED com scaffold prévio (chore) para que o RED falhe por asserção (404 vs 200), não por import quebrado"
  - "Evidência RED por reporter tap-flat, com expected de uma linha (comparar via join/string, nunca toEqual multilinha)"

requirements-completed: [QA-01, SEC-03, OPS-01]

coverage:
  - id: D1
    description: "GET /status servido por um processo Nest ESM real, com corpo validado por statusResponseSchema, commit igual ao GIT_SHA e db 'down' sem banco"
    requirement: QA-01
    verification:
      - kind: integration
        ref: "apps/api/test/app.http-spec.ts#GET /status devolve 200 com corpo válido pelo contrato, commit igual ao GIT_SHA e db down sem banco"
        status: pass
      - kind: other
        ref: "boot real: PORT=3101 GIT_SHA=tracer0102 node apps/api/dist/main.js e parse por @blog/shared/status imprime STATUS_OK"
        status: pass
    human_judgment: false
  - id: D2
    description: "Query do /status fora do contrato (detail=bogus, chave desconhecida) recusada com 400 pelo StandardSchemaValidationPipe global (T-01-04)"
    requirement: SEC-03
    verification:
      - kind: integration
        ref: "apps/api/test/app.http-spec.ts#responde 400 para detail fora de basic|full e chave desconhecida"
        status: pass
      - kind: other
        ref: "boot real: curl em /status?detail=bogus e /status?foo=1 devolve 400"
        status: pass
    human_judgment: false
  - id: D3
    description: "loadEnv() falha no boot com mensagem que cita só nomes de chave, nunca valores (T-01-03); produção exige DATABASE_URL"
    requirement: SEC-03
    verification:
      - kind: unit
        ref: "apps/api/src/config/env.spec.ts#falha citando só o nome da chave e nunca o valor (T-01-03)"
        status: pass
      - kind: other
        ref: "boot real com NODE_ENV=production DATABASE_URL=mysql://u:s3cr3t@h/db imprime so 'DATABASE_URL: deve começar com postgres:// ou postgresql://'"
        status: pass
    human_judgment: false
  - id: D4
    description: "GET /health/live responde 200 {status:'ok'} sem nenhuma dependência injetada"
    requirement: OPS-01
    verification:
      - kind: integration
        ref: "apps/api/test/app.http-spec.ts#GET /health/live responde 200 com status ok"
        status: pass
    human_judgment: false

duration: 11min
completed: 2026-11-20
status: complete
---

# Phase 1 Plan 02: API NestJS /status e /health/live Summary

**API NestJS 12 em ESM servindo `GET /status` validado pelo contrato `@blog/shared/status` (entrada e saída) e `GET /health/live` sem dependências, com `loadEnv()` em Zod que falha no boot sem vazar valores.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-11-20T18:19:00Z (aprox.)
- **Completed:** 2026-11-20T18:30:46Z
- **Tasks:** 2 (Task 1 tracer, Task 2 TDD)
- **Files modified:** 13 criados mais `pnpm-lock.yaml`

## Accomplishments

- Tracer: `node apps/api/dist/main.js` sobe e responde `/status` com JSON que passa em `statusResponseSchema` e `commit` igual ao `GIT_SHA`; sem banco, `db: 'down'` (porta `DATABASE_PROBE` com `UnconfiguredDatabaseProbe`).
- `StandardSchemaValidationPipe` global (via `configureApp`) recusa `?detail=bogus` e `?foo=1` com 400; o controller ainda faz `statusResponseSchema.parse` na saída.
- `loadEnv()` com Zod: defaults, coerção de número, `z.stringbool()` para booleano, `CORS_ORIGINS` como lista de origins https, `TRUST_PROXY_HOPS` 0 a 3, `DATABASE_URL` obrigatória em production (`superRefine`), erro sem valores (T-01-03).
- `HealthController` em `/health/live` sem construtor, pronto para o health check da Render.

## Task Commits

1. **Task 1: Tracer GET /status**
   - `7834d03` chore: andaime do workspace (package.json, tsconfigs, vitest, AppModule, configureApp, env provisório)
   - `d029f01` test: RED, `GET /status` devolve 404 em vez de 200 (controller ausente)
   - `1ff8c81` feat: GREEN, controller, service, porta de banco e `main.ts`
2. **Task 2: env, /health/live e rejeição de query (TDD)**
   - `7ba9f19` test: RED, 8 falhas de asserção no unit e 404 em `/health/live` no http
   - `8b672aa` feat: GREEN, `loadEnv()` completo e `HealthController`

**Plan metadata:** commit do SUMMARY (docs: complete plan), feito depois deste arquivo.

## TDD

- **RED (Task 1):** `apps/api/test/app.http-spec.ts` com o scaffold já presente falhou por asserção (`expected 404 to be 200`). `gsd-tools check tdd-red-evidence` devolveu `RED_EVIDENCE_OK` (`target_test_failed`, formato `tap`, 0 `report_errors`). `semanticAssessment`: o alvo executou e falhou na asserção planejada, sem erro de import, sintaxe ou fixture.
- **RED (Task 2):** `env.spec.ts` com 9 casos contra o `loadEnv` provisório: 8 falharam em asserção (`expected undefined to be ...`, `expected [Function] to throw an error`) e 1 passou (PORT numérico, que o provisório já cumpria). Alvo `falha citando só o nome da chave e nunca o valor (T-01-03)`: `RED_EVIDENCE_OK`. No http, `/health/live` falhou com `expected 404 to be 200`; os testes de 400 e `detail=full` já passavam (o pipe e o contrato vieram da Task 1) e documentam o comportamento. `semanticAssessment`: falhas são asserções planejadas, não erros de import.
- **GREEN:** `pnpm --filter @blog/api test` com 9/9, `test:http` com 5/5, `typecheck` limpo.
- **REFACTOR:** não necessário.
- **Tracer gate:** modo `end-of-phase` com `<verify>` só automatizado; o verify foi reexecutado ponta a ponta (teste HTTP e boot real com `STATUS_OK`): `Tracer verified end-to-end — expanding`.

## Files Created/Modified

- `apps/api/package.json` - `@blog/api` ESM, dependências exatas aprovadas, scripts `build`, `start`, `typecheck`, `test`, `test:http`
- `apps/api/tsconfig.json`, `tsconfig.build.json` - decorators com metadata, `types` vitest/globals e node; build só de `src` sem specs
- `apps/api/vitest.config.ts` - template Nest 12 com projetos `unit` e `http`
- `apps/api/src/main.ts` - bootstrap com top-level await, `configureApp` e `listen(env.PORT, '0.0.0.0')`
- `apps/api/src/app.module.ts` - `AppModule.forRoot(env)` com `APP_ENV`, `StatusService`, `DATABASE_PROBE` e os dois controllers
- `apps/api/src/app.setup.ts` - `configureApp`: pipe global de Standard Schema e shutdown hooks
- `apps/api/src/config/env.ts`, `env.spec.ts` - `loadEnv`, `envSchema`, `APP_ENV`, `AppEnv` e 9 testes
- `apps/api/src/status/status.controller.ts`, `status.service.ts` - rota `/status`, serviço e porta de banco
- `apps/api/src/health/health.controller.ts` - `/health/live`
- `apps/api/test/app.http-spec.ts` - 5 testes supertest

## Pacotes instalados e versões

Todos exatos (`pnpm add -E`), só os necessários e da lista aprovada no 01-01: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` 12.5.0; `reflect-metadata` 0.2.2; `rxjs` 7.8.2; `zod` 4.6.7; `@blog/shared` `workspace:*`. Dev: `@nestjs/testing` 12.5.0, `vitest` 4.1.12, `vite` 8.3.8, `supertest` 7.3.2, `@types/node` 26.6.6, `typescript` 6.0.3 e `@types/supertest` fixada em `7.2.1` (versão que o registry resolveu em 2026-11-20, sem versão na lista aprovada). O `pnpm install` não bloqueou nenhum script de build, então `allowBuilds` continua vazio.

## Decisions Made

- DI por metadata de decorators funciona sem `unplugin-swc` no Vitest 4.1.12 + Vite 8.3.8; nenhum ajuste de `vitest.config.ts` foi necessário (o plano pedia registrar o ajuste, se houvesse).
- `StandardSchemaValidationPipe` existe em `@nestjs/common` 12.5.0 com esse nome (também importado por `app.setup.ts`).
- Strings vazias valem como ausentes só nas chaves opcionais (`DATABASE_URL`, `SENTRY_DSN`, `SENTRY_ENVIRONMENT`); nas demais, vazio continua sendo erro (PORT vazia vira 0 e é recusada).
- `CORS_ORIGINS` só aceita `https://host[:porta]`, como o plano pede; quem precisar de `http://localhost` em dev terá de revisitar (não há chamada de navegador à API no desenho BFF).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Reporter `tap-flat` e `expected` multilinha**
- **Found during:** Task 2 (RED)
- **Issue:** o classificador de RED devolveu `INVALID_RED (invalid_record)` (`Malformed TAP`) porque o `toEqual` de um array de dois origins gera `expected` multilinha no relatório TAP (mesma causa registrada no 01-01).
- **Fix:** o teste compara `env.CORS_ORIGINS.join(' ')` com uma string; comportamento exigido idêntico. RED reexecutado e aprovado.
- **Files modified:** `apps/api/src/config/env.spec.ts`
- **Verification:** `RED_EVIDENCE_OK`, `report_errors: []`
- **Committed in:** `7ba9f19`

**2. [Rule 3 - Blocking] Sandbox do worktree recusou comandos compostos**
- **Found during:** Task 1 (instalação e ledger do commit)
- **Issue:** o harness recusou `cat > ... && pnpm add` e a captura do ledger com `$(git rev-parse --git-dir)` em um só comando.
- **Fix:** executei os mesmos passos como comandos simples e separados (Write para o `package.json`, ledger gravado pelo caminho do `--git-dir`).
- **Files modified:** nenhum
- **Verification:** `git rev-list --count` desde o ledger bate com os commits listados

**3. [Rule 3 - Blocking] `<automated>` de boot com `&`, `trap` e pipe**
- **Found during:** Task 1 (verify)
- **Issue:** o comando composto do `<automated>` não é aceito pela sandbox em uma linha.
- **Fix:** o mesmo boot real foi feito por um script no scratchpad (mesmas etapas: `node apps/api/dist/main.js` em background, espera por `/status`, parse por `@blog/shared/status`, comparação de `commit` e `db`). Resultado `STATUS_OK`.
- **Files modified:** nenhum (script fora do repositório)

---

**Total deviations:** 3 auto-fixed (3 blocking, todas de tooling, sem mudança de escopo)
**Impact on plan:** nenhum no entregável; só a forma de executar os checks difere do texto do plano.

## Auth Gates

Nenhum.

## Issues Encountered

None. O `<verify>` da Task 1 traz dois blocos `<automated>` (testes HTTP e boot real); os dois foram executados.

## Known Stubs

Nenhum. `UnconfiguredDatabaseProbe` não é stub: é o comportamento real e permanente de uma API sem `DATABASE_URL`; o 01-05 acrescenta a implementação com banco por trás do mesmo token.

## Threat Flags

Nenhum. As mitigações do `<threat_model>` foram aplicadas: T-01-03 (mensagem de erro sem valores, provado por teste unitário e por boot real) e T-01-04 (pipe global + `z.strictObject` + saída parseada), T-01-SC (só pacotes aprovados, versões exatas). As rotas `/status` e `/health/live` já estavam previstas no plano e são públicas e somente leitura.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- O 01-03 pode ligar a página Next a `GET /status` (a API responde em `PORT`, host `0.0.0.0`; rode `pnpm --filter @blog/shared build` e `pnpm --filter @blog/api build` antes de `pnpm --filter @blog/api start`).
- O 01-05 troca `UnconfiguredDatabaseProbe` por um probe real via `DATABASE_PROBE`; o 01-07 endurece o mesmo `configureApp` (Helmet, CORS, `trust proxy` por `TRUST_PROXY_HOPS`, já presente na env).
- `STATE.md` e `ROADMAP.md` não foram alterados (cabe ao orchestrator).

## Self-Check: PASSED

- Arquivos existem: `apps/api/package.json`, `tsconfig.json`, `tsconfig.build.json`, `vitest.config.ts`, `src/main.ts`, `src/app.module.ts`, `src/app.setup.ts`, `src/config/env.ts`, `src/config/env.spec.ts`, `src/status/status.controller.ts`, `src/status/status.service.ts`, `src/health/health.controller.ts`, `test/app.http-spec.ts`.
- Commits `7834d03`, `d029f01`, `1ff8c81`, `7ba9f19`, `8b672aa` presentes; `git rev-list --count 4cc2dd0..HEAD` = 5 antes do commit do SUMMARY; ordem chore, test, feat, test, feat.
- Critérios de aceitação: `"type": "module"` e `"@nestjs/core": "12.5.0"` sem `^`; controller contém `statusQuerySchema` e `statusResponseSchema.parse`; nenhum import relativo sem `.js`; boot real responde `commit` = `tracer0102` e `STATUS_OK`; `env.ts` contém `z.stringbool` e `superRefine`; teste do segredo prova que `s3cr3t` não aparece; `?detail=bogus` responde 400 no teste HTTP; `HealthController` sem construtor.
- Verificação do plano: `test` 9/9, `test:http` 5/5 e `typecheck` limpos (9 >= 8 testes unitários).

---
*Phase: 01-esqueleto-no-ar-com-testes-e-ci*
*Completed: 2026-11-20*
