# Phase 1: Esqueleto no ar com testes e CI - Research

**Researched:** 2026-11-15
**Domain:** Monorepo TypeScript (Next.js 16 + NestJS 12 + Prisma 7 + Supabase) com PaaS gratuito (Render), CI/CD no GitHub Actions, RLS, observabilidade e backup off-box
**Confidence:** MEDIUM (versões e termos de plataforma verificados nesta sessão; vários pontos de comportamento real da Render/Railway/Supabase só se confirmam no primeiro deploy, listados como spikes de Wave 0)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Hospedagem da API, região e HTTPS**
- **D-01:** A Oracle Cloud está descartada. A API roda como container Docker em PaaS gratuito: Render ou Koyeb. Uma plataforma é a primária e a outra é o plano B, implantado com sucesso pelo menos uma vez nesta fase. **O pesquisador decide qual é qual** depois de conferir os termos gratuitos atuais nas páginas oficiais. Critérios:
  - deploy a partir de imagem (de preferência GHCR) ou de Dockerfile;
  - RAM de 512 MB ou mais;
  - política de hibernação, horas por mês e se pings de keep-alive são permitidos pelos termos;
  - regiões disponíveis;
  - deploy hook ou API de deploy;
  - health check;
  - exigência de cartão.
  — **Reversibility:** reversible — o container é portátil e configurado só por env. Trocar de host é apontar `API_URL` para outro lugar.
- **D-02:** O HTTPS usa o domínio nativo da plataforma (`*.onrender.com` ou `*.koyeb.app`). Não há DuckDNS, Caddy nem VM. Como o Next é BFF, nenhum cookie vive no domínio da API, então o hostname da plataforma basta. Configurar `trust proxy` do Express para o proxy da plataforma escolhida; o pesquisador confirma o número de hops.
- **D-03:** O pesquisador decide a hibernação: manter a API acordada com ping externo a cada 5 a 10 minutos, ou projetar para o sono (crons movidos para o GitHub Actions chamando endpoints protegidos, fallback ou cache no Next). A recomendação precisa considerar:
  - o impacto em `@nestjs/schedule` e nos futuros jobs pg-boss (Fase 4);
  - o timeout das funções da Vercel durante um cold start;
  - o keep-alive do Supabase (pausa após 7 dias);
  - o limite de horas por mês;
  - se os termos da plataforma permitem o ping.
- **D-04:** Colocação. A regra prioritária é API e banco na **mesma região** (ou a mais próxima possível), porque cada requisição faz várias consultas. As funções da Vercel ficam na região mais próxima da API (`regions` no config da Vercel). O pesquisador escolhe a região concreta depois de definir o host. Nenhuma das plataformas tem região no Brasil; se o host for o Render na Virginia, a recomendação é Supabase em `us-east-1` e Vercel em `iad1`.
- **D-05:** O projeto Supabase **ainda não foi criado** (a conta existe). Ele será criado depois da D-04, na região escolhida, como tarefa manual do autor (checkpoint humano no plano). — **Reversibility:** one-way — a região de um projeto Supabase é imutável. Mudar depois exige um projeto novo e a migração dos dados. Hoje é barato porque o projeto estaria vazio.
- **D-06:** Contas existentes: GitHub e Vercel; a conta Supabase existe, sem projeto. Precisam ser criadas pelo autor (tarefas manuais no plano): Render, Koyeb, Sentry e o monitor de uptime, se o pesquisador escolher um.

**Repositório, portões de qualidade e deploy**
- **D-07:** Repositório **público** no GitHub. Com isso, os rulesets e a branch protection valem de graça, os minutos do Actions são ilimitados e o repo serve de portfólio. Consequências obrigatórias:
  - varredura de segredos na CI (gitleaks ou equivalente), com GitHub secret scanning e push protection ativos;
  - logs do Actions são públicos: nunca imprimir segredos, connection strings ou conteúdo de dumps;
  - artefatos do Actions de repo público são baixáveis por terceiros: o backup **não** pode ficar como artefato.
  — **Reversibility:** costly — depois de público, o histórico pode ter sido clonado. Um segredo vazado precisa ser rotacionado, não dá para "despublicar".
- **D-08:** Uma branch por fase, com merge na `main` via PR.
  - Renomear a branch local `master` para `main` antes do primeiro push (feito nesta sessão).
  - GSD com `git.branching_strategy: "phase"` (template `gsd/phase-{phase}-{slug}`), já aplicado em `.planning/config.json`.
  - Ruleset da `main`: PR obrigatório (0 aprovações, porque o dev é solo), status checks obrigatórios (lint, typecheck, testes API, testes web, E2E, varredura de segredos), sem force push e sem deleção.
- **D-09:** O pre-push roda lint, typecheck, testes unitários e testes de **integração com Postgres real**, via Turborepo com cache, para rodar só o que mudou. O Postgres local sobe por `docker compose`. O E2E com Playwright roda **só na CI**. Pré-requisito manual: ativar a integração WSL do Docker Desktop. Hoje `docker`, `pnpm` e `gh` não estão instalados no WSL do autor.
- **D-10:** Deploy **automático no merge** para a `main` com CI verde:
  - **Web:** a integração Git da Vercel publica em produção, e cada PR ganha um preview deploy.
  - **API:** o workflow do GitHub Actions gera a imagem, publica no GHCR e aciona o deploy hook da plataforma primária.
  - A arquitetura da imagem acompanha o host escolhido (provavelmente `linux/amd64`; arm64 deixa de ser requisito).
  - `prisma migrate deploy` roda no pipeline antes da nova versão da API subir, usando a credencial de migração (`postgres`). O passo exato fica a critério do Claude.

### Claude's Discretion
O autor não quis discutir estes pontos. Seguir a pesquisa (`.planning/research/`) salvo justificativa:
- **ORM:** Prisma 7.10.1 com pin exato de `prisma`, `@prisma/client` e `@prisma/adapter-pg`, com o RLS em SQL puro nas migrations. Isso resolve o bloqueio "ORM a confirmar" do STATE.md. — **Reversibility:** costly — trocar o ORM depois mexe em todos os repositórios e migrations.
- **Backup noturno (OPS-03):** sem VM, o `pg_dump` roda num workflow agendado do GitHub Actions, pelo pooler em session mode. O dump é criptografado (por exemplo `age`: chave pública no repo, chave privada offline com o autor).
  - Destino fora do Supabase, de custo zero e **não público**. Candidatos: repo GitHub privado separado (releases), Google Drive via rclone ou Cloudflare R2. O pesquisador escolhe o que não exige cartão.
  - Retenção de cerca de 30 dias.
  - Um restore testado num Postgres local ou de rascunho, com o tempo anotado.
- **Keep-alive diário:** uma consulta real ao banco (`SELECT 1` em `/health/ready`), combinada com a solução da D-03. Ping em página cacheada não conta.
- **Ferramenta do hook de pre-push:** Husky ou Lefthook.
- **Conteúdo da página do esqueleto:** uma página pública mínima, sem identidade visual (a identidade é da Fase 2), que mostra dados buscados no servidor da API, como versão/commit, status do banco e horário.
- **Migration baseline:**
  - criar o papel `app_api` (login, sem `BYPASSRLS`, não owner, com grants explícitos);
  - revogar os grants padrão de `anon` e `authenticated` em `public`;
  - criar uma tabela mínima para provar RLS e grants;
  - teste na CI garantindo que toda tabela de `public` tem RLS ativo e que o acesso anônimo via PostgREST não lê nada.
  O pesquisador define como a CI confere o PostgREST: stack local do Supabase CLI e/ou checagem contra produção com a chave publishable.
- **Proibição de HTML bruto (SEC-03):** regra de lint (`react/no-danger` ou equivalente) e uma checagem na CI que falha se aparecer `dangerouslySetInnerHTML` no código web.
- **Previews da Vercel:** que API os previews chamam (produção, nenhuma, ou mock) fica a critério do Claude, sem expor segredos de produção a PRs de forks.
- **Sentry:** dois projetos (web e api), `tracesSampleRate` baixo.

### Deferred Ideas (OUT OF SCOPE)
- **Risco para a Fase 5:** o processamento com `sharp` num container de cerca de 512 MB e CPU fracionada pode estourar memória. O spike "`sharp` no shape real" da Fase 5 agora roda sobre o PaaS escolhido, não sobre uma VM.
- **Risco para a Fase 4:** se a API puder hibernar (D-03), os jobs pg-boss e os crons precisam tolerar o sono ou ser disparados de fora.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| QA-01 | Testes unitários e de integração com Vitest na API e no web, incluindo integração com Postgres real | Vitest 4.1.12 + Vite 8.3.8 (template oficial Nest 12 ESM); imagem `supabase/postgres:17.x` como Postgres de teste (compose local e `services:` na CI); padrão de globalSetup com `prisma migrate deploy` |
| QA-02 | Testes E2E com Playwright cobrindo os fluxos principais, com verificação de acessibilidade (axe) | Playwright 1.65.1 + `@axe-core/playwright` 4.14.0; job E2E só na CI com API e web construídos e Postgres de serviço |
| QA-03 | Hook de pre-push roda lint, typecheck e testes e bloqueia o push se algo falhar | Husky 9.1.7 chamando `turbo run` com cache; `docker compose up --wait` idempotente antes dos testes de integração; CI é o portão real (o hook pode ser burlado com `--no-verify`) |
| QA-04 | CI no GitHub Actions roda toda a suíte; branch `main` protegida exige checks verdes para merge | Workflow `ci.yml` com job agregador único `ci-ok` (check obrigatório estável) + ruleset via `gh api`; gitleaks; ações fixadas por SHA |
| OPS-01 | Logs estruturados, monitoramento de erros (Sentry) e health check da API | `nestjs-pino` com `redact`; `@sentry/nestjs` com `node --import`; `/health/live` (sem banco) e `/health/ready` (com banco) via Terminus |
| OPS-02 | Deploy do Next na Vercel e da API em Docker num PaaS gratuito com HTTPS; plano B testado ao menos uma vez | Render (primário) + Railway (plano B, boot único); Koyeb eliminada; imagem GHCR pública; deploy hook com `imgURL`; Vercel `iad1` |
| OPS-03 | Backup noturno do banco fora do Supabase, em destino privado, e keep-alive que impede a pausa do Supabase | `pg_dump` + `age` no GitHub Actions, destino = releases de repo GitHub privado; escrita em tabela `heartbeat` no mesmo job; UptimeRobot em `/health/ready` |
| SEC-03 | Validação de entrada em toda a API, Helmet, CORS restrito e conteúdo renderizado sem HTML bruto | `StandardSchemaValidationPipe` global (Nest 12) com Zod de `packages/shared`; `helmet`; `enableCors` com allowlist; regra ESLint `react/no-danger` + script de CI |
| SEC-04 | RLS habilitado em todas as tabelas do Supabase, com a API usando um papel de banco sem bypass de RLS | Migration baseline (papel `app_api`, revoke de grants, RLS + policy); teste de integração que consulta `pg_class`/`has_table_privilege`; smoke contra produção com a chave publishable |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

Diretivas extraídas de `/home/jgui/Blog No Law/.claude/CLAUDE.md` (mesma autoridade das decisões travadas). As seções de Oracle, Caddy, DuckDNS, `trust proxy` atrás do Caddy e imagem arm64 estão SUPERADAS pelo CONTEXT.md (D-01/D-02):

- TypeScript ponta a ponta; Next.js (frontend), NestJS (backend), Supabase (Postgres, Auth, Storage).
- Custo mensal zero (apenas planos gratuitos).
- NestJS é servidor persistente (container Docker), não serverless; API containerizada e configurada só por variáveis de ambiente.
- Segurança: aplicação pública; auth, rate limit, validação, XSS, auditoria.
- TDD obrigatório (RED, GREEN, REFACTOR); SDD (contratos Zod em `packages/shared` antes do código); BDD (cenários Dado/Quando/Então viram E2E); DDD pragmático.
- Nada sobe para o GitHub sem testes passando.
- Versões fixadas: Node 26.x, TypeScript `~6.0.3`, pnpm, Turborepo 2.11.11, Next 16.4.6, NestJS 12.5.0 (ESM, `module: nodenext`, `.js` nos imports relativos), Prisma 7.10.1 exato (`prisma`, `@prisma/client`, `@prisma/adapter-pg`), Vitest 4.1.12 (não Vitest 5), ESLint 9.39.x no web (não ESLint 10), oxlint na API, Zod 4.6.7, Sentry 11.12.0, nestjs-pino 5.3.1.
- Evitar: `prisma@latest` sem pin (resolve para 8.0 RC), `middleware.ts` (usar `proxy.ts`), `next lint`, `cookies()`/`params` síncronos, Corepack (não vem no Node 26), Jest, `nestjs-zod`, `@nest-lab/throttler-storage-redis`, `discord.js`.
- Conexão do Prisma pelo pooler Supavisor em session mode (porta 5432), usuário `postgres.<ref>`; papel `app_api` sem `BYPASSRLS` em runtime; credencial `postgres` só para migrations.
- Fixar ações de terceiros por SHA; Dependabot para Actions.
- Fluxo GSD: não editar o repositório fora de um comando GSD.

## Summary

A decisão mais importante desta pesquisa: **a Koyeb está eliminada** e a **Render é a plataforma primária**. A Koyeb anunciou (no post oficial da aquisição pela Mistral AI) que "new users will instead need to subscribe to the Pro, Scale, or Enterprise plan" e que é preciso "a valid payment method"; a página de preços atual começa em Pro a US$29/mês. Isso quebra "custo zero" e "sem cartão". A Render continua com web service gratuito de 512 MB / 0,1 CPU, 750 horas de instância por mês por workspace, desligamento após 15 minutos sem tráfego de entrada, sem disco persistente, deploy hook e health check. Sobre o cartão: a própria Render publica que "No credit card is required", mas há relatos de comunidade pedindo cartão em Blueprints, então o plano é criar o serviço manualmente pelo painel. O plano B recomendado é a **Railway** (trial de US$5 sem cartão segundo o FAQ oficial de preços, imagem pública do GHCR). Ele prova portabilidade com um boot, mas não é um standby gratuito contínuo: depois do trial o plano Free dá só US$1/mês de crédito. A formulação honesta é "plano B testado + procedimento de emergência", não "segundo host grátis permanente".

Para a hibernação (D-03), a recomendação é **manter a API acordada com UptimeRobot a cada 5 minutos E projetar a aplicação para tolerar o sono**. Um serviço sempre acordado consome 744 h em mês de 31 dias, dentro das 750 h do workspace, desde que seja o único web service gratuito do workspace. As páginas oficiais lidas da Render não mencionam nem proíbem pings, e a página de boas práticas de uptime recomenda monitoramento externo, mas a política de uso aceitável não pôde ser lida (renderizada por JavaScript): a permissão fica como `[ASSUMED]`. Por isso o desenho não pode depender do ping: o Next usa fetch com timeout curto e fallback, não há estado em memória na API, o keep-alive do Supabase vem de uma escrita diária num job do GitHub Actions, e jobs críticos ficam no pg-boss (durável) ou no Actions, nunca em `@nestjs/schedule` como única garantia.

O núcleo técnico é standard e bem documentado: monorepo pnpm + Turborepo, Nest 12 em ESM, Prisma 7 com `@prisma/adapter-pg`, Zod em `packages/shared` como contrato único, Vitest com Postgres real (imagem `supabase/postgres`, que já traz os papéis `anon`/`authenticated`/`service_role`), Playwright + axe na CI, Husky no pre-push e um job agregador `ci-ok` como único check obrigatório do ruleset. Os maiores riscos são operacionais: o repositório é público (logs e artefatos públicos), o `pg_dump` precisa rodar com o papel `postgres` (um dump feito como `app_api` sai vazio por causa do RLS), o escalonamento de `schedule` do Actions é desligado após 60 dias sem atividade em repo público, e o número de hops do `trust proxy` da Render não é documentado oficialmente (resolvido por uma sonda no primeiro deploy, com default conservador 1).

**Primary recommendation:** Render (Virginia) como primária + Railway como plano B de boot único; Supabase `us-east-1` + Vercel `iad1`; UptimeRobot a cada 5 min em `/health/live` e `/health/ready`; backup `pg_dump | age` para releases de um repo GitHub privado com retenção de 30 dias; e começar o plano por um Walking Skeleton (monorepo + `/status` + página Next no ar nas duas plataformas) antes de qualquer portão de qualidade.

## Decisões entregues ao planejador (uma recomendação por item)

| Item | Decisão | Confiança | Reversível? |
|------|---------|-----------|-------------|
| D-01 primária | **Render**, Free web service, serviço criado manualmente no painel, imagem pública do GHCR (fallback: runtime Docker com Dockerfile do repo, auto-deploy desligado + deploy hook) | MEDIUM-HIGH | Sim |
| D-01 plano B | **Railway** (Trial US$5 sem cartão; imagem pública GHCR). Alternativas descartadas: Koyeb (exige Pro US$29 + cartão), Northflank (docs conflitantes sobre cartão e "não usar em produção"), Hugging Face (Docker Space gratuito instável), Fly.io (sem free tier), Cloud Run (exige cartão) | MEDIUM | Sim |
| D-02 `trust proxy` | Variável `TRUST_PROXY_HOPS` validada por Zod, **default 1** (falha segura: errar para baixo apenas agrupa IPs); uma **sonda no primeiro deploy** decide se sobe para 2 (Cloudflare + load balancer da Render, hipótese sem documentação oficial) | LOW-MEDIUM (número) / HIGH (método) | Sim |
| D-03 hibernação | **Manter acordada** (UptimeRobot 5 min) **e** projetar para tolerar sono; jobs críticos fora do `@nestjs/schedule` | MEDIUM | Sim |
| D-04 regiões | Render **Virginia**, Supabase **`us-east-1` (North Virginia)**, Vercel **`iad1`** (Hobby = região única; é o default de novos projetos) | MEDIUM-HIGH | Supabase one-way |
| Backup | `pg_dump` (cliente 17, papel `postgres`, pooler 5432) `| age` para **releases de repo GitHub privado**, token fine-grained limitado a um repo, retenção 30 dias | MEDIUM-HIGH | Sim |
| CI do RLS | Teste de integração em SQL contra `supabase/postgres` + smoke PostgREST contra produção pós-deploy; stack `supabase start` completa adiada para a Fase 3 | MEDIUM | Sim |
| Pre-push | **Husky 9.1.7** chamando `pnpm turbo run ...` | HIGH | Sim |
| Uptime | **UptimeRobot** Free (5 min, sem cartão) | MEDIUM-HIGH | Sim |
| Previews Vercel | Previews chamam a **API de produção** (apenas GET público do `/status`, sem segredos no ambiente Preview) | MEDIUM-HIGH | Sim |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Página do esqueleto (versão, commit, status do banco, horário) | Frontend Server (SSR/Vercel) | API / Backend | O Next busca no servidor (BFF, nunca do browser) e renderiza; o dado nasce na API |
| Contrato `/status` (schema Zod) | API / Backend | Frontend Server | Schema vive em `packages/shared`; a API valida a saída e o Next faz `parse` da resposta |
| Validação de entrada, Helmet, CORS | API / Backend | — | Camada HTTP da API; CORS só importa para chamadas diretas de browser (nenhuma no BFF) |
| Health live/ready, keep-alive de leitura | API / Backend | Database | `live` sem dependências; `ready` consulta tabela real |
| RLS, papel `app_api`, grants | Database / Storage | API / Backend | Segunda camada de defesa; a API conecta como `app_api` |
| Migrations (`prisma migrate deploy`) | CI/CD (GitHub Actions) | Database | Roda no pipeline com credencial `postgres`, nunca no boot da API |
| Backup e keep-alive de escrita | CI/CD (GitHub Actions agendado) | Database, repo GitHub privado | Sem VM; independe da API estar acordada |
| Proibição de HTML bruto | CI (lint + script) | Frontend | Portão estático; o renderizador seguro vem na Fase 4 |
| Observabilidade (logs/Sentry) | API / Backend e Frontend Server | Sentry SaaS | Dois projetos Sentry; logs Pino na stdout da plataforma |
| Roteamento de região/HTTPS | CDN/Plataforma (Render, Vercel) | — | TLS terminado pela plataforma; sem Caddy |

## Standard Stack

Versões confirmadas com `npm view` em 2026-11-15, exceto quando indicado `[CITED: STACK.md]`.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | 26.x (dev 26.13.1) | Runtime | Default na Vercel (26.x); LTS; imagem `node:26-bookworm-slim` `[CITED: STACK.md]` |
| TypeScript | `~6.0.3` (registry: 6.0.3) | Linguagem | Limite de typescript-eslint e Nest CLI `[VERIFIED: npm registry]` |
| pnpm | 12.21.0 (registry `[VERIFIED: npm registry]`; nota de 2026-11-19: o STACK.md trazia uma versão anterior, alinhada a 12.21.0 pelo 01-01 Task 3) | Workspaces | Fixar via `packageManager`; `allowBuilds` em `pnpm-workspace.yaml` substitui `onlyBuiltDependencies` `[CITED: pnpm.io/cli/approve-builds]` |
| Turborepo | 2.11.11 | Tarefas com cache | `[VERIFIED: npm registry]` |
| Next.js / React | 16.4.6 / 19.3.1 | Web | `[VERIFIED: npm registry]` |
| NestJS (`@nestjs/common`/`core`/`platform-express`/`testing`) | 12.5.0 | API | `[VERIFIED: npm registry]` |
| `@nestjs/cli` / `@nestjs/schematics` | 12.0.13 | Build/geração | Template ESM lido do tarball `[VERIFIED: tarball]` |
| `@nestjs/terminus` | 12.1.0 | Health | `[VERIFIED: npm registry]` |
| Prisma (`prisma`, `@prisma/client`, `@prisma/adapter-pg`) | **7.10.1 exato** | ORM + migrations | `prisma@latest` = 8.0.0-rc.33 (armadilha) `[VERIFIED: npm view dist-tags]` |
| `pg` | 8.23.1 | Driver do adapter | `[VERIFIED: npm registry]` |
| Zod | 4.6.7 | Contratos compartilhados | `[VERIFIED: npm registry]` |
| `nestjs-pino` + `pino` + `pino-http` | 5.3.1 + 10.4.0 + 11.0.0 | Logs JSON | Versões travadas juntas `[VERIFIED: npm registry]` |
| `helmet` | 8.3.0 | Headers de segurança | `[VERIFIED: npm registry]` |
| `@sentry/nestjs` / `@sentry/nextjs` | 11.12.0 | Erros | `[VERIFIED: npm registry]` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest + `@vitest/coverage-v8` | 4.1.12 (latest é 5.1.0; NÃO usar) | Testes API/web/shared | Família do template oficial Nest 12 `[VERIFIED: npm registry]` |
| Vite | 8.3.8 | Runtime do Vitest (`resolve.tsconfigPaths`) | `[VERIFIED: npm registry]` |
| `supertest` + `@types/supertest` | 7.3.2 | Testes HTTP | `[VERIFIED: npm registry]` |
| `@playwright/test` + `@axe-core/playwright` | 1.65.1 + 4.14.0 | E2E + acessibilidade | `[VERIFIED: npm registry]` |
| `@testing-library/react` + `happy-dom` | 16.3.3 + 21.0.4 | Testes de componentes client no web | Opcional, só para componentes síncronos/client |
| Husky | 9.1.7 | pre-push | `[VERIFIED: npm registry]` |
| oxlint + oxlint-tsgolint | 1.93.0 + 7.0.2007 | Lint API/shared | Padrão do template Nest 12 `[VERIFIED: npm registry]` |
| ESLint + `eslint-config-next` | 9.39.5 + 16.4.6 | Lint web | ESLint 10 incompatível `[VERIFIED: npm registry]` |
| Prettier | 3.10.1 | Formatação | `[VERIFIED: npm registry]` |
| `dotenv` | 18.0.10 `[CITED: STACK.md]` | `.env` no `prisma.config.ts` | Prisma 7 não carrega `.env` sozinho `[CITED: prisma.io/docs prisma-config-reference]` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Render | Koyeb | Eliminada: novos usuários precisam de plano pago (Pro US$29) e cartão `[CITED: koyeb.com/blog Mistral]` |
| Husky | Lefthook 2.2.2 | Paralelismo desnecessário: o Turborepo já paraleliza e cacheia |
| UptimeRobot | Better Stack (10 monitors, freq. do free não confirmada) | Render recomenda Better Stack, mas a frequência do plano grátis não foi confirmada; UptimeRobot publica 5 min sem cartão |
| Releases de repo privado | Cloudflare R2 / Google Drive + rclone | R2 exige cartão `[ASSUMED]`; Drive com app OAuth em modo "testing" expira refresh token em 7 dias `[ASSUMED]` |
| `@nestjs/config` | Parse Zod manual (`loadEnv()`) | Preferir o manual: zero dependência extra e 100% testável; a opção Standard Schema do `@nestjs/config` 12 não foi verificada nesta sessão |
| Stack `supabase start` na CI | Imagem `supabase/postgres` + SQL | A imagem dá os papéis reais em segundos; a stack completa (10+ containers) só se justifica na Fase 3 (Auth) |

**Installation:** (na ordem do plano; o `packageManager` fixa o pnpm)
```bash
npm install -g pnpm@12.21.0   # Node 26 não traz Corepack
pnpm add -E prisma@7.10.1 @prisma/client@7.10.1 @prisma/adapter-pg@7.10.1 --filter api
```

**Version verification:** executado em 2026-11-15 com `npm view <pkg> version` para todas as linhas marcadas `[VERIFIED: npm registry]` (ver tabela acima).

## Package Legitimacy Audit

Executado `gsd-tools query package-legitimacy check --ecosystem npm ...` em 41 pacotes. Resultado bruto: 4 `OK`, 37 `SUS`, 0 `SLOP`. **Leitura honesta dos SUS:** as razões foram apenas `too-new` (a *última versão* foi publicada há menos de ~2 semanas, normal em pacotes ativos como Nest/Next/Sentry) e `unknown-downloads` (a API de downloads devolveu 0 depois de muitas consultas seguidas, artefato de rate limit; o mesmo pacote retornou milhões de downloads na primeira chamada). Todos são pacotes consolidados, com repositório de origem, nenhum com `postinstall` suspeito (`prisma`, `@sentry/*`, `turbo`, `oxlint`, `husky`, `supabase`, `@nestjs/core` sem script; `@prisma/engines` e `esbuild` têm o postinstall padrão de baixar binário). Nenhum nome veio de busca web: todos vêm do `STACK.md` já revisado e/ou foram confirmados no registry.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `@prisma/client`, `@prisma/adapter-pg`, `pg`, `@nestjs/terminus`, `nestjs-pino` | npm | anos | 4M a 99M/sem | github.com/prisma/orm, brianc/node-postgres, nestjs/terminus, iamolegga/nestjs-pino | OK | Approved |
| `prisma`, `@nestjs/core`, `@nestjs/platform-express`, `next`, `dotenv` | npm | anos | 24M a 262M/sem | github.com/prisma/prisma-cli, nestjs/nest, motdotla/dotenv | SUS (`too-new`: release recente) | Approved com pin de versão; o lockfile e o `packageManager` já cumprem o papel de checkpoint |
| `@nestjs/cli`, `@nestjs/testing`, `@nestjs/config`, `pino`, `pino-http`, `pino-pretty`, `helmet`, `zod`, `react`, `react-dom`, `husky`, `turbo`, `vitest`, `@vitest/coverage-v8`, `supertest`, `@playwright/test`, `@axe-core/playwright`, `oxlint`, `oxlint-tsgolint`, `eslint`, `eslint-config-next`, `typescript`, `supabase`, `@supabase/supabase-js`, `@supabase/ssr`, `@sentry/nestjs`, `@sentry/nextjs`, `@testcontainers/postgresql`, `reflect-metadata`, `rxjs`, `@types/node`, `@types/pg`, `tailwindcss` | npm | anos | downloads "0" = falha da API de downloads | repositórios oficiais | SUS (`unknown-downloads` e/ou `too-new`; falso positivo) | Approved; **um único** `checkpoint:human-verify` em lote antes do primeiro `pnpm install` (autor confere a lista de dependências e o lockfile), em vez de um por pacote |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** ver tabela; tratados por um checkpoint único em lote (decisão do pesquisador: o veredito do seam é heurístico e dispara em qualquer pacote ativo).

*Pacotes novos desta pesquisa fora do STACK.md: nenhum além de Husky (já listado no STACK) e as ferramentas de infraestrutura não-npm abaixo (`age` v1.3.2, `gitleaks` v8.30.1 / `gitleaks-action` v3.0.0, `supabase/postgres` imagem Docker), todas verificadas em releases oficiais do GitHub/Docker Hub nesta sessão.*

## Architecture Patterns

### System Architecture Diagram

```
 Visitante (browser)
      |  HTTPS
      v
 +-------------------------+        build/deploy        +---------------------------+
 | Vercel (Hobby, iad1)    |<---- Git integration ------| GitHub (repo PUBLICO)     |
 | Next.js 16 (SSR + BFF)  |                            |  - ci.yml (ci-ok)         |
 | app/page.tsx            |                            |  - deploy-api.yml         |
 +-----------+-------------+                            |  - backup.yml (cron)      |
             | fetch servidor->servidor, HTTPS,         +----+----------+-----------+
             | timeout 5s + fallback                         |          |
             v                                               | push     | hook (GET/POST)
 +-------------------------+   imagem pública GHCR    +------v---+  +---v------------------+
 | Render Free (Virginia)  |<-------------------------| GHCR     |  | Repo privado         |
 | Container Nest 12 (ESM) |   deploy hook ?imgURL    | api:SHA  |  | blog-no-law-backups  |
 |  /health/live  (sem DB) |                          +----------+  | releases *.sql.age   |
 |  /health/ready (DB)     |                                        +----------^-----------+
 |  /status (Zod)          |<-- UptimeRobot 5 min (live + ready) ---+           |
 |  Helmet/CORS/Zod/Pino   |                                                    | gh release (PAT)
 +-----------+-------------+                                                    |
             | Prisma 7 + adapter-pg, papel app_api (sem BYPASSRLS)             |
             | pooler Supavisor SESSION 5432 (IPv4)                             |
             v                                                                  |
 +-------------------------------+   pg_dump | age (papel postgres)  -----------+
 | Supabase us-east-1 (Free)     |<---- GitHub Actions cron diario (UPDATE heartbeat + dump)
 | Postgres 17: RLS em todas as  |<---- prisma migrate deploy (papel postgres, pooler 5432) no deploy-api.yml
 | tabelas; anon/authenticated   |
 | sem grants; tabela heartbeat  |<---- smoke pos-deploy: curl PostgREST com chave publishable => nada lido
 +-------------------------------+

 Sentry (2 projetos: api, web) <--- erros   |   Plano B: mesma imagem GHCR -> Railway (boot unico, /health/live)
```

### Recommended Project Structure
```
.
├── apps/
│   ├── api/
│   │   ├── src/{main.ts,instrument.ts,app.module.ts}
│   │   ├── src/config/env.ts            # loadEnv() com Zod, falha rápida no boot
│   │   ├── src/health/                  # live + ready (Terminus + indicator Prisma)
│   │   ├── src/status/                  # GET /status (query Zod, resposta Zod)
│   │   ├── src/prisma/                  # PrismaService (adapter-pg, app_api)
│   │   ├── prisma/{schema.prisma,migrations/}
│   │   ├── prisma.config.ts             # datasource.url = MIGRATE_DATABASE_URL
│   │   ├── test/                        # *.e2e-spec.ts (supertest) + *.int-spec.ts
│   │   └── Dockerfile
│   └── web/
│       ├── app/page.tsx                 # busca /status no servidor
│       ├── lib/api.ts                   # fetch com AbortSignal.timeout + parse Zod
│       ├── e2e/                         # Playwright + axe
│       └── playwright.config.ts
├── packages/shared/src/                 # status.ts (schemas), env/erros comuns
├── scripts/                             # check-no-raw-html.mjs, smoke-postgrest.sh, restore-drill.sh
├── .github/workflows/                   # ci.yml, deploy-api.yml, backup.yml
├── .husky/pre-push
├── compose.test.yaml                    # supabase/postgres:17.x
├── docs/runbooks/                       # render.md, plano-b-railway.md, backup-restore.md, rotacao-segredos.md
├── turbo.json  pnpm-workspace.yaml  package.json (packageManager)
```

### Pattern 1: Walking Skeleton em fatias finas (sequenciamento sugerido para o planejador)
**What:** a primeira fatia entrega o fio completo mais fino possível (Next no ar lendo `/status` da API no ar), sem banco, antes de qualquer portão. O restante engrossa o fio.
**When to use:** modo MVP desta fase.
**Sequência:**
0. **Wave 0 (manual + spikes):** instalar `pnpm`, integração WSL do Docker Desktop, `gh`, `jq`; criar repo público, push inicial da `main` (só docs), criar contas Render/Railway/Sentry/UptimeRobot; confirmar regiões; **criar o projeto Supabase só depois da região fixada**; spikes listados em "Open Questions".
1. **Fatia 1 (fio fino, sem banco):** monorepo + `packages/shared` (`statusResponseSchema`) + Nest `/health/live` e `/status` + Dockerfile + página Next + deploy manual na Render e na Vercel. Prova HTTPS servidor a servidor e a imagem.
2. **Fatia 2 (banco):** Prisma 7 + migration baseline (`app_api`, RLS, `heartbeat`) + `/health/ready` + Postgres de teste (compose) + testes de integração do RLS.
3. **Fatia 3 (portões):** Husky pre-push, `ci.yml` com `ci-ok`, gitleaks, gate de HTML bruto, Playwright + axe, só então o ruleset da `main` (os nomes dos checks só existem depois da primeira execução).
4. **Fatia 4 (endurecimento):** Helmet, CORS, `StandardSchemaValidationPipe`, Pino com redação, Sentry, `trust proxy` + sonda.
5. **Fatia 5 (entrega contínua):** `deploy-api.yml` (build, GHCR, migrate, hook, verificação de commit, smoke PostgREST) + boot do plano B.
6. **Fatia 6 (operação):** `backup.yml` (heartbeat + dump + age + release), restore drill cronometrado, UptimeRobot.

### Pattern 2: Job agregador `ci-ok` como único check obrigatório
**What:** um job final com `needs: [lint, typecheck, test-api, test-web, e2e, secrets, docker-build]` e `if: always()`, que falha se qualquer `needs.*.result` for diferente de `success`. O ruleset exige só `ci-ok`.
**Why:** adicionar jobs nas fases seguintes não obriga a editar o ruleset; um check "skipped" conta como aprovado e esconderia falha, então o agregador confere os resultados explicitamente.
**Example:**
```yaml
# Source: padrão de GitHub Actions (necessário conferir result explícito de cada need)
ci-ok:
  if: always()
  needs: [lint, typecheck, test-api, test-web, e2e, secrets, docker-build]
  runs-on: ubuntu-latest
  steps:
    - run: |
        echo '${{ toJSON(needs) }}' | grep -q '"result": "\(failure\|cancelled\|skipped\)"' && exit 1 || exit 0
```
Observação: `toJSON(needs)` não contém segredos; é seguro em log público.

### Pattern 3: Contrato Zod único (SDD) para `/status`
**What:** `packages/shared` exporta `statusQuerySchema` e `statusResponseSchema`. A API valida a query com `StandardSchemaValidationPipe` e o Next faz `statusResponseSchema.parse()` na resposta. Teste RED antes: `?detail=bogus` retorna 400.
**Source:** `[CITED: docs.nestjs.com/techniques/validation]`
```typescript
// packages/shared/src/status.ts
import { z } from 'zod';
export const statusQuerySchema = z.strictObject({
  detail: z.enum(['basic', 'full']).default('basic'),
});
export const statusResponseSchema = z.object({
  service: z.literal('api'),
  version: z.string(),
  commit: z.string(),
  db: z.enum(['up', 'down']),
  time: z.iso.datetime(),
});
export type StatusResponse = z.infer<typeof statusResponseSchema>;

// apps/api/src/status/status.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
@Get('status')
get(@Query({ schema: statusQuerySchema }) q: StatusQuery) { /* ... */ }
```
(`z.iso.datetime()` é Zod 4 `[ASSUMED]`; confirmar no RED.)

### Pattern 4: Papel `app_api`, grants explícitos e RLS (migration baseline em SQL puro)
**What:** o Prisma Migrate (credencial `postgres`) cria tabelas; a mesma migration cria o papel, revoga os defaults de `anon`/`authenticated`/`service_role`, habilita RLS e cria policy só para `app_api`. A senha do papel NÃO entra no git: `ALTER ROLE app_api PASSWORD ...` é passo manual no Supabase (e no setup de teste).
**Source:** revoke de default privileges `[CITED: supabase.com/docs/guides/api/securing-your-api]`; restante `[ASSUMED]` (padrão SQL; validar no spike do Postgres).
```sql
-- migration baseline (esqueleto)
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_api') THEN
    CREATE ROLE app_api LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
END $$;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated, service_role;

CREATE TABLE heartbeat (
  id      smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  beat_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO heartbeat DEFAULT VALUES;

ALTER TABLE heartbeat ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON heartbeat FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO app_api;
GRANT SELECT ON heartbeat TO app_api;
CREATE POLICY heartbeat_app_api_select ON heartbeat FOR SELECT TO app_api USING (true);

-- A tabela de controle do Prisma também vive em public e precisa de RLS para passar na checagem da CI
ALTER TABLE _prisma_migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON _prisma_migrations FROM anon, authenticated;
```

### Pattern 5: Health em duas camadas
**What:** `GET /health/live` (processo vivo, zero dependências) é o `healthCheckPath` da Render e o alvo do monitor de "manter acordada". `GET /health/ready` (e o alias `/health`) consulta `heartbeat` via Prisma como `app_api` e devolve 503 se o banco cair; é o alvo do segundo monitor e gera a atividade real de banco.
**Why:** a Render reinicia a instância após 60 s de falhas consecutivas do health check `[CITED: render.com/docs/health-checks]`; se o health check dependesse do banco, uma oscilação do Supabase causaria loop de restart.

### Pattern 6: Deploy da API em `deploy-api.yml` (ordem importa)
1. build da imagem `linux/amd64` e push para `ghcr.io/<owner>/<repo>-api:<sha>` (barato e reversível);
2. `prisma migrate deploy` (credencial `postgres`, pooler 5432, secret do GitHub Environment `production`), com migrations **compatíveis com a versão antiga em execução** (expand/contract), porque a API antiga ainda serve durante a janela;
3. `curl` no deploy hook da Render com `imgURL=<imagem:sha>` (atenção: a URL do hook é segredo; não usar `-v`);
4. polling de `https://<api>/status` até `commit == github.sha` (limite de 10 min) para provar que a nova versão está no ar;
5. smoke PostgREST contra produção com a chave publishable.

### Anti-Patterns to Avoid
- **Blueprint `render.yaml` para o serviço grátis:** relatos de comunidade indicam que Blueprints pedem cartão mesmo com plano free `[CITED: community.render.com, MEDIUM-LOW]`. Criar o serviço pelo painel e documentar os valores no runbook.
- **Health check da plataforma dependente de banco:** ver Pattern 5.
- **Dump com `app_api`:** o RLS filtra silenciosamente as linhas e o backup sai vazio. O dump usa o papel `postgres`.
- **Backup como artefato do Actions:** artefatos de repo público são baixáveis por terceiros (D-07).
- **`pull_request_target` ou segredos expostos a PR de fork:** usar só `pull_request`; segredos não vão para forks por padrão.
- **`prisma migrate deploy` no boot da API:** corrida entre instâncias e credencial `postgres` dentro do runtime.
- **Confiar no primeiro IP de `X-Forwarded-For`:** a Render só acrescenta ao cabeçalho enviado pelo cliente, então o valor mais à esquerda é forjável `[CITED: feedback.render.com thread; MEDIUM-LOW]`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Validação de request | Pipes/guards próprios | `StandardSchemaValidationPipe` (Nest 12) + Zod | Core do Nest 12; mesmo schema no browser e na API `[CITED: docs.nestjs.com]` |
| Health checks | Controller manual com `try/catch` | `@nestjs/terminus` | Formato padrão, `up()/down()` |
| Redação de segredos em logs | `console.log` filtrado à mão | `nestjs-pino` `redact` | Caminhos declarativos, cobre `req.headers.authorization/cookie` |
| Erros em produção | Logger de exceções próprio | `@sentry/nestjs` (`SentryGlobalFilter`) | Já captura e agrupa `[CITED: docs.sentry.io]` |
| Criptografia do dump | `openssl enc` com senha, GPG improvisado | `age` (chave pública no repo, privada offline) | Sem gestão de senha no CI, formato simples `[ASSUMED]` |
| Varredura de segredos | Regex caseiro | `gitleaks` (action v3.0.0, sem licença para conta pessoal) | `[CITED: github.com/gitleaks/gitleaks-action]` |
| Cache/orquestração de tasks | Scripts em cadeia | Turborepo | Cache por entrada, pre-push só roda o que mudou |
| Segurança do HTTP | Cabeçalhos manuais | `helmet` | Defaults mantidos |
| Rotação de releases de backup | Script de retenção complexo | `gh release list/delete` com `jq` | Trivial e auditável |
| Roles do Supabase em teste | Reproduzir `anon/authenticated/service_role` à mão | Imagem `supabase/postgres:17.x` | Papéis e extensões idênticos ao serviço `[ASSUMED]` |

**Key insight:** esta fase é cola de infraestrutura. O custo escondido está em segredos, ordem de deploy e comportamento real de plataformas gratuitas; cada peça tem biblioteca/serviço padrão, e o trabalho do plano é a ordem e os testes que provam cada portão.

## Common Pitfalls

### Pitfall 1: Repositório público vaza por log, artefato ou cache
**What goes wrong:** connection string ou conteúdo de dump aparece num log do Actions (público para qualquer pessoa).
**Why it happens:** `set -x`, `curl -v`, mensagem de erro do `psql`/Prisma com URL, `env` impresso.
**How to avoid:** secrets só em `env:` do step, `set +x`, nunca `-v`, `::add-mask::` para valores derivados, saída do `pg_dump` direto para `age` (sem arquivo em claro, sem upload de artifact), `permissions: contents: read` por padrão.
**Warning signs:** gitleaks em modo workflow-logs, segredo aparecendo como `***` apenas parcialmente.

### Pitfall 2: Render adormece e o primeiro visitante espera ~1 minuto
**What goes wrong:** cold start de cerca de 1 minuto `[CITED: render.com/docs/free]` dentro de uma requisição SSR da Vercel (limite de 300 s no Hobby `[CITED: vercel.com/docs/functions/limitations]`), a página trava.
**How to avoid:** manter acordada (UptimeRobot) e, mesmo assim, `fetch` com `AbortSignal.timeout(5000)` + UI de degradação ("API indisponível"); nunca lançar erro 500 no SSR por causa da API.
**Warning signs:** TTFB de dezenas de segundos na home após madrugada sem tráfego.

### Pitfall 3: Limite de 750 horas tem pouca folga
**What goes wrong:** sempre acordado em mês de 31 dias = 744 h; folga de 6 h. Um segundo web service gratuito acordado no mesmo workspace estoura o limite e a Render suspende todos até o mês seguinte `[CITED: render.com/docs/free]`.
**How to avoid:** um único web service gratuito no workspace; o plano B NÃO roda na Render. Banda: Hobby inclui 5 GB/mês `[CITED: render.com/docs/outbound-bandwidth]`; o tráfego JSON da Fase 1 é irrisório, mas imagens nunca passam pela API (Fase 5 via Supabase Storage).
**Warning signs:** e-mail de uso da Render; serviço "suspended".

### Pitfall 4: `schedule` do GitHub Actions desliga sozinho
**What goes wrong:** "In a public repository, scheduled workflows are automatically disabled when no repository activity has occurred in 60 days" `[CITED: docs.github.com events-that-trigger-workflows]`. O backup e o keep-alive param silenciosamente.
**How to avoid:** cobertura dupla (cron do Actions + monitor externo batendo em `/health/ready`), lembrete no runbook, `workflow_dispatch` para disparo manual, e checagem de "último backup" no restore drill mensal. Agendar fora de minuto cheio (atrasos em horário de pico `[CITED: docs.github.com]`).

### Pitfall 5: `pg_dump` vazio por RLS
**What goes wrong:** dump com `app_api` ou outro papel sem `BYPASSRLS` devolve tabelas vazias sem erro.
**How to avoid:** dump com `postgres` (BYPASSRLS na Supabase `[CITED: STACK.md/PITFALLS.md]`); o restore drill compara contagens de linhas e a existência da linha de `heartbeat`. Cliente `pg_dump` deve ter versão >= servidor (usar `postgres:17` via Docker no runner; confirmar `SHOW server_version` na criação do projeto `[ASSUMED 17]`).

### Pitfall 6: Direto vs pooler
**What goes wrong:** a conexão direta é IPv6 no plano Free; runners do GitHub e a Render saem em IPv4 `[CITED: supabase.com/docs/guides/database/connecting-to-postgres]`.
**How to avoid:** sempre o pooler compartilhado em session mode: `postgresql://[ROLE].[PROJECT-REF]:...@aws-[INDEX]-us-east-1.pooler.supabase.com:5432/postgres` (copiar o host exato do diálogo Connect; o índice não é derivável). Para `app_api` o usuário é `app_api.<ref>`. Pool pequeno (`max` 5 a 10) e timeout de conexão.

### Pitfall 7: Prisma 7 e ESM
**What goes wrong:** `prisma generate` sem `output`, import do client sem extensão `.js` em `nodenext`, `.env` não carregado, `prisma@latest` baixando o 8.0 RC.
**How to avoid:** `provider = "prisma-client"`, `output = "../src/generated/prisma"`, `moduleFormat = "esm"` `[CITED: prisma.io/docs generators]`; `import "dotenv/config"` em `prisma.config.ts`; pins exatos; `datasource.directUrl` foi removido no v7, então a URL de migração é `datasource.url` lida de `MIGRATE_DATABASE_URL` `[CITED: prisma.io/docs prisma-config-reference]`.

### Pitfall 8: Turborepo em modo estrito de env
**What goes wrong:** testes de integração leem `DATABASE_URL_TEST`, mas o Turbo 2 não repassa variáveis não declaradas e os testes falham só sob `turbo`.
**How to avoid:** declarar em `turbo.json` (`env`/`passThroughEnv`) as variáveis de teste; incluir `prisma/migrations/**` nos `inputs` da task de integração para o cache não ficar obsoleto `[ASSUMED]`.

### Pitfall 9: Pnpm 11+/12 bloqueia scripts de build
**What goes wrong:** `esbuild`, `@prisma/engines` etc. não rodam postinstall e o build quebra com mensagem enigmática.
**How to avoid:** aprovar em `allowBuilds` no `pnpm-workspace.yaml` `[CITED: pnpm.io/cli/approve-builds]`. `pnpm deploy` no Dockerfile: `pnpm --filter api --prod deploy pruned`; se reclamar de dependências não injetadas, usar `--legacy` ou `injectWorkspacePackages` `[CITED: pnpm.io/cli/deploy]` (spike).

### Pitfall 10: GHCR privado por padrão
**What goes wrong:** a imagem recém-publicada é privada e a Render/Railway não conseguem puxar (Railway exige plano Pro para registry privado `[CITED: docs.railway.com/guides/services]`).
**How to avoid:** passo manual único: tornar o pacote **público** após o primeiro push (a ação é irreversível `[CITED: docs.github.com packages]`). A imagem só contém código já público e nenhum segredo (`.dockerignore` exclui `.env*`).

### Pitfall 11: Sentry em ESM
**What goes wrong:** `import './instrument'` na primeira linha de `main.ts` não instrumenta módulos ESM já resolvidos; o doc do Nest não cobre ESM `[CITED: docs.sentry.io nestjs]`.
**How to avoid:** carregar com `node --import ./dist/instrument.js dist/main.js` (doc Node `[CITED: docs.sentry.io node esm]`); smoke com rota de erro habilitada por flag (ver Code Examples). Enquanto não validado, é spike.

### Pitfall 12: Gate de HTML bruto bloqueia o JSON-LD futuro
**What goes wrong:** a Fase 6 (SEO) normalmente usa `dangerouslySetInnerHTML` para JSON-LD; o gate absoluto da Fase 1 trava essa fase.
**How to avoid:** o script falha em qualquer ocorrência, com uma **allowlist de caminho explícita e vazia** (`scripts/raw-html-allowlist.json`); a Fase 6 adiciona um único componente auditado. Documentar a exceção planejada.

### Pitfall 13: Vercel e o deploy da API não são atômicos
**What goes wrong:** no merge, a Vercel publica o web e o Actions publica a API em tempos diferentes; mudar o contrato `/status` de forma incompatível quebra a home por alguns minutos.
**How to avoid:** contratos compatíveis (campos novos opcionais), degradação no Next, e expand/contract nas migrations.

## Code Examples

### Valores do template oficial Nest 12 ESM (lidos do tarball `@nestjs/schematics@12.0.13` nesta sessão)
`[VERIFIED: @nestjs/schematics@12.0.13 dist/lib/application/files/ts-esm/package.json.template]`
```json
"type": "module",
"start:prod": "node dist/main",
"lint": "oxlint --type-aware src/ test/",
"test": "vitest run",
"test:e2e": "vitest run --config ./vitest.config.e2e.ts"
```
`[VERIFIED: ts-esm/tsconfig.json]`
```json
"module": "nodenext",
"moduleResolution": "nodenext",
"emitDecoratorMetadata": true,
"experimentalDecorators": true,
"target": "ES2023",
"types": ["vitest/globals", "node"]
```
`[VERIFIED: ts-esm/vitest.config.ts]`
```ts
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: { globals: true, root: './', include: ['**/*.<%= specFileSuffix %>.ts'] },
});
```
`[VERIFIED: ts-esm/.oxlintrc.json]` regra obrigatória: `"typescript/no-floating-promises": "error"`. `[VERIFIED: ts-esm/src/main.ts]` o bootstrap usa `await bootstrap();` no topo e `await app.listen(process.env.PORT ?? 3000);`.

### main.ts do esqueleto (endurecimento)
```typescript
// apps/api/src/main.ts  (padrão; valores de PORT/host são [ASSUMED] para a Render)
import { NestFactory } from '@nestjs/core';
import { StandardSchemaValidationPipe } from '@nestjs/common';   // [CITED: docs.nestjs.com]
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { loadEnv } from './config/env.js';

const env = loadEnv();                                   // Zod, falha rápida
const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
app.useLogger(app.get(Logger));
app.set('trust proxy', env.TRUST_PROXY_HOPS);            // default 1, sonda decide
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'none'"] } } }));
app.enableCors({
  origin: (origin, cb) => cb(null, !origin || env.CORS_ORIGINS.includes(origin)),
  credentials: false,
});
app.useGlobalPipes(new StandardSchemaValidationPipe());
app.enableShutdownHooks();
await app.listen(env.PORT, '0.0.0.0');
```
Teste de CORS: origem fora da lista => resposta **sem** `access-control-allow-origin` (o pacote `cors` não devolve erro; "recusa" = ausência do header).

### Logs Pino com redação
```typescript
// Source: [ASSUMED] padrão nestjs-pino; confirmar chaves no teste RED
LoggerModule.forRoot({
  pinoHttp: {
    redact: { paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]', '*.token', '*.password'], censor: '[REDACTED]' },
    level: process.env.LOG_LEVEL ?? 'info',
  },
});
```
Teste: enviar `Authorization: Bearer abc` e `Cookie: s=1`, capturar a saída do logger e afirmar que `abc` não aparece.

### Dockerfile (esqueleto multi-stage, amd64)
```dockerfile
# [ASSUMED] esqueleto; validar no spike de Wave 0
FROM node:26-bookworm-slim AS build
RUN npm i -g pnpm@12.21.0
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile \
 && pnpm --filter @blog/shared build && pnpm --filter api build \
 && pnpm --filter api --prod deploy /out          # fallback: --legacy
FROM node:26-bookworm-slim
ENV NODE_ENV=production
ARG GIT_SHA
ENV GIT_SHA=$GIT_SHA
USER node
WORKDIR /app
COPY --from=build --chown=node:node /out ./
CMD ["node","--enable-source-maps","--import","./dist/instrument.js","dist/main.js"]
```

### Rota de erro para o critério do Sentry
```typescript
// habilitada apenas com DEBUG_ROUTES_ENABLED=true (default false); ligar no painel da Render só durante a verificação
@Get('_debug/error')
boom() { if (!this.env.DEBUG_ROUTES_ENABLED) throw new NotFoundException(); throw new Error('sentry-smoke'); }
```

### Backup noturno (esqueleto)
```yaml
# .github/workflows/backup.yml  [ASSUMED: esqueleto; segredos em GitHub Environment "production"]
on:
  schedule: [{ cron: '17 5 * * *' }]     # fora de minuto cheio
  workflow_dispatch:
permissions: { contents: read }
jobs:
  backup:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: heartbeat (escrita real = keep-alive)
        run: docker run --rm -e PGPASSWORD="$DB_PASS" postgres:17 psql "host=$DB_HOST port=5432 user=$DB_USER dbname=postgres sslmode=require" -c "update public.heartbeat set beat_at = now()"
        env: { DB_HOST: ${{ secrets.DB_HOST }}, DB_USER: ${{ secrets.DB_USER }}, DB_PASS: ${{ secrets.DB_PASS }} }
      - name: dump criptografado -> release privada
        run: |
          set +x
          NAME="db-$(date -u +%Y%m%dT%H%M%SZ).dump.age"
          docker run --rm -e PGPASSWORD="$DB_PASS" postgres:17 \
            pg_dump "host=$DB_HOST port=5432 user=$DB_USER dbname=postgres sslmode=require" -Fc --no-owner --schema=public \
            | docker run --rm -i ghcr.io/filosottile/age -r "$AGE_RECIPIENT" > "$NAME"     # [ASSUMED imagem age] ou binário v1.3.2
          gh release create "bk-$(date -u +%Y%m%d)" "$NAME" --repo "$BACKUP_REPO" --notes "automatico"
          # retenção: apagar releases com mais de 30 dias via gh release list --json + jq
        env: { GH_TOKEN: ${{ secrets.BACKUP_REPO_TOKEN }}, BACKUP_REPO: ${{ vars.BACKUP_REPO }}, AGE_RECIPIENT: ${{ vars.AGE_RECIPIENT }} }
```
O restore drill: criar Postgres de rascunho (`supabase/postgres:17.x` ou `postgres:17` + `CREATE ROLE app_api`, `anon`, `authenticated`), `age -d -i chave_privada.txt | pg_restore --no-owner -d ...`, conferir `heartbeat` e `_prisma_migrations`, anotar o tempo em `docs/runbooks/backup-restore.md`.

### Verificação PostgREST pós-deploy (anon não lê nada)
```bash
# scripts/smoke-postgrest.sh  [ASSUMED comportamento do PostgREST; confirmar no spike]
code=$(curl -s -o /tmp/body -w '%{http_code}' -H "apikey: $SUPABASE_PUBLISHABLE_KEY" "$SUPABASE_URL/rest/v1/heartbeat?select=*")
# passa se: 401/403/404 (sem acesso) OU 200 com corpo '[]'
test "$code" != "200" -o "$(cat /tmp/body)" = "[]"
```
A chave publishable é pública por desenho; entra como *variable* do GitHub (não secret).

### Teste de integração do RLS (SQL real, Vitest)
```typescript
// apps/api/test/rls.int-spec.ts  [ASSUMED]
const tables = await adminSql`select c.oid, c.relname, c.relrowsecurity
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind='r'`;
for (const t of tables) expect(t.relrowsecurity, `RLS off em ${t.relname}`).toBe(true);
const r = await adminSql`select rolbypassrls, rolsuper from pg_roles where rolname='app_api'`;
expect(r[0]).toEqual({ rolbypassrls: false, rolsuper: false });
// anon: 'SET ROLE anon; select * from heartbeat' deve falhar com 42501
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Koyeb Starter grátis | Pro US$29 obrigatório para novos usuários | fev/2026 (tracking: 2026-02-26) | Koyeb fora da lista de PaaS gratuito |
| Render Hobby 100 GB de banda | 5 GB incluídos, US$0,15/GB depois | 1 ago 2026 (planos legados migrados) `[CITED: jwatte.com review; MEDIUM-LOW]` e `[CITED: render.com/docs/outbound-bandwidth]` | API não pode servir mídia |
| `datasource.directUrl` no Prisma | removido no v7; `datasource.url` no `prisma.config.ts` | Prisma 7 | URL de migração separada do runtime |
| `onlyBuiltDependencies` | `allowBuilds` | pnpm 11 | Configurar aprovação de scripts |
| `middleware.ts` / `next lint` | `proxy.ts` / ESLint CLI | Next 16 | Regras de lint próprias para o gate de HTML |
| Grants automáticos do Supabase em `public` | passando a opt-in ("Automatically expose new tables") | em andamento `[CITED: supabase.com/docs/guides/api/securing-your-api]` | Revogar defaults continua sendo obrigatório em projetos existentes |

**Deprecated/outdated:**
- Oracle Always Free como host: descartada por decisão do autor.
- Fly.io free tier: encerrado para novos usuários `[CITED: render.com/articles, MEDIUM]`.
- Vitest 5.1.0: existe, mas o template Nest 12 usa a família 4.1; manter 4.1.12.

## Assumptions Log

> Itens que precisam de confirmação do autor ou de um spike de Wave 0 antes de virarem decisão travada.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Free web service da Render aceita serviço "image-backed" (imagem do GHCR) | D-01, Pattern 6 | Pipeline D-10 precisa do fallback: runtime Docker do repo + deploy hook com `ref` (consome minutos de build) |
| A2 | Ping de keep-alive é tolerado pela Render (docs lidas silenciam; AUP/ToS não puderam ser lidos) | D-03 | Render pode suspender; mitigação: arquitetura tolera sono |
| A3 | Railway Trial não exige cartão, aceita imagem pública do GHCR e permite saída até o pooler 5432 (conta GitHub verificada) | D-01 plano B | Plano B precisa de outro candidato ou de cartão (decisão do autor) |
| A4 | Render "Virginia" fica na mesma região AWS que Supabase `us-east-1` | D-04 | Latência API-banco maior; medir `dbLatencyMs` no `/health/ready` após criar o projeto |
| A5 | Cadeia de proxies da Render: 1 ou 2 hops (Cloudflare + balanceador); não documentado oficialmente | D-02 | `req.ip` errado; efeito até a Fase 7 é só em logs |
| A6 | Projetos Supabase novos usam Postgres 17 | Backup, CI | `pg_dump` 17 falha contra servidor maior; ajustar imagem do cliente |
| A7 | `supabase/postgres:17.x` traz `anon`/`authenticated`/`service_role` e o `postgres` pode `CREATE ROLE`; funciona como `services:` do Actions | Validation | Fallback: `postgres:17` + SQL de bootstrap dos papéis |
| A8 | PostgREST responde `[]`/401/403 para `anon` sem grants (mesmo comportamento no OpenAPI) | SEC-04 | Ajustar asserção do smoke |
| A9 | Footprint de Node 26 + Nest + Prisma + Pino + Sentry cabe em 512 MB | D-01 | Reduzir `--max-old-space-size`, revisar imports |
| A10 | `pnpm --filter api --prod deploy` funciona (ou com `--legacy`) com `packages/shared` por `workspace:*` | Dockerfile | Estratégia alternativa de build do `shared` |
| A11 | `PrismaPg` aceita opções de pool do `pg` (`max`, `connectionTimeoutMillis`) | Prisma | Criar `Pool` do `pg` e passar ao adapter |
| A12 | `age` v1.3.2 (release 2026-08-29) disponível por binário/imagem confiável no runner | Backup | Instalar por release verificado (sha256) |
| A13 | UptimeRobot Free segue sem restrição de uso comercial e com 5 min (página oficial lida) | Uptime | Trocar por Better Stack |
| A14 | Token fine-grained com expiração de até 1 ano é aceito para a conta pessoal | Backup | Rotação anual no runbook |
| A15 | Limite do Supabase Data API: recomendar manter habilitada na Fase 1 (para o smoke fazer sentido) e avaliar desabilitar depois | SEC-04 | Se o autor preferir desabilitar, o smoke vira trivial |

## Open Questions (RESOLVED)

1. **Render aceita imagem do GHCR no plano Free?** (A1) — RESOLVED (planejamento): o plano 01-11 cria o serviço por imagem existente; se a opção não aparecer no Free, usa o runtime Docker do repositório com deploy hook (instrução no checkpoint do 01-11, Task 2).
   - O que sabemos: a página de deploy de imagem não restringe instance type; docs de preço não confirmam.
   - Lacuna: confirmação na criação do serviço.
   - Recomendação: spike de Wave 0 (criar serviço grátis a partir de `ghcr.io/...` público); se não houver a opção, adotar o fallback com Dockerfile no repo.
2. **Número de hops do `trust proxy` na Render.** — RESOLVED (planejamento): `TRUST_PROXY_HOPS` validado por Zod com default 1 (01-02/01-07); a sonda roda no 01-11 Task 3 com `X-Forwarded-For` forjado e leitura do `clientIp` no log da Render, com regra de decisão no `docs/runbooks/render.md`.
   - Sonda proposta (task do plano, primeiro deploy): endpoint temporário protegido por flag devolvendo `req.ip`, `req.ips`, `x-forwarded-for`, `cf-connecting-ip`, `true-client-ip` para um `curl` com `X-Forwarded-For: 1.2.3.4`. Se `req.ip` com hops=1 não for o IP real, usar 2. Remover a rota depois. Teste automatizado: com hops=N, valor forjado à esquerda é ignorado.
3. **O autor aceita Railway como plano B de "boot único" (não standby contínuo)?** — RESOLVED pela D-11 (2026-11-17): sim, boot único + runbook de emergência. Se quiser um plano B realmente gratuito e contínuo, hoje não há opção sem cartão confirmada. A alternativa é aceitar um cartão em Google Cloud Run/Northflank apenas para o teste.
4. **Quais partes de `.claude/` vão para o repo público?** — RESOLVED pela D-12: só `.claude/CLAUDE.md`; o resto entra no `.gitignore` antes do primeiro push (01-01 Task 2). (`gsd-core`, agents, hooks, manifestos). Recomendação: versionar só `.claude/CLAUDE.md`; ignorar o resto e `settings.local.json`. Exige decisão rápida do autor antes do primeiro push.
5. **Editar `.claude/CLAUDE.md`:** remover/reescrever as seções Oracle/Caddy/arm64 para refletir Render (tarefa de documentação do plano). — RESOLVED: 01-01 Task 3 reescreve a seção no CLAUDE.md e no STACK.md.
6. **Sentry + Nest 12 em ESM com `--import`:** spike de 15 minutos no Slice 4. — RESOLVED (planejamento): 01-07 Task 3 prova com teste que sobe o `dist` real por `--import` contra um ingest falso local; o 01-11 repete na Railway com o Sentry real.
7. **TLS do pooler com `pg` no Prisma 7:** o STACK recomenda `NODE_EXTRA_CA_CERTS` com a CA do Supabase; validar contra o pooler real no primeiro conectar. — RESOLVED (planejamento): CA versionada em `apps/api/certs/supabase-ca.crt`; `NODE_EXTRA_CA_CERTS` no runtime e nos scripts; `sslrootcert` relativo na URL do Prisma se preciso (01-06 Task 2, 01-11).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | tudo | ✓ | 26.13.1 | — |
| npm | instalar pnpm | ✓ | 11.20.0 | — |
| git | tudo | ✓ | 2.53.0 | — |
| pnpm | monorepo | ✗ | — | `npm i -g pnpm@12.21.0` (tarefa manual) |
| Docker (WSL) | compose de teste, build da imagem, pre-push | ✗ no WSL (binário existe só no Windows; "could not be found in this WSL 2 distro") | — | Ativar integração WSL do Docker Desktop (manual). Sem Docker, o pre-push de integração não roda |
| gh CLI | repo, ruleset, releases | ✗ | — | Instalar `gh` (manual); ruleset também por UI |
| jq | scripts de retenção | ✗ local; ✓ em runners `ubuntu-latest` `[ASSUMED]` | — | `apt install jq` |
| psql / pg_dump / age local | restore drill | ✗ | — | Usar containers `postgres:17` e binário `age` baixado |
| Contas | Render, Railway, Sentry (2 projetos), UptimeRobot | ✗ a criar (D-06) | — | tarefas manuais |
| Conta Supabase | banco | ✓ conta; ✗ projeto | — | criar em `us-east-1` depois da D-04 |
| Rede de saída até o pooler (porta 5432) | API, Actions | não testado | — | spike |

**Missing dependencies with no fallback:**
- Docker no WSL (bloqueia testes de integração locais, build de imagem e pre-push completo).

**Missing dependencies with fallback:**
- `pnpm`, `gh`, `jq`, `psql`, `age`: instalação simples; o runner do Actions já fornece parte.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.12 (API, web, shared) + Playwright 1.65.1 + `@axe-core/playwright` 4.14.0 |
| Config file | `apps/api/vitest.config.ts`, `apps/api/vitest.config.e2e.ts` (template Nest 12), `apps/web/vitest.config.ts`, `apps/web/playwright.config.ts` — todos ❌ Wave 0 |
| Quick run command | `pnpm turbo run lint typecheck test` |
| Full suite command | `pnpm turbo run lint typecheck test test:integration && pnpm --filter web test:e2e` (E2E só na CI) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| QA-01 | Unit/integração API e web, incluindo Postgres real | unit + integration | `pnpm --filter api test && pnpm --filter api test:integration` | ❌ Wave 0 |
| QA-02 | Home renderiza dado da API; axe sem violações | e2e | `pnpm --filter web test:e2e` | ❌ Wave 0 |
| QA-03 | Pre-push falha com lint/typecheck/teste quebrado | manual + script | `bash scripts/verify-prepush.sh` (injeta falha e espera exit != 0) | ❌ Wave 0 |
| QA-04 | `main` só aceita merge com `ci-ok`; ruleset ativo | smoke de configuração | `gh api repos/{o}/{r}/rulesets` + conferência no PR de teste | ❌ Wave 0 |
| OPS-01 | `/health/live`/`ready` corretos; log JSON sem segredo; erro chega ao Sentry | integration + manual | `pnpm --filter api test -- health logs` + verificação manual do Sentry | ❌ Wave 0 |
| OPS-02 | Home em produção mostra commit atual; imagem sobe no plano B | smoke pós-deploy | `curl $API/status` (commit == SHA) + `curl $RAILWAY/health/live` | ❌ Wave 0 |
| OPS-03 | Dump criptografado na release; restore bem-sucedido; heartbeat atualizado | manual cronometrado + integração do script | `scripts/restore-drill.sh` | ❌ Wave 0 |
| SEC-03 | 400 em entrada inválida; headers Helmet; CORS recusa origem; gate de HTML bruto | integration + CI | `pnpm --filter api test:e2e` e `node scripts/check-no-raw-html.mjs` | ❌ Wave 0 |
| SEC-04 | RLS em todas as tabelas; `app_api` sem bypass; anon não lê | integration + smoke | `pnpm --filter api test:integration -- rls` e `scripts/smoke-postgrest.sh` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm turbo run lint typecheck test` (cache do Turbo)
- **Per wave merge:** suíte completa com Postgres do compose
- **Phase gate:** `ci-ok` verde + checklist manual de OPS-02/OPS-03 antes de `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `apps/api/vitest.config.ts`, `vitest.config.e2e.ts`, `test/*.int-spec.ts` — QA-01, SEC-03, SEC-04
- [ ] `compose.test.yaml` com `supabase/postgres:17.x` e healthcheck
- [ ] `apps/web/playwright.config.ts` + `e2e/home.spec.ts` (com axe) — QA-02
- [ ] `scripts/check-no-raw-html.mjs`, `scripts/smoke-postgrest.sh`, `scripts/restore-drill.sh`, `scripts/verify-prepush.sh`
- [ ] Instalação de framework: `pnpm add -D vitest@4.1.12 @vitest/coverage-v8@4.1.12 vite@8.3.8 supertest @playwright/test @axe-core/playwright` e `pnpm exec playwright install --with-deps chromium`
- [ ] BDD: cenários Dado/Quando/Então da home e do `/status` escritos em `docs/bdd/` antes do E2E (SDD/BDD do projeto)

## Security Domain

`security_enforcement` está ativo (ASVS nível 1, bloqueio em `high`).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | não (Fase 3) | — |
| V3 Session Management | não (Fase 3) | — |
| V4 Access Control | sim (nível de banco) | RLS + papel `app_api` sem `BYPASSRLS`, revoke dos grants de `anon`/`authenticated`, teste de CI |
| V5 Input Validation | sim | Zod via `StandardSchemaValidationPipe`; `z.strictObject`; `z.coerce` em query |
| V6 Cryptography | sim (backup) | `age`; nenhum cripto próprio; TLS do pooler |
| V7 Error Handling and Logging | sim | Pino com `redact`; Sentry; sem corpo de erro com stack ao cliente |
| V8 Data Protection | sim | dump criptografado, destino privado; sem segredos no repo |
| V13/V14 API & Configuration | sim | Helmet, CORS allowlist, env validada, imagem não-root, `.dockerignore` |

### Known Threat Patterns for esta stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Segredo commitado em repo público | Information disclosure | gitleaks na CI, push protection, rotação (não existe "despublicar") |
| Segredo em log/artefato do Actions | Information disclosure | `set +x`, sem `-v`, sem artifact do dump, `permissions` mínimas |
| PR de fork lendo segredos | Elevation of privilege | só `pull_request`, sem `pull_request_target`; Vercel exige autorização para forks `[CITED: vercel.com/docs/git/vercel-for-github]` |
| Supply chain em Actions/deps | Tampering | ações de terceiros fixadas por SHA, Dependabot, lockfile, `allowBuilds` |
| `X-Forwarded-For` forjado | Spoofing | `trust proxy` por contagem de hops, nunca `true`; chave de rate limit por `sub` quando autenticado (Fase 7) |
| Data API aberta | Information disclosure | RLS + revoke + smoke anônimo em produção |
| Dump lido por terceiros | Information disclosure | repo privado + criptografia `age` (duas camadas) |
| Deploy hook exposto | Tampering | URL no GitHub Environment secret; rotação se vazar |
| XSS por HTML bruto | Tampering | `react/no-danger` + script de CI |

## Sources

### Primary (HIGH/MEDIUM confidence)
- npm registry (`npm view`, `dist-tags`), 2026-11-15: todas as versões da tabela do Standard Stack.
- Tarball `@nestjs/schematics@12.0.13` (template ESM lido sem executar): `package.json.template`, `tsconfig.json`, `vitest.config.ts`, `.oxlintrc.json`, `src/main.ts`.
- Render: https://render.com/docs/free (spin-down 15 min, 750 h, disco efêmero, suspensão por banda), https://render.com/docs/outbound-bandwidth (5 GB Hobby), https://render.com/docs/deploy-hooks (GET/POST, `key`, `imgURL`), https://render.com/docs/deploy-an-image (registries, GHCR), https://render.com/docs/health-checks (2xx/3xx em 5 s, restart após 60 s), https://render.com/docs/regions (Oregon, Ohio, Virginia, Frankfurt, Singapore), https://render.com/docs/compute-plans.md (free = 0.1 CPU / 512 MB), https://render.com/pricing.md.
- Koyeb: https://www.koyeb.com/blog/koyeb-is-joining-mistral-ai-to-build-the-future-of-ai-infrastructure ("must subscribe to one of our paid plans"), https://www.koyeb.com/pricing.
- Railway: https://docs.railway.com/reference/pricing/free-trial, https://docs.railway.com/reference/pricing/plans, https://docs.railway.com/guides/services (imagem pública GHCR; registry privado = Pro).
- Supabase: https://supabase.com/docs/guides/api/securing-your-api (revoke default privileges, "Enable Data API"), https://supabase.com/docs/guides/database/connecting-to-postgres (pooler, IPv4/IPv6, `[ROLE].[PROJECT-REF]`), https://supabase.com/docs/guides/platform/regions, https://supabase.com/docs/guides/deployment/going-into-prod (pausa 7 dias, sem backups baixáveis no Free), https://supabase.com/docs/guides/platform/billing-on-supabase (2 projetos, 500 MB, 5 GB).
- Vercel: https://vercel.com/docs/functions/configuring-functions/region (Hobby = região única, default `iad1`), https://vercel.com/docs/functions/limitations (300 s Hobby, 4,5 MB), https://vercel.com/docs/functions/runtimes/node-js/node-js-versions (26.x default), https://vercel.com/docs/git/vercel-for-github (autorização de forks).
- GitHub: https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows (60 dias, mínimo 5 min, só default branch), packages visibility (privado por padrão, público é irreversível), releases (2 GiB por arquivo, sem limite total), fine-grained PAT (escopo por repo, sem expiração permitida), https://github.com/gitleaks/gitleaks-action (sem licença para conta pessoal); releases via API (gitleaks v8.30.1, action v3.0.0, age v1.3.2, checkout v7.0.1, setup-node v7.1.0, pnpm/action-setup v6.1.1, docker actions).
- Prisma: https://www.prisma.io/docs/orm/reference/prisma-config-reference (`directUrl` removido, `datasource.url`), https://www.prisma.io/docs/orm/prisma-schema/overview/generators (`prisma-client`, `output`, `moduleFormat`), https://www.prisma.io/docs/orm/overview/databases/supabase (strings de conexão; página v6).
- NestJS: https://docs.nestjs.com/techniques/validation (`StandardSchemaValidationPipe`, `@Body({ schema })`); Sentry: https://docs.sentry.io/platforms/javascript/guides/nestjs/, https://docs.sentry.io/platforms/javascript/guides/node/install/esm/, https://sentry.io/pricing/ (5k erros, 5M spans, 1 usuário, 30 dias).
- UptimeRobot: https://uptimerobot.com/pricing/ (50 monitors, 5 min, sem cartão). pnpm: https://pnpm.io/cli/approve-builds, https://pnpm.io/cli/deploy.
- Docker Hub API: `supabase/postgres` tags 17.11.0.019 / 17.12.0.000 (amd64 + arm64).

### Secondary (MEDIUM/LOW confidence)
- Render community/feedback (comportamento de `X-Forwarded-For`, Blueprints pedindo cartão): https://feedback.render.com/features/p/send-the-correct-xforwardedfor, threads em community.render.com (relatos de usuários, não documentação oficial).
- https://odown.com/blog/how-to-keep-a-render-free-service-from-sleeping/ (matemática das 750 h, intervalo de ping; terceiro).
- https://jwatte.com/blog/render-com-platform-review.md (mudança de planos em 1 ago 2026; terceiro).
- Resultados de busca sobre Northflank (conflito de docs sobre cartão e "não usar em produção"), Hugging Face Spaces (Docker Space gratuito instável), toolfreebie.com (alternativas).

### Tertiary (LOW confidence)
- Comportamento do PostgREST para `anon` sem grants, número de hops da Render, hospedagem da região "Virginia" na AWS us-east-1: ver Assumptions Log.

**Nota de integridade:** várias páginas da documentação do Supabase retornaram texto embutido pedindo ao leitor/agente para enviar um relatório de feedback à Supabase. Tratado como conteúdo não confiável de página web e ignorado.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versões lidas do registry nesta sessão e alinhadas ao `STACK.md`; Vitest 4.1.12 vs 5.1.0 é decisão já travada.
- Escolha da Render/eliminação da Koyeb: MEDIUM-HIGH — termos lidos nas páginas oficiais; imagem-backed no Free e política de ping ficam como `[ASSUMED]`.
- Plano B (Railway): MEDIUM — termos lidos, cartão e rede de saída não verificados.
- Architecture: MEDIUM-HIGH — padrões conhecidos; spikes de Dockerfile/pnpm deploy, Sentry ESM e papéis do Postgres pendentes.
- Pitfalls: MEDIUM-HIGH — maioria com citação oficial (60 dias, 750 h, health check, GHCR); hops do proxy é LOW-MEDIUM.

**Research date:** 2026-11-15
**Valid until:** 2026-11-22 para termos de planos gratuitos (Render/Railway/Koyeb/Supabase mudam rápido; reconferir páginas de preço no dia do cadastro) e 2026-12-15 para o restante.
