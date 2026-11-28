---
phase: 02-identidade-visual-no-law
plan: 06
subsystem: ui
tags: [nextjs, rsc, tailwind, vitest, playwright, bdd, a11y]

requires:
  - phase: 02-identidade-visual-no-law
    provides: "lib/conteudo.ts (02-02), Card/cn (02-03), header e menu (02-05), globals.css e e2e/helpers (02-10), BrushStroke e rodapé (02-11)"
provides:
  - "ReadingPage: card de leitura do clã (article + faixa de gradiente + h1 Display + traço de pincel + Prose)"
  - "Prose: tipografia de texto longo sem @tailwindcss/typography"
  - "Rotas estáticas /sobre, /regras e /privacidade"
  - "Cenários BDD e E2E das páginas institucionais (axe nos dois temas, 320px)"
affects: [fase-04-posts, 02-09-ci-e2e]

actuals:
  tokens: 9000
  tasks: 3
  commits: 5

plan_head_before: 311c351afa6a37642656cab6b3c0133e8905581b
plan_head_after: c7a331943b4798ed98a824d5fc6b367ec54eac83

tech-stack:
  added: []
  patterns:
    - "Páginas de leitura: ReadingPage + Prose, conteúdo só como filhos de texto do JSX"
    - "Teste de página com renderToStaticMarkup e vi.doMock de @/lib/conteudo para exercitar os ramos"

key-files:
  created:
    - apps/web/components/prose.tsx
    - apps/web/components/reading-page.tsx
    - apps/web/components/reading-page.test.tsx
    - apps/web/app/sobre/page.tsx
    - apps/web/app/sobre/page.test.tsx
    - apps/web/app/regras/page.tsx
    - apps/web/app/regras/page.test.tsx
    - apps/web/app/privacidade/page.tsx
    - apps/web/app/privacidade/page.test.tsx
    - docs/bdd/paginas-institucionais.feature.md
    - apps/web/e2e/paginas.spec.ts
  modified: []

key-decisions:
  - "O article fica por fora do Card (article max-w-190 > Card overflow-hidden), com a faixa bg-brand de 6px como primeiro filho do card"
  - "Spacing do Prose por seletores de filho: [&>*+*]:mt-4 entre blocos e [&_p+p]:mt-4 dentro de seções; h2 com mt-8/mb-2"
  - "Regras mostra os grupos (h2 + ol) quando REGRAS_PROVISORIAS é falso, que é o estado atual do conteúdo do 02-02"

patterns-established:
  - "ReadingPage é o layout de leitura reutilizável para os posts da Fase 4"

requirements-completed: [UX-03, UX-01]

duration: 22min
completed: 2026-11-28
status: complete

coverage:
  - id: D1
    description: "/sobre, /regras e /privacidade pré-renderizadas como HTML estático, com um h1 e título da aba 'X | Blog No Law'"
    requirement: UX-03
    verification:
      - kind: unit
        ref: "apps/web/app/sobre/page.test.tsx; apps/web/app/regras/page.test.tsx; apps/web/app/privacidade/page.test.tsx"
        status: pass
      - kind: other
        ref: "pnpm --filter @blog/web build (sobre.html, regras.html e privacidade.html existem e trazem o título)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Card de leitura (760px, faixa de gradiente, h1 Display, traço de pincel, sem nuvem/pétala) e coluna de texto de 664px com wrap-anywhere"
    requirement: UX-01
    verification:
      - kind: unit
        ref: "apps/web/components/reading-page.test.tsx"
        status: pass
    human_judgment: true
    rationale: "A aparência final do card (espaçamento, ritmo da página) e a ausência de rolagem horizontal em 320px só são medidas no E2E da CI (02-09); o Chromium não abre neste ambiente"
  - id: D3
    description: "Regras renderizam h2 + ol por grupo ou as frases provisórias; Privacidade tem dois h2, ul de três itens, sem LGPD nem cookie"
    requirement: UX-03
    verification:
      - kind: unit
        ref: "apps/web/app/regras/page.test.tsx; apps/web/app/privacidade/page.test.tsx"
        status: pass
    human_judgment: true
    rationale: "A redação final do texto é aprovada pelo autor (item manual do 02-09)"
  - id: D4
    description: "Cenários BDD e E2E (rodapé leva às páginas, axe WCAG 2.1 A/AA nos dois temas, card até 760px, sem rolagem horizontal em 320px)"
    requirement: UX-01
    verification:
      - kind: e2e
        ref: "playwright test --list e2e/paginas.spec.ts (8 testes em 1 arquivo: 4 cenários x 2 projetos); execução real na CI do 02-09"
        status: unknown
    human_judgment: true
    rationale: "Os E2E só rodam na CI (D-09) e o Chromium não abre neste WSL; aqui só foi verificado que o spec compila e lista os cenários"
---

# Phase 2 Plan 06: Páginas institucionais Summary

**Páginas estáticas Sobre o clã, Regras e Política de Privacidade no card de leitura da direção Síntese (ReadingPage + Prose sem @tailwindcss/typography), com testes de página, BDD e E2E com axe nos dois temas.**

## Performance

- **Duration:** 22 min
- **Started:** 2026-11-28T09:20:00Z
- **Completed:** 2026-11-28T09:30:00Z
- **Tasks:** 3
- **Files modified:** 11 (todos novos)

## Accomplishments

- `ReadingPage` e `Prose`: card centralizado de até 760px, faixa `bg-brand` de 6px no topo, `h1` no Display com o traço de pincel do título e corpo de até 664px com `overflow-wrap: anywhere`. Só o traço do título como ornamento (D-19).
- `/sobre`, `/regras` e `/privacidade` saem como `○ (Static)` no build, com título de aba, um único `h1` e texto puro de `lib/conteudo.ts` (T-02-14: nada de HTML a partir de string).
- Regras alterna entre frases provisórias e grupos (`h2` + `ol`) conforme `REGRAS_PROVISORIAS`; Privacidade tem dois `h2`, lista de três itens e nenhuma menção a LGPD/cookie.
- BDD (`docs/bdd/paginas-institucionais.feature.md`, 4 cenários) e `e2e/paginas.spec.ts` (8 testes listados: 4 cenários nos projetos `chromium` e `mobile`).

## RED/GREEN/REFACTOR

**Task 1 (tracer)**
- RED: `reading-page.test.tsx` e `sobre/page.test.tsx` (9 casos), com esqueletos vazios de `ReadingPage` e `SobrePage`. Falharam em asserção (`expected '' to contain '<article aria-labelledby="t"'`), 9/9 vermelhos; `check tdd-red-evidence` devolveu `RED_EVIDENCE_OK`. Avaliação semântica: o alvo rodou e falhou na asserção planejada, pois o esqueleto não rendeu markup.
- GREEN: `Prose`, `ReadingPage` e `SobrePage` reais; testes verdes, build estático conferido (`sobre.html` com título, texto e `data-theme="dark"`).
- Portão do tracer: `<verify>` automatizado reexecutado de ponta a ponta e verde, `⚡ Tracer verified end-to-end, expanding`.

**Task 2**
- RED: `regras/page.test.tsx` (6 casos, com `vi.doMock` do conteúdo) e `privacidade/page.test.tsx` (6 casos), esqueletos vazios. 11 de 12 vermelhos em asserção; o negativo (sem LGPD/cookie) passa trivialmente sobre HTML vazio e só ganha força depois do GREEN. Alvo classificado: "cada grupo vira um h2 com uma ol de regras", `RED_EVIDENCE_OK`.
- GREEN: `RegrasPage` e `PrivacidadePage` reais; suíte do web 296/296.
- REFACTOR: nenhum.

**Task 3** não é TDD (BDD + E2E, `type="auto"` sem `tdd`).

## Task Commits

1. **Task 1 RED** - `9b779df` (test)
2. **Task 1 GREEN** - `7553855` (feat)
3. **Task 2 RED** - `1a48d70` (test)
4. **Task 2 GREEN** - `2b14240` (feat)
5. **Task 3** - `c7a3319` (test)

**Plan metadata:** commit docs deste SUMMARY, logo após.

## Decisions Made

- `article` por fora do `Card` (e não o próprio `Card` como `article`), porque o `Card` do 02-03 é um `div`; a faixa de gradiente é o primeiro filho do card e o `overflow-hidden` do card acompanha o raio das bordas.
- Espaçamento do `Prose` só por seletores de filho (`[&>*+*]:mt-4`, `[&_p+p]:mt-4`), sem `@tailwindcss/typography` (D-23).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Texto provisório de /sobre mudou no 02-02**
- **Found during:** Task 1 (verify do build)
- **Issue:** o `<verify>` do plano procura "A história completa chega em breve." em `sobre.html`, mas o 02-02 substituiu o provisório da D-12 pelas duas frases do próprio autor.
- **Fix:** conferi o HTML com a frase real ("Em nossa jornada tivemos…"); os testes usam `SOBRE.paragrafos` e não dependem do texto.
- **Files modified:** nenhum (só a checagem)
- **Verification:** `sobre.html` contém título, frases de `SOBRE` e `data-theme="dark"`.

**2. [Rule 1 - Bug] Contagem de `<li` casava com `<linearGradient`**
- **Found during:** Task 2 (GREEN)
- **Issue:** `html.match(/<li/g)` contou o `<linearGradient>` do traço de pincel (5 em vez de 4; 4 em vez de 3).
- **Fix:** regex `/<li[ >]/g` nos dois testes de página.
- **Files modified:** `apps/web/app/regras/page.test.tsx`, `apps/web/app/privacidade/page.test.tsx`
- **Committed in:** `2b14240`

**3. [Rule 3 - Blocking] Tipo do `context` no E2E**
- **Found during:** Task 3 (typecheck)
- **Issue:** `Page['context']` é um método, não o tipo `BrowserContext`.
- **Fix:** `import type { BrowserContext }`.
- **Committed in:** `c7a3319`

### Observações de método

- O teste de Regras "com REGRAS_PROVISORIAS verdadeiro não tem `<ol`" do plano só faz sentido com o conteúdo simulado (hoje `REGRAS_PROVISORIAS` é falso); coberto com `vi.doMock` de `@/lib/conteudo`.
- O registro do ledger `gsd-plan-head-before` não pôde ser escrito (o sandbox recusa comandos compostos e escrita em `.git/worktrees`); a base foi `311c351afa6a37642656cab6b3c0133e8905581b`.

---

**Total deviations:** 3 auto-fixed (2 bug, 1 blocking). **Impact:** sem mudança de escopo.

## Issues Encountered

Nenhum arquivo rastreado foi apagado ou renomeado. O Chromium do Playwright não abre neste WSL, então os E2E só foram listados (`Total: 8 tests in 1 file`); a execução real fica para a CI (02-09).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `ReadingPage` e `Prose` prontos para os posts da Fase 4.
- Pendente na CI (02-09): rodar `e2e/paginas.spec.ts` (axe nos dois temas, 760px, 320px) e a revisão manual do texto das Regras/Privacidade pelo autor.

## Self-Check: PASSED

- Arquivos criados existem (11 de 11) e os commits `9b779df`, `7553855`, `1a48d70`, `2b14240`, `c7a3319` estão no branch.
- `pnpm --filter @blog/web test` (296 testes), `lint`, `typecheck`, `check:raw-html` (RAW_HTML_OK) e `format:check` verdes; `next build` gera `/sobre`, `/regras` e `/privacidade` como estáticas.

---
*Phase: 02-identidade-visual-no-law*
*Completed: 2026-11-28*
