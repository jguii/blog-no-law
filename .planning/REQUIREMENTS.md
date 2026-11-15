# Requirements: Blog No Law

**Defined:** 2026-11-14
**Core Value:** Membros do clã conseguem publicar e reencontrar a história do grupo — posts com imagens/vídeos, organizados por ano e categoria, navegáveis por qualquer pessoa.

**Práticas transversais (valem para todos os requisitos):** TDD (RED→GREEN→REFACTOR), SDD (spec e contratos Zod antes do código), BDD (cada requisito ganha cenários Dado/Quando/Então que viram testes E2E), DDD pragmático (contextos: Identidade, Publicação, Moderação, Engajamento, História do Clã).

## v1 Requirements

Requisitos do lançamento. Cada um mapeia para exatamente uma fase do roadmap.

### Acesso e identidade (AUTH)

- [ ] **AUTH-01**: Usuário faz login exclusivamente com Discord (Supabase Auth) e a sessão persiste em cookies httpOnly entre visitas
- [ ] **AUTH-02**: Usuário logado pode sair (logout) de qualquer página
- [ ] **AUTH-03**: No login, o bot verifica se o usuário é membro do servidor Discord do clã; apenas membros podem criar posts
- [ ] **AUTH-04**: Visitante não logado lê todo o conteúdo público, mas não pode postar, comentar ou reagir
- [ ] **AUTH-05**: Admin gerencia papéis (membro, moderador, admin) num painel do blog; não é possível remover o último admin
- [ ] **AUTH-06**: Nome e cor dos cargos do Discord do membro são sincronizados pelo bot e exibidos como insígnias no perfil

### Publicação (POST)

- [ ] **POST-01**: Membro cria post com título e texto rico (editor Tiptap, armazenado como JSON)
- [ ] **POST-02**: Membro anexa uma ou mais imagens ao post; imagens são convertidas para WebP, sem EXIF, com limites de tamanho e tipo
- [ ] **POST-03**: Membro incorpora um ou mais vídeos do YouTube por link (somente YouTube, player youtube-nocookie)
- [ ] **POST-04**: Membro escolhe uma ou mais categorias para o post; categorias são gerenciadas por admin
- [ ] **POST-05**: Membro escolhe o ano do acontecimento do post (somente o ano; padrão: ano atual)
- [ ] **POST-06**: Membro salva rascunho e continua editando depois
- [ ] **POST-07**: Membro envia o post para aprovação; o post só fica público após aprovado
- [ ] **POST-08**: Membro edita post aprovado; a edição vira revisão pendente, a versão pública permanece no ar até a aprovação e então exibe "editado"
- [ ] **POST-09**: Membro exclui o próprio post
- [ ] **POST-10**: Post aprovado tem link permanente (ID + slug) que não quebra se o título mudar

### Moderação (MOD)

- [ ] **MOD-01**: Moderador/admin vê a fila de posts e revisões pendentes com pré-visualização
- [ ] **MOD-02**: Moderador aprova ou rejeita (com motivo) um post ou revisão, e o autor é notificado
- [ ] **MOD-03**: Imagens de posts não aprovados não são acessíveis publicamente
- [ ] **MOD-04**: Moderador remove comentário (exibe "comentário removido"); autor pode apagar o próprio comentário
- [ ] **MOD-05**: Admin fixa e desafixa posts no topo do feed
- [ ] **MOD-06**: Ações de moderação e administração ficam registradas num log de auditoria imutável

### Navegação e descoberta (FEED)

- [ ] **FEED-01**: Qualquer pessoa vê a aba Explorar: feed cronológico e paginado de posts aprovados, com suas categorias
- [ ] **FEED-02**: Qualquer pessoa combina filtros de categorias + membro + ano no feed, e os filtros ficam na URL (compartilhável)
- [ ] **FEED-03**: Qualquer pessoa busca posts por texto em português, ignorando acentos
- [ ] **FEED-04**: Qualquer pessoa navega no Acervo de fotos: grade das imagens de posts aprovados, filtrável por ano
- [ ] **FEED-05**: Qualquer pessoa abre as imagens de um post numa galeria/lightbox ampliada
- [ ] **FEED-06**: Qualquer pessoa vê o perfil de um membro com avatar, insígnias, conquistas e posts aprovados
- [ ] **FEED-07**: Qualquer pessoa vê o diretório de membros do clã
- [ ] **FEED-08**: Qualquer pessoa vê a linha do tempo das eras do clã (saídas e voltas), cadastradas por admin

### Engajamento (SOC)

- [ ] **SOC-01**: Usuário logado via Discord comenta em posts aprovados
- [ ] **SOC-02**: Usuário logado responde a um comentário (um nível de profundidade)
- [ ] **SOC-03**: Usuário logado reage a posts com um conjunto fixo de emojis
- [ ] **SOC-04**: Usuário recebe notificações no site de comentários, respostas e reações nos seus posts, e de aprovação/rejeição
- [ ] **SOC-05**: Post aprovado é anunciado automaticamente num canal do Discord do clã via webhook
- [ ] **SOC-06**: Admin cria conquistas e concede a membros; conquistas aparecem no perfil

### Interface (UX)

- [ ] **UX-01**: Site funciona bem em celular e desktop (layout responsivo)
- [ ] **UX-02**: Usuário alterna entre tema claro e escuro
- [ ] **UX-03**: Qualquer pessoa acessa as páginas Sobre o clã, Regras e Política de Privacidade
- [ ] **UX-04**: Link de post compartilhado no Discord/WhatsApp mostra preview (Open Graph) com título e imagem; sitemap contém só posts aprovados

### Identidade visual (VIS)

- [ ] **VIS-01**: Tokens de design (cores, tipografia, espaçamento) derivados da paleta do clã, com temas claro e escuro e contraste WCAG AA
- [ ] **VIS-02**: Logo do clã aplicada no header, favicon e imagem padrão de preview (Open Graph)
- [ ] **VIS-03**: Kit de componentes base (Tailwind + shadcn/ui) customizado com a identidade do clã
- [ ] **VIS-04**: Direção visual escolhida pelo autor a partir de mockups comparativos antes da implementação das telas

### Segurança (SEC)

- [ ] **SEC-01**: API valida o JWT do Supabase via JWKS (ES256, issuer e audience) e lê papéis do próprio banco, nunca do token
- [ ] **SEC-02**: Rate limiting por rota (login, comentários, upload, criação de post)
- [ ] **SEC-03**: Validação de entrada em toda a API, Helmet, CORS restrito e conteúdo renderizado sem HTML bruto (proteção contra XSS)
- [ ] **SEC-04**: RLS habilitado em todas as tabelas do Supabase, com a API usando um papel de banco sem bypass de RLS

### Qualidade (QA)

- [ ] **QA-01**: Testes unitários e de integração com Vitest na API e no web, incluindo integração com Postgres real
- [ ] **QA-02**: Testes E2E com Playwright cobrindo os fluxos principais, com verificação de acessibilidade (axe)
- [ ] **QA-03**: Hook de pre-push roda lint, typecheck e testes e bloqueia o push se algo falhar
- [ ] **QA-04**: CI no GitHub Actions roda toda a suíte; branch `main` protegida exige checks verdes para merge

### Operação (OPS)

- [ ] **OPS-01**: Logs estruturados, monitoramento de erros (Sentry) e health check da API
- [ ] **OPS-02**: Deploy do Next na Vercel e da API em Docker na Oracle com HTTPS em subdomínio gratuito; plano B de hospedagem testado ao menos uma vez
- [ ] **OPS-03**: Backup noturno do banco fora da VM e keep-alive que impede a pausa do Supabase

## Ideias futuras (sem versão definida)

Registradas para não se perderem. O autor decide se e quando entram, conforme a necessidade.

- Ban/mute de usuários
- Denúncia de conteúdo (posts e comentários) com fila para moderadores
- Regra: moderador não aprova o próprio post
- Postar em nome de outro membro/ex-membro (alimentar o acervo antigo)
- "Neste dia" (posts do mesmo período em anos anteriores)
- Feed RSS/Atom
- Excluir/anonimizar a própria conta (LGPD)
- Aprovação automática para membros confiáveis
- Conquistas automáticas por regra

## Out of Scope

| Feature | Reason |
|---------|--------|
| Upload/hospedagem de vídeos | Custo zero; vídeos entram só como embed do YouTube |
| Vídeos de outras plataformas | Decisão do autor: somente YouTube |
| Login por e-mail/senha ou outros provedores | Discord é a identidade natural do clã |
| App mobile nativo | Web responsiva atende |
| Monetização | Projeto comunitário |
| Realtime/WebSockets para notificações | Polling atende 15–50 usuários sem custo nem complexidade extra |
| HTML bruto ou editor sem restrição | Superfície de XSS; corpo em Tiptap JSON |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 3 | Pending |
| AUTH-02 | Phase 3 | Pending |
| AUTH-03 | Phase 3 | Pending |
| AUTH-04 | Phase 3 | Pending |
| AUTH-05 | Phase 3 | Pending |
| AUTH-06 | Phase 3 | Pending |
| POST-01 | Phase 4 | Pending |
| POST-02 | Phase 5 | Pending |
| POST-03 | Phase 5 | Pending |
| POST-04 | Phase 4 | Pending |
| POST-05 | Phase 4 | Pending |
| POST-06 | Phase 4 | Pending |
| POST-07 | Phase 4 | Pending |
| POST-08 | Phase 4 | Pending |
| POST-09 | Phase 5 | Pending |
| POST-10 | Phase 4 | Pending |
| MOD-01 | Phase 4 | Pending |
| MOD-02 | Phase 4 | Pending |
| MOD-03 | Phase 5 | Pending |
| MOD-04 | Phase 7 | Pending |
| MOD-05 | Phase 6 | Pending |
| MOD-06 | Phase 4 | Pending |
| FEED-01 | Phase 6 | Pending |
| FEED-02 | Phase 6 | Pending |
| FEED-03 | Phase 6 | Pending |
| FEED-04 | Phase 6 | Pending |
| FEED-05 | Phase 5 | Pending |
| FEED-06 | Phase 6 | Pending |
| FEED-07 | Phase 6 | Pending |
| FEED-08 | Phase 8 | Pending |
| SOC-01 | Phase 7 | Pending |
| SOC-02 | Phase 7 | Pending |
| SOC-03 | Phase 7 | Pending |
| SOC-04 | Phase 7 | Pending |
| SOC-05 | Phase 7 | Pending |
| SOC-06 | Phase 8 | Pending |
| UX-01 | Phase 2 | Pending |
| UX-02 | Phase 2 | Pending |
| UX-03 | Phase 2 | Pending |
| UX-04 | Phase 6 | Pending |
| VIS-01 | Phase 2 | Pending |
| VIS-02 | Phase 2 | Pending |
| VIS-03 | Phase 2 | Pending |
| VIS-04 | Phase 2 | Pending |
| SEC-01 | Phase 3 | Pending |
| SEC-02 | Phase 7 | Pending |
| SEC-03 | Phase 1 | Pending |
| SEC-04 | Phase 1 | Pending |
| QA-01 | Phase 1 | Pending |
| QA-02 | Phase 1 | Pending |
| QA-03 | Phase 1 | Pending |
| QA-04 | Phase 1 | Pending |
| OPS-01 | Phase 1 | Pending |
| OPS-02 | Phase 1 | Pending |
| OPS-03 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 55 total
- Mapped to phases: 55
- Unmapped: 0 ✓

---
*Requirements defined: 2026-11-14*
*Last updated: 2026-11-14 after roadmap creation*
