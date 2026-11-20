---
phase: 01-esqueleto-no-ar-com-testes-e-ci
plan: 07
subsystem: api
tags: [helmet, cors, trust-proxy, pino, nestjs-pino, sentry, esm, security, observability]

requires:
  - phase: 01-esqueleto-no-ar-com-testes-e-ci
    provides: "configureApp, AppModule.forRoot, loadEnv (01-02) e probe Prisma (01-05)"
provides:
  - "configureApp endurecido: trust proxy por hops, Helmet (CSP default-src none), CORS por allowlist exata"
  - "Logs JSON (pino) com redação de segredos, req.id por requisição (x-request-id validado) e clientIp"
  - "Sentry inicializado por node --import ./dist/instrument.js, com SentryGlobalFilter"
  - "GET /_debug/error atrás de DEBUG_ROUTES_ENABLED (404 por padrão)"
  - "Opção AppModule.forRoot(env, { logDestination }) para capturar logs em testes"
affects: [01-08, 01-09, 01-11, 01-12]

actuals:
  tokens: 6800
  tasks: 3
  commits: 6

plan_head_before: fc43cf11b3a7d1e81b67317d1c4e20361894cde8
plan_head_after: 5006e273c01600df57c61cffc06d38c720256455

tech-stack:
  added: [helmet@8.3.0, nestjs-pino@5.3.1, pino@10.4.0, pino-http@11.0.0, "@sentry/nestjs@11.12.0"]
  patterns:
    - "Toda a configuração HTTP em configureApp: o teste exercita o que roda em produção"
    - "Smoke de integração sobre o build real (dist) com um ingest do Sentry falso e local"
    - "instrument.ts sem imports da aplicação, lê process.env direto, carregado por --import"
    - "Rotas de diagnóstico desligadas por flag de env (DEBUG_ROUTES_ENABLED)"

key-files:
  created:
    - apps/api/src/instrument.ts
    - apps/api/src/debug/debug.controller.ts
    - apps/api/test/security.http-spec.ts
    - apps/api/test/logging.http-spec.ts
    - apps/api/test/sentry.http-spec.ts
  modified:
    - apps/api/package.json
    - apps/api/src/app.setup.ts
    - apps/api/src/app.module.ts
    - apps/api/src/main.ts
    - pnpm-lock.yaml

key-decisions:
  - "Sentry 11.x não tem mais sendDefaultPii: usei dataCollection com userInfo, cookies, httpHeaders, httpBodies e urlQueryParams desligados"
  - "Teste de trust proxy usa uma rota de sonda (IpProbeController) só no TestingModule, sem expor nada na API real"
  - "Teste do Sentry sobe o dist como processo filho com ambiente mínimo e controlado (sem DSN/banco herdados)"

patterns-established:
  - "RED de testes HTTP com vitest --reporter=tap-flat chamado direto (apps/api/node_modules/.bin/vitest --root apps/api) para o stdout ficar só com TAP"
  - "Evitar aspas simples e escapes em mensagens de asserção quando a evidência RED precisa passar pelo classificador"

requirements-completed: [SEC-03, OPS-01]

coverage:
  - id: D1
    description: "Headers do Helmet em toda resposta: CSP default-src none e frame-ancestors none, nosniff, HSTS, sem x-powered-by (inclusive em 404)"
    requirement: SEC-03
    verification:
      - kind: integration
        ref: "apps/api/test/security.http-spec.ts#Helmet (5 casos)"
        status: pass
    human_judgment: false
  - id: D2
    description: "CORS por allowlist exata: origem da lista recebe o próprio valor, origem fora da lista (inclusive preflight OPTIONS) sem access-control-allow-origin, chamadas sem Origin funcionam, sem credenciais"
    requirement: SEC-03
    verification:
      - kind: integration
        ref: "apps/api/test/security.http-spec.ts#CORS por allowlist (6 casos)"
        status: pass
    human_judgment: false
  - id: D3
    description: "trust proxy = TRUST_PROXY_HOPS (D-02): com 1 hop e X-Forwarded-For 1.2.3.4, 5.6.7.8 o IP é 5.6.7.8; 2 hops dá 1.2.3.4; 0 hops ignora o header"
    requirement: SEC-03
    verification:
      - kind: integration
        ref: "apps/api/test/security.http-spec.ts#trust proxy por contagem de hops (3 casos)"
        status: pass
      - kind: integration
        ref: "apps/api/test/logging.http-spec.ts#registra clientIp pelo trust proxy de 1 hop"
        status: pass
    human_judgment: false
  - id: D4
    description: "Logs pino em JSON com [REDACTED] no lugar de authorization, cookie e x-api-key; o token literal nunca aparece na saída"
    requirement: OPS-01
    verification:
      - kind: integration
        ref: "apps/api/test/logging.http-spec.ts#redação de segredos (T-01-14) (4 casos)"
        status: pass
    human_judgment: false
  - id: D5
    description: "req.id por requisição (simultâneas distintas), x-request-id válido aceito e devolvido no header, inválido (65 caracteres ou espaço) vira UUID; /health/live fora do log"
    requirement: OPS-01
    verification:
      - kind: integration
        ref: "apps/api/test/logging.http-spec.ts#request id (5 casos) e #clientIp e ruído (2 casos)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Sentry em ESM por --import: o processo real (dist) envia ao ingest falso o envelope com sentry-smoke; sem DSN sobe normalmente; /_debug/error é 404 com a flag desligada e 500 genérico sem stack com a flag ligada"
    requirement: OPS-01
    verification:
      - kind: integration
        ref: "apps/api/test/sentry.http-spec.ts (6 casos, 3 sobre o build real)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Chegada real de um evento ao projeto Sentry (SaaS) com DSN verdadeiro e sem dado pessoal no painel"
    requirement: OPS-01
    verification: []
    human_judgment: true
    rationale: "Ainda não existe projeto/DSN do Sentry; o teste prova o caminho até um ingest falso. A conferência no painel real e do conteúdo do evento fica para o boot de produção (01-11)"

duration: 14min
completed: 2026-11-20
status: complete
---

# Phase 1 Plan 07: Endurecimento da API Summary

**Helmet com CSP fechada, CORS por allowlist exata, `trust proxy` por contagem de hops, logs pino em JSON com redação de segredos e `req.id`, e Sentry carregado por `node --import` em ESM com a rota `/_debug/error` desligada por padrão.**

## Performance

- **Duration:** 14 min
- **Completed:** 2026-11-20
- **Tasks:** 3 (1 tracer, 2 TDD)
- **Files modified:** 10 (5 criados, 5 alterados, contando `pnpm-lock.yaml`)
- **Commits:** 6 (3 RED, 3 GREEN)

## Accomplishments

- `configureApp` aplica, nesta ordem, `trust proxy` = `TRUST_PROXY_HOPS`, Helmet (`default-src 'none'`, `frame-ancestors 'none'`, CORP `same-site`), CORS por allowlist (GET/HEAD/OPTIONS, sem credenciais), pipe Zod global e shutdown hooks. O mesmo `configureApp` roda em `main.ts` e nos testes.
- Logs: `LoggerModule.forRoot` com `redact` (censor `[REDACTED]`), `genReqId` (aceita `^[A-Za-z0-9._-]{1,64}$`, senão `randomUUID()`, e devolve no header `x-request-id`), `customProps.clientIp` (`req.ip`, já com `trust proxy`) e `autoLogging.ignore` para `/health/live`. `main.ts` usa `bufferLogs` e `useLogger(Logger)`.
- Sentry: `src/instrument.ts` só inicializa com `SENTRY_DSN`; `SentryModule.forRoot()` + `SentryGlobalFilter`; script `start` com `--import ./dist/instrument.js`. O teste sobe o `dist` real e um ingest HTTP falso e vê o envelope com `sentry-smoke` chegar.
- 36 testes `test:http` verdes (4 arquivos), 9 unitários e 21 de integração (Postgres real) continuam verdes; `typecheck` e `build` limpos.

## Task Commits

1. **Task 1 (tracer): Helmet, CORS e trust proxy**
   - `2008361` test (RED)
   - `4190d4b` feat (GREEN)
2. **Task 2: logs JSON com redação, request id e clientIp**
   - `228eb12` test (RED)
   - `c643af1` feat (GREEN)
3. **Task 3: Sentry por `--import` e rota de diagnóstico**
   - `8693286` test (RED)
   - `5006e27` feat (GREEN)

**Plan metadata:** commit do SUMMARY (docs), feito depois deste arquivo.

## TDD

- **RED Task 1:** 14 casos, 9 falharam por asserção (headers ausentes, `x-powered-by: Express`, CORS sem header, IP do `trust proxy` errado) e 5 passaram (os que exigem ausência de header, sem a feature já eram verdadeiros). Evidência `RED_EVIDENCE_OK` (`target_test_failed`, alvo "envia x-content-type-options nosniff", formato tap, 0 `report_errors`). `semanticAssessment`: o alvo executou e falhou na asserção planejada (`undefined` em vez de `nosniff`), sem erro de import ou fixture.
- **RED Task 2:** 11 de 11 falharam por asserção (`expected 0 to be greater than 0`: nenhum log capturado). `RED_EVIDENCE_OK`, alvo "emite cada linha de log como JSON válido".
- **RED Task 3:** 3 de 6 passaram (os dois 404 e o caso trivial) e 4 falharam: o 500 sob flag (`expected 404 to be 500`) e os 3 de processo real (o filho não sobe porque `dist/instrument.js` não existe). `RED_EVIDENCE_OK` com alvo "responde 500 genérico, sem stack trace, quando DEBUG_ROUTES_ENABLED=true".
- **GREEN:** cada tarefa verde depois do commit `feat`; **REFACTOR:** não necessário.
- **Tracer gate:** modo `end-of-phase`, `<verify>` só automatizado: reexecutei o verify da Task 1 ponta a ponta (14 testes de segurança + 5 existentes verdes) e logo segui para a expansão.

## Open Question 6 (Sentry em ESM)

O `--import ./dist/instrument.js` funcionou sem ajuste adicional: o erro lançado em `GET /_debug/error`, rodando o build real em ESM no Node 26.13.1, chegou ao ingest falso como envelope em `POST /api/1/envelope/` contendo `sentry-smoke`. Nenhum `register()` extra de loader foi necessário.

## Files Created/Modified

- `apps/api/src/app.setup.ts` - `trust proxy`, Helmet, CORS, pipe Zod, shutdown hooks
- `apps/api/src/app.module.ts` - `LoggerModule` (pino), `SentryModule`, `SentryGlobalFilter`, `DebugController`, opção `logDestination`
- `apps/api/src/main.ts` - `bufferLogs` e `useLogger(Logger)`
- `apps/api/src/instrument.ts` - `Sentry.init` condicional ao DSN
- `apps/api/src/debug/debug.controller.ts` - `GET /_debug/error` atrás de flag
- `apps/api/test/security.http-spec.ts`, `logging.http-spec.ts`, `sentry.http-spec.ts` - testes de Helmet/CORS/trust proxy, redação/request id, e Sentry sobre o build real
- `apps/api/package.json`, `pnpm-lock.yaml` - dependências exatas e script `start` com `--import`

## Pacotes instalados e versões

Todos da lista aprovada no 01-01, com `pnpm add -E` e versão exata: `helmet@8.3.0`, `nestjs-pino@5.3.1`, `pino@10.4.0`, `pino-http@11.0.0`, `@sentry/nestjs@11.12.0`. Nenhum `allowBuilds` foi necessário.

Transitivas novas relevantes, para conferência do autor: `@sentry/nestjs` puxa `@sentry/node`, `@sentry/server-utils`, `@sentry/conventions` e, via `@sentry/bundler-plugins@11.12.0`, os pacotes `sentry@0.49.0` (binário do CLI do Sentry, 6 MB), `oxc-parser@0.152.0`, `glob@14.0.6` e `dotenv@17.4.2`. O `pnpm` reportou "Lockfile passes supply-chain policies" e nenhum script de build foi bloqueado.

## Decisions Made

- `sendDefaultPii` não existe no SDK 11.x (removido; o tipo `NodeOptions` o rejeita e o código do `@sentry/core` 11.12.0 não o lê). Troquei por `dataCollection` com `userInfo`, `cookies`, `httpHeaders`, `httpBodies` e `urlQueryParams` desligados, que cobre a intenção de T-01-24.
- A rota de sonda de IP existe só no `TestingModule` (`IpProbeController`), então a API real não ganha endpoint de diagnóstico de IP.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `sendDefaultPii: false` não existe no `@sentry/nestjs` 11.12.0**
- **Found during:** Task 3 (build GREEN)
- **Issue:** `tsc` falhou com TS2353 (`sendDefaultPii` não existe em `NodeOptions`). O critério de aceitação do plano exige a string literal `sendDefaultPii: false` em `instrument.ts`.
- **Fix:** usei `dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false }`, o substituto documentado nos tipos do SDK, mantendo `tracesSampleRate: 0.05`. O critério literal não é satisfazível; o critério de segurança por trás dele (T-01-24) está atendido.
- **Files modified:** `apps/api/src/instrument.ts`
- **Verification:** `pnpm --filter @blog/api build` limpo; teste do envelope verde
- **Committed in:** `5006e27`

**2. [Rule 3 - Blocking] Pré-requisitos de ambiente no worktree e comandos compostos recusados**
- **Found during:** início e Tasks 1 e 3
- **Issue:** worktree sem `node_modules`, sem `@blog/shared/dist` e sem cliente Prisma gerado (`../generated/prisma/client.js` ausente); a sandbox recusou comandos compostos (`&&`, heredocs) e `import type { Request } from 'express'` não resolve (não há `@types/express` direto em `apps/api`).
- **Fix:** `pnpm install --frozen-lockfile`, `pnpm --filter @blog/shared build`, `pnpm --filter @blog/api prisma:generate` (sem alterar arquivos rastreados); comandos divididos em chamadas simples; o controller de sonda tipa `req` como `{ ip?: string }` em vez de importar tipos do `express`.
- **Files modified:** `apps/api/test/security.http-spec.ts` (tipagem da sonda, no commit GREEN `4190d4b`)
- **Verification:** `typecheck` limpo

**3. [Rule 3 - Blocking] Evidência RED rejeitada pelo classificador (formato)**
- **Found during:** Task 1 (RED)
- **Issue:** `pnpm exec` imprime o banner de erro do pnpm depois do TAP, e mensagens de asserção com `\'` quebravam o TAP do classificador (`Non-TAP data in report`).
- **Fix:** rodei o vitest diretamente (`apps/api/node_modules/.bin/vitest run --root apps/api --project http --reporter=tap-flat`) e troquei `toContain("default-src 'none'")` por `includes(...)` com `toBe(true)`. A semântica do teste não mudou.
- **Files modified:** `apps/api/test/security.http-spec.ts` (já no commit RED)
- **Verification:** `RED_EVIDENCE_OK` com 0 `report_errors`

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking). **Impact on plan:** nenhum no entregável; apenas o critério literal `sendDefaultPii: false` foi substituído pelo equivalente do SDK vigente.

## Issues Encountered

- Os specs `http` agora imprimem as linhas de log do pino no stdout (o logger é o do produto). É esperado e não afeta o resultado; se ficar ruidoso, o 01-08 pode silenciar via `logDestination` nos specs que não capturam log.
- O teste do envelope depende do `dist` já compilado (`pnpm --filter @blog/api build`); sem build, ele falha com "child did not become ready". O `turbo.json` do 01-08 precisa declarar `test:http` dependendo de `build`.

## Known Stubs

Nenhum.

## Threat Flags

Nenhum além do registrado no `<threat_model>`: `GET /_debug/error` é a superfície nova (T-01-16, mitigada por 404 padrão e resposta 500 sem stack, provado nos testes). Mitigações aplicadas: T-01-14 (redact + teste procura o token literal), T-01-15 (`trust proxy` por hops, teste do valor forjado), T-01-16, T-01-17 (Helmet e CORS), T-01-24 (`dataCollection` desligada, DSN só por env, `tracesSampleRate` 0.05) e T-01-SC (versões exatas da lista aprovada).

## User Setup Required

None - no external service configuration required. O projeto e o DSN do Sentry serão criados depois; sem `SENTRY_DSN` o SDK nem é inicializado.

## Next Phase Readiness

- 01-08 (turbo/CI): declarar `build` como dependência de `test:http` e rodar `test:http` no CI.
- 01-11 (deploy): `CMD` da imagem deve ser o mesmo do script `start` (`node --enable-source-maps --import ./dist/instrument.js dist/main.js`); `DEBUG_ROUTES_ENABLED=true` só no boot de verificação; sondar `trust proxy` real na Render (X-Forwarded-For) e conferir o evento no painel do Sentry (deliverable D7).
- Nenhum `STATE.md` ou `ROADMAP.md` foi alterado (cabe ao orchestrator).

## Self-Check: PASSED

- Arquivos criados existem: `apps/api/src/instrument.ts`, `apps/api/src/debug/debug.controller.ts`, `apps/api/test/{security,logging,sentry}.http-spec.ts`.
- Commits `2008361`, `4190d4b`, `228eb12`, `c643af1`, `8693286`, `5006e27` presentes no histórico (RED antes de GREEN em cada tarefa); `git rev-list --count fc43cf1..HEAD` = 6 antes do commit do SUMMARY.
- Aceitação: `app.setup.ts` contém `'trust proxy'`, `helmet(` e `enableCors`; nenhum `trust proxy', true` em `apps/api/src`; `app.module.ts` contém `redact`, `genReqId`, `customProps` e `[REDACTED]`; `package.json` tem as cinco dependências exatas sem `^` e o script `start` com `--import ./dist/instrument.js`; `instrument.ts` tem `tracesSampleRate: 0.05` (e `dataCollection` no lugar de `sendDefaultPii`, ver desvio 1); o teste do envelope usa o `dist` real; `/_debug/error` é 404 com a flag desligada.
- Verificação do plano: `pnpm --filter @blog/shared build && pnpm --filter @blog/api build && pnpm --filter @blog/api test:http` (36 testes), `test` (9) e `test:integration` (21, Postgres real) verdes; contêiner de teste derrubado com `down -v`.

---
*Phase: 01-esqueleto-no-ar-com-testes-e-ci*
*Completed: 2026-11-20*
