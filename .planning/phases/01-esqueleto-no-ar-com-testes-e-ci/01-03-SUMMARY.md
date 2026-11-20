---
phase: 01-esqueleto-no-ar-com-testes-e-ci
plan: 03
subsystem: ui
tags: [nextjs, next-16, rsc, bff, eslint-9, vitest, tdd, tracer, bdd, smoke]

requires:
  - phase: 01-esqueleto-no-ar-com-testes-e-ci
    provides: "Contrato Zod do /status em @blog/shared/status (01-01) e API NestJS com GET /status e /health/live (01-02)"
provides:
  - "@blog/web: Next 16 (App Router) com home RSC que busca o /status da API no servidor, sem identidade visual"
  - "getStatus(detail, deps?) -> StatusResult, que nunca lança e degrada para 'API indisponível' (D-03)"
  - "ESLint 9 flat config com react/no-danger = error (SEC-03)"
  - "scripts/smoke-local.sh [--degraded]: smoke full-stack local (SMOKE_LOCAL_OK e SMOKE_LOCAL_DEGRADED_OK)"
  - "Projetos Vitest unit e int no web; scripts test e test:integration (mesmos nomes da API)"
  - "docs/bdd/home.feature.md: três cenários Dado/Quando/Então da home"
affects: [01-08, 01-09, 01-10, 01-14]

actuals:
  tokens: 5600
  tasks: 3
  commits: 6

plan_head_before: f4e6077bcc90115335d72475d3ea42dfde6afc01
plan_head_after: e12e20b424a6f22ce825368a449600f91369a12c

tech-stack:
  added:
    - "next@16.4.6"
    - "react@19.3.1"
    - "react-dom@19.3.1"
    - "eslint@9.39.5 (dev)"
    - "eslint-config-next@16.4.6 (dev)"
    - "vitest@4.1.12 (dev)"
    - "vite@8.3.8 (dev)"
    - "typescript@6.0.3 (dev)"
    - "@types/node@26.6.6 (dev, mesma do 01-01)"
    - "@types/react@19.3.0 (dev, versão resolvida pelo registry em 2026-11-20)"
    - "@types/react-dom@19.3.0 (dev, versão resolvida pelo registry em 2026-11-20)"
  patterns:
    - "BFF: o navegador fala só com o Next; API_URL (sem prefixo público) só existe no servidor"
    - "getStatus com sinal de timeout repassado ao fetch E corrida contra o prazo, então vale mesmo se o fetch ignorar o sinal"
    - "StatusResult como união discriminada: a página decide a degradação, nunca recebe exceção"
    - "Integração do web renderiza o Server Component (await Home(...) + renderToStaticMarkup) contra um servidor node:http de contrato, com fetch e contrato reais"
    - "Testes do web: lib/**/*.test.ts (projeto unit) e test/**/*.int-spec.ts (projeto int)"

key-files:
  created:
    - docs/bdd/home.feature.md
    - scripts/smoke-local.sh
    - apps/web/package.json
    - apps/web/tsconfig.json
    - apps/web/next.config.ts
    - apps/web/eslint.config.mjs
    - apps/web/vitest.config.ts
    - apps/web/app/layout.tsx
    - apps/web/app/page.tsx
    - apps/web/lib/api.ts
    - apps/web/lib/api.test.ts
    - apps/web/test/home.int-spec.ts
  modified:
    - pnpm-lock.yaml

key-decisions:
  - "O getStatus do tracer (Task 1) foi propositalmente parcial (qualquer exceção vira network, sem separar timeout e invalid), para o RED da Task 2 falhar por asserção de verdade; o GREEN completou a classificação"
  - "Prazo do getStatus por corrida entre o fetch e o sinal de timeout: um fetch que nunca resolve e ignora o sinal ainda termina no prazo"
  - "Comentários de código não citam o prefixo de variável pública do Next, para o gate grep NEXT_PUBLIC em lib e app ficar vazio de verdade"
  - "Nenhum vi.mock foi necessário no teste de integração: next/link renderiza fora do Next com renderToStaticMarkup e o Vite 8 aplica o JSX automático ao app/page.tsx pelo tsconfig (jsx react-jsx)"

patterns-established:
  - "Evidência RED por reporter tap-flat rodando só o teste-alvo (-t), porque falha por timeout gera mensagem multilinha que quebra o parse TAP do classificador"
  - "Quando os testes de integração já passam por causa de tarefas anteriores, a discriminação é provada por mutação temporária do código (revertida), registrada no commit"

requirements-completed: [QA-01, SEC-03]

coverage:
  - id: D1
    description: "A home RSC mostra versão, commit, status do banco e horário vindos da API, buscados no servidor do Next"
    requirement: QA-01
    verification:
      - kind: other
        ref: "bash scripts/smoke-local.sh imprime SMOKE_LOCAL_OK (data-testid api-commit com o SHA curto atual, HTTP 200 em / e /?detail=full)"
        status: pass
      - kind: integration
        ref: "apps/web/test/home.int-spec.ts#mostra commit, banco e o link de detalhes quando a API responde dentro do contrato"
        status: pass
    human_judgment: false
  - id: D2
    description: "Degradação D-03: API fora do ar, lenta, com erro HTTP ou fora do contrato resulta em página 200 com 'API indisponível no momento'"
    requirement: QA-01
    verification:
      - kind: unit
        ref: "apps/web/lib/api.test.ts (10 casos: config, http, invalid, timeout, network, fetch que nunca resolve em menos de 1 s)"
        status: pass
      - kind: integration
        ref: "apps/web/test/home.int-spec.ts (JSON fora do contrato, 503 e porta fechada)"
        status: pass
      - kind: other
        ref: "bash scripts/smoke-local.sh --degraded imprime SMOKE_LOCAL_DEGRADED_OK"
        status: pass
    human_judgment: false
  - id: D3
    description: "O link 'Ver detalhes' leva a /?detail=full e a página repassa detail=full para a API"
    requirement: QA-01
    verification:
      - kind: integration
        ref: "apps/web/test/home.int-spec.ts#repassa detail=full para a API e mostra a latência do banco"
        status: pass
    human_judgment: false
  - id: D4
    description: "ESLint do web falha em qualquer uso de dangerouslySetInnerHTML (react/no-danger = error)"
    requirement: SEC-03
    verification:
      - kind: other
        ref: "printf '...dangerouslySetInnerHTML...' | eslint --stdin --stdin-filename app/probe.tsx sai com 1 e cita react/no-danger"
        status: pass
    human_judgment: false
  - id: D5
    description: "Cenários BDD da home escritos antes dos testes que os implementam"
    verification:
      - kind: other
        ref: "docs/bdd/home.feature.md commitado em 85f5925, antes do feat(01-03) e dos testes de unidade e integração"
        status: pass
    human_judgment: true
    rationale: "A adequação do texto dos cenários ao que o autor espera da home depende de leitura humana; a automação só prova a ordem dos commits"

duration: 9min
completed: 2026-11-20
status: complete
---

# Phase 1 Plan 03: Home Next que mostra o status da API Summary

**`apps/web` em Next 16 com uma home RSC que busca o `/status` da API no servidor (BFF, `API_URL` sem prefixo público, timeout de 5 s, contrato Zod no parse) e degrada para "API indisponível no momento" com HTTP 200, protegida por testes unitários, teste de integração contra servidor de contrato, smoke local e `react/no-danger` como erro de lint.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-11-20T18:30:00Z (aprox.)
- **Completed:** 2026-11-20T18:39:13Z
- **Tasks:** 3 (Task 1 tracer, Tasks 2 e 3 TDD)
- **Files modified:** 12 criados mais `pnpm-lock.yaml`

## Accomplishments

- Tracer: `bash scripts/smoke-local.sh` compila shared, API e web, sobe os dois, e confirma `data-testid="api-commit"` com o SHA curto atual (`SMOKE_LOCAL_OK`), além de HTTP 200 em `/?detail=full`.
- `getStatus` nunca lança: `config`, `timeout`, `network`, `http` e `invalid` viram `StatusResult`, com prazo garantido por corrida mesmo se o `fetch` ignorar o sinal (teste de "fetch que nunca resolve" termina em menos de 1 s).
- Modo `--degraded` do smoke (só o web, API em porta fechada) devolve 200 com `api-unavailable` (`SMOKE_LOCAL_DEGRADED_OK`).
- Lint: ESLint 9.39.5 flat config com `eslint-config-next` 16 (core-web-vitals + typescript) e `react/no-danger` como `error`; a sonda com `dangerouslySetInnerHTML` sai com código 1 citando a regra.
- QA-01 no web: projeto `int` renderiza a `Home` de verdade contra um `node:http` de contrato com `fetch` e `statusResponseSchema` reais (5 casos), junto dos 10 testes unitários. Os scripts `test` e `test:integration` têm os mesmos nomes da API, então o pre-push (01-08) e o job `test-web` (01-09) os pegam.
- Cenários BDD em `docs/bdd/home.feature.md` (três, com tags `@smoke-local`, `@integration`, `@e2e`).

## Task Commits

1. **Task 1: Tracer, home mostra o commit da API (BDD -> smoke)**
   - `85f5925` test: RED, BDD + `smoke-local.sh` falhando porque o `apps/web` não existe
   - `e723157` feat: GREEN, `apps/web` com layout, home RSC, `getStatus` e `next.config.ts`
2. **Task 2: Degradação, link de detalhes e lint (TDD)**
   - `235e579` test: RED, 10 casos de `getStatus` (3 falham) + Vitest no web
   - `54c31ae` feat: GREEN, classificação completa, ESLint e smoke `--degraded`
3. **Task 3: Integração do web contra servidor de contrato (TDD)**
   - `9991b42` test: 5 casos de integração + projetos Vitest `unit` e `int`
   - `e12e20b` feat: scripts `test` (`--project unit`) e `test:integration` (`--project int`)

**Plan metadata:** commit do SUMMARY (docs: complete plan), feito depois deste arquivo.

## TDD

- **Tracer gate (Task 1):** modo `end-of-phase` com `<verify>` só automatizado; o smoke foi reexecutado ponta a ponta sobre o código commitado (`SMOKE_LOCAL_OK`, `GIT_SHA=e723157`): `Tracer verified end-to-end, expanding`. RED: `smoke-local.sh` falhou de verdade (o web nunca respondeu em 30 s, `cd apps/web: No such file`).
- **RED (Task 2):** 10 casos; 3 falharam por asserção (`expected 'network' to be 'timeout'`, `expected 'network' to be 'invalid'` e o fetch que nunca resolve estourando o timeout do teste de 5 s). Alvo `trata erro TimeoutError como timeout`: `gsd-tools check tdd-red-evidence` devolveu `RED_EVIDENCE_OK` (`target_test_failed`, formato `tap`, 0 `report_errors`) rodando só o alvo com `-t` (a execução completa deu `INVALID_RED (invalid_record)` por causa da mensagem multilinha do timeout). `semanticAssessment`: o alvo executou e falhou na asserção planejada (`actual: network`, `expected: timeout`), sem erro de import, sintaxe ou fixture.
- **GREEN (Task 2):** `test` 10/10, `lint` e `typecheck` limpos, sonda do `react/no-danger` com código 1, `smoke --degraded` verde.
- **RED (Task 3):** os 5 casos de integração já passaram no primeiro run (regressão protegida, como o plano prevê). Para provar que o teste discrimina, mutei `app/page.tsx` (`detail` sempre `basic`): `repassa detail=full para a API e mostra a latência do banco` falhou com `expected '/status?detail=basic' to be '/status?detail=full'` e o classificador devolveu `RED_EVIDENCE_OK`; a mutação foi revertida com `git checkout -- apps/web/app/page.tsx` antes do commit. `semanticAssessment`: falha na asserção planejada, com o servidor de contrato recebendo a URL errada.
- **GREEN (Task 3):** `test:integration` 5/5 e `test` 10/10.
- **REFACTOR:** não necessário.

## Files Created/Modified

- `docs/bdd/home.feature.md` - Funcionalidade e três cenários Dado/Quando/Então da home
- `scripts/smoke-local.sh` - Smoke full-stack (normal e `--degraded`), com `trap` de limpeza dos processos
- `apps/web/package.json` - `@blog/web` ESM, dependências exatas, scripts `dev`, `build`, `start`, `typecheck`, `lint`, `test`, `test:integration`
- `apps/web/tsconfig.json` - padrão do Next 16 (bundler, `jsx: react-jsx`, plugin `next`); não estende o base nodenext. O Next acrescentou `.next/dev/types/**/*.ts` ao `include` no primeiro build
- `apps/web/next.config.ts` - `reactStrictMode`, `poweredByHeader: false` e quatro headers de segurança em todas as rotas
- `apps/web/eslint.config.mjs` - flat config ESLint 9 com `react/no-danger: 'error'`
- `apps/web/vitest.config.ts` - projetos `unit` e `int`
- `apps/web/app/layout.tsx`, `app/page.tsx` - `<html lang="pt-BR">` e a home RSC
- `apps/web/lib/api.ts`, `lib/api.test.ts` - `getStatus` e seus 10 testes
- `apps/web/test/home.int-spec.ts` - integração da home contra servidor de contrato

## Pacotes instalados e versões

Todos exatos (`pnpm add -E`) e da lista aprovada no 01-01: `next` 16.4.6, `react` e `react-dom` 19.3.1, `@blog/shared` `workspace:*`. Dev: `typescript` 6.0.3, `@types/node` 26.6.6, `vitest` 4.1.12, `vite` 8.3.8, `eslint` 9.39.5, `eslint-config-next` 16.4.6. Sem versão na lista aprovada, fixadas na que o registry resolveu em 2026-11-20: `@types/react` 19.3.0 e `@types/react-dom` 19.3.0. Nada fora da lista foi instalado (nem `@sentry/nextjs`, `@playwright/test` e `@axe-core/playwright`, que são de planos seguintes). O `pnpm install` não bloqueou script de build, então `allowBuilds` continua vazio.

## Decisions Made

- O `getStatus` do tracer ficou deliberadamente parcial (todo erro vira `network`, sem separar `timeout` nem `invalid` por corpo não JSON). Assim o RED da Task 2 falha por asserção real em vez de nascer verde; o GREEN completa a classificação sem mudar assinatura nem tipo.
- Prazo por corrida (`Promise.race` com o sinal de timeout) além de passar `signal` ao `fetch`: protege a home contra implementações de `fetch` que ignoram o sinal. A rejeição do prazo tem `.catch` para não virar rejeição não tratada depois de a resposta chegar.
- `next/link` e o JSX do `app/page.tsx` funcionaram no Vitest sem `vi.mock` e sem configuração extra de JSX (Vite 8 respeita o `jsx: react-jsx` do tsconfig). Não foi preciso o plano B de trocar `next/link` por `<a>`.
- O `.next/dev/types` no `include` do `tsconfig.json` é uma reconfiguração automática do Next; mantida.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Comentário citando o prefixo de variável pública quebrava o gate `grep NEXT_PUBLIC`**
- **Found during:** Task 1 (critérios de aceitação)
- **Issue:** o comentário de `lib/api.ts` continha o texto do prefixo proibido, então `grep -rn "NEXT_PUBLIC" apps/web/lib apps/web/app` imprimia uma linha
- **Fix:** reescrevi o comentário sem o texto do prefixo
- **Files modified:** `apps/web/lib/api.ts`
- **Verification:** o grep não imprime nada
- **Committed in:** `e723157`

**2. [Rule 3 - Blocking] Evidência RED da Task 2 só válida rodando o teste-alvo isolado**
- **Found during:** Task 2 (RED)
- **Issue:** a execução completa gerou `INVALID_RED (invalid_record)` (`Malformed TAP`), porque o teste do fetch que nunca resolve falha com mensagem multilinha ("Test timed out ... If this is a long-running test ...")
- **Fix:** reexecutei o alvo planejado com `-t "trata erro TimeoutError como timeout"` e reporter `tap-flat`, e submeti esse registro; `RED_EVIDENCE_OK`. A execução completa (3 falhas, 7 passes) está descrita acima
- **Files modified:** nenhum (registro de evidência fora do repositório)

**3. [Rule 3 - Blocking] Warning de lint por variável não usada no teste**
- **Found during:** Task 2 (GREEN)
- **Issue:** `const { commit: _commit, ...semCommit }` gerou `@typescript-eslint/no-unused-vars`
- **Fix:** troquei por `Object.fromEntries(Object.entries(...).filter(...))`, mesmo comportamento testado
- **Files modified:** `apps/web/lib/api.test.ts`
- **Committed in:** `54c31ae`

**4. [Rule 3 - Blocking] Sandbox do worktree recusou comandos compostos**
- **Found during:** Tasks 2 e 3
- **Issue:** o harness recusou `cd apps/web && vitest ... > arquivo` e `pnpm add @blog/shared@workspace:*` sem aspas (zsh)
- **Fix:** comandos simples e separados, saída do reporter para o scratchpad, `pnpm --filter @blog/web exec` em vez de `cd`, e aspas no spec `workspace:*`
- **Files modified:** nenhum

**5. [Rule 3 - Blocking] Verificações `<automated>` do plano executadas em forma equivalente**
- **Found during:** Tasks 2 e 3
- **Issue:** o `<automated>` com `printf | eslint --stdin; test $? -ne 0` e os encadeamentos com `&&` foram divididos em comandos simples
- **Fix:** mesmos checks, um por vez: sonda de ESLint (saída com 1 e `react/no-danger`), `grep -q` do script `test:integration`, `grep` de `vi.mock` vazio (código 1)
- **Files modified:** nenhum

### TDD: RED da Task 3 sem falha inicial

O plano previu que casos já verdes por causa das Tasks 1 e 2 contam como regressão protegida. Todos os 5 passaram de primeira; a discriminação foi provada por mutação temporária (descrita em TDD), não por falha natural.

---

**Total deviations:** 5 auto-fixed (1 bug, 4 blocking de tooling), mais a nota de TDD da Task 3
**Impact on plan:** nenhum no entregável; só a forma de coletar a evidência RED e de executar os checks difere do texto do plano.

## Auth Gates

Nenhum.

## Issues Encountered

- O `<verify>` da Task 2 traz três blocos `<automated>` e o da Task 3 dois; todos foram executados (com as adaptações acima).
- O `pnpm` imprime um banner de erro no stdout quando o Vitest falha em `pnpm exec`; ele precisa ser cortado do relatório TAP antes de ir ao classificador de RED.

## Known Stubs

Nenhum. A home sem identidade visual é o escopo do plano (a Fase 2 trata do visual), não um stub.

## Threat Flags

Nenhum. As mitigações do `<threat_model>` foram aplicadas: T-01-05 (só JSX com texto, `react/no-danger` = error, sonda de lint comprovada; gate de CI com allowlist vazia segue no 01-14/01-09), T-01-06 (`AbortSignal.timeout(5000)` mais corrida de prazo, página 200 degradada, provados por unitário, integração e `smoke --degraded`), T-01-37 (`API_URL` só no servidor, `grep NEXT_PUBLIC` vazio em `lib` e `app`) e T-01-SC (só pacotes aprovados, versões exatas). O web passa a servir a rota pública `/`, prevista no plano, e envia headers de segurança básicos (a CSP com nonce fica para plano posterior).

## User Setup Required

None - no external service configuration required. (`API_URL` será configurada na Vercel no plano de deploy do web.)

## Next Phase Readiness

- Os planos 01-08 (pre-push) e 01-09 (CI) podem chamar `turbo run lint typecheck test test:integration build --filter=@blog/web`: os scripts `lint`, `typecheck`, `test`, `test:integration` e `build` existem no `@blog/web`.
- O 01-10 (Playwright) reaproveita os `data-testid` `api-commit`, `api-db`, `api-time`, `api-db-latency` e `api-unavailable` e os cenários `@e2e` de `docs/bdd/home.feature.md`.
- O 01-14 acrescenta o gate de CI de `dangerouslySetInnerHTML` (script com allowlist vazia); aqui só existe a regra de lint.
- `STATE.md` e `ROADMAP.md` não foram alterados (cabe ao orchestrator).

## Self-Check: PASSED

- Arquivos existem: `docs/bdd/home.feature.md`, `scripts/smoke-local.sh`, `apps/web/{package.json,tsconfig.json,next.config.ts,eslint.config.mjs,vitest.config.ts,app/layout.tsx,app/page.tsx,lib/api.ts,lib/api.test.ts,test/home.int-spec.ts}`.
- Commits `85f5925`, `e723157`, `235e579`, `54c31ae`, `9991b42`, `e12e20b` presentes; `git rev-list --count f4e6077..HEAD` = 6 antes do commit do SUMMARY; ordem test, feat, test, feat, test, feat.
- Critérios de aceitação: `smoke-local.sh` imprime `SMOKE_LOCAL_OK` e `SMOKE_LOCAL_DEGRADED_OK`; `lib/api.ts` contém `AbortSignal.timeout`, `cache: 'no-store'` e `statusResponseSchema.safeParse`; `grep NEXT_PUBLIC` em `lib` e `app` vazio; `eslint.config.mjs` contém `'react/no-danger': 'error'`; `home.int-spec.ts` contém `node:http`, `statusResponseSchema` e `renderToStaticMarkup`, e não contém `fetchImpl`; scripts `test` (`--project unit`) e `test:integration` (`--project int`) presentes; integração 5/5 e unitário 10/10 (>= 9).
- Verificação do plano: `smoke-local.sh` e `smoke-local.sh --degraded` verdes; `test`, `test:integration`, `lint` e `typecheck` do `@blog/web` limpos.

---
*Phase: 01-esqueleto-no-ar-com-testes-e-ci*
*Completed: 2026-11-20*
