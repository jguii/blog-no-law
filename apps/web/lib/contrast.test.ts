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
