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

// Só a origem (`https://host`) do DSN público do Sentry: a chave do DSN fica de fora do cabeçalho.
// DSN ausente, inválido ou que não seja `https:` não libera nada (o navegador só fala com o próprio
// domínio).
function sentryOrigin(dsn: string | undefined): string | undefined {
  if (!dsn) return undefined;
  try {
    const url = new URL(dsn);
    return url.protocol === 'https:' ? url.origin : undefined;
  } catch {
    return undefined;
  }
}

// CSP v1 estática (RESEARCH R5): a mesma em toda resposta, para as páginas continuarem estáticas.
// Sem nonce porque o nonce por `proxy.ts` torna todas as rotas dinâmicas (RESEARCH Pattern 6); o
// aperto do `script-src` fica para a Fase 4, quando chega conteúdo de usuário. O `'unsafe-inline'`
// em `script-src` é o que o Next precisa sem nonce (scripts inline variáveis) e em `style-src`
// porque o SSR do React e o `next/image` emitem atributos `style`. Fontes e imagens só do próprio
// domínio: nenhum serviço de fora recebe o IP do visitante, além da hospedagem e do Sentry. Não há
// a diretiva que força a troca de `http` por `https` nas sub-requisições: o E2E roda em
// `http://127.0.0.1`, todos os recursos já são do próprio domínio e a Vercel só serve HTTPS.
export function buildCsp({ isDev = false, sentryDsn }: SecurityHeaderOptions = {}): string {
  const origin = sentryOrigin(sentryDsn);
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${origin ? ` ${origin}` : ''}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  return directives.join('; ');
}

export function securityHeaders(options: SecurityHeaderOptions = {}): HeaderRule[] {
  return [
    {
      source: '/(.*)',
      headers: [...BASE_HEADERS, { key: 'Content-Security-Policy', value: buildCsp(options) }],
    },
    ...NOINDEX_ROUTES.map((source) => ({
      source,
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
    })),
  ];
}
