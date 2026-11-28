import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio, parseThemeBlocks } from './contrast';
import { CONTRAST_PAIRS, TOKENS, type TokenScope } from './tokens';

// O contrato lê o CSS que o navegador recebe: o que vale é o `app/globals.css`, não o `tokens.ts`.
const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const blocks = parseThemeBlocks(css);

const SCOPES: readonly TokenScope[] = ['light', 'dark', 'faixa'];
const RED = '#ac020f';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

describe('contrastRatio', () => {
  it('dá 9,84 para o dourado sobre o preto da faixa', () => {
    expect(round2(contrastRatio('#d3aa82', '#000000'))).toBe(9.84);
  });

  it('dá 2,77 para o vermelho da marca sobre o preto (por isso nunca é texto no escuro)', () => {
    expect(round2(contrastRatio('#ac020f', '#000000'))).toBe(2.77);
  });

  it('dá 7,58 para o texto branco sobre o vermelho do botão', () => {
    expect(round2(contrastRatio('#ffffff', '#ac020f'))).toBe(7.58);
  });

  it('não depende da ordem dos argumentos', () => {
    expect(contrastRatio('#000000', '#d3aa82')).toBe(contrastRatio('#d3aa82', '#000000'));
  });
});

describe.each(SCOPES)('tokens do escopo %s em globals.css', (scope) => {
  it.each(Object.entries(TOKENS[scope]))('--%s tem o mesmo hex de tokens.ts', (name, hex) => {
    expect(blocks[scope][name]?.toLowerCase()).toBe(hex.toLowerCase());
  });
});

describe('pares de contraste WCAG AA', () => {
  it.each(CONTRAST_PAIRS.map((pair) => [pair.scope, pair.fg, pair.bg, pair.min] as const))(
    '%s: --%s sobre --%s chega a %s:1',
    (scope, fg, bg, min) => {
      const fgHex = blocks[scope][fg];
      const bgHex = blocks[scope][bg];
      expect(fgHex, `--${fg} existe em ${scope}`).toBeDefined();
      expect(bgHex, `--${bg} existe em ${scope}`).toBeDefined();
      expect(contrastRatio(fgHex!, bgHex!)).toBeGreaterThanOrEqual(min);
    },
  );
});

describe('o vermelho da marca nunca é texto, link, borda nem foco no escuro e na faixa', () => {
  it.each(['dark', 'faixa'] as const)('no escopo %s', (scope) => {
    for (const name of ['foreground', 'link', 'ring', 'border']) {
      expect(blocks[scope][name]?.toLowerCase(), `--${name} em ${scope}`).not.toBe(RED);
    }
  });
});

// Corpo do bloco `{ ... }` que abre no primeiro trecho de `css` casado por `header`.
// Conta as chaves para atravessar `@media` e `@keyframes` aninhados.
function blockOf(header: RegExp): string | undefined {
  const start = header.exec(css);
  if (!start) return undefined;
  let depth = 1;
  let index = start.index + start[0].length;
  const from = index;
  while (index < css.length && depth > 0) {
    if (css[index] === '{') depth += 1;
    if (css[index] === '}') depth -= 1;
    index += 1;
  }
  return css.slice(from, index - 1);
}

// Devolve um booleano para a asserção usar uma mensagem de uma linha: um `toContain` sobre o CSS
// inteiro despejaria o arquivo todo no relatório de teste.
function has(text: string, pattern: string | RegExp): boolean {
  return typeof pattern === 'string' ? text.includes(pattern) : pattern.test(text);
}

describe('contrato do CSS global', () => {
  it.each([
    'text-label',
    'text-body',
    'text-heading',
    'text-display',
    'bg-brand',
    'bg-brand-button',
    'shadow-folha',
    'shadow-botao',
  ])('declara o utilitário %s', (name) => {
    expect(has(css, `@utility ${name} {`), `@utility ${name} declarado`).toBe(true);
  });

  it('dá 52px ao text-display a partir de 768px e 36px abaixo', () => {
    const display = blockOf(/@utility text-display \{/) ?? '';
    expect(has(display, '36px'), 'text-display tem 36px').toBe(true);
    expect(has(display, '52px'), 'text-display tem 52px').toBe(true);
    expect(has(display, '768px'), 'text-display muda em 768px').toBe(true);
  });

  it.each(['--brand-gradient', '--brand-gradient-button', '--gold', '--wood'])(
    'declara a variável de marca %s',
    (name) => {
      expect(has(css, new RegExp(`${name}\\s*:`)), `variável ${name} declarada`).toBe(true);
    },
  );

  it('declara a animação do brilho do emblema com os quadros', () => {
    expect(has(css, /--animate-brilho\s*:/), '--animate-brilho declarada').toBe(true);
    expect(has(css, '@keyframes brilho'), '@keyframes brilho declarado').toBe(true);
  });

  it('zera transições e animações com prefers-reduced-motion: reduce', () => {
    const reduced = blockOf(/@media \(prefers-reduced-motion: reduce\)\s*\{/) ?? '';
    expect(has(reduced, /transition-duration:\s*0s/), 'transition-duration zerada').toBe(true);
    expect(has(reduced, /animation-duration:\s*0s/), 'animation-duration zerada').toBe(true);
  });

  it('põe h1 e h2 na fonte de título, sem negrito sintético e com text-wrap: balance', () => {
    const headings = blockOf(/h1,\s*h2\s*\{/) ?? '';
    expect(has(headings, 'font-synthesis: none'), 'h1, h2 sem negrito sintético').toBe(true);
    expect(has(headings, 'text-wrap: balance'), 'h1, h2 com text-wrap balance').toBe(true);
  });

  it('desenha o foco com o anel --ring de 2px e afastamento de 2px', () => {
    expect(has(css, /outline:\s*2px solid var\(--ring\)/), 'outline de 2px na cor --ring').toBe(
      true,
    );
    expect(has(css, /outline-offset:\s*2px/), 'outline-offset de 2px').toBe(true);
  });

  it('põe a textura de papel só no claro, atrás do conteúdo e sem capturar clique', () => {
    const base = blockOf(/body::before\s*\{/) ?? '';
    expect(has(base, 'pointer-events: none'), 'textura sem pointer-events').toBe(true);
    expect(has(base, /z-index:\s*-1/), 'textura atrás do conteúdo').toBe(true);
    expect(has(base, 'display: none'), 'textura escondida por padrão').toBe(true);
    const light = blockOf(/\[data-theme='light'\] body::before\s*\{/) ?? '';
    expect(has(light, 'display: block'), 'textura visível no claro').toBe(true);
  });

  it('não carrega recurso de outro domínio por url()', () => {
    const external = [...css.matchAll(/url\(\s*['"]?\s*(?:https?:)?\/\//gi)].map((hit) => hit[0]);
    expect(external).toEqual([]);
  });
});
