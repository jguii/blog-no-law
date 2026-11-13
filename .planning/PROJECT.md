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
- [ ] Membro cria post com texto, imagens (upload) e vídeos (embed de link YouTube/outros)
- [ ] Membro escolhe tags/categorias ao criar o post (SA-MP como principal, outros jogos, memes, etc.)
- [ ] Posts de membros passam por fila de aprovação de moderador/admin antes de ficarem públicos
- [ ] Comentários e reações em posts

**Navegação**
- [ ] Aba "Explorar": feed sequencial (cronológico) de posts de todos os membros, com suas tags
- [ ] Filtros combináveis: uma ou mais categorias + membro específico + ano
- [ ] Aba/página de Perfil: membro vê o próprio perfil e posts; qualquer pessoa (inclusive visitante) vê perfil e posts de qualquer membro
- [ ] Marcos/eras do clã (saídas e voltas ao servidor) registrados por admins e exibidos numa linha do tempo

**Engajamento**
- [ ] Achievements manuais: admins criam conquistas e concedem a membros; exibidos no perfil
- [ ] Notificações no site (comentários e reações nos seus posts, aprovação/rejeição de post)
- [ ] Webhook no Discord do clã anunciando posts aprovados

**Qualidade de produção (essenciais)**
- [ ] Autenticação correta: JWT do Supabase validado em Guard no NestJS, cookies httpOnly
- [ ] Rate limiting por rota (login, comentários, upload, criação de post)
- [ ] Validação de entrada em toda a API, sanitização de HTML contra XSS, Helmet, CORS restrito
- [ ] Upload seguro de imagens: limites de tamanho/tipo, conversão (ex.: WebP), remoção de EXIF
- [ ] RLS habilitado no Supabase como defesa em profundidade
- [ ] Log de auditoria de ações de moderação/admin
- [ ] Logs estruturados, monitoramento de erros, health check
- [ ] Testes automatizados e CI
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
- Discord: login via OAuth com escopo `guilds.members.read` informa os IDs de cargos do membro no servidor; nomes/cores dos cargos exigem um bot no servidor (consulta via NestJS).

## Constraints

- **Tech stack**: TypeScript ponta a ponta; Next.js (frontend), NestJS (backend), Supabase (Postgres, Auth, Storage) — escolha do autor
- **Budget**: custo mensal zero (apenas planos gratuitos) — projeto pessoal/comunitário
- **Deploy**: Next.js na Vercel; NestJS em VPS Oracle Cloud Always Free com Docker (plano B: mesmo container em Render/Koyeb) — NestJS é servidor persistente, não serverless
- **Portabilidade**: API containerizada e configurada por variáveis de ambiente — protege contra limitações do free tier da Oracle (capacidade ARM, recuperação de instância ociosa)
- **Security**: aplicação pública na internet; seguir práticas de produção (auth, rate limit, validação, XSS, auditoria)

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
| Cargos do Discord via bot somente-leitura | OAuth só retorna IDs de cargos, não nomes/cores | — Pending |

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
*Last updated: 2026-11-12 after initialization*
