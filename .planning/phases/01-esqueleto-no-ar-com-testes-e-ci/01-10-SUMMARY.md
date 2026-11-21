---
phase: 01-esqueleto-no-ar-com-testes-e-ci
plan: 10
subsystem: testing
tags: [playwright, axe, wcag, e2e, sentry, nextjs, ci, github-actions]

requires:
  - phase: 01-esqueleto-no-ar-com-testes-e-ci
    provides: "home do web com data-testid (01-03), API compilada com instrument.js (01-07), prepare-test-db.mjs (01-04/01-08), ci-ok e postgrest-anon (01-09)"
provides:
  - "E2E dos três cenários BDD da home (Playwright + axe WCAG 2.1 A/AA) rodando no job e2e da CI"
  - "Job e2e dentro do needs do ci-ok (check obrigatório do ruleset)"
  - "Sentry do web (servidor, navegador, register/onRequestError, global-error) inicializado só com DSN"
affects: [01-11 (DSN do Sentry web), 01-12 (deploy do web na Vercel), fases seguintes (cada uma acrescenta cenários @e2e)]

actuals:
  tokens: 4450
  tasks: 3
  commits: 6

tech-stack:
  added: ["@playwright/test@1.65.1", "@axe-core/playwright@4.14.0", "@sentry/nextjs@11.12.0"]
  patterns:
    - "webServer do Playwright sobe API compilada (--import instrument) + web normal + web degradado (API_URL em porta fechada)"
    - "Inicialização condicional do Sentry provada por teste unitário com o SDK mockado (vi.hoisted + vi.resetModules + vi.stubEnv)"

key-files:
  created:
    - apps/web/playwright.config.ts
    - apps/web/e2e/home.spec.ts
    - apps/web/instrumentation.ts
    - apps/web/instrumentation-client.ts
    - apps/web/sentry.server.config.ts
    - apps/web/app/global-error.tsx
    - apps/web/lib/sentry-init.test.ts
  modified:
    - apps/web/package.json
    - apps/web/next.config.ts
    - apps/web/eslint.config.mjs
    - docs/bdd/home.feature.md
    - .github/workflows/ci.yml
    - pnpm-lock.yaml

key-decisions:
  - "sendDefaultPii não existe no @sentry/nextjs 11.12.0 (nem nos tipos do @sentry/core): usei dataCollection com userInfo, cookies, httpHeaders, httpBodies e urlQueryParams desligados, o mesmo mapeamento do 01-07"
  - "withSentryConfig no SDK 11.x vem de '@sentry/nextjs/config' (o export raiz não o tem mais)"
  - "Sem SENTRY_AUTH_TOKEN o upload de source maps fica desativado (sourcemaps.disable) e a telemetria do plugin desligada; o build não precisa de nenhuma variável do Sentry"
  - "Instrumentation do cliente exporta onRouterTransitionStart = captureRouterTransitionStart (padrão do SDK para navegações), sem nenhuma integração extra"
  - "Web degradado = mesma build do Next em outra porta (3202) com API_URL em porta fechada, em vez de interceptar rede no navegador, porque o fetch da API acontece no servidor do Next (BFF)"
  - "Artefato do relatório do Playwright fixado em actions/upload-artifact v7.0.2 (cf430e03...), tag leve resolvida direto para commit"

patterns-established:
  - "Todo cenário @e2e termina com expectNoAxeViolations(page), que imprime os id das violações na falha"
  - "E2E só na CI (D-09): o pre-push não tem Playwright; localmente roda com CI=1 contra o compose de teste"

requirements-completed: [QA-02, QA-04, OPS-01]

coverage:
  - id: D1
    description: "Os três cenários BDD da home (API e banco no ar, Ver detalhes, API indisponível) rodam como E2E no Chromium com axe WCAG 2.1 A/AA sem violações"
    requirement: QA-02
    verification:
      - kind: e2e
        ref: "apps/web/e2e/home.spec.ts (3 testes @e2e), run 44842392766 job e2e = success"
        status: pass
    human_judgment: false
  - id: D2
    description: "Job e2e na CI (Postgres real, migration, build, Chromium, relatório só em falha) incluído no needs do ci-ok"
    requirement: QA-04
    verification:
      - kind: other
        ref: "gh run view 44842392766: e2e=success, ci-ok=success; scripts/ci-gates.test.mjs (7 testes) passa"
        status: pass
    human_judgment: false
  - id: D3
    description: "Sentry do web inicializa só com DSN, com tracesSampleRate 0.05, sem dado pessoal e sem replay; build e testes funcionam sem DSN"
    requirement: OPS-01
    verification:
      - kind: unit
        ref: "apps/web/lib/sentry-init.test.ts (5 casos)"
        status: pass
      - kind: other
        ref: "pnpm --filter @blog/web build sem SENTRY_DSN, NEXT_PUBLIC_SENTRY_DSN e SENTRY_AUTH_TOKEN"
        status: pass
    human_judgment: false
  - id: D4
    description: "Chegada real de um evento do web ao projeto Sentry do web, sem dado pessoal no painel"
    requirement: OPS-01
    verification: []
    human_judgment: true
    rationale: "Ainda não existe projeto nem DSN do Sentry (criados no 01-11); o teste prova só que o SDK é chamado com as opções certas. A conferência no painel real fica para o deploy do web (01-12)."

duration: 21min
completed: 2026-11-20
status: complete
---

# Phase 01 Plan 10: E2E com Playwright + axe na CI e Sentry do web Summary

**Os três cenários BDD da home rodam como E2E no Chromium com axe (WCAG 2.1 A/AA) contra API compilada, web e Postgres reais num job `e2e` que entra no `ci-ok`, e o web inicializa o Sentry só com DSN (5% de amostragem, sem dado pessoal, sem replay).**

## Performance

- **Duration:** 21 min
- **Started:** 2026-11-20T23:55:00Z (aproximado, antes do primeiro commit)
- **Completed:** 2026-11-21T00:16:00Z
- **Tasks:** 3 (1 tracer, 2 TDD)
- **Files modified:** 13 (7 criados, 6 alterados, contando o lockfile)

## Accomplishments

- Tracer: `@e2e API e banco no ar` (commit `e2e-sha`, banco `up`, axe limpo) rodando no job `e2e` da CI, que sobe `supabase/postgres`, aplica a migration como `blog_e2e`, sobe a API (`--import ./dist/instrument.js`) e o web (`next start`) via `webServer`. O tracer foi verificado de ponta a ponta na CI (run 44841515271) antes da expansão.
- `@e2e Ver detalhes` (URL `/?detail=full`, latência visível) e `@e2e API indisponível` (200, mensagem "API indisponível no momento", servidor do web na porta 3202 com a API apontada para a porta fechada 9), cada um com axe.
- `e2e` na linha única de `needs` do `ci-ok`: um E2E vermelho bloqueia o merge. `.husky/pre-push` continua sem Playwright (D-09).
- Sentry do web: `sentry.server.config.ts`, `instrumentation-client.ts`, `instrumentation.ts` (`register` só no runtime `nodejs`, `onRequestError`), `global-error.tsx` e `withSentryConfig`; tudo condicionado a DSN, e o build sem nenhuma variável do Sentry passa.

## Task Commits

1. **Task 1: Tracer, cenário "API e banco no ar" no Playwright com axe e job `e2e`** - `277b9ec` (test, RED), `54960db` (feat, GREEN)
2. **Task 2: E2E de "Ver detalhes" e "API indisponível"** - `a126316` (test, RED), `3452fd5` (feat, GREEN)
3. **Task 3: Sentry no web, sem DSN no build e com amostragem baixa** - `4630b7a` (test, RED), `a02a227` (feat, GREEN)

**Plan metadata:** commit `docs(01-10)` seguinte a este arquivo.

## TDD Gate Compliance

Sequência RED -> GREEN presente nos três ciclos; nenhum REFACTOR (nada a limpar).

- **Task 1 RED:** `@e2e API e banco no ar` sem `playwright.config.ts` falha em `page.goto: Cannot navigate to invalid URL` (sem `baseURL` nem servidores). `gsd check tdd-red-evidence` com o relatório JUnit do Playwright devolveu `RED_EVIDENCE_OK`. Semantic assessment: o teste-alvo executou e falhou na primeira ação de navegação, pelo motivo planejado (config e servidores ausentes), sem erro de sintaxe, import ou fixture. O Playwright só emite `<error>` (nunca `<failure>`), o que o classificador aceitou.
- **Task 2 RED:** `@e2e API indisponível` falha com `net::ERR_CONNECTION_REFUSED` em `127.0.0.1:3202` (terceiro servidor inexistente). `@e2e Ver detalhes` já passava (a funcionalidade vem do 01-03); a discriminação foi provada por mutação temporária do `href` do link para `/?detail=basic` (teste falhou em `toHaveURL`, esperado `/?detail=full`), revertida com `git checkout -- apps/web/app/page.tsx`. Semantic assessment: o teste degradado falha pelo motivo certo; o de detalhes é uma verificação de comportamento existente, com prova de mutação.
- **Task 3 RED:** três dos cinco casos falham em `AssertionError: expected "vi.fn()" to be called 1 times, but got 0 times`; `RED_EVIDENCE_OK` (reporter `tap-flat`, alvo "inicializa uma vez com DSN..."). Os dois casos negativos (sem DSN, não chamar `init`) passaram contra os esqueletos vazios, então a discriminação foi provada no GREEN trocando `if (dsn)` por `if (true)` nos dois módulos (os dois negativos falharam), revertido em seguida. Semantic assessment: falha na asserção planejada, pelo motivo certo; os esqueletos vazios existem só para o teste carregar (módulos inexistentes dariam falha de carga, que o classificador recusa).

## Files Created/Modified

- `apps/web/playwright.config.ts` - três `webServer` (API 3201, web 3200, web degradado 3202), projeto `chromium`, `retries` 1 só na CI, relatório HTML
- `apps/web/e2e/home.spec.ts` - três testes `@e2e` com `AxeBuilder` e `expectNoAxeViolations`
- `.github/workflows/ci.yml` - job `e2e`; `e2e` no `needs` do `ci-ok`
- `apps/web/lib/sentry-init.test.ts` - 5 casos Vitest com o SDK mockado
- `apps/web/sentry.server.config.ts`, `instrumentation-client.ts`, `instrumentation.ts`, `app/global-error.tsx`, `next.config.ts` - Sentry do web
- `apps/web/eslint.config.mjs` - ignora `playwright-report` e `test-results`
- `docs/bdd/home.feature.md` - `@e2e` aponta para `apps/web/e2e/home.spec.ts`
- `apps/web/package.json`, `pnpm-lock.yaml` - três dependências aprovadas, versões exatas, e script `test:e2e`

## Decisions Made

Ver `key-decisions` no cabeçalho. A principal: `dataCollection` desligada no lugar de `sendDefaultPii: false`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `sendDefaultPii: false` não existe no @sentry/nextjs 11.12.0**
- **Found during:** Task 3 (Sentry do web)
- **Issue:** o plano e os critérios pedem a string literal `sendDefaultPii: false`; os tipos do `@sentry/core` 11.12.0 não têm a opção (mesma descoberta do 01-07). O `grep -q "sendDefaultPii: false" apps/web/sentry.server.config.ts` do primeiro `<automated>` da Task 3 não pode passar.
- **Fix:** `dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false }` nos dois módulos; o teste exige esse objeto exato. Mapeamento registrado acima; o objetivo de segurança (T-01-56) está atendido.
- **Files modified:** `apps/web/sentry.server.config.ts`, `apps/web/instrumentation-client.ts`, `apps/web/lib/sentry-init.test.ts`
- **Verification:** `vitest` 5/5, `tsc --noEmit` limpo, build sem DSN
- **Committed in:** `4630b7a`, `a02a227`

**2. [Rule 3 - Blocking] `withSentryConfig` não é exportado por `@sentry/nextjs` na 11.12.0**
- **Found during:** Task 3 (`next.config.ts`)
- **Issue:** `tsc` falhou com TS2305; o export vive no subcaminho `@sentry/nextjs/config`.
- **Fix:** import trocado para `@sentry/nextjs/config`, com comentário.
- **Files modified:** `apps/web/next.config.ts`
- **Verification:** typecheck e `next build` passam; `sourcemaps.disable` e `telemetry` conferidos pelo `tsc`
- **Committed in:** `a02a227`

**3. [Rule 3 - Blocking] ESLint lintaria os relatórios gerados do Playwright**
- **Found during:** Task 1 (arquivo fora da lista `files_modified`)
- **Issue:** `eslint .` varre `playwright-report/` e `test-results/` quando existem (rodada local do E2E), gerando ruído.
- **Fix:** os dois diretórios entram no `globalIgnores` de `apps/web/eslint.config.mjs`.
- **Verification:** `pnpm --filter @blog/web lint` limpo
- **Committed in:** `54960db`

**4. [Rule 1 - Bug] `<a href="/">` rejeitado pelo ESLint no `global-error.tsx`**
- **Found during:** Task 3
- **Issue:** `@next/next/no-html-link-for-pages` exige `<Link />`.
- **Fix:** `next/link` no link para `/`.
- **Verification:** lint limpo e build ok
- **Committed in:** `a02a227`

**5. [Rule 2 - Missing critical, escopo do TDD] Esqueletos vazios no commit RED da Task 3**
- **Found during:** Task 3 (RED)
- **Issue:** sem os três módulos o Vite falha na resolução do import e nenhum teste executa (`fixture_or_load_failure`, RED inválido).
- **Fix:** os módulos entraram no commit `test(01-10)` como esqueletos sem comportamento (`export {}`; `register` vazio e `onRequestError = undefined`), substituídos no GREEN.
- **Committed in:** `4630b7a`

**Impact:** os desvios 1 e 2 vêm da versão do SDK (já conhecida do 01-07); os demais são ajustes mínimos de lint e do ciclo TDD. Sem expansão de escopo. Atenção do orquestrador: o primeiro `<automated>` da Task 3 e o critério "sendDefaultPii" não são satisfazíveis literalmente.

## Authentication Gates

Nenhum.

## Issues Encountered

- O Chromium baixado pelo Playwright não abria localmente (faltavam `libnspr4`, `libnss3`, `libnssutil3` e `libasound`, e `--with-deps` exigiria sudo). Baixei os `.deb` oficiais do Ubuntu (`apt-get download`, sem root), extraí em `/tmp/.../scratchpad/libs` e usei `LD_LIBRARY_PATH` só na sessão. Resultado: o E2E rodou localmente (RED, mutação e GREEN) além da CI. Nada disso entra no repositório.
- O pre-push roda `docker compose -f compose.test.yaml up` sem `-p`; como a porta 54329 já estava com a minha stack (`bnl-0110`), os pushes usaram `COMPOSE_PROJECT_NAME=bnl-0110` para o hook reaproveitar a mesma stack.
- O Playwright 1.65.1 não tem reporter TAP; a evidência RED da Task 1 foi o JUnit do próprio Playwright, aceito pelo classificador.

## Dependências novas (para conferência do autor)

Só os três pacotes aprovados, todos com `-E` e versão exata (o pnpm reportou "Lockfile passes supply-chain policies" e nenhum script de build foi bloqueado):

- `@playwright/test@1.65.1` e `@axe-core/playwright@4.14.0` (devDependencies): transitivas `playwright@1.65.1`, `playwright-core@1.65.1`, `axe-core@4.14.1`.
- `@sentry/nextjs@11.12.0` (dependencies): +21 pacotes, entre eles `@sentry/browser`, `@sentry/react`, `@sentry/replay`, `@sentry/replay-canvas`, `@sentry/feedback`, `@sentry/browser-utils`, `@sentry/cloudflare`, `@sentry/vercel-edge`, `@rollup/plugin-commonjs@28.0.1`, `@rollup/pluginutils@5.5.1`, `commondir`, `estree-walker`, `is-reference` e os binários opcionais `@rollup/rollup-*` por plataforma. O pacote `@sentry/replay` vem como dependência do SDK, mas não é usado: nenhuma integração de replay é configurada (`grep replayIntegration` vazio).

## Known Stubs

Nenhum. (Os esqueletos vazios do commit RED foram substituídos no GREEN.)

## Threat Flags

Nenhum além do registrado no `<threat_model>`. Mitigações aplicadas: T-01-23 (relatório só em falha, 7 dias, SHA fixado), T-01-56 (`dataCollection` desligada, sem replay, 0.05, init só com DSN, provado por teste), T-01-55 (`e2e` no `needs` do `ci-ok`), T-01-SC (versões exatas da lista aprovada).

## User Setup Required

None - no external service configuration required. O DSN do Sentry web (`SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`) e o `SENTRY_AUTH_TOKEN` opcional são configurados no deploy (01-11/01-12).

## Next Phase Readiness

- 01-11: criar o projeto Sentry do web e definir `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` na Vercel; sem DSN nada é enviado.
- 01-12: o deploy do web pode depender do run verde de CI (inclui `e2e`).
- Próximas fases: cada uma acrescenta cenários `@e2e` em `apps/web/e2e/`; o job e o `webServer` já existem.

## Self-Check: PASSED

- Arquivos presentes: `apps/web/playwright.config.ts`, `apps/web/e2e/home.spec.ts`, `apps/web/instrumentation.ts`, `apps/web/instrumentation-client.ts`, `apps/web/sentry.server.config.ts`, `apps/web/app/global-error.tsx`, `apps/web/lib/sentry-init.test.ts`.
- Commits presentes na branch: `277b9ec`, `54960db`, `a126316`, `3452fd5`, `4630b7a`, `a02a227`.
- Último run de CI (44842392766, commit `a02a227`): lint, typecheck, test-api, test-web, e2e, postgrest-anon, secrets e ci-ok = success.
- Critérios de aceitação: `AxeBuilder` e `@e2e API e banco no ar` no spec; `e2e` no `needs` do `ci-ok`; `.husky/pre-push` sem Playwright; `test(01-10)` antes de cada `feat(01-10)`; 3 testes `@e2e` (`grep -cE` = 3), cada um com axe; degradado exige status 200; `replayIntegration` ausente; build sem DSN ok; Sentry 5/5. Exceção única: o literal `sendDefaultPii: false` (Deviation 1).
