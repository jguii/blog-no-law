# Phase 2: Identidade visual No Law - Context

**Gathered:** 2026-11-27
**Status:** Ready for planning

<domain>
## Phase Boundary

O "casco" do site com a cara do clã No Law, publicado em produção:
- **Escolha da direção visual:** o autor compara mockups de direções alternativas, feitos com a logo e a paleta do clã. A direção escolhida fica registrada **antes** de qualquer tela real.
- **Logo:** no header, favicon na aba e imagem padrão de preview (Open Graph) ao compartilhar o link.
- **Temas:** claro e escuro, com a escolha persistindo entre visitas. Os dois atingem contraste WCAG AA.
- **Páginas:** Sobre o clã, Regras e Política de Privacidade, responsivas e sem rolagem horizontal no celular.
- **Kit:** uma página de referência com os componentes base (Tailwind + shadcn/ui) e os tokens do clã (cores, tipografia, espaçamento).
- **Home:** a capa do clã substitui a página de status técnico, que passa para `/status`.
- **Testes:** componentes no Vitest e E2E no Playwright com axe nos dois temas e em viewport de celular, verdes na CI.

Requisitos: VIS-01, VIS-02, VIS-03, VIS-04, UX-01, UX-02, UX-03.

Fora desta fase: login, posts, feed, perfis (Fases 3 a 6). Nenhuma rota nova na API é necessária.

</domain>

<decisions>
## Implementation Decisions

### Logo e ativos de marca
- **D-01:** Claude produz os ativos a partir de `assets/brand/Logo No Law.jpg` e o autor aprova nos mockups:
  - **Emblema recortado:** remoção do fundo de pergaminho, limpeza das bordas e PNG transparente.
  - **Versão simplificada em SVG:** só o círculo com os dois dragões em yin-yang, sem texto.

  Não há arquivo-fonte em camadas nem vetor. Se a borda sair imperfeita por causa da textura do papel, a versão simplificada desenhada em SVG é o caminho.
- **D-02:** O header mostra o **ícone dos dragões** (círculo) com o nome **"No Law" em texto HTML**, na fonte de título do site, e não o emblema completo. Motivo: nitidez em qualquer tamanho e leitura por leitor de tela.
- **D-03:** O favicon (16/32/180/512 e o ícone do app) usa só o círculo dos dragões, sem texto.
- **D-04:** A imagem de Open Graph (1200x630) é **derivada do banner** `assets/brand/Banner No Law.jpg`: pergaminho, emblema e o slogan "Uma nova face, uma nova história.".
- **D-05:** O ano de fundação é **2017**, como na logo ("SINCE 2017"). O site diz "desde 2017". A amizade de mais de 10 anos entra no texto como história e não contradiz a data. Corrigir o "10+ anos" do PROJECT.md para não conflitar.

### Home e navegação
- **D-06:** Enquanto não há posts, a home é a **capa do clã**: banner/emblema, slogan, um parágrafo curto sobre o clã e chamadas para Sobre e Regras. Na Fase 4 o feed entra abaixo dessa capa.
- **D-07:** A página de status técnico (commit, banco, latência, "Ver detalhes") muda para **`/status`**, sem link no menu, com o visual novo. Os testes atuais da home (`apps/web/e2e/home.spec.ts`, `apps/web/test/home.int-spec.ts`, cenários em `docs/bdd/home.feature.md`) mudam junto para `/status`.
- **D-08:** O menu do topo mostra **só o que existe**: Início, Sobre o clã, Regras e o botão de tema. Explorar, Perfil e Entrar aparecem nas fases em que forem construídos, sem "em breve".
- **D-09:** O rodapé tem links para Sobre, Regras e Privacidade e "desde 2017". **Não** tem link para o Discord nesta fase.
- **D-10:** No celular a navegação é um **menu sanduíche (☰) no topo**. A barra de abas inferior pode ser reavaliada quando Explorar e Perfil existirem.

### Textos das páginas
- **D-11:** O tom é **próximo, de amigos** ("a gente", memória afetiva, um toque de humor) no Sobre e nas Regras. A Privacidade é clara e direta.
- **D-12:** **Sobre o clã:** o autor quer escrever o texto definitivo com calma ("precisa ser algo bem feito"). Nesta fase a página vai ao ar com o layout final e um **texto curto provisório** de duas ou três frases neutras (SA-MP, desde 2017, "a história completa chega em breve"). O texto definitivo vai para o backlog. A página não fica bloqueada esperando por ele.
- **D-13:** **Regras:** vêm das **regras que o clã já tem no Discord**. O autor fornece o texto e Claude adapta ao blog e ao tom (D-11).
  - É uma **entrada do autor**: o plano deve ter um checkpoint para receber o texto.
  - Até o texto chegar, a página pode usar uma versão mínima provisória, para não bloquear o resto da fase.
- **D-14:** **Política de Privacidade:** página **curta, em linguagem simples, sem citar a LGPD** e sem juridiquês. O autor pediu duas vezes para não expor esse tema.
  - Diz só quais dados o site usa e para quê. Nesta fase: o cookie/armazenamento da preferência de tema, os logs técnicos da hospedagem e o monitoramento de erros sem dados pessoais.
  - A página cresce quando o login chegar (Fase 3).
  - **Risco aceito pelo autor:** sem um canal formal para pedidos de dados. Claude pode, a seu critério, incluir uma frase do tipo "dúvidas sobre seus dados? fale com um admin do clã", desde que não cite lei nem exponha contato pessoal.

### Tema, mockups e tipografia
- **D-15:** O **tema padrão** na primeira visita é o **escuro "tinta"**: preto dominante, superfícies `#420b0d`, bege `#d3aa82` nos destaques. O claro "pergaminho" tem fundo bege, tinta preta e vermelho como destaque.
  - A escolha da pessoa persiste entre visitas.
  - Não pode haver flash do tema errado ao carregar, porque o site é SSR.
- **D-16:** Os mockups são **páginas publicadas** (privadas, com link) que o autor abre no celular e no PC. Cada uma mostra header, capa da home, uma página de texto (Sobre) e a troca claro/escuro. O autor pode pedir mistura ("o header da 1 com as cores da 2"). A direção escolhida é registrada antes da implementação (critério 1 da fase).
- **D-17:** São **3 direções**, conforme o `.planning/BRAND-BRIEF.md`: Pergaminho/sumi-e (fiel ao banner), Tinta/sombrio (preto e gradiente vermelho como assinatura) e Arquivo/memória (ar de acervo, estética oriental com moderação).
- **D-18:** A **fonte dos títulos varia entre as direções**, todas gratuitas (Google Fonts): uma latina estilo japonês como a do banner, uma de pincel e uma serifada clássica. O corpo de texto é sempre uma sans bem legível. Nada de imitar a identidade do GTA/Rockstar (ex.: Pricedown).

### Ornamentos, movimento e controles
- **D-19:** **Ornamentos:** fortes na capa e no rodapé (nuvens vermelho/preto com contorno dourado, textura de papel, pétalas). Nas páginas de leitura, só um toque: textura muito leve no fundo e um detalhe de nuvem no header. A leitura e o contraste AA nunca são sacrificados.
- **D-20:** **Animações:** transições sutis (hover, troca de tema) e **pétalas caindo devagar só na capa**. Tudo desliga com `prefers-reduced-motion`.
- **D-21:** O **botão de tema** é um **yin-yang inspirado nos dragões** (preto/vermelho), com rótulo acessível ("Mudar para tema claro/escuro").
- **D-22:** A página do kit fica em **`/kit`**, fora do menu e fora dos buscadores (`noindex`). Serve de referência visual e de base para os testes de componentes e de contraste.

### Claude's Discretion
- O texto provisório do Sobre e a adaptação das Regras do Discord, dentro do tom D-11. O autor revisa.
- A frase opcional de contato na Privacidade (D-14).
- Como a persistência do tema funciona (cookie ou armazenamento local, script anti-flash). Restrição: sem flash no SSR.
- O mecanismo dos tokens (variáveis CSS do Tailwind 4 e tema do shadcn), a escala tipográfica e de espaçamento, e quais componentes shadcn entram no kit base. O mínimo é botão, link, card, menu sanduíche e toggle.
- Técnica de recorte do emblema e geração do favicon e da imagem de Open Graph.
- Como as pétalas são feitas (CSS puro de preferência, leve) e quantas aparecem.
- A CSP do site (Next), apontada pela UI review da Fase 1 e ainda ausente, pode entrar aqui se não complicar as fontes e as imagens. O pesquisador avalia.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Marca e direção visual
- `.planning/BRAND-BRIEF.md`: paleta com hex e contraste calculado, clima nostálgico/original, leitura dos ativos (estética sumi-e sobre pergaminho), proposta de temas e eixos das 3 direções de mockup.
- `assets/brand/Logo No Law.jpg`: emblema 1024x1024 (JPG, sem transparência). Fonte do recorte, do favicon e do ícone do header.
- `assets/brand/Banner No Law.jpg`: banner 1500x500 com o slogan. Fonte da imagem de Open Graph e referência da fonte de título estilo japonês.

### Escopo e requisitos
- `.planning/ROADMAP.md` § "Phase 2: Identidade visual No Law": goal e os 5 critérios de sucesso.
- `.planning/REQUIREMENTS.md`: VIS-01..04 e UX-01..03.
- `.planning/PROJECT.md`: restrições (custo zero, Tailwind + shadcn/ui, TDD/BDD) e o contexto do clã.

### Estado atual do web (entrada da fase)
- `.planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-UI-REVIEW.md`: o que falta na página atual e os "Itens para a Fase 2". Inclui ausência de CSS, de `metadata.description`, de `color-scheme`, de retry no "API indisponível" e de CSP no web.
- `.claude/CLAUDE.md` § Frontend: versões fixadas (Next 16.4.6, Tailwind 4.3.5, shadcn CLI 4.23.0, Playwright 1.65.1 + axe 4.14.0) e "What NOT to Use".

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/app/page.tsx`: a página de status atual (`getStatus` de `apps/web/lib/api.ts`, `force-dynamic`, fallback "API indisponível no momento"). Muda para `/status` (D-07).
- `apps/web/lib/api.ts`: cliente server-to-server da API, com testes em `lib/api.test.ts`. A capa (D-06) não precisa chamar a API.
- `apps/web/e2e/home.spec.ts`: helper `expectNoAxeViolations` com as tags WCAG 2.1 A/AA. Reaproveitar nos dois temas e no viewport de celular.
- `apps/web/app/global-error.tsx`: tela de erro global, que precisa ganhar o visual novo.

### Established Patterns
- **Next:** 16 App Router, React 19, ESM e `lang="pt-BR"` em `app/layout.tsx`. Hoje não há Tailwind, `globals.css`, pasta `public/` nem nenhum CSS.
- **Headers de segurança:** em `apps/web/next.config.ts` (nosniff, Referrer-Policy, X-Frame-Options DENY, Permissions-Policy). Ainda não há CSP.
- **Gate de HTML bruto** (`scripts/check-no-raw-html.mjs`) e `react/no-danger` como erro. Ornamentos e SVG entram como componentes/arquivos, nunca via `dangerouslySetInnerHTML`.
- **Testes:** Vitest com os projetos `unit`/`int` e Playwright só na CI (D-09 da Fase 1), contra `next start`. Os cenários BDD ficam em `docs/bdd/*.feature.md`.
- **Pacotes:** só a lista aprovada do `.claude/CLAUDE.md`. Tailwind 4.3.5, `@tailwindcss/postcss` e o shadcn CLI 4.23.0 estão lá. Fontes via `next/font/google`, sem pacote extra.

### Integration Points
- `apps/web/app/layout.tsx`: header, rodapé, provedor de tema, fontes e `metadata` (title, description, Open Graph, ícones).
- **Rotas novas:** `/sobre`, `/regras`, `/privacidade` (nomes finais a critério do planner, em pt-BR), `/status` e `/kit`.
- `apps/web/public/`: favicon, ícones, imagem de Open Graph e o emblema recortado.

</code_context>

<specifics>
## Specific Ideas

- **Slogan oficial:** "Uma nova face, uma nova história." (do banner). Usar na capa e na imagem de preview.
- **Botão de tema:** um yin-yang dos dragões, preto e vermelho, como na logo.
- **Ornamentos:** as nuvens vermelho/preto com contorno dourado do emblema e do banner, e as pétalas vermelhas da logo.
- **Clima:** um clã antigo que segue vivo apesar das idas e vindas, nostálgico e com identidade própria. A inspiração estrutural (para fases futuras) são comunidades tipo Reddit.

</specifics>

<deferred>
## Deferred Ideas

- **Texto definitivo do Sobre o clã:** o autor quer algo bem feito. Backlog; a página vai ao ar com texto provisório (D-12).
- **Link de convite do Discord no rodapé:** junto com o login, na Fase 3.
- **Barra de abas inferior no celular:** reavaliar quando Explorar e Perfil existirem (Fase 6).

</deferred>

---

*Phase: 02-identidade-visual-no-law*
*Context gathered: 2026-11-27*
