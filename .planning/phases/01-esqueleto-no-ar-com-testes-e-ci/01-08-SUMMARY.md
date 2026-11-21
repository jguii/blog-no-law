---
phase: 01-esqueleto-no-ar-com-testes-e-ci
plan: 08
subsystem: testing
tags: [turborepo, husky, pre-push, oxlint, prettier, eslint, prisma, qa-gate]

requires:
  - phase: 01-esqueleto-no-ar-com-testes-e-ci
    provides: scripts de pacote (01-01 a 01-07), compose.test.yaml e Postgres de teste (01-04), gates de raw HTML (01-14)
provides:
  - turbo.json com build, typecheck, lint, test, test:http, test:integration e test:e2e, e o cliente Prisma gerado apenas pelo build do @blog/api
  - hook de pre-push (Husky) que sobe o compose com --wait e roda pnpm run verify, sem tooling do GSD nem E2E
  - lint com oxlint type-aware (api e shared) e ESLint (web), formatação com Prettier, tudo dentro do verify
  - scripts/verify-prepush.sh (prova de bloqueio A a E contra remote descartável) e scripts/prepush-wiring.test.mjs (8 testes de ligação)
affects: [01-09, 01-10, 01-11, 01-12]

plan_head_before: 04c954625fd3a090cf614061087eef51dd24ca9b
plan_head_after: 1ca23b80cd5722a7a4045602f07d9be9122f9a6c

actuals:
  tokens: 14500
  tasks: 2
  commits: 5

tech-stack:
  added: [turbo@2.11.11, husky@9.1.7, prettier@3.10.1, oxlint@1.93.0, oxlint-tsgolint@7.0.2007]
  patterns:
    - "Turbo: @blog/api#lint/typecheck/test/test:integration dependem do build do próprio pacote (único ponto de prisma generate)"
    - "Gate local = pnpm run format:check && turbo run lint typecheck test test:http test:integration"
    - "Sondas de bloqueio são arquivos não rastreados (o hook roda sobre a working tree), removidos por trap"

key-files:
  created:
    - turbo.json
    - .husky/pre-push
    - .oxlintrc.json
    - .prettierrc.json
    - .prettierignore
    - scripts/verify-prepush.sh
    - scripts/prepush-wiring.test.mjs
  modified:
    - package.json
    - apps/api/package.json
    - packages/shared/package.json
    - pnpm-lock.yaml

key-decisions:
  - "O .oxlintrc.json fica só na raiz (fonte única para @blog/api e @blog/shared, via -c ../../.oxlintrc.json), desvio consciente do template Nest 12 que gera o arquivo dentro do app"
  - "O build do @blog/api é o único ponto de prisma generate no Turborepo; typecheck deixou de gerar para duas tarefas paralelas não regenerarem o mesmo diretório"
  - "turbo.json declara globalDependencies (tsconfig.base.json e .oxlintrc.json) para uma mudança de config da raiz invalidar o cache de lint e typecheck"
  - "O Prettier roda sobre toda a árvore menos o .prettierignore; .planning e .claude ficam fora"

patterns-established:
  - "verify-prepush.sh exige que a saída do push bloqueado cite a sonda, para o bloqueio não ser atribuído a outro motivo"

requirements-completed: [QA-03]

coverage:
  - id: D1
    description: "Push com teste falhando, erro de tipo ou promessa flutuante é bloqueado pelo hook de pre-push; push limpo passa e o repetido usa FULL TURBO"
    requirement: QA-03
    verification:
      - kind: e2e
        ref: "bash scripts/verify-prepush.sh (casos A, B, E bloqueados; C passa; D com FULL TURBO; imprime PREPUSH_VERIFY_OK)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Ligação do portão (hook, turbo.json, scripts, lint e formatação) coberta por 8 testes node:test escritos antes da implementação"
    requirement: QA-03
    verification:
      - kind: unit
        ref: "scripts/prepush-wiring.test.mjs (8 testes)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Num checkout limpo, toda tarefa do @blog/api que usa o cliente Prisma roda depois do build (grafo do Turborepo e execução sem src/generated)"
    requirement: QA-03
    verification:
      - kind: other
        ref: "turbo run ... --filter=@blog/api --dry=json imprime PRISMA_ORDER_OK; rm -rf apps/api/src/generated && turbo run test:integration --filter=@blog/api --force passa e recria src/generated/prisma"
        status: pass
    human_judgment: false
  - id: D4
    description: "O hook sozinho não impede git push --no-verify; o controle real é a CI com ci-ok obrigatório no ruleset da main (01-09)"
    verification: []
    human_judgment: true
    rationale: "T-01-18 foi transferida para a CI do 01-09; o hook sozinho pode ser pulado com git push --no-verify"

duration: 25min
completed: 2026-11-20
status: complete
---

# Phase 1 Plan 08: Portão local (Turborepo + pre-push) Summary

**Turborepo com cache e hook de pre-push (Husky) que sobe o Postgres de teste e bloqueia push com teste, tipo, lint ou formatação quebrados, provado contra um remote bare descartável.**

## Performance

- **Duração:** ~25 min
- **Concluído:** 2026-11-20T21:50Z
- **Tarefas:** 2
- **Arquivos tocados:** 30 (9 de autoria, 21 só reformatados)

## Accomplishments

- `turbo.json` com as tarefas do plano; `@blog/api#lint`, `#typecheck`, `#test` e `#test:integration` dependem do `build` do pacote, e o `outputs` do build guarda `src/generated/**` (um acerto de cache restaura o cliente). Prova: `PRISMA_ORDER_OK` e `test:integration` verde a partir de `apps/api/src/generated` apagado.
- `.husky/pre-push`: `docker compose -f compose.test.yaml up -d --wait` e `pnpm run verify`. Sem referência a `.claude`/GSD e sem E2E (D-09, D-12). `core.hooksPath` = `.husky/_` gravado pelo `prepare`.
- `test:integration` do `@blog/api` passou a rodar também `node --test scripts/*.test.mjs` (rotação da senha do `app_api`, do 01-06), 6 testes verdes com o compose no ar.
- Lint: oxlint type-aware (`typescript/no-floating-promises` = error) em `@blog/api` e `@blog/shared`, ESLint no `@blog/web`; Prettier 3.10.1 com `format`/`format:check`; `verify` roda `format:check` antes do `turbo run`.
- `scripts/verify-prepush.sh` imprime `PREPUSH_VERIFY_OK`: A (teste), B (tipo) e E (promessa flutuante) bloqueados, C (limpo) passa, D (repetido) passa com `FULL TURBO`. Termina com `git status --porcelain` igual ao início.

## Task Commits

1. **Task 1 RED:** `ab03b27` (test) testes de ligação 1 a 5 e `verify-prepush.sh` (casos A a D)
2. **Task 1 GREEN:** `c126538` (feat) turbo.json, scripts da raiz, hook, `typecheck` sem `prisma generate`
3. **Task 2 RED:** `01159a5` (test) ligações 6 a 8 e caso E
4. **Task 2 baseline:** `87f32e0` (style) passada única de `pnpm format`
5. **Task 2 GREEN:** `1ca23b8` (feat) `.oxlintrc.json`, Prettier, scripts de lint e `format:check` no `verify`

## TDD Gate Compliance

- **RED (Task 1):** `node --test --test-reporter=tap scripts/prepush-wiring.test.mjs`: 5 testes, `# pass 0`, `# fail 5`, cada um falhando em asserção (`assert.notEqual(composeAt, -1)`, `expected: 'husky'`, `expected: true`...), porque hook, `turbo.json` e scripts não existiam. Avaliação semântica: o alvo executou e falhou na asserção planejada, não por erro de carga (o helper devolve string vazia para arquivo ausente). `verify-prepush.sh` falhou no caso A (`FAIL: caso A: o push com sonda quebrada passou`), sem hook.
- **GREEN (Task 1):** 5/5 testes; `verify-prepush.sh` com A, B, C, D.
- **RED (Task 2):** TAP: `ok 1..5`, `not ok 6..8` (`# pass 5`, `# fail 3`), cada um em asserção sobre `.oxlintrc.json`, scripts de lint e `verify`/`.prettierignore` ausentes. `verify-prepush.sh` falhou no caso E (o push com promessa flutuante passou).
- **GREEN (Task 2):** 8/8 testes; `verify-prepush.sh` com A, B, E, C, D.
- Ordem confirmada no git log: `test(01-08)` antes de cada `feat(01-08)`. Não houve REFACTOR.
- Os arquivos usados como evidência RED são saída TAP real no terminal; não passei pelo classificador `gsd_run check tdd-red-evidence` (a dispatch não expôs o comando `gsd_run` neste worktree), a avaliação semântica acima fica registrada à mão.

## Passada de formatação (commit `87f32e0`)

`git diff --stat 87f32e0^..87f32e0`: 21 arquivos, 346 inserções, 217 remoções, todos só de formatação (aspas, quebras de linha, vírgulas), sem mudança de lógica. Arquivos: `apps/api/scripts/{set-app-api-password.mjs,set-app-api-password.test.mjs,verify-db-security.mjs}`, `apps/api/src/{config/env.ts,health/database.indicator.ts}`, `apps/api/test/{db.int-spec,logging.http-spec,rls.int-spec,security.http-spec,sentry.http-spec}.ts`, `apps/web/{app/page.tsx,lib/api.ts,lib/api.test.ts,test/home.int-spec.ts,tsconfig.json}`, `docs/runbooks/supabase-producao.md`, `packages/shared/src/status.test.ts`, `scripts/{check-no-raw-html.mjs,check-no-raw-html.test.mjs,prepush-wiring.test.mjs,smoke-postgrest.test.mjs}`. Todos estão em `files_modified`. oxlint não apontou nenhuma violação nos arquivos anteriores.

## Decisions Made

Ver `key-decisions`. Em especial: `.oxlintrc.json` só na raiz (desvio do template Nest 12, motivo: fonte única para dois pacotes), e `typecheck` sem `prisma generate` com o `build` como único gerador.

## Deviations from Plan

**1. [Rule 1 - Bug] Prettier não é idempotente em `apps/web/test/home.int-spec.ts`**
- **Found during:** Task 2 (primeiro `pnpm run verify` após o commit de estilo)
- **Issue:** a primeira passada do `prettier --write` deixou uma cadeia `res.writeHead(...).end(...)` que a segunda passada reformata; o `format:check` falhava no arquivo já commitado.
- **Fix:** segunda passada do Prettier e `git commit --amend` do commit `style`, mantendo-o um único commit mecânico.
- **Verification:** `prettier --check .` limpo; `pnpm run verify` 15/15 tarefas.
- **Committed in:** `87f32e0`

**2. [Rule 2 - Missing Critical] `globalDependencies` no `turbo.json`**
- **Found during:** Task 1
- **Issue:** `tsconfig.base.json` e `.oxlintrc.json` ficam na raiz, fora dos inputs dos pacotes; mudar a regra de lint ou o tsconfig base não invalidaria o cache de `lint`/`typecheck`, e o push passaria com `FULL TURBO` obsoleto.
- **Fix:** `"globalDependencies": ["tsconfig.base.json", ".oxlintrc.json"]`.
- **Committed in:** `c126538`

**3. [Rule 3 - Blocking] O sandbox do worktree recusa comandos compostos**
- **Found during:** Tasks 1 e 2
- **Issue:** `cd` computado, pipes com git e heredocs com `cat >>` foram recusados.
- **Fix:** comandos divididos, saídas longas redirecionadas ao scratchpad e edições feitas com Edit/Write.

**4. [Hardening] `verify-prepush.sh` exige que a saída do push bloqueado cite `__prepush_probe`**, para um bloqueio por outro motivo (por exemplo um teste real quebrado) não passar por prova do caso. Também fixei o bit executável do script (`mode change 100644 => 100755` no commit `c126538`).

**Total deviations:** 4 (1 bug, 1 missing critical, 1 blocking, 1 hardening). **Impact:** nenhum desvio de escopo; sem mudança de lógica de produto.

## Issues Encountered

- Churn no `pnpm-lock.yaml`: o `pnpm add` re-resolveu sufixos de peers opcionais (`jiti`, `@opentelemetry/api`) em entradas existentes de eslint/vite/vitest/next. Sem mudança de versão.
- A primeira execução do Turborepo imprime o aviso de telemetria anônima. Desabilite na máquina do autor com `pnpm exec turbo telemetry disable` (ou `DO_NOT_TRACK=1`) se não quiser. Não alterei configuração de usuário.
- Os specs `http` e `int` imprimem as linhas de log do pino no stdout do Turborepo (já anotado no 01-07). Ruído, não falha.

## Known Stubs

Nenhum.

## Threat Flags

Nenhum. T-01-18 (`--no-verify`) continua transferida para a CI (`ci-ok` obrigatório no ruleset, 01-09); T-01-41 mitigada (hook e `turbo.json` sem `.claude`, checado no verify e pelo teste de ligação 1); T-01-SC mitigada (cinco pacotes da lista aprovada no 01-01, versões exatas).

## Notas para o 01-09 e para o orquestrador

- **`core.hooksPath` é config compartilhada do repositório.** Os worktrees dividem a config com o checkout principal; depois do merge, rode `pnpm install` no checkout principal para o `prepare` (Husky) criar o `.husky/_` lá (ele é gitignorado por dentro).
- Os scripts raiz `check:raw-html` e `test:scripts` **não foram criados aqui** (o plano não os pede); ficam para o 01-09. O teste `scripts/prepush-wiring.test.mjs` já roda com `node --test scripts/` (19 testes na raiz agora: 11 anteriores e 8 novos).
- O job `test-api` da CI do 01-09 precisa do Postgres do `compose.test.yaml` (ou `services:` equivalente) antes do `test:integration` e deve exportar `DATABASE_URL_TEST_ADMIN` se for diferente do padrão.
- `verify` (local) = `format:check` + `turbo run lint typecheck test test:http test:integration`; o 01-09 pode acrescentar comandos antes do `turbo run` sem quebrar o teste de ligação 2.
- `REQUIREMENTS.md` não foi tocado (QA-03 fica para o orquestrador marcar após o merge, como STATE/ROADMAP).

## Baseline verificada ao final (compose no ar, depois derrubado com `down -v`)

`pnpm run verify` (15 tarefas) verde: shared 10, api unit 9, api http 36, api int 21 + 6 `node:test` de rotação de senha, web unit 10, web int 5; `node --test scripts/` 19/19; `RAW_HTML_OK`; `prettier --check .` limpo; lint limpo; `pnpm run build` e `pnpm --filter @blog/web build` verdes.

## Self-Check: PASSED

- Arquivos de autoria existem: `turbo.json`, `.husky/pre-push`, `.oxlintrc.json`, `.prettierrc.json`, `.prettierignore`, `scripts/verify-prepush.sh`, `scripts/prepush-wiring.test.mjs`.
- Commits presentes no ramo: `ab03b27`, `c126538`, `01159a5`, `87f32e0`, `1ca23b8`.

---
*Phase: 01-esqueleto-no-ar-com-testes-e-ci*
*Completed: 2026-11-20*
