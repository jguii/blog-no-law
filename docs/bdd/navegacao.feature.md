# Funcionalidade: Navegação do blog no celular e no desktop

Escrita antes dos testes (BDD). Cada cenário traz a tag do teste que o implementa:
`@unit` roda no Vitest (`apps/web/components/site-header.test.tsx`, `apps/web/components/mobile-menu.test.tsx` e `apps/web/app/layout.test.tsx`);
`@e2e` roda em `apps/web/e2e/navegacao.spec.ts` (Playwright nos projetos `chromium` e `mobile`, com axe, WCAG 2.1 A/AA), só na CI.

Como visitante do Blog No Law
Quero chegar a Início, Sobre o clã e Regras a partir de qualquer página, no celular ou no desktop
Para conhecer o clã sem me perder, mesmo sem JavaScript

## Cenário: Menu mostra só o que existe

Tags: `@unit` `@e2e`

- **Dado** que o visitante está no desktop (768px ou mais) e abre `/`
- **Quando** olha o topo da página
- **Então** vê as pílulas "Início", "Sobre o clã" e "Regras" na navegação "Principal", mais o botão de tema
- **E** "Início" está marcado como a página atual (`aria-current="page"`)
- **E** não há "Explorar", "Perfil", "Entrar" nem "em breve", nem o botão ☰

## Cenário: Menu sanduíche no celular

Tags: `@unit` `@e2e`

- **Dado** que o visitante está no celular (abaixo de 768px) e abre `/`
- **Quando** vê o topo da página
- **Então** as pílulas não aparecem e o botão ☰ "Abrir menu" aparece depois do botão de tema, fechado (`aria-expanded="false"`)
- **E** ao tocar no ☰ o painel "menu-principal" abre logo abaixo da faixa e o botão passa a "Fechar menu"
- **E** Tab percorre "Início", "Sobre o clã" e "Regras", nessa ordem
- **E** o axe não encontra violações WCAG 2.1 A/AA com o painel aberto
- **E** ao tocar em "Regras" a URL vira `/regras` e o painel fecha

## Cenário: Esc fecha o menu e devolve o foco

Tags: `@e2e`

- **Dado** que o visitante está no celular com o painel do ☰ aberto e o foco num link do painel
- **Quando** aperta Esc
- **Então** o painel fecha
- **E** o foco volta ao botão ☰ ("Abrir menu")

## Cenário: Menu fecha ao alargar a janela

Tags: `@e2e`

- **Dado** que o visitante está no celular com o painel do ☰ aberto
- **Quando** a janela passa a ter 1024px de largura
- **Então** o painel some e o botão ☰ também
- **E** as pílulas de navegação aparecem no topo

## Cenário: Pular para o conteúdo

Tags: `@unit` `@e2e`

- **Dado** que o visitante navega pelo teclado e abre `/`
- **Quando** aperta Tab pela primeira vez
- **Então** o foco vai para o link "Pular para o conteúdo", que fica visível
- **E** ele é o primeiro link do `<body>`, antes do menu

## Cenário: Rodapé com Sobre, Regras e Privacidade

Tags: `@unit` `@e2e`

- **Dado** que o visitante abre `/` (sem depender do menu do topo nem de JavaScript)
- **Quando** olha o rodapé
- **Então** a navegação "Rodapé" tem "Sobre o clã", "Regras" e "Privacidade"
- **E** vê "No Law · desde 2017"
- **E** nenhum link da página aponta para o Discord
