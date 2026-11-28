# Funcionalidade: Identidade visual do clã em todas as páginas

Escrita antes dos testes (BDD). Cada cenário traz a tag do teste que o implementa:
`@e2e` roda em `apps/web/e2e/identidade.spec.ts` (Playwright com axe, WCAG 2.1 A/AA), só na CI, nos
projetos `chromium` (desktop) e `mobile` (Pixel 7); `@integration` roda em
`scripts/verify-remote-web.test.mjs` (o script `scripts/verify-remote-web.sh` contra um servidor falso);
`@manual` é conferido por uma pessoa no UAT do fim da fase.

Estes são os cenários transversais da fase: valem para todas as rotas (`/`, `/sobre`, `/regras`,
`/privacidade`, `/kit`, `/status` e uma rota inexistente) nos dois temas. Os cenários de cada página
ficam em `capa.feature.md`, `paginas-institucionais.feature.md`, `kit.feature.md`, `status.feature.md`,
`erros.feature.md`, `navegacao.feature.md`, `marca.feature.md` e `tema.feature.md`.

Como visitante do Blog No Law
Quero que toda página do blog tenha a cara do clã, seja acessível e funcione no celular
Para reconhecer o blog como a casa do clã em qualquer lugar em que eu chegue

## Cenário: Acessibilidade nos dois temas em todas as páginas

Tags: `@e2e`

- **Dado** que o visitante escolheu o tema escuro ou o tema claro
- **Quando** abre qualquer página do blog, inclusive uma que não existe
- **Então** a página está no tema escolhido, tem exatamente um título `h1`, o cabeçalho com a marca e o rodapé
- **E** a página não tem violações de acessibilidade (WCAG 2.1 A/AA) segundo o axe

## Cenário: Nenhuma página rola de lado no celular

Tags: `@e2e`

- **Dado** que o visitante usa um celular com tela de 320, 375 ou 412 pixels de largura
- **Quando** abre qualquer página do blog, em qualquer tema
- **Então** a largura do conteúdo da página não passa da largura da tela
- **E** não existe rolagem horizontal

## Cenário: Nenhuma violação de CSP

Tags: `@e2e`

- **Dado** que o navegador aplica a política de segurança de conteúdo (CSP) enviada pelo servidor
- **Quando** o visitante abre cada página do blog, inclusive o kit de identidade, em qualquer tema
- **Então** o navegador não registra nenhuma violação da CSP no console nem como evento de segurança
- **E** nenhum erro de página é lançado

## Cenário: Identidade publicada em produção

Tags: `@integration`

- **Dado** que o site foi publicado
- **Quando** o script de verificação lê a capa, a imagem de preview, os ícones, os cabeçalhos e as páginas
- **Então** a capa traz o tema escuro e o slogan, o `og:image` é absoluto e responde `image/jpeg`
- **E** `/icon.svg`, `/favicon.ico` e `/apple-icon.png` respondem, a CSP proíbe o enquadramento por terceiros e `X-Frame-Options` é `DENY`
- **E** `/kit` e `/status` pedem `noindex` e `/sobre`, `/regras` e `/privacidade` respondem com um título `h1`

## Cenário: Preview real ao compartilhar o link

Tags: `@manual`

- **Dado** que o link de produção do blog é colado numa conversa do Discord ou do WhatsApp
- **Quando** o aplicativo monta o preview do link
- **Então** o preview mostra a imagem do clã (emblema e slogan, 1200x630) e o título "Blog No Law"
- **E** se aparecer um preview antigo, é cache do aplicativo: conferir de novo mais tarde
