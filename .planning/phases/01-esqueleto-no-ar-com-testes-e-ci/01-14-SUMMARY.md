---
phase: 01-esqueleto-no-ar-com-testes-e-ci
plan: 14
subsystem: testing
tags: [node-test, security-gate, postgrest, xss, ci-scripts, tdd]

requires:
  - phase: 01-esqueleto-no-ar-com-testes-e-ci
    provides: "apps/web com a regra react/no-danger (01-03) e scripts/smoke-postgrest.sh com o modo de produção (01-06)"
provides:
  - "scripts/check-no-raw-html.mjs: gate de HTML bruto em apps/web com allowlist explícita e vazia (SEC-03)"
  - "scripts/smoke-postgrest.sh com POSTGREST_URL, TABLES e modo estrito POSTGREST_STRICT=1 (SEC-04, D-14)"
  - "11 testes node:test (scripts/) sem banco, sem rede externa e sem pacote npm"
affects: [01-09, 01-08, phase-06-json-ld]

actuals:
  tokens: 9500
  tasks: 2
  commits: 4

plan_head_before: fc43cf11b3a7d1e81b67317d1c4e20361894cde8
plan_head_after: c89d6dbe7c87a3f23cbfdc650429aa8a0c10846a

tech-stack:
  added: []
  patterns:
    - "Gate de CI como script independente com CLI (--root, --allowlist) e testes node:test por spawnSync contra fixtures"
    - "Teste de script bash contra servidor node:http no mesmo processo, via spawn assíncrono (promessa no evento close)"
    - "Config do curl por stdin (printf builtin) para manter a chave fora do ps"

key-files:
  created:
    - scripts/check-no-raw-html.mjs
    - scripts/check-no-raw-html.test.mjs
    - scripts/raw-html-allowlist.json
    - scripts/__fixtures__/raw-html/unsafe/page.tsx
    - scripts/__fixtures__/raw-html/safe/page.tsx
    - scripts/smoke-postgrest.test.mjs
  modified:
    - scripts/smoke-postgrest.sh

key-decisions:
  - "Allowlist do gate de HTML bruto vazia na Fase 1; item que some do disco vira STALE_ALLOWLIST e falha o gate"
  - "Modo estrito do smoke só aceita 401/403 com SQLSTATE 42501 ou 200 com corpo exatamente []; o resto é INCONCLUSIVE"
  - "O modo padrão do smoke (produção, 01-06) ficou intacto: tudo que não é 200 com linhas passa"
  - "Sem SUPABASE_PUBLISHABLE_KEY a requisição vai sem apikey nem Authorization (anônima de verdade)"

patterns-established:
  - "Falha do curl (rede ou timeout) encerra o script via set -e e nunca conta como bloqueio"
  - "Linha esperada em teste de fixture é calculada lendo o arquivo, não fixada, para sobreviver ao formatador"

requirements-completed: [SEC-03, SEC-04]

coverage:
  - id: D1
    description: "Gate de HTML bruto detecta a prop na fixture insegura, aceita a allowlist, recusa allowlist podre e passa sobre o apps/web real"
    requirement: SEC-03
    verification:
      - kind: unit
        ref: "scripts/check-no-raw-html.test.mjs (5 casos)"
        status: pass
      - kind: other
        ref: "node scripts/check-no-raw-html.mjs -> RAW_HTML_OK"
        status: pass
    human_judgment: false
  - id: D2
    description: "Smoke PostgREST com modo estrito e anônimo (LEAK, INCONCLUSIVE, headers, TABLES, POSTGREST_URL sem SUPABASE_URL)"
    requirement: SEC-04
    verification:
      - kind: unit
        ref: "scripts/smoke-postgrest.test.mjs (6 casos)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Modo de produção do smoke segue verde contra o Supabase real, nos modos padrão e estrito"
    requirement: SEC-04
    verification:
      - kind: integration
        ref: "ENV_FILE=~/.config/blog-no-law/production.env bash scripts/smoke-postgrest.sh -> POSTGREST_ANON_BLOCKED (heartbeat 401 code=42501, _prisma_migrations 401 code=42501)"
        status: pass
    human_judgment: false

duration: 3min
completed: 2026-11-20
status: complete
---

# Phase 1 Plan 14: Gates de segurança como scripts de CI Summary

**Gate de HTML bruto em apps/web com allowlist vazia e smoke do PostgREST com modo estrito anônimo (só 42501 do Postgres ou lista vazia passa), ambos cobertos por 11 testes node:test sem dependência nova.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-11-20T21:30:35Z
- **Completed:** 2026-11-20T21:33:16Z
- **Tasks:** 2
- **Files modified:** 7 (6 criados, 1 alterado)

## Accomplishments

- `scripts/check-no-raw-html.mjs` varre `apps/web` (ignorando `node_modules`, `.next`, `coverage`, `playwright-report`, `test-results`), imprime `caminho:linha` por uso fora da allowlist, falha com `STALE_ALLOWLIST` para item podre e imprime `RAW_HTML_OK` sobre o `apps/web` real.
- `scripts/smoke-postgrest.sh` ganhou `POSTGREST_URL`, `TABLES`, `POSTGREST_STRICT=1` e `SMOKE_CURL_MAX_TIME`; o modo estrito imprime `INCONCLUSIVE {tabela} {código}` e sai 1 para qualquer resposta que não seja negação do Postgres (42501) ou `[]`, de modo que um PostgREST sem banco (503) não passa como bloqueado.
- Requisição realmente anônima quando não há chave; com chave, `apikey` e `Authorization` vão e o valor nunca aparece em stdout nem stderr (teste confere).
- Todo `curl` tem `--connect-timeout 5` e `--max-time`; servidor que não responde faz o script falhar sem `POSTGREST_ANON_BLOCKED`.
- `node --test scripts/` roda 11 testes em cerca de 2,5 s e termina sozinho.

## Task Commits

1. **Task 1 (tracer): gate de HTML bruto** - RED `fe69ab3` (test) -> GREEN `b74fbfb` (feat)
2. **Task 2: modo estrito e anônimo do smoke** - RED `bd93b91` (test) -> GREEN `c89d6db` (feat)

**Plan metadata:** commit `docs(01-14)` seguinte a este SUMMARY.

## TDD

- **RED Task 1:** `check-no-raw-html.test.mjs` com 5 casos falhou porque o script não existia (`MODULE_NOT_FOUND`, status 1 contra o esperado 0 e saída sem `RAW_HTML_OK`/`caminho:linha`): falha em asserção sobre o comportamento planejado. Avaliação semântica: o alvo executou e falhou pelo motivo previsto (ausência da implementação), não por erro de sintaxe ou fixture.
- **RED Task 2:** os 6 casos de `smoke-postgrest.test.mjs` falharam em asserção, porque o script ainda não conhecia `POSTGREST_URL` e saía com 2 (`defina SUPABASE_URL...` / `ENV_FILE não encontrado`). Avaliação semântica: o alvo executou (6 testes descobertos, 6 falhas por `AssertionError`), sem erro de carga.
- **GREEN:** ambos verdes; sem REFACTOR (nenhuma mudança de comportamento a limpar).
- Os dois commits `test(01-14)` precedem seus `feat(01-14)`. A verificação por `gsd_run check tdd-red-evidence` não foi usada: o relatório do `node --test` padrão não é TAP e o plano não é `type: tdd`; a avaliação semântica acima substitui.

## Tracer

`⚡ Tracer verified end-to-end — expanding`: após o GREEN da Task 1, `node --test scripts/check-no-raw-html.test.mjs && node scripts/check-no-raw-html.mjs` passou (5/5 e `RAW_HTML_OK`) antes de iniciar a Task 2 (modo `end-of-phase`, verify somente automatizado).

## Verificação

- `node --test scripts/`: 11 testes, 11 passam, 0 falhas, 2,4 s.
- `node scripts/check-no-raw-html.mjs` -> `RAW_HTML_OK` (e `--root scripts/__fixtures__/raw-html/unsafe` sai 1 com `scripts/__fixtures__/raw-html/unsafe/page.tsx:4`).
- Produção, modo padrão: `ENV_FILE=~/.config/blog-no-law/production.env bash scripts/smoke-postgrest.sh` -> `OK heartbeat 401 code=42501`, `OK _prisma_migrations 401 code=42501`, `POSTGREST_ANON_BLOCKED`, exit 0.
- Produção, modo estrito (extra): mesmo resultado com `POSTGREST_STRICT=1`, exit 0.
- Critérios de aceitação: `grep` por `dangerouslySetInnerHTML` em `apps/web` vazio; allowlist com `"allow": []`; `grep -nE 'set -x|curl[^|]*\s-v(\s|$)'` vazio; a única linha que chama `curl` tem `--max-time` e `--connect-timeout`; o script contém `POSTGREST_STRICT`, `POSTGREST_URL`, `TABLES` e `INCONCLUSIVE`.

## Decisions Made

- Allowlist vazia e fail-closed contra apodrecimento (Pitfall 12 do RESEARCH): a Fase 6 acrescenta só o componente de JSON-LD auditado.
- O teste do smoke usa `spawn` assíncrono e `{ timeout: 15000 }` por caso, porque o servidor falso roda no mesmo processo.
- O caso de travamento (servidor que não responde, `SMOKE_CURL_MAX_TIME=1`) ficou dentro do primeiro teste, para manter exatamente 6 casos do smoke (11 no total, como o plano exige).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Comentário do script casava com o grep de aceitação**
- **Found during:** Task 2 (critérios de aceitação)
- **Issue:** o comentário `Sem \`set -x\`.` no cabeçalho de `smoke-postgrest.sh` fazia `grep -nE 'set -x|curl[^|]*\s-v(\s|$)'` imprimir uma linha, embora o critério peça saída vazia.
- **Fix:** comentário reescrito para "Sem tracing do shell nem modo verboso do curl."
- **Files modified:** scripts/smoke-postgrest.sh
- **Verification:** o grep passou a sair 1 sem imprimir nada; 11/11 testes seguem verdes.
- **Committed in:** `c89d6db` (commit da Task 2)

**2. [Rule 3 - Blocking] Comandos git compostos recusados pelo sandbox do worktree**
- **Found during:** início (ledger de commits)
- **Issue:** `git rev-parse ... > "$(git rev-parse --git-dir)/..."` foi recusado por ser um comando git composto.
- **Fix:** o SHA base foi gravado direto no arquivo do ledger com caminho absoluto, em chamadas simples.
- **Files modified:** nenhum arquivo rastreado.

---

**Total deviations:** 2 auto-fixed (1 bug de comentário, 1 bloqueio de ambiente)
**Impact on plan:** nenhum desvio de escopo ou de comportamento.

## Issues Encountered

Nenhum. Observação: o Grep dedicado não existia na sessão, então as buscas por conteúdo usaram `grep` pelo Bash.

## Threat Flags

Nenhuma superfície nova. O smoke só consulta (GET) endpoints públicos e nunca imprime chave nem corpo; mitigações T-01-49, T-01-59, T-01-47 e T-01-SC do plano foram implementadas (gate com allowlist vazia, modo estrito com testes, ausência da chave na saída, nenhum pacote novo).

## Known Stubs

Nenhum.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- O 01-09 já pode ligar `node scripts/check-no-raw-html.mjs` no job `lint` e `POSTGREST_URL=... POSTGREST_STRICT=1 bash scripts/smoke-postgrest.sh` no job `postgrest-anon`, além de `node --test scripts/` no `verify` e no pre-push. Os scripts npm `check:raw-html` e `test:scripts` e a CI ficam para o 01-09/01-08 (o `package.json` raiz não foi tocado aqui).
- O autoteste que concede `SELECT` a `anon` e espera `LEAK` continua no escopo do 01-09 (T-01-59).

---
*Phase: 01-esqueleto-no-ar-com-testes-e-ci*
*Completed: 2026-11-20*

## Self-Check: PASSED

Arquivos conferidos em disco e commits `fe69ab3`, `b74fbfb`, `bd93b91`, `c89d6db` ancestrais de HEAD.
