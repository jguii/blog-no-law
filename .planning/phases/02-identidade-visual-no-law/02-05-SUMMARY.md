---
phase: 02-identidade-visual-no-law
plan: 05
subsystem: ui
tags: [nextjs, react, tailwind, navigation, a11y, playwright, disclosure]

requires:
  - phase: 02-identidade-visual-no-law
    provides: "02-03 cn, 02-10 tokens + e2e/helpers.ts, 02-11 header/footer da faixa de tinta"
provides:
  - "NAV_ITEMS e navItemClassName em lib/nav.ts (módulo comum, sem 'use client')"
  - "NavLinks (client) com aria-current via usePathname"
  - "MobileMenu (disclosure, panelId padrão menu-principal), MenuIcon e CloseIcon"
  - "Header com a navegação Principal em pílulas (>= 768px) e o ☰ no celular"
  - "Projetos Playwright chromium e mobile (Pixel 7) com reducedMotion reduce"
  - "docs/bdd/navegacao.feature.md e e2e/navegacao.spec.ts (6 cenários)"
affects: [02-06, 02-08, 02-09, 02-14]

actuals:
  tokens: 7600
  tasks: 3
  commits: 5
plan_head_before: ebc443b88dc6146740824f761fe30c26b8f95d80
plan_head_after: b003e1c48984304be3d9d3bdf4585003870859cb

tech-stack:
  added: []
  patterns:
    - "Disclosure não modal: botão com aria-expanded/aria-controls + painel com atributo hidden, sem Sheet"
    - "Utilitário de classes compartilhado em módulo comum (lib/nav.ts) para server e client components"
    - "Camada própria da nuvem (-z-10, overflow-clip) dentro do contexto de empilhamento do header (z-20)"

key-files:
  created:
    - apps/web/lib/nav.ts
    - apps/web/components/nav-links.tsx
    - apps/web/components/mobile-menu.tsx
    - apps/web/components/mobile-menu.test.tsx
    - apps/web/components/icons.tsx
    - apps/web/components/site-header.test.tsx
    - docs/bdd/navegacao.feature.md
    - apps/web/e2e/navegacao.spec.ts
  modified:
    - apps/web/components/site-header.tsx
    - apps/web/app/layout.test.tsx
    - apps/web/playwright.config.ts

key-decisions:
  - "O painel do ☰ ancora no <header> (relative z-20), então nenhum ancestral entre os dois é posicionado"
  - "A nuvem saiu do clip do header inteiro e ganhou camada própria com overflow-clip, para o painel poder sair por baixo da faixa"
  - "max-height do painel = 100dvh - 4.375rem (8+44+8 de padding/linha + 10px do traço de pincel), sem medir por JS"
  - "Itens do painel também em rounded-full, para a 'mesma pílula' do item ativo (UI-SPEC)"

patterns-established:
  - "NavLinks/MobileMenu consumidos por variant ('pill' | 'panel') e navItemClassName reaproveitável pelo /kit (02-08)"
  - "E2E por projeto: fixture isMobile pula o que não vale (pílulas só no desktop, ☰ só no celular)"

requirements-completed: [UX-01, VIS-03]

coverage:
  - id: D1
    description: "Menu do header com Início, Sobre o clã e Regras, aria-current só na página atual, sem itens inexistentes"
    requirement: UX-01
    verification:
      - kind: unit
        ref: "apps/web/components/site-header.test.tsx#SiteHeader: navegação principal (D-08)"
        status: pass
      - kind: unit
        ref: "apps/web/app/layout.test.tsx#RootLayout: header com a marca"
        status: pass
    human_judgment: false
  - id: D2
    description: "Menu sanduíche em disclosure, fechado no HTML do servidor, com aria-expanded/aria-controls, panelId configurável e ☰ depois do tema"
    requirement: UX-01
    verification:
      - kind: unit
        ref: "apps/web/components/mobile-menu.test.tsx#MobileMenu: HTML do servidor (D-10)"
        status: pass
      - kind: integration
        ref: "pnpm --filter @blog/web build + grep de aria-controls/aria-expanded em .next/server/app/_not-found.html"
        status: pass
    human_judgment: false
  - id: D3
    description: "Comportamento interativo do painel (Esc devolve o foco ao ☰, clique fecha, alargar a janela fecha, Tab em ordem, axe com painel aberto) e projeto mobile do Playwright"
    requirement: UX-01
    verification:
      - kind: e2e
        ref: "playwright test --list --project=mobile e2e/navegacao.spec.ts (6 testes listados; execução real na CI via 02-09)"
        status: unknown
    human_judgment: true
    rationale: "O Chromium do Playwright não abre neste WSL (faltam bibliotecas do sistema): o E2E compila e é listado, mas só roda na CI. O encaixe visual do painel sob a faixa também precisa de olho humano."

duration: 25min
completed: 2026-11-28
status: complete
---

# Phase 02 Plan 05: Navegação do header e menu sanduíche Summary

**Navegação do header em pílulas com a página atual marcada (aria-current) a partir de 768px e menu sanduíche em disclosure não modal no celular (Esc devolve o foco ao ☰), mais o projeto `mobile` (Pixel 7) do Playwright com movimento reduzido e seis cenários BDD/E2E de navegação.**

## Performance

- **Duração:** 25 min
- **Início:** 2026-11-28T12:05:00Z (aprox.)
- **Término:** 2026-11-28T12:30:00Z (aprox.)
- **Tarefas:** 3 (1 tracer, 1 TDD auto, 1 auto)
- **Arquivos:** 11 (8 novos, 3 alterados)

## Accomplishments

- `lib/nav.ts` (sem `'use client'`) com `NAV_ITEMS` (Início, Sobre o clã, Regras) e `navItemClassName({ variant, active })`; o `/kit` do 02-08 pode chamá-lo de um server component.
- `NavLinks` (client, `usePathname`) marca `aria-current="page"` só quando o caminho é exatamente o destino: `/status` e `/kit` não marcam nada. Pílula ativa `bg-primary` + texto branco + anel interno `inset-ring-2 inset-ring-link` (#ff6b75).
- `MobileMenu`: botão 44x44 (`size-11`) com `aria-expanded`, `aria-controls` e rótulo "Abrir menu"/"Fechar menu"; painel `hidden` no HTML do servidor, sob a faixa, `overflow-y-auto` com `max-h-[calc(100dvh-4.375rem)]`; Esc fecha e devolve o foco, clique em link fecha, `matchMedia('(min-width: 768px)')` fecha ao alargar; sem trava de foco nem de rolagem.
- `MenuIcon`/`CloseIcon` em SVG inline (`aria-hidden`, `currentColor`), sem biblioteca de ícones.
- Playwright: projeto `mobile` (Pixel 7) ao lado do `chromium` e `reducedMotion: 'reduce'`; `docs/bdd/navegacao.feature.md` e `e2e/navegacao.spec.ts` com um `test('@e2e ...')` por cenário (6 listados no projeto `mobile`).

## TDD (RED, GREEN, REFACTOR)

**Task 1 (tracer)**
- **RED:** `components/site-header.test.tsx` (10 casos, 4 falhando) contra o header do 02-11 sem navegação. Evidência validada por `gsd tdd-red-evidence`: `RED_EVIDENCE_OK` (`target_test_failed`), alvo "tem a navegação "Principal" com Início, Sobre o clã e Regras". `semanticAssessment`: o alvo executou e falhou na asserção planejada (header sem `aria-label="Principal"`), sem erro de import nem de fixture. Commit `ad43181`.
- **GREEN:** `lib/nav.ts`, `nav-links.tsx`, `site-header.tsx` e o mock de `next/navigation` em `layout.test.tsx`; 32 testes verdes e build ok. Commit `e6290e2`.
- **REFACTOR:** não houve.
- **Tracer feedback gate:** `<verify>` automatizado (testes + build + grep do HTML pré-renderizado) reexecutado e verde; seguiu para a expansão (sem `<human-check>`, modo `end-of-phase`).

**Task 2**
- **RED:** `mobile-menu.test.tsx` (7 casos, 6 falhando) e o caso da ordem tema/☰ em `site-header.test.tsx`, com esqueletos mínimos de `mobile-menu.tsx` e `icons.tsx` para o RED falhar na asserção (não por módulo ausente). `RED_EVIDENCE_OK`, alvo "tem o botão ☰ fechado, ligado ao painel "menu-principal", com o rótulo "Abrir menu"". `semanticAssessment`: o alvo executou e falhou porque o esqueleto não tem botão nem painel. Commit `488fec8`.
- **GREEN:** `icons.tsx`, `mobile-menu.tsx` e o `MobileMenu` no header; 249 testes verdes. Commit `5b31016`.
- **REFACTOR:** não houve.

**Task 3** não é TDD (config, BDD, E2E); o spec é validado por `playwright test --list`.

## Task Commits

1. **Task 1 RED:** `ad43181` (test)
2. **Task 1 GREEN:** `e6290e2` (feat)
3. **Task 2 RED:** `488fec8` (test)
4. **Task 2 GREEN:** `5b31016` (feat)
5. **Task 3:** `b003e1c` (test)

**Plan metadata:** commit `docs(02-05)` com este SUMMARY (sexto commit; o `commits: 5` do frontmatter conta os cinco de código, medidos de `ebc443b..b003e1c`).

## Files Created/Modified

- `apps/web/lib/nav.ts` - `NAV_ITEMS`, `NavVariant` e `navItemClassName` (pílula e painel).
- `apps/web/components/nav-links.tsx` - `NavLinks` (client): lista de links com `aria-current` e `onNavigate`.
- `apps/web/components/mobile-menu.tsx` - `MobileMenu` (client): disclosure com Esc, foco de volta e fechamento ao alargar.
- `apps/web/components/icons.tsx` - `MenuIcon` e `CloseIcon`.
- `apps/web/components/site-header.tsx` - nav Principal, ☰ e camada própria da nuvem.
- `apps/web/components/site-header.test.tsx`, `mobile-menu.test.tsx`, `apps/web/app/layout.test.tsx` - testes de componente e do layout (mock de `usePathname`).
- `apps/web/playwright.config.ts` - projeto `mobile` e `reducedMotion`.
- `docs/bdd/navegacao.feature.md`, `apps/web/e2e/navegacao.spec.ts` - cenários de navegação.

## Decisions Made

- O painel do ☰ é `absolute inset-x-0 top-full` contra o `<header>`; para isso o header virou `relative z-20` (contexto de empilhamento que também põe o painel acima do conteúdo) e a linha e o container deixaram de ser `relative`.
- `max-height` do painel fixo em `calc(100dvh - 4.375rem)` (altura da faixa conhecida: 8+44+8 + 10px do traço) em vez de medir por JS.
- Itens do painel em `rounded-full`, para o item ativo ser "a mesma pílula" da UI-SPEC.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] O header do 02-11 cortava o painel do ☰**
- **Found during:** Task 1/2 (leitura de `site-header.tsx` antes de implementar o painel)
- **Issue:** `<header className="faixa relative overflow-y-clip">` recortaria o painel `absolute top-full`, e a linha `relative z-10` seria o ancestral posicionado mais próximo do painel, que ficaria preso à largura do container, não da faixa.
- **Fix:** a nuvem ganhou uma camada própria (`hidden lg:block absolute inset-0 -z-10 overflow-clip`, com um espelho do container `max-w-288` e a nuvem `-top-3 right-0 w-32`, o mesmo encaixe de antes); o header virou `faixa relative z-20` (sem `overflow-y-clip`) e a linha/container perderam o `relative`. A nuvem continua só em `lg`, cortada no topo e atrás do conteúdo; `lg:pr-36` mantido.
- **Files modified:** `apps/web/components/site-header.tsx`
- **Verification:** `layout.test.tsx` (ornamentos do header) e `site-header.test.tsx` verdes; HTML pré-renderizado conferido (painel sem ancestral posicionado).
- **Commit:** `e6290e2` (tarefa 1)

**2. [Rule 2 - Missing Critical] Caso de navegação no teste do layout**
- **Found during:** Task 1
- **Issue:** o plano só pedia o mock de `usePathname` no `layout.test.tsx`; sem uma asserção, o layout inteiro não provava a nav Principal.
- **Fix:** adicionado o caso "tem a navegação "Principal" com os três destinos da D-08".
- **Files modified:** `apps/web/app/layout.test.tsx`
- **Commit:** `e6290e2`

**3. [Plano] Proteção de cwd sem os arquivos de sentinela/ledger**
- A sandbox impediu escrever em `.git/worktrees/...` (sentinela do #3097 e ledger do #3968). A base do plano foi a registrada no HEAD de partida (`ebc443b`), verificada na checagem inicial; o toplevel foi conferido manualmente antes dos commits. Sem impacto no código.

---

**Total deviations:** 2 auto-fixed (1 bloqueio, 1 criticidade), 1 nota de processo.
**Impact on plan:** a mudança do header é necessária para o painel funcionar; nenhum escopo extra além dos arquivos do plano.

## Issues Encountered

- O Chromium do Playwright não abre neste WSL (bibliotecas do sistema ausentes): os E2E foram escritos e listados (`playwright test --list`, 6 testes no projeto `mobile`), mas só rodam na CI (02-09). O encaixe visual do painel sob a faixa e o espaçamento das pílulas até 768px não foram vistos num navegador.
- `next build` emite o aviso de fonte "Failed to find font override values for font Atkinson Hyperlegible Next" (já presente antes deste plano, do 02-11); o build conclui.

## Known Stubs

Nenhum. Os esqueletos do RED (`mobile-menu.tsx`, `icons.tsx`) foram substituídos no GREEN.

## Threat Flags

Nenhuma superfície nova além do `<threat_model>` do plano: só links internos por `next/link`, SVG escrito como JSX e painel que só alterna `hidden`/`aria-expanded` (T-02-29 mitigado; `react/no-danger` e `check:raw-html` verdes).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 02-06 (páginas `/sobre`, `/regras`, `/privacidade`): os destinos do menu e do rodapé passam a existir; até lá caem na 404 do clã.
- 02-08 (`/kit`): pode importar `NAV_ITEMS`/`navItemClassName` de `@/lib/nav` e usar `MobileMenu panelId="menu-kit"`.
- 02-09 (CI): rodar `playwright test` nos dois projetos; conferir ali os cenários de navegação e o encaixe visual do painel.

## Self-Check: PASSED

- Arquivos criados presentes: `lib/nav.ts`, `nav-links.tsx`, `mobile-menu.tsx`, `mobile-menu.test.tsx`, `icons.tsx`, `site-header.test.tsx`, `docs/bdd/navegacao.feature.md`, `e2e/navegacao.spec.ts` (verificados com `[ -f ]`).
- Commits `ad43181`, `e6290e2`, `488fec8`, `5b31016`, `b003e1c` presentes no histórico; o `test(02-05)` vem antes do `feat(02-05)` em cada tarefa TDD.
- Critérios de aceitação: `lib/nav.ts` sem `'use client'` (0 ocorrências); `usePathname` em `nav-links.tsx` (3); `aria-controls` (2) e `Escape` (1) em `mobile-menu.tsx`; `Pixel 7` (2) e `reducedMotion: 'reduce'` (1) no config; guard `style={{`/`w-screen`/`100vw` em `components`: 0 ocorrências; `docs/bdd/navegacao.feature.md` com Dado/Quando/Então em cada cenário e um `test('@e2e ...')` por cenário `@e2e`.
- Verificação geral: `pnpm --filter @blog/web test` (249 testes), `lint`, `typecheck`, `build`, `check:raw-html` e `format:check` verdes.

---
*Phase: 02-identidade-visual-no-law*
*Completed: 2026-11-28*
