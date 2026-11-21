---
phase: 01-esqueleto-no-ar-com-testes-e-ci
plan: 12
subsystem: infra
tags: [github-actions, ghcr, render, vercel, prisma-migrate, docker, ci-cd]

requires:
  - phase: 01-esqueleto-no-ar-com-testes-e-ci
    provides: "01-09 ruleset e ci-ok; 01-10 web com Sentry; 01-11 imagem da API e Render com deploy hook"
provides:
  - "scripts/wait-for-commit.sh (polling de /status até commit == SHA)"
  - ".github/workflows/deploy-api.yml (build-push, migrate, deploy hook, verify)"
  - "job docker-build da CI dentro do needs do ci-ok"
  - "apps/web/vercel.json com regions iad1"
  - "Projeto Vercel (Root Directory apps/web, produção https://blog-no-law.vercel.app) e CORS_ORIGINS da Render com o domínio de produção"
  - "docs/runbooks/deploy.md (fluxo, compatibilidade, previews, rollback, segredos por nome, D-13, D-14)"
  - "Primeiro merge no meio da fase (PR #1, D-13) com o workflow na main"
affects: [01-13, 01-14, ship]

actuals:
  tokens: 25000
  tasks: 3
  commits: 6
plan_head_before: eb6e79b20fd43359d29391d9a38337d0918f1e6d
plan_head_after: 08f9476502e6a4d525c25e0e7d4e7729c902275f

tech-stack:
  added: []
  patterns:
    - "workflow_run com guarda de mesmo repositório e evento push"
    - "deploys da API serializados sem cancelamento (deploy-api-production)"
    - "teste de guarda do workflow lendo YAML como texto (sem parser)"
    - "web e API implantam em paralelo e não atômicos: contrato com campo novo opcional e migrations expand/contract"

key-files:
  created:
    - scripts/wait-for-commit.sh
    - scripts/wait-for-commit.test.mjs
    - scripts/deploy-api-workflow.test.mjs
    - .github/workflows/deploy-api.yml
    - apps/web/vercel.json
    - docs/runbooks/deploy.md
  modified:
    - .github/workflows/ci.yml

key-decisions:
  - "deploy e verify listam build-push no needs (além do encadeamento) para ler os outputs sha e image; o teste de guarda aceita lista"
  - "Rollback da API é pelo deploy hook com imgURL do SHA anterior; workflow_dispatch só reimplanta o HEAD da main"
  - "Depois de qualquer Save and deploy ou deploy manual na Render, reexecutar o Deploy API (workflow_dispatch na main), porque a Render reimplanta a Image URL das Settings e não a última imgURL do hook"
  - "Previews da Vercel só com API_URL (GET /status público da produção); DSNs só em Production; Git Fork Protection ligada"

requirements-completed: [OPS-02, QA-04]

coverage:
  - id: D1
    description: "wait-for-commit.sh faz polling de /status, tolera 5xx e conexão encerrada, sai 0 com COMMIT_LIVE ou 1 com COMMIT_TIMEOUT"
    requirement: OPS-02
    verification:
      - kind: unit
        ref: "scripts/wait-for-commit.test.mjs#4 casos de polling"
        status: pass
    human_judgment: false
  - id: D2
    description: "Guarda do deploy-api.yml (gatilho, mesmo repositório e push, concorrência, ordem dos jobs, SHAs fixados, docker-build no ci-ok, iad1)"
    requirement: QA-04
    verification:
      - kind: unit
        ref: "scripts/deploy-api-workflow.test.mjs#6 guardas"
        status: pass
      - kind: integration
        ref: "gh run 44854034462 (CI do PR #1: 9 jobs success, incluindo docker-build e ci-ok)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Merge na main dispara o Deploy API até a Render servir o SHA do merge, com migrate antes e smoke PostgREST depois"
    requirement: OPS-02
    verification:
      - kind: integration
        ref: "gh run 44854566143 tentativa 3 (build-push, migrate, deploy, verify success; COMMIT_LIVE 1c14a0f...; POSTGREST_ANON_BLOCKED)"
        status: pass
      - kind: integration
        ref: "gh run 44922889162 (workflow_dispatch na main: success, COMMIT_LIVE 1c14a0f...)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Home de produção na Vercel (iad1) mostra o SHA de origin/main vindo da API na Render e o banco up"
    requirement: OPS-02
    verification:
      - kind: other
        ref: "curl -D - https://blog-no-law.vercel.app/ (2026-11-21: HTTP 200, x-vercel-id gru1::iad1::..., api-commit=1c14a0fb4feaff6e42944664485412272ed0695e, api-db=up)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Projeto Vercel com Root Directory apps/web, Production Branch main, Preview só com API_URL; CORS_ORIGINS da Render com o domínio exato de produção"
    requirement: OPS-02
    verification:
      - kind: integration
        ref: "OPTIONS preflight com Origin https://blog-no-law.vercel.app -> 204 + access-control-allow-origin; origem estranha -> sem ACAO (verificado pelo orquestrador em 2026-11-21)"
        status: pass
    human_judgment: true
    rationale: "A configuração dos ambientes da Vercel (Preview só com API_URL, DSNs só em Production, Deployment Protection) vive no painel e não é legível por CLI neste projeto; foi feita pelo autor no checkpoint da Task 2"
  - id: D6
    description: "Runbook docs/runbooks/deploy.md em pt-BR citando D-04, D-08, D-10, D-13 e D-14, sem valor de segredo"
    requirement: OPS-02
    verification:
      - kind: other
        ref: "gate de texto do <verify> da Task 3 (D-04/D-08/D-10/D-13, sem sb_secret_ nem URL com senha) e prettier --check"
        status: pass
    human_judgment: false

duration: 14h 12m corridos (cerca de 40 min de execução ativa; o resto foi espera nos checkpoints humanos)
completed: 2026-11-21
status: complete
---

# Phase 1 Plan 12: Deploy contínuo da API e do web Summary

**Merge na `main` com CI verde implanta a API sozinho (`Deploy API`: imagem `linux/amd64` no GHCR, `prisma migrate deploy`, deploy hook da Render com `imgURL`, `COMMIT_LIVE` e smoke PostgREST) e o web pela integração Git da Vercel em `iad1`; a home pública em https://blog-no-law.vercel.app mostra o SHA da `main` vindo da Render e o banco `up`.**

## Performance

- **Duração:** 14h 12m corridos (cerca de 40 min de execução ativa, o resto em espera nos checkpoints humanos do pacote GHCR e da Vercel)
- **Início:** 2026-11-21T02:01:35Z
- **Fim:** 2026-11-21T16:13:45Z
- **Tarefas:** 3 de 3
- **Arquivos criados/modificados:** 7

## Accomplishments

- RED/GREEN do polling: 4 casos `node:test` contra servidor HTTP falso; RED validado com `gsd_run check tdd-red-evidence` (`RED_EVIDENCE_OK`, 10 falhas por `ERR_ASSERTION`); RED de ponta a ponta confirmado (`COMMIT_TIMEOUT` contra a Render, que ainda servia a imagem do 01-11).
- `deploy-api.yml` com `workflow_run` do CI na `main` (só `push` do próprio repositório), grupo `deploy-api-production` sem cancelamento, ações fixadas por SHA de 40 hex, deploy hook só por `env:` de secret.
- Job `docker-build` na CI (sem publicar) no `needs` do `ci-ok`, mantendo `postgrest-anon` e `e2e`; CI do PR #1 verde nos 9 jobs (run 44854034462).
- PR #1 mergeado por merge commit `1c14a0fb4feaff6e42944664485412272ed0695e` (primeiro merge no meio da fase, D-13). Run `Deploy API` 44854566143, tentativa 3: `success` em `build-push`, `migrate` (1 migration encontrada, nenhuma pendente), `deploy` e `verify` (`COMMIT_LIVE 1c14a0f...` e `POSTGREST_ANON_BLOCKED`).
- Vercel: projeto importado com Root Directory `apps/web`, produção em https://blog-no-law.vercel.app, status "Vercel: success" no commit `1c14a0f`; variável `WEB_BASE_URL` gravada no Environment `production`; `CORS_ORIGINS` da Render com o domínio exato (preflight 204 com ACAO para a Vercel, sem ACAO para origem estranha).
- Produção de ponta a ponta (Task 3): `HTTP/2 200`, `x-vercel-id: gru1::iad1::...` (borda em São Paulo, função em `iad1`), `api-commit` = `1c14a0fb4feaff6e42944664485412272ed0695e` (= `origin/main`), `api-db` = `up`.
- `docs/runbooks/deploy.md`: fluxo completo, regras de contrato compatível e expand/contract (Pitfall 13), política de previews, reimplantação e rollback (API pelo hook com `imgURL`, web por Promote), segredos e variáveis só por nome, D-13 e D-14, e as duas armadilhas encontradas (acesso do Actions ao pacote GHCR e Save and deploy da Render).

## Task Commits

1. **Task 1 (RED)** - `1cfb407` test(01-12): add failing deploy pipeline tests
2. **Task 1 (GREEN, script)** - `eff3c36` feat(01-12): add wait-for-commit polling script
3. **Task 1 (GREEN, workflow)** - `9c84d03` feat(01-12): deploy the API automatically on merge to main
4. **Parcial** - `cc282b9` docs(01-12): partial summary (Task 1 blocked on GHCR package access)
5. **Task 2** - sem commit (checkpoint humano: Vercel e `CORS_ORIGINS` na Render)
6. **Task 3** - `08f9476` docs(01-12): add deploy runbook

**Merge na main:** `1c14a0fb4feaff6e42944664485412272ed0695e` (PR #1, merge commit). **Plan metadata:** commit `docs(01-12): complete deploy plan summary`.

`commits: 6` é a contagem medida de `eb6e79b..08f9476`: os 5 commits do plano acima mais o merge do worktree feito pelo orquestrador (`4db4f23`). O commit deste SUMMARY vem depois.

## Files Created/Modified

- `scripts/wait-for-commit.sh` - polling de `/status` (`WAIT_POLL_S`, saídas `COMMIT_LIVE` e `COMMIT_TIMEOUT`)
- `scripts/wait-for-commit.test.mjs` - 4 casos de polling
- `scripts/deploy-api-workflow.test.mjs` - 6 guardas lendo os workflows e o `vercel.json` como texto
- `.github/workflows/deploy-api.yml` - pipeline `Deploy API`
- `.github/workflows/ci.yml` - job `docker-build` e `needs` do `ci-ok`
- `apps/web/vercel.json` - `regions` `["iad1"]`, `installCommand` e `buildCommand` do monorepo
- `docs/runbooks/deploy.md` - runbook de deploy contínuo

## Decisions Made

- `deploy` e `verify` listam `build-push` no `needs` para ler `sha` e `image`; o helper do teste de guarda passou a aceitar `needs` em lista.
- Rollback da API: hook com o `imgURL` do SHA anterior (o `workflow_dispatch` não tem entrada de SHA e reimplanta o HEAD da `main`). No runbook, a URL do hook é lida com `read -rs` e a imagem codificada com `node` (o `jq` não é garantido na máquina local).
- Toda mudança de variável ou deploy manual na Render é seguida de `gh workflow run deploy-api.yml --ref main` (ou hook com a `imgURL` correta, ou Image URL atualizada nas Settings).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Aspas simples no env file local**

- **Found during:** Task 1, passo 1
- **Issue:** `~/.config/blog-no-law/production.env` usa aspas simples; a primeira gravação deixou as aspas literais no secret e nas duas variáveis.
- **Fix:** regravados os três com remoção de aspas simples e duplas, conferindo só a forma das variáveis (`https://` e prefixo `sb_publishable_`), sem imprimir valores. A prova do secret é o job `migrate` verde.
- **Files modified:** nenhum arquivo rastreado

**2. [Rule 3 - Blocking, ação humana] Pacote GHCR sem acesso de escrita do repositório**

- **Found during:** Task 1, run `Deploy API` 44854566143 na `main` (tentativas 1 e 2)
- **Issue:** `denied: permission_denied: write_package` ao empurrar `ghcr.io/jguii/blog-no-law-api:{sha}` com o `GITHUB_TOKEN`. O pacote público foi criado no 01-11 por push com o token do autor e não estava ligado ao repositório. Não há API REST para o acesso de Actions a um pacote; o rótulo `org.opencontainers.image.source` numa imagem empurrada localmente não ligou o repositório.
- **Fix:** o autor adicionou o repositório em Package settings -> Manage Actions access com papel **Write**. Rerun: tentativa 3 do run 44854566143 com `success` em todos os jobs.
- **Documentado em:** `docs/runbooks/deploy.md` (seção "Pacote GHCR e acesso do Actions")

**3. [Rule 1 - Teste] Helper `needsJob` aceita `needs` em lista**

- **Found during:** Task 1 (GREEN)
- **Issue:** `deploy` e `verify` precisam citar `build-push` para ler os outputs; o helper exigia `needs` de um único job.
- **Fix:** o helper verifica se o `needs` cita o job (escalar ou lista). A guarda continua exigindo `migrate` em `deploy` e `deploy` em `verify`.
- **Committed in:** `9c84d03`

**4. [Rule 3 - Blocking] "Save and deploy" da Render voltou a produção para a imagem antiga**

- **Found during:** Task 2 (gravação do `CORS_ORIGINS` pelo autor)
- **Issue:** salvar variáveis com "Save and deploy" reimplantou a Image URL gravada nas Settings do serviço (tag `72f7961...`), não a última imagem enviada pelo hook com `imgURL`. A home mostrou `api-commit=72f7961` por alguns minutos.
- **Fix:** `gh workflow run deploy-api.yml --ref main` -> run 44922889162 `success` (`COMMIT_LIVE 1c14a0f...`, `POSTGREST_ANON_BLOCKED`).
- **Documentado em:** `docs/runbooks/deploy.md` (seção "Atenção: mudar variável na Render reimplanta a imagem das Settings")

---

**Total deviations:** 4 (3 Rule 3, 1 Rule 1). **Impacto:** nenhum muda o escopo; os itens 2 e 4 viraram procedimento no runbook.

## Auth Gates

- Acesso do `GITHUB_TOKEN` ao pacote GHCR (deviation 2): ação humana no painel do GitHub, resolvida pelo autor; rerun verde.
- Task 2 (checkpoint planejado): importação na Vercel e `CORS_ORIGINS` na Render, feitos pelo autor e verificados pelo orquestrador.

## Issues Encountered

- O pre-push (`pnpm run verify`) da Task 1 rodou com o compose de teste do próprio worktree e passou; o compose foi derrubado com `down -v`.
- O Dependabot abriu runs na `main` logo após o merge (atualizações de `github_actions`, `docker` e `npm`); não fazem parte deste plano.

## Verificação da Task 3

| Check                                                                           | Resultado                                                                              |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Gate de texto do runbook (D-04, D-08, D-10, D-13; sem `sb_secret_` nem URL com senha) | exit 0 (D-14 também citado)                                                            |
| `pnpm exec prettier --check --ignore-unknown docs/runbooks/deploy.md`           | "All matched files use Prettier code style!"                                           |
| Home de produção (`WEB_BASE_URL`, `origin/main` = `1c14a0f...`)                 | exit 0: `HTTP/2 200`, `x-vercel-id: gru1::iad1::...`, `api-commit` = SHA, `api-db` = `up` |

`<human-check>` da Task 3 (janela anônima, link "Ver detalhes" com latência do banco) fica para a UAT de fim de fase.

## Known Stubs

None.

## Threat Flags

None. T-01-29 (guarda `event == 'push'` e mesmo repositório), T-01-30 (sem `set -x` nem curl verboso, valores só por `env:`), T-01-31 (Preview só com `API_URL`, DSNs só em Production), T-01-32 (contratos opcionais e expand/contract documentados, deploys serializados), T-01-57 (hook só no job `deploy` do Environment `production`, rotação no runbook) e T-01-SC (nenhum pacote npm novo; ações fixadas por SHA) estão cobertos. O runbook passa a URL do hook por `read -rs`, nunca por argumento.

## User Setup Required

Feito nos checkpoints: acesso do Actions ao pacote GHCR, projeto Vercel e `CORS_ORIGINS` na Render.

## Next Phase Readiness

- Produção no ar: Vercel (`iad1`) -> Render (Virginia) -> Supabase (`us-east-1`), implantada a partir da `main`.
- Pendente fora deste plano: leitura do `clientIp` da sonda de trust proxy (`render.md`) e os monitores de uptime e o backup do 01-13.

## Self-Check: PASSED

- Arquivos de `key-files` presentes no disco (7 de 7).
- Commits `1cfb407`, `eff3c36`, `9c84d03`, `cc282b9` e `08f9476` no histórico da branch.
- `node --test scripts/wait-for-commit.test.mjs scripts/deploy-api-workflow.test.mjs`: 10 testes, 10 pass, 0 fail.
- Os três `<automated>` da Task 3 com exit 0 (tabela acima).

---

_Phase: 01-esqueleto-no-ar-com-testes-e-ci_
_Completed: 2026-11-21_
