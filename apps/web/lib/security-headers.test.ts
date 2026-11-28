import { describe, expect, it } from 'vitest';
import { NOINDEX_ROUTES, buildCsp, securityHeaders } from './security-headers';

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

// A CSP v1 estática (RESEARCH R5): a mesma em toda resposta, sem nonce, sem curinga.
const DSN = 'https://chavepublica@o1.ingest.us.sentry.io/42';

type CspOptions = { isDev: boolean; sentryDsn?: string | undefined };

function directivesOf(csp: string): Map<string, string> {
  const entries = csp
    .split('; ')
    .map((part) => [part.split(' ')[0] ?? '', part.split(' ').slice(1).join(' ')] as const);
  return new Map(entries);
}

function directive(options: CspOptions, name: string): string {
  return directivesOf(buildCsp(options)).get(name) ?? '<ausente>';
}

describe('buildCsp: diretivas de produção', () => {
  const expected: [string, string][] = [
    ['default-src', "'self'"],
    ['script-src', "'self' 'unsafe-inline'"],
    ['style-src', "'self' 'unsafe-inline'"],
    ['img-src', "'self' data: blob:"],
    ['font-src', "'self'"],
    ['connect-src', "'self'"],
    ['object-src', "'none'"],
    ['base-uri', "'self'"],
    ['form-action', "'self'"],
    ['frame-ancestors', "'none'"],
  ];

  for (const [name, value] of expected) {
    it(`${name} é ${value}`, () => {
      expect(directive({ isDev: false }, name) === value).toBe(true);
    });
  }

  it('não tem unsafe-eval em produção', () => {
    expect(buildCsp({ isDev: false }).includes('unsafe-eval')).toBe(false);
  });

  it('não força https nas sub-requisições (o E2E roda em http://127.0.0.1)', () => {
    expect(buildCsp({ isDev: false }).includes('upgrade-insecure-requests')).toBe(false);
  });

  it('nenhuma origem tem curinga (*)', () => {
    expect(buildCsp({ isDev: false, sentryDsn: DSN }).includes('*')).toBe(false);
  });
});

describe('buildCsp: desenvolvimento', () => {
  it('acrescenta unsafe-eval só ao script-src', () => {
    const script = directive({ isDev: true }, 'script-src');
    expect(script === "'self' 'unsafe-inline' 'unsafe-eval'").toBe(true);
    expect(directive({ isDev: true }, 'style-src') === "'self' 'unsafe-inline'").toBe(true);
    expect(directive({ isDev: true }, 'connect-src') === "'self'").toBe(true);
  });
});

describe('buildCsp: origem do Sentry', () => {
  it('libera só a origem do DSN no connect-src', () => {
    const connect = directive({ isDev: false, sentryDsn: DSN }, 'connect-src');
    expect(connect === "'self' https://o1.ingest.us.sentry.io").toBe(true);
  });

  it('nunca escreve a chave pública do DSN no cabeçalho', () => {
    expect(buildCsp({ isDev: false, sentryDsn: DSN }).includes('chavepublica')).toBe(false);
  });

  for (const [rotulo, dsn] of [
    ['vazio', ''],
    ['ausente', undefined],
    ['inválido', 'isto não é uma URL'],
    ['http', 'http://chavepublica@o1.ingest.us.sentry.io/42'],
  ] as const) {
    it(`com DSN ${rotulo} o connect-src fica só em 'self'`, () => {
      expect(directive({ isDev: false, sentryDsn: dsn }, 'connect-src') === "'self'").toBe(true);
    });
  }
});

describe('securityHeaders: CSP em toda resposta', () => {
  it('o objeto global leva a Content-Security-Policy da produção', () => {
    expect(headersOf('/(.*)')['Content-Security-Policy'] === buildCsp({ isDev: false })).toBe(true);
  });

  it('repassa isDev e o DSN para a CSP', () => {
    const rule = securityHeaders({ isDev: true, sentryDsn: DSN }).find(
      (item) => item.source === '/(.*)',
    );
    const csp = rule?.headers.find((header) => header.key === 'Content-Security-Policy')?.value;
    expect(csp === buildCsp({ isDev: true, sentryDsn: DSN })).toBe(true);
  });

  it('o objeto global tem uma CSP não vazia', () => {
    expect((headersOf('/(.*)')['Content-Security-Policy'] ?? '').length > 0).toBe(true);
  });

  it('mantém os quatro cabeçalhos da Fase 1 ao lado da CSP', () => {
    const global = headersOf('/(.*)');
    expect(PHASE_1_HEADERS.every(([key, value]) => global[key] === value)).toBe(true);
  });

  it('a CSP não vai nas rotas noindex (o objeto global já cobre todas)', () => {
    expect('Content-Security-Policy' in headersOf('/kit')).toBe(false);
  });
});
