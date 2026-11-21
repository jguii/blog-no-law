# Walking Skeleton — Blog No Law

**Phase:** 1
**Generated:** 2026-11-17

## Capability Proven End-to-End

Qualquer pessoa abre a home do Blog No Law na Vercel e vê a versão, o commit e o status do banco. O Next busca esses dados no servidor, por HTTPS, na API NestJS da Render. A API lê de verdade a tabela `heartbeat` no Supabase com o papel `app_api`, sem bypass de RLS. Um job diário grava nessa tabela.

O fio é montado em fatias. Os planos 01-01 a 01-05 fecham o caminho completo em ambiente local: Next, API e Postgres real. Os planos 01-06, 01-11 e 01-12 levam o mesmo caminho para produção (Supabase, Render e Vercel). O plano 01-13 adiciona a escrita diária. Os demais planos (01-07 a 01-10 e 01-14) colocam os portões em volta do fio, sem mudar a arquitetura.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Monorepo | pnpm 12.21.0 workspaces + Turborepo 2.11.11; `apps/web`, `apps/api`, `packages/shared` | Contrato único entre Next e Nest; cache de tarefas no pre-push e na CI |
| Contrato de fio (SDD) | Zod 4.6.7 em `packages/shared`, exports por subcaminho (`@blog/shared/status`) | O mesmo schema valida a query na API e faz o `parse` da resposta no Next |
| Frontend | Next.js 16.4.6 App Router (RSC) como BFF; `lib/api.ts` com `AbortSignal.timeout(5000)` e degradação para "API indisponível" | O navegador nunca fala com a API; a Render pode estar acordando (D-03) |
| Backend | NestJS 12.5.0 em ESM (`type: module`, `module: nodenext`, imports `.js`), Express 5; `AppModule.forRoot(env)` + `configureApp(app, env)` usados no boot e nos testes | Os testes HTTP exercitam a mesma configuração (pipe Zod, Helmet, CORS, trust proxy) que produção |
| Configuração | `loadEnv()` com Zod, falha rápida no boot, erro que cita só o nome das chaves | Container portátil configurado só por env; nenhum valor de segredo em mensagem de erro |
| Dados | Supabase Postgres 17 (`us-east-1`, D-05/D-11); Prisma 7.10.1 exato + `@prisma/adapter-pg`; Prisma Migrate é o único sistema de migration | RLS e papéis em SQL puro dentro da migration baseline |
| Segurança do banco | Runtime como `app_api` (LOGIN, NOBYPASSRLS, não owner, só `SELECT` em `heartbeat`); migrations e dump como `postgres`; revoke dos grants de `anon`/`authenticated`/`service_role`; RLS em toda tabela de `public` | Segunda camada de defesa real (SEC-04) |
| Conexão | Supavisor session pooler, porta 5432, IPv4; CA do Supabase em `apps/api/certs/supabase-ca.crt` via `NODE_EXTRA_CA_CERTS` | Render e runners do GitHub saem em IPv4; TLS verificado |
| Health | `/health/live` (sem dependência, health check da Render) e `/health/ready` + `/health` (lê `heartbeat`, 503 se o banco cair) via `@nestjs/terminus` 12.1.0 | Oscilação do banco não causa loop de restart; o ping lê dado real |
| Observabilidade | `nestjs-pino` com `redact` e `req.id` por requisição; Sentry 11.12.0 (projetos api e web), carregado por `node --import ./dist/instrument.js` | Logs JSON sem segredos; Sentry funciona em ESM |
| Auth | Fora da Fase 1. Nenhuma rota exige login; a Fase 3 adiciona o guard JWT (jose + JWKS) | O esqueleto não depende de identidade |
| Deploy da API | Imagem `linux/amd64` em `ghcr.io/{owner}/blog-no-law-api:{sha}` (pública), Render Free Virginia, deploy hook com `imgURL`; plano B Railway em boot único (D-01, D-10, D-11) | Container portátil: trocar de host é trocar `API_URL` e o hook |
| Deploy do web | Integração Git da Vercel, raiz `apps/web`, `regions: ["iad1"]`, previews chamando só o `GET /status` público da produção | Região colada à API e ao banco (D-04); sem segredos no ambiente Preview |
| Fluxo de branch | Uma branch por fase com PR na `main` protegida (D-08); merges no meio da fase só por PR com `ci-ok` verde, quando um workflow exige a branch padrão (`workflow_run`, `schedule`, `workflow_dispatch`), nos planos 01-12 e 01-13 (D-13) | A branch da fase continua depois de cada merge; o PR final sai no `/gsd-ship` |
| Portões | Husky pre-push (`turbo run lint typecheck test test:http test:integration` + gate de HTML bruto) e CI com job agregador `ci-ok` como único check obrigatório do ruleset da `main`; o job `postgrest-anon` sobe um PostgREST real sobre as migrations e prova o acesso anônimo bloqueado antes do merge (D-14); os scripts dos gates nascem testados no 01-14 e o 01-09 os liga na CI | Um check estável; novos jobs não exigem editar o ruleset; o RLS é provado antes de chegar à produção |
| Operação | `backup.yml` noturno: `UPDATE heartbeat` + `pg_dump -Fc` por `age` para releases de repo privado, retenção de 30 dias; UptimeRobot a cada 5 min em `live` e `ready` só se a política de keep-alive da Render, lida e registrada no 01-11, não proibir (D-03); se proibir, só a escrita diária e a API tolera o sono | Keep-alive com escrita e leitura reais; backup fora do Supabase e cifrado |
| Directory layout | `apps/api/src/{config,status,health,prisma,debug}`, `apps/api/test/*.{http,int}-spec.ts`, `apps/api/scripts/*.mjs`, `apps/web/{app,lib,e2e}`, `scripts/` (raiz), `docs/{bdd,runbooks}`, `ops/backup/` | Pastas por capacidade; testes HTTP e de integração separados por sufixo |

## Stack Touched in Phase 1

- [x] Project scaffold (framework, build, lint, test runner): planos 01-01, 01-02, 01-03 e 01-08
- [x] Routing (pelo menos uma rota real): `GET /status`, `GET /health/live`, `GET /health/ready`, `GET /health` e a home `/` (01-02, 01-03, 01-05)
- [x] Database (pelo menos uma leitura e uma escrita reais): a leitura de `heartbeat` como `app_api` no `/health/ready` e no `/status` (01-05); a escrita `UPDATE heartbeat` no `backup.yml` (01-13)
- [x] UI (pelo menos um elemento interativo ligado à API): o link "Ver detalhes" leva a `/?detail=full`, e a página repassa `detail=full` à API, que valida e devolve `dbLatencyMs` (01-03, 01-05)
- [x] Deployment: local full-stack por `scripts/smoke-local.sh` (01-03/01-05); produção na Render (01-11) e na Vercel (01-12); plano B na Railway (01-11)

## Out of Scope (Deferred to Later Slices)

- Identidade visual, Tailwind, shadcn/ui, temas, favicon, OG (Fase 2)
- Login Discord, cookies httpOnly, guard JWT, papéis, `proxy.ts` do Next (Fase 3)
- Qualquer tabela de domínio (posts, categorias, auditoria), pg-boss e crons de aplicação (Fase 4)
- Upload de mídia, `sharp`, Supabase Storage (Fase 5)
- JSON-LD/SEO, que entra como a única exceção auditada na allowlist do gate de HTML bruto (Fase 6)
- Rate limiting por rota (SEC-02, Fase 7)
- Stack completa `supabase start` na CI (Fase 3, quando houver Auth)
- Standby gratuito permanente do plano B: a Railway é boot único + runbook de emergência (D-11)

## Subsequent Slice Plan

Cada fase seguinte adiciona uma fatia vertical sobre este esqueleto sem mudar as decisões acima:

- Fase 2: visitante navega com a identidade visual do clã (layout, temas, páginas institucionais)
- Fase 3: membro entra com Discord e é reconhecido pelo bot; admin gerencia papéis
- Fase 4: membro publica e o moderador aprova; auditoria e jobs duráveis
- Fase 5: imagens (WebP, sem EXIF) e vídeos do YouTube nos posts
- Fase 6: Explorar, filtros, busca, perfis e acervo
- Fase 7: comentários, reações, notificações, webhook e rate limit
- Fase 8: eras e conquistas
