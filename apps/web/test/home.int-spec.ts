import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { statusResponseSchema } from '@blog/shared/status';
import Home from '../app/page';

// Integração do web (QA-01): a home RSC de verdade -> lib/api.ts -> fetch real -> HTTP real
// em um servidor local de contrato -> statusResponseSchema real. Sem mock de fetch, de getStatus
// nem do contrato. Cenários BDD: docs/bdd/home.feature.md (tag @integration).

type Mode = 'valid' | 'out-of-contract' | 'unavailable';

interface Seen {
  method: string;
  url: string;
  accept: string;
}

let server: Server;
let baseUrl = '';
let mode: Mode = 'valid';
let seen: Seen[] = [];
const originalApiUrl = process.env.API_URL;

function handle(req: IncomingMessage, res: import('node:http').ServerResponse): void {
  const url = new URL(req.url ?? '/', 'http://contract.test');
  seen.push({
    method: req.method ?? '',
    url: `${url.pathname}${url.search}`,
    accept: String(req.headers.accept ?? ''),
  });

  if (mode === 'unavailable') {
    res
      .writeHead(503, { 'content-type': 'application/json' })
      .end(JSON.stringify({ error: 'down' }));
    return;
  }
  if (mode === 'out-of-contract') {
    res.writeHead(200, { 'content-type': 'application/json' }).end(
      JSON.stringify({
        service: 'api',
        version: '0.1.0',
        db: 'up',
        time: '2026-11-20T12:00:00.000Z',
      }),
    );
    return;
  }

  const payload = statusResponseSchema.parse({
    service: 'api',
    version: '0.1.0',
    commit: 'int-sha',
    db: 'up',
    time: '2026-11-20T12:00:00.000Z',
    ...(url.searchParams.get('detail') === 'full' ? { dbLatencyMs: 4 } : {}),
  });
  res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(payload));
}

async function renderHome(searchParams: { detail?: string } = {}): Promise<string> {
  return renderToStaticMarkup(await Home({ searchParams: Promise.resolve(searchParams) }));
}

beforeAll(async () => {
  server = createServer(handle);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  if (originalApiUrl === undefined) {
    delete process.env.API_URL;
  } else {
    process.env.API_URL = originalApiUrl;
  }
  if (server.listening) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

beforeEach(() => {
  mode = 'valid';
  seen = [];
  process.env.API_URL = baseUrl;
});

describe('home RSC contra o servidor de contrato', () => {
  it('mostra commit, banco e o link de detalhes quando a API responde dentro do contrato', async () => {
    const html = await renderHome();

    expect(html).toContain('data-testid="api-commit">int-sha<');
    expect(html).toContain('data-testid="api-db">up<');
    expect(html).toContain('href="/?detail=full"');
    expect(seen.length).toBe(1);
    expect(seen[0]?.method).toBe('GET');
    expect(seen[0]?.url).toBe('/status?detail=basic');
    expect(seen[0]?.accept).toBe('application/json');
  });

  it('repassa detail=full para a API e mostra a latência do banco', async () => {
    const html = await renderHome({ detail: 'full' });

    expect(seen[0]?.url).toBe('/status?detail=full');
    expect(html).toContain('data-testid="api-db-latency"');
  });

  it('degrada para "API indisponível" quando o JSON está fora do contrato', async () => {
    mode = 'out-of-contract';

    const html = await renderHome();

    expect(html).toContain('data-testid="api-unavailable"');
    expect(html).not.toContain('api-commit');
  });

  it('degrada para "API indisponível" quando a API devolve 503', async () => {
    mode = 'unavailable';

    const html = await renderHome();

    expect(html).toContain('data-testid="api-unavailable"');
  });

  it('degrada sem lançar quando a porta da API está fechada', async () => {
    const closed = createServer();
    await new Promise<void>((resolve) => closed.listen(0, '127.0.0.1', resolve));
    const closedPort = (closed.address() as AddressInfo).port;
    await new Promise<void>((resolve) => closed.close(() => resolve()));
    process.env.API_URL = `http://127.0.0.1:${closedPort}`;

    const html = await renderHome();

    expect(html).toContain('data-testid="api-unavailable"');
  });
});
