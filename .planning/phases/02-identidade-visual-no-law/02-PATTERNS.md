# Fase 2: Identidade visual No Law - Mapa de padrões

**Mapeado:** 2026-11-27
**Arquivos analisados:** 41 (novos e modificados)
**Análogos encontrados:** 14 com análogo direto ou parcial / 41. A fase é a primeira com UI de verdade: quase tudo de componente, CSS e ativo não tem análogo (ver "Sem análogo"). O que existe de análogo é a casca do Phase 1 (layout, página RSC, global-error, testes, gates).

Todos os análogos abaixo são git-tracked (conferido com `git ls-files`) e ficam em `apps/web/` ou `scripts/`. Nenhum é espelho gitignored.

## Classificação dos arquivos

| Arquivo novo/modificado | Papel | Fluxo de dados | Análogo mais próximo | Qualidade |
|---|---|---|---|---|
| `apps/web/app/layout.tsx` (mod.) | layout/config | request-response (estático) | ele mesmo (`apps/web/app/layout.tsx`) | exato (evolução) |
| `apps/web/app/globals.css` (novo) | config (tokens) | transform | nenhum | sem análogo |
| `apps/web/lib/fonts.ts` (novo) | utilitário | transform | nenhum (convenção `lib/` de `lib/api.ts`) | parcial |
| `apps/web/lib/utils.ts` (`cn`) (novo) | utilitário | transform | `apps/web/lib/api.ts` (estilo de módulo) | parcial |
| `apps/web/app/page.tsx` (mod.: vira a capa) | página RSC | request-response | `apps/web/app/page.tsx` (atual) | exato (estrutura) |
| `apps/web/app/status/page.tsx` (novo, move a home atual) | página RSC | request-response | `apps/web/app/page.tsx` (atual) | exato |
| `apps/web/app/sobre/page.tsx`, `regras/page.tsx`, `privacidade/page.tsx` (novos) | página RSC estática | request-response | `apps/web/app/page.tsx` (casca `<main>`/`<h1>`) | parcial |
| `apps/web/app/kit/page.tsx` (novo) | página RSC estática | request-response | idem | parcial |
| `apps/web/app/not-found.tsx` (novo) | página RSC | request-response | `apps/web/app/global-error.tsx` | parcial |
| `apps/web/app/global-error.tsx` (mod.) | componente cliente de erro | event-driven (useEffect/Sentry) | ele mesmo | exato (evolução) |
| `apps/web/app/icon.svg`, `icon1.png`, `favicon.ico`, `apple-icon.png`, `opengraph-image.jpg` + `.alt.txt` (novos) | ativo | file-I/O | nenhum | sem análogo |
| `apps/web/components/ui/button.tsx`, `card.tsx` (novos) | componente | transform | nenhum (shadcn) | sem análogo |
| `apps/web/components/site-header.tsx`, `site-footer.tsx`, `prose.tsx`, `dragon-mark.tsx`, `icons.tsx`, `ornaments/*` (novos) | componente (servidor) | transform | `apps/web/app/page.tsx` (JSX RSC) | parcial |
| `apps/web/components/mobile-menu.tsx`, `theme-toggle.tsx` (novos, client) | componente cliente | event-driven | `apps/web/app/global-error.tsx` (`'use client'` + `useEffect`) | parcial |
| `apps/web/next.config.ts` (mod.: CSP, `X-Robots-Tag` do `/kit`) | config | request-response | ele mesmo | exato |
| `apps/web/package.json`, `tsconfig.json` (mod.: `paths`, deps) | config | n/a | eles mesmos | exato |
| `apps/web/components.json` (novo) | config | n/a | nenhum | sem análogo |
| `apps/web/lib/contrast.test.ts` (novo) | teste unit | transform | `apps/web/lib/api.test.ts` | exato (papel/projeto `unit`) |
| `apps/web/lib/*.test.ts` de ativos (dimensões, ICO) (novos) | teste unit | file-I/O | `apps/web/lib/sentry-init.test.ts` (padrão de teste de contrato) | parcial |
| `apps/web/test/*.int-spec.ts` (páginas estáticas, `/status`, 404) (novos/mod.) | teste int | request-response | `apps/web/test/home.int-spec.ts` | exato |
| `apps/web/e2e/*.spec.ts` (tema, menu, axe nos 2 temas, overflow, CSP) (novos/mod.) | teste e2e | request-response | `apps/web/e2e/home.spec.ts` | exato |
| `apps/web/e2e/home.spec.ts` (mod.: rotas movem para `/status`) | teste e2e | request-response | ele mesmo | exato |
| `apps/web/test/home.int-spec.ts` (mod.: importa `app/status/page`) | teste int | request-response | ele mesmo | exato |
| `docs/bdd/*.feature.md` (novos: identidade, tema, navegação) | spec BDD | n/a | `docs/bdd/home.feature.md` | exato |
| `scripts/brand/generate.mjs` (novo) | script | file-I/O/batch | `scripts/check-no-raw-html.mjs` (estilo de script Node) | parcial |
| `scripts/brand/*.test.mjs` (novo) | teste node:test | file-I/O | `scripts/check-no-raw-html.test.mjs` | exato |
| `.planning/PROJECT.md` (correção "10+ anos", D-05) | doc | n/a | n/a | n/a |

## Atribuições de padrão

### `apps/web/app/layout.tsx` (layout raiz, mod.)

**Análogo:** ele mesmo (`apps/web/app/layout.tsx`, 14 linhas).

**Estado atual a evoluir** (linhas 1-14):
```tsx
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Blog No Law',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
```
Convenções a manter: `import type` separado, props tipadas inline com `ReactNode`, `lang="pt-BR"`, export `metadata` tipado como `Metadata`. A fase acrescenta `data-theme="dark"`, `suppressHydrationWarning`, import de `./globals.css`, classes das fontes (`lib/fonts.ts`), `<script>` de tema com **texto filho** (nunca a prop de HTML bruto, o gate `scripts/check-no-raw-html.mjs` reprova até comentário com o nome dela), `SiteHeader`/`SiteFooter`, `<main id="conteudo">`, link "Pular para o conteúdo", `export const viewport` com `themeColor: '#000000'`, `metadataBase`, `title.template`, `openGraph`. Não ler `cookies()`/`headers()` no layout (páginas devem continuar estáticas).

**Comentários:** o repo escreve comentários em pt-BR explicando o "porquê" (ex.: `// A home é montada a cada requisição: ...`). Manter.

---

### `apps/web/app/status/page.tsx` (novo) e `apps/web/app/page.tsx` (vira capa)

**Análogo:** `apps/web/app/page.tsx` atual. O arquivo inteiro move para `app/status/page.tsx`; a capa é um novo `app/page.tsx` estático.

**Imports e `force-dynamic`** (linhas 1-9):
```tsx
import Link from 'next/link';
import { getStatus } from '../lib/api';

// A home é montada a cada requisição: o status da API muda o tempo todo.
export const dynamic = 'force-dynamic';

interface HomeProps {
  searchParams: Promise<{ detail?: string | string[] }>;
}
```
Ao mover, o import relativo passa a `'../../lib/api'` (ou alias `@/lib/api` depois de criar `paths` no `tsconfig.json`; a UI-SPEC manda criar `paths: {"@/*": ["./*"]}` antes). Renomear `HomeProps`/`Home` para `StatusProps`/`StatusPage`. `searchParams` continua `Promise` (Next 16).

**Núcleo e degradação** (linhas 11-25, 27-58): manter exatamente a lógica `detail === 'full' ? 'full' : 'basic'`, o `if (!result.ok)` com `role="status"` e todos os `data-testid` (`api-commit`, `api-db`, `api-time`, `api-db-latency`, `api-unavailable`). Mudanças pedidas pela UI-SPEC: envolver em `Card`, `h1` "Status do serviço" (P9), `dl` em 2 colunas, texto de erro `API indisponível no momento` mantido literal (o e2e compara com `toHaveText`) mais a frase "A API pode estar iniciando..." e link "Recarregar status" para `/status`; links "Ver detalhes"/"Ocultar detalhes" passam a apontar para `/status?detail=full` e `/status`. `metadata = { robots: { index: false, follow: false } }`. Sem `<main>` próprio: o layout agora provê `<main id="conteudo">`.

**A capa (`app/page.tsx`)** não tem análogo de conteúdo; só segue a casca: função `export default function Home()` sem `async`, sem chamar `lib/api` (D-06), e sem `export const dynamic`.

---

### `apps/web/app/global-error.tsx` (mod.)

**Análogo:** ele mesmo.

**Padrão a preservar** (linhas 1-24):
```tsx
'use client';

import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <main>
          <h1>Algo deu errado</h1>
          <Link href="/">Voltar para a página inicial</Link>
        </main>
      </body>
    </html>
  );
}
```
Evoluir para: `import './globals.css'`, `<html lang="pt-BR" data-theme="dark" className={...fonte}>`, mesmo script de tema (texto filho), card com `h1` Display, texto "Tivemos um problema do nosso lado. Tente de novo em instantes.", link "Voltar para a página inicial". Mantém o `useEffect` com `Sentry.captureException` e `<html>/<body>` próprios (não herda o layout). Sem `metadata` (cliente): usar `<title>` do React. Não mostrar detalhe técnico do erro ao visitante.

**`app/not-found.tsx`** copia a mesma casca (card central, `h1` Display, CTA "Voltar para o início" via `buttonVariants()` em `next/link`), mas é componente de servidor (sem `'use client'`, sem Sentry) e herda o layout.

---

### `apps/web/next.config.ts` (mod.: CSP e `X-Robots-Tag`)

**Análogo:** ele mesmo, bloco `headers()` (linhas 8-20).
```ts
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ];
},
```
Acrescentar `{ key: 'Content-Security-Policy', value: csp }` no mesmo array, com `csp` montado como no RESEARCH Pattern 6 (`02-RESEARCH.md` linhas 496-520: `default-src 'self'`, `script-src 'self' 'unsafe-inline'` (+ `'unsafe-eval'` só em dev), `style-src 'self' 'unsafe-inline'`, `img-src 'self' data: blob:`, `font-src 'self'`, `connect-src` derivado de `NEXT_PUBLIC_SENTRY_DSN`, `frame-ancestors 'none'` etc.). Para o `/kit`, um segundo objeto `{ source: '/kit', headers: [{ key: 'X-Robots-Tag', value: 'noindex' }] }`. Manter o wrapper `withSentryConfig(nextConfig, {...})` (linhas 23-32) intacto e o comentário sobre `@sentry/nextjs/config`. Fonte `Geist`/`next/font/google` self-hosted pelo Next: `font-src 'self'` basta.

---

### `apps/web/lib/fonts.ts` e `apps/web/lib/utils.ts` (novos, utilitários)

**Análogo parcial:** `apps/web/lib/api.ts` (módulo único com responsabilidade única, comentários pt-BR, exports nomeados, sem `default`). `lib/fonts.ts` é o **único** módulo que chama `next/font/google` (Yuji Boku 400 `latin`; Atkinson Hyperlegible Next variável). `lib/utils.ts` exporta `cn` (fallback sem pacote se o autor negar `clsx`/`tailwind-merge`, conforme a Matriz de pacotes da UI-SPEC e D-23 do CONTEXT).

Não há trecho de código do repo a copiar além da convenção; usar a UI-SPEC e o RESEARCH para o conteúdo.

---

### Componentes (`components/**`)

**Análogo parcial:** JSX RSC de `app/page.tsx` (dl/dt/dd, `Link` do `next/link`, `data-testid` só quando um teste precisa). Regras vindas do repo e do contrato:
- Servidor por padrão; só `MobileMenu` e `ThemeToggle` levam `'use client'` (padrão de `global-error.tsx`, linhas 1-5).
- Ornamentos e SVG como componentes JSX (`aria-hidden`), nunca via a prop de HTML bruto (ESLint `react/no-danger: 'error'` em `eslint.config.mjs` linhas 17-21 e o gate `scripts/check-no-raw-html.mjs`).
- Sem `style={{}}` (CSP), sem `100vw`/`w-screen`.
- `Link` interno sempre com `next/link`; link com cara de botão = `buttonVariants()` aplicado em `Link` (sem `asChild`).
- Import relativo hoje (`'../lib/api'`); depois do `paths` use `@/...`.

---

### `apps/web/lib/contrast.test.ts` (novo, unit)

**Análogo:** `apps/web/lib/api.test.ts` (projeto `unit` do Vitest: `include: ['lib/**/*.test.ts']`, `environment: 'node'`, `globals: true`).

**Imports e estilo** (api.test.ts linhas 1-4, 17-20):
```ts
import { describe, expect, it } from 'vitest';
import { statusResponseSchema } from '@blog/shared/status';
import { getStatus, type StatusResult } from './api';

// Resumo de uma linha, para o relatório de teste nunca carregar objetos multilinha.
function reasonOf(result: StatusResult): string {
  return result.ok ? 'ok' : result.reason;
}
```
O teste lê `app/globals.css` (por `node:fs`/`node:path`, caminho relativo ao arquivo), extrai os tokens hex de `:root`, `[data-theme='dark']` e `.faixa`, calcula a luminância relativa e verifica os pares obrigatórios da UI-SPEC (seção "Contraste WCAG", linhas 195-220). Cada `it` com nome descritivo em pt-BR. Mensagens de falha curtas (uma linha).

**Testes de ativos** (dimensões, ICO com PNG embutido): mesmo projeto `unit` e mesma estrutura; podem usar `sharp` (devDependency já aprovada) para ler metadata. Seguir o estilo de `lib/sentry-init.test.ts`: `describe` por área e `vi.resetModules()` só se importar módulo com efeito colateral.

---

### `apps/web/test/*.int-spec.ts` (integração do web)

**Análogo:** `apps/web/test/home.int-spec.ts`. Projeto `int` (`include: ['test/**/*.int-spec.ts']`, `testTimeout: 15000`).

**Imports e render de RSC** (linhas 1-6, 63-65):
```ts
import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { statusResponseSchema } from '@blog/shared/status';
import Home from '../app/page';

async function renderHome(searchParams: { detail?: string } = {}): Promise<string> {
  return renderToStaticMarkup(await Home({ searchParams: Promise.resolve(searchParams) }));
}
```
**Mudança obrigatória:** trocar `import Home from '../app/page'` por `import StatusPage from '../app/status/page'` e as asserções `href="/?detail=full"` (linha 96) por `href="/status?detail=full"`. Servidor de contrato real (sem mock de `fetch`), `process.env.API_URL` salvo/restaurado em `beforeAll`/`afterAll`/`beforeEach` (linhas 24, 73-88): reaproveitar tal qual.

Para páginas estáticas (`/sobre`, `/regras`, `/privacidade`) e a capa: `renderToStaticMarkup(<Page />)` sem servidor de contrato, afirmando textos exatos da UI-SPEC, um único `h1`, e (Privacidade) a ausência de "LGPD" e "cookie" (P7). A capa deve ser afirmada **sem** chamada à API (nenhuma requisição ao servidor de contrato).

---

### `apps/web/e2e/*.spec.ts` (Playwright + axe, só na CI)

**Análogo:** `apps/web/e2e/home.spec.ts`.

**Helper axe a reutilizar** (linhas 1-16; extrair para um módulo compartilhado `e2e/helpers.ts` ou copiar):
```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function expectNoAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(
    results.violations.map((violation) => violation.id),
    'violações de acessibilidade (WCAG 2.1 A/AA) encontradas pelo axe',
  ).toEqual([]);
}
```
**Convenção de nome:** `test('@e2e <nome do cenário BDD>', ...)`, o nome é o do cenário em `docs/bdd/*.feature.md`.

**Degradado** (linhas 38-49): a porta `3202` (`DEGRADED_URL = 'http://127.0.0.1:3202/'`) deve mudar para `.../status`; a asserção `response?.status()` 200 e `toHaveText('API indisponível no momento')` ficam. `Ver detalhes` espera `toHaveURL('/status?detail=full')`. Testes novos a escrever neste mesmo arquivo/estilo: axe nas rotas `/`, `/sobre`, `/regras`, `/privacidade`, `/kit`, `/status` nos dois temas e em viewport de celular (`page.setViewportSize`), `scrollWidth <= innerWidth` em 320/375/412, persistência do tema via `localStorage['nl-theme']`, menu ☰ (Esc devolve foco), console sem violação de CSP. Configuração do servidor em `apps/web/playwright.config.ts` (web em `3200`, degradado em `3202`, só Chromium): sem mudança prevista, salvo se for necessário `colorScheme`/viewport por projeto.

---

### `docs/bdd/*.feature.md` (novos)

**Análogo:** `docs/bdd/home.feature.md`. Estrutura: título `# Funcionalidade: ...`, parágrafo "Escrita antes dos testes (BDD)" listando as tags e onde cada uma roda, bloco "Como... Quero... Para...", e `## Cenário: ...` com `Tags:` e linhas **Dado/Quando/Então/E** em negrito. Escrever antes dos testes (RED). Atualizar `home.feature.md` para refletir `/status` (e as tags de `@integration`/`@e2e` apontando para os novos arquivos).

---

### `scripts/brand/generate.mjs` e seu teste (novos)

**Análogo:** `scripts/check-no-raw-html.mjs` (script Node ESM com cabeçalho de uso, só módulos `node:` + `sharp`, `parseArgs`, saída determinística) e seu teste `scripts/check-no-raw-html.test.mjs` (`node:test` + `node:assert/strict`, `spawnSync(process.execPath, [script, ...args], { cwd: repoRoot, encoding: 'utf8', timeout: 20000 })`, dir temporário com `fs.mkdtempSync` e `fs.rmSync` no `finally`).

**Cabeçalho e raiz do repo** (check-no-raw-html.mjs linhas 1-14):
```js
#!/usr/bin/env node
// Gate de HTML bruto (SEC-03): ...
// Uso: node scripts/check-no-raw-html.mjs [--root DIR] [--allowlist FILE]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
```
(em `scripts/brand/` o `..` vira `'..', '..'`). Rodado à mão, saídas versionadas. Se o teste do script ficar em `scripts/`, conferir como `scripts/ci-gates.test.mjs` descobre os testes `.test.mjs` para a CI/pre-push.

---

## Padrões compartilhados

### Gate de HTML bruto e CSP
**Fonte:** `apps/web/eslint.config.mjs` (linhas 17-21, regra `'react/no-danger': 'error'`) e `scripts/check-no-raw-html.mjs`.
**Aplica a:** todo arquivo `.ts/.tsx/.mjs/.mdx` em `apps/web`.
O gate varre também comentários e strings, então nenhum arquivo pode conter o identificador da prop proibida (a UI-SPEC manda escrever "a prop de HTML bruto"). `scripts/raw-html-allowlist.json` deve continuar vazia. O script de tema entra como `<script>{codigoComoTexto}</script>`.

### Estilo de teste (TDD/BDD)
**Fonte:** `apps/web/vitest.config.ts` (projetos `unit` = `lib/**/*.test.ts`, `int` = `test/**/*.int-spec.ts`) e `apps/web/package.json` (scripts `test`, `test:integration`, `test:e2e`).
**Aplica a:** todo teste novo. Nomes de `it`/`test` em pt-BR, RED antes de GREEN, sem mock de rede nos testes de integração (servidor HTTP real em `127.0.0.1`).

### Convenções de código
**Fonte:** `apps/web/tsconfig.json` (`strict`, `moduleResolution: bundler`, `jsx: react-jsx`, sem `paths` ainda) e Prettier (`singleQuote`, `printWidth: 100`).
**Aplica a:** tudo. Ao rodar `shadcn init`, revisar o diff: o CLI reescreve `app/layout.tsx` e `app/globals.css`, traz Geist e põe `shadcn` em `dependencies` (a UI-SPEC manda `devDependencies`). Versões **exatas** no `package.json` (sem `^`), como as de hoje.

### Erros e degradação
**Fonte:** `apps/web/app/page.tsx` (linhas 16-25) e `apps/web/lib/api.ts`. A página nunca lança por falha da API: devolve 200 com o estado de erro. Manter em `/status`.

### Pacotes (D-23)
Só entram os pacotes aprovados no CONTEXT D-23; para qualquer um negado, usar o fallback da Matriz de pacotes (UI-SPEC linhas 72-86). `sharp` só como `devDependency`.

## Sem análogo

Planejador deve usar `02-RESEARCH.md` e `02-UI-SPEC.md` (e o skill `sketch-findings-blog-no-law`) no lugar de código existente:

| Arquivo | Papel | Fluxo | Motivo |
|---|---|---|---|
| `apps/web/app/globals.css` (tokens, tema, `@custom-variant dark`, pétalas, movimento) | config/estilo | transform | Não há Tailwind, CSS nem `public/` no web hoje |
| `apps/web/postcss.config.mjs` | config | transform | Tailwind 4 ainda não instalado |
| `apps/web/components.json`, `components/ui/button.tsx`, `card.tsx` | componente | transform | shadcn ainda não inicializado (`shadcn_initialized: false`) |
| `apps/web/components/dragon-mark.tsx`, `ornaments/*`, `icons.tsx` | componente SVG | transform | Arte nova, desenhada à mão |
| `apps/web/components/theme-toggle.tsx`, `mobile-menu.tsx` | componente cliente | event-driven | Nenhum estado de cliente existe além de `global-error.tsx`; usar o RESEARCH Pattern 1 (tema) e a UI-SPEC (disclosure) |
| `apps/web/public/brand/*`, `app/icon.svg`, `icon1.png`, `favicon.ico`, `apple-icon.png`, `opengraph-image.jpg` | ativo binário | file-I/O | Não há ativos; gerados a partir de `assets/brand/Logo No Law.jpg` e `Banner No Law.jpg` (ambos tracked) |
| Testes visuais/overflow/CSP no e2e | teste | request-response | Só o axe existe hoje; seguir o esqueleto de `e2e/home.spec.ts` |

## Metadados

**Escopo de busca de análogos:** `apps/web/{app,lib,test,e2e}`, `apps/web/*.{ts,mjs,json}`, `scripts/`, `docs/bdd/`, `assets/brand/`.
**Arquivos lidos:** 18 (app/layout, page, global-error; lib/api.test, sentry-init.test; test/home.int-spec; e2e/home.spec; vitest/eslint/next/playwright config; package.json, tsconfig; scripts/check-no-raw-html(.test).mjs; docs/bdd/home.feature.md; UI-SPEC; CONTEXT e RESEARCH por trechos).
**Data da extração:** 2026-11-27
