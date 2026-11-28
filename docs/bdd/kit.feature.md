# Funcionalidade: Kit de identidade e cabeçalhos de segurança do web

Escrita antes dos testes (BDD). Cada cenário traz a tag do teste que o implementa:
`@unit` roda no Vitest (`apps/web/app/kit/page.test.tsx`, `apps/web/lib/security-headers.test.ts`,
`apps/web/lib/marca-consistencia.test.tsx`); `@e2e` roda em `apps/web/e2e/kit.spec.ts`
(Playwright), só na CI.

Como autor do blog
Quero uma página de referência com a identidade do clã e cabeçalhos de segurança em toda resposta
Para construir as próximas telas sobre a mesma base visual, sem abrir o site a ataques simples

## Cenário: Kit mostra tokens e componentes

Tags: `@unit` `@e2e`

- **Dado** que o autor abre `/kit` no celular ou no desktop
- **Quando** a página carrega
- **Então** ele vê as dez seções: Cores, Tipografia, Espaçamento, Botões, Link em texto, Card, Item de menu, Menu sanduíche, Botão de tema e Ornamentos
- **E** cada cor mostra o nome do token, o hex e a razão de contraste calculada nos dois temas e na faixa
- **E** a página não repete o id `menu-principal` nem cria um segundo menu "Principal"
- **E** não há rolagem horizontal e o axe não acha violação WCAG 2.1 A/AA nos dois temas

## Cenário: Kit e status fora dos buscadores

Tags: `@unit` `@e2e`

- **Dado** que um buscador ou um robô pede `/kit` ou `/status`
- **Quando** a resposta chega
- **Então** o cabeçalho `X-Robots-Tag` tem `noindex`
- **E** a meta `robots` da página tem `noindex, nofollow`
- **E** nenhum link do menu ou do rodapé aponta para `/kit`

## Cenário: Toda página sai com os cabeçalhos de segurança

Tags: `@unit` `@e2e`

- **Dado** que um visitante abre qualquer página do web
- **Quando** o servidor responde
- **Então** a resposta leva `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: DENY` e `Permissions-Policy`
- **E** leva a `Content-Security-Policy` com `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'` e `form-action 'self'`
- **E** as fontes e as imagens só vêm do próprio domínio (`font-src 'self'`, `img-src 'self' data: blob:`), sem domínio de terceiros
- **E** nenhuma origem da política é `*` e o `unsafe-eval` só existe em desenvolvimento
- **E** o `connect-src` libera só a origem do Sentry, nunca a chave do DSN
