---
phase: 02-identidade-visual-no-law
plan: 07
subsystem: ui
tags: [nextjs, app-router, rsc, vitest, playwright, bdd, smoke]

requires:
  - phase: 02-identidade-visual-no-law
    provides: "Button/Card/cn (02-03), tokens e utilitários de tipografia (02-10), layout com <main id=conteudo>, SITE e cabeçalho/rodapé de tinta (02-11)"
provides:
  - "Capa estática do clã em / (rótulo, slogan h1, parágrafo, CTAs Conheça o clã / Leia as regras), sem chamar a API"
  - "Status técnico em /status (force-dynamic, noindex, Card, dl, mesmos data-testid, estado indisponível com Recarregar status)"
  - "Integração, E2E, smoke local, BDD e runbook de produção movidos para /status"
affects: [02-09, 02-14, 02-08]

actuals:
  tokens: 14000
  tasks: 2
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Link com cara de botão: buttonVariants() + cn() em next/link, empilhando com max-[480px]:w-full"
    - "data-testid sempre como último atributo do elemento (as asserções de HTML conferem data-testid=\"x\">valor<)"

key-files:
  created:
    - apps/web/app/page.test.tsx
    - apps/web/e2e/status.spec.ts
    - docs/bdd/status.feature.md
  modified:
    - apps/web/app/page.tsx
    - apps/web/app/status/page.tsx
    - apps/web/test/status.int-spec.ts
    - scripts/smoke-local.sh
    - docs/runbooks/deploy.md
    - apps/web/e2e/helpers.ts
    - apps/web/playwright.config.ts
    - apps/web/app/layout.test.tsx

key-decisions:
  - "A capa fica sem async, sem export dynamic e sem importar lib/api, então o Next a pré-renderiza como HTML estático (COVER_STATIC_OK) e ela abre com a API fora do ar"
  - "O renomear de app/page.tsx para app/status/page.tsx e de home.int-spec para status.int-spec foi um commit refactor puro anterior ao RED, para git log --follow preservar o histórico da home antiga"
  - "Recarregar status e Ocultar detalhes usam o estilo de link em texto (text-link, sublinhado com offset de 4px), não botão"

patterns-established:
  - "Rota técnica fora do menu: metadata.robots noindex + force-dynamic + Card centralizado max-w-190"

requirements-completed: [UX-01]

coverage:
  - id: D1
    description: "Capa estática do clã em / com rótulo, slogan, parágrafo e dois CTAs, sem chamar a API"
    requirement: UX-01
    verification:
      - kind: unit
        ref: "apps/web/app/page.test.tsx#capa do clã em /"
        status: pass
      - kind: other
        ref: "bash scripts/smoke-local.sh --degraded (SMOKE_LOCAL_DEGRADED_OK) + COVER_STATIC_OK"
        status: pass
    human_judgment: true
    rationale: "O visual da capa (espaçamento, hierarquia, CTAs empilhados abaixo de 480px nos dois temas) só é julgado por uma pessoa; a prova de acessibilidade e de rolagem horizontal vem do 02-09 e do 02-14"
  - id: D2
    description: "Status técnico em /status com visual novo, noindex, force-dynamic e os mesmos data-testid"
    requirement: UX-01
    verification:
      - kind: integration
        ref: "apps/web/test/status.int-spec.ts (5 testes contra o servidor de contrato)"
        status: pass
      - kind: other
        ref: "stub do contrato + next start: /status e /status?detail=full conferidos com curl"
        status: pass
    human_judgment: true
    rationale: "A aparência do card e da lista de definição no celular e no desktop é julgada por uma pessoa"
  - id: D3
    description: "E2E, BDD, smoke e runbook apontam para /status"
    verification:
      - kind: other
        ref: "playwright test --list e2e/status.spec.ts (4 testes) + ROUTE_MOVE_OK"
        status: pass
      - kind: other
        ref: "bash scripts/smoke-local.sh (modo normal com Postgres do compose)"
        status: unknown
    human_judgment: false

duration: 25min
completed: 2026-11-28
status: complete
plan_head_before: ebc443b88dc6146740824f761fe30c26b8f95d80
plan_head_after: 057e1e121d7587685c99b76149a23a718d53fca1
---

# Phase 2 Plan 07: Capa estática em `/` e status técnico em `/status` Summary

**A home virou a capa estática do clã (slogan, rótulo, parágrafo e dois CTAs, sem chamar a API) e o status técnico foi para `/status` com card, `dl` em duas colunas, noindex e estado degradado com "Recarregar status", com integração, smoke, E2E, BDD e runbook movidos junto.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-11-28T12:10:00Z
- **Completed:** 2026-11-28T12:35:00Z
- **Tasks:** 2
- **Files modified:** 12 (3 criados, 9 alterados ou movidos)

## Accomplishments

- `/` é uma capa estática: `Home` sem `async`, sem `dynamic` e sem `lib/api`; o build lista `○ /` (estático) e `ƒ /status` (dinâmico), e `index.html` traz o slogan (`COVER_STATIC_OK`).
- `/status` mantém `force-dynamic`, a regra `detail === 'full'` e todos os `data-testid`, ganha `Card`, `h1` "Status do serviço", `dl` em duas colunas, `code` com `wrap-anywhere` e `robots` noindex/nofollow (conferido no HTML real).
- Estado degradado: "API indisponível no momento" (`role="status"`), "A API pode estar iniciando; tente de novo em alguns minutos." e o link "Recarregar status" para `/status`; o `getStatus` e o timeout de 5 s da Fase 1 ficaram intactos.
- Tudo que dependia da rota antiga foi movido: `status.int-spec.ts`, `e2e/status.spec.ts` (4 cenários, incluindo "Recarregar status"), `docs/bdd/status.feature.md`, `scripts/smoke-local.sh` (normal e `--degraded`, com a capa conferida nos dois) e a checagem de produção do runbook.

## Task Commits

1. **Rename puro (preparação do RED)** - `4aba04a` (refactor): `app/page.tsx` para `app/status/page.tsx` e `test/home.int-spec.ts` para `test/status.int-spec.ts`, sem mudar conteúdo, para `git log --follow` seguir a história.
2. **Task 1 RED: testes da capa e do /status** - `65b7e19` (test)
3. **Task 1 GREEN: capa estática, /status novo e smoke** - `45024f8` (feat)
4. **Task 2: E2E, BDD e runbook em /status** - `057e1e1` (test)

**Plan metadata:** commit `docs(02-07)` com este SUMMARY (logo após).

## TDD Gate Compliance

- **RED:** `test(02-07)` `65b7e19` antes do `feat(02-07)` `45024f8`. Evidência real com `vitest --reporter=tap-flat`, validada por `gsd-tools check tdd-red-evidence`: `RED_EVIDENCE_OK` (`target_test_failed`) nos dois alvos. `status.int-spec.ts`: 5 de 5 falharam em asserção (o link ainda era `/?detail=full`, sem "Recarregar status"). `page.test.tsx`: 6 de 7 falharam em asserção contra o esqueleto `return null` (o sétimo, "não chama a API", passa por construção). Avaliação semântica: os alvos executaram e falharam pelo motivo planejado, não por carga, sintaxe ou fixture.
- **GREEN:** `45024f8`, todos os testes passam (int 5/5, unit 237/237 do web).
- **REFACTOR:** nenhum (nada a limpar).
- O esqueleto de `app/page.tsx` e o ajuste do import para `@/lib/api` entraram no commit RED só para os alvos carregarem e falharem em asserção.

## Files Created/Modified

- `apps/web/app/page.tsx` - capa estática (rótulo, `h1` com `SITE.slogan`, parágrafo, CTAs com `buttonVariants`)
- `apps/web/app/status/page.tsx` - status técnico movido com `git mv`, visual novo, metadata noindex
- `apps/web/app/page.test.tsx` - 7 testes da capa (um `h1`, rótulo, parágrafo, CTAs, empilhamento, sem API)
- `apps/web/test/status.int-spec.ts` - integração contra o servidor de contrato real, agora de `/status`
- `apps/web/e2e/status.spec.ts` - E2E com `expectNoAxeViolations` do `./helpers` e o servidor degradado em `:3202/status`
- `docs/bdd/status.feature.md` - quatro cenários (inclui "Recarregar status")
- `scripts/smoke-local.sh` - confere `/status`, `/status?detail=full` e `/` nos dois modos
- `docs/runbooks/deploy.md` - checagem de produção em `/status` e nota histórica da prova de 2026-11-21
- `apps/web/e2e/helpers.ts`, `apps/web/playwright.config.ts`, `apps/web/app/layout.test.tsx` - só comentários que citavam `home.*`

## Decisions Made

- Atributo `data-testid` como último atributo de cada elemento, porque a integração e o smoke conferem `data-testid="api-commit">sha<` (a ordem importa depois que o `class` entra).
- `Home` da capa usa `{`Clã do SA-MP · desde ${SITE.foundedYear}`}` (uma única string) para o Next não separar o ano com comentário de hidratação.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Comentários que ainda citavam os arquivos `home.*`**
- **Found during:** Task 2 (verificação `ROUTE_MOVE_OK`)
- **Issue:** o `git grep` do plano falhava por menções em `apps/web/app/layout.test.tsx`, `apps/web/e2e/helpers.ts` e `apps/web/playwright.config.ts`, arquivos fora de `files_modified`
- **Fix:** troca só de comentário (`home.int-spec` para `status.int-spec`, `home.feature.md` para `*.feature.md`, texto do helper do axe)
- **Files modified:** os três arquivos acima
- **Verification:** `ROUTE_MOVE_OK`, lint, typecheck e prettier verdes
- **Committed in:** `057e1e1`

**2. [Estrutura] Commit de rename puro antes do RED**
- Não prevista no plano: um `refactor(02-07)` só com os `git mv`, para `git log --follow --format=%h -- apps/web/app/status/page.tsx` listar a história da antiga home (o critério de aceite). O RED recria `app/page.tsx` como esqueleto, o que, no mesmo commit do rename, faria o git ver um arquivo novo em vez de um rename.

---

**Total deviations:** 1 auto-fixed (1 blocking), 1 ajuste de estrutura de commits
**Impact on plan:** sem mudança de escopo; só comentários extras e um commit a mais.

## Issues Encountered

- **Smoke normal (`bash scripts/smoke-local.sh`) não rodou aqui:** este WSL não tem `docker`, então o Postgres do `compose.test.yaml` não sobe. Para não deixar o modo normal sem prova, subi um servidor stub do contrato da API e o `next start` compilado e conferi com `curl` exatamente o que o smoke confere: `/status` 200 com `data-testid="api-commit">abc1234<` e `data-testid="api-db">up<`; `/status?detail=full` com `href="/status"` e `api-db-latency`; `robots` `noindex, nofollow`; `/` sem `api-commit`. A execução completa com Postgres real fica para a CI (o `ci-ok` roda o E2E e o smoke contra o banco).
- **Playwright/Chromium:** não executa neste WSL (bibliotecas do sistema); `playwright test --list` compilou o spec (4 testes). A execução real (incluindo axe) fica para a CI do 02-09.
- Processos em segundo plano (stub da API na 3301 e `next start` na 3300) ficaram rodando, porque `pkill` foi negado pelo classificador de permissões; somem com o fim da sessão e não tocam arquivos rastreados.

## Known Stubs

Nenhum stub de dados. A capa é propositalmente sem emblema, banner, pétalas e traço de pincel: o plano 02-14 (onda 4) os acrescenta sem mudar o conteúdo, e o smoke e o `page.test.tsx` já cobrem o conteúdo final da D-06.

## Threat Flags

Nenhum. `T-02-17` (timeout de 5 s, página nunca lança, capa independente da API) e `T-02-18` (só `detail=full` muda o comportamento) estão cobertos pela integração; `T-02-16` aceito, com o noindex já presente.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- O 02-14 pode vestir a capa e escrever `docs/bdd/capa.feature.md`; `page.test.tsx` e o smoke já cobrem o texto final.
- O 02-08 acrescenta o `X-Robots-Tag` do `/status`; o 02-09 roda o axe e a prova de rolagem horizontal em `/status`.
- UX-01 aparece como bloqueado em `requirements.ready-ids` (outros planos da fase também o declaram), então `requirements mark-complete` não foi chamado aqui; fica para o orquestrador/plano final.

---
*Phase: 02-identidade-visual-no-law*
*Completed: 2026-11-28*

## Self-Check: PASSED

- Arquivos: `apps/web/app/page.tsx`, `apps/web/app/status/page.tsx`, `apps/web/app/page.test.tsx`, `apps/web/test/status.int-spec.ts`, `apps/web/e2e/status.spec.ts`, `docs/bdd/status.feature.md`, `scripts/smoke-local.sh`, `docs/runbooks/deploy.md` existem.
- Commits `4aba04a`, `65b7e19`, `45024f8`, `057e1e1` estão na branch; `git log --follow` de `app/status/page.tsx` lista a história da home antiga.
- Critérios de aceite: sem `/?detail=full` em `apps/web/app`, `apps/web/test` e `scripts`; `force-dynamic` presente; `getStatus|lib/api` ausentes de `app/page.tsx`; `test(02-07)` antes de `feat(02-07)`; `3202/status` em `status.spec.ts`; Dado/Quando/Então em todos os cenários do BDD.
