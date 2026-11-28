# Funcionalidade: Tema claro e escuro do blog

Escrita antes dos testes (BDD). Cada cenário traz a tag do teste que o implementa:
`@unit` roda no Vitest (`apps/web/lib/theme.test.ts` e `apps/web/lib/contrast.test.ts`);
`@e2e` roda em `apps/web/e2e/tema.spec.ts` (Playwright com axe, WCAG 2.1 A/AA), só na CI.

Como visitante do Blog No Law
Quero escolher entre o tema escuro "tinta" e o claro "pergaminho"
Para ler o blog do jeito que for mais confortável, sem perder a escolha na próxima visita

## Cenário: Primeira visita abre no tema escuro

Tags: `@unit` `@e2e`

- **Dado** que o visitante nunca escolheu um tema
- **Quando** o visitante abre `/`
- **Então** a página está no tema escuro, mesmo que o sistema esteja no claro
- **E** o botão de tema se chama "Mudar para tema claro"

## Cenário: Trocar para o tema claro e a escolha persiste

Tags: `@unit` `@e2e`

- **Dado** que o visitante abriu `/` no tema escuro
- **Quando** o visitante clica no botão de tema
- **Então** a página passa para o tema claro e o botão se chama "Mudar para tema escuro"
- **E** a escolha fica guardada no navegador do visitante
- **E** ao recarregar a página o tema continua claro

## Cenário: Tema salvo aplicado antes de hidratar

Tags: `@unit` `@e2e`

- **Dado** que o visitante tem o tema claro salvo no navegador
- **E** que os scripts da página ainda não carregaram (a hidratação nunca acontece)
- **Quando** o visitante abre `/`
- **Então** a página já está no tema claro, sem piscar no escuro antes

## Cenário: Valor estranho no armazenamento cai no escuro

Tags: `@unit` `@e2e`

- **Dado** que o armazenamento do navegador tem um valor que não é `light` (por exemplo `Dark` ou marcação)
- **Quando** o visitante abre `/`
- **Então** a página está no tema escuro
- **E** o valor guardado nunca é copiado para a página

## Cenário: Contraste AA nos dois temas

Tags: `@unit` `@e2e`

- **Dado** que a página está no tema escuro ou no tema claro (definido antes de navegar)
- **Quando** o visitante abre `/`
- **Então** todo par de texto e fundo da paleta chega a 4,5:1 e todo par de interface e foco chega a 3:1
- **E** o axe não encontra violações WCAG 2.1 A/AA
- **E** o vermelho da marca nunca aparece como texto, link, borda ou foco no escuro nem na faixa
