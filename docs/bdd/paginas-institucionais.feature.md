# Funcionalidade: Páginas institucionais (Sobre o clã, Regras e Política de Privacidade)

Escrita antes dos testes (BDD). Cada cenário traz a tag do teste que o implementa:
`@unit` roda no Vitest (`apps/web/components/reading-page.test.tsx`, `apps/web/app/sobre/page.test.tsx`, `apps/web/app/regras/page.test.tsx` e `apps/web/app/privacidade/page.test.tsx`);
`@e2e` roda em `apps/web/e2e/paginas.spec.ts` (Playwright nos projetos `chromium` e `mobile`, com axe, WCAG 2.1 A/AA, nos dois temas), só na CI;
`@manual` é conferido por uma pessoa (revisão do texto pelo autor e a lista longa das Regras em 320px).

Como visitante do Blog No Law
Quero ler sobre o clã, as regras e a política de privacidade num layout de leitura confortável, no celular e no desktop
Para conhecer o clã e saber o que o site guarda, sem juridiquês

## Cenário: Ler Sobre o clã

Tags: `@unit` `@e2e`

- **Dado** que o visitante está em `/` e olha o rodapé
- **Quando** toca em "Sobre o clã" na navegação "Rodapé"
- **Então** abre `/sobre` (status 200), com um único `h1` "Sobre o clã" e o título da aba "Sobre o clã | Blog No Law"
- **E** o texto aparece num card de leitura centralizado de até 760px, com a faixa de gradiente no topo e o traço de pincel sob o título
- **E** o axe não encontra violações WCAG 2.1 A/AA nem no tema escuro nem no claro

## Cenário: Ler as Regras do clã

Tags: `@unit` `@e2e` `@manual`

- **Dado** que o visitante está em `/` e olha o rodapé
- **Quando** toca em "Regras" na navegação "Rodapé"
- **Então** abre `/regras` (status 200), com um único `h1` "Regras" e o título da aba "Regras | Blog No Law"
- **E** vê as frases da introdução e as regras do clã, cada grupo num `h2` com sua lista numerada
- **E** o axe não encontra violações WCAG 2.1 A/AA nem no tema escuro nem no claro
- **E** (`@manual`) o autor revisa o texto das regras e confere a lista longa do Discord em 320px, legível e sem rolagem horizontal

## Cenário: Ler a Política de Privacidade sem juridiquês

Tags: `@unit` `@e2e` `@manual`

- **Dado** que o visitante está em `/` e olha o rodapé
- **Quando** toca em "Privacidade" na navegação "Rodapé"
- **Então** abre `/privacidade` (status 200), com um único `h1` "Política de Privacidade" e o título da aba "Política de Privacidade | Blog No Law"
- **E** vê "O que o site guarda" com uma lista de três itens e "O que o site não faz"
- **E** o texto visível não tem "LGPD" nem "cookie"
- **E** o axe não encontra violações WCAG 2.1 A/AA nem no tema escuro nem no claro
- **E** (`@manual`) o autor revisa a redação final da política

## Cenário: Páginas de leitura cabem no celular

Tags: `@e2e`

- **Dado** que o visitante está no celular com a janela de 320px
- **Quando** abre `/sobre`, `/regras` e `/privacidade`
- **Então** nenhuma delas rola na horizontal (`scrollWidth` não passa de `innerWidth`)
- **E** no desktop o card de leitura tem no máximo 760px de largura
