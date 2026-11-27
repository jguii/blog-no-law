# Phase 2: Identidade visual No Law - Research

**Researched:** 2026-11-27
**Domain:** Frontend Next.js 16 (App Router) com Tailwind CSS 4 + shadcn/ui: tokens de design com tema claro/escuro sem flash, páginas institucionais, ativos de marca (favicon, Open Graph), CSP e testes (Vitest, Playwright + axe)
**Confidence:** MEDIUM-HIGH (mecanismos de tema, fontes, Tailwind e shadcn executados em um app de rascunho nesta sessão; a estética das direções e os efeitos reais de CSP no Vercel só se confirmam nos mockups e no primeiro deploy, listados em Open Questions)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Logo e ativos de marca**
- **D-01:** Claude produz os ativos a partir de `assets/brand/Logo No Law.jpg` e o autor aprova nos mockups:
  - **Emblema recortado:** remoção do fundo de pergaminho, limpeza das bordas e PNG transparente.
  - **Versão simplificada em SVG:** só o círculo com os dois dragões em yin-yang, sem texto.

  Não há arquivo-fonte em camadas nem vetor. Se a borda sair imperfeita por causa da textura do papel, a versão simplificada desenhada em SVG é o caminho.
- **D-02:** O header mostra o **ícone dos dragões** (círculo) com o nome **"No Law" em texto HTML**, na fonte de título do site, e não o emblema completo. Motivo: nitidez em qualquer tamanho e leitura por leitor de tela.
- **D-03:** O favicon (16/32/180/512 e o ícone do app) usa só o círculo dos dragões, sem texto.
- **D-04:** A imagem de Open Graph (1200x630) é **derivada do banner** `assets/brand/Banner No Law.jpg`: pergaminho, emblema e o slogan "Uma nova face, uma nova história.".
- **D-05:** O ano de fundação é **2017**, como na logo ("SINCE 2017"). O site diz "desde 2017". A amizade de mais de 10 anos entra no texto como história e não contradiz a data. Corrigir o "10+ anos" do PROJECT.md para não conflitar.

**Home e navegação**
- **D-06:** Enquanto não há posts, a home é a **capa do clã**: banner/emblema, slogan, um parágrafo curto sobre o clã e chamadas para Sobre e Regras. Na Fase 4 o feed entra abaixo dessa capa.
- **D-07:** A página de status técnico (commit, banco, latência, "Ver detalhes") muda para **`/status`**, sem link no menu, com o visual novo. Os testes atuais da home (`apps/web/e2e/home.spec.ts`, `apps/web/test/home.int-spec.ts`, cenários em `docs/bdd/home.feature.md`) mudam junto para `/status`.
- **D-08:** O menu do topo mostra **só o que existe**: Início, Sobre o clã, Regras e o botão de tema. Explorar, Perfil e Entrar aparecem nas fases em que forem construídos, sem "em breve".
- **D-09:** O rodapé tem links para Sobre, Regras e Privacidade e "desde 2017". **Não** tem link para o Discord nesta fase.
- **D-10:** No celular a navegação é um **menu sanduíche (☰) no topo**. A barra de abas inferior pode ser reavaliada quando Explorar e Perfil existirem.

**Textos das páginas**
- **D-11:** O tom é **próximo, de amigos** ("a gente", memória afetiva, um toque de humor) no Sobre e nas Regras. A Privacidade é clara e direta.
- **D-12:** **Sobre o clã:** o autor quer escrever o texto definitivo com calma ("precisa ser algo bem feito"). Nesta fase a página vai ao ar com o layout final e um **texto curto provisório** de duas ou três frases neutras (SA-MP, desde 2017, "a história completa chega em breve"). O texto definitivo vai para o backlog. A página não fica bloqueada esperando por ele.
- **D-13:** **Regras:** vêm das **regras que o clã já tem no Discord**. O autor fornece o texto e Claude adapta ao blog e ao tom (D-11).
  - É uma **entrada do autor**: o plano deve ter um checkpoint para receber o texto.
  - Até o texto chegar, a página pode usar uma versão mínima provisória, para não bloquear o resto da fase.
- **D-14:** **Política de Privacidade:** página **curta, em linguagem simples, sem citar a LGPD** e sem juridiquês. O autor pediu duas vezes para não expor esse tema.
  - Diz só quais dados o site usa e para quê. Nesta fase: o cookie/armazenamento da preferência de tema, os logs técnicos da hospedagem e o monitoramento de erros sem dados pessoais.
  - A página cresce quando o login chegar (Fase 3).
  - **Risco aceito pelo autor:** sem um canal formal para pedidos de dados. Claude pode, a seu critério, incluir uma frase do tipo "dúvidas sobre seus dados? fale com um admin do clã", desde que não cite lei nem exponha contato pessoal.

**Tema, mockups e tipografia**
- **D-15:** O **tema padrão** na primeira visita é o **escuro "tinta"**: preto dominante, superfícies `#420b0d`, bege `#d3aa82` nos destaques. O claro "pergaminho" tem fundo bege, tinta preta e vermelho como destaque.
  - A escolha da pessoa persiste entre visitas.
  - Não pode haver flash do tema errado ao carregar, porque o site é SSR.
- **D-16:** Os mockups são **páginas publicadas** (privadas, com link) que o autor abre no celular e no PC. Cada uma mostra header, capa da home, uma página de texto (Sobre) e a troca claro/escuro. O autor pode pedir mistura ("o header da 1 com as cores da 2"). A direção escolhida é registrada antes da implementação (critério 1 da fase).
- **D-17:** São **3 direções**, conforme o `.planning/BRAND-BRIEF.md`: Pergaminho/sumi-e (fiel ao banner), Tinta/sombrio (preto e gradiente vermelho como assinatura) e Arquivo/memória (ar de acervo, estética oriental com moderação).
- **D-18:** A **fonte dos títulos varia entre as direções**, todas gratuitas (Google Fonts): uma latina estilo japonês como a do banner, uma de pincel e uma serifada clássica. O corpo de texto é sempre uma sans bem legível. Nada de imitar a identidade do GTA/Rockstar (ex.: Pricedown).

**Ornamentos, movimento e controles**
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

### Deferred Ideas (OUT OF SCOPE)
- **Texto definitivo do Sobre o clã:** o autor quer algo bem feito. Backlog; a página vai ao ar com texto provisório (D-12).
- **Link de convite do Discord no rodapé:** junto com o login, na Fase 3.
- **Barra de abas inferior no celular:** reavaliar quando Explorar e Perfil existirem (Fase 6).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VIS-01 | Tokens de design (cores, tipografia, espaçamento) derivados da paleta do clã, com temas claro e escuro e contraste WCAG AA | Arquitetura de tokens em 3 camadas (primitivos, semânticos, mapa `@theme inline`); paleta derivada com razões de contraste calculadas nesta sessão; teste Vitest que lê `globals.css` e falha se um par cair abaixo de AA; axe nos dois temas |
| VIS-02 | Logo do clã aplicada no header, favicon e imagem padrão de preview (Open Graph) | Pipeline com `sharp` (recorte circular validado, OG 1200x630 validado), convenções de arquivo do Next (`app/icon.*`, `app/apple-icon.*`, `app/opengraph-image.*`), `metadataBase`; SVG simplificado dos dragões desenhado à mão (o texto cobre os dragões no JPG) |
| VIS-03 | Kit de componentes base (Tailwind + shadcn/ui) customizado com a identidade do clã | `shadcn@4.23.0 init -b radix -p nova` executado em app de rascunho: arquivos e dependências reais que ele gera; ajustes obrigatórios (variante `dark` por `data-theme`, fontes, tokens); página `/kit` com `noindex` |
| VIS-04 | Direção visual escolhida pelo autor a partir de mockups comparativos antes da implementação das telas | Mecanismo de tokens deixa a direção reduzida a ~30 variáveis CSS + 1 fonte de título + ornamentos; carregamento de cada fonte candidata por `next/font/google` verificado (cobertura de acentos do pt-BR); gate de planejamento: registro da escolha antes de qualquer tela real |
| UX-01 | Site funciona bem em celular e desktop (layout responsivo) | Menu sanduíche por padrão de disclosure; teste Playwright de rolagem horizontal em 320, 375 e 412 px; projeto `mobile` (Pixel 7, engine Chromium) |
| UX-02 | Usuário alterna entre tema claro e escuro | Script anti-flash inline (texto filho de `<script>`, sem a prop de HTML bruto), `localStorage`, `useSyncExternalStore` no botão; teste E2E de persistência e de ausência de flash sem hidratação |
| UX-03 | Qualquer pessoa acessa as páginas Sobre o clã, Regras e Política de Privacidade | Rotas estáticas `/sobre`, `/regras`, `/privacidade` (sem `cookies()` no layout raiz, para manter a renderização estática); axe nos dois temas e em celular |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

Extraídas de `.claude/CLAUDE.md` (lido nesta sessão). Tratadas com a mesma autoridade das decisões travadas.

- **Stack fixa:** TypeScript ponta a ponta; Next.js 16.4.6, React 19.3.1, Tailwind CSS 4.3.5 + `@tailwindcss/postcss` 4.3.5, shadcn/ui CLI 4.23.0, Zod 4.6.7, Playwright 1.65.1 + `@axe-core/playwright` 4.14.0, Vitest 4.1.12, ESLint 9.39.x, Prettier 3.10.1. "Only packages on the approved list": qualquer pacote novo precisa de aprovação do autor.
- **Orçamento zero:** apenas planos gratuitos. Fontes por `next/font/google` (self-hosted no build, sem requisição do navegador ao Google).
- **Segurança:** aplicação pública; `react/no-danger` é erro (`apps/web/eslint.config.mjs`) e `scripts/check-no-raw-html.mjs` reprova a prop de HTML bruto do React em `apps/web`. O gate procura a string literal por linha, então nem um comentário em `apps/web` pode conter essa string.
- **Next 16:** `proxy.ts` no lugar de `middleware.ts`; `params`, `cookies()` e `headers()` são assíncronos; `next lint` removido; `priority` do `next/image` está obsoleto (usar `preload` ou `loading="eager"`/`fetchPriority="high"`).
- **Práticas:** TDD (RED, GREEN, REFACTOR obrigatório), SDD (contrato antes do código), BDD (cenários Dado/Quando/Então em `docs/bdd/*.feature.md` viram E2E). "Nada sobe para o GitHub sem testes passando" (pre-push roda `pnpm run verify`).
- **Playwright só na CI** (D-09 da Fase 1): o Chromium do WSL local sai com código 127 (bibliotecas do sistema ausentes).
- **Portabilidade e API:** nenhuma rota nova na API nesta fase; o web continua BFF (o navegador nunca chama a API).
- **Idioma:** pt-BR em tudo que é texto de produto e em artefatos de fase.

## Summary

A fase não exige nenhuma tecnologia nova além do que o `CLAUDE.md` já aprova: Tailwind 4.3.5 por `@tailwindcss/postcss`, shadcn CLI 4.23.0, `next/font/google`, as convenções de metadados do Next 16 e `sharp` (já aprovado, mas ainda sem uso direto no repositório) para gerar os ativos. Em um app de rascunho com as versões do projeto, validei de ponta a ponta: Tailwind 4 sem `postcss` explícito, `next/font/google` self-hosted com pré-carga, a variante `dark` por `data-theme`, a página `/` estática com o script anti-flash e a CSP chegando como cabeçalho. O resultado muda dois pontos do CONTEXT: o guia oficial do Next para evitar flash usa a prop de HTML bruto, que este projeto proíbe, mas **um `<script>` com o código como texto filho sai cru no HTML do SSR** (verificado), então o anti-flash não precisa da prop de HTML bruto, nem de `next-themes`, nem de nonce; e o `shadcn init` **não é inofensivo**: ele reescreve `app/layout.tsx`, traz Geist, instala 6 pacotes (3 deles fora da lista aprovada) e põe `shadcn` como dependência de runtime.

O tema vive em `localStorage` (`nl-theme`), com `data-theme="dark"` já no HTML do servidor (padrão escuro, D-15) e um script inline no `<head>` que só aceita `"light"` ou `"dark"`. Ler cookie no layout raiz tornaria todas as rotas dinâmicas (documentado pelo Next); com o script, `/`, `/sobre`, `/regras`, `/privacidade` e `/kit` ficam estáticas. A CSP entra como cabeçalho estático no `next.config.ts` com `script-src 'self' 'unsafe-inline'`: é a única forma sem nonce, porque o próprio Next injeta scripts inline com conteúdo imprevisível. O ganho real da CSP v1 é `frame-ancestors`, `object-src`, `base-uri`, `form-action` e a trava de `img/font/connect`; o endurecimento de script (nonce por `proxy.ts`) fica para a Fase 4, quando o conteúdo de usuário chega e as páginas já serão dinâmicas.

Para as direções visuais, o mecanismo é direction-agnostic: o autor escolhe, e a implementação muda ~30 variáveis CSS (valores do tema claro e a cor de ornamento), 1 chamada de `next/font/google` (a fonte de título) e a densidade dos ornamentos. Verifiquei que todas as fontes candidatas existem no `next/font/google` e cobrem todos os acentos do pt-BR no subset `latin`. Calculei o contraste de uma paleta derivada completa para os dois temas: o vermelho `#ac020f` **reprova como texto sobre preto (2,77:1)** e sobre a areia `#d3aa82` (3,55:1), então o tema escuro precisa de um vermelho-claro `#ff6b75` para texto e foco, e o claro usa `#8a0210` para links.

**Primary recommendation:** Tailwind 4 + shadcn (radix, preset nova, depois reescrito com os tokens do clã) com tema por `data-theme` e script inline de texto filho; páginas estáticas; CSP v1 estática sem nonce; ativos gerados por script `sharp` (emblema recortado por máscara circular, ícone dos dragões redesenhado em SVG, OG recortado do banner); testes em três camadas (Vitest sem dependência nova por `renderToStaticMarkup`, `node:vm` para o script de tema e um teste de contrato de contraste; Playwright + axe em CI nos dois temas e em viewport de celular).

## Decisões entregues ao planejador (uma recomendação por item)

| # | Decisão | Recomendação | Confiança |
|---|---------|--------------|-----------|
| R1 | Persistência do tema | `localStorage`, chave `nl-theme`, valores `light`/`dark`; padrão `dark` quando ausente, inválido ou bloqueado. Sem cookie. | HIGH |
| R2 | Anti-flash | `<script>{CODIGO}</script>` no `<head>` do layout raiz, código como texto filho (verificado: o Next 16 emite cru). `<html data-theme="dark" suppressHydrationWarning>`. Sem `next-themes`, sem a prop de HTML bruto. | HIGH |
| R3 | Seletor do tema no CSS | `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));` (documentado pelo Tailwind) e tokens em `:root` (claro) e `[data-theme='dark']` (escuro, depois no arquivo). | HIGH |
| R4 | Renderização | Todas as páginas novas estáticas. Proibido `cookies()`/`headers()` no layout raiz. `/status` continua `force-dynamic`. | HIGH |
| R5 | CSP | Cabeçalho estático em `next.config.ts`, `script-src 'self' 'unsafe-inline'`, `style-src 'self' 'unsafe-inline'`, `connect-src` derivado do DSN do Sentry. Nonce por `proxy.ts` fica para a Fase 4. | MEDIUM |
| R6 | Pacotes novos | Pedir aprovação do autor num único checkpoint: `class-variance-authority@0.7.1`, `clsx@2.1.1`, `tailwind-merge@3.7.0`, `radix-ui@1.8.1`, `tw-animate-css@1.4.0` (os três últimos só se o menu usar `Sheet`). Não adotar `lucide-react`, `next-themes`, `@tailwindcss/typography`. Detalhes no Package Legitimacy Audit. | MEDIUM-HIGH |
| R7 | Menu sanduíche | Padrão de disclosure (botão com `aria-expanded`/`aria-controls` e lista de links) em client component; alternativa com `Sheet` do shadcn se o autor aprovar `radix-ui` + `tw-animate-css` (que as Fases 3 a 6 vão pedir de qualquer forma). | MEDIUM |
| R8 | Testes de componente no Vitest | Sem dependência nova: `renderToStaticMarkup` (padrão já usado em `home.int-spec.ts`), `node:vm` para o script de tema, teste de contrato de contraste lendo `globals.css`. Interação (clique, abrir menu) em Playwright na CI. `happy-dom` + `@testing-library/react` só se o autor pedir interação no Vitest. | MEDIUM-HIGH |
| R9 | Ícone dos dragões | Redesenhar em SVG à mão (yin-yang com duas cabeças estilizadas); o recorte do JPG não serve porque o texto "NO LAW" cobre os dragões. O mesmo SVG vira `app/icon.svg`, o ícone do header e a base do botão de tema (D-21). | MEDIUM |
| R10 | Open Graph | `sharp` recorta o banner (cover central) para 1200x630, salvo como `app/opengraph-image.png` + `opengraph-image.alt.txt`; `metadataBase` obrigatório. | HIGH |
| R11 | Fonte do corpo | `Atkinson Hyperlegible Next` (variável, 200 a 800, `latin`), alternativa `Inter`. Fonte de título varia por direção (ver Fontes candidatas). | MEDIUM |
| R12 | Mockups publicados | HTML estático descartável (por `/gsd-sketch`), com `<link>` direto ao Google Fonts (não é código de produção), implantado como projeto Vercel separado ou preview da branch da fase, com `noindex`. Nenhum código de mockup entra na `main`. | MEDIUM |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Aplicar o tema antes da primeira pintura | Browser / Client | Frontend Server (SSR) | O servidor emite `data-theme="dark"`; só o navegador conhece a preferência salva, e o script inline corrige antes do paint |
| Alternar e persistir o tema | Browser / Client | — | Estado em `localStorage`; client component mínimo |
| Menu sanduíche, estado aberto/fechado | Browser / Client | — | Interação pura de UI |
| Pétalas animadas da capa | Browser / Client (CSS puro) | — | Animação CSS, sem JS; desliga por `prefers-reduced-motion` |
| Páginas Sobre, Regras, Privacidade, capa, kit | Frontend Server (SSR estático) | CDN / Static | Conteúdo sem dado de requisição; geradas no build e servidas pela borda |
| Metadados (title, description, Open Graph, ícones, robots) | Frontend Server (SSR) | CDN / Static | API de Metadata do Next; `metadataBase` define as URLs absolutas |
| Cabeçalhos de segurança e CSP | Frontend Server (config do Next) | — | `headers()` em `next.config.ts` aplica em todas as rotas |
| Fontes, favicon, imagens de marca | CDN / Static | — | `next/font` self-hosted em `/_next/static/media`; imagens em `public/` e `app/` |
| Página de status técnico | Frontend Server (dinâmico) | API / Backend | `/status` continua chamando a API server-to-server (BFF); nenhuma rota nova na API |
| Geração dos ativos (recorte, favicon, OG) | Build-time / script do repositório | — | Roda uma vez no ambiente do desenvolvedor; saídas são versionadas |
| Persistência, dados, API | — | — | Nada novo nesta fase |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `tailwindcss` + `@tailwindcss/postcss` | 4.3.5 (exato) | Utilitários e tokens CSS-first (`@theme`) | Já aprovado no CLAUDE.md. Verificado: funciona em Next 16 + pnpm **sem** declarar `postcss` (build do app de rascunho passou apenas com `postcss.config.mjs` e `@import "tailwindcss"`) |
| `shadcn` (CLI) | 4.23.0 | Copia o código-fonte dos componentes e escreve `components.json` | Já aprovado. Ver "O que o `shadcn init` realmente faz" abaixo; pôr em `devDependencies` (o `init` o põe em `dependencies`) |
| `next/font/google` | embutido no Next 16.4.6 | Fontes self-hosted no build | Sem pacote extra; sem requisição do navegador ao Google (CITED: `next/dist/docs/01-app/03-api-reference/02-components/font.md`) |
| `sharp` | 0.35.5 (exato) | Gerar emblema recortado, favicons e OG | Já aprovado (stack do upload da Fase 5); é só dependência transitiva opcional do Next hoje, então um script direto exige declará-la como `devDependency` |
| Next Metadata API | embutida | `icon`, `apple-icon`, `opengraph-image`, `metadataBase`, `robots` | Convenções de arquivo geram as tags `<link>` e `<meta>` (CITED: docs do Next, `app-icons.md`, `opengraph-image.md`) |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `class-variance-authority` | 0.7.1 | Variantes do `Button` e do `Toggle` do shadcn | Necessário para os componentes do kit; o `init` o instala |
| `clsx` + `tailwind-merge` | 2.1.1 + 3.7.0 | Implementação clássica de `cn()` em `lib/utils.ts` | Recomendado. O `init` 4.23.0 instala o pacote `cn@^0.5.2` no lugar (ver Alternatives); como os componentes importam `cn` do alias `@/lib/utils`, o conteúdo do arquivo é escolha nossa |
| `radix-ui` | 1.8.1 | Primitivos (Slot, Dialog para `Sheet`, Toggle) usados pelos componentes shadcn | Só se o autor aprovar `Sheet` e `asChild`; as Fases 3 a 6 (menu de usuário, lightbox, diálogos) vão exigir |
| `tw-animate-css` | 1.4.0 | Classes `animate-in`/`animate-out` do `Sheet` e de popovers | Junto com `radix-ui`; o `init` a importa em `globals.css` |
| `@axe-core/playwright` | 4.14.0 | Já instalado | Axe nos dois temas e em celular (reaproveitar `expectNoAxeViolations`) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `clsx` + `tailwind-merge` | `cn@0.5.2` (pacote do próprio repositório `shadcn-ui/cn`, substitui os dois) | É o que o CLI 4.23.0 emite hoje. Veredito `SUS` (publicado em novembro/2026, recente). Pode ser aceito pelo autor; o par clássico é mais antigo e conhecido. Decisão do autor no checkpoint de pacotes |
| `Sheet` (Radix Dialog) | Disclosure nativo com `aria-expanded` | Disclosure é o padrão ARIA recomendado para navegação não modal e dispensa 3 pacotes; `Sheet` dá trava de foco e scroll lock prontos e serve às fases seguintes |
| `lucide-react` | Ícones SVG como componentes (☰, ✕) em `components/icons.tsx` | `lucide-react` publica versão nova todo dia (veredito `SUS` por recência) e o kit só precisa de 2 ou 3 ícones. Se `shadcn add sheet` o trouxer de volta, trocar o import à mão |
| Script inline próprio | `next-themes@0.4.6` | Funciona, mas é dependência nova para 15 linhas de código, e o guia oficial do Next documenta o inline como a solução; `next-themes` não resolve CSP nem a proibição de HTML bruto melhor que o script próprio |
| Tipografia do conteúdo | `@tailwindcss/typography` | Não aprovado. Usar um componente `Prose` com classes do Tailwind e `max-w-prose`, sem pacote |
| Testes de componente | `happy-dom@21.0.4` ou `jsdom` + `@testing-library/react@16.3.3` + `@testing-library/dom@10.4.2` | Úteis para clique/foco no Vitest, mas são 3 a 4 pacotes novos. `@testing-library/jest-dom@8.0.0` exige Vitest 5 (o projeto está no 4.1.12): não usar |
| `sharp` para vetorizar | `potrace` (npm) | GPL-2.0: não usar. `imagetracerjs` ou `potrace` externo não estão aprovados e o JPG não separa os dragões do texto de qualquer forma (R9) |

**Installation:**
```bash
# Dentro de apps/web, depois do checkpoint de aprovação de pacotes (R6):
pnpm --filter @blog/web add --save-exact tailwindcss@4.3.5
pnpm --filter @blog/web add -D --save-exact @tailwindcss/postcss@4.3.5 shadcn@4.23.0 sharp@0.35.5
pnpm --filter @blog/web add --save-exact class-variance-authority@0.7.1 clsx@2.1.1 tailwind-merge@3.7.0
# Somente se o autor aprovar Sheet/asChild:
pnpm --filter @blog/web add --save-exact radix-ui@1.8.1 tw-animate-css@1.4.0
```
(Tailwind e `@tailwindcss/postcss` são `devDependencies` do projeto, ambos em 4.3.5. Sem `postcss` explícito: verificado desnecessário.)

**Version verification:** `npm view` em 2026-11-27: `tailwindcss` 4.3.5 (publicado 2026-11-06), `@tailwindcss/postcss` 4.3.5, `shadcn` latest 4.23.1 (o CLAUDE.md fixa 4.23.0), `radix-ui` 1.8.1 (2026-10-12), `class-variance-authority` 0.7.1, `clsx` 2.1.1, `tailwind-merge` latest 3.7.1 (publicado 2026-11-19; **fixar 3.7.0**, de 2026-09-12), `tw-animate-css` 1.4.0 (2025-09-24), `sharp` 0.35.5. `@tailwindcss/oxide` 4.3.5 e `radix-ui`, `class-variance-authority`, `clsx` não têm `postinstall` (`npm view ... scripts`); sem entrada nova em `allowBuilds` do `pnpm-workspace.yaml`.

## Package Legitimacy Audit

Executado `gsd_run query package-legitimacy check --ecosystem npm ...` em 2026-11-27. O veredito `SUS` com motivo `too-new` indica apenas que a **última versão** foi publicada há poucas semanas; todos têm repositório de origem e dezenas de milhões de downloads semanais. A mitigação é fixar uma versão mais antiga quando existe.

| Package | Registry | Última versão publicada | Downloads/sem | Source Repo | Verdict | Disposition |
|---------|----------|-------------------------|---------------|-------------|---------|-------------|
| `tailwindcss` | npm | 2026-11-06 | 184 mi | tailwindlabs/tailwindcss | SUS (too-new) | Já aprovado no CLAUDE.md em 4.3.5; sem checkpoint novo |
| `@tailwindcss/postcss` | npm | 2026-11-06 | 59 mi | tailwindlabs/tailwindcss | SUS (too-new) | Já aprovado em 4.3.5 |
| `shadcn` | npm | 2026-11-25 (4.23.1) | 18 mi | shadcn-ui/ui | SUS (too-new) | Já aprovado em 4.23.0; fixar 4.23.0 exato |
| `sharp` | npm | 2026-09-27 | 166 mi | lovell/sharp | OK | Já aprovado em 0.35.5; primeiro uso direto (devDependency do web) |
| `class-variance-authority` | npm | 2024-11-26 | 85 mi | joe-bell/cva | OK | Pedir aprovação (R6) |
| `clsx` | npm | 2024-04-23 | 174 mi | lukeed/clsx | OK | Pedir aprovação (R6) |
| `tailwind-merge` | npm | 2026-11-19 (3.7.1); 3.7.0 em 2026-09-12 | 114 mi | dcastil/tailwind-merge | SUS (too-new) | Pedir aprovação, **fixar 3.7.0**; planner insere `checkpoint:human-verify` antes de instalar |
| `radix-ui` | npm | 2026-10-12 | 28 mi | radix-ui/primitives | OK | Pedir aprovação (só com `Sheet`/`asChild`) |
| `tw-animate-css` | npm | 2025-09-24 | 50 mi | Wombosvideo/tw-animate-css | OK | Pedir aprovação (só com `Sheet`) |
| `cn` | npm | 2026-11-02 | 25 mi | shadcn-ui/cn | SUS (too-new) | Alternativa a clsx + tailwind-merge; `checkpoint:human-verify` se o autor preferir |
| `lucide-react` | npm | 2026-11-26 (publica todo dia) | 139 mi | lucide-icons/lucide | SUS (too-new) | **Não adotar** nesta fase (ícones inline) |
| `next-themes` | npm | 2025-03-11 | 35 mi | pacocoursey/next-themes | OK | **Não adotar** (script próprio) |
| `jsdom` | npm | 2026-11-13 | 163 mi | jsdom/jsdom | SUS (too-new) | Só se o autor pedir testes de interação; preferir `happy-dom` |
| `happy-dom` | npm | 2026-10-20 | 37 mi | capricorn86/happy-dom | OK | Opcional (R8) |
| `@testing-library/react` | npm | 2026-08-27 | 99 mi | testing-library/react-testing-library | OK | Opcional (R8) |
| `@testing-library/dom` | npm | 2026-09-13 | 123 mi | testing-library/dom-testing-library | OK | Opcional (R8) |

**Packages removed due to [SLOP] verdict:** nenhum.
**Packages flagged as suspicious [SUS]:** `tailwind-merge` (fixar 3.7.0), `cn`, `lucide-react`, `jsdom` (todos por recência da última versão; o planner insere `checkpoint:human-verify` antes de qualquer instalação deles). Tailwind, `@tailwindcss/postcss` e `shadcn` já estão aprovados por nome e versão no CLAUDE.md.

Origem dos nomes: `class-variance-authority`, `radix-ui` e `cn` aparecem nos itens oficiais do registro do shadcn (`https://ui.shadcn.com/r/styles/new-york-v4/button.json`, `sheet.json`, `utils.json`, lidos nesta sessão) e no `package.json` gerado pelo `shadcn init` executado nesta sessão `[VERIFIED: saída do shadcn init em app de rascunho]`. `clsx` e `tailwind-merge` vêm da implementação clássica do `cn()` do shadcn e foram checados no registro npm `[ASSUMED: nome vindo de conhecimento prévio; verdict OK/SUS do seam, mas não lidos em documentação oficial nesta sessão]`.

## O que o `shadcn init` realmente faz (executado nesta sessão)

Em um app de rascunho (Next 16.4.6, Tailwind 4.3.5, `tsconfig` com `paths: {"@/*": ["./*"]}` e um `next.config.ts` presente):

```bash
CI=1 pnpm dlx shadcn@4.23.0 init -b radix -p nova -y --no-monorepo --no-rtl --no-pointer < /dev/null
```

- **Sem `-p` o comando trava** num prompt interativo ("Which preset would you like to use?"), mesmo com `-y`. Presets válidos: `nova, vega, maia, lyra, mira, luma, sera, rhea` (o formato `radix-nova` é rejeitado).
- **Sem `next.config.*` na pasta**, o CLI responde "We could not detect a supported framework". O `apps/web` tem `next.config.ts`, então detecta.
- **Dependências adicionadas** (saída real): `class-variance-authority ^0.7.1`, `cn ^0.5.2`, `lucide-react ^1.80.0`, `radix-ui ^1.8.1`, `shadcn ^4.23.1` (em `dependencies`, porque `globals.css` passa a importar `shadcn/tailwind.css`) e `tw-animate-css ^1.4.0`. Nenhuma está em `devDependencies`.
- **Arquivos escritos:** `components.json` (`"style": "radix-nova"`, `"rsc": true`, `"iconLibrary": "lucide"`, aliases `@/components`, `@/lib/utils`, `@/components/ui`), `lib/utils.ts` com `export { cn } from "cn"`, `app/globals.css` reescrito e **`app/layout.tsx` reescrito** (acrescenta `Geist` do `next/font/google` e `cn`).
- **`globals.css` gerado:** `@import "tailwindcss"; @import "tw-animate-css"; @import "shadcn/tailwind.css";`, `@custom-variant dark (&:is(.dark *));`, bloco `@theme inline` com os tokens `--color-*` e `--radius-*` (escala derivada de `--radius`), `:root` e `.dark` em OKLCH com tokens de sidebar e chart, e `@layer base` com `border-border outline-ring/50`, `bg-background text-foreground`, `font-sans`.
- **Itens do registro** (lidos em `ui.shadcn.com/r/styles/new-york-v4/`): `button` usa `class-variance-authority` e `Slot` de `radix-ui`; `card` só `cn`; `toggle` e `sheet` usam `radix-ui` (e `sheet` importa `XIcon` de `lucide-react` e classes `animate-in`).

**Consequências para o plano:**
1. Rodar o `init` primeiro, em commit limpo, e revisar o diff; ele sobrescreve `layout.tsx` e `globals.css`.
2. Antes do `init`, criar o `paths` `@/*` no `tsconfig.json` do web (hoje não existe) e conferir que o `vitest` o resolve (`resolve: { tsconfigPaths: true }` já está no `vitest.config.ts`).
3. Mover `shadcn` para `devDependencies` (o `@import "shadcn/tailwind.css"` é resolvido no build; devDependencies são instaladas no build do Vercel). Remover `lucide-react` e `cn` do `package.json` se o autor aprovar o caminho clássico, e reescrever `lib/utils.ts` com `clsx` + `twMerge`.
4. Trocar `@custom-variant dark` por `data-theme` (R3), reduzir tokens (sem `sidebar`/`chart` nesta fase), converter para hex da paleta do clã e passar o Prettier (`singleQuote`, `printWidth: 100`) nos arquivos gerados, senão `pnpm run format:check` falha.

## Architecture Patterns

### System Architecture Diagram

```
 Visitante (celular ou desktop)
        │  GET /, /sobre, /regras, /privacidade, /kit            GET /status
        ▼                                                             │
 ┌─────────────── Vercel (borda: CDN) ────────────────┐               │
 │  HTML estático pré-renderizado  +  /_next/static    │               │
 │  (CSS do Tailwind, woff2 das fontes, JS)            │               │
 │  Cabeçalhos: CSP v1 + nosniff + Referrer + Perm.    │               │
 └───────────────┬─────────────────────────────────────┘               │
                 │ HTML chega com <html data-theme="dark">             │
                 ▼                                                     ▼
 ┌─ Navegador, parsing do <head> ─────────────────────┐   ┌─ Função Vercel (iad1) ──────────┐
 │ 1. <link stylesheet> (tokens claro/escuro)         │   │ page.tsx de /status (dinâmico)  │
 │ 2. <script> inline:                                │   │   getStatus() ──► API (Render)  │
 │      lê localStorage["nl-theme"]                   │   │   (server-to-server, 5 s)       │
 │      "light" → data-theme="light", senão "dark"    │   └─────────────────────────────────┘
 │ 3. Primeira pintura JÁ no tema certo (sem flash)   │
 │ 4. Hidratação React                                │
 │      ThemeToggle (useSyncExternalStore)            │
 │         clique → atualiza data-theme + localStorage│
 │      MobileMenu (disclosure, estado local)         │
 │      Petals (CSS puro; reduced-motion → oculto)    │
 └────────────────────────────────────────────────────┘

 Build / repositório (uma vez, fora do runtime)
 assets/brand/*.jpg ──► scripts/brand/generate.mjs (sharp)
        ├─► app/opengraph-image.png (+ .alt.txt)   banner cortado 1200x630
        ├─► app/icon.svg, app/icon1.png, app/apple-icon.png, app/favicon.ico
        └─► public/brand/emblema.png (recorte circular, alfa)
```

### Recommended Project Structure

```
apps/web/
├── app/
│   ├── layout.tsx            # <html data-theme="dark">, fontes, script de tema, Header/Footer, metadata
│   ├── globals.css           # @import tailwindcss, @custom-variant, @theme inline, tokens claro/escuro
│   ├── page.tsx              # capa do clã (estática, sem chamar a API)
│   ├── sobre/page.tsx        # texto provisório (D-12)
│   ├── regras/page.tsx       # versão mínima provisória até o autor mandar o texto (D-13)
│   ├── privacidade/page.tsx  # curta, sem citar lei (D-14)
│   ├── kit/page.tsx          # noindex, referência dos tokens e componentes
│   ├── status/page.tsx       # a antiga home (force-dynamic) com o visual novo, noindex
│   ├── global-error.tsx      # importa globals.css e aplica o tema por conta própria
│   ├── not-found.tsx         # 404 com a identidade (recomendado, baixo custo)
│   ├── icon.svg  icon1.png  apple-icon.png  favicon.ico
│   └── opengraph-image.png  opengraph-image.alt.txt
├── components/
│   ├── ui/                   # saída do shadcn (button, card, ...) já formatada pelo Prettier
│   ├── site-header.tsx  site-footer.tsx  mobile-menu.tsx  theme-toggle.tsx
│   ├── dragon-mark.tsx       # ícone SVG dos dragões (componente, aria-hidden)
│   ├── icons.tsx             # ☰ e ✕ como SVG
│   ├── prose.tsx             # tipografia das páginas de texto
│   └── petals.tsx            # 8 a 12 <span aria-hidden>, animação por CSS
├── lib/
│   ├── theme.ts              # constantes, resolveTheme, THEME_INIT_SCRIPT, store do toggle
│   ├── fonts.ts              # ÚNICO módulo que chama next/font/google (isolado para os testes)
│   ├── site.ts               # nome, slogan, ano, URL base
│   └── utils.ts              # cn()
├── public/brand/             # emblema recortado (PNG com alfa), banner da capa (WebP/JPG)
├── e2e/                      # home.spec.ts vira status.spec.ts; novos: tema, paginas, mobile
├── test/                     # status.int-spec.ts (era home.int-spec.ts)
└── components.json
scripts/brand/generate.mjs    # recorte, favicons e OG (sharp); roda à mão, saídas versionadas
```

### Pattern 1: Tema sem flash e sem HTML bruto

**What:** O servidor sempre emite `data-theme="dark"` (D-15). Um `<script>` inline no `<head>`, cujo **código é o texto filho** (não a prop de HTML bruto), troca para `light` antes da primeira pintura se `localStorage["nl-theme"] === "light"`. Qualquer outro valor (ausente, inválido, storage bloqueado) mantém `dark`.
**When to use:** layout raiz.
**Verificação (nesta sessão):** `next build` num app de rascunho com Next 16.4.6 gerou em `.next/server/app/index.html`: `<html lang="pt-BR" data-theme="dark" ...>` e, no `<head>`, `<script>(function(){try{var t=localStorage.getItem("nl-theme");document.documentElement.setAttribute("data-theme",t==="light"?"light":"dark")}catch(e){}})()</script>`, com `<`, `&` e aspas **sem escape**. Também `renderToStaticMarkup` com `a<b&&"x"` dentro do `<script>` confirmou o texto cru. A rota `/` saiu `○ (Static)`.
**Example:**
```tsx
// apps/web/lib/theme.ts   (modelo; os valores abaixo vieram do app de rascunho)
export const THEME_KEY = 'nl-theme';
export const THEMES = ['dark', 'light'] as const;
export type Theme = (typeof THEMES)[number];
export const DEFAULT_THEME: Theme = 'dark';

// Só aceita os dois valores conhecidos: nunca grava o texto bruto do storage no DOM.
export function resolveTheme(stored: string | null | undefined): Theme {
  return stored === 'light' ? 'light' : DEFAULT_THEME;
}

export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");document.documentElement.setAttribute("data-theme",t==="light"?"light":"dark")}catch(e){}})()`;
```
```tsx
// apps/web/app/layout.tsx   (trecho)
<html lang="pt-BR" data-theme="dark" suppressHydrationWarning className={`${body.variable} ${title.variable}`}>
  <head>
    <script>{THEME_INIT_SCRIPT}</script>
  </head>
  <body>...</body>
</html>
```
`suppressHydrationWarning` em `<html>` é necessário porque o script muda `data-theme` antes da hidratação (mesmo motivo do guia do Next e do shadcn). `[CITED: next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md]` (o guia usa a prop de HTML bruto; aqui ela é proibida, daí o texto filho).

**Em desenvolvimento**, o Strict Mode remonta e limpa atributos que o script pôs no `<html>` (CITED: mesmo guia, seção "Re-applying attributes in development"). O `ThemeToggle` reaplica o tema em um `useLayoutEffect` (no-op em produção).

**Botão (modelo; padrão React, validar no ciclo RED):**
```tsx
'use client';
import { useLayoutEffect, useSyncExternalStore } from 'react';
import { THEME_KEY, resolveTheme, type Theme } from '@/lib/theme';

const listeners = new Set<() => void>();
const read = (): Theme => resolveTheme(document.documentElement.getAttribute('data-theme'));
const subscribe = (cb: () => void) => { listeners.add(cb); return () => listeners.delete(cb); };

export function ThemeToggle() {
  // Servidor e hidratação veem "dark"; se o storage disser "light", o React reconcilia após hidratar.
  const theme = useSyncExternalStore(subscribe, read, () => 'dark' as Theme);
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', resolveTheme(localStorage.getItem(THEME_KEY)));
    listeners.forEach((l) => l());
  }, []);
  const next: Theme = theme === 'dark' ? 'light' : 'dark';
  return (
    <button type="button" aria-label={`Mudar para tema ${next === 'light' ? 'claro' : 'escuro'}`}
      onClick={() => {
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem(THEME_KEY, next); } catch {}
        listeners.forEach((l) => l());
      }}>
      {/* yin-yang dos dragões: SVG desenhado por CSS/tokens, não depende do estado em JS */}
    </button>
  );
}
```
O ícone do botão deve ser trocado por CSS (`[data-theme='dark'] &`), não por estado do React, para não piscar entre a pintura do HTML e a hidratação; só o `aria-label` se atualiza depois da hidratação.

### Pattern 2: Tokens em três camadas (VIS-01)

**What:** (1) primitivos da marca, (2) tokens semânticos com os nomes do shadcn, (3) mapa `@theme inline` para o Tailwind gerar `bg-background`, `text-primary` etc.
**Per direction:** só a camada 1 e as variáveis de ornamento/raio mudam. Os componentes só enxergam a camada 2.
```css
/* apps/web/app/globals.css  (esqueleto; valores hex calculados nesta sessão, ver tabela de contraste) */
@import 'tailwindcss';
@import 'tw-animate-css';               /* somente se Sheet entrar */
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));

@theme inline {
  --color-background: var(--background);   --color-foreground: var(--foreground);
  --color-card: var(--card);               --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);         --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);     --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);             --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);           --color-accent-foreground: var(--accent-foreground);
  --color-border: var(--border);           --color-input: var(--input);  --color-ring: var(--ring);
  --color-destructive: var(--destructive);
  --font-sans: var(--font-body), ui-sans-serif, system-ui, sans-serif;
  --font-display: var(--font-title), ui-serif, serif;
  --radius-sm: calc(var(--radius) * 0.6);  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);              --radius-xl: calc(var(--radius) * 1.4);
}

:root {                                   /* claro "pergaminho" (fallback) */
  color-scheme: light;
  --background: #ecdcc4;  --foreground: #1a1210;
  --card: #f6eddc;        --card-foreground: #1a1210;
  --primary: #ac020f;     --primary-foreground: #ffffff;
  --secondary: #d3aa82;   --secondary-foreground: #420b0d;
  --muted: #e2cfb2;       --muted-foreground: #5c4631;
  --accent: #8a0210;      --accent-foreground: #ffffff;
  --border: #8a6a4a;      --input: #8a6a4a;     --ring: #ac020f;
  --destructive: #8a0210; --radius: 0.5rem;
}
[data-theme='dark'] {                     /* escuro "tinta" (padrão) */
  color-scheme: dark;
  --background: #000000;  --foreground: #d3aa82;
  --card: #420b0d;        --card-foreground: #d3aa82;
  --primary: #ac020f;     --primary-foreground: #ffffff;
  --secondary: #2a0708;   --secondary-foreground: #d3aa82;
  --muted: #1a0506;       --muted-foreground: #bfa07f;
  --accent: #ff6b75;      --accent-foreground: #000000;
  --border: #a8845f;      --input: #a8845f;     --ring: #ff6b75;
  --destructive: #ff6b75;
}
@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground font-sans; }
}
```
`--muted`, `--accent` e `--destructive` acima são propostas de partida: os pares texto/fundo que **entram** no teste de contrato precisam ser listados explicitamente (ver Validation Architecture). `[CITED: shadcn theming, https://ui.shadcn.com/docs/theming]` para a estrutura; `[CITED: https://tailwindcss.com/docs/dark-mode]` para a variante por `data-theme`.

**Paleta derivada, razões WCAG calculadas nesta sessão** (fórmula de luminância relativa, script local; `[VERIFIED: cálculo executado nesta sessão]`):

| Par | Razão | Resultado |
|-----|-------|-----------|
| Escuro: `#d3aa82` sobre `#000000` | 9,84 | AAA |
| Escuro: `#d3aa82` sobre `#420b0d` (card) | 7,66 | AAA |
| Escuro: `#bfa07f` (muted) sobre `#000000` / `#420b0d` | 8,55 / 6,65 | AA texto |
| Escuro: `#ffffff` sobre `#ac020f` (botão) | 7,58 | AAA |
| Escuro: `#ff6b75` (link, destaque, foco) sobre `#000000` / `#420b0d` | 7,61 / 5,92 | AA texto e UI |
| Escuro: borda `#a8845f` sobre `#420b0d` | 4,77 | AA UI (3:1) |
| Claro: `#1a1210` sobre `#ecdcc4` (fundo) / `#f6eddc` (card) | 13,71 / 15,88 | AAA |
| Claro: `#5c4631` (muted) sobre `#ecdcc4` / `#f6eddc` | 6,57 / 7,61 | AA texto |
| Claro: link `#8a0210` sobre `#ecdcc4` / `#f6eddc` | 7,44 / 8,62 | AAA |
| Claro: `#ac020f` (destaque, foco) sobre `#ecdcc4` | 5,63 | AA texto e UI |
| Claro: borda `#8a6a4a` sobre `#ecdcc4` / `#f6eddc` | 3,68 / 4,26 | AA UI |
| Claro: `#420b0d` sobre `#d3aa82` (faixa) | 7,66 | AAA |
| **Reprovam:** `#ac020f` como texto sobre `#000000` | 2,77 | FALHA (texto e UI) |
| **Reprovam:** `#ac020f` como texto sobre `#d3aa82` | 3,55 | só UI/texto grande |
| **Reprovam:** `#d3aa82` como borda sobre `#f4ead9` | 1,79 | FALHA |

Regra derivada: **o vermelho `#ac020f` é preenchimento (botão com texto branco), nunca texto no tema escuro**; texto vermelho no escuro usa `#ff6b75`; no claro usa `#8a0210` (links) ou `#ac020f` só sobre `#ecdcc4` ou mais claro.

### Pattern 3: Fontes por `next/font/google` (todas verificadas)

Cada candidata existe em `node_modules/next/dist/compiled/@next/font/dist/google/font-data.json` e, baixando o subset `latin` do Google Fonts nesta sessão, **todas contêm todos os glifos de** `ÁÀÂÃÇÉÊÍÓÔÕÚáàâãçéêíóôõúü“”—·` e das frases "NO LAW Início Política História Não" (`[VERIFIED: fontkit sobre os woff2 baixados]`). Pesos do `latin`: de 12 a 52 KB por arquivo.

| Papel / direção | Fonte | `weight` | Subset | Observação |
|-----------------|-------|----------|--------|------------|
| Título, "latina estilo japonês" | `Rampart_One` | `'400'` | `latin` | Contornada, mais próxima do estilo do banner `[ASSUMED]` |
|  | `Reggae_One`, `Dela_Gothic_One`, `Zen_Dots`, `RocknRoll_One`, `Train_One` | `'400'` | `latin` | Mais pesadas e geométricas; o mockup decide |
| Título, pincel | `Yuji_Boku` | `'400'` | `latin` | Tinta japonesa com serifa, combina com sumi-e |
|  | `Potta_One`, `Kaushan_Script`, `Permanent_Marker` | `'400'` | `latin` | `Permanent_Marker` só tem `latin` |
| Título, serifada clássica | `Cinzel` (variável 400 a 900), `Playfair_Display` (variável), `Shippori_Mincho` (400 a 800) | variável ou lista | `latin` | `Shippori_Mincho` tem sabor japonês |
| Corpo, sans legível | `Atkinson_Hyperlegible_Next` (variável 200 a 800) ou `Inter` (variável) | omitir (variável) | `latin` | Recomendação: Atkinson; `Inter` como alternativa segura |

```ts
// apps/web/lib/fonts.ts  — único módulo que chama o loader (vi.mock nos testes)
import { Atkinson_Hyperlegible_Next, Rampart_One } from 'next/font/google';

export const body = Atkinson_Hyperlegible_Next({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
// Troca por direção: só esta linha (e o nome importado) muda.
export const title = Rampart_One({ subsets: ['latin'], weight: '400', variable: '--font-title', display: 'swap' });
```
Regras do loader (CITED: `font.md`): fonte de peso único exige `weight`; variável dispensa `weight`; o nome importado usa `_` no lugar de espaço; chamadas em escopo de módulo com literais. O build baixa os arquivos do Google (rede necessária no `next build`; verificado funcionando neste ambiente e nos runners do GitHub); o navegador nunca fala com o Google. O build do rascunho gerou 2 `<link rel="preload" as="font">` e a classe `.variable` aplicada em `<html>`.

### Pattern 4: Metadados, ícones e Open Graph (VIS-02)

```ts
// apps/web/app/layout.tsx (trecho). `metadataBase` torna absolutas as URLs de og:image e ícones.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://blog-no-law.vercel.app'),
  title: { default: 'Blog No Law', template: '%s | Blog No Law' },
  description: 'O blog do clã No Law: desde 2017, a história do clã em posts, fotos e vídeos.',
  openGraph: { siteName: 'Blog No Law', locale: 'pt_BR', type: 'website' },
};
```
- `app/icon.svg` (ícone dos dragões), `app/icon1.png` (32x32), `app/apple-icon.png` (180x180) e `app/favicon.ico` geram os `<link>` sozinhos; arquivos numerados ordenam lexicalmente (CITED: `app-icons.md`). O ícone de 512 para manifesto/PWA fica em `public/` (só necessário se houver `manifest`; D-03 pede o tamanho).
- `app/opengraph-image.png` (1200x630) + `app/opengraph-image.alt.txt` geram `og:image`, `og:image:type`, `og:image:width`, `og:image:height`, `og:image:alt` (CITED: `opengraph-image.md`). Limite de 8 MB; o recorte do banner em PNG paletizado ficou com ~500 KB e em JPEG qualidade 82 com ~100 KB (medido nesta sessão). Preferir JPEG (`opengraph-image.jpg`) para o peso.
- `/kit` e `/status`: `export const metadata = { robots: { index: false, follow: false } }` e, para dupla garantia, cabeçalho `X-Robots-Tag: noindex` por `headers()` (testável por Playwright).
- Previews já vistos pelo Discord/WhatsApp ficam em cache do lado deles; a conferência final do preview real é manual.

### Pattern 5: Ativos de marca com `sharp` (D-01, D-03, D-04)

Executado em scratch com `sharp 0.35.5` (libvips 8.18.7), 1,7 s no total:
- **Recorte do emblema:** `extract({ left: 194, top: 152, width: 636, height: 636 })` (centro estimado `(512, 470)`, raio `318`) + `composite` com máscara SVG circular `blend: 'dest-in'` gerou PNG 636x636 com alfa. A borda externa do anel ficou limpa; o raio 318 ainda inclui um respingo vermelho e a ponta das nuvens na base, então **reduzir para ~300 e conferir visualmente**. A máscara é geométrica: o pergaminho **dentro** do círculo permanece (o emblema continua sobre papel bege). Não é um recorte "sem fundo" dos dragões.
- **Por que o ícone dos dragões precisa ser redesenhado (R9):** na `Logo No Law.jpg` o texto "NO LAW" e "SINCE 2017" cobre justamente o corpo e a cabeça do dragão vermelho e parte do preto. Remover o texto do raster não é viável. No `Banner No Law.jpg` o emblema é outro desenho (sem o anel externo), também com "NO LAW" por cima. Criar o SVG simplificado (yin-yang com duas cabeças estilizadas, cores `#000000`/`#ac020f`, contorno em `currentColor`) e usá-lo no header, no favicon e como base do botão de tema (D-21). É a tarefa de maior risco visual da fase: reservar uma rodada de aprovação nos mockups.
- **Open Graph:** `sharp(banner).resize(1200, 630, { fit: 'cover', position: 'centre' })` mantém o emblema e o slogan (o slogan ocupa x 420 a 1070 de 1500 e cabe no recorte central); corta as nuvens dos cantos e amplia 1,26x (levemente macio). Apareceu um fragmento vermelho de nuvem na borda esquerda: usar `extract` com `left` ajustado em vez de `cover` puro, ou `extend` com a cor do papel.
- **Favicons:** `sharp(svg).resize(32).png()` etc. `.ico` não é saída do `sharp`: um ICO com PNG embutido é um cabeçalho ICONDIR de 6 bytes + entradas de 16 bytes + os bytes do PNG (formato simples, ~25 linhas de Node); escrever com teste, sem pacote.
- **Declarar `sharp` como devDependency do `@blog/web`** (hoje só chega como dependência opcional do `next`; o `require` a partir de `apps/api` falhou nesta sessão por isso). O script vive em `scripts/brand/generate.mjs`, **roda à mão** e suas saídas são versionadas: não entra no CI nem no build do Vercel.

### Pattern 6: CSP v1 estática (Claude's Discretion)

O Next injeta scripts inline com conteúdo variável a cada página (`self.__next_f.push([...])`, visto no HTML do rascunho), então hash fixo não cobre. Duas saídas documentadas: (a) nonce por `proxy.ts`, que **obriga renderização dinâmica em todas as rotas, sem ISR, sem cache de CDN e incompatível com PPR** (CITED: `content-security-policy.md`); (b) cabeçalho estático com `'unsafe-inline'`. Para esta fase (nenhum conteúdo de usuário ainda; páginas estáticas), recomenda-se (b), com o ganho que ela de fato entrega, e planejar (a) para a Fase 4.

```ts
// apps/web/next.config.ts  (trecho; o array de cabeçalhos existente continua, a CSP entra no mesmo objeto)
const isDev = process.env.NODE_ENV === 'development';
const sentryOrigin = (() => {          // connect-src derivado do DSN público, se houver
  try { return new URL(process.env.NEXT_PUBLIC_SENTRY_DSN ?? '').origin; } catch { return ''; }
})();
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${sentryOrigin ? ` ${sentryOrigin}` : ''}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');
// ...headers: [{ key: 'Content-Security-Policy', value: csp }, ...os quatro existentes]
```
Verificado no rascunho: `next build` com esse cabeçalho passou e as páginas continuaram estáticas. **Por que `style-src 'unsafe-inline'`:** o SSR do React emite atributos `style="..."` (visto: `style="color:red"` no HTML) e um `style-src 'self'` puro os bloqueia; além disso bibliotecas como o scroll lock do Radix injetam `<style>` `[ASSUMED]`. Como mitigação, **proibir `style={{}}` nos componentes do projeto** (pétalas e ornamentos usam classes e variáveis no CSS) para que a CSP possa apertar depois. Efeitos a cobrir no E2E: nenhuma violação de CSP no console em nenhuma rota/tema/viewport; previews do Vercel com o toolbar `vercel.live` podem acusar violações que não ocorrem em produção `[ASSUMED]`.

### Pattern 7: Pétalas só com CSS (D-20)

8 a 12 `<span aria-hidden="true">` num contêiner `overflow: clip`, `pointer-events: none`, atrás do texto; animação só de `transform` e `opacity`; variação por petala via seletores `:nth-child()` no CSS (nunca `style=` inline, por causa da CSP e da regra do item anterior); `@media (prefers-reduced-motion: reduce) { display: none }` ou a variante `motion-reduce:hidden` do Tailwind. Pétalas que saem do contêiner lateralmente causam **rolagem horizontal**: o contêiner precisa de `overflow-x: clip` e a queda deve usar `cqh`/porcentagens do contêiner, não `vw`. O Playwright usa `reducedMotion: 'reduce'` como padrão (determinismo do axe) e um teste dedicado liga `no-preference` para provar que as pétalas existem só na capa.

### Mecanismo por direção (para o UI-SPEC)

| Eixo | Muda por direção? | Onde mexe |
|------|-------------------|-----------|
| Cores do tema claro (bege, vermelho de destaque) | Sim | Variáveis em `:root` (~15) |
| Cores do tema escuro | Pouco (D-15 fixa preto, `#420b0d` e bege) | `[data-theme='dark']` (mesma paleta, mudam `--accent`/`--border`) |
| Fonte do título | Sim | 1 chamada em `lib/fonts.ts` (`--font-title`) |
| Fonte do corpo | Não | `--font-body` |
| Raio, espessura de borda, sombras | Sim | `--radius` e 2 ou 3 variáveis (`--border-width`, `--shadow-card`) |
| Textura de papel e nuvens | Sim (densidade) | Variáveis `--paper-opacity`, `--ornament-opacity` e o conjunto de SVGs usados no header, capa e rodapé |
| Estrutura de componentes e rotas | Não | — |

Direção **Pergaminho**: claro como protagonista visual, textura de papel mais forte, `Rampart_One` ou `Yuji_Boku`. **Tinta**: escuro, gradiente `#ac020f` a `#420b0d` como assinatura (variável `--brand-gradient`), ornamentos mínimos, `Reggae_One`/`Zen_Dots`. **Arquivo**: serifada (`Cinzel`/`Shippori_Mincho`), mais `border`, menos cor, ênfase em linha do tempo. Em todas, o gradiente nunca fica sob texto sem um token que o axe/teste de contrato consiga avaliar (ver Pitfall 4).

### Anti-Patterns to Avoid
- **Ler `cookies()` no layout raiz para pintar o tema no servidor:** torna todas as rotas dinâmicas (CITED: guia do Next) e perde o cache do CDN.
- **`next-themes` ou a prop de HTML bruto para o anti-flash:** desnecessário e proibido, respectivamente.
- **`style={{...}}` em componentes:** viola a trava da CSP futura; usar classes/variáveis.
- **Vermelho `#ac020f` como cor de texto ou borda no escuro:** 2,77:1.
- **Texto sobre `background-image`/gradiente sem plano sólido:** o axe não consegue avaliar e devolve `incomplete`, não falha (ver Pitfall 4).
- **Importar `next/font/google` em vários módulos ou em componentes testados no Vitest:** o loader só funciona no build do Next.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fontes self-hosted com pré-carga e fallback com métrica ajustada | `@font-face` manual e `<link>` de pré-carga | `next/font/google` | Baixa no build, serve de `/_next/static/media`, ajusta o fallback para evitar CLS |
| Tags de favicon, `apple-touch-icon`, `og:image` | `<link>`/`<meta>` escritos à mão no `<head>` | Convenções de arquivo do Next (`app/icon.*`, `app/opengraph-image.*`) e Metadata API | Geram `type`, `sizes`, dimensões e URL absoluta (com `metadataBase`) |
| Variantes de botão e merge de classes | `if` de classes concatenadas | `cva` + `cn()` do shadcn | Resolve conflitos de utilitários do Tailwind |
| Foco preso e rolagem travada em menu modal | Armadilha de foco própria | `Sheet` do shadcn (Radix Dialog), se aprovado; senão disclosure não modal | Acessibilidade de teclado é fácil de errar |
| Contraste WCAG | Olhar a cor "no olho" | Teste de contrato com a fórmula de luminância relativa (20 linhas, sem pacote) + axe | O axe não avalia gradiente/imagem; o contrato avalia os tokens |
| Detecção de violações de acessibilidade | Checklist manual | `@axe-core/playwright` com as tags `wcag2a/2aa/21a/21aa` (já no repo) | Já integrado; reaproveitar `expectNoAxeViolations` |
| Redimensionar, recortar e converter imagens | `canvas`, ImageMagick (ausente neste ambiente) | `sharp` | Já aprovado, binários prontos, validado nesta sessão |
| Vetorizar o JPG automaticamente | `potrace` (GPL-2.0), rastreadores não aprovados | SVG desenhado à mão | Licença e o texto cobre os dragões |
| Arquivo `.ico` | Pacote só para isso | Escrever o contêiner ICO (ICONDIR + PNG embutido) com teste | Formato trivial; evita dependência |

**Key insight:** nesta fase quase tudo que parece exigir uma biblioteca (tema, ícones, tipografia, `.ico`) é resolvido por 15 a 30 linhas testáveis ou por recurso nativo do Next; as exceções reais (variantes e merge de classes do shadcn) são exatamente o que o `CLAUDE.md` já aceita como kit.

## Runtime State Inventory

Fase de construção de identidade visual com **uma** mudança de rota (home para `/status`). Não é renomeação, mas há estado fora dos arquivos de código que referencia a rota antiga:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Nenhum: a fase não toca o banco nem a API. `localStorage` novo (`nl-theme`) só existe no navegador de quem usar o botão | Nenhuma migração; descrever na Privacidade (D-14) |
| Live service config | Monitor de uptime/keep-alive externo (Fase 1) chama a **API** (`/health`), não a home do web (`docs/runbooks/deploy.md`) | Conferir no runbook se algum ping aponta para `https://blog-no-law.vercel.app/`; se apontar, mover para `/status` |
| OS-registered state | Nenhum | Nenhuma (verificado: sem tarefas/serviços do SO neste repositório) |
| Secrets / env vars | `API_URL`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN` continuam iguais. **Nova variável opcional:** `NEXT_PUBLIC_SITE_URL` (para `metadataBase`; há fallback fixo) | Documentar em `docs/runbooks/deploy.md`; sem segredo |
| Build artifacts | `.next` e cache do Turborepo antigos continuam válidos; `turbo.json` já inclui `.next/**` nos `outputs` | Nenhuma |

**Referências à rota `/` do status que precisam mudar para `/status` (lidas nesta sessão):**
- `apps/web/e2e/home.spec.ts` (`page.goto('/')`, `toHaveURL('/?detail=full')`, `DEGRADED_URL = 'http://127.0.0.1:3202/'`);
- `apps/web/test/home.int-spec.ts` (`import Home from '../app/page'`, `href="/?detail=full"`);
- `docs/bdd/home.feature.md` (cenários e `/?detail=full`);
- `scripts/smoke-local.sh` (`fetch_home "/?detail=full"`, `data-testid="api-commit"`, linhas 6, 85 a 130);
- `docs/runbooks/deploy.md` (linhas 15, 110, 151 a 155: "a home na Vercel mostra `api-commit`", `curl .../`);
- `apps/web/app/page.tsx` (os links "Ver detalhes"/"Ocultar detalhes" usam `/?detail=full` e `/`; viram `/status?detail=full` e `/status`).
O `webServer.url` do Playwright (`http://127.0.0.1:3200/` e `:3202/`) só espera a rota responder 200: a nova home estática responde sem a API, então continua válido, mas o servidor degradado deve passar a ser testado em `/status`.

## Common Pitfalls

### Pitfall 1: `shadcn init` sobrescreve `layout.tsx` e `globals.css` e trava sem `-p`
**What goes wrong:** o `init` trava num prompt, ou (com o preset) troca as fontes por Geist, reescreve o layout e deixa tokens neutros (cinza), `dark` por classe e `shadcn` em `dependencies`.
**Why it happens:** o comando foi desenhado para projeto novo.
**How to avoid:** rodar `init -b radix -p nova -y --no-monorepo --no-rtl --no-pointer` em commit limpo, com `paths` do `tsconfig` já criado e `next.config.ts` presente; revisar o diff; depois aplicar os ajustes da seção "O que o `shadcn init` realmente faz".
**Warning signs:** `Geist` no `layout.tsx`; `@custom-variant dark (&:is(.dark *))` em `globals.css`; `lucide-react` e `cn` no `package.json`.

### Pitfall 2: `global-error.tsx` não herda estilos nem tema
**What goes wrong:** a tela de erro global aparece sem CSS e no tema do SO.
**Why it happens:** "`global-error` e a página 500 embutida renderizam o próprio documento e **não incluem** seus estilos globais" (CITED: `error.md`, linhas 163 a 165).
**How to avoid:** `import './globals.css'` em `global-error.tsx`, `data-theme="dark"` no `<html>`, a fonte do corpo por classe local e o mesmo script de tema; usar `<title>` do React (não há `metadata` em client component).
**Warning signs:** E2E de erro (forçar exceção) com fundo branco.

### Pitfall 3: O gate de HTML bruto reprova até comentários
**What goes wrong:** `pnpm run check:raw-html` falha porque uma linha em `apps/web` contém a string que o gate procura (inclusive em comentário ou em teste que a cita).
**How to avoid:** nunca escrever a prop nem o nome dela em `apps/web`; referir-se a "a prop de HTML bruto". O script de tema usa texto filho. Ornamentos e SVG entram como componentes JSX (`DragonMark`), nunca como string de HTML.
**Warning signs:** saída `apps/web/...:linha` do gate; `STALE_ALLOWLIST` se alguém tentar contornar pela allowlist (deve ficar vazia nesta fase).

### Pitfall 4: axe devolve `incomplete`, não violação, sobre gradientes e imagens
**What goes wrong:** o E2E passa com texto ilegível sobre a textura/pétalas, porque o axe não consegue determinar o fundo (CITED: Deque, regra `color-contrast`; "will not report on text elements that have a background-image").
**How to avoid:** (a) texto sempre sobre superfície de cor sólida (`bg-card`, `bg-background`), com a textura/ornamento em camada decorativa separada (`::before` ou `<span aria-hidden>`); (b) o teste de contrato de contraste dos tokens (Vitest) é a prova real; (c) o E2E pode também falhar se `results.incomplete` contiver `color-contrast` em texto relevante, para não mascarar.
**Warning signs:** capa com texto sobre o banner diretamente.

### Pitfall 5: Transição de cor durante o axe gera falso positivo
**What goes wrong:** ao clicar no botão de tema e rodar o axe logo em seguida, a transição de cores (D-20) deixa valores intermediários que reprovam.
**How to avoid:** `reducedMotion: 'reduce'` no `use` do Playwright (as transições e pétalas desligam por `prefers-reduced-motion`), e `await expect(html).toHaveAttribute('data-theme', 'light')` antes do axe. Preferir definir o tema por `addInitScript` (localStorage) no E2E de contraste em vez de clicar.

### Pitfall 6: `next/font/google` e `next/image` quebram nos testes do Vitest
**What goes wrong:** importar o módulo de fontes em um componente testado lança erro de loader fora do build; `import` estático de imagem no Vitest vira string e o `next/image` exige largura e altura.
**How to avoid:** isolar as fontes em `lib/fonts.ts` e mockar (`vi.mock('@/lib/fonts', ...)`) nos testes de página/layout; passar `src` como string de `public/` com `width`/`height` explícitos nos componentes de imagem. Em Next 16, `priority` está obsoleto (CITED: `image.md` linha 294): usar `preload`/`loading="eager"`/`fetchPriority="high"` no banner da capa. `images.qualities` é obrigatório a partir do Next 16 (CITED: `image.md` linha 713): manter `[75]` ou declarar a lista usada.

### Pitfall 7: Rolagem horizontal escondida por ornamento
**What goes wrong:** pétalas, nuvens com `translate` negativo e `100vw` (inclui a barra de rolagem) criam rolagem horizontal no celular, o que o critério 3 proíbe.
**How to avoid:** `overflow-x: clip` nos contêineres de ornamento, evitar `w-screen`, e o teste E2E `document.documentElement.scrollWidth <= window.innerWidth` em 320, 375 e 412 px em todas as rotas e nos dois temas.

### Pitfall 8: A home deixa de ser a página de status (e scripts de operação a usam)
**What goes wrong:** o `smoke-local.sh`, o runbook e os testes procuram `api-commit` na `/`, que passa a ser a capa estática; o smoke e o E2E falham.
**How to avoid:** a lista de referências está em "Runtime State Inventory". Mudar todas na mesma tarefa que cria `/status`, com RED antes (o teste `/status` falha primeiro).

### Pitfall 9: Persistência vista como "cookie" na Privacidade
**What goes wrong:** a política diz "cookie" mas o código usa `localStorage` (ou o inverso).
**How to avoid:** a recomendação R1 é `localStorage`; a página de Privacidade (D-14) deve dizer "uma preferência de tema guardada no seu navegador", sem a palavra cookie, e um teste de conteúdo garante que não cita "LGPD".

### Pitfall 10: Tailwind v4 não usa `tailwind.config.js` e o `@source` é automático
**What goes wrong:** copiar tutoriais da v3 (`content: [...]`, `darkMode: 'class'`).
**How to avoid:** configuração é CSS (`@theme`, `@custom-variant`, `@utility`). A detecção de classes é automática e ignora o que está no `.gitignore`.

## Code Examples

### Teste do script de tema sem navegador (Vitest, `node:vm`, sem dependência nova)
```ts
// apps/web/lib/theme.test.ts  (modelo para o RED)
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { THEME_INIT_SCRIPT, resolveTheme } from './theme';

function runInit(storage: () => string | null): string {
  const attrs: Record<string, string> = {};
  vm.runInNewContext(THEME_INIT_SCRIPT, {
    localStorage: { getItem: storage },
    document: { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } },
  });
  return attrs['data-theme'] ?? '';
}

describe('script anti-flash', () => {
  it('usa dark quando não há valor salvo', () => expect(runInit(() => null)).toBe('dark'));
  it('aplica light quando salvo', () => expect(runInit(() => 'light')).toBe('light'));
  it('ignora valor inválido', () => expect(runInit(() => '"><x>')).toBe('dark'));
  it('mantém dark se o storage lançar', () =>
    expect(runInit(() => { throw new Error('bloqueado'); })).toBe('dark'));
  it('resolveTheme só aceita light', () => expect(resolveTheme('dark')).toBe('dark'));
});
```

### Contrato de contraste lendo `globals.css` (Vitest)
```ts
// apps/web/lib/contrast.test.ts  (modelo)
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const lum = (hex: string) => { /* luminância relativa WCAG: canais sRGB -> linear -> 0.2126R+0.7152G+0.0722B */ return 0; };
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
function tokens(selector: ':root' | "[data-theme='dark']"): Record<string, string> { /* extrai --nome: #hex do bloco */ return {}; }

const PAIRS: Array<[fg: string, bg: string, min: number]> = [
  ['--foreground', '--background', 4.5], ['--card-foreground', '--card', 4.5],
  ['--muted-foreground', '--card', 4.5], ['--primary-foreground', '--primary', 4.5],
  ['--accent', '--background', 4.5], ['--ring', '--background', 3], ['--border', '--card', 3],
];
describe.each([':root', "[data-theme='dark']"] as const)('contraste WCAG AA em %s', (sel) => {
  it.each(PAIRS)('%s sobre %s >= %s', (fg, bg, min) => {
    const t = tokens(sel);
    expect(ratio(t[fg]!, t[bg]!)).toBeGreaterThanOrEqual(min);
  });
});
```
(Os tokens precisam ser hex para a leitura ser trivial; é uma razão a mais para trocar o OKLCH do shadcn pelos hex da paleta do clã.)

### Playwright: dois temas, celular, sem rolagem horizontal, sem flash e sem violação de CSP
```ts
// apps/web/playwright.config.ts  (trecho; o resto do arquivo continua como está)
// projects atual: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
use: { baseURL: `http://${HOST}:${WEB_PORT}`, trace: 'retain-on-failure', reducedMotion: 'reduce' },
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'mobile', use: { ...devices['Pixel 7'] } },   // 412x839, engine Chromium: sem instalar WebKit
],
```
```ts
// apps/web/e2e/identidade.spec.ts  (modelo)
const ROTAS = ['/', '/sobre', '/regras', '/privacidade', '/kit', '/status'];
for (const tema of ['dark', 'light'] as const) {
  for (const rota of ROTAS) {
    test(`@e2e ${rota} sem violações de acessibilidade no tema ${tema}`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('nl-theme', t), tema);
      await page.goto(rota);
      await expect(page.locator('html')).toHaveAttribute('data-theme', tema);
      await expectNoAxeViolations(page);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
}
test('@e2e tema correto antes da hidratação (sem flash)', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('nl-theme', 'light'));
  await page.route('**/_next/static/**/*.js', (route) => route.abort());   // nunca hidrata
  await page.goto('/sobre');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
test('@e2e sem violação de CSP no console', async ({ page }) => {
  const violacoes: string[] = [];
  page.on('console', (m) => { if (/Content Security Policy/i.test(m.text())) violacoes.push(m.text()); });
  for (const rota of ROTAS) await page.goto(rota);
  expect(violacoes).toEqual([]);
});
```

### Valores do repositório lidos nesta sessão (citação verbatim das âncoras usadas acima)
- `apps/web/eslint.config.mjs:19` `'react/no-danger': 'error',`
- `apps/web/vitest.config.ts:5-18` `resolve: { tsconfigPaths: true },` e os projetos `{ name: 'unit', include: ['lib/**/*.test.ts'] }` e `{ name: 'int', include: ['test/**/*.int-spec.ts'], testTimeout: 15000 }`
- `apps/web/playwright.config.ts:30` `projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],`; `:39 const DEGRADED_URL = 'http://127.0.0.1:3202/';` (em `home.spec.ts:39`)
- `apps/web/package.json:12-14` `"test": "vitest run --project unit",` `"test:integration": "vitest run --project int",` `"test:e2e": "playwright test"`
- `apps/web/next.config.ts:13-16` os quatro cabeçalhos (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` `DENY`, `Permissions-Policy`)
- `apps/web/tsconfig.json`: não há `paths` nem `baseUrl` hoje (leitura integral)
- `apps/web/app/global-error.tsx:15-23` define seu próprio `<html lang="pt-BR">` e `<body>`
- Raiz: `package.json` `"verify": "pnpm run format:check && pnpm run check:raw-html && pnpm run test:scripts && turbo run lint typecheck test test:http test:integration"`; `.prettierrc.json` `{"singleQuote": true, "trailingComma": "all", "printWidth": 100}`

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` + `darkMode: 'class'` | CSS-first (`@theme`, `@custom-variant`), `@tailwindcss/postcss` | Tailwind 4 | Dark mode por `data-theme` declarado no CSS |
| Tokens shadcn em HSL | Tokens em OKLCH e `@theme inline` | shadcn + Tailwind 4 | Aqui usamos hex para o contrato de contraste ser trivial |
| `shadcn init` interativo, estilos "default/new-york" | Presets (`nova`, `vega`, `maia`...) com `-b radix\|base\|aria` | shadcn CLI 4.x | Comando precisa de `-p`; `cn` virou pacote (`shadcn-ui/cn`) |
| `next-themes` para anti-flash | Script inline do `<head>` (documentado pelo Next) | guia atual do Next 16 | Dispensa dependência |
| `middleware.ts` | `proxy.ts` | Next 16 | Nonce de CSP viria por `proxy.ts` (Fase 4) |
| `<Image priority>` | `preload` / `fetchPriority="high"` | Next 16 | LCP da capa |
| `next lint` | ESLint CLI (flat config) | Next 16 | Já adotado na Fase 1 |

**Deprecated/outdated:** `priority` em `next/image`; `next lint`; `middleware.ts`; configuração de tema do Tailwind em JS.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `Rampart_One` é a candidata de Google Fonts mais próxima do estilo do banner (a fonte exata do banner não foi identificada) | Pattern 3 | A direção "japonesa" parecer diferente do banner; o mockup compara as 4 a 5 candidatas |
| A2 | O scroll lock do Radix (`react-remove-scroll`) injeta `<style>`, o que também exige `style-src 'unsafe-inline'` | Pattern 6 | Só importa se o `Sheet` entrar; sem ele o argumento principal (atributos `style` do SSR) já basta |
| A3 | O toolbar `vercel.live` dos previews gera violações de CSP que não ocorrem em produção | Pattern 6 | Ruído nos previews; os E2E rodam em `next start`, sem o toolbar |
| A4 | O padrão `useSyncExternalStore` + `useLayoutEffect` do `ThemeToggle` hidrata sem aviso e sem piscar o ícone | Pattern 1 | Ajustar para ler o tema em um efeito; o RED do teste E2E de persistência pega |
| A5 | `<script>` com texto filho no `<head>` do layout raiz não emite aviso de hidratação em dev | Pattern 1 | Se avisar, usar `useServerInsertedHTML` (também documentado pelo Next) |
| A6 | A cota gratuita do Vercel cobre a otimização de imagens da capa (poucas imagens, 1 banner) | Pitfall 6 | Imagem da capa sem otimização; usar `unoptimized` ou WebP pré-gerado em `public/` |
| A7 | Vercel Authentication protege previews e links de deploy no plano gratuito, mas o comportamento atual em Hobby é contraditório entre as fontes | R12 | Mockups ficarem públicos por link; aceitável (marca é pública, sem segredos), mas decidir antes |
| A8 | `clsx` e `tailwind-merge` são o par que o shadcn clássico usa em `cn()` | Standard Stack | Baixo: o `cn` pode ser o pacote `cn@0.5.2` que o CLI já emite |
| A9 | Discord e WhatsApp usam o recorte 1,91:1 e cacheiam o preview já raspado | Pattern 4 | Preview antigo em cache; conferência manual após o deploy |
| A10 | A qualidade do recorte circular do emblema com raio ~300 será suficiente para o PNG transparente do header de arte (o ícone usa SVG de qualquer forma) | Pattern 5 | Refinar a máscara; o SVG redesenhado cobre o uso em tamanho pequeno |

## Open Questions

1. **Hospedagem dos mockups (D-16)**
   - O que sabemos: devem ser páginas publicadas, privadas, com link, abertas no celular e no PC, sem código de produção.
   - O que falta: se o plano gratuito do Vercel protege os links de preview (as fontes se contradizem, A7) e se o autor aceita um link público não indexado.
   - Recomendação: HTML estático por `/gsd-sketch` com `noindex`, implantado como projeto Vercel separado (ou preview da branch da fase); tratar como público por link e não pôr nada sensível. Registrar a direção escolhida em `.planning/phases/02-identidade-visual-no-law/` antes de qualquer tela real.

2. **Aprovação dos pacotes (R6)**
   - Falta o aval do autor para `class-variance-authority`, `clsx`, `tailwind-merge@3.7.0` (ou `cn`), e, se `Sheet`, `radix-ui` + `tw-animate-css`.
   - Recomendação: um único `checkpoint:human-verify` no início da fase, listando versão e veredito de cada um, com a alternativa sem dependência (menu por disclosure e botão sem `asChild`).

3. **Qualidade do ícone dos dragões em SVG (R9)**
   - Falta ver o desenho. É a maior incerteza visual.
   - Recomendação: no mockup entra uma versão rascunho; o autor aprova antes de virar favicon e botão de tema. Plano B já aceito pelo autor: yin-yang bicolor simples com olhos dos dragões.

4. **Texto das Regras (D-13)**
   - Entrada do autor pendente. Checkpoint no plano; página mínima provisória enquanto isso.

5. **Aperto da CSP na Fase 4**
   - CSP v1 aceita `'unsafe-inline'`. Quando posts com conteúdo de usuário chegarem, migrar para nonce por `proxy.ts` (páginas dinâmicas) ou avaliar `experimental.sri`. Registrar como item de dívida visível no `STATE.md`.

6. **Fonte do título**
   - Depende da direção escolhida; o mecanismo está pronto (1 linha em `lib/fonts.ts`).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | tudo | ✓ | 26.13.1 | — |
| pnpm | instalação, `shadcn` | ✓ | 12.21.0 | — |
| Rede para `fonts.googleapis.com` no build | `next/font/google` | ✓ (testado aqui e nos runners do GitHub) | — | `next/font/local` com os woff2 baixados e versionados (se o build ficar offline) |
| `sharp` | script de ativos | ✓ (binário linux-x64 instalado no `.pnpm`, mas **não declarado** como dependência direta) | 0.35.5 | declarar como devDependency do web |
| ImageMagick, Inkscape, potrace, rsvg-convert, cwebp | vetorizar/converter | ✗ | — | `sharp` para raster; SVG desenhado à mão para vetor |
| Python com Pillow/OpenCV | — | ✗ | — | `sharp` |
| Chromium do Playwright no WSL local | E2E | ✗ (sai com 127 por falta de bibliotecas do sistema) | cache `chromium-1255` existe | E2E só na CI (D-09 da Fase 1); render dos mockups por inspeção humana |
| Docker / Postgres de teste | E2E (a API sobe com banco) | só na CI | — | já coberto pelo `ci.yml` |

**Missing dependencies with no fallback:** nenhuma.
**Missing dependencies with fallback:** vetorização automática (usar SVG à mão), Chromium local (E2E na CI).

## Validation Architecture

> `workflow.nyquist_validation` está `true` em `.planning/config.json` (lido nesta sessão). `tdd_mode` também está ligado: o RED de cada comportamento vem antes do código.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.12 (projetos `unit` e `int` em `apps/web`), Playwright 1.65.1 + `@axe-core/playwright` 4.14.0 (E2E, só CI), `node:test` para scripts da raiz |
| Config file | `apps/web/vitest.config.ts` (existe), `apps/web/playwright.config.ts` (existe; ganha o projeto `mobile` e `reducedMotion`) |
| Quick run command | `pnpm --filter @blog/web test` (projeto `unit`) e `pnpm --filter @blog/web test:integration` (projeto `int`) |
| Full suite command | Local: `docker compose -f compose.test.yaml up -d --wait && pnpm run verify`. CI: o check `ci-ok` (inclui `test-web`, `e2e`, `lint` com `format:check` e `check:raw-html`) |

Ajuste do Vitest (necessário para os novos testes): o projeto `unit` hoje só inclui `lib/**/*.test.ts` e o `int` só `test/**/*.int-spec.ts`; passar a `['lib/**/*.test.{ts,tsx}', 'components/**/*.test.{ts,tsx}', 'app/**/*.test.{ts,tsx}']` e `['test/**/*.int-spec.{ts,tsx}']`. Componentes com JSX são transformados pelo Vite com `jsx: react-jsx`; ambiente `node` com `renderToStaticMarkup`.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VIS-01 | Todo par texto/fundo dos tokens passa AA em `:root` e `[data-theme='dark']` | unit (contrato) | `pnpm --filter @blog/web test -- lib/contrast.test.ts` | ❌ Wave 0 |
| VIS-01 | Script de tema: padrão `dark`, `light` salvo, valor inválido, storage bloqueado | unit | `pnpm --filter @blog/web test -- lib/theme.test.ts` | ❌ Wave 0 |
| VIS-01 | axe WCAG 2.1 A/AA nos dois temas em todas as rotas | e2e (CI) | `pnpm --filter @blog/web test:e2e -- identidade.spec.ts` | ❌ Wave 0 |
| VIS-02 | Header tem o ícone (aria-hidden) e "No Law" em texto; rodapé diz "desde 2017" e não tem link do Discord | unit (`renderToStaticMarkup`) | `pnpm --filter @blog/web test -- components/site-header.test.tsx components/site-footer.test.tsx` | ❌ Wave 0 |
| VIS-02 | Metadados: title, description, Open Graph, `metadataBase`, ícones | unit | `pnpm --filter @blog/web test -- app/layout.test.tsx` | ❌ Wave 0 |
| VIS-02 | Ativos existem com as dimensões certas (OG 1200x630, ícones 32 e 180, ICO válido), lidos pelo cabeçalho do PNG/JPEG sem `sharp` | unit | `pnpm --filter @blog/web test -- lib/brand-assets.test.ts` | ❌ Wave 0 |
| VIS-02 | Em produção local: `og:image` absoluto responde 200 com `image/*`; `<link rel=icon>` resolve | e2e (CI) | `pnpm --filter @blog/web test:e2e -- identidade.spec.ts -g "preview"` | ❌ Wave 0 |
| VIS-03 | `/kit` existe, é `noindex` (meta e `X-Robots-Tag`) e lista botão, link, card, menu e toggle | unit + e2e | `pnpm --filter @blog/web test -- app/kit/page.test.tsx` | ❌ Wave 0 |
| VIS-03 | Variantes do `Button` e do `Card` renderizam com as classes de token (sem cor literal) | unit | `pnpm --filter @blog/web test -- components/ui/button.test.tsx` | ❌ Wave 0 |
| VIS-04 | Direção escolhida registrada antes das telas (gate de processo) | manual-only | Checkpoint do plano: arquivo `02-DIRECAO.md` aprovado e commitado antes da primeira tarefa de tela | ❌ Wave 0 |
| UX-01 | Sem rolagem horizontal em 320, 375 e 412 px em todas as rotas e nos dois temas | e2e (CI) | `pnpm --filter @blog/web test:e2e -- --project=mobile` | ❌ Wave 0 |
| UX-01 | Menu sanduíche abre, fecha com Esc e some no desktop | e2e (CI) | `pnpm --filter @blog/web test:e2e -- identidade.spec.ts -g "menu"` | ❌ Wave 0 |
| UX-02 | Clique alterna o tema, persiste após recarregar; primeira visita é escura; sem flash sem hidratação | e2e (CI) | `pnpm --filter @blog/web test:e2e -- identidade.spec.ts -g "tema"` | ❌ Wave 0 |
| UX-02 | Botão de tema tem rótulo "Mudar para tema claro/escuro" | unit | `pnpm --filter @blog/web test -- components/theme-toggle.test.tsx` | ❌ Wave 0 |
| UX-03 | `/sobre`, `/regras`, `/privacidade` respondem 200, têm `h1`, e a Privacidade **não** cita "LGPD" | unit + e2e | `pnpm --filter @blog/web test -- app/privacidade/page.test.tsx` | ❌ Wave 0 |
| (D-07) | `/status` mantém todos os cenários antigos (commit, banco, detalhes, degradado com 200) | integration + e2e | `pnpm --filter @blog/web test:integration` | existente, mover de `test/home.int-spec.ts` |
| (CSP) | Cabeçalho CSP contém `frame-ancestors 'none'`, `object-src 'none'`, sem `*` em `script-src` | unit | `pnpm --filter @blog/web test -- next.config.test.ts` | ❌ Wave 0 |
| (CSP) | Nenhuma violação de CSP no console em nenhuma rota/tema/viewport | e2e (CI) | `pnpm --filter @blog/web test:e2e -- identidade.spec.ts -g "CSP"` | ❌ Wave 0 |
| (D-20) | Pétalas existem só na capa e somem com `prefers-reduced-motion: reduce` | e2e (CI) | `pnpm --filter @blog/web test:e2e -- identidade.spec.ts -g "pétalas"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm --filter @blog/web test` (unit, segundos) e, se tocou páginas, `pnpm --filter @blog/web test:integration`.
- **Per wave merge:** `docker compose -f compose.test.yaml up -d --wait && pnpm run verify` (inclui `format:check`, `check:raw-html`, `lint`, `typecheck`, todos os projetos Vitest).
- **Phase gate:** `ci-ok` verde no PR da fase (E2E com axe nos dois temas e no celular) antes de `/gsd-verify-work`.
- **Manual-only (sem automação possível):** (1) aprovação da direção visual nos mockups; (2) revisão do texto de Sobre/Regras/Privacidade; (3) preview real do link no Discord e no WhatsApp após o deploy; (4) conferência visual em aparelho de celular real; (5) legibilidade sobre texturas (o axe não avalia gradiente/imagem).

### Wave 0 Gaps
- [ ] `docs/bdd/identidade-visual.feature.md` e `docs/bdd/paginas-institucionais.feature.md` (cenários Dado/Quando/Então com as tags `@integration`/`@e2e`), e renomear `docs/bdd/home.feature.md` para `/status` (D-07).
- [ ] `apps/web/lib/theme.test.ts`, `lib/contrast.test.ts`, `lib/brand-assets.test.ts`, `components/*.test.tsx`, `app/**/page.test.tsx`, `next.config.test.ts`.
- [ ] `apps/web/e2e/identidade.spec.ts` e `e2e/status.spec.ts` (era `home.spec.ts`); `playwright.config.ts` com o projeto `mobile` e `reducedMotion: 'reduce'`.
- [ ] Ajuste de `include` no `vitest.config.ts` (arquivos `.tsx`).
- [ ] `apps/web/tsconfig.json` com `paths` (`@/*`).
- [ ] Framework: nenhum a instalar (Vitest e Playwright já existem). Só se o autor pedir interação no Vitest: `happy-dom` + `@testing-library/react` + `@testing-library/dom` (ver R8).

## Security Domain

> `security_enforcement` está habilitado e `security_asvs_level` é 1 em `.planning/config.json`. Fase sem login, sem entrada de usuário e sem rotas novas na API; a superfície é de XSS, cabeçalhos, cadeia de suprimentos e privacidade.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | não | Fase 3 |
| V3 Session Management | não | Fase 3 (o tema em `localStorage` não é sessão) |
| V4 Access Control | não | `/kit` e `/status` são públicos e só ficam fora do índice (`noindex`), não protegidos |
| V5 Input Validation | sim (mínimo) | O único valor lido do cliente é `localStorage["nl-theme"]`, **restrito a `light`/`dark`** (nunca gravado cru no DOM) |
| V6 Cryptography | não | — |
| V10/V14 Configuração e cabeçalhos | sim | CSP v1, `frame-ancestors 'none'`, nosniff, Referrer-Policy, Permissions-Policy (já existentes) |
| V13/Supply chain | sim | Seam de legitimidade; pacotes fixados em versão exata; `sharp` como dev-only; sem `postinstall` novo |

### Known Threat Patterns for Next.js + Tailwind + shadcn estático

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS por HTML bruto | Tampering | `react/no-danger` + `check-no-raw-html` (já ativos); script de tema constante e sem interpolação de dados |
| Injeção pelo valor do `localStorage` no `data-theme` | Tampering | Allowlist `light`/`dark` no script e em `resolveTheme` (teste com `"><x>`) |
| Clickjacking | Spoofing | `frame-ancestors 'none'` (CSP) além do `X-Frame-Options: DENY` existente |
| Plugins e `<base>` maliciosos | Tampering | `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` |
| Carga de recurso de terceiro | Info disclosure | `font-src 'self'` (fontes self-hosted), `img-src` restrito, `connect-src` só a API própria do Sentry |
| Vazamento de informação técnica | Info disclosure | `/status` expõe versão/commit/latência desde a Fase 1 (aceito); passa a `noindex` e sem link no menu |
| Cadeia de suprimentos (pacote novo) | Tampering | Checkpoint de aprovação, versão exata, `pnpm install --frozen-lockfile`, nenhum `postinstall` novo |
| Links externos sem isolamento | Tampering | `rel="noopener noreferrer"` em qualquer link externo futuro (nenhum nesta fase: D-09 não tem Discord) |
| Privacidade | Info disclosure | Fontes self-hosted (nenhuma requisição ao Google); Sentry com `dataCollection` desligado (já testado em `lib/sentry-init.test.ts`) |

## Sources

### Primary (HIGH confidence)
- `apps/web/node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md` (temas, `suppressHydrationWarning`, cookie vs `localStorage`, reaplicar em dev), `content-security-policy.md` (nonce vs sem nonce vs SRI), `.../03-api-reference/02-components/font.md`, `image.md` (`priority` obsoleto, `qualities`), `.../03-file-conventions/error.md` (`global-error` sem estilos), `.../01-metadata/app-icons.md` e `opengraph-image.md`, `generate-metadata.md` (`metadataBase`, `robots`): documentação do Next 16.4.6 empacotada no repositório, lida nesta sessão.
- Execuções nesta sessão: `next build` de um app de rascunho (Next 16.4.6, Tailwind 4.3.5, `next/font/google` com `Inter` e `Rampart_One`, script inline de texto filho, CSP estática): saída `○ (Static)` e HTML conferido; `renderToStaticMarkup` do `<script>`; `shadcn@4.23.0 init -b radix -p nova` (dependências, arquivos e CSS reais); `sharp` 0.35.5 (recorte circular e OG); `fontkit` sobre os woff2 do Google Fonts (cobertura de glifos); cálculo de contraste WCAG; `gsd_run query package-legitimacy check` e `npm view`.
- `https://tailwindcss.com/docs/dark-mode` (variante por `data-theme`) e `https://tailwindcss.com/docs/installation/framework-guides/nextjs` (instalação por PostCSS).
- `https://ui.shadcn.com/docs/theming`, `https://ui.shadcn.com/docs/dark-mode/next`, `https://ui.shadcn.com/docs/installation/next` e itens do registro `ui.shadcn.com/r/styles/new-york-v4/{button,sheet,toggle,card,utils}.json`.

### Secondary (MEDIUM confidence)
- Deque University, regra `color-contrast` do axe (texto sobre `background-image` e gradiente vira `incomplete`): `https://dequeuniversity.com/rules/axe/4.9/color-contrast` e issue `https://github.com/dequelabs/axe-core/issues/708`.
- Vercel, Deployment Protection (comportamento em Hobby contraditório entre fontes): `https://vercel.com/docs/deployment-protection`.
- `.planning/BRAND-BRIEF.md`, `01-UI-REVIEW.md`, `.claude/CLAUDE.md`, `.planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-RESEARCH.md` (formato da casa).

### Tertiary (LOW confidence)
- Semelhança visual das fontes candidatas com o banner (A1) e o comportamento de bibliotecas Radix sob CSP (A2): inferência, a confirmar nos mockups e no E2E.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versões e comportamento do `shadcn init` executados; só a escolha dos pacotes novos depende de aprovação do autor.
- Architecture (tema, estático, CSP): MEDIUM-HIGH — build e HTML reais verificados no rascunho; hidratação do botão e aviso em dev ainda a provar no RED/E2E.
- Ativos de marca: MEDIUM — pipeline `sharp` provado; qualidade do SVG dos dragões é incerta.
- Pitfalls: HIGH — a maioria vem de documentação do Next 16 lida ou de execução.

**Research date:** 2026-11-27
**Valid until:** 2026-12-27 (Next, Tailwind e shadcn mudam rápido; reconfirmar versões se o plano atrasar além disso)
