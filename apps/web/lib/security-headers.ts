// Cabeçalhos HTTP do web, num módulo à parte para o Vitest conseguir testá-los. O `next.config.ts`
// o importa com extensão `.ts` explícita: o Next carrega a config pelo resolvedor TypeScript nativo
// do Node, então este arquivo só pode ter sintaxe TypeScript apagável (sem `enum` nem `namespace`).

export type SecurityHeaderOptions = {
  isDev?: boolean;
  sentryDsn?: string | undefined;
};

export type HeaderRule = {
  source: string;
  headers: { key: string; value: string }[];
};

// `/kit` e `/status` continuam públicos, mas ficam fora dos buscadores (D-22): a meta `robots` da
// página e este cabeçalho dizem a mesma coisa por dois caminhos.
export const NOINDEX_ROUTES = ['/kit', '/status'] as const;

// Os quatro cabeçalhos da Fase 1, com os mesmos valores.
const BASE_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

export function securityHeaders(options: SecurityHeaderOptions = {}): HeaderRule[] {
  void options;
  return [
    { source: '/(.*)', headers: [...BASE_HEADERS] },
    ...NOINDEX_ROUTES.map((source) => ({
      source,
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
    })),
  ];
}

// Esqueleto do RED (02-08, Task 3): a CSP real entra no commit GREEN.
export function buildCsp(options: SecurityHeaderOptions): string {
  void options;
  return '';
}
