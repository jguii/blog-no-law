# Blog No Law

## What This Is

Blog No Law é o blog do clã No Law, nascido no GTA San Andreas Multiplayer (SA-MP) há mais de 10 anos, cuja amizade foi além do jogo. É um espaço público para ler, onde os membros do clã compartilham qualquer coisa de interesse do grupo (SA-MP, outros jogos, memes, vida) e onde fica guardado o acervo de imagens e vídeos que fazem parte da história do clã. Membros postam, a comunidade comenta e reage.

## Core Value

Membros do clã conseguem publicar e reencontrar a história do grupo — posts com imagens/vídeos, organizados por ano e categoria, navegáveis por qualquer pessoa.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Acesso e identidade**
- [ ] Login exclusivamente via Discord OAuth (Supabase Auth)
- [ ] Membros do servidor Discord do clã podem criar posts; qualquer usuário logado via Discord pode comentar e reagir; visitantes não logados apenas leem
- [ ] Papéis (membro, moderador, admin) gerenciados em painel no próprio blog
- [ ] Cargos (roles) do servidor Discord — nome e cor — sincronizados e exibidos como insígnias no perfil do membro (via bot Discord somente-leitura)

**Posts e moderação**
- [ ] Membro cria post com texto rico, uma ou mais imagens (upload) e um ou mais vídeos (embed do YouTube, somente)
- [ ] Membro escolhe tags/categorias ao criar o post (SA-MP como principal, outros jogos, memes, etc.) e o ano do acontecimento (só o ano)
- [ ] Posts de membros passam por fila de aprovação de moderador/admin antes de ficarem públicos
- [ ] Comentários (com respostas de 1 nível) e reações em posts; moderador remove comentários
- [ ] Edição de post aprovado vira revisão pendente; versão pública fica no ar até a aprovação

**Navegação**
- [ ] Aba "Explorar": feed sequencial (cronológico) de posts de todos os membros, com suas tags
- [ ] Filtros combináveis: uma ou mais categorias + membro específico + ano
- [ ] Aba/página de Perfil: membro vê o próprio perfil e posts; qualquer pessoa (inclusive visitante) vê perfil e posts de qualquer membro
- [ ] Marcos/eras do clã (saídas e voltas ao servidor) registrados por admins e exibidos numa linha do tempo

**Engajamento**
- [ ] Achievements manuais: admins criam conquistas e concedem a membros; exibidos no perfil
- [ ] Notificações no site (comentários e reações nos seus posts, aprovação/rejeição de post)
- [ ] Webhook no Discord do clã anunciando posts aprovados

**Identidade visual**
- [ ] Fase dedicada de identidade visual no início: tokens a partir da paleta do clã (claro/escuro), logo aplicada, kit de componentes (Tailwind + shadcn/ui), direção visual aprovada pelo autor via mockups

**Qualidade de produção (essenciais)**
- [ ] Autenticação correta: JWT do Supabase validado em Guard no NestJS, cookies httpOnly
- [ ] Rate limiting por rota (login, comentários, upload, criação de post)
- [ ] Validação de entrada em toda a API, sanitização de HTML contra XSS, Helmet, CORS restrito
- [ ] Upload seguro de imagens: limites de tamanho/tipo, conversão (ex.: WebP), remoção de EXIF
- [ ] RLS habilitado no Supabase como defesa em profundidade
- [ ] Log de auditoria de ações de moderação/admin
- [ ] Logs estruturados, monitoramento de erros, health check
- [ ] Testes automatizados: Vitest (unit/integração) e Playwright (E2E); pre-push bloqueia push sem testes verdes; CI com branch `main` protegida
- [ ] SEO/Open Graph nos posts públicos (preview bonito ao compartilhar no Discord/WhatsApp)

### Out of Scope

- Upload/hospedagem de vídeos — vídeos entram só como embed de link para manter custo zero
- Achievements automáticos por regra — v1 é só manual (homenagens da história do clã); pode vir depois
- Cadastro por e-mail/senha ou outros provedores — Discord é a identidade natural do clã
- App mobile nativo — web responsiva atende
- Monetização — projeto comunitário

## Context

- Clã com 15–50 pessoas ativas no blog; existe há 10+ anos, com várias saídas e retornos ao servidor SA-MP onde joga — por isso filtro por ano e eras fazem sentido.
- O clã já tem servidor Discord com cargos (roles) estabelecidos.
- O autor é desenvolvedor e quer um projeto "FODA" que consolide conhecimentos de ponta a ponta: frontend, backend, banco, segurança, infra e deploy. Valor educacional é um objetivo explícito — preferir fazer do jeito certo a fazer do jeito mais rápido.
- Discord: o Supabase não guarda nem renova o token do Discord do usuário, então membresia e cargos são consultados por um bot somente-leitura (REST) no login e em ressincronizações; nomes/cores dos cargos vêm do mesmo bot.
- Identidade visual não é o ponto forte do autor; ele já tem a logo do clã e cores para a paleta, e pode usar sites como referência (sem copiar marca/código).
- Pesquisa de domínio em `.planning/research/` (2026-11-14).
- Insumos de marca (paleta preto/vermelho #000000, #420b0d, #ac020f + bege #d3aa82, clima nostálgico e original, estrutura inspirada em comunidades tipo Reddit) em `.planning/BRAND-BRIEF.md`.

## Constraints

- **Tech stack**: TypeScript ponta a ponta; Next.js (frontend), NestJS (backend), Supabase (Postgres, Auth, Storage) — escolha do autor
- **Budget**: custo mensal zero (apenas planos gratuitos) — projeto pessoal/comunitário
- **Deploy**: Next.js na Vercel; NestJS em VPS Oracle Cloud Always Free com Docker (plano B: mesmo container em Render/Koyeb) — NestJS é servidor persistente, não serverless
- **Portabilidade**: API containerizada e configurada por variáveis de ambiente — protege contra limitações do free tier da Oracle (capacidade ARM, recuperação de instância ociosa)
- **Security**: aplicação pública na internet; seguir práticas de produção (auth, rate limit, validação, XSS, auditoria)
- **Práticas de engenharia**: TDD (RED→GREEN→REFACTOR obrigatório), SDD (especificação e contratos Zod antes do código), BDD (cenários Dado/Quando/Então viram E2E), DDD pragmático (contextos Identidade, Publicação, Moderação, Engajamento, História do Clã; padrões táticos completos em Publicação e Moderação)
- **Testes**: nada sobe para o GitHub sem testes passando

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Blog público para leitura, escrita restrita | Acervo do clã pode ser visto por todos; só membros publicam | — Pending |
| Login exclusivo via Discord | Clã já vive no Discord; permite verificar membresia e cargos | — Pending |
| Posts com aprovação de moderador | Controle de qualidade/conteúdo num blog público | — Pending |
| Vídeos só por embed | Custo zero de armazenamento | — Pending |
| Frontend fala só com NestJS (Supabase como banco/storage), RLS como 2ª camada | Regras de negócio centralizadas; defesa em profundidade | — Pending |
| NestJS em VPS Oracle com Docker | Grátis, servidor sempre ligado, máximo aprendizado de infra | — Pending |
| Papéis gerenciados no blog (não pelos cargos do Discord) | Independência da moderação do blog em relação ao servidor | — Pending |
| Achievements manuais na v1 | São homenagens da história do clã, criadas por admins | — Pending |
| Cargos do Discord via bot somente-leitura | Supabase não guarda/renova o token do Discord; bot consulta membresia e cargos a qualquer momento | — Pending |
| Next.js como BFF: navegador fala só com o Next, que chama o NestJS server-to-server com Bearer | Cookies httpOnly ficam num só domínio; sem CORS/cookies cross-site | — Pending |
| API em subdomínio gratuito com HTTPS (Caddy) | Mantém custo zero; cookies nunca chegam ao domínio da API | — Pending |
| Corpo do post em Tiptap JSON (sem HTML armazenado) | Superfície de XSS mínima, renderização por componentes React | — Pending |
| "Ano do acontecimento" (só ano) escolhido pelo autor | Filtro por ano e eras refletem quando aconteceu, não quando foi postado | — Pending |
| Edição de post aprovado via revisão pendente | Não permite burlar a moderação; versão pública nunca some | — Pending |
| Vídeos só do YouTube; vários vídeos/imagens por post | Simplicidade e segurança de embed | — Pending |
| VPS Oracle descartável + plano B (sem PAYG) | Oracle pode recuperar instâncias ociosas; custo zero | — Pending |
| Tailwind + shadcn/ui, com fase dedicada de identidade visual | Visual não é o forte do autor; componentes acessíveis e customizáveis | — Pending |
| TDD/SDD/BDD/DDD pragmático; Vitest + Playwright; pre-push e CI bloqueiam sem testes | Qualidade e aprendizado são objetivos explícitos | — Pending |
| Itens sem versão definida ficam em "Ideias futuras" | Autor decide conforme a necessidade | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-11-14 after requirements definition*
