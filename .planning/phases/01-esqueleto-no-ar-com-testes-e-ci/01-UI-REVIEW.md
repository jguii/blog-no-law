# Fase 01 — Revisão de UI

**Auditado:** 2026-11-26
**Baseline:** padrões abstratos dos 6 pilares (não há UI-SPEC.md nesta fase). Escopo esperado de um esqueleto: página pública mínima, sem identidade visual (identidade é da Fase 2), com dados do servidor da API.
**Screenshots:** não capturadas. O Chromium do Playwright neste WSL sai com código 127 (bibliotecas do sistema ausentes, ex.: libnspr4). A auditoria foi feita por código-fonte e pelo HTML SSR real de produção (`https://blog-no-law.vercel.app/`, HTTP 200, e `?detail=full`, HTTP 200).
**Interaction captures:** off (`workflow.ui_interaction_capture` desligado). Os achados de interação são derivados de código e do HTML servido, não de navegação real.

**Arquivos auditados:** `apps/web/app/page.tsx`, `apps/web/app/layout.tsx`, `apps/web/app/global-error.tsx`, `apps/web/lib/api.ts`, `apps/web/e2e/home.spec.ts`, `packages/shared/src/status.ts`, `apps/web/package.json`.

---

## Pontuação dos pilares

| Pilar | Nota | Achado-chave |
|-------|------|--------------|
| 1. Copywriting | 2/4 | Estado "Banco" mostra o enum técnico `up` e "Horário" mostra ISO 8601 UTC bruto, não pt-BR. |
| 2. Visuals | 2/4 | Nenhum CSS carregado: a página é o HTML padrão do navegador, com hierarquia só pelo `h1` e pelo `dl`. |
| 3. Color | 2/4 | Não há paleta, tokens nem CSS. Usa as cores padrão do navegador (texto preto, link azul). Sem 60/30/10 a verificar. |
| 4. Typography | 2/4 | Uma única fonte padrão do navegador, sem escala. Só `h1` e texto corrido; sem pesos ou tamanhos definidos. |
| 5. Spacing | 2/4 | Nenhuma escala de espaçamento. Margens e espaçamentos são os padrões do navegador (`dl`, `dd`, `main`). |
| 6. Experience Design | 3/4 | Fallback de API indisponível com HTTP 200, timeout de 5 s, `global-error`, toggle de detalhes funcional e axe no CI. Faltam retry e explicação do fallback. |

**Overall: 13/24**

Nenhum pilar ficou em nota 1, então não há BLOCKER de pilar. Os itens abaixo são WARNING (notas 2 a 3).

---

## Top 3 correções prioritárias

1. **Tradução e formatação dos valores de status** — o visitante lê `Banco up` e `Horário 2026-11-27T02:24:53.231Z` (verificado no HTML de produção). Impacto: a página parece técnica demais e não está em pt-BR nos valores. Correção: mapear `up` para "Disponível" (e `down` para "Indisponível") em `page.tsx`; formatar `time` com `Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'medium' })`. Os testes E2E que checam `api-db` com `toHaveText('up')` precisam ser ajustados junto.
2. **Ausência total de estilo (Visuals, Typography, Spacing, Color)** — nenhum `globals.css` nem dependência de CSS em `apps/web/package.json`; no HTML de produção não há `<link rel=stylesheet>` nem `<style>`. Impacto: a página é ilegível como produto, mesmo que seja esqueleto. Correção mínima sem identidade: um `globals.css` com `max-width`, `font-family: system-ui`, escala de 3 a 4 tamanhos (ex.: 1rem, 1.25rem, 2rem), margem vertical consistente em `dl` e `dd`, e `font-variant-numeric: tabular-nums` para o `api-db-latency`. A identidade visual real continua para a Fase 2.
3. **Código do commit inteiro sem quebra e erro sem ação** — `<code>` com 40 caracteres hexadecimais sem `overflow-wrap`, e o fallback "API indisponível no momento" não tem próximo passo nem botão de tentar de novo. Correção: `word-break: break-all` (ou mostrar os 7 primeiros caracteres com o completo em `title`) para o `<code>`; no fallback, acrescentar "Tente de novo em alguns minutos." e um link `Tentar novamente` (`<Link href="/">`).

---

## Achados detalhados

### Pilar 1: Copywriting (2/4)

- **Enum técnico exposto ao visitante.** `apps/web/app/page.tsx:42` renderiza `{db}` diretamente. O schema (`packages/shared/src/status.ts:16`) aceita `'up' | 'down'`, e o HTML de produção mostra `Banco up`. Isso quebra o padrão pt-BR da página. Correção: mapa `{ up: 'Disponível', down: 'Indisponível' }` no componente.
- **Data bruta em ISO UTC.** `apps/web/app/page.tsx:44` renderiza `{time}` cru. O HTML de produção mostra `2026-11-27T02:24:53.231Z`, que é UTC e não o horário local de quem lê. Correção: `Intl.DateTimeFormat('pt-BR', ...)` com fuso de São Paulo.
- **Rótulos OK.** "Serviço", "Versão", "Commit", "Banco", "Horário", "Latência do banco", "Ver detalhes" e "Ocultar detalhes" estão em pt-BR e são claros. "Latência do banco" com `{dbLatencyMs} ms` está bem.
- **Fallback sem explicação.** `page.tsx:21`: "API indisponível no momento" é claro, mas não diz o que o visitante pode fazer. Ver Pilar 6.
- **`global-error.tsx:18`:** "Algo deu errado" e "Voltar para a página inicial" estão adequados.
- **Título da aba.** `layout.tsx:5` define só "Blog No Law" e a página não tem descrição (`description` ausente em `metadata`). Não é defeito deste esqueleto; fica como nota para a Fase 2.

### Pilar 2: Visuals (2/4)

- **Foco visual único é o `h1`.** Há hierarquia básica (`h1` depois `dl` depois link), mas ela depende só do padrão do navegador.
- **Sem componentes visuais de estado.** Não há ícone, indicador de cor para `up` e `down`, nem destaque para "API indisponível". Um estado de erro só aparece como texto simples, sem diferença visual do estado normal.
- **Nenhuma identidade.** Esperado para esta fase (CONTEXT: identidade é da Fase 2). Não é penalizado como defeito deste esqueleto, mas a nota 2 se deve à falta de qualquer organização visual, não à falta de marca.
- **Ícones:** não há ícones nem botões só com ícone, então a regra de aria-label não se aplica.

### Pilar 3: Color (2/4)

- **Nenhuma paleta definida.** Não há `globals.css`, nem `tailwind`, nem variável de cor em `apps/web/package.json` (verificado por `grep`). Tudo herda o padrão do navegador.
- **Contraste.** Texto preto sobre fundo branco e link azul padrão atendem WCAG AA (o axe do E2E valida isso no CI). Não é falha de acessibilidade.
- **60/30/10:** não se aplica, não há paleta. Não há cor de destaque para avaliar.
- **Sem modo escuro.** O navegador pode aplicar `prefers-color-scheme` por conta própria, mas o site não declara `color-scheme`. Fica para a Fase 2.

### Pilar 4: Typography (2/4)

- **Uma família e nenhuma escala.** O corpo usa a fonte padrão do navegador (serif em muitos sistemas) e o `h1` usa o tamanho padrão de `h1`. Não há tamanho definido para `dd`, `dt` ou `code`.
- **Monoespaçado sem tratamento.** `<code data-testid="api-commit">` usa a fonte monoespaçada padrão do navegador, sem tamanho relativo definido.
- **Números.** `api-db-latency` e `api-time` não usam `tabular-nums`, então valores mudando a cada requisição podem "tremer" na tela.

### Pilar 5: Spacing (2/4)

- **Nenhuma escala.** Os espaçamentos são os padrões de `main`, `dl`, `dt`, `dd` e `a`. Não há classes nem variáveis de espaçamento.
- **Sem `max-width`.** Em 1440 px, o conteúdo ocupa a largura toda, o que deixa uma linha de dados muito longa. Não foi verificado visualmente (sem screenshot), mas o código não define limite.
- **Mobile, não verificado visualmente.** Em 375 px, o `<code>` de 40 caracteres é o item com maior risco de estourar a largura. Sem `word-break`, esse risco não é tratado.

### Pilar 6: Experience Design (3/4)

**Pontos fortes (verificados no código):**
- `getStatus` nunca lança, tem timeout de 5 s com corrida de promessa (`apps/web/lib/api.ts:35-50`) e degrada para `{ ok: false, reason }`.
- A página responde HTTP 200 mesmo com a API fora (`page.tsx:16-24`), conforme D-03. O E2E `@e2e API indisponível` cobre isso.
- `global-error.tsx` cobre o erro que escapa do layout raiz, com `Sentry.captureException` e link de volta.
- O toggle `Ver detalhes` / `Ocultar detalhes` é um `Link` (funciona sem JavaScript), e o E2E cobre o clique.
- `<html lang="pt-BR">` está correto (`layout.tsx:10`).
- `role="status"` no fallback (`page.tsx:20`) anuncia a mudança para leitores de tela.
- Axe WCAG 2.1 A/AA roda no CI nos três cenários (`apps/web/e2e/home.spec.ts`).
- Não há `dangerouslySetInnerHTML` (regra `react/no-danger` = error, SEC-03).

**Lacunas:**
- **Sem retry.** O fallback não tem link nem botão para tentar de novo. Como a Render dorme após 15 min, o primeiro acesso pode cair no fallback e o visitante fica sem saída além de recarregar à mão. Correção: link "Tentar novamente" para `/`.
- **Fallback não diz o que aconteceu.** O visitante não sabe se é temporário. Correção: uma frase curta ("A API pode estar iniciando; tente de novo em alguns minutos.").
- **Sem indicação de `config` ausente.** Se `API_URL` não estiver definida, `getStatus` devolve `reason: 'config'` e a página mostra o mesmo texto de indisponibilidade. Isso mascara erro de deploy como falha da API. Aceitável para o esqueleto, mas vale registrar.
- **`global-error` sem `reset`.** A página não oferece `reset()`, só o link para `/`. Para um esqueleto está aceitável.
- **Sem estado de carregamento.** Não é necessário porque a página é SSR com `force-dynamic`, e o timeout de 5 s limita a espera.

---

## Itens para a Fase 2 (não penalizados nesta fase)

- Identidade visual "No Law": cores, tipografia de marca, logotipo, favicon (ausente).
- `metadata.description` e Open Graph na home.
- Tema claro/escuro com `color-scheme` declarado.
- Sistema de tokens (espaçamento, tipografia, cor) que substitua o CSS mínimo proposto acima.

---

## Registry Safety

Não aplicável: não há `components.json` (shadcn não inicializado).

---

## Arquivos auditados

- `/home/jgui/Blog No Law/apps/web/app/page.tsx`
- `/home/jgui/Blog No Law/apps/web/app/layout.tsx`
- `/home/jgui/Blog No Law/apps/web/app/global-error.tsx`
- `/home/jgui/Blog No Law/apps/web/lib/api.ts`
- `/home/jgui/Blog No Law/apps/web/e2e/home.spec.ts`
- `/home/jgui/Blog No Law/apps/web/package.json`
- `/home/jgui/Blog No Law/packages/shared/src/status.ts`
- `/home/jgui/Blog No Law/.planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-CONTEXT.md`
- HTML de produção: `https://blog-no-law.vercel.app/` e `https://blog-no-law.vercel.app/?detail=full` (via curl)
- Gitignore de capturas: `/home/jgui/Blog No Law/.planning/ui-reviews/.gitignore` (criado e verificado; cobre `*.png` e `interaction/`)
