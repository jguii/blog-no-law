---
phase: 02-identidade-visual-no-law
plan: 01
subsystem: ui
tags: [nextjs, tailwind-4, theme, data-theme, localstorage, svg, vitest, tdd]

requires:
  - phase: 01-esqueleto-no-ar-com-testes-e-ci
    provides: "apps/web com Next 16, Vitest (projetos unit/int), gate check:raw-html, smoke-local.sh"
provides:
  - "Tema escuro 'tinta' padrão emitido pelo servidor e script anti-flash como texto filho de <script>"
  - "lib/theme.ts: THEME_KEY, THEMES, Theme, DEFAULT_THEME, resolveTheme, THEME_INIT_SCRIPT"
  - "ThemeToggle (botão yin-yang dos dragões) e DragonMark (arte pequena e grande)"
  - "Tailwind 4 CSS-first com variantes dark/light por data-theme e tokens base de fundo, texto e borda"
  - "Alias @/*, allowImportingTsExtensions, types/next.d.ts versionado e Vitest unit cobrindo .tsx"
  - "Pacotes da D-23 instalados com versão exata"
affects: [02-03, 02-08, 02-10, 02-11]

actuals:
  tokens: 24000
  tasks: 2
  commits: 4
plan_head_before: 27d761110c052feb5931e55a535d0700781eaec7
plan_head_after: 114753401adf5a7915d292284dadb4a68f7ff782

tech-stack:
  added:
    - "class-variance-authority 0.7.1"
    - "clsx 2.1.1"
    - "tailwind-merge 3.7.0"
    - "tailwindcss 4.3.5 (dev)"
    - "@tailwindcss/postcss 4.3.5 (dev)"
    - "shadcn 4.23.0 (dev, só o pacote; o init não rodou)"
    - "sharp 0.35.5 (dev)"
  patterns:
    - "Tema por atributo data-theme no <html>, nunca por prefers-color-scheme"
    - "Script anti-flash constante como texto filho de <script>, sem a prop de HTML bruto"
    - "Estado visual do ícone do tema por CSS (variante light:), sem estado React"
    - "Esqueleto de módulo no commit RED para a falha cair na asserção e não na carga do módulo"

key-files:
  created:
    - apps/web/lib/theme.ts
    - apps/web/lib/theme.test.ts
    - apps/web/app/globals.css
    - apps/web/postcss.config.mjs
    - apps/web/types/next.d.ts
    - apps/web/components/theme-toggle.tsx
    - apps/web/components/theme-toggle.test.tsx
    - apps/web/components/dragon-mark.tsx
  modified:
    - apps/web/package.json
    - pnpm-lock.yaml
    - apps/web/tsconfig.json
    - apps/web/vitest.config.ts
    - apps/web/app/layout.tsx

key-decisions:
  - "A preferência de tema fica só no localStorage (chave nl-theme), sem cookie e sem envio ao servidor"
  - "resolveTheme e o script comparam por igualdade exata com 'light'; qualquer outro valor vira 'dark' e o valor lido nunca vai ao DOM"
  - "O ícone do botão de tema gira por CSS (light:rotate-180); só o rótulo acessível depende do estado React"
  - "O DragonMark emite aria-hidden como primeiro atributo do <svg> (contrato do teste e do grep do build)"

patterns-established:
  - "Componentes interativos pequenos usam useSyncExternalStore sobre o atributo do <html> com snapshot de servidor fixo"
  - "Cores literais da marca (#000000, #ac020f, #c8a04a) só em dragon-mark.tsx, porque são arte e não tokens"

requirements-completed: [UX-02, VIS-04]

coverage:
  - id: D1
    description: "Servidor emite o tema escuro 'tinta' (data-theme=dark, fundo #000000, texto #d3aa82) em toda página estática, sem ler cookies nem cabeçalhos"
    requirement: UX-02
    verification:
      - kind: integration
        ref: "pnpm --filter @blog/web build + grep em .next/server/app/_not-found.html (html lang pt-BR data-theme=dark, script nl-theme, CSS com ecdcc4)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Script anti-flash aplica 'light' só por igualdade exata e cai em 'dark' para valor inválido ou storage que lança"
    requirement: UX-02
    verification:
      - kind: unit
        ref: "apps/web/lib/theme.test.ts#THEME_INIT_SCRIPT e resolveTheme"
        status: pass
    human_judgment: false
  - id: D3
    description: "Botão de tema com os dragões, rótulo acessível correto, troca e persistência do tema, ícone por CSS"
    requirement: UX-02
    verification:
      - kind: unit
        ref: "apps/web/components/theme-toggle.test.tsx#ThemeToggle e DragonMark"
        status: pass
    human_judgment: true
    rationale: "O clique real no navegador (troca visível, persistência após recarregar, ausência de piscada) não foi exercitado: o Playwright não abre o Chromium neste WSL. O E2E do 02-10 rodado na CI pelo 02-09 cobre."
  - id: D4
    description: "VIS-04: o registro da direção visual é ancestral do primeiro commit da primeira tela"
    requirement: VIS-04
    verification:
      - kind: other
        ref: "git merge-base --is-ancestor f7307ae ddddc12 (VIS04_ORDER_OK)"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-11-27
status: complete
---

# Phase 2 Plan 01: Tracer do tema e botão dos dragões Summary

**Tema escuro "tinta" servido do HTML estático com script anti-flash como texto filho, tokens Tailwind 4 por `data-theme` e o botão yin-yang dos dragões que alterna e persiste o tema em `localStorage`.**

## Performance

- **Duration:** 12 min
- **Tasks:** 2 (cada uma com RED e GREEN)
- **Files modified:** 13 (8 criados, 5 alterados)

## Accomplishments

- O layout raiz emite `<html lang="pt-BR" data-theme="dark">` com o script anti-flash no `<head>`; a `_not-found` sai pré-renderizada com tema, script e botão, e a home de status da Fase 1 continua verde (`SMOKE_LOCAL_DEGRADED_OK`).
- `lib/theme.ts` aplica allowlist por igualdade exata (ameaça T-02-01) e o script é constante, sem `<` (T-02-02); 18 casos de teste sob `node:vm`, inclusive storage que lança e valor `"><x>`.
- Tailwind 4 CSS-first (`@custom-variant dark/light`, `@theme inline`, tokens base dos dois temas); `ThemeToggle` e `DragonMark` (arte pequena e grande com `useId`) prontos para o 02-10 e o 02-11.
- Infra para os demais planos: alias `@/*`, `allowImportingTsExtensions`, `types/next.d.ts` (o typecheck da CI passa sem `next-env.d.ts`), Vitest `unit` cobrindo `.tsx` em `lib`, `components` e `app`.

## Task Commits

1. **Task 1 (tracer): tema escuro sem flash**
   - RED `3988c55` (test) — testes do script e do `resolveTheme` mais esqueleto de `lib/theme.ts`
   - GREEN `ddddc12` (feat) — pacotes D-23, config, `theme.ts`, `globals.css`, `layout.tsx`
2. **Task 2: botão yin-yang dos dragões**
   - RED `92f0e64` (test) — config do Vitest, testes de `DragonMark` e `ThemeToggle`, esqueletos
   - GREEN `1147534` (feat) — arte SVG, botão com `useSyncExternalStore`, botão no header do layout

**Plan metadata:** commit `docs(02-01)` seguinte a este arquivo.

## TDD Gate Compliance

- **RED (tarefa 1):** alvo `devolve light só para a string exata light` (`apps/web/lib/theme.test.ts`); `gsd check tdd-red-evidence` devolveu `RED_EVIDENCE_OK` (`target_test_failed`, 6 testes falhando por asserção). `semanticAssessment`: o alvo executou e falhou na asserção planejada (`expected 'dark' to be 'light'`), pelo motivo certo (esqueleto sem comportamento), sem erro de carga, sintaxe ou fixture.
- **RED (tarefa 2):** alvo `no HTML do servidor (tema escuro) oferece mudar para o claro` (`apps/web/components/theme-toggle.test.tsx`); `RED_EVIDENCE_OK`, 8 testes falhando por asserção (`expected '<button></button>' to contain 'aria-label="Mudar para tema claro"'`). `semanticAssessment`: falha na asserção planejada, pelo motivo certo.
- **GREEN:** `ddddc12` e `1147534` vieram depois dos respectivos `test(02-01)`; suíte `unit` com 41 testes verdes.
- **REFACTOR:** nenhum (sem mudança necessária).
- Os dois REDs precisaram de um esqueleto do módulo no commit `test(...)`: a primeira execução com módulo ausente era `fixture_or_load_failure` (INVALID_RED). Ver deviation 1.

## Files Created/Modified

- `apps/web/lib/theme.ts` - chave, temas, `resolveTheme` e o script anti-flash constante
- `apps/web/lib/theme.test.ts` - testes de `resolveTheme` e do script sob `node:vm`
- `apps/web/app/globals.css` - Tailwind 4, variantes por `data-theme` e tokens base
- `apps/web/app/layout.tsx` - tema escuro, script no `<head>`, `<header className="faixa">` com o botão
- `apps/web/components/theme-toggle.tsx` - botão de tema (client) com os dragões
- `apps/web/components/theme-toggle.test.tsx` - testes do botão e da arte
- `apps/web/components/dragon-mark.tsx` - arte SVG pequena e grande
- `apps/web/postcss.config.mjs` - plugin do Tailwind 4
- `apps/web/types/next.d.ts` - referências de tipo do Next para o typecheck sem build
- `apps/web/tsconfig.json` - `paths` `@/*` e `allowImportingTsExtensions`
- `apps/web/vitest.config.ts` - projeto `unit` com `.tsx` em `lib`, `components`, `app`
- `apps/web/package.json`, `pnpm-lock.yaml` - pacotes da D-23 com versão exata

## Decisions Made

- Preferência de tema só em `localStorage` (`nl-theme`), sem cookie, para não identificar o visitante.
- O estado visual do ícone (180° no claro, +180° no hover) é CSS puro; a ordem gerada no CSS do build foi conferida (`group-hover:rotate-180`, `light:rotate-180`, `light:group-hover:rotate-360`), então o claro em hover vai a 360°.
- `DragonMark` usa os mesmos olhos (`rx 4.5`, `ry 2.6`) nas duas artes e o bigode com a cor do corpo do dragão, como no esboço 002.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Esqueleto do módulo no commit RED**
- **Found during:** Task 1 e Task 2 (RED)
- **Issue:** com o módulo inexistente, o runner falha na carga (`Cannot find module`); o classificador `tdd-red-evidence` trata isso como INVALID_RED (`fixture_or_load_failure`) e o gate não autoriza GREEN.
- **Fix:** o commit `test(02-01)` inclui um esqueleto do módulo (`theme.ts`, `dragon-mark.tsx`, `theme-toggle.tsx`) com os exports sem comportamento, para o alvo falhar numa asserção. O GREEN o substitui.
- **Files modified:** `apps/web/lib/theme.ts`, `apps/web/components/dragon-mark.tsx`, `apps/web/components/theme-toggle.tsx`
- **Verification:** `RED_EVIDENCE_OK` nos dois ciclos.
- **Committed in:** `3988c55`, `92f0e64`

**2. [Rule 1 - Bug] Ordem dos atributos do `<svg>` do DragonMark**
- **Found during:** Task 2 (GREEN)
- **Issue:** a primeira versão emitia `viewBox` antes de `aria-hidden`; o contrato do teste e o grep do build (`<svg aria-hidden="true"`) exigem `aria-hidden` primeiro.
- **Fix:** `aria-hidden` e `focusable` passaram a ser os primeiros atributos do `<svg>`.
- **Files modified:** `apps/web/components/dragon-mark.tsx`
- **Verification:** `pnpm --filter @blog/web test` (41 verdes) e grep no `_not-found.html`.
- **Committed in:** `1147534`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** nenhuma mudança de escopo; a primeira só torna o RED válido para o gate de TDD.

## Issues Encountered

- O sandbox recusa substituição de comando com `git` e a escrita no diretório git do worktree; por isso o ledger `gsd-plan-head-before-02-01` e o sentinela de cwd não foram gravados. A base do plano é o HEAD verificado no início (`27d7611`) e `commits` abaixo foi medido contra ela.
- Os testes `-- lib/theme.test.ts` não filtram arquivo (o `--` repassa o argumento ao script, que roda a suíte `unit` inteira); a suíte passou por completo, então o alvo está coberto.
- O HTML do build coloca as `<meta>` e o `<link>` de CSS gerados pelo Next antes do script de tema no `<head>`; o script segue anterior ao `<body>` e à primeira pintura. No JSX do layout ele é o primeiro filho do `<head>`, como o plano pede.
- A etapa `pnpm add` não emitiu aviso de script de build ignorado; `pnpm-workspace.yaml` não mudou.

## Known Stubs

Nenhum. O `<header className="faixa">` do layout ainda não tem estilo (a classe `faixa` vem do 02-10) e o 02-11 troca o header pelo `SiteHeader`; isso é sequência planejada, não stub de dados.

## Threat Flags

Nenhum. Não há endpoint, caminho de autenticação nem acesso a arquivo novo; o único limite de confiança (valor de `localStorage` para o atributo do `<html>`) é o T-02-01, mitigado e testado.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- O 02-10 completa os tokens e a faixa em `globals.css` e escreve o E2E do tema (a prova no navegador da troca, da persistência e da ausência de flash); o 02-11 completa `layout.tsx` (marca, rodapé, fontes, metadados). Depois deles nenhum outro plano edita esses dois arquivos.
- A prova de clique no navegador real fica para a CI (02-09): o Playwright não abre o Chromium neste WSL.

## Self-Check: PASSED

- Arquivos criados conferidos no disco: `lib/theme.ts`, `lib/theme.test.ts`, `app/globals.css`, `postcss.config.mjs`, `types/next.d.ts`, `components/theme-toggle.tsx`, `components/theme-toggle.test.tsx`, `components/dragon-mark.tsx`.
- Commits conferidos: `3988c55`, `ddddc12`, `92f0e64`, `1147534` (todos ancestrais do HEAD).
- Verificações finais: `pnpm --filter @blog/web test` (41 testes), `build`, `lint`, `typecheck` (com e sem `next-env.d.ts`), `check:raw-html` (`RAW_HTML_OK`), `format:check`, `smoke-local.sh --degraded` (`SMOKE_LOCAL_DEGRADED_OK`) e `VIS04_ORDER_OK`.

---
*Phase: 02-identidade-visual-no-law*
*Completed: 2026-11-27*
