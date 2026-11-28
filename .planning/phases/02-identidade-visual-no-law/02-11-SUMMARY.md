---
phase: 02-identidade-visual-no-law
plan: 11
subsystem: ui
tags: [nextjs, next-font, react, tailwind, svg, ornaments, layout, vitest]

requires:
  - phase: 02-identidade-visual-no-law
    provides: "02-01: layout com script anti-flash, ThemeToggle, DragonMark e globals.css base"
provides:
  - "SITE, siteMetadata e siteViewport (lib/site.ts)"
  - "Fontes do clã por next/font/google (lib/fonts.ts: body e title)"
  - "SiteHeader e SiteFooter (faixas de tinta) e o layout raiz final com link de atalho e main#conteudo"
  - "BrushStroke, Cloud e Hanko (ornamentos JSX aria-hidden)"
affects: [02-05, 02-12, 02-06, 02-03, 02-07]

actuals:
  tokens: 8000
  tasks: 3
  commits: 6

plan_head_before: 49dd756172680987ac3fde66b49a3fba288e2239
plan_head_after: 493b9238b06d50772f73e0c8ad5c69c45125530f

tech-stack:
  added: []
  patterns:
    - "Ornamento = componente JSX com aria-hidden, sem estilo inline e id de gradiente por useId()"
    - "Único módulo que chama next/font/google (lib/fonts.ts); o teste do layout mocka '@/lib/fonts'"
    - "Texto composto montado em template string para o HTML prerenderizado sair sem <!-- --> entre nós"

key-files:
  created:
    - apps/web/lib/site.ts
    - apps/web/lib/fonts.ts
    - apps/web/components/site-header.tsx
    - apps/web/components/site-footer.tsx
    - apps/web/components/ornaments/brush-stroke.tsx
    - apps/web/components/ornaments/cloud.tsx
    - apps/web/components/ornaments/hanko.tsx
    - apps/web/components/ornaments/ornaments.test.tsx
    - apps/web/app/layout.test.tsx
  modified:
    - apps/web/app/layout.tsx
    - apps/web/app/page.tsx

key-decisions:
  - "A verificação de fonte self-hosted troca o proxy 'as=\"font\" no _not-found.html' por checagem de @font-face apontando para /_next/static/media e ausência de domínio do Google: o Next 16.4 não emite o preload no HTML (nem no prerender nem em runtime, só no cabeçalho Link das rotas dinâmicas)"
  - "O link de atalho usa <a> simples (âncora interna) e bg-primary/texto branco no foco, sem depender de tokens que o 02-10 ainda não entregou além dos nomes combinados"
  - "O Hanko e as nuvens ficam em wrappers próprios 'hidden sm:block' (rodapé) e 'hidden lg:block' (header), com o contêiner da faixa cortando o excesso (overflow-x-clip no rodapé, overflow-y-clip no header)"

patterns-established:
  - "Faixa de tinta: <header|footer className=\"faixa relative\"> com conteúdo em z-10 e ornamentos em z-0 absolutos"
  - "Reserva de 144px à direita da linha do header a partir de lg (lg:pr-36) para a nuvem; o 02-05 acrescenta a navegação na mesma linha"

requirements-completed: [VIS-02, VIS-01, UX-01]

coverage:
  - id: D1
    description: "Header com os dragões (DragonMark 44px) e o nome 'No Law' num link para '/', botão de tema no fim da linha"
    requirement: VIS-02
    verification:
      - kind: unit
        ref: "apps/web/app/layout.test.tsx#RootLayout: header com a marca"
        status: pass
    human_judgment: false
  - id: D2
    description: "Rodapé com Sobre o clã, Regras e Privacidade, 'No Law · desde 2017', sem link do Discord nem target=_blank"
    requirement: VIS-02
    verification:
      - kind: unit
        ref: "apps/web/app/layout.test.tsx#RootLayout: rodapé do clã"
        status: pass
      - kind: other
        ref: "pnpm --filter @blog/web build && grep no apps/web/.next/server/app/_not-found.html (skip link, desde 2017, Rodapé, /privacidade, theme-color)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Link 'Pular para o conteúdo' como primeiro link focável e único main#conteudo entre header e rodapé; layout sem cookies/headers (rotas estáticas, _not-found prerenderizada)"
    requirement: UX-01
    verification:
      - kind: unit
        ref: "apps/web/app/layout.test.tsx#RootLayout: casca do clã"
        status: pass
      - kind: other
        ref: "next build: _not-found prerenderizada com ○ (Static)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Metadados: título 'Blog No Law' com modelo '%s | Blog No Law', descrição e theme-color #000000"
    requirement: VIS-02
    verification:
      - kind: unit
        ref: "apps/web/app/layout.test.tsx#metadados do site"
        status: pass
    human_judgment: false
  - id: D5
    description: "Fontes Yuji Boku 400 (títulos) e Atkinson Hyperlegible Next (corpo) servidas pelo próprio site, sem pedido do navegador ao Google"
    requirement: VIS-01
    verification:
      - kind: unit
        ref: "apps/web/app/layout.test.tsx#põe as classes de variável das fontes no <html>"
        status: pass
      - kind: other
        ref: "next build + grep: @font-face src em /_next/static/media; nenhum fonts.googleapis/gstatic em .next/static e .next/server/app"
        status: pass
    human_judgment: false
  - id: D6
    description: "Ornamentos das faixas (traço de pincel, nuvens, hanko) aria-hidden, sem estilo inline, ids de gradiente únicos; header com nuvem só a partir de 1024px e rodapé com par de nuvens a partir de 640px sem rolagem horizontal"
    requirement: VIS-01
    verification:
      - kind: unit
        ref: "apps/web/components/ornaments/ornaments.test.tsx"
        status: pass
      - kind: unit
        ref: "apps/web/app/layout.test.tsx#RootLayout: ornamentos do header / ornamentos do rodapé"
        status: pass
    human_judgment: true
    rationale: "A aparência (posição da nuvem sob/ao lado da navegação, ausência de rolagem horizontal em 320px, fidelidade ao esboço Síntese) não é afirmada por teste de marcação; o Chromium do Playwright não roda neste WSL e a verificação visual/axe fica para o CI (02-09) e para o UAT"

duration: 28min
completed: 2026-11-27
status: complete
---

# Phase 02 Plan 11: Faixas de tinta do clã Summary

**Header com dragões e "No Law", rodapé com Sobre/Regras/Privacidade e "desde 2017", ornamentos (pincel, nuvens, hanko), fontes Yuji Boku e Atkinson servidas pelo próprio site via next/font e link de atalho em toda página**

## Performance

- **Duration:** 28 min
- **Started:** 2026-11-27T22:49:00Z
- **Completed:** 2026-11-27T23:06:00Z
- **Tasks:** 3 (1 tracer + 2 auto, todas TDD)
- **Files modified:** 11 (9 criados, 2 alterados)

## Accomplishments

- Todo HTML do site traz a casca do clã: link "Pular para o conteúdo", `SiteHeader` (DragonMark 44px + "No Law" + botão de tema), `<main id="conteudo">` único e `SiteFooter` (nav "Rodapé", "No Law · desde 2017"), com metadados do site e `theme-color #000000`.
- Fontes do clã (D-18) em `lib/fonts.ts`, o único módulo que chama `next/font/google`; o build serve as fontes de `/_next/static/media` e nenhum HTML ou CSS cita domínio do Google.
- Ornamentos de D-19 como JSX `aria-hidden` sem estilo inline: `BrushStroke` (header 4px, footer 5px, title), `Cloud` (com `flip`) e `Hanko`; header com nuvem só a partir de `lg` e 144px de reserva (`lg:pr-36`), rodapé com hanko e par de nuvens a partir de `sm` num contêiner `overflow-x-clip`.
- `app/page.tsx` perdeu o `<main>` próprio (o layout provê o único), e a home de status da Fase 1 segue funcionando (`SMOKE_LOCAL_DEGRADED_OK`).

## Task Commits

1. **Task 1: Tracer, marca no header e rodapé em toda página** - RED `3cf2788` (test), GREEN `db34842` (feat)
2. **Task 2: Fontes do clã servidas pelo próprio site** - RED `a4bb892` (test), GREEN `30c0824` (feat)
3. **Task 3: Ornamentos das faixas** - RED `8c8b96e` (test), GREEN `493b923` (feat)

**Plan metadata:** commit `docs(02-11)` do SUMMARY (ver `git log`)

## TDD

- **RED T1:** alvo `app/layout.test.tsx > RootLayout: casca do clã > tem o link "Pular para o conteúdo" como primeiro link do <body>`; `gsd check tdd-red-evidence` devolveu `RED_EVIDENCE_OK` (`target_test_failed`, 11 testes falhando por asserção). `semanticAssessment`: o alvo executou e falhou na asserção planejada (`expected false to be true`, o layout ainda não tinha o link), sem erro de carga. O `lib/site.ts` entrou como esqueleto no commit RED para os testes de metadados falharem por asserção e não por módulo ausente.
- **RED T2:** alvo `...põe as classes de variável das fontes no <html>, depois de lang e data-theme`; `RED_EVIDENCE_OK`; `semanticAssessment`: falhou na asserção planejada (`<html lang="pt-BR" data-theme="dark">` sem `class`), motivo certo.
- **RED T3:** alvo `components/ornaments/ornaments.test.tsx > BrushStroke > no header tem a arte larga...`; `RED_EVIDENCE_OK`, 17 testes falhando por asserção contra esqueletos que devolvem `null`; `semanticAssessment`: motivo certo (arte ausente), sem erro de carga.
- **GREEN/REFACTOR:** três commits `feat(02-11)`, cada um depois do seu `test(02-11)`; nenhum commit `refactor` (sem mudança necessária).

## Files Created/Modified

- `apps/web/lib/site.ts` - SITE, siteMetadata (título com modelo) e siteViewport (themeColor #000000)
- `apps/web/lib/fonts.ts` - Atkinson Hyperlegible Next (`--font-body`) e Yuji Boku 400 (`--font-title`)
- `apps/web/app/layout.tsx` - layout final: metadados, classes de variável das fontes, link de atalho, header, main#conteudo e rodapé
- `apps/web/app/page.tsx` - `<main>` trocado por `<div>` (o layout provê o único main)
- `apps/web/components/site-header.tsx` / `site-footer.tsx` - faixas de tinta com marca, navegação do rodapé e ornamentos
- `apps/web/components/ornaments/{brush-stroke,cloud,hanko}.tsx` - ornamentos decorativos
- `apps/web/app/layout.test.tsx`, `apps/web/components/ornaments/ornaments.test.tsx` - testes

## Decisions Made

- Verificação de fonte self-hosted reformulada (ver Desvios): o preload não aparece em HTML no Next 16.4, então a prova de "fonte do próprio site" passou a ser `@font-face` em `/_next/static/media` + zero referência a domínio do Google.
- Link de atalho com `bg-primary` e texto branco no foco (nomes de token combinados com o 02-10; razão 7,58 do vermelho com branco, AAA).
- Wrappers das nuvens com `hidden lg:block` (header) e `hidden sm:block` (rodapé) como string contígua para o teste e o Tailwind enxergarem a mesma classe.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Verificação `grep 'as="font"' _not-found.html` não é satisfazível no Next 16.4.6**
- **Found during:** Task 2 (Fontes)
- **Issue:** o build passa e as fontes são self-hosted, mas o Next 16.4 não escreve `<link rel="preload" as="font">` no HTML da `_not-found` (nem em runtime); o preload sai só no cabeçalho HTTP `Link` das rotas dinâmicas (confirmado em `next start` na `/`). A `_not-found.meta` não guarda o cabeçalho `Link`. O `next-font-manifest.json` lista os dois arquivos woff2 para as páginas.
- **Fix:** manter a intenção da checagem (nenhum pedido a terceiros e fonte do próprio site): conferi que o CSS tem `@font-face` com `src:url(../media/*.woff2)`, que `.next/static/media` contém os woff2 e que `grep -rE 'fonts\.(googleapis|gstatic)\.com'` em `.next/static` e `.next/server/app` não acha nada. Nenhum arquivo do plano foi alterado por isso.
- **Files modified:** nenhum
- **Verification:** build verde, grep de domínio do Google sem resultado, `Link: ...rel=preload; as="font"` visto na resposta de `/`
- **Committed in:** n/a (só verificação)

**2. [Rule 3 - Blocking] Esqueletos no commit RED**
- **Found during:** Tasks 1 e 3
- **Issue:** testes importando `@/lib/site` e `./brush-stroke` etc. falhariam por módulo ausente (INVALID_RED, `fixture_or_load_failure`).
- **Fix:** o commit RED inclui um esqueleto mínimo (`lib/site.ts` com valores vazios; ornamentos que devolvem `null`), substituído no GREEN.
- **Files modified:** `apps/web/lib/site.ts`, `apps/web/components/ornaments/*.tsx` (no RED)
- **Verification:** `RED_EVIDENCE_OK` nos três ciclos
- **Committed in:** `3cf2788`, `8c8b96e`

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** nenhuma mudança de escopo; a primeira troca só o proxy de verificação do preload, a segunda é o padrão de esqueleto exigido pelo classificador de RED.

## Issues Encountered

- O relatório TAP do RED foi rejeitado como "Non-TAP data" quando uma asserção produzia mensagem de várias linhas (diff de objeto) ou um campo `expected` com aspas escapadas duas vezes; resolvido com asserções de linha única (booleanos e strings simples). Não afetou o código de produção.
- O build avisa `Failed to find font override values for font Atkinson Hyperlegible Next` (sem fallback ajustado por métricas). Aviso do Next, não falha; a fonte carrega com `display: swap`.
- O Chromium do Playwright não roda neste WSL: nenhuma verificação visual (rolagem horizontal em 320px, posição da nuvem, axe) foi feita aqui; fica para o CI (02-09) e o UAT.

## User Setup Required

None - no external service configuration required.

## Known Stubs

Nenhum stub de dado. Os links `/sobre`, `/regras` e `/privacidade` do rodapé caem na 404 do clã até o 02-06 publicá-los (previsto no plano).

## Threat Flags

Nenhuma superfície nova além da registrada no `<threat_model>` do plano (T-02-03, T-02-12 e T-02-28 cobertas: fontes self-hosted sem domínio do Google, SVG em JSX sem HTML bruto com `check:raw-html` verde, só links internos no rodapé sem `target="_blank"`).

## Next Phase Readiness

- 02-05 pode acrescentar a navegação e o ☰ entre a marca e o botão de tema na mesma linha do header (a reserva `lg:pr-36` já existe) e criar `site-header.test.tsx`.
- 02-12 pode acrescentar `metadataBase` e `openGraph` em `lib/site.ts`.
- O 02-10 precisa entregar `.faixa`, `text-label`, `text-heading`, `font-display`, `text-link`, `bg-primary` e o mapeamento `--font-body`/`--font-title` em `globals.css`; este plano só usa os nomes.

## Self-Check: PASSED

- Arquivos criados presentes: `lib/site.ts`, `lib/fonts.ts`, `site-header.tsx`, `site-footer.tsx`, `ornaments/{brush-stroke,cloud,hanko}.tsx`, `ornaments.test.tsx`, `layout.test.tsx` (todos no `git diff --stat` do plano).
- Commits `3cf2788`, `db34842`, `a4bb892`, `30c0824`, `8c8b96e`, `493b923` presentes na branch; cada `test(02-11)` precede o seu `feat(02-11)`.
- Critérios de aceitação: `foundedYear: 2017` em `site.ts`; `<main` em `page.tsx` == 0; `discord` em `site-footer.tsx` == 0; `next/font/google` só em `lib/fonts.ts`; `useId` em `brush-stroke.tsx` e `cloud.tsx`; `lg:pr-36` em `site-header.tsx`.
- Verificação do plano: `pnpm --filter @blog/web test` (98 verdes), `lint`, `typecheck`, `build`, `check:raw-html` (`RAW_HTML_OK`), `format:check` e `scripts/smoke-local.sh --degraded` (`SMOKE_LOCAL_DEGRADED_OK`) verdes; guard `style={{|w-screen|100vw` em `apps/web/components` sem ocorrências.

---
*Phase: 02-identidade-visual-no-law*
*Completed: 2026-11-27*
