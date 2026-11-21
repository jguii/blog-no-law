---
phase: 01-esqueleto-no-ar-com-testes-e-ci
plan: 11
subsystem: infra
tags: [docker, ghcr, render, railway, sentry, pnpm-deploy, smoke, runbook, trust-proxy, dependabot]

requires:
  - phase: 01-esqueleto-no-ar-com-testes-e-ci
    provides: "01-06 banco de produção e forma canônica de TLS; 01-09 CI e escopo write:packages; 01-14 estilo dos testes de smoke"
provides:
  - "Imagem linux/amd64 da API (apps/api/Dockerfile) pública no GHCR: ghcr.io/jguii/blog-no-law-api:72f7961b2bd74687043f61ec45fe9ce4a5da4fdb"
  - "API no ar por HTTPS na Render (https://blog-no-law-api.onrender.com), Virginia, plano Free, com commit = SHA, db up, Helmet e /_debug/error 404"
  - "Mesma imagem provada uma vez na Railway (plano B de boot único, D-11), com /_debug/error ligado para o teste do Sentry"
  - "scripts/smoke-container.sh [--publish] e scripts/verify-remote-api.sh {url} {sha} [--expect-debug]"
  - "GitHub Environment production (restrito à main) com o secret RENDER_DEPLOY_HOOK_URL e a variável API_BASE_URL"
  - "Runbooks docs/runbooks/render.md e plano-b-railway.md; ecossistema docker no Dependabot"
affects: [01-12 deploy automatizado pelo hook, 01-13 monitores de 5 minutos, fim da fase (human-checks)]

actuals:
  tokens: 10500
  tasks: 3
  commits: 6

tech-stack:
  added: []
  patterns:
    - "Smoke de container com docker/git falsos no PATH e senha marcadora para provar que a URL do banco nunca vaza"
    - "DATABASE_URL entra no container só pelo nome (-e DATABASE_URL), com o valor no ambiente do comando"
    - "Verificação remota com servidor HTTP falso no mesmo processo e spawn assíncrono (polling tolera cold start)"
    - "Dado pessoal (IP público do autor) fora do repositório público, em arquivo local modo 600"

key-files:
  created:
    - apps/api/Dockerfile
    - .dockerignore
    - scripts/smoke-container.sh
    - scripts/smoke-container.test.mjs
    - scripts/verify-remote-api.sh
    - scripts/verify-remote-api.test.mjs
    - docs/runbooks/render.md
    - docs/runbooks/plano-b-railway.md
  modified:
    - apps/api/package.json
    - .github/dependabot.yml

key-decisions:
  - "pnpm --filter @blog/api deploy --prod funcionou sem --legacy nem injectWorkspacePackages (Assumption A10 confirmada)"
  - "ENV PORT=10000 na imagem (padrão da Render); Railway recebe PORT=10000 explícito e domínio na porta 10000"
  - "Política de keep-alive da Render (D-03): RISCO_ACEITO em 2026-11-20; monitores de 5 minutos do 01-13 mantidos"
  - "IP público da máquina na sonda do trust proxy não entra no repositório (público): fica em ~/.config/blog-no-law/trust-proxy-probe.txt"
  - "verify-remote-api.sh lê os headers do Helmet da resposta de /status que trouxe o SHA certo, e o polling só avança em 200 com commit igual"

requirements-completed: [OPS-02, OPS-01]

coverage:
  - id: D1
    description: "Imagem amd64 da API roda local contra o banco de produção como app_api (health, /status com commit = SHA e db up, uid 1000, 95 MiB, sem segredos)"
    requirement: OPS-02
    verification:
      - kind: integration
        ref: "bash scripts/smoke-container.sh -> SMOKE_CONTAINER_OK"
        status: pass
      - kind: unit
        ref: "scripts/smoke-container.test.mjs (4 testes)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Imagem publicada no GHCR com a tag do commit feat(01-11), pública (pull anônimo funciona), e Environment production restrito à main"
    requirement: OPS-02
    verification:
      - kind: integration
        ref: "docker logout ghcr.io; docker manifest inspect ghcr.io/jguii/blog-no-law-api:72f7961...; gh api environments/production"
        status: pass
    human_judgment: false
  - id: D3
    description: "API na Render por HTTPS com commit = SHA, db up, Helmet e /_debug/error 404; mesma imagem na Railway com /_debug/error 500"
    requirement: OPS-02
    verification:
      - kind: unit
        ref: "scripts/verify-remote-api.test.mjs (6 testes)"
        status: pass
      - kind: integration
        ref: "bash scripts/verify-remote-api.sh https://blog-no-law-api.onrender.com 72f7961... -> REMOTE_API_OK"
        status: pass
      - kind: integration
        ref: "bash scripts/verify-remote-api.sh https://blog-no-law-api-production.up.railway.app 72f7961... --expect-debug -> REMOTE_API_OK"
        status: pass
    human_judgment: false
  - id: D4
    description: "Erro provocado na Railway chega ao projeto Sentry blog-no-law-api (OPS-01)"
    requirement: OPS-01
    verification: []
    human_judgment: true
    rationale: "O painel do Sentry não é acessível ao executor; o autor confirma a issue Error: sentry-smoke (environment railway-planob) no fim da fase. Horários e x-request-id dos disparos estão em docs/runbooks/plano-b-railway.md"
  - id: D5
    description: "Sonda do trust proxy: número de hops da Render decidido pelo clientIp lido no log"
    verification: []
    human_judgment: true
    rationale: "O clientIp só aparece no painel de logs da Render, lido pelo autor no fim da fase; a requisição foi enviada e registrada (x-request-id probe-1795226167)"
  - id: D6
    description: "Política de keep-alive da Render (D-03) registrada com data, URLs lidas e consequência"
    verification:
      - kind: unit
        ref: "grep -E '^Política de keep-alive \\(D-03\\): (PERMITE|SILENCIA|PROIBE|RISCO_ACEITO)' docs/runbooks/render.md"
        status: pass
    human_judgment: true
    rationale: "A decisão RISCO_ACEITO é do autor; a AUP e os Terms da Render não puderam ser lidos pela ferramenta de leitura, então o silêncio não foi verificado"

duration: "cerca de 35 min de execução (25 min na Task 1 e cerca de 10 min na Task 3), sem contar a espera do checkpoint humano"
completed: 2026-11-21
plan_head_before: 1df67a3a66e695b80db3145c62eb83d74eebae5b
plan_head_after: 3a19254bb6cd9910f3e46e51af9d2ac36b4c1960
commits: 6
status: complete
---

# Phase 1 Plan 11: API em produção como container (Render + Railway) Summary

**Imagem Docker amd64 da API (multi-stage, `pnpm deploy --prod`, usuário não-root) pública no GHCR, no ar por HTTPS na Render Free (Virginia) ligada ao Supabase de produção como `app_api`, e provada uma vez na Railway (plano B), com `verify-remote-api.sh` verde nos dois hosts, runbooks e Dependabot para a imagem base.**

## Performance

- **Duração:** cerca de 35 min de execução (Task 1 cerca de 25 min com build e publicação; Task 3 cerca de 10 min), sem contar a espera do checkpoint da Task 2
- **Concluído em:** 2026-11-21 (UTC); 2026-11-20 no fuso do autor
- **Tarefas:** 3 de 3 (Task 2 foi checkpoint humano, resolvido pelo autor em 2026-11-20)
- **Arquivos:** 10 (8 criados, 2 modificados)

## Estado de produção

| Item | Valor |
| --- | --- |
| Imagem | `ghcr.io/jguii/blog-no-law-api:72f7961b2bd74687043f61ec45fe9ce4a5da4fdb` (pública; `docker manifest inspect` funciona após `docker logout ghcr.io`) |
| Render | `https://blog-no-law-api.onrender.com`, Virginia, Free, health check `/health/live`, Auto-Deploy desligado; `REMOTE_API_OK` (sem flag, `/_debug/error` 404) |
| Railway | `https://blog-no-law-api-production.up.railway.app`, mesma imagem; `REMOTE_API_OK` com `--expect-debug` (`/_debug/error` 500) |
| Environment `production` | restrito à `main`; secret `RENDER_DEPLOY_HOOK_URL` (valor nunca visto) e variável `API_BASE_URL=https://blog-no-law-api.onrender.com` |
| Sentry | projetos `blog-no-law-api` e `blog-no-law-web` criados pelo autor; DSN da API aplicado na Render e na Railway |
| Política de keep-alive (D-03) | `RISCO_ACEITO` (2026-11-20) |

## Accomplishments

- **Task 1 (tracer):** `apps/api/Dockerfile`, `.dockerignore` e `scripts/smoke-container.sh` com 4 testes escritos antes (RED). Smoke real contra o banco de produção: `SMOKE_CONTAINER_OK`, uid 1000, 95 MiB, sem `.env*` na imagem e sem segredo em `Config.Env`. Publicação protegida por `DIRTY_TREE`; Environment `production` criado.
- **Task 3:** `scripts/verify-remote-api.sh` com 6 testes escritos antes (RED), polling que tolera cold start (503 e conexão recusada contam como "ainda não"), checagens `commit`, `db`, `ready`, `csp`, `nosniff` e `debug_route`. Rodou contra a Render e a Railway com sucesso. Runbooks `render.md` e `plano-b-railway.md`, e `docker` em `/apps/api` no Dependabot.
- Verificação plano-a-plano: `node --test` dos dois arquivos de smoke dá 10 testes verdes; `pnpm run test:scripts` dá 36 testes verdes; `prettier --check .` verde.

## Task Commits

1. **Task 1 (RED)** - `d0b62dc` (`test(01-11): add failing container smoke tests`)
2. **Task 1 (GREEN)** - `72f7961` (`feat(01-11): containerize the API`)
3. **Task 1 (docs)** - `d44f4d1` (SUMMARY parcial, substituída por este arquivo)
4. **Task 2** - sem commit (checkpoint humano sobre painéis externos)
5. **Task 3 (RED)** - `45d412b` (`test(01-11): add failing tests for the remote API check`)
6. **Task 3 (GREEN)** - `aebea56` (`feat(01-11): add remote API verification script`)
7. **Task 3 (docs)** - `3a19254` (`docs(01-11): verify Render and Railway deployments and add runbooks`)

A contagem `commits: 6` do frontmatter é medida com `git log --grep '(01-11)'` no intervalo `plan_head_before..plan_head_after` (os commits do próprio plano). O `git rev-list --count` bruto do intervalo dá 17 porque o 01-10 rodou em paralelo na mesma wave e seus commits estão intercalados no mesmo intervalo. O commit desta SUMMARY vem depois de `plan_head_after`.

## Evidência TDD

### Task 1 (smoke do container)

Registrada na SUMMARY parcial anterior: RED com 4 falhas de asserção, `RED_EVIDENCE_OK`, GREEN com 4 testes.

### Task 3 (verificação remota)

- **RED:** `node --test --test-reporter=tap scripts/verify-remote-api.test.mjs` saiu 1 com 6 testes, 0 passaram, 6 falharam. O classificador `gsd-tools check tdd-red-evidence` devolveu `RED_EVIDENCE_OK` (`target_test_failed`), alvo `servidor saudável: sai 0 e imprime REMOTE_API_OK com a URL`.
- **Avaliação semântica:** os seis falharam em `ERR_ASSERTION` porque o script não existia (`bash` saiu 127 onde os testes esperavam 0 ou 1). Nenhum erro de sintaxe, importação ou fixture; o servidor falso subiu e o teste só não achou o script.
- **GREEN:** os 6 testes passam em cerca de 5 s (o caso de commit errado termina em cerca de 2 s com `VERIFY_TIMEOUT_S=3`).
- **REFACTOR:** não houve.

## Files Created/Modified

- `apps/api/Dockerfile` - imagem multi-stage amd64 da API
- `.dockerignore` - exclui segredos, planejamento, docs e código do web
- `apps/api/package.json` - campo `files: ["dist"]` para o `pnpm deploy`
- `scripts/smoke-container.sh` e `scripts/smoke-container.test.mjs` - smoke local, publicação e 4 testes com `docker` e `git` falsos
- `scripts/verify-remote-api.sh` e `scripts/verify-remote-api.test.mjs` - verificação HTTPS remota e 6 testes contra servidor HTTP falso
- `docs/runbooks/render.md` - serviço, variáveis por nome, deploy hook, rollback, 750 h, cold start, política de keep-alive, sonda do trust proxy
- `docs/runbooks/plano-b-railway.md` - evidência do boot único, armadilhas e procedimento de emergência
- `.github/dependabot.yml` - ecossistema `docker` em `/apps/api`, semanal

## Decisions Made

- `pnpm deploy --prod` funcionou sem `--legacy` nem `injectWorkspacePackages` (Assumption A10 confirmada com pnpm 12.21.0); memória real de 95 MiB (Assumption A9 confirmada com folga).
- Política de keep-alive da Render: `RISCO_ACEITO`. A página `render.com/docs/free` não menciona pings; a AUP e os Terms não puderam ser extraídos. Um ping de 5 min mantém o serviço acordado cerca de 744 h por mês, abaixo mas perto das 750 h, e só vale com um único web service gratuito no workspace.
- `PORT=10000` como padrão da imagem; na Railway a porta é explícita e o domínio aponta para ela.
- O smoke não imprime logs do container (a mensagem crua de um driver pode carregar dados da conexão).

## Deviations from Plan

### Ajustes de execução

**1. [Rule 2 - Privacidade] IP público da sonda do trust proxy fora do repositório**
- **Found during:** Task 3, passo 4 (sonda D-02)
- **Issue:** o plano manda registrar o IP público da máquina na tabela do `render.md`, mas o repositório é público e o IP do autor é dado pessoal.
- **Fix:** a tabela do runbook traz "(registrado fora do repositório, em `~/.config/blog-no-law/trust-proxy-probe.txt`)". O IP, o `x-request-id` e o horário foram gravados nesse arquivo (modo 600). Instrução dada pelo orquestrador no checkpoint.
- **Files modified:** `docs/runbooks/render.md`
- **Commit:** `3a19254`

**2. [Rule 2 - Rastreabilidade] Segundo disparo do Sentry com `x-request-id` conhecido**
- **Found during:** Task 3, passo 3
- **Issue:** o `verify-remote-api.sh --expect-debug` dispara `/_debug/error` sem id próprio, o que dificultaria o autor achar o evento no Sentry.
- **Fix:** depois do script, um `curl` dedicado a `/_debug/error` da Railway com `x-request-id: sentry-smoke-20261121T015607Z` (HTTP 500). São dois eventos possíveis no Sentry; ambos ficam listados em `plano-b-railway.md`.
- **Files modified:** `docs/runbooks/plano-b-railway.md`
- **Commit:** `3a19254`

**3. [Informativo] Primeiro boot da Railway caiu**
- O `DATABASE_URL` tinha sido editado na Railway, mas a mudança ficou em rascunho e não foi aplicada. O autor aplicou e o serviço subiu. Registrado como armadilha em `plano-b-railway.md` ("variáveis da Railway só valem depois de Apply/Deploy"). Também foi definido `PORT=10000` explícito e o domínio aponta para a porta 10000.

**Total deviations:** 2 auto-ajustados (Rule 2) e 1 informativo. **Impacto:** nenhum nos critérios de aceite; as duas mudanças de execução reduzem exposição de dado pessoal e melhoram a rastreabilidade.

## Auth Gates

Nenhum durante a execução automática. O `gh` com `write:packages` bastou para o push; a Task 2 foi um checkpoint humano planejado (visibilidade do pacote, Sentry, Render, Railway, hook e leitura da política de keep-alive).

## Itens pendentes para o autor (human-checks de fim de fase)

1. **Sentry:** no projeto `blog-no-law-api`, conferir a issue `Error: sentry-smoke` com environment `railway-planob`. Horários dos disparos: 2026-11-21T01:55:59Z (script) e 2026-11-21T01:56:07Z (`x-request-id` `sentry-smoke-20261121T015607Z`). Não foi verificado pelo executor.
2. **Sonda do trust proxy (D-02):** no painel da Render -> Logs, localizar `x-request-id` `probe-1795226167` (enviado em 2026-11-21T01:56:08Z) e ler `clientIp`; aplicar a regra de decisão do `render.md` (igual ao IP público: manter 1; IP interno ou da Cloudflare: 2; `203.0.113.7`: 0) e anotar o valor final no runbook. O IP público está em `~/.config/blog-no-law/trust-proxy-probe.txt`.
3. **Railway:** remover o serviço depois da evidência (Settings -> Delete service), conforme D-11, para não consumir o trial.

## Known Stubs

None. Os campos "pendente" do `render.md` (leitura do `clientIp` e valor final de `TRUST_PROXY_HOPS`) são dados que só o autor consegue obter no painel da Render, não código com dado simulado.

## Threat Flags

None. Mitigações verificadas: T-01-25 (sem `.env*` nem segredo em `Config.Env`, pelo smoke), T-01-27 (uid 1000), T-01-46 (`DIRTY_TREE`; tag publicada é o commit `feat(01-11)`), T-01-54 (`/_debug/error` 404 na Render, 500 só na Railway temporária), T-01-26 (hook só como secret do Environment restrito à `main`), T-01-53 (sonda enviada, decisão pendente do autor), T-01-48 (política registrada como RISCO_ACEITO), T-01-28 (sem Blueprint, um web service gratuito na Render, remoção da Railway pendente do autor).

## Self-Check: PASSED

- Arquivos existentes: `apps/api/Dockerfile`, `.dockerignore`, `scripts/smoke-container.sh`, `scripts/smoke-container.test.mjs`, `scripts/verify-remote-api.sh`, `scripts/verify-remote-api.test.mjs`, `docs/runbooks/render.md`, `docs/runbooks/plano-b-railway.md`; `.github/dependabot.yml` tem `package-ecosystem: docker` para `/apps/api`.
- Commits na branch, na ordem: `d0b62dc` (RED) antes de `72f7961` (GREEN); `45d412b` (RED) antes de `aebea56` (GREEN); `3a19254` (docs).
- Critérios de aceite da Task 3 rodados: 6 testes verdes, `prettier --check` verde, linha `Política de keep-alive (D-03): RISCO_ACEITO` inteira em linha própria, `D-02` e `D-11` citados, sem `sb_secret_` nem URL com senha nos runbooks, `gh variable get API_BASE_URL --env production` imprime a URL da Render, `REMOTE_API_OK` na Render (sem flag) e na Railway (`--expect-debug`), `docker manifest inspect` anônimo da tag servida pela Render passa.
- Nada de `STATE.md`, `ROADMAP.md` nem `git push` neste plano.
