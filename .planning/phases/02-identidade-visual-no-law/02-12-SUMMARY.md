---
phase: 02-identidade-visual-no-law
plan: 12
subsystem: ui
tags: [sharp, opengraph, metadata, manifest, brand-assets, nextjs, playwright, bdd]

requires:
  - phase: 02-identidade-visual-no-law
    provides: "02-01 sharp@0.35.5 como devDependency do @blog/web; 02-04 icon-512.png, apple-icon.png e o padrão de script scripts/brand/icons.mjs; 02-11 lib/site.ts (SITE, siteMetadata, siteViewport)"
provides:
  - "Open Graph padrão 1200x630 (app/opengraph-image.jpg + .alt.txt) com URL absoluta via metadataBase"
  - "resolveSiteUrl(): metadataBase só de NEXT_PUBLIC_SITE_URL https válida, senão https://blog-no-law.vercel.app"
  - "public/brand/emblema.png (600x600 RGBA) e public/brand/banner.jpg (1500x500) para a capa (02-14)"
  - "app/manifest.ts com os ícones de 512 e 180"
  - "BDD docs/bdd/marca.feature.md e E2E e2e/marca.spec.ts (favicon, preview, manifesto)"
affects: [02-14 capa, 02-09 CI e conferência pós-deploy]

actuals:
  tokens: 5700
  tasks: 3
  commits: 6
plan_head_before: ebc443b88dc6146740824f761fe30c26b8f95d80
plan_head_after: fa8e44a534bd7d268de6feb012c362ad6f1010fd

tech-stack:
  added: []
  patterns:
    - "Gerador de ativos versionado, rodado à mão (images.mjs), com --out DIR, sharp via createRequire ancorado em apps/web/package.json e saída BRAND_IMAGES_OK"
    - "Teste do gerador lê cabeçalhos (IHDR, SOF) dos arquivos versionados sem depender do sharp"
    - "Convenção de arquivo opengraph-image.jpg do Next + metadataBase para og:image absoluto"

key-files:
  created:
    - scripts/brand/images.mjs
    - scripts/brand/images.test.mjs
    - apps/web/lib/site.test.ts
    - apps/web/app/opengraph-image.jpg
    - apps/web/app/opengraph-image.alt.txt
    - apps/web/public/brand/emblema.png
    - apps/web/public/brand/banner.jpg
    - apps/web/app/manifest.ts
    - apps/web/app/manifest.test.ts
    - docs/bdd/marca.feature.md
    - apps/web/e2e/marca.spec.ts
  modified:
    - apps/web/lib/site.ts

key-decisions:
  - "OG recortado do banner escalado a 1890x630 com left 348: a janela 348-1547 fica entre as duas nuvens (esquerda termina em x=345, direita começa em x=1548, medido por pixel) e mantém emblema e slogan inteiros"
  - "Emblema com extract 600x600 em left 212, top 170 e máscara circular r300 (parâmetros do plano, sem ajuste)"
  - "Teste do círculo do emblema checa os cantos transparentes e a borda opaca em (300,5) e (5,300), o que fixa o raio em 300"

requirements-completed: [VIS-02]

coverage:
  - id: D1
    description: "og:image absoluto (https) de 1200x630 com alt, siteName, locale e type no head de qualquer página, via metadataBase"
    requirement: VIS-02
    verification:
      - kind: unit
        ref: "apps/web/lib/site.test.ts#resolveSiteUrl e siteMetadata"
        status: pass
      - kind: integration
        ref: "pnpm --filter @blog/web build + grep do head pré-renderizado de _not-found.html"
        status: pass
    human_judgment: false
  - id: D2
    description: "metadataBase só aceita URL https válida; qualquer outro valor cai no domínio de produção (T-02-10)"
    requirement: VIS-02
    verification:
      - kind: unit
        ref: "apps/web/lib/site.test.ts#recusa http: / javascript: / não é URL"
        status: pass
    human_judgment: false
  - id: D3
    description: "Gerador images.mjs escreve OG, alt, emblema e banner sem EXIF, com dimensões e alfa conferidos"
    requirement: VIS-02
    verification:
      - kind: unit
        ref: "scripts/brand/images.test.mjs (6 testes)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Arquivos versionados (OG 1200x630 < 500 KB, emblema PNG 600x600 RGBA, banner JPEG 1500x500) têm formato e dimensões lidos do cabeçalho"
    requirement: VIS-02
    verification:
      - kind: unit
        ref: "scripts/brand/images.test.mjs#arquivos versionados"
        status: pass
    human_judgment: false
  - id: D5
    description: "Manifesto declara nome, idioma, cores e os ícones de 512 e 180"
    requirement: VIS-02
    verification:
      - kind: unit
        ref: "apps/web/app/manifest.test.ts"
        status: pass
    human_judgment: false
  - id: D6
    description: "Cenários BDD e E2E da marca (favicon, preview do link, ícone do app) escritos; E2E lista 3 testes e roda na CI pelo 02-09"
    requirement: VIS-02
    verification:
      - kind: e2e
        ref: "playwright test --list e2e/marca.spec.ts (3 tests in 1 file); execução real na CI"
        status: unknown
    human_judgment: false
  - id: D7
    description: "Aparência do emblema recortado e do preview (círculo limpo, sem fragmento de nuvem na borda, emblema e slogan inteiros); aprovação do autor pedida pela D-01"
    verification: []
    human_judgment: true
    rationale: "Qualidade visual de um recorte de arte; nenhum teste afirma o que o olho vê. O preview real no Discord e no WhatsApp depende do crawler de cada app e fica como @manual no 02-09."

duration: 35min
completed: 2026-11-28
status: complete
---

# Phase 2 Plan 12: Open Graph, emblema e banner da marca Summary

**Open Graph 1200x630 recortado do banner com URL absoluta via `metadataBase` (https validado), emblema circular RGBA e banner da capa gerados por um script `sharp` testado e versionado, mais manifesto com os ícones de 512 e 180 e cenários BDD/E2E da marca.**

## Performance

- **Duration:** 35 min
- **Started:** 2026-11-28T11:43:00Z (aprox.)
- **Completed:** 2026-11-28T12:18:33Z
- **Tasks:** 3 (1 tracer + 2 auto, todas TDD)
- **Files modified:** 12 (11 novos, 1 alterado)

## Accomplishments

- Compartilhar qualquer página gera `og:image` absoluto (`https://blog-no-law.vercel.app/opengraph-image.jpg?...`), com `og:image:width` 1200, `height` 630, `alt` exato, `og:site_name` "Blog No Law", `og:locale` `pt_BR` e `og:type` `website` (conferido no head pré-renderizado do build).
- `resolveSiteUrl` aceita só `https:` válido em `NEXT_PUBLIC_SITE_URL`; ausente, vazio, `http:`, `javascript:` ou texto solto caem em `https://blog-no-law.vercel.app` sem quebrar o build.
- `scripts/brand/images.mjs` gera OG, alt, emblema e banner; nenhuma saída tem EXIF e o arquivo não usa os métodos do `sharp` que preservam metadados.
- Manifesto `/manifest.webmanifest` (`<link rel="manifest">` presente no head) com o ícone de 512 e o de 180.
- BDD `docs/bdd/marca.feature.md` e E2E `e2e/marca.spec.ts` (3 cenários, listados pelo Playwright).

## Parâmetros finais e pesos

- **OG:** banner redimensionado para 1890x630 (`fit: 'fill'`), `extract` `left 348, top 0, 1200x630`, JPEG qualidade 82, **127.456 bytes** (limite 500 KB). Conferido a olho: emblema e slogan inteiros, sem fragmento de nuvem em nenhuma das bordas. Com `left` 350 sobrava um fio vermelho da nuvem direita; com 346, um da esquerda; 348 limpa os dois lados.
- **Emblema:** `extract` `left 212, top 170, 600x600` do logo, máscara SVG circular `r 300` com `blend: 'dest-in'`, PNG RGBA, **649.972 bytes**.
- **Banner:** o banner 1500x500 reencodado em JPEG qualidade 82, **135.072 bytes**.

## Task Commits

1. **Task 1 (tracer): OG com URL absoluta** — RED `c05f361` (test), GREEN `009127f` (feat)
2. **Task 2: emblema recortado e banner** — RED `74f960e` (test), GREEN `6b34093` (feat)
3. **Task 3: manifesto, BDD e E2E** — RED `712c580` (test), GREEN `fa8e44a` (feat)

**Plan metadata:** commit `docs(02-12)` com este SUMMARY.

## TDD Gate Compliance

Os três pares RED -> GREEN estão presentes, na ordem (`test(02-12)` antes de `feat(02-12)` em cada tarefa).

- **RED 1:** `lib/site.test.ts` falhou em 8 de 9 casos por asserção (ex.: `expected 'http://esqueleto.invalid/' to be 'https://blog-no-law.vercel.app/'`, `expected undefined to be an instance of URL`); `images.test.mjs` falhou em `assert.equal(result.status, 0)` e em "`opengraph-image.jpg` precisa existir". Avaliação semântica: o alvo executou e falhou pela razão planejada. Um esqueleto mínimo de `resolveSiteUrl` entrou no commit RED para a falha ser de asserção e não de `TypeError`.
- **RED 2:** três testes falharam com "o gerador precisa escrever public/brand/emblema.png" e "emblema.png precisa existir". Primeira versão lançava `ENOENT` de `fs.readFileSync`; foi trocada por `readOutput` com `assert.ok(existsSync)` antes do commit, para a falha ser de asserção.
- **RED 3:** `manifest.test.ts` falhou em 3 de 3 por asserção contra um esqueleto de `manifest.ts` que devolve só `{ name: '' }`.
- **Classificador `gsd_run check tdd-red-evidence` não foi executado** (o resolvedor do gsd-tools não está no worktree e os relatórios não foram persistidos em registro JSON); a avaliação semântica acima foi feita à mão. Registrado como desvio de processo, sem efeito nos commits.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Tipo de `metadataBase` no teste**
- **Found during:** Task 1 (build)
- **Issue:** `siteMetadata.metadataBase?.protocol` não compila (`string | URL | null`); o `next build` falhou no typecheck.
- **Fix:** o teste lê `new URL(String(siteMetadata.metadataBase)).protocol`.
- **Files modified:** `apps/web/lib/site.test.ts`
- **Committed in:** `009127f`

**2. [Rule 3 - Blocking] Esqueletos nos commits RED**
- **Found during:** Tasks 1 e 3
- **Issue:** import de módulo inexistente seria `INVALID_RED` (fixture_or_load_failure).
- **Fix:** esqueleto mínimo de `resolveSiteUrl` (em `lib/site.ts`) e de `manifest.ts`, substituídos no GREEN.
- **Committed in:** `c05f361`, `712c580`

**3. [Processo] Ledger de commits do plano não gravado**
- O sandbox recusou escrever em `.git/worktrees/<id>/` (e comandos compostos com `$(git ...)`), então o arquivo `gsd-plan-head-before-02-12` não foi criado. A base foi registrada a partir do SHA do `worktree_branch_check` (`ebc443b`) e a contagem `commits: 6` foi medida com `git rev-list --count ebc443b..HEAD`.

---

**Total deviations:** 3 (1 bug, 1 bloqueio, 1 de processo)
**Impact on plan:** nenhum impacto em escopo; o comportamento entregue é o do plano.

## Decisions Made

- `left` do OG em 348, medido por pixel (ver parâmetros acima), em vez do 350 estimado.
- Emblema nos parâmetros nominais do plano (`left 212, top 170, r 300`). Mover `top` para 150 trocou as pontas de nuvem do rodapé por um respingo vermelho no topo, pior, então ficou o padrão.

## Issues Encountered

- **Pontas de nuvem no rodapé do emblema (para o autor decidir, D-01):** o logo original desenha as duas nuvens vermelhas na frente do anel, então o recorte circular mostra duas pequenas pontas vermelhas na borda inferior (esquerda perto de x 100-160, direita perto de x 520). Não há círculo que mantenha o anel inteiro e exclua as nuvens. O recorte limpa o pergaminho e o respingo de tinta de fora. Se o autor preferir sem as pontas, a saída é um raio menor no gerador (e o teste do raio ajustado) ou arte sem nuvens.
- O anel preto externo fica levemente cortado nas laterais (a arte tem raio ~315 e a máscara 300, dentro dos 20 px que o plano permitia). O dragão preenche a borda.
- `next build` baixa fontes do Google; funcionou de primeira desta vez.
- Chromium do Playwright não roda neste WSL: o E2E foi só listado (`Total: 3 tests in 1 file`); a execução real é na CI (02-09).

## Verificação

- `node --test scripts/brand/`: 17 de 17 verdes (inclui os do 02-04).
- `pnpm run test:scripts`: 80 de 80; `pnpm --filter @blog/web test`: 242 de 242 (14 arquivos).
- `lint`, `typecheck`, `check:raw-html` (`RAW_HTML_OK`) e `format:check` verdes.
- Build: head pré-renderizado tem `og:image` https, `og:image:width` 1200, `og:site_name`, `og:locale`; rota `/manifest.webmanifest` gerada e `<link rel="manifest">` no head.
- `grep -cE 'withMetadata|keepExif|keepMetadata|unlimited' scripts/brand/images.mjs` = 0.
- Tracer gate: `<verify>` só automatizado, reexecutado de ponta a ponta e passou antes da expansão ("Tracer verified end-to-end").

## User Setup Required

None - nenhuma configuração externa. A variável opcional `NEXT_PUBLIC_SITE_URL` (https) será documentada no runbook pelo 02-09; sem ela vale `https://blog-no-law.vercel.app`.

## Known Stubs

Nenhum.

## Threat Flags

Nenhuma superfície nova além da registrada: T-02-09 (EXIF) e T-02-10 (`metadataBase` https) mitigados e testados.

## Next Phase Readiness

- O 02-14 (capa) pode usar `/brand/emblema.png` (600x600) e `/brand/banner.jpg` (1500x500).
- O 02-09 deve rodar `e2e/marca.spec.ts` na CI e conferir o preview real no Discord e no WhatsApp (`@manual`), além do emblema.
- `VIS-02` não foi marcado em REQUIREMENTS.md aqui (outros planos da fase podem declará-lo; o orquestrador aplica a regra do ID compartilhado).

## Self-Check: PASSED

Arquivos conferidos com `[ -f ]`; commits conferidos com `git merge-base --is-ancestor`.

---
*Phase: 02-identidade-visual-no-law*
*Completed: 2026-11-28*
