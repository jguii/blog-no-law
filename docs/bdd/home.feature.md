# Funcionalidade: Página inicial mostra o status da API

Escrita antes dos testes (BDD). Cada cenário traz a tag do teste que o implementa:
`@smoke-local` roda em `scripts/smoke-local.sh`; `@integration` roda em `apps/web/test/home.int-spec.ts`;
`@e2e` será implementado no Playwright do plano 01-10.

Como visitante do Blog No Law
Quero ver se a API e o banco estão no ar
Para saber que o esqueleto publicado funciona de ponta a ponta

## Cenário: API e banco no ar

Tags: `@smoke-local` `@integration` `@e2e`

- **Dado** que a API responde `GET /status` dentro do contrato
- **Quando** o visitante abre `/`
- **Então** vê a versão, o commit, o status do banco e o horário
- **E** a página foi montada no servidor do Next (o navegador nunca chama a API)

## Cenário: API indisponível

Tags: `@smoke-local` `@integration` `@e2e`

- **Dado** que a API não responde em 5 s, está fora do ar, devolve erro ou responde fora do contrato
- **Quando** o visitante abre `/`
- **Então** vê "API indisponível no momento"
- **E** a página responde 200, nunca 500

## Cenário: Ver detalhes

Tags: `@smoke-local` `@integration` `@e2e`

- **Dado** que a API e o banco estão no ar
- **Quando** o visitante clica em "Ver detalhes"
- **Então** a URL vira `/?detail=full`
- **E** aparece a latência do banco quando o banco estiver no ar
