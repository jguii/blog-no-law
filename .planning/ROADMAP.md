# Roadmap: Blog No Law

## Overview

O Blog No Law sai do zero e vira um acervo público e moderado da história do clã em 8 fatias verticais. Cada fatia termina implantada em produção (Vercel + PaaS gratuito para a API + Supabase) e protegida por testes. A ordem é esta:

1. Um esqueleto no ar com os portões de qualidade (pre-push, CI, `main` protegida) e as defesas de base.
2. A identidade visual do clã, para que toda tela real já nasça com a cara do No Law.
3. O login com Discord e o gate de membro, que liberam o ciclo central de publicar, moderar e ler.
4. O ciclo de publicação e moderação.
5. Mídia: imagens e vídeos do YouTube.
6. Descoberta: Explorar, filtros, busca, perfis, acervo e previews.
7. Comunidade: comentários, reações, notificações, webhook e limites contra abuso.
8. Eras e conquistas. Ficam isoladas e podem ser adiadas sem bloquear o lançamento.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Esqueleto no ar com testes e CI** - Next + NestJS + Supabase em produção, com pre-push, CI, `main` protegida, RLS, observabilidade e backups
- [ ] **Phase 2: Identidade visual No Law** - Tokens da paleta do clã, logo, kit Tailwind + shadcn/ui, temas claro/escuro, layout responsivo e páginas institucionais
- [ ] **Phase 3: Login com Discord e controle de acesso** - Login Discord com cookies httpOnly, gate de membro via bot, insígnias de cargos e painel de papéis
- [ ] **Phase 4: Publicar e moderar posts** - Editor Tiptap, categorias, ano, rascunho, fila de aprovação, revisões, link permanente e log de auditoria
- [ ] **Phase 5: Imagens e YouTube nos posts** - Upload seguro de imagens (WebP, sem EXIF), vídeos do YouTube, imagens privadas até a aprovação, lightbox e exclusão de post
- [ ] **Phase 6: Explorar, perfis e acervo** - Feed cronológico com filtros na URL, busca em português, acervo de fotos, perfis, diretório, posts fixados e Open Graph
- [ ] **Phase 7: Comunidade e engajamento** - Comentários com respostas, reações, notificações, webhook no Discord e rate limiting por rota
- [ ] **Phase 8: Eras e conquistas** - Linha do tempo das eras do clã e conquistas manuais concedidas por admins

## Phase Details

### Phase 1: Esqueleto no ar com testes e CI
**Goal:** As a desenvolvedor do Blog No Law, I want to ter um esqueleto Next.js + NestJS + Supabase publicado em produção e protegido por testes, CI e backups, so that toda funcionalidade nasça testada e implantada desde o primeiro commit.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: QA-01, QA-02, QA-03, QA-04, OPS-01, OPS-02, OPS-03, SEC-03, SEC-04
**Success Criteria** (what must be TRUE):
  1. Qualquer pessoa abre o site na Vercel e vê uma página com dados vindos da API NestJS no PaaS gratuito primário (Render). O Next chama a API servidor a servidor, por HTTPS, no domínio da plataforma. O mesmo container da API já subiu com sucesso ao menos uma vez no plano B (Railway, boot único).
  2. Um push com lint, typecheck ou teste falhando é bloqueado pelo hook de pre-push. Um PR para `main` só pode ser mergeado com a CI verde: Vitest na API e no web (com Postgres real) e Playwright E2E com verificação axe.
  3. `/health` informa se a API está viva e se o banco responde. Um erro provocado aparece no Sentry. Os logs da API saem em JSON estruturado, sem tokens nem segredos.
  4. A API rejeita entrada inválida com erro de validação, responde com os headers do Helmet e recusa origens fora da lista de CORS. A CI falha se o código web renderizar HTML bruto.
  5. Uma chamada anônima direta à API de dados do Supabase não lê nenhuma tabela: o RLS está ativo em todas e a CI confere isso. A API conecta com um papel de banco sem bypass de RLS. O backup noturno do banco é gravado fora do Supabase, em destino privado, e já foi restaurado com sucesso uma vez, e o keep-alive diário impede a pausa do Supabase.
**Plans**: 4/14 plans executed

Plans:
**Wave 1**
- [x] 01-01-PLAN.md — Workspace pnpm, contrato Zod `/status` (SDD), `.gitignore` da D-12 e CLAUDE.md sem a infra Oracle

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 01-02-PLAN.md — API NestJS 12 (ESM) servindo `/status` e `/health/live`, env validada por Zod

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 01-03-PLAN.md — Home Next 16 (RSC/BFF) mostrando o status da API, degradação e lint contra HTML bruto

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 01-04-PLAN.md — Postgres local e migration baseline (`app_api` sem bypass, RLS) provada por teste

**Wave 5** *(blocked on Wave 4 completion)*
- [ ] 01-05-PLAN.md — API lê `heartbeat` como `app_api`: `/health/ready` e status real do banco
- [ ] 01-06-PLAN.md — Supabase de produção (us-east-1), [BLOCKING] `prisma migrate deploy` e prova anônima do PostgREST

**Wave 6** *(blocked on Wave 5 completion)*
- [ ] 01-07-PLAN.md — Endurecimento da API: Helmet, CORS, trust proxy, logs Pino redigidos, Sentry por `--import`
- [ ] 01-14-PLAN.md — Gates testados como scripts (wave 6): HTML bruto com allowlist vazia (SEC-03) e modo estrito anônimo do smoke PostgREST (D-14)

**Wave 7** *(blocked on Wave 6 completion)*
- [ ] 01-08-PLAN.md — Pre-push com Turborepo e Husky (lint, typecheck, testes com Postgres real; cliente Prisma gerado antes de qualquer tarefa que o usa)

**Wave 8** *(blocked on Wave 7 completion)*
- [ ] 01-09-PLAN.md — Repo público (bootstrap docs-only da `main`), CI com `ci-ok`, gates do 01-14 ligados na CI (HTML bruto e PostgREST anônimo pré-merge, D-14), Dependabot e ruleset

**Wave 9** *(blocked on Wave 8 completion)*
- [ ] 01-10-PLAN.md — E2E Playwright + axe na CI e Sentry no web
- [ ] 01-11-PLAN.md — Imagem no GHCR, API na Render (Virginia) e boot único na Railway

**Wave 10** *(blocked on Wave 9 completion)*
- [ ] 01-12-PLAN.md — Deploy automático no merge (primeiro merge no meio da fase, D-13) e web na Vercel (iad1)

**Wave 11** *(blocked on Wave 10 completion)*
- [ ] 01-13-PLAN.md — Backup noturno cifrado (segundo merge no meio da fase, D-13), restore drill e keep-alive

### Phase 2: Identidade visual No Law
**Goal:** As a visitante do blog, I want to navegar por um site com a cara do clã No Law (logo, paleta, tema claro e escuro) no celular e no desktop, so that o blog seja reconhecido como a casa do clã antes mesmo dos primeiros posts.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: VIS-01, VIS-02, VIS-03, VIS-04, UX-01, UX-02, UX-03
**Success Criteria** (what must be TRUE):
  1. O autor comparou mockups de direções visuais alternativas, feitos com a logo e a paleta do clã, e a direção escolhida ficou registrada antes de qualquer tela real ser implementada.
  2. Visitante vê a logo do clã no header e o favicon na aba. Ao compartilhar o link do site, aparece a imagem padrão de preview com a logo. Ele alterna entre tema claro e escuro, e a escolha persiste entre visitas.
  3. Visitante lê as páginas Sobre o clã, Regras e Política de Privacidade com layout que se adapta a celular e desktop, sem rolagem horizontal.
  4. Uma página de referência do kit mostra os componentes base (Tailwind + shadcn/ui) com os tokens do clã: cores, tipografia e espaçamento. Os dois temas atingem contraste WCAG AA.
  5. Os testes da fase passam na CI: componentes no Vitest e E2E no Playwright com axe nos dois temas e em viewport de celular. O shell com a nova identidade está no ar.
**Plans**: TBD
**UI hint**: yes

### Phase 3: Login com Discord e controle de acesso
**Goal:** As a membro do clã, I want to entrar com minha conta do Discord e ser reconhecido como membro, com meus cargos visíveis, so that só o clã possa publicar e os papéis do blog fiquem sob controle dos admins.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, SEC-01
**Success Criteria** (what must be TRUE):
  1. Usuário clica em "Entrar com Discord", autoriza e volta logado. A sessão continua ao fechar e reabrir o navegador (cookies httpOnly), e ele consegue sair a partir de qualquer página.
  2. No login, o bot confirma se o usuário está no servidor do clã. O membro ganha permissão de publicar e vê no perfil o avatar e insígnias com o nome e a cor dos seus cargos do Discord. Quem não está no servidor entra, mas não pode publicar. Se o Discord falhar, ninguém ganha permissão por engano.
  3. Visitante sem login navega por todas as páginas públicas, e qualquer ação de escrita o convida a entrar com Discord. A API recusa chamadas sem token, com token expirado ou forjado, ou com algoritmo, issuer ou audience errados.
  4. Admin promove e rebaixa usuários entre membro, moderador e admin num painel do blog. Remover o último admin é bloqueado com mensagem clara. As permissões vêm do banco do blog, nunca do token.
  5. Os cenários BDD de login, logout, gate de membro e painel de papéis rodam como E2E na CI (com Discord simulado) e passam, junto com testes negativos de JWT. O login funciona em produção com o Discord real.
**Plans**: TBD
**UI hint**: yes

### Phase 4: Publicar e moderar posts
**Goal:** As a membro do clã, I want to escrever um post, salvar rascunho, enviá-lo para aprovação e vê-lo publicado depois do aval de um moderador, so that a história do clã ganhe registros públicos com controle de qualidade.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: POST-01, POST-04, POST-05, POST-06, POST-07, POST-08, POST-10, MOD-01, MOD-02, MOD-06
**Success Criteria** (what must be TRUE):
  1. Membro escreve um post com título e texto rico no editor (Tiptap), escolhe uma ou mais categorias (cadastradas por admin) e o ano do acontecimento (padrão: ano atual). Ele salva como rascunho e continua editando depois.
  2. Membro envia o post para aprovação e, enquanto o post está pendente, visitantes não o veem. Moderador abre a fila com pré-visualização e aprova ou rejeita com motivo. O autor recebe a notificação no site com o resultado. A decisão fica num log de auditoria imutável que admins consultam, assim como mudanças de papéis e de categorias.
  3. Post aprovado fica acessível a qualquer pessoa num link permanente (ID + slug). O link continua funcionando quando o título muda, redirecionando para o slug novo. Conteúdo malicioso digitado no corpo aparece como texto inerte.
  4. Membro edita um post aprovado, e a versão pública continua no ar enquanto a revisão aguarda na fila. Depois de aprovada, o post mostra a nova versão com a marca "editado".
  5. A máquina de estados (rascunho, pendente, aprovado, rejeitado e revisões) tem testes unitários de todas as transições, inclusive as inválidas. Os cenários E2E do ciclo completo passam na CI, e o ciclo funciona em produção.
**Plans**: TBD
**UI hint**: yes

### Phase 5: Imagens e YouTube nos posts
**Goal:** As a membro do clã, I want to anexar fotos e vídeos do YouTube aos meus posts e excluir o que publiquei, so that o acervo de imagens e vídeos do clã fique guardado junto com as histórias, sem expor nada antes da aprovação.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: POST-02, POST-03, POST-09, MOD-03, FEED-05
**Success Criteria** (what must be TRUE):
  1. Membro anexa várias imagens a um post, e elas aparecem convertidas em WebP, sem metadados EXIF (inclusive localização GPS). Arquivos grandes demais ou de tipo não permitido são recusados com mensagem clara.
  2. Membro cola um ou mais links do YouTube, e o post exibe os vídeos no player youtube-nocookie. Links de outras plataformas ou malformados são recusados.
  3. Imagens de posts em rascunho, pendentes ou rejeitados não abrem para visitantes nem para outros usuários; só ficam públicas quando o post é aprovado. Quando o membro exclui o próprio post, ele some do site e as imagens deixam de ser acessíveis.
  4. Qualquer pessoa clica numa imagem do post e percorre todas numa galeria ampliada (lightbox): pelo teclado no desktop e por toque no celular.
  5. Os testes com arquivos hostis (SVG, arquivo renomeado, bomba de descompressão, JPEG com GPS) e os cenários E2E de upload, vídeo, galeria e exclusão passam na CI. O upload funciona em produção.
**Plans**: TBD
**UI hint**: yes

### Phase 6: Explorar, perfis e acervo
**Goal:** As a visitante do blog, I want to explorar os posts por categoria, membro, ano e texto, e ver perfis e o acervo de fotos, so that eu reencontre a história do grupo com facilidade.
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: FEED-01, FEED-02, FEED-03, FEED-04, FEED-06, FEED-07, MOD-05, UX-04
**Success Criteria** (what must be TRUE):
  1. Qualquer pessoa abre a aba Explorar e percorre o feed cronológico e paginado de posts aprovados, com suas categorias. Posts fixados por um admin aparecem no topo até serem desafixados.
  2. Qualquer pessoa combina filtros de categorias, membro e ano, e o link copiado da barra de endereço reabre exatamente o mesmo resultado. A busca por texto em português ignora acentos: buscar "camera" encontra "câmera".
  3. Qualquer pessoa navega no Acervo de fotos filtrando por ano. Pelo diretório de membros, abre o perfil de qualquer membro com avatar, insígnias e posts aprovados.
  4. Link de post compartilhado no Discord e no WhatsApp mostra preview com título e imagem (conferido em produção). O sitemap lista apenas posts aprovados.
  5. Um post recém-aprovado aparece no feed, no perfil e no sitemap sem deploy manual. Os cenários E2E de navegação, filtros, busca e perfil (com axe) passam na CI.
**Plans**: TBD
**UI hint**: yes

### Phase 7: Comunidade e engajamento
**Goal:** As a usuário logado com Discord, I want to comentar, responder e reagir aos posts e ser avisado do que acontece nos meus, so that a comunidade converse sobre a história do clã com segurança.
**Mode:** mvp
**Depends on**: Phase 6
**Requirements**: SOC-01, SOC-02, SOC-03, SOC-04, SOC-05, MOD-04, SEC-02
**Success Criteria** (what must be TRUE):
  1. Qualquer usuário logado com Discord comenta num post aprovado, responde a um comentário (um nível de profundidade) e reage ao post com um dos emojis do conjunto fixo.
  2. O autor do post vê no sino de notificações do site os comentários, respostas e reações nos seus posts, além das aprovações e rejeições, e consegue marcá-las como lidas.
  3. Moderador remove um comentário, e no lugar aparece "comentário removido". O autor de um comentário consegue apagar o próprio comentário.
  4. Quando um post é aprovado, um anúncio com título, imagem de capa e link aparece uma única vez no canal do Discord do clã. O anúncio não menciona ninguém (@everyone/@here) e é reenviado automaticamente se o Discord falhar.
  5. Quem excede o limite de requisições em login, comentários, upload ou criação de post recebe uma mensagem amigável (HTTP 429), sem afetar o uso normal. Os cenários E2E de comentar, reagir, notificar e moderar passam na CI.
**Plans**: TBD
**UI hint**: yes

### Phase 8: Eras e conquistas
**Goal:** As a administrador do clã, I want to registrar as eras do clã (saídas e voltas) e conceder conquistas aos membros, so that qualquer pessoa veja a linha do tempo e as homenagens da história do grupo.
**Mode:** mvp
**Depends on**: Phase 6
**Requirements**: FEED-08, SOC-06
**Success Criteria** (what must be TRUE):
  1. Admin cadastra, edita e remove eras do clã (nome, início, fim e descrição). Qualquer pessoa vê a linha do tempo das eras, com as saídas e voltas ao servidor.
  2. Admin cria conquistas e as concede a membros com uma nota. As conquistas aparecem no perfil público do membro.
  3. Apenas admins conseguem criar e editar eras e conquistas, os demais são recusados, e essas ações entram no log de auditoria. Os cenários E2E da fase passam na CI e tudo está em produção.
**Plans**: TBD
**UI hint**: yes

## Notas transversais

**Práticas (valem para todas as fases; não são fases):**
- TDD: RED, GREEN, REFACTOR.
- SDD: spec e contratos Zod em `packages/shared` antes do código.
- BDD: os cenários Dado/Quando/Então de cada requisito viram E2E no Playwright.
- DDD pragmático: contextos Identidade, Publicação, Moderação, Engajamento e História do Clã, com padrões táticos completos em Publicação e Moderação.

**Pronto de cada fase:** os testes da fase passam no pre-push e na CI, o merge entra em `main` protegida e a implantação em produção é verificada.

**Guardas por rota (valem desde a fase em que a rota nasce):**
- Validação Zod.
- Rate limit. O SEC-02 é verificado em conjunto na Fase 7.
- RLS na própria migration que cria cada tabela.
- Registro de auditoria de ações de moderação e de admin, a partir da Fase 4.

**Decisões de schema difíceis de mudar depois** (entram na primeira migration de cada tabela):
- Ano do acontecimento separado da data de publicação.
- Modelo de revisões dos posts.
- Snowflakes do Discord como string.
- Log de auditoria só de inserção.

**Spikes indicados pela pesquisa:**
- Fase 1: Render aceita imagem do GHCR no plano Free; número de hops do `trust proxy` da Render; termos gratuitos de Render e Railway (hibernação, horas, RAM, regiões, deploy por imagem); colocação de regiões API/banco/Vercel; conexão da API pelo pooler do Supabase (session mode, porta 5432); destino gratuito e privado para o backup.
- Fase 3: consulta de membro do servidor pelo bot sem intent privilegiada; cookies httpOnly com `@supabase/ssr`; contas Discord sem e-mail.
- Fase 4: renderizador React tipado para Tiptap JSON; enfileirar job do pg-boss dentro da transação (senão, outbox próprio).
- Fase 5: `sharp` no container real do PaaS (~512 MB); upload assinado para bucket de quarentena; política para GIFs animados.
- Fase 6: Cache Components do Next 16 (`cacheTag`, `cacheLife`, `revalidateTag`); preview real no Discord e no WhatsApp.

## Progress

**Execution Order:**
As fases rodam em ordem numérica: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8. A Fase 8 depende só da Fase 6, então pode rodar em paralelo com a 7 ou ser adiada sem bloquear o lançamento.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Esqueleto no ar com testes e CI | 4/14 | In Progress | - |
| 2. Identidade visual No Law | 0/TBD | Not started | - |
| 3. Login com Discord e controle de acesso | 0/TBD | Not started | - |
| 4. Publicar e moderar posts | 0/TBD | Not started | - |
| 5. Imagens e YouTube nos posts | 0/TBD | Not started | - |
| 6. Explorar, perfis e acervo | 0/TBD | Not started | - |
| 7. Comunidade e engajamento | 0/TBD | Not started | - |
| 8. Eras e conquistas | 0/TBD | Not started | - |
