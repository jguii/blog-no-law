# Funcionalidade: Capa do clã em /

Escrita antes dos testes (BDD). Cada cenário traz a tag do teste que o implementa:
`@unit` roda em `apps/web/app/page.test.tsx`; `@integration` roda em `scripts/smoke-local.sh`;
`@e2e` roda em `apps/web/e2e/capa.spec.ts` (Playwright com axe, WCAG 2.1 A/AA), só na CI.

A capa é estática (D-06): não chama a API. O emblema, o banner, as pétalas e o traço de pincel são
decorativos (D-19, D-20). As pétalas existem só na capa e tudo o que se move desliga com movimento
reduzido.

Como visitante do Blog No Law
Quero ver a capa do clã com a cara dele, no celular e no desktop
Para reconhecer o blog como a casa do clã antes mesmo dos primeiros posts

## Cenário: Capa do clã

Tags: `@unit` `@e2e`

- **Dado** que o visitante abre `/` em qualquer tema
- **Quando** a capa carrega
- **Então** vê o rótulo "Clã do SA-MP · desde 2017" e o slogan "Uma nova face, uma nova história." no único título `h1`
- **E** vê o emblema do clã recortado, com aro dourado, e o banner pendurado com a legenda "Do acervo do clã · o banner"
- **E** o botão "Conheça o clã" leva a `/sobre` e o botão "Leia as regras" leva a `/regras`
- **E** a página não tem violações de acessibilidade (WCAG 2.1 A/AA) nos temas escuro e claro

## Cenário: Capa abre mesmo com a API fora

Tags: `@integration` `@e2e`

- **Dado** que a API está fora do ar
- **Quando** o visitante abre `/`
- **Então** a página responde 200 e mostra o slogan
- **E** não aparece nada do status técnico

## Cenário: Pétalas só na capa

Tags: `@unit` `@e2e`

- **Dado** que o visitante não pediu movimento reduzido
- **Quando** abre `/`
- **Então** vê 6 pétalas no desktop e 3 no celular, atrás do texto
- **E** nenhuma outra página (como `/sobre`) tem pétalas

## Cenário: Movimento reduzido desliga pétalas e brilho

Tags: `@e2e`

- **Dado** que o visitante pediu movimento reduzido
- **Quando** abre `/`
- **Então** nenhuma pétala fica visível
- **E** o brilho do emblema não anima

## Cenário: Capa cabe no celular

Tags: `@e2e`

- **Dado** um celular de 320, 375 ou 412 px de largura, em qualquer tema
- **Quando** o visitante abre `/`
- **Então** a página não tem rolagem horizontal
