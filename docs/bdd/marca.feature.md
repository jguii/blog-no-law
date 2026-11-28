# Funcionalidade: Marca do clã nos ícones, no preview do link e no manifesto

Escrita antes dos testes (BDD). Cada cenário traz a tag do teste que o implementa:
`@unit` roda no Node (`scripts/brand/icons.test.mjs`, `scripts/brand/images.test.mjs`) e no Vitest
(`apps/web/lib/site.test.ts`, `apps/web/app/manifest.test.ts`); `@e2e` roda em
`apps/web/e2e/marca.spec.ts` (Playwright), só na CI; `@manual` é conferido à mão depois do deploy (02-09).

Como visitante do Blog No Law
Quero ver a cara do clã na aba do navegador, no preview do link e no ícone do app
Para reconhecer o blog como a casa do clã No Law antes mesmo de ler os posts

## Cenário: Favicon dos dragões na aba

Tags: `@unit` `@e2e`

- **Dado** que o visitante abre qualquer página do site
- **Quando** o navegador procura o ícone da aba
- **Então** todo `link[rel="icon"]` e o `link[rel="apple-touch-icon"]` apontam para arquivos que respondem 200 com `content-type` de imagem
- **E** os PNG e o ICO têm as dimensões 16, 32 e 180 conferidas pelo cabeçalho do arquivo

## Cenário: Preview do link com a imagem do clã

Tags: `@unit` `@e2e`

- **Dado** que alguém compartilha o endereço de qualquer página do site num chat
- **Quando** o chat lê os metadados da página
- **Então** o `og:image` é uma URL absoluta `https:` para uma imagem JPEG de 1200x630 que responde 200
- **E** o `og:image:alt` é "No Law: emblema dos dragões e o slogan “Uma nova face, uma nova história.”"
- **E** o `og:site_name` é "Blog No Law" e o `og:locale` é `pt_BR`
- **E** com `NEXT_PUBLIC_SITE_URL` ausente, inválida ou sem `https:`, a base das URLs cai em `https://blog-no-law.vercel.app`

## Cenário: Ícone do app no manifesto

Tags: `@unit` `@e2e`

- **Dado** que o visitante adiciona o blog à tela inicial do celular
- **Quando** o navegador lê o `link[rel="manifest"]`
- **Então** o manifesto declara o nome "Blog No Law", o nome curto "No Law" e o idioma `pt-BR`
- **E** declara o ícone de 512 (`/brand/icon-512.png`) e o de 180 (`/apple-icon.png`), e o de 512 responde 200

## Cenário: Preview real no Discord e no WhatsApp

Tags: `@manual`

- **Dado** que o site está publicado na Vercel
- **Quando** o autor cola o endereço do blog numa conversa do Discord e noutra do WhatsApp
- **Então** os dois mostram a imagem do clã com o emblema e o slogan inteiros, sem pedaço de nuvem cortado na borda
- **E** o resultado é registrado na conferência final da fase (02-09), porque cada app guarda o preview em cache
