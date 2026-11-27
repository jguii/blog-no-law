---
phase: "2"
slug: "identidade-visual-no-law"
status: approved
reviewed_at: "2026-11-27"
shadcn_initialized: false
preset: nova
created: "2026-11-27"
design_direction: "Síntese (sketch 001) + dragões em SVG (sketch 002)"
---

# Phase 2 — UI Design Contract

> Contrato visual e de interação da fase "Identidade visual No Law". Gerado pelo gsd-ui-researcher, verificado pelo gsd-ui-checker.
> Sem perguntas ao autor: tudo vem de `02-CONTEXT.md` (D-01 a D-22), `02-RESEARCH.md`, do skill `sketch-findings-blog-no-law` e de `.planning/sketches/WRAP-UP-SUMMARY.md`. O que ficou em aberto foi decidido aqui e marcado em **Premissas** (seção final).

---

## Registro da direção visual (VIS-04, critério 1)

A direção foi comparada e escolhida pelo autor **antes de qualquer tela real**, em 2026-11-27, entre as 3 direções do D-17 (Pergaminho, Tinta, Arquivo) e a síntese delas.

| Item | Valor |
|------|-------|
| Direção vencedora | **Síntese (B + A + C)**: base Tinta, com o pincel e o pergaminho da Pergaminho e o selo da Arquivo |
| Ícone vencedor | **B · Dragões em SVG** (yin-yang com chifres e olhos, aro dourado, sem texto) |
| Evidência commitada | `.planning/sketches/WRAP-UP-SUMMARY.md` (satisfaz VIS-04). Fontes locais (fora do Git): `.claude/skills/sketch-findings-blog-no-law/` |
| Travado (não reabrir) | Paleta, Yuji Boku + Atkinson Hyperlegible Next, faixas de tinta, traço de pincel, raio 6px, menu em pílulas, botão primário em gradiente, ornamentos e movimento, layout da capa, ícone dos dragões |
| Alternativas de título (só se o autor pedir troca) | Rampart One, Reggae One: 1 linha em `lib/fonts.ts` |

Este arquivo **traduz** a direção para valores finais (múltiplos de 4, 4 tamanhos de fonte, 2 pesos, razões de contraste calculadas). Onde um valor do sketch foi ajustado para caber nessas regras, o ajuste está na tabela **Premissas**.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn (CLI 4.23.0), inicializado **pelo plano** em `apps/web` (hoje não há `components.json`; ver nota abaixo) |
| Preset | `nova` (`npx shadcn@4.23.0 init -b radix -p nova -y --no-monorepo --no-rtl --no-pointer`), **depois reescrito** com os tokens do clã em hex (a paleta neutra do preset é descartada) |
| Component library | radix (só se o autor aprovar `radix-ui`; ver "Matriz de pacotes"). O contrato visual é idêntico com ou sem ele |
| Icon library | nenhuma (sem `lucide-react`). Ícones como SVG em `components/icons.tsx` (☰, ✕) e a arte dos dragões em `components/dragon-mark.tsx` |
| Font | Títulos: **Yuji Boku** (`next/font/google`, 400, `latin`). Corpo: **Atkinson Hyperlegible Next** (variável 200 a 800, `latin`). Único módulo que chama o loader: `lib/fonts.ts` |
| Estilo | Tailwind 4.3.5 CSS-first. Tema por `data-theme` (`@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *))`). Tokens em hex (não OKLCH) para o teste de contraste ler o arquivo |

Nota sobre o `shadcn init`: ele reescreve `app/layout.tsx` e `app/globals.css`, traz Geist e põe `shadcn` em `dependencies`. O plano roda em commit limpo, revisa o diff e reaplica: fontes acima, `dark` por `data-theme`, tokens abaixo, `shadcn` em `devDependencies`, Prettier (`singleQuote`, `printWidth: 100`). Antes, criar `paths: {"@/*": ["./*"]}` no `tsconfig.json` do web.

---

## Component Inventory

> Lista do que o design system fornece, enumerada por comando (não de memória).

Enumerated by `curl -s https://ui.shadcn.com/r/styles/new-york-v4/registry.json | python3 -I -c "import json,sys; print(len([i for i in json.load(sys.stdin)['items'] if i.get('type')=='registry:ui']))"` — 61 componentes `registry:ui` — shadcn@4.23.0 (CLI resolvido por `npx shadcn@4.23.0 --version`) — 2026-11-27.

Mismatch: o registro lista 61 componentes disponíveis; o sistema de arquivos tem 0 instalados (`apps/web/components/ui` e `components.json` não existem, o `shadcn init` ainda não rodou). O preset `radix-nova` do `init` pode divergir do estilo `new-york-v4` lido; conferir com `npx shadcn info` depois do `init` e atualizar esta linha.

A tabela abaixo é **não exaustiva**: lista os componentes conhecidos para esta fase. Checar um componente fora dela é o caminho esperado.

| Component | Import path | Notes |
|-----------|-------------|-------|
| `button` (shadcn) | `@/components/ui/button` | Variantes `primary` (gradiente) e `secondary` (contorno); tamanhos `default` 52px e `sm` 44px. Para link com cara de botão: `buttonVariants()` aplicado em `next/link` (sem `asChild`) |
| `card` (shadcn) | `@/components/ui/card` | Superfície `bg-card` com raio 6px. Base do card de leitura, do `/status` e do `/kit` |
| `SiteHeader`, `SiteFooter` (local) | `@/components/site-header`, `@/components/site-footer` | Faixas de tinta. Server components; só o menu e o tema são client |
| `MobileMenu` (local, client) | `@/components/mobile-menu` | Disclosure (ver Interação). Não usa `Sheet` |
| `ThemeToggle` (local, client) | `@/components/theme-toggle` | Botão redondo de 44px com os dragões (D-21) |
| `DragonMark` (local) | `@/components/dragon-mark` | Props `size` e `detail` (`small` ≤ 44px, `large` ≥ 96px). `aria-hidden` |
| `BrushStroke`, `Cloud`, `Hanko`, `Petals` (local) | `@/components/ornaments/*` | Ornamentos decorativos, todos `aria-hidden`, sem `style=` inline |
| `Prose` (local) | `@/components/prose` | Tipografia das páginas de texto (sem `@tailwindcss/typography`) |
| Disponíveis, **fora desta fase** | — | `badge`, `avatar`, `dropdown-menu`, `dialog`, `sheet`, `sonner`, `input`, `textarea`, `form`, `tooltip`, `skeleton`, `empty`, `separator`: entram nas Fases 3 a 6, sempre com `shadcn view`/diff dos arquivos gerados |

### Matriz de pacotes (a decisão é do autor; checkpoint no plano)

Pacotes fora da lista aprovada do `CLAUDE.md`, por componente, e o caminho sem dependência nova. **Nenhum é tratado como aprovado por este contrato.**

| Necessidade | Com pacotes (precisa de aval) | Sem pacote novo (fallback obrigatório se negado) |
|-------------|-------------------------------|---------------------------------------------------|
| `cn()` (`lib/utils.ts`) | `clsx@2.1.1` + `tailwind-merge@3.7.0` (fixar 3.7.0), ou `cn@0.5.2` que o `init` emite | `export const cn = (...c: Array<string \| false \| null \| undefined>) => c.filter(Boolean).join(' ')`; classes de variante não podem conflitar entre si |
| `Button` (variantes) | `class-variance-authority@0.7.1` | Mapa de variantes em objeto TS + `buttonVariants()` que devolve a string de classes |
| `asChild` no `Button` | `radix-ui@1.8.1` (`Slot`) | Não usar `asChild`: `buttonVariants()` em `next/link` |
| `Card` | só `cn` | idem `cn` acima |
| Menu sanduíche | `Sheet` (`radix-ui@1.8.1` + `tw-animate-css@1.4.0`) | **Disclosure** com `aria-expanded` e `aria-controls` (baseline deste contrato; casa com o painel sob a faixa do sketch) |
| Botão de tema | nenhum | `<button>` nativo (não usa o `Toggle` do shadcn) |
| Ícones | `lucide-react` (não adotar) | SVG inline em `components/icons.tsx` |

Se o autor negar todos os pacotes: o plano **não** roda `shadcn add`; escreve `button.tsx` e `card.tsx` à mão no estilo do shadcn e cria `components.json` à mão, para as próximas fases poderem usar `shadcn add`. O resultado visual é o mesmo.

---

## Spacing Scale

Valores declarados (múltiplos de 4). Fonte: sketch 001, ajustado para a escala.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Folga entre ícone e texto, gap interno de pílula |
| sm | 8px | Gap entre pílulas do menu, entre itens de lista, padding vertical da faixa |
| md | 16px | Espaço padrão entre parágrafos, padding lateral no celular, gap dos CTAs |
| lg | 24px | Padding do card de leitura no celular, gap de blocos da capa no celular |
| xl | 32px | Padding lateral no desktop, margem acima de `h2`, gap de colunas no celular |
| 2xl | 48px | Padding do card de leitura no desktop, gap entre as colunas da capa, pausa entre seções |
| 3xl | 64px | Respiro do topo da capa no desktop |

Aplicação por superfície:

| Superfície | Desktop (≥ 768px) | Celular (< 768px) |
|------------|-------------------|-------------------|
| Container do site | `max-w` 1152px, padding lateral 32px | padding lateral 16px |
| Faixa (header e rodapé) | padding vertical 8px | padding vertical 8px |
| Capa | topo 64px, base 48px, gap das colunas 48px | topo 32px, base 24px, gap 24px |
| Card de leitura | padding 48px, largura máxima 760px | padding 24px |
| Parágrafos / `h2` | 16px entre parágrafos; 32px acima e 8px abaixo do `h2` | idem |
| Lista (`ul`) | recuo 24px, 8px entre itens | idem |

Exceções (não são escala de espaçamento):

- **44px**: alvo de toque mínimo (botão de tema, ☰, pílulas, ícone da marca, links do rodapé). **52px**: altura de botão `default` e dos itens do painel móvel. Ambos múltiplos de 4.
- **760px**: largura máxima do card de leitura. **1152px**: largura máxima do container.
- Dimensões de ornamento e borda: traço de pincel de 3px (sob `h1`), 4px de traço no header e 5px no rodapé (altura de viewBox 12), faixa de gradiente do card de 6px, bordas de 1px e 2px, selo hanko 44px com raio 4px. São traço gráfico, não espaçamento.
- Dimensões gráficas de ornamento e forma: pétalas de 11x15px (9x13px no celular), contorno de 1,5px das nuvens, anel de foco de 2px com offset de 2px e `--radius` de 6px. São desenho, não escala de espaçamento.
- Proibido valor arbitrário (`p-[13px]` etc.) fora desta tabela.

Raio: `--radius: 6px` (cards e botões), `rounded-sm` 4px (selo), `rounded-full` (pílulas do menu e botão de tema).

---

## Typography

**Exatamente 4 tamanhos e 2 pesos.** Yuji Boku só existe no peso 400: os títulos usam 400 e `font-synthesis: none` (sem negrito falso). O peso 700 é só do corpo (Atkinson).

| Role | Size (≥ 768px / < 768px) | Weight | Line Height | Fonte | Uso |
|------|--------------------------|--------|-------------|-------|-----|
| Body | 18px / 18px | 400 | 1.65 | Atkinson | Texto corrido, parágrafos, listas, `dd` do status |
| Label | 14px / 14px | 700 | 1.4 | Atkinson | Rótulo da capa (caixa alta, `letter-spacing` 3px), botões e pílulas, `dt`, legenda, selo, texto do rodapé |
| Heading | 26px / 22px | 400 | 1.2 | Yuji Boku | `h2`, nome "No Law" no header |
| Display | 52px / 36px | 400 | 1.1 | Yuji Boku | **Todo `h1`**: capa (slogan), `/sobre`, `/regras`, `/privacidade`, `/status`, `/kit`, 404 e erro global (token `text-display`) |

Não há exceção de tamanho: o `h1` da capa e o `h1` das páginas usam o **mesmo** Display (52px / 36px). O token `text-hero` não existe.

Regras:

- Corpo em `text-wrap: pretty`; títulos em `text-wrap: balance`. Nada de peso 500/600 nem de itálico fora do `<em>` semântico.
- Links dentro de texto: sublinhados (`underline-offset: 4px`), cor `--link`; a cor não é o único indicador.
- `code` (commit no `/status`) usa a pilha monoespaçada do sistema no tamanho Label, sem peso 700.
- Nome "No Law" no header: Heading (26/22), sem negrito.

---

## Color

Dois temas. **Padrão na primeira visita: escuro "tinta"** (D-15), mesmo que o SO esteja claro. A escolha da pessoa persiste em `localStorage` (`nl-theme`, `light` | `dark`).

### Divisão 60/30/10

| Role | Escuro "tinta" (padrão) | Claro "pergaminho" | Usage |
|------|-------------------------|--------------------|-------|
| Dominant (60%) | `#000000` | `#ecdcc4` | `--background`: fundo da página |
| Secondary (30%) | `#420b0d` | `#f6eddc` | `--card`: card de leitura, `/status`, `/kit`. As faixas (header/rodapé) são `#000000` nos dois temas |
| Accent (10%) | `#ac020f` (preenchimento) e `#ff6b75` (texto/foco) | `#ac020f` (preenchimento) e `#8a0210` (texto/links) | Lista abaixo |
| Destructive | `#ff6b75` (texto/borda) | `#8a0210` (texto/borda) | Nenhuma ação destrutiva nesta fase. Token reservado para as Fases 3 a 6 |

Accent reservado para (lista fechada):

1. Preenchimento do botão primário (gradiente `#ac020f` → `#5a0a0f`, texto branco).
2. Pílula ativa do menu (fundo `#ac020f`, texto branco, mais anel interno `#ff6b75` de 2px, ver Premissa P5).
3. Texto de link (`--link`) e o rótulo da capa ("Clã do SA-MP · desde 2017").
4. Anel de foco (`--ring`) de todo elemento focável.
5. Ornamentos de marca: traço de pincel, faixa de gradiente do card, selo hanko, pétalas, brilho do emblema.

Nunca: `#ac020f` como cor de texto ou de borda no tema escuro (2,77:1); gradiente por baixo de texto sem plano sólido; accent em "todo elemento interativo".

### Tokens (valores finais, hex)

| Token | Claro (`:root`) | Escuro (`[data-theme='dark']`) |
|-------|-----------------|--------------------------------|
| `--background` | `#ecdcc4` | `#000000` |
| `--foreground` | `#1a1210` | `#d3aa82` |
| `--card` / `--card-foreground` | `#f6eddc` / `#1a1210` | `#420b0d` / `#d3aa82` |
| `--muted` | `#e2cfb2` | `#1a0506` |
| `--muted-foreground` | `#5c4631` | `#bfa07f` |
| `--primary` / `--primary-foreground` | `#ac020f` / `#ffffff` | `#ac020f` / `#ffffff` |
| `--secondary` / `--secondary-foreground` | `#d3aa82` / `#420b0d` | `#2a0708` / `#d3aa82` |
| `--accent` / `--accent-foreground` (superfície de hover) | `#e2cfb2` / `#1a1210` | `#2a0708` / `#d3aa82` |
| `--link` | `#8a0210` | `#ff6b75` |
| `--border` / `--input` | `#8a6a4a` | `#a8845f` |
| `--ring` | `#8a0210` | `#ff6b75` |
| `--destructive` | `#8a0210` | `#ff6b75` |
| `--radius` | `6px` | `6px` |
| `color-scheme` | `light` | `dark` |

Escopo fixo das faixas (header e rodapé, `.faixa`, **iguais nos dois temas**): `--band-bg #000000`, texto `#d3aa82`, `--link #ff6b75`, `--border #a8845f`, `--ring #ff6b75`, hover de pílula `#2a0708`, painel do menu móvel `#0d0203`.
Marca (não mudam por tema): `--brand-gradient: linear-gradient(90deg, #ac020f, #420b0d)` (faixas e topo do card), `--brand-gradient-button: linear-gradient(135deg, #ac020f, #5a0a0f)`, `--gold #c8a04a` (aro dos dragões e contorno das nuvens, só decorativo).
Textura de papel: só no claro, em camada decorativa (`body::before`, atrás de tudo) com os três gradientes radiais marrons de 8 a 12%. O `body` mantém `--background` sólido, para o axe avaliar o contraste (Pitfall 4).

### Contraste WCAG calculado (AA: texto 4,5:1; UI e texto grande 3:1)

Fórmula de luminância relativa, executada em 2026-11-27. É o conteúdo do teste de contrato `lib/contrast.test.ts` (que lê `globals.css`).

| Par | Razão | Resultado |
|-----|-------|-----------|
| Escuro: `#d3aa82` sobre `#000000` / `#420b0d` | 9,84 / 7,66 | AAA |
| Escuro: `#bfa07f` (muted) sobre `#000000` / `#420b0d` / `#2a0708` | 8,55 / 6,65 / 7,55 | AA |
| Escuro: `#ffffff` sobre `#ac020f` (botão) / `#5a0a0f` | 7,58 / 14,14 | AAA |
| Escuro: `#ff6b75` (link, foco) sobre `#000000` / `#420b0d` | 7,61 / 5,92 | AA |
| Escuro: borda `#a8845f` sobre `#000000` / `#420b0d` | 6,13 / 4,77 | AA UI |
| Claro: `#1a1210` sobre `#ecdcc4` / `#f6eddc` | 13,71 / 15,88 | AAA |
| Claro: `#5c4631` (muted) sobre `#ecdcc4` / `#f6eddc` / `#e2cfb2` | 6,57 / 7,61 / 5,81 | AA |
| Claro: link `#8a0210` sobre `#ecdcc4` / `#f6eddc` / `#e2cfb2` | 7,44 / 8,62 / 6,58 | AAA |
| Claro: `#ac020f` (preenchimento) com texto branco | 7,58 | AAA |
| Claro: borda `#8a6a4a` sobre `#ecdcc4` / `#f6eddc` | 3,68 / 4,26 | AA UI |
| Faixa (ambos os temas): `#d3aa82` sobre `#000000` / `#0d0203` / `#2a0708` | 9,84 / 9,58 / 8,69 | AAA |
| Faixa: `#ff6b75` sobre `#000000` / `#0d0203` / `#2a0708` | 7,61 / 7,41 / 6,72 | AA |
| Faixa: anel interno `#ff6b75` da pílula ativa sobre `#000000` | 7,61 | AA UI |
| Selo hanko: `#ffffff` sobre `#ac020f` | 7,58 | AAA |
| **Reprovam (proibidos como texto/UI):** `#ac020f` sobre `#000000` | 2,77 | FALHA |
| **Reprovam:** `#ac020f` sobre `#d3aa82` | 3,55 | só decorativo |
| **Reprovam:** `#8a0210` sobre `#000000` (link do claro dentro da faixa) | 2,10 | por isso a faixa fixa `--link #ff6b75` |
| **Reprovam:** `#ffffff` sobre `#ff6b75` | 2,76 | por isso texto sobre `#ff6b75` é sempre `#000000` (7,61) |

Pares obrigatórios do teste de contrato, nos dois escopos de tema e na faixa: `foreground/background` 4,5; `card-foreground/card` 4,5; `muted-foreground/{background,card,muted}` 4,5; `primary-foreground/primary` 4,5; `link/{background,card}` 4,5; `ring/{background,card}` 3; `border/{background,card}` 3; faixa: `texto/faixa`, `link/faixa`, `ring/faixa` e `border/faixa`.

---

## Layout e contratos por tela

Landmarks em toda página: link "Pular para o conteúdo" (visível só no foco, primeiro item da tabulação), `<header>` (faixa), `<nav aria-label="Principal">`, `<main id="conteudo">`, `<footer>` (faixa) com `<nav aria-label="Rodapé">`. Exatamente um `h1` por página. `<html lang="pt-BR" data-theme="dark">`.

### Header (faixa de tinta)

- Fundo `#000000` nos dois temas. Linha: marca à esquerda, navegação ao centro/direita, botão de tema no fim.
- **Marca** (`<a href="/">`): `DragonMark` 44px (`aria-hidden`, `detail=small`) + "No Law" em Heading (Yuji Boku). Nome acessível vem do texto (D-02). Alvo ≥ 44px de altura.
- **Navegação ≥ 768px**: pílulas `rounded-full`, altura mínima 44px, padding lateral 16px, texto Label. Itens exatos (D-08): **Início**, **Sobre o clã**, **Regras**. Estados: normal texto `#d3aa82`; hover fundo `#2a0708`; ativo (`aria-current="page"`) fundo `#ac020f`, texto branco, anel interno `#ff6b75` de 2px; foco anel `--ring` de 2px com offset 2px. `/status` e `/kit` não marcam nenhum item.
- **Navegação < 768px** (D-10): as pílulas somem; entram o botão de tema e o botão ☰ (44x44, ordem: tema, depois ☰). O painel abre **logo abaixo da faixa**, fundo `#0d0203`, largura total, itens de 52px de altura, texto Label alinhado à esquerda com padding 16px, item ativo com a mesma pílula. Se a viewport for baixa, o painel rola (`max-height: calc(100dvh - altura da faixa)`, `overflow-y: auto`).
- **Nuvem decorativa** no canto direito da faixa, em todas as páginas (D-19): a mesma arte `Cloud` do rodapé (viewBox `0 0 120 60`, gradiente preto→vermelho, contorno `#c8a04a` de 1,5px), 120 a 150px de largura (`w-32`, 128px), `aria-hidden`, `pointer-events: none`, em camada abaixo do conteúdo (`z-index` menor). Ancorada no canto superior direito **do container** e deslocada 12px para cima, de modo que a borda da faixa (`overflow: clip` vertical) a corte parcialmente. A linha do header reserva 144px de `padding-right` para ela, então **nunca** fica sob a navegação, o botão de tema nem o ☰. Visível só a partir de 1024px (`hidden lg:block`); abaixo disso fica oculta (no celular o canto é ocupado pelos botões de tema e ☰). Sem movimento.
- **Traço de pincel** abaixo da faixa: SVG `viewBox="0 0 1200 12"` com `preserveAspectRatio="none"`, traço de 4px em gradiente `#ac020f → #420b0d`, `aria-hidden`. Cabeçalho **não** é sticky.
- **Botão de tema** (D-21): círculo de 44px, borda de 2px `--border` (na faixa: `#a8845f`), `DragonMark` de 28px, sem texto. No hover gira 180° em 300ms. A arte gira 180° quando `data-theme="light"` (estado por CSS, sem JS; ver P6). `aria-label`: "Mudar para tema claro" (no escuro) / "Mudar para tema escuro" (no claro); `type="button"`.

### Capa (`/`, estática, sem chamar a API; D-06)

**Âncora visual:** o emblema com o brilho vermelho é o primeiro ponto de atenção da capa; o `h1` com o slogan é o segundo nível; os CTAs, o terceiro. No celular, a ordem de leitura acompanha (emblema em cima). Nas páginas de leitura, a âncora é o `h1` com o traço de pincel.

Ordem, de cima para baixo:

1. **Seção hero** (`<section aria-labelledby="titulo-capa">`) com a camada de pétalas e duas colunas em flex com wrap: texto (`flex: 999 1 460px`) e emblema (`flex: 1 1 360px`). No celular empilha: emblema 220px primeiro, depois o texto.
   - Texto: rótulo (Label, caixa alta, `--link`) "Clã do SA-MP · desde 2017"; `h1` no tamanho Display (`text-display`, 52/36) com o slogan; traço de pincel de 3px (160 a 260px de largura) sob o `h1`; parágrafo Body; dois CTAs: **primário** "Conheça o clã" → `/sobre` e **secundário** "Leia as regras" → `/regras` (52px, gap 16px, empilham a 100% abaixo de 480px).
   - Emblema: recorte PNG do emblema (`public/brand/emblema.png`, `alt=""`, decorativo, o nome está no `h1`), 340px (220px no celular), aro dourado, **brilho radial vermelho** atrás pulsando em 6s. `loading="eager"` e `fetchPriority="high"` (Next 16: sem `priority`).
2. **Banner pendurado como pergaminho** (`<figure>`): bastão marrom (`aria-hidden`) em cima, imagem do banner `aspect-ratio: 3/1` (`public/brand/banner.jpg`, 1500x500, `loading="lazy"`), bastão embaixo, `<figcaption>` Label "Do acervo do clã · o banner". `alt`: ver Copywriting. Largura 100% do container, máximo 1152px.
3. Texto da capa **nunca** fica sobre o banner nem sobre pétalas sem plano sólido: o fundo da seção é `--background`, as pétalas ficam em camada `aria-hidden` atrás do texto (`z-index` menor, `pointer-events: none`).

Pétalas: 6 `<span aria-hidden>` no desktop e 3 no celular (as 3 últimas com `hidden md:block`), CSS puro; ver Interação e movimento.

### Páginas de leitura (`/sobre`, `/regras`, `/privacidade`; D-11 a D-14)

- `<article aria-labelledby>` num **card** centralizado, `max-w` 760px, raio 6px, padding 48px (24px no celular). Topo: faixa `div` de 6px com `--brand-gradient` (dentro do card, colada no topo). Escuro: `bg-card` (`#420b0d`) com contorno 1px `--border`. Claro: `bg-card` (`#f6eddc`) com sombra suave `0 8px 24px rgba(26,18,16,0.12)`.
- `h1` (Display) + traço de pincel de 3px sob ele + corpo em `Prose` (Body). `Privacidade` tem `h2` (Heading) e `ul`.
- Largura do texto dentro do card: a coluna interna fica entre 24 e 664px; `overflow-wrap: anywhere` nos parágrafos.
- Ornamento nas páginas de leitura: **só o traço de pincel** (sob o `h1`) **mais a nuvem do header** (D-19). Sem pétalas, sem nuvens dentro do card, sem brilho.

### Rodapé (faixa de tinta, ambos os temas; D-09)

Traço de pincel de 5px acima da faixa (`viewBox 0 0 1200 12`). Dentro: `<nav aria-label="Rodapé">` com **Sobre o clã**, **Regras**, **Privacidade** (alvos de 44px, gap 8px, quebra em linhas no celular), o texto "No Law · desde 2017" (Label) e o **selo hanko** (44x44, `#ac020f`, "NO / LAW" em Label branco, raio 4px, `aria-hidden`). Um par de **nuvens** (viewBox `0 0 120 60`, gradiente preto→vermelho, contorno `#c8a04a` de 1,5px, `aria-hidden`) nos cantos, visível a partir de 640px (`hidden sm:block`). **Sem** link do Discord.

### `/status` (D-07)

A antiga home com o visual novo, sem link no menu, `noindex`. `h1` "Status do serviço" (Display) num `Card` (padding 48/24px) com `dl` em duas colunas (`dt` Label `--muted-foreground`; `dd` Body; commit em `code`). Mantém os `data-testid` existentes (`api-commit`, `api-db`, `api-time`, `api-db-latency`, `api-unavailable`) e o comportamento `force-dynamic`. O link "Ver detalhes"/"Ocultar detalhes" usa o estilo de link em texto. Estado de indisponibilidade em Copywriting.

### `/kit` (D-22)

`noindex` (meta robots **e** cabeçalho `X-Robots-Tag: noindex`), fora do menu. Uma coluna de seções, cada uma num `Card`: (1) Cores: amostras com nome do token, hex e razão de contraste nos dois temas; (2) Tipografia: os 4 papéis (Label, Body, Heading, Display); (3) Espaçamento: barras da escala; (4) Botões: primário e secundário, tamanhos `default` e `sm`, estados normal, hover, foco, desabilitado; (5) Link em texto; (6) Card; (7) Item de menu (pílula normal, ativa); (8) Menu sanduíche fechado e aberto (pré-visualização estática); (9) Botão de tema; (10) Ornamentos: `DragonMark` em 16, 32, 44 e 96px, traços de pincel, nuvem, hanko. A página serve de base aos testes de componente e de contraste.

### 404 e erro global

- `app/not-found.tsx`: card central com `h1` e CTA primário (copy na seção Copywriting).
- `app/global-error.tsx` (renderiza o próprio `<html>`, não herda estilos): importa `./globals.css`, define `data-theme="dark"`, a classe da fonte do corpo e o mesmo script de tema; mesmo card. Sem `metadata` (client component): usa `<title>` do React.

### Metadados e ícones (VIS-02)

- `metadataBase` = `NEXT_PUBLIC_SITE_URL` (fallback `https://blog-no-law.vercel.app`). `title.default` "Blog No Law", `template` "%s | Blog No Law". `description` padrão: "O blog do clã No Law: desde 2017, a história do clã em posts, fotos e vídeos." `openGraph`: `siteName` "Blog No Law", `locale` `pt_BR`, `type` `website`.
- Títulos das páginas: "Sobre o clã", "Regras", "Política de Privacidade". `/status` e `/kit`: `robots: { index: false, follow: false }`.
- `viewport.themeColor`: `#000000` (a faixa do topo é preta nos dois temas).
- Ícones (D-03): `app/icon.svg` (arte pequena dos dragões), `app/icon1.png` 32x32, `app/favicon.ico` (16 e 32, ICO com PNG embutido, escrito com teste, sem pacote), `app/apple-icon.png` 180x180 (arte a 140px centralizada sobre quadrado `#000000`, sem raio próprio), `public/brand/icon-512.png` 512x512.
- Open Graph (D-04): `app/opengraph-image.jpg` 1200x630 (JPEG qualidade 82, recorte do banner com `extract` ajustado para não deixar o fragmento de nuvem na borda esquerda, mantendo emblema e slogan) + `opengraph-image.alt.txt`.

### Ornamentos por superfície (D-19)

| Superfície | Traço de pincel | Nuvem | Pétalas | Brilho | Hanko |
|------------|-----------------|-------|---------|--------|-------|
| Header (todas as páginas) | sim (4px, abaixo da faixa) | **sim**, 1 nuvem no canto direito, ≥ 1024px | não | não | não |
| Capa | sim (3px sob o `h1`) | só as do header e do rodapé | sim (6 desktop, 3 celular) | sim (emblema) | não |
| Páginas de leitura (`/sobre`, `/regras`, `/privacidade`) | sim (3px sob o `h1`) | só a do header e as do rodapé | não | não | não |
| Rodapé | sim (5px, acima da faixa) | sim, par nos cantos, ≥ 640px | não | não | sim |

Todos `aria-hidden`, sem `style=` inline, nunca sob texto sem plano sólido.

---

## Interação, movimento e acessibilidade

### Tema (UX-02)

- Servidor emite `data-theme="dark"`. Script inline no `<head>` (código como texto filho de `<script>`, nunca a prop de HTML bruto) lê `localStorage["nl-theme"]` e só aceita `light`; qualquer outro valor, ausência ou storage bloqueado fica `dark`. `<html suppressHydrationWarning>`. Layout raiz **não** lê `cookies()`/`headers()` (páginas continuam estáticas).
- O botão atualiza `data-theme` e grava no storage; ícone troca por CSS (sem estado React); só o `aria-label` atualiza após hidratar.
- Transição de tema: `background-color`, `color`, `border-color` em 250ms `ease`. Com `prefers-reduced-motion: reduce`, instantânea.

### Menu sanduíche (disclosure)

- Botão ☰: `aria-expanded`, `aria-controls="menu-principal"`, rótulo "Abrir menu" / "Fechar menu" (ícone ☰ ↔ ✕). Fechado por padrão no SSR; só existe abaixo de 768px.
- **Esc** fecha e devolve o foco ao botão. Clicar em um link fecha. Tab percorre os itens na ordem. Ao crescer a janela para ≥ 768px o painel fecha e some. O painel não é modal (sem trava de foco, sem scroll lock).

### Movimento (D-20) e `prefers-reduced-motion`

| Efeito | Onde | Duração | Com `reduce` |
|--------|------|---------|--------------|
| Transição de cor (hover, tema) | global | 250ms | instantânea |
| Botão primário sobe 2px com sombra vermelha `0 8px 16px rgba(172,2,15,0.4)` no hover | botões | 250ms | sem movimento, mantém a mudança de cor |
| Rotação do botão de tema (+180° no hover) | header | 300ms | sem rotação animada (a rotação de estado do tema permanece, sem transição) |
| Brilho radial do emblema pulsando | capa | 6s, infinito | parado |
| Pétalas caindo (só `transform` e `opacity`) | capa | 11 a 16s por pétala, atraso negativo, infinito | `display: none` |

Pétalas: 11px x 15px, `#ac020f`, `border-radius: 0 80% 0 80%`, opacidade 0,9, no contêiner `overflow: clip` (sem rolagem horizontal), posição e duração por `:nth-child()` no CSS. **Proibido `style=` inline** (CSP) e `100vw`/`w-screen`.

### Acessibilidade e CSP

- WCAG 2.1 A/AA nos dois temas, em desktop e em celular (axe nas rotas `/`, `/sobre`, `/regras`, `/privacidade`, `/kit`, `/status`). Sem rolagem horizontal em 320, 375 e 412px.
- Foco visível em tudo: `outline: 2px solid var(--ring)`, `outline-offset: 2px`. Alvos de toque ≥ 44px.
- Imagens decorativas e SVG de ornamento: `aria-hidden="true"` e `alt=""`. Imagens com conteúdo (banner com slogan) têm `alt` descritivo.
- CSP v1 estática (ver RESEARCH, Pattern 6) obriga: nenhum `style={{}}` em componentes, ornamentos por classes e variáveis, nenhum recurso de terceiro (fontes self-hosted).
- O gate de HTML bruto reprova até comentários: em `apps/web`, referir-se a "a prop de HTML bruto" sem escrever o nome dela. SVG entra como componente JSX.

---

## Copywriting Contract

Tom: próximo, de amigos ("a gente"), um toque de humor (D-11) no Sobre e nas Regras; Privacidade clara e direta (D-14). Todo texto em pt-BR. Textos de Sobre e Regras são **provisórios** (D-12, D-13): o autor revisa.

### Elementos de interface

| Element | Copy |
|---------|------|
| Primary CTA (capa) | "Conheça o clã" (→ `/sobre`) |
| Secondary CTA (capa) | "Leia as regras" (→ `/regras`) |
| Menu (desktop e painel) | "Início", "Sobre o clã", "Regras" |
| Rodapé (links) | "Sobre o clã", "Regras", "Privacidade" |
| Rodapé (texto) / selo | "No Law · desde 2017" / "NO" "LAW" |
| Marca no header | "No Law" |
| Botão de tema (`aria-label`) | "Mudar para tema claro" (no escuro) · "Mudar para tema escuro" (no claro) |
| Botão do menu (`aria-label`) | "Abrir menu" · "Fechar menu" |
| Link de atalho | "Pular para o conteúdo" |
| Rótulo da capa | "Clã do SA-MP · desde 2017" |
| `h1` da capa (slogan) | "Uma nova face, uma nova história." |
| Parágrafo da capa | "Somos o No Law, um clã nascido no GTA San Andreas Multiplayer em 2017, de uma amizade de mais de 10 anos. Este é o nosso canto para guardar as histórias, as fotos e os vídeos do grupo." |
| Legenda do banner | "Do acervo do clã · o banner" |
| `alt` do banner | "Banner do clã No Law com o emblema dos dois dragões e o slogan “Uma nova face, uma nova história.”" |
| `alt` do Open Graph | "No Law: emblema dos dragões e o slogan “Uma nova face, uma nova história.”" |
| Empty state heading | Não há lista nesta fase (o vazio do feed é da Fase 4). "A história completa chega em breve." (Sobre) é **copy provisório** (D-12: o autor escreve a história depois), **não** um estado vazio |
| Empty state body | Regras provisórias: "As regras do clã estão vindo do nosso Discord e aparecem aqui em breve. Enquanto isso, vale o de sempre: respeito com todo mundo." |
| Error state (API, `/status`) | Mantém "API indisponível no momento" (`data-testid="api-unavailable"`, `role="status"`), acrescenta "A API pode estar iniciando; tente de novo em alguns minutos." e o link "Recarregar status" (→ `/status`) |
| Error state (404) | `h1` "Página não encontrada" · "Esse endereço não existe ou mudou de lugar." · CTA "Voltar para o início" |
| Error state (global) | `h1` "Algo deu errado" · "Tivemos um problema do nosso lado. Tente de novo em instantes." · link "Voltar para a página inicial" |
| Destructive confirmation | Nenhuma ação destrutiva nesta fase. Nada a confirmar |

### Textos das páginas (provisórios, partida do sketch, dentro de D-11 a D-14)

**Sobre o clã** (`h1` "Sobre o clã"):
1. "O No Law nasceu em 2017, no GTA San Andreas Multiplayer (SA-MP), de uma amizade que já vinha de antes do jogo."
2. "Desde então a gente foi e voltou muitas vezes, mas o clã nunca deixou de existir."
3. "A história completa chega em breve."

**Regras** (`h1` "Regras"): versão mínima acima ("As regras do clã estão vindo do nosso Discord e aparecem aqui em breve." + "Enquanto isso, vale o de sempre: respeito com todo mundo."). Quando o autor fornecer as regras do Discord (checkpoint do plano, D-13), o Claude adapta ao tom em lista numerada (`ol`), um `h2` por grupo de regras, sem mudar o layout.

**Política de Privacidade** (`h1` "Política de Privacidade"; **não** cita lei, nem "LGPD", nem a palavra "cookie"):
- Abertura: "Este site é o espaço do clã No Law para guardar e mostrar a nossa história. Por enquanto ele não pede cadastro."
- `h2` "O que o site guarda", `ul`:
  - "A sua escolha de tema (claro ou escuro), salva no seu próprio navegador para a próxima visita."
  - "Registros técnicos da hospedagem, como data, hora e endereço de acesso, usados para manter o site no ar e investigar problemas."
  - "Avisos automáticos de erro, sem dados pessoais, para a gente corrigir o que quebrar."
- `h2` "O que o site não faz": "Não vende os seus dados e não usa nada disso para propaganda. Os serviços que o site usa (hospedagem e aviso de erros) recebem só o necessário para funcionar."
- Fecho: "Quando o login com o Discord chegar, esta página explica o que muda. Dúvidas sobre os seus dados? Fale com um admin do clã."

(O sketch dizia "não coleta dados pessoais" e "não compartilha"; isso contradiz a linha dos registros de acesso e o uso de hospedagem. Ajuste na Premissa P7.)

---

## UI Considerations

> Cobertura de estados por forma, gerada pela sonda `ui-consideration-probe` (43 considerações aplicáveis em 11 elementos, tipos confirmados pelo orquestrador) e resolvida em 2026-11-27. O copy dos estados de vazio e de erro está em **Copywriting Contract**; aqui só se referencia. Linhas com várias categorias têm a mesma resolução.

Elementos: E1 header · E2 botão de tema · E3 menu ☰ · E4 capa · E5 banner · E6 páginas de leitura · E7 rodapé · E8 `/status` · E9 `/kit` · E10 404 e erro global · E11 favicon, ícone do app e Open Graph.

Applicable state considerations resolved: 43 of 43 (0 unresolved; 4 linhas backstop, verificadas por teste visual ou depois do deploy)

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| overflow | E1 nav (pílulas do header) | ✅ covered | Os 3 itens cabem em ≥ 768px com `whitespace-nowrap`; abaixo disso a navegação vira o menu ☰ |
| long-text | E1, E3, E7 rótulos de navegação | ✅ covered | Rótulos fixos e curtos ("Sobre o clã" é o maior); sem truncamento |
| loading, error | E1 header | ➖ dismissed | O header é estático (SSR), sem dados; o único estado dinâmico é o do botão de tema (E2) |
| loading | E2 botão de tema (antes de hidratar) | ✅ covered | O tema vem do HTML e do script inline; o ícone troca por CSS; só o `aria-label` corrige após hidratar, sem piscar |
| error | E2 botão de tema (storage bloqueado) | ✅ covered | O tema vale na sessão e a próxima visita abre no escuro padrão; nenhuma mensagem de erro |
| long-text | E2 botão de tema | ➖ dismissed | Só ícone; o rótulo acessível é fixo ("Mudar para tema claro/escuro") |
| loading | E3 menu ☰ (sem JS ainda) | ✅ covered | O painel nasce fechado no SSR; os mesmos links estão no rodapé, então nenhuma página fica inalcançável |
| error | E3 menu ☰ | ➖ dismissed | Sem dados; se o JS falhar, a navegação continua pelos links do rodapé |
| overflow | E3 menu ☰ (viewport baixa) | ✅ covered | O painel rola: `max-height: calc(100dvh - altura da faixa)`, `overflow-y: auto` |
| overflow | E7 nav do rodapé | ✅ covered | Os 3 links quebram em linhas com gap 8px e mantêm alvo de 44px em 320px |
| loading, error | E7 rodapé | ➖ dismissed | Conteúdo estático, sem dados |
| overflow | E4 capa (pétalas, brilho, nuvens) | ✅ covered | Contêineres `overflow: clip`, sem `100vw`; teste `scrollWidth <= innerWidth` em 320, 375 e 412px nos dois temas |
| overflow | E1 nuvem do header | ✅ covered | Reserva de 144px de `padding-right` (≥ 1024px), `pointer-events: none`, cortada pela borda da faixa; oculta abaixo de 1024px |
| long-text | E4 `h1` da capa e E6/E8/E9/E10 `h1` das páginas | ✅ covered | `text-wrap: balance`; em 36px (celular) o título quebra em até 4 linhas sem sair do container |
| populated | E4 capa (emblema) | ✅ covered | Um único emblema decorativo de 340px (220px no celular) ao lado do texto; layout definido em "Capa" |
| empty, loading | E4 emblema, E5 banner | ✅ covered | Largura fixa (emblema) e `aspect-ratio: 3/1` (banner) reservam o espaço sobre fundo sólido; sem salto de layout |
| error | E4 emblema, E5 banner (imagem que não carrega) | ✅ covered | Fundo sólido `--background` por baixo e `alt` descritivo no banner; o emblema é decorativo (`alt=""`) |
| populated | E5 banner | ✅ covered | Largura total do container (máx. 1152px), bastões e legenda "Do acervo do clã · o banner" |
| overflow | E4, E6 legibilidade sobre textura e pétalas | 🧪 backstop | O axe devolve `incomplete` em gradiente/imagem; a prova é o teste de contrato de tokens + conferência visual no celular real |
| overflow, long-text | E6 páginas de leitura (parágrafos e listas) | ✅ covered | `overflow-wrap: anywhere` e coluna máxima de 664px dentro do card de 760px |
| long-text | E6 Regras definitivas (texto do Discord) | 🧪 backstop | O texto do autor ainda não chegou (D-13); teste visual em 320px com lista longa quando as regras entrarem |
| loading | E8 `/status` | ✅ covered | Renderizada no servidor (`force-dynamic`), sem estado de carregamento no cliente; o fetch tem tempo-limite de 5s (`AbortSignal.timeout`, Fase 1) e, ao expirar, cai no estado de erro |
| error | E8 `/status` com API fora | ✅ covered | Ver Copywriting "Error state (API, `/status`)": mensagem, explicação e "Recarregar status"; a página responde 200 |
| overflow, long-text | E8 `/status` (commit, valores) | ✅ covered | `code` do commit quebra (`overflow-wrap: anywhere`) em vez de rolar |
| loading, error | E9 `/kit` | ➖ dismissed | Página estática de referência, sem dados |
| overflow | E9 `/kit` (amostras de cor e componentes) | ✅ covered | Grade de amostras com `flex-wrap`/`grid auto-fill`, sem largura fixa maior que 320px |
| long-text | E9 `/kit` (nomes de tokens) | ✅ covered | Nomes e hex em `code` com `overflow-wrap: anywhere` |
| error | E10 404 e erro global | ✅ covered | Ver Copywriting: mensagem e CTA de volta ao início; o erro global importa os estilos e o tema por conta própria |
| loading | E10 404 e erro global | ➖ dismissed | Telas estáticas, sem dados |
| overflow, long-text | E10 404 e erro global | ✅ covered | Mesmo `h1` Display com `text-wrap: balance` e coluna centralizada |
| empty, populated | E11 favicon, ícone do app e Open Graph | ✅ covered | Todos os tamanhos (16/32 ICO, 180, 512, OG 1200x630) são gerados e conferidos pelo teste de dimensões dos ativos |
| loading | E11 favicon, ícone do app e Open Graph | ➖ dismissed | Carregamento controlado pelo navegador e pelos apps de chat; nada a desenhar |
| error | E11 preview real no Discord/WhatsApp | 🧪 backstop | Só conferível depois do deploy; os previews antigos ficam em cache do lado deles |
| error | E11 ícone SVG não suportado | 🧪 backstop | Navegadores sem favicon SVG usam o `favicon.ico`; conferir num navegador real após o deploy |
| empty | list-collection (feed na capa) | ➖ dismissed | A capa não tem lista nesta fase; o feed e seu estado vazio entram na Fase 4. A capa não reserva espaço nem placeholder para posts |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | `button`, `card` (e `components.json`) | not required |
| Terceiros | nenhum declarado | não aplicável: sem registro de terceiros, o gate de vetting (`shadcn view`) não roda nesta fase |

Pacotes npm (não são blocos de registro) seguem a **Matriz de pacotes** acima, com `checkpoint:human-verify` antes de instalar `class-variance-authority`, `clsx`, `tailwind-merge@3.7.0` (veredito `SUS` por recência; fixar 3.7.0) e, se o autor quiser `Sheet`/`asChild`, `radix-ui` e `tw-animate-css`. `sharp@0.35.5` (já aprovado) entra só como `devDependency` do script de ativos.

---

## Ativos de marca (D-01 a D-05)

| Ativo | Origem | Saída | Observação |
|-------|--------|-------|------------|
| Arte dos dragões (SVG) | desenhada à mão (R9); fonte no skill `marca-icone.md` | `components/dragon-mark.tsx` e `app/icon.svg` | Uma arte para header, favicon, ícone do app e botão de tema. Pequena (≤ 44px): disco, corpo, chifres, olhos. Grande (≥ 96px): + escamas tracejadas, boca e bigode. Sem texto. Cores `#000000`, `#ac020f`, aro `#c8a04a` |
| Emblema recortado | `assets/brand/Logo No Law.jpg` | `public/brand/emblema.png` (PNG com alfa, recorte circular raio ~300, conferido a olho) | Usado na capa (340 e 220px). A máscara é geométrica: o pergaminho dentro do círculo permanece |
| Banner da capa | `assets/brand/Banner No Law.jpg` | `public/brand/banner.jpg` (1500x500) | Figura pendurada na capa |
| Open Graph | banner | `app/opengraph-image.jpg` 1200x630 + `.alt.txt` | Ver Metadados |
| Favicons e ícone do app | arte dos dragões | `icon1.png` 32, `favicon.ico`, `apple-icon.png` 180, `icon-512.png` | Gerados por `scripts/brand/generate.mjs` (sharp), rodado à mão, saídas versionadas |

Corrigir o "10+ anos" do `PROJECT.md` para "desde 2017, de uma amizade de mais de 10 anos" (D-05).

---

## Premissas assumidas (não perguntadas ao autor)

| # | Decisão | Motivo | Risco se errada |
|---|---------|--------|-----------------|
| P1 | Escala de tipografia fechada em exatamente 4 tamanhos: Label 14, Body 18, Heading 26/22, Display 52/36. O `h1` da capa e o `h1` das páginas foram fundidos num só Display (52px desktop / 36px celular); `text-hero` removido. **Desvia levemente do sketch** (capa 60/38 e páginas 46/32) para cumprir a regra de no máximo 4 tamanhos. Decidido em 2026-11-27 pelo orquestrador, por delegação do autor para o ajuste fino visual | O sketch usava ~12 tamanhos; consolidei para o contrato (3 a 4 tamanhos) | Capa um pouco menor (60 para 52) e títulos das páginas um pouco maiores (46 para 52) que no sketch; corpo 18 em vez de 18-19; `h2` 26 como no sketch |
| P2 | Espaçamentos do sketch fora da escala (6, 10, 14, 22, 26, 40, 44, 52, 56) foram arredondados para a escala; 44 e 52 ficam só como alvos de toque | Regra de múltiplos de 4 e escala de 7 passos | Diferença de poucos pixels no padding do card (44-52 vira 48; 22-26 vira 24) |
| P3 | Breakpoint do menu em 768px (`md`) | O sketch só tem "desktop" e "celular" | Tablets pequenos veem o ☰; ajustável em 1 classe |
| P4 | O menu sanduíche é um **disclosure sob a faixa**, não um `Sheet` | É o que o sketch mostra e dispensa 3 pacotes | Se o autor preferir lateral/modal, o `Sheet` entra com `radix-ui` + `tw-animate-css` |
| P5 | A pílula ativa ganha um anel interno `#ff6b75` de 2px | `#ac020f` sobre `#000000` é 2,77:1 e o estado ativo precisa de 3:1 (WCAG 1.4.11); o texto branco já indica, o anel garante | Pílula ativa um pouco mais "contornada" que no sketch |
| P6 | O botão de tema gira 180° em estado no claro (por CSS), além do giro de hover | Dá sinal de estado sem JS e sem piscar | Se o autor achar estranho, remover a regra; o `aria-label` já informa o estado |
| P7 | Privacidade: removi "não coleta dados pessoais" e "não compartilha" do texto do sketch e deixei "não vende nem usa para propaganda" + "recebem só o necessário" | Os registros de acesso incluem o IP e há hospedagem e monitoramento de terceiros; a frase original ficava inexata | O autor pode reescrever; o teste só proíbe "LGPD" e "cookie" |
| P8 | Cabeçalho não é sticky; link "Pular para o conteúdo" incluído | Não cobre foco e âncoras; acessibilidade de teclado | Nenhum |
| P9 | `/status` ganha o `h1` "Status do serviço" (era "Blog No Law") | A home passa a ser a capa; o `h1` do status não pode repetir a marca | Os testes movidos para `/status` devem ser atualizados junto |
| P10 | O tema ignora `prefers-color-scheme`; primeira visita é sempre escura | D-15 | Visitantes com SO claro veem escuro até trocarem |
| P11 | Emblema na capa: recorte PNG (não a arte SVG grande) | Recomendação do `marca-icone.md`: fidelidade na capa, SVG no resto | Se o recorte ficar ruim, usar a arte SVG grande (`detail=large`) sem mudar o layout |
| P12 | Pétalas: 6 no desktop e 3 no celular (sketch), em vez das 8 a 12 do RESEARCH | O sketch é a direção travada | Nenhum |
| P13 | `shadcn_initialized` fica `false` até o plano rodar o `init`; o `Component Inventory` terá de ser reconferido com `npx shadcn info` | Não há `components.json` hoje | Linha de proveniência desatualizada; reconferir após o `init` |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS
- [x] Dimension 7 Inventory Provenance: PASS

**Approval:** approved 2026-11-27 (gsd-ui-checker, revisão 1: 7/7 PASS; FLAGs de âncora visual e exceções gráficas aplicados depois)
