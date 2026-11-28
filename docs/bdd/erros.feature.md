# Funcionalidade: Telas de erro do blog com a identidade do clã

Escrita antes dos testes (BDD). Cada cenário traz a tag do teste que o implementa:
`@unit` roda no Vitest (`apps/web/app/not-found.test.tsx` e `apps/web/app/global-error.test.tsx`);
`@e2e` roda em `apps/web/e2e/erros.spec.ts` (Playwright com axe, WCAG 2.1 A/AA), só na CI.

Como visitante do Blog No Law
Quero que um endereço inexistente ou um erro inesperado continuem com a cara do clã
Para saber o que aconteceu e voltar ao início, sem ver nenhum detalhe técnico

## Cenário: Endereço inexistente mostra a 404 do clã

Tags: `@unit` `@e2e`

- **Dado** que o endereço `/nao-existe` não existe no blog
- **Quando** o visitante abre `/nao-existe`
- **Então** a resposta tem status 404
- **E** a página mostra o título "Página não encontrada" no cabeçalho do clã
- **E** o axe não encontra violações WCAG 2.1 A/AA nos temas escuro e claro
- **E** ao clicar em "Voltar para o início" o visitante chega em `/`

## Cenário: Erro inesperado mostra a tela do clã sem detalhe técnico

Tags: `@unit`

- **Dado** que uma exceção escapou do layout raiz, com uma mensagem interna e um `digest`
- **Quando** o erro global é exibido ao visitante
- **Então** a tela traz o próprio documento em pt-BR, no tema escuro, com as fontes e o script de tema do clã
- **E** mostra "Algo deu errado", "Tivemos um problema do nosso lado. Tente de novo em instantes." e o link "Voltar para a página inicial"
- **E** a mensagem, o `digest` e a pilha do erro não aparecem na página
- **E** a exceção continua sendo repassada ao Sentry
