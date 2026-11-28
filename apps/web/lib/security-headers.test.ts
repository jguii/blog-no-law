import { describe, expect, it } from 'vitest';
import { NOINDEX_ROUTES, securityHeaders } from './security-headers';

// Contrato dos cabeçalhos do web (02-08). Cenários BDD: docs/bdd/kit.feature.md.
const PHASE_1_HEADERS = [
  ['X-Content-Type-Options', 'nosniff'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ['X-Frame-Options', 'DENY'],
  ['Permissions-Policy', 'camera=(), microphone=(), geolocation=()'],
] as const;

function headersOf(source: string): Record<string, string> {
  const rule = securityHeaders({ isDev: false }).find((item) => item.source === source);
  return Object.fromEntries((rule?.headers ?? []).map((header) => [header.key, header.value]));
}

describe('securityHeaders: cabeçalhos globais da Fase 1', () => {
  for (const [key, value] of PHASE_1_HEADERS) {
    it(`mantém ${key} em todas as rotas com o mesmo valor`, () => {
      expect(headersOf('/(.*)')[key] === value).toBe(true);
    });
  }
});

describe('securityHeaders: fora dos buscadores (D-22)', () => {
  it('NOINDEX_ROUTES são /kit e /status', () => {
    expect([...NOINDEX_ROUTES].join(',') === '/kit,/status').toBe(true);
  });

  for (const route of ['/kit', '/status']) {
    it(`${route} sai com X-Robots-Tag noindex`, () => {
      expect(headersOf(route)['X-Robots-Tag']?.includes('noindex') === true).toBe(true);
    });
  }

  it('as outras rotas não levam X-Robots-Tag', () => {
    expect('X-Robots-Tag' in headersOf('/(.*)')).toBe(false);
  });
});
