---
phase: 02-identidade-visual-no-law
plan: 13
subsystem: ui
tags: [next, global-error, sentry, bdd, playwright, axe, tdd]

requires:
  - phase: 02-identidade-visual-no-law
    provides: "02-01 THEME_INIT_SCRIPT, 02-03 Card/buttonVariants/404, 02-10 globals.css e e2e/helpers.ts, 02-11 lib/fonts.ts"
provides:
  - "global-error.tsx com documento, estilos, fontes e tema próprios, sem detalhe técnico"
  - "BDD das telas de erro (404 e erro global)"
  - "E2E da 404 nos dois temas com axe, para a CI"
affects: [02-09, 02-14]

plan_head_before: ebc443b88dc6146740824f761fe30c26b8f95d80
plan_head_after: 1d488c2e0511ed9f30813ea9397fa4728578e7b8

actuals:
  tokens: 1900
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Documento próprio em global-error: import './globals.css', data-theme escuro, variáveis das fontes no <html> e <script>{THEME_INIT_SCRIPT}</script> como texto filho"
    - "Teste do efeito sem navegador: vi.mock('react') com useEffect executando o callback na hora"

key-files:
  created:
    - apps/web/app/global-error.test.tsx
    - docs/bdd/erros.feature.md
    - apps/web/e2e/erros.spec.ts
  modified:
    - apps/web/app/global-error.tsx

key-decisions:
  - "O tipo das props do GlobalError aceita reset opcional (o Next o passa), mas ele não é usado: a tela só oferece o link para / e não tenta recarregar"
  - "O erro global fica só em @unit no BDD: um build de produção não tem como provocar uma exceção fora do layout raiz num E2E"

requirements-completed: [VIS-01, VIS-03]

coverage:
  - id: D1
    description: "Erro global com documento próprio (pt-BR, tema escuro, fontes, script de tema, título), textos do clã e CTA primário"
    requirement: VIS-01
    verification:
      - kind: unit
        ref: "apps/web/app/global-error.test.tsx#Erro global com a identidade do clã"
        status: pass
      - kind: integration
        ref: "pnpm --filter @blog/web build"
        status: pass
    human_judgment: false
  - id: D2
    description: "Nenhum detalhe técnico (message, digest, pilha) no HTML do erro global e a exceção segue para o Sentry"
    requirement: VIS-03
    verification:
      - kind: unit
        ref: "apps/web/app/global-error.test.tsx#não revela mensagem, digest nem pilha do erro ao visitante"
        status: pass
      - kind: unit
        ref: "apps/web/app/global-error.test.tsx#continua repassando a exceção ao Sentry"
        status: pass
    human_judgment: false
  - id: D3
    description: "BDD das duas telas de erro e E2E da 404 com axe nos dois temas (executa na CI)"
    requirement: VIS-03
    verification:
      - kind: other
        ref: "pnpm --filter @blog/web exec playwright test --list e2e/erros.spec.ts (Total: 1 test in 1 file)"
        status: pass
    human_judgment: true
    rationale: "O E2E só roda na CI (o Chromium não abre neste WSL); a execução real e o axe nos dois temas dependem do 02-09. A aparência do erro global no navegador também não foi vista."

duration: 12min
completed: 2026-11-28
status: complete
---

# Phase 02 Plan 13: Erro global com a identidade do clã e cenários das telas de erro Summary

**`global-error.tsx` agora traz o próprio documento (globals.css, tema escuro, fontes do clã, script de tema) com o mesmo card da 404 e sem nenhum detalhe técnico, e as duas telas de erro têm BDD e E2E da 404 com axe nos dois temas.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-11-28T12:04:00Z
- **Completed:** 2026-11-28T12:16:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Erro global reescrito: `<html lang="pt-BR" data-theme="dark">` com as variáveis das fontes, `<title>` do React ("Algo deu errado | Blog No Law"), `<script>{THEME_INIT_SCRIPT}</script>` como texto filho e o card central da 404 com `h1` Display (`text-balance`) e CTA primário para `/`.
- T-02-07 mitigada: nem `error.message`, nem `digest`, nem pilha são renderizados; teste com mensagem sentinela prova isso. A exceção continua indo para o Sentry (`captureException` no `useEffect`).
- BDD `docs/bdd/erros.feature.md` com os dois cenários e E2E `e2e/erros.spec.ts` da 404 (status 404, `h1`, axe nos dois temas via `comTema`, volta ao início).

## TDD

- **RED:** `app/global-error.test.tsx` (7 casos). O alvo "traz o próprio <html> em pt-BR com o tema escuro e as variáveis das fontes" falhou na asserção (a tela da Fase 1 era `<html lang="pt-BR">` sem tema nem fontes); outros 4 casos também falharam, e os de segredo e Sentry já passavam por herança da Fase 1. Evidência validada por `gsd_run check tdd-red-evidence` com `RED_EVIDENCE_OK` (formato `tap-flat`, asserções booleanas). Primeira tentativa foi `INVALID_RED (invalid_record)` por causa do formato das mensagens de `toBe`/`toMatch` com aspas escapadas; reescrever como `expect(cond).toBe(true)` resolveu.
- **GREEN:** `global-error.tsx` reescrito; 7/7 passam.
- **REFACTOR:** nenhum.

## Task Commits

1. **Task 1 (tracer): erro global com identidade** - `ca2edea` (test, RED), `930e037` (feat, GREEN)
2. **Task 2: BDD e E2E das telas de erro** - `1d488c2` (test)

Tracer re-verificado ponta a ponta (build, lint, typecheck, `check:raw-html` = `RAW_HTML_OK`) antes de expandir.

## Files Created/Modified

- `apps/web/app/global-error.tsx` - documento próprio com estilos, fontes, tema e card central
- `apps/web/app/global-error.test.tsx` - 7 testes (documento, título, script, h1, CTA, sem vazamento, Sentry)
- `docs/bdd/erros.feature.md` - cenários 404 (`@unit` `@e2e`) e erro global (`@unit`)
- `apps/web/e2e/erros.spec.ts` - E2E da 404 nos dois temas

## Decisions Made

- O cenário do erro global fica só em `@unit`: não há como provocar uma exceção fora do layout raiz num `next start`.
- `<main>` do erro global usa `mx-auto max-w-288 px-4 py-12 md:px-8`, igual ao container do header/footer, para o card não sair do container (o layout raiz não o envolve).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- O build mostra o aviso "Failed to find font override values for font `Atkinson Hyperlegible Next`" (fallback de fonte não gerado). Vem do 02-11, não deste plano, e não quebra o build; fica registrado para o plano que revisar fontes.
- O Chromium do Playwright não abre neste WSL: o E2E foi validado só com `playwright test --list`. A execução real fica para a CI (02-09).

## User Setup Required

None - no external service configuration required.

## Threat Flags

Nenhuma superfície nova além do registro T-02-07 (mitigada).

## Known Stubs

Nenhum.

## Next Phase Readiness

- Telas de erro prontas; o 02-09 (CI) executa `erros.spec.ts` e deve incluí-lo no E2E.

## Self-Check: PASSED

- Arquivos: `apps/web/app/global-error.tsx`, `apps/web/app/global-error.test.tsx`, `docs/bdd/erros.feature.md`, `apps/web/e2e/erros.spec.ts` presentes.
- Commits `ca2edea`, `930e037`, `1d488c2` presentes na branch; `test(02-13)` precede `feat(02-13)`.
- Verificação final: `pnpm --filter @blog/web test` (237 passam), `lint`, `typecheck`, `build`, `check:raw-html` (`RAW_HTML_OK`) e `format:check` verdes.

---
*Phase: 02-identidade-visual-no-law*
*Completed: 2026-11-28*
