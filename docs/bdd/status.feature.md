# Funcionalidade: Página de status técnico em /status

Escrita antes dos testes (BDD). Cada cenário traz a tag do teste que o implementa:
`@smoke-local` roda em `scripts/smoke-local.sh`; `@integration` roda em `apps/web/test/status.int-spec.ts`;
`@e2e` roda em `apps/web/e2e/status.spec.ts` (Playwright com axe, WCAG 2.1 A/AA), só na CI.

A home `/` é a capa estática do clã (cenários em `docs/bdd/capa.feature.md`). O status técnico mora
em `/status`: fora do menu, sem indexação (`noindex`) e sempre montado no servidor.

Como operador do Blog No Law
Quero ver se a API e o banco estão no ar
Para saber que o esqueleto publicado funciona de ponta a ponta

## Cenário: API e banco no ar

Tags: `@smoke-local` `@integration` `@e2e`

- **Dado** que a API responde `GET /status` dentro do contrato
- **Quando** o visitante abre `/status`
- **Então** vê o título "Status do serviço" com a versão, o commit, o status do banco e o horário
- **E** a página foi montada no servidor do Next (o navegador nunca chama a API)

## Cenário: API indisponível

Tags: `@smoke-local` `@integration` `@e2e`

- **Dado** que a API não responde em 5 s, está fora do ar, devolve erro ou responde fora do contrato
- **Quando** o visitante abre `/status`
- **Então** vê "API indisponível no momento" e "A API pode estar iniciando; tente de novo em alguns minutos."
- **E** a página responde 200, nunca 500

## Cenário: Recarregar status

Tags: `@smoke-local` `@integration` `@e2e`

- **Dado** que a API está indisponível e a página mostra "API indisponível no momento"
- **Quando** o visitante olha as opções da página
- **Então** vê o link "Recarregar status" que leva para `/status`

## Cenário: Ver detalhes

Tags: `@smoke-local` `@integration` `@e2e`

- **Dado** que a API e o banco estão no ar
- **Quando** o visitante clica em "Ver detalhes"
- **Então** a URL vira `/status?detail=full`
- **E** aparece a latência do banco quando o banco estiver no ar
- **E** o link "Ocultar detalhes" leva de volta para `/status`
