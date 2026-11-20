import { describe, expect, it } from 'vitest';
import { statusResponseSchema } from '@blog/shared/status';
import { getStatus, type StatusResult } from './api';

const validPayload = statusResponseSchema.parse({
  service: 'api',
  version: '0.1.0',
  commit: 'abc1234',
  db: 'up',
  time: '2026-11-20T12:00:00.000Z',
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

// Resumo de uma linha, para o relatório de teste nunca carregar objetos multilinha.
function reasonOf(result: StatusResult): string {
  return result.ok ? 'ok' : result.reason;
}

describe('getStatus', () => {
  it('devolve config quando a URL da API não está definida', async () => {
    const result = await getStatus('basic', { baseUrl: undefined });
    expect(reasonOf(result)).toBe('config');
  });

  it('devolve os dados e chama /status?detail=basic com payload válido', async () => {
    let calledUrl = '';
    const fetchImpl = (async (input: RequestInfo | URL) => {
      calledUrl = String(input);
      return jsonResponse(validPayload);
    }) as typeof fetch;

    const result = await getStatus('basic', { baseUrl: 'http://api.test', fetchImpl });

    expect(reasonOf(result)).toBe('ok');
    expect(calledUrl.endsWith('/status?detail=basic')).toBe(true);
  });

  it('chama /status?detail=full quando o detalhe é full', async () => {
    let calledUrl = '';
    const fetchImpl = (async (input: RequestInfo | URL) => {
      calledUrl = String(input);
      return jsonResponse(validPayload);
    }) as typeof fetch;

    await getStatus('full', { baseUrl: 'http://api.test', fetchImpl });

    expect(calledUrl.endsWith('/status?detail=full')).toBe(true);
  });

  it('pede JSON sem cache e com sinal de timeout', async () => {
    let accept = '';
    let cache = '';
    let hasSignal = false;
    const fetchImpl = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      accept = new Headers(init?.headers).get('accept') ?? '';
      cache = init?.cache ?? '';
      hasSignal = init?.signal instanceof AbortSignal;
      return jsonResponse(validPayload);
    }) as typeof fetch;

    await getStatus('basic', { baseUrl: 'http://api.test', fetchImpl });

    expect(accept).toBe('application/json');
    expect(cache).toBe('no-store');
    expect(hasSignal).toBe(true);
  });

  it('trata HTTP 503 como http', async () => {
    const fetchImpl = (async () => jsonResponse({ error: 'down' }, 503)) as typeof fetch;
    const result = await getStatus('basic', { baseUrl: 'http://api.test', fetchImpl });
    expect(reasonOf(result)).toBe('http');
  });

  it('trata JSON sem commit como invalid', async () => {
    const semCommit = Object.fromEntries(Object.entries(validPayload).filter(([chave]) => chave !== 'commit'));
    const fetchImpl = (async () => jsonResponse(semCommit)) as typeof fetch;
    const result = await getStatus('basic', { baseUrl: 'http://api.test', fetchImpl });
    expect(reasonOf(result)).toBe('invalid');
  });

  it('trata corpo que não é JSON como invalid', async () => {
    const fetchImpl = (async () => new Response('<html>oops</html>', { status: 200 })) as typeof fetch;
    const result = await getStatus('basic', { baseUrl: 'http://api.test', fetchImpl });
    expect(reasonOf(result)).toBe('invalid');
  });

  it('trata erro TimeoutError como timeout', async () => {
    const fetchImpl = (async () => {
      throw new DOMException('The operation timed out.', 'TimeoutError');
    }) as typeof fetch;
    const result = await getStatus('basic', { baseUrl: 'http://api.test', fetchImpl });
    expect(reasonOf(result)).toBe('timeout');
  });

  it('trata TypeError fetch failed como network', async () => {
    const fetchImpl = (async () => {
      throw new TypeError('fetch failed');
    }) as typeof fetch;
    const result = await getStatus('basic', { baseUrl: 'http://api.test', fetchImpl });
    expect(reasonOf(result)).toBe('network');
  });

  it('termina em menos de 1 s com timeout quando o fetch nunca resolve', async () => {
    const fetchImpl = (() => new Promise<Response>(() => {})) as typeof fetch;
    const started = Date.now();

    const result = await getStatus('basic', { baseUrl: 'http://api.test', fetchImpl, timeoutMs: 50 });

    expect(reasonOf(result)).toBe('timeout');
    expect(Date.now() - started).toBeLessThan(1000);
  });
});
