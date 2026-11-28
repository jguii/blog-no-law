---
phase: 02-identidade-visual-no-law
plan: 08
subsystem: ui
tags: [nextjs, csp, security-headers, design-kit, tailwind, vitest, playwright, bdd, wcag]

requires:
  - phase: 02-identidade-visual-no-law
    provides: "02-10 lib/tokens.ts, lib/contrast.ts e e2e/helpers.ts; 02-01 DragonMark e ThemeToggle; 02-03 Button e Card; 02-04 app/icon.svg; 02-05 lib/nav.ts e icons; 02-11 ornamentos; 02-07 /status"
provides:
  - "/kit: página estática de referência (VIS-03), fora do menu e dos buscadores, com as dez seções da UI-SPEC"
  - "lib/security-headers.ts: buildCsp, securityHeaders e NOINDEX_ROUTES"
  - "next.config.ts delegando os cabeçalhos a securityHeaders (import .ts explícito) dentro do withSentryConfig"
  - "CSP v1 estática em toda resposta e X-Robots-Tag noindex em /kit e /status"
  - "lib/marca-consistencia.test.tsx: favicon e DragonMark pequeno com a mesma arte"
  - "docs/bdd/kit.feature.md e e2e/kit.spec.ts"
affects: [02-09, fase-04-conteudo-de-usuario, fases-3-a-6-componentes-no-kit]

commits: 6
plan_head_before: 311c351afa6a37642656cab6b3c0133e8905581b
plan_head_after: 0419918e5bf5428a90028650d5b54de39740433c

actuals:
  tokens: 8600
  tasks: 3
  commits: 6

tech-stack:
  added: []
  patterns:
    - "Cabeçalhos HTTP num módulo testável (lib/security-headers.ts) importado pelo next.config.ts com extensão .ts explícita"
    - "CSP estática sem nonce, para as rotas continuarem prerenderizadas"
    - "Amostras de cor do /kit pintam o hex do próprio token (style inline), então os dois temas e a faixa aparecem lado a lado em qualquer tema"
    - "Estados hover e foco do kit mostrados de forma estática aplicando as mesmas classes que o estado real produz"

key-files:
  created:
    - apps/web/lib/security-headers.ts
    - apps/web/lib/security-headers.test.ts
    - apps/web/app/kit/page.tsx
    - apps/web/app/kit/page.test.tsx
    - apps/web/lib/marca-consistencia.test.tsx
    - apps/web/e2e/kit.spec.ts
    - docs/bdd/kit.feature.md
  modified:
    - apps/web/next.config.ts

key-decisions:
  - "CSP v1 sem nonce e com 'unsafe-inline' em script-src (risco residual aceito até a Fase 4, T-02-20); sem upgrade-insecure-requests porque o E2E roda em http://127.0.0.1"
  - "A origem do Sentry entra no connect-src só para DSN https válido, via new URL(dsn).origin; a chave do DSN nunca vai ao cabeçalho"
  - "As amostras de cor usam style inline com o hex do token (e não bg-<token>): a variável semântica só reflete o tema atual, e o kit precisa mostrar escuro, claro e faixa ao mesmo tempo"
  - "A pré-visualização do menu usa spans com navItemClassName, sem id menu-principal e sem nav, para não duplicar o menu real do topo"

patterns-established:
  - "Testes de CSP e de cabeçalhos com asserções booleanas de uma linha (aspas simples da CSP no 'message' do YAML do TAP quebram o classificador de RED)"
  - "Teste de ativos lê o arquivo (app/icon.svg) por node:fs e compara com a renderização do componente"

requirements-completed: [VIS-03, VIS-01, VIS-02]

coverage:
  - id: D1
    description: "/kit estático com as dez seções (cores com hex e razão de contraste calculada nos dois temas e na faixa, tipografia, espaçamento, botões nos quatro estados, link, card, item de menu, menu sanduíche, botão de tema e ornamentos)"
    requirement: VIS-03
    verification:
      - kind: unit
        ref: "apps/web/app/kit/page.test.tsx#/kit: as dez seções da UI-SPEC"
        status: pass
      - kind: unit
        ref: "apps/web/app/kit/page.test.tsx#/kit: cores"
        status: pass
      - kind: integration
        ref: "pnpm --filter @blog/web build (kit.html prerenderizado com as cinco seções conferidas por grep)"
        status: pass
      - kind: e2e
        ref: "apps/web/e2e/kit.spec.ts#@e2e Kit mostra tokens e componentes (só lista aqui; roda na CI, 02-09)"
        status: unknown
    human_judgment: true
    rationale: "Fidelidade visual do kit aos esboços (layout, espaçamento e aparência dos estados) e o axe nos dois temas só são vistos em navegador; o Chromium não abre neste WSL e o E2E roda na CI"
  - id: D2
    description: "/kit e /status fora dos buscadores por meta robots e por X-Robots-Tag noindex; kit fora do menu"
    requirement: VIS-03
    verification:
      - kind: unit
        ref: "apps/web/lib/security-headers.test.ts#securityHeaders: fora dos buscadores (D-22)"
        status: pass
      - kind: integration
        ref: "routes-manifest.json do build (HEADERS_OK) e curl em next start: X-Robots-Tag: noindex, nofollow em /kit; meta robots no kit.html"
        status: pass
    human_judgment: false
  - id: D3
    description: "CSP v1 estática em toda resposta (sem curinga, sem unsafe-eval em produção, fontes e imagens só do próprio domínio, só a origem do Sentry sem a chave), mantendo os quatro cabeçalhos da Fase 1 e as páginas estáticas"
    requirement: VIS-01
    verification:
      - kind: unit
        ref: "apps/web/lib/security-headers.test.ts#buildCsp"
        status: pass
      - kind: integration
        ref: "build: CSP_BUILT_OK, kit.html e _not-found.html prerenderizados; bash scripts/smoke-local.sh --degraded: SMOKE_LOCAL_DEGRADED_OK"
        status: pass
    human_judgment: false
  - id: D4
    description: "Favicon (app/icon.svg) e DragonMark pequeno com a mesma arte"
    requirement: VIS-02
    verification:
      - kind: unit
        ref: "apps/web/lib/marca-consistencia.test.tsx#favicon e DragonMark pequeno"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-11-28
status: complete
---

# Phase 02 Plan 08: Kit de identidade e CSP v1 Summary

**Página estática `/kit` com tokens, contraste calculado, tipografia, espaçamento e todos os componentes base, mais a CSP v1 estática (sem nonce, sem curinga) e `X-Robots-Tag: noindex` em `/kit` e `/status`, tudo num módulo de cabeçalhos testável importado pelo `next.config.ts`**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-11-28
- **Tasks:** 3 (1 tracer + 2 auto, todas TDD)
- **Files modified:** 8 (7 criados, 1 modificado)

## Accomplishments

- `/kit` prerenderizado (`kit.html`), fora do menu e dos buscadores (meta `robots` e cabeçalho), com as dez seções: Cores (amostras por token em grade `auto-fill` e tabela de pares com a razão calculada de `lib/tokens.ts` por `lib/contrast.ts`, vírgula decimal), Tipografia, Espaçamento (7 barras de 4 a 64px), Botões (primário e secundário, `default` e `sm`, normal, hover, foco e desabilitado), Link em texto, Card, Item de menu, Menu sanduíche (fechado e aberto, estático), Botão de tema real e Ornamentos.
- `lib/security-headers.ts` com `buildCsp`, `securityHeaders` e `NOINDEX_ROUTES`; o `next.config.ts` importa com extensão `.ts` explícita e manteve o `withSentryConfig`. O Next 16.4.6 carregou a config sem fallback.
- CSP v1 servida em toda resposta (conferida no `routes-manifest.json` e por `curl` em `next start`): `default-src 'self'`, `script-src 'self' 'unsafe-inline'`, `style-src 'self' 'unsafe-inline'`, `img-src 'self' data: blob:`, `font-src 'self'`, `connect-src 'self'` (+ origem https do Sentry quando houver DSN), `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`. As rotas seguem estáticas (`/`, `/kit`, `/_not-found`).
- Teste de consistência: todo `d` de `app/icon.svg` aparece no `DragonMark` de 44px.
- Cenários BDD em `docs/bdd/kit.feature.md` e E2E em `e2e/kit.spec.ts` (6 testes listados nos projetos `chromium` e `mobile`).

## TDD (RED → GREEN)

| Tarefa | RED | GREEN |
| ------ | --- | ----- |
| 1 Tracer | `e1acd4e`: 18 de 19 testes falhando em asserção contra esqueletos de `securityHeaders` e `KitPage`; alvo `/kit sai com X-Robots-Tag noindex`; `RED_EVIDENCE_OK` | `f73f9ba` |
| 2 Kit completo | `21060b6`: 13 falhas; alvo `tem os h2 das dez seções` (esperado as dez, obtido só `Cores`); `RED_EVIDENCE_OK`. Os 4 testes de `marca-consistencia` passam de imediato (teste de caracterização de ativos que já existiam, não é RED de comportamento novo) | `5e9b42e` |
| 3 CSP | `f30b0bf`: 19 falhas contra o esqueleto de `buildCsp`; alvo `frame-ancestors é 'none'`; `RED_EVIDENCE_OK`. Os testes negativos (sem `unsafe-eval`, sem `*`) passam no vazio por natureza | `0419918` |

Nenhum REFACTOR separado foi necessário.

## Task Commits

1. **Task 1 (tracer): `/kit` estática fora dos buscadores** - `e1acd4e` (test), `f73f9ba` (feat)
2. **Task 2: kit completo** - `21060b6` (test), `5e9b42e` (feat)
3. **Task 3: CSP v1 e BDD/E2E** - `f30b0bf` (test), `0419918` (feat)

Tracer verificado de ponta a ponta (build, `HEADERS_OK` e meta robots no `kit.html`) antes da expansão.

## Files Created/Modified

- `apps/web/lib/security-headers.ts` - `buildCsp`, `securityHeaders`, `NOINDEX_ROUTES` (só sintaxe TypeScript apagável)
- `apps/web/lib/security-headers.test.ts` - contrato dos cabeçalhos da Fase 1, noindex e CSP (33 testes)
- `apps/web/next.config.ts` - `headers()` delega a `securityHeaders`; `withSentryConfig` mantido
- `apps/web/app/kit/page.tsx` - `/kit` (server component estático, `robots` noindex)
- `apps/web/app/kit/page.test.tsx` - 25 testes da página
- `apps/web/lib/marca-consistencia.test.tsx` - favicon e DragonMark com a mesma arte
- `docs/bdd/kit.feature.md` - três cenários
- `apps/web/e2e/kit.spec.ts` - três cenários @e2e (axe nos dois temas, sem rolagem horizontal no celular, noindex, cabeçalhos)

## Decisions Made

- CSP sem nonce e com `'unsafe-inline'` em `script-src` (RESEARCH Pattern 6): risco residual aceito até a Fase 4 (T-02-20); o aperto por nonce vira dívida a registrar no `STATE.md` pelo 02-09.
- Sem `upgrade-insecure-requests`: o E2E roda em `http://127.0.0.1`.
- Amostras de cor com `style` inline do hex do token (em vez de `bg-<token>`), porque a variável semântica só reflete o tema atual; o `style-src 'unsafe-inline'` da CSP já cobre.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Teste dos DragonMark do `/kit` contava também o do botão de tema**
- **Found during:** Task 2 (GREEN)
- **Issue:** o `ThemeToggle` real renderiza um `DragonMark` de 28px antes da seção Ornamentos, então a lista de larguras vinha `28,16,32,44,96` em vez de `16,32,44,96`.
- **Fix:** o teste passou a olhar só o trecho do HTML a partir do `h2` "Ornamentos".
- **Files modified:** `apps/web/app/kit/page.test.tsx`
- **Committed in:** `5e9b42e`

**2. [Rule 3 - Blocking] Mensagem de asserção com aspas escapadas invalidou o relatório TAP do RED**
- **Found during:** Task 3 (RED)
- **Issue:** `expect(...).toBe("'none'")` gera `message: "... '\'none\'' ..."` no YAML do TAP; o classificador respondeu `INVALID_RED` (`invalid_record`, "Malformed TAP").
- **Fix:** as asserções que comparam diretivas com aspas viraram booleanas de uma linha (`expect(a === b).toBe(true)`), como a dica do bootstrap; o RED foi regerado e deu `RED_EVIDENCE_OK`.
- **Files modified:** `apps/web/lib/security-headers.test.ts`
- **Committed in:** `f30b0bf`

**3. [Ajuste de ordem] `docs/bdd/kit.feature.md` foi para o commit RED da Task 3**
- O plano o listava no passo GREEN; como BDD vem antes do teste, ficou no commit `test(02-08)`. O E2E ficou no commit `feat(02-08)`.

---

**Total deviations:** 2 auto-fixed (1 bug de teste, 1 bloqueio de ferramenta) + 1 ajuste de ordem de commit
**Impact on plan:** nenhum efeito no produto; sem aumento de escopo.

## Issues Encountered

- O ledger `gsd-plan-head-before-02-08` não pôde ser gravado (o sandbox recusa escrita sob `.git/worktrees/`); o `plan_head_before` foi registrado no frontmatter a partir do HEAD de partida (`311c351`), e `commits: 6` foi medido com `git rev-list --count 311c351..HEAD`.
- O Playwright não abre o Chromium neste WSL: o `e2e/kit.spec.ts` só foi verificado por `playwright test --list` (6 testes em 1 arquivo). A execução fica para a CI (02-09).
- `next build` emite o aviso do Turbopack "Failed to find font override values for font `Atkinson Hyperlegible Next`" (anterior a este plano, não relacionado).

## User Setup Required

None - no external service configuration required.

## Known Stubs

None. Os componentes de Fases 3 a 6 entram no `/kit` quando forem criados (premissa sinalizada no plano, VIS-03).

## Threat Flags

None. A superfície nova (cabeçalhos HTTP e uma página estática) está coberta pelo `<threat_model>` do plano (T-02-19 a T-02-22).

## Next Phase Readiness

- O 02-09 deve conferir em produção na Vercel que o `next.config.ts` com import `.ts` carrega, que a CSP chega, e que `/`, `/kit`, `/sobre` e a capa final seguem estáticas; registrar no `STATE.md` a dívida do aperto de `script-src` por nonce (Fase 4).
- A execução do `e2e/kit.spec.ts` (axe nos dois temas, rolagem horizontal) depende da CI.

## TDD Gate Compliance

Os três pares RED/GREEN estão presentes e em ordem: `e1acd4e` → `f73f9ba`, `21060b6` → `5e9b42e`, `f30b0bf` → `0419918`.

## Self-Check: PASSED

- Arquivos criados existem (`security-headers.ts`, `security-headers.test.ts`, `kit/page.tsx`, `kit/page.test.tsx`, `marca-consistencia.test.tsx`, `kit.spec.ts`, `kit.feature.md`) e `git diff --diff-filter=D` não mostra nenhuma remoção.
- Commits `e1acd4e`, `f73f9ba`, `21060b6`, `5e9b42e`, `f30b0bf` e `0419918` estão no HEAD.
- Verificação do plano: `pnpm --filter @blog/web test` (21 arquivos, 337 testes), `lint`, `typecheck`, `build`, `HEADERS_OK`, `KIT_SECTIONS_OK`, `CSP_BUILT_OK`, `SMOKE_LOCAL_DEGRADED_OK`, `check:raw-html` (`RAW_HTML_OK`) e `format:check` passaram.

---
*Phase: 02-identidade-visual-no-law*
*Completed: 2026-11-28*
