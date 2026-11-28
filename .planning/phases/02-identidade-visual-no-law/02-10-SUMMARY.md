---
phase: 02-identidade-visual-no-law
plan: 10
subsystem: ui
tags: [tailwind, css, design-tokens, wcag, contrast, vitest, playwright, bdd]

requires:
  - phase: 02-identidade-visual-no-law
    provides: "02-01: globals.css base com Tailwind 4, variantes por data-theme, lib/theme.ts e o ThemeToggle"
provides:
  - "lib/tokens.ts: TOKENS (claro, escuro, faixa) e CONTRAST_PAIRS, fonte única dos hex"
  - "lib/contrast.ts: relativeLuminance, contrastRatio e parseThemeBlocks"
  - "app/globals.css completo: tokens em hex nos três escopos, utilitários de tipografia e de marca, foco, textura e movimento reduzido"
  - "e2e/helpers.ts: WCAG_TAGS, expectNoAxeViolations, TEMAS e comTema"
  - "docs/bdd/tema.feature.md e e2e/tema.spec.ts: cenários do tema (UX-02)"
affects: [02-03, 02-04, 02-05, 02-07, 02-08, 02-09, 02-11, 02-14]

commits: 5
plan_head_before: 49dd756172680987ac3fde66b49a3fba288e2239
plan_head_after: fcdae7ee5e25d98b6f1a72fd372b457bf1fb5080

actuals:
  tokens: 20000
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "Teste de contrato lê o CSS servido (app/globals.css) e compara com lib/tokens.ts"
    - "Faixa de tinta (.faixa) redefine as variáveis semânticas, então text-foreground e text-link dentro dela usam as cores da faixa nos dois temas"
    - "Textura de papel em body::before fixa, atrás do conteúdo, só no claro; body mantém fundo sólido"

key-files:
  created:
    - apps/web/lib/tokens.ts
    - apps/web/lib/contrast.ts
    - apps/web/lib/contrast.test.ts
    - apps/web/e2e/helpers.ts
    - apps/web/e2e/tema.spec.ts
    - docs/bdd/tema.feature.md
  modified:
    - apps/web/app/globals.css

key-decisions:
  - "O vermelho #ac020f só preenche; --link e --ring do escuro e da faixa são #ff6b75 (o vermelho dá 2,77:1 sobre preto)"
  - "h1 usa @apply text-display e h2 usa @apply text-heading por padrão no @layer base, para toda página herdar o Display e o Heading do contrato"
  - "Transição de cor de 250ms vale para * no @layer base; o bloco de movimento reduzido zera a duração com !important"
  - "--radius: 6px fica em :root com --radius-lg: var(--radius) no @theme inline (e não dentro do @theme inline)"

patterns-established:
  - "Comentário pt-BR no topo do globals.css: único CSS global, hex vindos de lib/tokens.ts e travados pelo teste"
  - "Asserções do teste de CSS devolvem booleano com mensagem de uma linha (helper has), para o relatório TAP nunca despejar o CSS inteiro"

requirements-completed: [VIS-01, UX-02]

coverage:
  - id: D1
    description: "Paleta do clã nos temas claro e escuro e na faixa, com todo par texto/fundo da UI-SPEC acima do mínimo WCAG AA"
    requirement: VIS-01
    verification:
      - kind: unit
        ref: "apps/web/lib/contrast.test.ts#pares de contraste WCAG AA"
        status: pass
      - kind: unit
        ref: "apps/web/lib/contrast.test.ts#tokens do escopo light|dark|faixa em globals.css"
        status: pass
    human_judgment: false
  - id: D2
    description: "O vermelho da marca nunca é texto, link, borda ou foco no escuro nem na faixa"
    requirement: VIS-01
    verification:
      - kind: unit
        ref: "apps/web/lib/contrast.test.ts#o vermelho da marca nunca é texto, link, borda nem foco no escuro e na faixa"
        status: pass
    human_judgment: false
  - id: D3
    description: "Utilitários de tipografia e de marca, foco, textura só no claro, movimento reduzido e nenhum url() externo no CSS global"
    requirement: VIS-01
    verification:
      - kind: unit
        ref: "apps/web/lib/contrast.test.ts#contrato do CSS global"
        status: pass
      - kind: automated_ui
        ref: "pnpm --filter @blog/web build + grep no CSS servido (text-display, prefers-reduced-motion, 420b0d, ff6b75, .faixa)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Aparência real dos utilitários (tamanho do Display, quebra de linha dos títulos, textura do pergaminho) nas telas"
    requirement: VIS-01
    verification: []
    human_judgment: true
    rationale: "Nenhuma tela usa os utilitários ainda; a conferência visual e o axe sobre texto em gradiente ou textura (que devolve incomplete) ficam para o 02-09"
  - id: D5
    description: "Comportamento do tema escrito em BDD e em E2E (primeira visita no escuro, troca que persiste, tema aplicado antes de hidratar, valor estranho cai no escuro, axe nos dois temas)"
    requirement: UX-02
    verification:
      - kind: e2e
        ref: "playwright test --list e2e/tema.spec.ts (5 testes @e2e listados; execução real na CI pelo 02-09)"
        status: unknown
    human_judgment: false

duration: 25min
completed: 2026-11-27
status: complete
---

# Phase 2 Plan 10: Tokens, contraste e tema Summary

**Paleta do clã nos temas claro e escuro e na faixa de tinta, com contraste AA provado por teste de contrato que lê o `globals.css`, mais utilitários de tipografia e marca, foco, textura do pergaminho, movimento reduzido e os cenários BDD/E2E do tema**

## Performance

- **Duration:** 25 min
- **Started:** 2026-11-27T22:50:00Z
- **Completed:** 2026-11-27T23:03:00Z
- **Tasks:** 3 (1 tracer, 1 TDD, 1 auto)
- **Files modified:** 7 (6 criados, 1 modificado)

## Accomplishments

- `lib/tokens.ts` fixa os hex dos três escopos (`light`, `dark`, `faixa`) e os 38 pares obrigatórios (`CONTRAST_PAIRS`). `lib/contrast.ts` calcula luminância e razão WCAG e extrai os blocos de tema do CSS.
- `app/globals.css` tem os tokens em hex, `@theme inline` com todas as cores, os quatro papéis de tipografia (`text-label`, `text-body`, `text-heading`, `text-display`), `bg-brand`, `bg-brand-button`, `shadow-folha`, `shadow-botao`, `--animate-brilho`, o anel de foco, a textura do pergaminho (só no claro, em `body::before`) e o bloco de `prefers-reduced-motion`.
- O teste de contrato (102 testes) falha se um hex divergir entre `tokens.ts` e o CSS, se qualquer par ficar abaixo do mínimo, se o vermelho `#ac020f` virar texto, link, borda ou foco no escuro ou na faixa, ou se o CSS ganhar `url()` de outro domínio (T-02-27).
- `docs/bdd/tema.feature.md` (5 cenários), `e2e/helpers.ts` e `e2e/tema.spec.ts` (5 testes `@e2e`, listados pelo Playwright; rodam na CI pelo 02-09).

## TDD Gate Compliance

Task 1 (tracer) e Task 2 seguiram RED, GREEN, sem REFACTOR (nada a limpar).

- **RED 1** (`95385ca`): o alvo `dá 9,84 para o dourado sobre o preto da faixa` falhou na asserção (`expected +0 to be 9.84`), com 80 dos 83 testes falhando. Classificador: `RED_EVIDENCE_OK` (`target_test_failed`). Avaliação semântica: o alvo executou e falhou pela razão planejada (o esqueleto de `contrastRatio` devolve 0); os testes de token e de par falharam porque `parseThemeBlocks` era esqueleto e o CSS não tinha os tokens.
- **GREEN 1** (`d9608bb`): `contrast.ts` real e `globals.css` com os três escopos.
- **RED 2** (`eb641e4`): o alvo `dá 52px ao text-display a partir de 768px e 36px abaixo` falhou (`text-display tem 36px` falso, 18 testes novos falhando; o de `url()` externo passa de propósito, é um contrato negativo). Classificador: `RED_EVIDENCE_OK`. Avaliação semântica: `@utility text-display` ainda não existia, então o bloco veio vazio.
- **GREEN 2** (`4bcedc6`): utilitários, marca, foco, textura e movimento reduzido.
- A Task 3 não é TDD (BDD e E2E que só rodam na CI), com commit `test(02-10)`.

## Task Commits

1. **Task 1 (tracer): paleta com contraste AA provado** - `95385ca` (test, RED), `d9608bb` (feat, GREEN)
2. **Task 2: tipografia, marca, foco, textura e movimento reduzido** - `eb641e4` (test, RED), `4bcedc6` (feat, GREEN)
3. **Task 3: cenários BDD/E2E do tema e helpers** - `fcdae7e` (test)

**Plan metadata:** commit `docs(02-10)` seguinte (este SUMMARY).

## Files Created/Modified

- `apps/web/lib/tokens.ts` - TOKENS e CONTRAST_PAIRS (fonte única dos hex; o `/kit` do 02-08 mostra esta tabela)
- `apps/web/lib/contrast.ts` - relativeLuminance, contrastRatio, parseThemeBlocks
- `apps/web/lib/contrast.test.ts` - contrato do CSS (tokens, pares, vermelho proibido, utilitários, foco, textura, sem recurso externo)
- `apps/web/app/globals.css` - CSS global completo (único arquivo de CSS global)
- `docs/bdd/tema.feature.md` - cenários do tema
- `apps/web/e2e/helpers.ts` - WCAG_TAGS, expectNoAxeViolations, TEMAS, comTema
- `apps/web/e2e/tema.spec.ts` - um `test('@e2e ...')` por cenário

## Decisions Made

- `--radius: 6px` fica em `:root` e `--radius-lg: var(--radius)` no `@theme inline`; o Tailwind só gera o que é usado, e `--radius` sozinho não é namespace de tema.
- `h1` e `h2` herdam `text-display` e `text-heading` no `@layer base`: toda página já nasce com o tamanho do contrato, e as classes explícitas dos planos paralelos continuam valendo (utilitário vence base).
- `bg-brand-button` carrega `background-color: var(--primary)` por baixo do gradiente, como plano sólido de reserva.
- A transição de cor de 250ms vale para todos os elementos no `@layer base`; `prefers-reduced-motion: reduce` zera a duração com `!important`, também nas animações (o brilho do emblema para no estado final).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Esqueleto e dados no commit RED da Task 1**
- **Found during:** Task 1 (RED)
- **Issue:** O RED precisa falhar numa asserção, e um módulo ausente (`./contrast`, `./tokens`) seria `INVALID_RED` (fixture_or_load_failure).
- **Fix:** O commit `test(02-10)` inclui `lib/tokens.ts` (dados esperados, já definitivos) e um `lib/contrast.ts` esqueleto que devolve 0; o GREEN troca só o `contrast.ts` e o `globals.css`.
- **Files modified:** apps/web/lib/tokens.ts, apps/web/lib/contrast.ts
- **Verification:** classificador `RED_EVIDENCE_OK`
- **Committed in:** 95385ca

**2. [Rule 1 - Bug] Relatório TAP do primeiro RED da Task 2 rejeitado como `invalid_record`**
- **Found during:** Task 2 (RED)
- **Issue:** `expect(css).toContain(...)` despejava o CSS inteiro (multilinha) na mensagem de falha e o banner do `pnpm --filter` entrava no relatório, então o classificador devolvia `Non-TAP data` e `Malformed TAP`.
- **Fix:** Asserções passaram a usar o helper `has()` (booleano com mensagem de uma linha) e o RED rodou com `pnpm --dir apps/web exec vitest ... --reporter=tap`, sem banner.
- **Files modified:** apps/web/lib/contrast.test.ts
- **Verification:** `RED_EVIDENCE_OK`
- **Committed in:** eb641e4

**3. [Pequeno ajuste de forma] `--radius` fora do `@theme inline`**
- O plano pede `--radius: 6px` no `@theme inline`; ele ficou em `:root` com o `--radius-lg` apontando para ele (ver Decisions Made). O valor e o efeito (`rounded-lg` = 6px) são os do plano.

---

**Total deviations:** 3 (1 bloqueio de RED, 1 teste, 1 ajuste de forma)
**Impact on plan:** nenhum escopo novo; todos os contratos do plano e os nomes de classe de `<interfaces>` foram mantidos.

## Issues Encountered

- O E2E do Playwright não roda neste WSL (Chromium sem libs do sistema); só `playwright test --list` foi conferido (5 testes). A execução real fica na CI pelo 02-09.
- `text-display` aparece no CSS servido porque o Tailwind varre `contrast.test.ts` (nenhuma tela usa a classe ainda). O `h1` do `@layer base` já emite 36px e 52px a partir de 768px.

## User Setup Required

None - no external service configuration required.

## Known Stubs

Nenhum. Os utilitários `text-label`, `bg-brand` etc. ainda não têm uso em telas (as telas vêm nos planos 02-03, 02-05, 02-07 e 02-11), mas isso é a ordem planejada, não um stub.

## Threat Flags

Nenhuma superfície nova. T-02-27 mitigado: o teste "não carrega recurso de outro domínio por url()" reprova qualquer `url()` com `http:`, `https:` ou `//` no `globals.css`.

## Next Phase Readiness

- Os planos paralelos (02-03, 02-04, 02-11) e os da onda seguinte podem usar as classes e variáveis fixadas em `<interfaces>`: `text-label|body|heading|display`, `font-display`, `font-sans`, `bg-brand`, `bg-brand-button`, `shadow-folha`, `shadow-botao`, `animate-brilho`, `text-link`, `bg-panel`, `bg-accent`, `bg-card`, o escopo `.faixa`, `--gold` e `--wood`. `--font-body` e `--font-title` ainda dependem do 02-11 (`next/font`).
- A partir deste plano, nenhum outro edita `app/globals.css`.
- Para o 02-09: o contraste de texto sobre gradiente ou textura não é avaliado pelo axe (`incomplete`) e precisa de conferência visual; o `home.spec.ts` continua com a sua cópia do helper do axe até o 02-07.

## Self-Check: PASSED

- Arquivos: `apps/web/lib/tokens.ts`, `apps/web/lib/contrast.ts`, `apps/web/lib/contrast.test.ts`, `apps/web/app/globals.css`, `apps/web/e2e/helpers.ts`, `apps/web/e2e/tema.spec.ts` e `docs/bdd/tema.feature.md` existem.
- Commits no ramo: `95385ca`, `d9608bb`, `eb641e4`, `4bcedc6`, `fcdae7e`; o `test(02-10)` vem antes do `feat(02-10)` nas duas tarefas TDD.
- `pnpm --filter @blog/web test` (167 testes), `lint`, `typecheck`, `build`, `check:raw-html` (`RAW_HTML_OK`) e `format:check` verdes; `playwright test --list e2e/tema.spec.ts` lista 5 testes em 1 arquivo; o CSS servido tem `420b0d`, `ff6b75`, `.faixa`, `text-display` e `prefers-reduced-motion`.

---
*Phase: 02-identidade-visual-no-law*
*Completed: 2026-11-27*
