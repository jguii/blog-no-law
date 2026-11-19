# Phase 1: Esqueleto no ar com testes e CI - Context

**Gathered:** 2026-11-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Monorepo (`apps/web` Next.js, `apps/api` NestJS, `packages/shared` Zod) publicado em produção e protegido por portões de qualidade. Qualquer pessoa abre o site na Vercel e vê uma página com dados vindos da API NestJS. O Next chama a API de servidor para servidor, por HTTPS. A fase também entrega:
- pre-push e CI no GitHub Actions, com a `main` protegida;
- Vitest com Postgres real e Playwright com axe;
- `/health` com checagem do banco, Sentry e logs Pino em JSON com redação de segredos;
- Helmet, CORS restrito e validação Zod;
- RLS em todas as tabelas, com a API conectando por um papel sem bypass;
- backup noturno fora do Supabase, restaurado uma vez;
- keep-alive diário;
- o mesmo container rodando em uma segunda plataforma (plano B) pelo menos uma vez.

Requisitos: QA-01, QA-02, QA-03, QA-04, OPS-01, OPS-02, OPS-03, SEC-03, SEC-04.

**Mudança importante desta discussão:** a API **não** vai mais para a Oracle Cloud (o cadastro exige CNPJ). A API roda em PaaS gratuito com Docker: **Render** como primária e **Railway** como plano B de boot único (ver D-11; a Koyeb foi eliminada porque deixou de ter plano grátis). Isso substitui as partes de VM Oracle, Caddy, DuckDNS e arm64 na pesquisa e no `.claude/CLAUDE.md`.

</domain>

<decisions>
## Implementation Decisions

### Hospedagem da API, região e HTTPS
- **D-01:** A Oracle Cloud está descartada. A API roda como container Docker em PaaS gratuito: Render ou Koyeb. Uma plataforma é a primária e a outra é o plano B, implantado com sucesso pelo menos uma vez nesta fase. **O pesquisador decide qual é qual** depois de conferir os termos gratuitos atuais nas páginas oficiais. Critérios:
  - deploy a partir de imagem (de preferência GHCR) ou de Dockerfile;
  - RAM de 512 MB ou mais;
  - política de hibernação, horas por mês e se pings de keep-alive são permitidos pelos termos;
  - regiões disponíveis;
  - deploy hook ou API de deploy;
  - health check;
  - exigência de cartão.
  — **Reversibility:** reversible — o container é portátil e configurado só por env. Trocar de host é apontar `API_URL` para outro lugar.
- **D-02:** O HTTPS usa o domínio nativo da plataforma (`*.onrender.com` na Render; o domínio gerado pela Railway no teste do plano B). Não há DuckDNS, Caddy nem VM. Como o Next é BFF, nenhum cookie vive no domínio da API, então o hostname da plataforma basta. Configurar `trust proxy` do Express para o proxy da plataforma escolhida; o pesquisador confirma o número de hops.
- **D-03:** O pesquisador decide a hibernação: manter a API acordada com ping externo a cada 5 a 10 minutos, ou projetar para o sono (crons movidos para o GitHub Actions chamando endpoints protegidos, fallback ou cache no Next). A recomendação precisa considerar:
  - o impacto em `@nestjs/schedule` e nos futuros jobs pg-boss (Fase 4);
  - o timeout das funções da Vercel durante um cold start;
  - o keep-alive do Supabase (pausa após 7 dias);
  - o limite de horas por mês;
  - se os termos da plataforma permitem o ping.
- **D-04:** Colocação. A regra prioritária é API e banco na **mesma região** (ou a mais próxima possível), porque cada requisição faz várias consultas. As funções da Vercel ficam na região mais próxima da API (`regions` no config da Vercel). O pesquisador escolhe a região concreta depois de definir o host. Nenhuma das plataformas tem região no Brasil; se o host for o Render na Virginia, a recomendação é Supabase em `us-east-1` e Vercel em `iad1`.
- **D-05:** O projeto Supabase **ainda não foi criado** (a conta existe). Ele será criado depois da D-04, na região escolhida, como tarefa manual do autor (checkpoint humano no plano). — **Reversibility:** one-way — a região de um projeto Supabase é imutável. Mudar depois exige um projeto novo e a migração dos dados. Hoje é barato porque o projeto estaria vazio.
- **D-06:** Contas existentes: GitHub e Vercel; a conta Supabase existe, sem projeto. Precisam ser criadas pelo autor (tarefas manuais no plano): Render, Railway, Sentry, UptimeRobot e o projeto Supabase em `us-east-1`.

### Repositório, portões de qualidade e deploy
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

### Decisões travadas depois da pesquisa (2026-11-17)
- **D-11:** Plataforma primária da API: **Render** (Free web service, região Virginia, serviço criado manualmente pelo painel, imagem pública do GHCR; fallback: runtime Docker a partir do Dockerfile do repo com deploy hook). Plano B: **Railway**, em **boot único**. A mesma imagem do GHCR sobe uma vez no trial de US$ 5 (sem cartão), prova a portabilidade e é desligada depois. Fica um runbook de emergência para religar se a Render cair. A Railway **não** é standby gratuito permanente. A Koyeb está eliminada (exige plano Pro de US$ 29 e cartão). Regiões: Supabase `us-east-1`, Vercel `iad1`. — **Reversibility:** reversible — o container é portátil; trocar de host é mudar `API_URL` e o deploy hook.
- **D-12:** Da pasta `.claude/`, **só `.claude/CLAUDE.md` entra no git** do repo público. Vão para o `.gitignore` antes do primeiro push: `.claude/gsd-core/`, `.claude/agents/`, `.claude/commands/`, `.claude/hooks/`, `.claude/scripts/`, `.claude/.gsd-profile`, `.claude/gsd-file-manifest.json`, `.claude/gsd-install-state.json` e `.claude/settings.local.json`. A CI e o pre-push não podem depender desses arquivos. — **Reversibility:** costly — o que for publicado no repo público pode ter sido clonado; por isso o `.gitignore` vem antes do primeiro push.

- **D-13:** Exceção aceita à D-08 (2026-11-17): a branch da fase pode ser mergeada na `main` **no meio da fase**, sempre por PR com `ci-ok` verde e nunca por push direto, quando um workflow só roda a partir da branch padrão (`workflow_run`, `schedule`, `workflow_dispatch`: deploy da API e backup noturno). A branch da fase continua depois de cada merge e o PR final sai no `/gsd-ship`. O bootstrap da `main` no remoto contém só o que ela já tem hoje (docs de planejamento); o ruleset fica ativo antes de qualquer código de aplicação chegar à `main`.
- **D-14:** A prova de que o acesso anônimo via PostgREST não lê nenhuma tabela é um **portão pré-merge na CI** (2026-11-17): um container PostgREST sobe ao lado do Postgres de teste (`supabase/postgres`, mesmos papéis `anon`/`authenticated`, migrations aplicadas), faz requisições anônimas reais e o job entra no `needs` do `ci-ok`. O smoke contra produção com a chave publishable continua no pós-deploy.

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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Escopo e requisitos da fase
- `.planning/ROADMAP.md` §"Phase 1: Esqueleto no ar com testes e CI": objetivo, critérios de sucesso, spikes e notas transversais (guardas por rota, decisões de schema). Atualizado nesta sessão para tirar a Oracle.
- `.planning/REQUIREMENTS.md`: QA-01 a QA-04, OPS-01 a OPS-03, SEC-03, SEC-04.
- `.planning/PROJECT.md`: restrições (custo zero, TDD/SDD/BDD/DDD, "nada sobe sem testes") e Key Decisions (Next como BFF, RLS como segunda camada).

### Stack e arquitetura
- `.claude/CLAUDE.md` §"Technology Stack": versões fixadas e o que não usar. **Atenção:** as seções "Infrastructure (Oracle Always Free VM + Docker)", Caddy, `trust proxy` atrás do Caddy e imagem arm64 estão **superadas** pela D-01 e D-02 deste arquivo.
- `.planning/research/STACK.md`: versões, compatibilidades e padrões de configuração (Prisma 7 + adapter-pg, pooler session mode, papel `app_api`).
- `.planning/research/ARCHITECTURE.md`: topologia BFF, portabilidade e fundações da Fase 0/1.
- `.planning/research/PITFALLS.md`: pausa e falta de backup do Supabase free, Public Suffix List, keep-alive real, restore drill.
- `.planning/research/SUMMARY.md`: síntese e a seção "Phase 0: Foundations".

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Nenhum código ainda. O projeto é greenfield.
- `assets/brand/` (logo e banner do clã) fica para a Fase 2. Não entra nesta fase.

### Established Patterns
- Nenhum padrão de código estabelecido. Esta fase **cria** os padrões que as próximas seguem: layout do monorepo, ESM no Nest, contratos Zod em `packages/shared`, estrutura de testes e workflows de CI.

### Integration Points
- O repo git local não tem remote. O GitHub será criado público (D-07).
- Ferramentas ausentes no WSL do autor: `pnpm`, `docker` (integração do Docker Desktop) e `gh`. Instalá-las é pré-requisito manual, a ser listado no plano.
- Node 26.13.1 já está instalado.

</code_context>

<specifics>
## Specific Ideas

- O autor disse: "Vamos usar Render ou Koyeb gratuito para a API em vez da Oracle, pois a Oracle exige CNPJ."
- O autor delegou ao pesquisador a escolha entre Render e Koyeb, a política de hibernação e a colocação das regiões. A pesquisa recomendou Render + Railway (boot único), e o autor aceitou em 2026-11-17 (D-11).
- O autor aceitou versionar só o `.claude/CLAUDE.md` do diretório `.claude/` (D-12).

</specifics>

<deferred>
## Deferred Ideas

- **Risco para a Fase 5:** o processamento com `sharp` num container de cerca de 512 MB e CPU fracionada pode estourar memória. O spike "`sharp` no shape real" da Fase 5 agora roda sobre o PaaS escolhido, não sobre uma VM.
- **Risco para a Fase 4:** se a API puder hibernar (D-03), os jobs pg-boss e os crons precisam tolerar o sono ou ser disparados de fora.

</deferred>

---

*Phase: 01-esqueleto-no-ar-com-testes-e-ci*
*Context gathered: 2026-11-15*
