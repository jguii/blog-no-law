---
phase: 02-identidade-visual-no-law
plan: 04
subsystem: ui
tags: [favicon, icons, sharp, ico, svg, nextjs-metadata, node-test, tdd]

requires:
  - phase: 02-identidade-visual-no-law
    provides: "sharp 0.35.5 como devDependency do @blog/web (02-01) e a arte dos dragões em components/dragon-mark.tsx"
provides:
  - "apps/web/app/icon.svg: favicon SVG dos dragões (arte pequena, viewBox 0 0 100 100, sem texto, script ou href)"
  - "scripts/brand/ico.mjs: encodeIco(), contêiner ICO com PNG embutido, só node:"
  - "scripts/brand/icons.mjs: gerador manual (sharp por createRequire, --out DIR, saída BRAND_ICONS_OK)"
  - "app/icon1.png 32x32, app/apple-icon.png 180x180, app/favicon.ico (16+32) e public/brand/icon-512.png 512x512 versionados"
  - "Leitores de cabeçalho no teste (IHDR do PNG, SOF do JPEG, diretório do ICO) que o 02-12 reaproveita"
affects: [02-12]

actuals:
  tokens: 6000
  tasks: 2
  commits: 4
plan_head_before: 49dd756172680987ac3fde66b49a3fba288e2239
plan_head_after: 30e26571ccf783ff34943ef2e2c0b99b9c0b1c2e

tech-stack:
  added: []
  patterns:
    - "Gerador de ativos de marca à mão em scripts/brand/ (raiz por import.meta.url, --out DIR, sharp por createRequire ancorado em apps/web/package.json); saídas versionadas, fora do build e da CI"
    - "Teste de ativos binários por leitura de cabeçalho (IHDR, SOF, diretório ICO), sem sharp; sharp só para rodar o gerador e olhar pixels e metadados da saída"
    - "Esqueleto de módulo no commit RED para a falha cair na asserção e não na carga do módulo"

key-files:
  created:
    - apps/web/app/icon.svg
    - apps/web/app/icon1.png
    - apps/web/app/apple-icon.png
    - apps/web/app/favicon.ico
    - apps/web/public/brand/icon-512.png
    - scripts/brand/ico.mjs
    - scripts/brand/ico.test.mjs
    - scripts/brand/icons.mjs
    - scripts/brand/icons.test.mjs
  modified: []

key-decisions:
  - "O ICO é montado em 40 linhas de node: (ICONDIR + ICONDIRENTRY + PNG embutido), sem pacote, com validação de tamanho 1..256, assinatura PNG e lista vazia"
  - "A arte é renderizada a partir do SVG com oversample de 2x (density) e reduzida pelo resize do sharp; o ícone do app e o de 512 são a arte sobre quadrado #000000 sem canal alfa"
  - "O sharp nunca recebe métodos que preservam metadados; o teste do gerador confere a ausência de EXIF pela saída"

patterns-established:
  - "scripts/brand/*.mjs com contrato para o 02-12: --out DIR (padrão apps/web), BRAND_*_OK e lista de arquivos com dimensões e peso"
  - "withTempDir assíncrono nos testes (await fn(dir) antes do rmSync no finally)"

requirements-completed: [VIS-02]

coverage:
  - id: D1
    description: "A aba do navegador mostra o favicon dos dragões: app/icon.svg, icon1.png 32x32 e favicon.ico (16 e 32) geram os link rel=icon no head"
    requirement: VIS-02
    verification:
      - kind: unit
        ref: "scripts/brand/icons.test.mjs#favicon SVG (viewBox, cores da marca, sem text/script/href/xlink)"
        status: pass
      - kind: integration
        ref: "pnpm --filter @blog/web build + grep em .next/server/app/_not-found.html (rel=icon icon.svg sizes=any, favicon.ico, icon1.png)"
        status: pass
    human_judgment: false
  - id: D2
    description: "O ícone do app é a arte dos dragões centralizada num quadrado #000000: apple-icon.png 180x180 (arte a 140px) e icon-512.png 512x512 (arte a 398px), com apple-touch-icon no head"
    requirement: VIS-02
    verification:
      - kind: unit
        ref: "scripts/brand/icons.test.mjs#gerador: o ícone do app é a arte centralizada num quadrado #000000"
        status: pass
      - kind: integration
        ref: "grep rel=apple-touch-icon em .next/server/app/_not-found.html"
        status: pass
    human_judgment: false
  - id: D3
    description: "Dimensões de todos os ícones versionados (16/32 no ICO, 32, 180, 512) provadas pelo cabeçalho dos arquivos, sem sharp, e nenhum PNG gerado carrega EXIF"
    requirement: VIS-02
    verification:
      - kind: unit
        ref: "scripts/brand/icons.test.mjs#arquivos versionados e #gerador: escreve os PNG e o ICO nos tamanhos certos, sem EXIF"
        status: pass
      - kind: unit
        ref: "scripts/brand/ico.test.mjs (6 casos do contêiner ICO)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Legibilidade da arte em 16 e 32px e o enquadramento visual em 180 e 512"
    requirement: VIS-02
    verification: []
    human_judgment: true
    rationale: "Conferido a olho pelo executor com a leitura de imagem, mas a avaliação de design final e a aba num navegador real sem favicon SVG ficam para o backstop pós-deploy do 02-09"

duration: 4min
completed: 2026-11-27
status: complete
---

# Phase 2 Plan 04: Favicon e ícones do app dos dragões Summary

**Favicon SVG dos dragões e PNG 32/180/512 mais ICO 16+32 gerados por um script `sharp` testado, com o contêiner ICO montado sem pacote e todos os tamanhos provados pelo cabeçalho dos arquivos versionados.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-11-28T01:54:42Z
- **Completed:** 2026-11-28T01:58:13Z
- **Tasks:** 2 (tracer e auto, cada uma com RED e GREEN)
- **Files modified:** 9 (todos criados)

## Accomplishments

- `app/icon.svg` com a arte pequena do esboço 002 (os mesmos `d`, `cx`, `cy`, `r`, `rx`, `ry`, `transform`), sem `<text`, `<script`, `href` nem `xlink` (T-02-11 mitigada e testada). O build do Next emite `rel="icon"` com `sizes="any"` para ele.
- `scripts/brand/ico.mjs` (`encodeIco`) e `scripts/brand/icons.mjs` (`node scripts/brand/icons.mjs [--out DIR]`, saída `BRAND_ICONS_OK`); o gerador roda à mão, as saídas são versionadas e nada entra no build da Vercel nem na CI (só o teste dele, em diretório temporário).
- O `<head>` do build tem `icon` (favicon.ico 32x32, icon.svg `sizes="any"`, icon1.png 32x32) e `apple-touch-icon` 180x180.
- 11 testes em `scripts/brand/` (6 do ICO, 5 dos ícones); `pnpm run test:scripts` com 74 verdes, `check:raw-html` com `RAW_HTML_OK` e `format:check` limpo.

Peso dos arquivos versionados:

| Arquivo | Dimensões | Bytes |
|---|---|---|
| `apps/web/app/icon.svg` | viewBox 100x100 | 709 |
| `apps/web/app/icon1.png` | 32x32 | 1269 |
| `apps/web/app/apple-icon.png` | 180x180 | 5977 |
| `apps/web/app/favicon.ico` | 16x16 + 32x32 | 1920 |
| `apps/web/public/brand/icon-512.png` | 512x512 | 19863 |

Conferência visual (leitura de imagem): a arte (círculo vermelho/preto com os dois dragões e aro dourado) está centrada no quadrado preto em 180 e 512, com cantos `#000000`; em 16px (ampliado por vizinho mais próximo) o disco com a divisão vermelho/preto e o aro dourado ainda são distinguíveis; em 32px a forma dos dragões aparece.

## Task Commits

1. **Task 1 (tracer): favicon dos dragões**
   - RED `4f20572` (test) - teste do SVG (viewBox, três cores, sem text/script/href/xlink)
   - GREEN `d66d66f` (feat) - `apps/web/app/icon.svg`
2. **Task 2: PNG, ICO e ícone do app**
   - RED `66b18d2` (test) - testes do ICO e do gerador, com esqueleto de `ico.mjs`
   - GREEN `30e2657` (feat) - `ico.mjs`, `icons.mjs` e os 4 arquivos gerados

**Plan metadata:** commit `docs(02-04)` seguinte a este arquivo.

## TDD Gate Compliance

- **RED (tarefa 1):** alvo `favicon SVG: arte dos dragões em 100x100, ...` em `scripts/brand/icons.test.mjs`; `gsd check tdd-red-evidence` devolveu `RED_EVIDENCE_OK` (`target_test_failed`, TAP, 1 teste falhando). `semanticAssessment`: o alvo executou e falhou na asserção planejada (`apps/web/app/icon.svg precisa existir`), pelo motivo certo (arquivo ainda inexistente), sem erro de carga ou sintaxe.
- **RED (tarefa 2):** alvo `lança erro para tamanho fora de 1..256 ou não inteiro` em `scripts/brand/ico.test.mjs`; `RED_EVIDENCE_OK` (`target_test_failed`, 9 de 11 testes falhando por asserção). `semanticAssessment`: falhou em `Missing expected exception: tamanho 0`, a asserção planejada, porque o esqueleto devolve um buffer vazio.
- **GREEN:** `d66d66f` e `30e2657` vieram depois dos respectivos `test(02-04)`; suíte `node --test scripts/brand/` com 11 verdes.
- **REFACTOR:** nenhum (sem mudança necessária).

## Files Created/Modified

- `apps/web/app/icon.svg` - favicon SVG, fonte versionada de todos os ícones (D-01)
- `scripts/brand/ico.mjs` - `encodeIco()`: ICONDIR + ICONDIRENTRY + PNG embutido, só `node:`
- `scripts/brand/ico.test.mjs` - cabeçalho, entradas, dados, tamanho 256 e validações do ICO
- `scripts/brand/icons.mjs` - gerador dos PNG e do ICO a partir do SVG (sharp por `createRequire`)
- `scripts/brand/icons.test.mjs` - SVG, leitores de cabeçalho (IHDR/SOF/ICO), gerador em diretório temporário e arquivos versionados
- `apps/web/app/icon1.png`, `apps/web/app/apple-icon.png`, `apps/web/app/favicon.ico`, `apps/web/public/brand/icon-512.png` - saídas versionadas

## Decisions Made

- ICO sem pacote, com validação estrita (tamanho inteiro 1..256, assinatura PNG, lista não vazia); tamanho 256 vira o byte 0, como manda o formato.
- O ícone do app (180 e 512) usa fundo sólido `#000000` sem canal alfa, para o sistema operacional não compor o ícone sobre um fundo próprio.
- O teste do gerador confere pixels (cantos pretos, aro dourado) além das dimensões, para provar o enquadramento da arte e não só o tamanho do arquivo.
- O teste inclui `readJpegSize` (SOF) exercitado contra um JPEG gerado pelo `sharp`, para o 02-12 reaproveitar o leitor com a garantia de que ele funciona.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Esqueleto de `ico.mjs` no commit RED**
- **Found during:** Task 2 (RED)
- **Issue:** com o módulo inexistente o teste falha na carga (`Cannot find module`), que o classificador trata como INVALID_RED (`fixture_or_load_failure`).
- **Fix:** o commit `test(02-04)` inclui um `ico.mjs` com `encodeIco` sem comportamento (devolve buffer vazio); o GREEN o substitui. O `icons.mjs` não precisou de esqueleto: o teste o roda por `spawnSync` e falha na asserção do status.
- **Files modified:** `scripts/brand/ico.mjs`
- **Verification:** `RED_EVIDENCE_OK`.
- **Committed in:** `66b18d2`

**2. [Rule 1 - Bug] `withTempDir` removia o diretório antes do fim do teste assíncrono**
- **Found during:** Task 2 (GREEN)
- **Issue:** o auxiliar de teste era síncrono e o `finally` apagava o diretório temporário na primeira espera, quebrando o teste do gerador (`apple-icon.png precisa existir`).
- **Fix:** `withTempDir` virou `async` com `return await fn(dir)`.
- **Files modified:** `scripts/brand/icons.test.mjs`
- **Verification:** `node --test scripts/brand/` com 11 verdes.
- **Committed in:** `30e2657`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** nenhuma mudança de escopo; a primeira torna o RED válido para o gate, a segunda era um erro do próprio teste.

## Issues Encountered

- O sandbox recusa `$(git ...)` e compostos; os comandos de guarda foram divididos em chamadas simples. O ledger `gsd-plan-head-before-02-04` e o sentinela de cwd foram gravados no diretório git do worktree, e `commits` foi medido contra a base `49dd756`.
- O Next serve `favicon.ico` com `sizes="32x32"` no `<link>` (a leitura do arquivo ICO pelo Next declara só um tamanho); o arquivo contém 16 e 32, como o teste prova pelo diretório.

## Known Stubs

Nenhum.

## Threat Flags

Nenhum. Não há endpoint, caminho de autenticação nem acesso a arquivo novo em runtime: só ativos estáticos e um script manual que lê o SVG do repositório e escreve arquivos versionados. A ameaça T-02-11 (SVG com script ou referência externa) está mitigada e coberta pelo teste.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- O 02-12 (onda 3) segue o contrato deste script: `--out DIR` (padrão `apps/web`), `sharp` por `createRequire`, `BRAND_*_OK` e os leitores de cabeçalho do `icons.test.mjs`; o manifesto dele declara `/brand/icon-512.png`, que já existe.
- A conferência do favicon num navegador real sem suporte a SVG e a aparência do ícone no celular ficam para o backstop pós-deploy do 02-09 (o Playwright não abre o Chromium neste WSL).

## Self-Check: PASSED

- Arquivos conferidos no disco e versionados (`git ls-files` lista os 4 gerados): `apps/web/app/icon.svg`, `icon1.png`, `apple-icon.png`, `favicon.ico`, `apps/web/public/brand/icon-512.png`, `scripts/brand/ico.mjs`, `ico.test.mjs`, `icons.mjs`, `icons.test.mjs`.
- Commits conferidos (todos ancestrais do HEAD): `4f20572`, `d66d66f`, `66b18d2`, `30e2657`; `git rev-list --count 49dd756..HEAD` = 4.
- Critérios de aceite: `grep -cE '<text|<script|href' icon.svg` = 0; `grep -cE 'withMetadata|keepExif|keepMetadata|unlimited' icons.mjs` = 0; `grep -c createRequire icons.mjs` = 2; cada `test(02-04)` antecede o `feat(02-04)` da tarefa.
- Verificação final: `node --test scripts/brand/` (11 verdes), `pnpm --filter @blog/web build` com `rel="icon"`, `favicon.ico`, `icon1.png` e `apple-touch-icon` no `_not-found.html`, `pnpm run test:scripts` (74 verdes), `check:raw-html` (`RAW_HTML_OK`) e `format:check` limpo.

---
*Phase: 02-identidade-visual-no-law*
*Completed: 2026-11-27*
