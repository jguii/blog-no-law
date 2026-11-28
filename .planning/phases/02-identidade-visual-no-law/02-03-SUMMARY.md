---
phase: 02-identidade-visual-no-law
plan: 03
subsystem: ui
tags: [shadcn, tailwind-merge, cva, nextjs, not-found, vitest, tdd]

requires:
  - phase: 02-identidade-visual-no-law
    provides: "02-01: class-variance-authority, clsx e tailwind-merge instalados, alias @/*, Vitest unit para components/app, variantes dark/light e layout raiz com tema escuro"
provides:
  - "cn(): clsx + tailwind-merge estendido com os utilitários do clã (text-label/body/heading/display, font-display/sans, bg-brand/brand-button, shadow-folha/botao)"
  - "Button e buttonVariants (cva): variantes primary/secondary, tamanhos default 52px e sm 44px, só tokens, sem Slot nem asChild"
  - "Card e CardContent: bg-card, rounded-md, dark:border, light:shadow-folha, padding p-6 md:p-12"
  - "components.json do shadcn escrito à mão (style radix-nova, aliases, sem iconLibrary)"
  - "404 com a identidade do clã (card central, h1 Display, CTA primário para /)"
affects: [02-10, 02-11, 02-13, 02-14, 02-15]

actuals:
  tokens: 9000
  tasks: 2
  commits: 4
plan_head_before: 49dd756172680987ac3fde66b49a3fba288e2239
plan_head_after: 6e2123b363d05145cd841b67c9bfacd1a916bc79

tech-stack:
  added: []
  patterns:
    - "Componentes do kit escritos à mão a partir do registro oficial do shadcn, sem init/add e sem pacotes vetados pela D-23"
    - "Link com cara de botão: buttonVariants() em next/link, sem asChild"
    - "Sem 'use client' em button.tsx e card.tsx: buttonVariants chamável em server components"
    - "Utilitários próprios do clã registrados no extendTailwindMerge por grupo (tamanho, família, imagem de fundo, sombra)"

key-files:
  created:
    - apps/web/lib/utils.ts
    - apps/web/lib/utils.test.ts
    - apps/web/components/ui/button.tsx
    - apps/web/components/ui/button.test.tsx
    - apps/web/components/ui/card.tsx
    - apps/web/components/ui/card.test.tsx
    - apps/web/components.json
    - apps/web/app/not-found.tsx
    - apps/web/app/not-found.test.tsx
  modified: []

key-decisions:
  - "O Button não oferece composição por Slot/asChild (D-23): link com cara de botão usa buttonVariants() no next/link"
  - "O foco visível usa focus-visible:outline-ring (contorno de 2px com offset de 2px na cor do token --ring), em vez de ring-*, para o anel não colidir com sombras"
  - "components.json sem iconLibrary, já que a UI-SPEC não adota biblioteca de ícones"

patterns-established:
  - "Testes de contrato por token: asserções sobre as classes devolvidas por buttonVariants() e renderToStaticMarkup, incluindo regex que proíbe cor literal em hex"
  - "Esqueleto de módulo no commit RED para a falha cair em asserção (padrão herdado do 02-01)"

requirements-completed: [VIS-03, VIS-01]

coverage:
  - id: D1
    description: "cn() junta classes com clsx + tailwind-merge sem descartar os utilitários do clã e resolve conflitos comuns (px-2/px-4)"
    requirement: VIS-03
    verification:
      - kind: unit
        ref: "apps/web/lib/utils.test.ts#cn"
        status: pass
    human_judgment: false
  - id: D2
    description: "Button com variantes primary/secondary e tamanhos 52px/44px usando só tokens, sem Slot e sem cor literal"
    requirement: VIS-03
    verification:
      - kind: unit
        ref: "apps/web/components/ui/button.test.tsx#buttonVariants e Button"
        status: pass
    human_judgment: false
  - id: D3
    description: "Card com raio de 6px sobre bg-card, contorno no escuro e sombra de folha no claro, CardContent com padding 24/48px"
    requirement: VIS-03
    verification:
      - kind: unit
        ref: "apps/web/components/ui/card.test.tsx#Card"
        status: pass
    human_judgment: true
    rationale: "As classes foram verificadas, mas o aspecto real do card (contorno, sombra, gradiente do botão) depende dos tokens do 02-10 e só é julgável a olho nos dois temas depois da onda 2."
  - id: D4
    description: "404 com a identidade do clã: card central, h1 Display, texto e CTA primário para /, pré-renderizada com tema escuro"
    requirement: VIS-01
    verification:
      - kind: unit
        ref: "apps/web/app/not-found.test.tsx#404 com a identidade do clã"
        status: pass
      - kind: integration
        ref: "pnpm --filter @blog/web build + grep em .next/server/app/_not-found.html (título, texto, bg-brand-button, data-theme=dark)"
        status: pass
    human_judgment: true
    rationale: "Os utilitários visuais (text-display, bg-brand-button, shadow-botao) vêm do 02-10 na mesma onda; a aparência final da 404 só se confirma a olho depois do merge dos dois."
  - id: D5
    description: "components.json do shadcn com o schema oficial e os aliases do projeto, sem iconLibrary"
    requirement: VIS-03
    verification:
      - kind: other
        ref: "node -e (COMPONENTS_JSON_OK) sobre apps/web/components.json"
        status: pass
    human_judgment: false

duration: 14min
completed: 2026-11-27
status: complete
---

# Phase 2 Plan 03: Kit base (Button, Card, cn) e 404 do clã Summary

**Kit base do shadcn escrito à mão (cn estendido para os utilitários do clã, Button primary/secondary, Card, components.json) montado numa 404 com a identidade No Law, sem instalar nenhum pacote vetado.**

## Performance

- **Duration:** 14 min
- **Tasks:** 2 (a primeira com RED e GREEN; a segunda com testes de caracterização e arquivo de configuração)
- **Files modified:** 9 (todos criados)

## Accomplishments

- `cn()` usa `extendTailwindMerge` registrando `text-label/body/heading/display` em `font-size`, `font-display/sans` em `font-family`, `bg-brand/brand-button` em `bg-image` e `shadow-folha/botao` em `shadow`; assim `cn('text-display', 'text-foreground')` mantém os dois e `cn('px-2', 'px-4')` devolve `px-4`.
- `Button` (`primary` com gradiente da marca e hover que sobe 2px com `shadow-botao`, anulado por `motion-reduce`; `secondary` com contorno de 2px) e `Card`/`CardContent`, sem `'use client'`, para `buttonVariants()` valer em server components.
- A 404 (`app/not-found.tsx`) sai pré-renderizada em `_not-found.html` com o título, o texto, o CTA `bg-brand-button` e `data-theme="dark"`; herda o layout raiz.
- `components.json` válido contra o schema do shadcn, com `style` `radix-nova` e os aliases do projeto, para as próximas fases usarem `shadcn add` com revisão de diff.

## Task Commits

1. **Task 1 (tracer): 404 com a identidade do clã, do Button/Card ao HTML pré-renderizado**
   - RED `c6744ce` (test) — testes de `cn` e da 404 mais esqueletos de `utils.ts` e `not-found.tsx`
   - GREEN `20d0646` (feat) — `cn` com `extendTailwindMerge`, `Button`, `Card`, 404
2. **Task 2: contrato do Button e do Card por token e o components.json**
   - Testes `f7d855f` (test) — contrato por token de `buttonVariants`, `Button`, `Card` e `CardContent`
   - Config `6e2123b` (feat) — `components.json`

**Plan metadata:** commit `docs(02-03)` seguinte a este arquivo.

## TDD Gate Compliance

- **RED (tarefa 1):** alvo `tem exatamente um h1 com o título da página` (`apps/web/app/not-found.test.tsx`); `gsd check tdd-red-evidence` devolveu `RED_EVIDENCE_OK` (`target_test_failed`, 8 de 12 testes falhando por asserção). `semanticAssessment`: o alvo executou e falhou na asserção planejada (`expected undefined to be 1`, o esqueleto não tem `h1`), pelo motivo certo, sem erro de carga, sintaxe ou fixture. O esqueleto de módulo no commit RED evitou o INVALID_RED por módulo ausente.
- **GREEN (tarefa 1):** `20d0646` veio depois de `c6744ce`; suíte `unit` verde (77 testes) e `build` com a 404 pré-renderizada.
- **Tarefa 2:** os testes de contrato do `Button` e do `Card` passaram na chegada, porque o componente já existia desde a Task 1. O plano prevê isso ("conta como regressão protegida"): não houve RED para a Task 2, e isso não é violação, é caracterização. Prova de que os testes pegam regressão: troquei `h-13` por `h-12` no `button.tsx`, o teste `usa por padrão o primário de 52px...` falhou, e a mudança foi revertida com `git checkout`.
- **REFACTOR:** nenhum.

## Files Created/Modified

- `apps/web/lib/utils.ts` - `cn()` com clsx e `extendTailwindMerge` (utilitários do clã)
- `apps/web/lib/utils.test.ts` - 7 casos de `cn`
- `apps/web/components/ui/button.tsx` - `Button` e `buttonVariants` (cva)
- `apps/web/components/ui/button.test.tsx` - contrato por token, sem hex, tipo e `disabled`
- `apps/web/components/ui/card.tsx` - `Card` e `CardContent`
- `apps/web/components/ui/card.test.tsx` - superfície, contornos por tema e padding
- `apps/web/components.json` - config do shadcn à mão (schema oficial)
- `apps/web/app/not-found.tsx` - 404 (card, `h1` Display, CTA primário), `metadata.title`
- `apps/web/app/not-found.test.tsx` - 5 casos da 404 com `renderToStaticMarkup`

## Decisions Made

- Foco do `Button` por `focus-visible:outline-2 outline-offset-2 outline-ring`, em vez de `ring-*`: o anel de contorno não conflita com a `shadow-botao` do hover e segue o token `--ring`.
- `text-balance` e `text-center` na coluna da 404 (UI-SPEC: `text-wrap: balance` numa coluna centralizada); o `Card` usa `max-w-190` (760px).
- O pacote `shadcn` (devDependency do 02-01) não foi usado: nem `init` nem `add` rodaram.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Esqueleto dos módulos no commit RED**
- **Found during:** Task 1 (RED)
- **Issue:** com `lib/utils.ts` e `app/not-found.tsx` inexistentes, o runner falha na carga e o classificador `tdd-red-evidence` trata isso como INVALID_RED (`fixture_or_load_failure`).
- **Fix:** o commit `test(02-03)` inclui um esqueleto de cada módulo (sem comportamento); o GREEN os substitui.
- **Files modified:** `apps/web/lib/utils.ts`, `apps/web/app/not-found.tsx`
- **Verification:** `RED_EVIDENCE_OK`.
- **Committed in:** `c6744ce`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** nenhuma mudança de escopo; só torna o RED válido para o gate de TDD.

## Issues Encountered

- O sandbox recusa a escrita no diretório git do worktree, então o ledger `gsd-plan-head-before-02-03` não foi gravado; a base `plan_head_before` é o HEAD verificado no início (`49dd756`) e `commits` foi medido contra ela (`git rev-list --count`).
- `pnpm --filter @blog/web test -- <arquivo>` não filtra por arquivo (a suíte `unit` roda inteira); a suíte passou por completo. Para o RED usei `pnpm --filter @blog/web exec vitest run --project unit --reporter=tap <arquivos>`.
- Os utilitários `text-display`, `bg-brand-button`, `shadow-botao`, `shadow-folha` e os tokens `bg-card`, `bg-accent`, `outline-ring` ainda não existem no `globals.css` (vêm do 02-10 na mesma onda). O Tailwind 4 ignora classe desconhecida sem erro, então o build e os testes passam; o visual só aparece completo depois do merge com o 02-10.

## Known Stubs

Nenhum stub de dados. As classes de marca (`text-display`, `bg-brand-button`, `shadow-botao`, `shadow-folha`, `bg-accent`, `outline-ring`) dependem do `globals.css` do 02-10; isso é a sequência planejada da onda 2, não um stub.

## Threat Flags

Nenhum. Sem endpoint, autenticação ou acesso a arquivo novo. T-02-08 mitigado: os componentes foram escritos à mão e adaptados do registro oficial do shadcn, sem `shadcn init`/`add`, e `apps/web/package.json` continua sem `radix-ui`, `lucide-react` e `tw-animate-css`. T-02-SC aceito: nenhum pacote novo foi instalado.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `Button`, `buttonVariants`, `Card`, `CardContent` e `cn` prontos para `/status` e o erro global (onda 3), a capa, as páginas de leitura e o `/kit` (onda 4).
- Depois do merge com o 02-10 e o 02-11, vale conferir a 404 a olho nos dois temas (header, rodapé, gradiente do botão, sombra de folha); o E2E de erro e os cenários BDD ficam no 02-13.

## Self-Check: PASSED

- Arquivos criados conferidos no disco: `lib/utils.ts`, `lib/utils.test.ts`, `components/ui/button.tsx`, `components/ui/button.test.tsx`, `components/ui/card.tsx`, `components/ui/card.test.tsx`, `components.json`, `app/not-found.tsx`, `app/not-found.test.tsx`.
- Commits conferidos como ancestrais do HEAD: `c6744ce`, `20d0646`, `f7d855f`, `6e2123b`; ordem do RED (`c6744ce`) antes do GREEN (`20d0646`) confirmada.
- Verificações finais: `pnpm --filter @blog/web test` (95 testes), `build` (404 pré-renderizada com título, texto, `bg-brand-button` e `data-theme="dark"`), `lint`, `typecheck`, `check:raw-html` (`RAW_HTML_OK`), `format:check` (limpo), `COMPONENTS_JSON_OK`, `grep` de `radix-ui|asChild` em `button.tsx` == 0 e de pacotes vetados em `package.json` == 0.

---
*Phase: 02-identidade-visual-no-law*
*Completed: 2026-11-27*
