import { spawn, type ChildProcess } from 'node:child_process';
import { createServer as createHttpServer, type Server } from 'node:http';
import { createServer as createNetServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { Writable } from 'node:stream';
import { gunzipSync } from 'node:zlib';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { loadEnv } from '../src/config/env.js';

const API_ROOT = fileURLToPath(new URL('..', import.meta.url));

async function createApp(overrides: Record<string, string> = {}): Promise<NestExpressApplication> {
  const env = loadEnv({ GIT_SHA: 'testsha0107', NODE_ENV: 'test', ...overrides });
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule.forRoot(env, { logDestination: new Writable({ write: (_chunk, _encoding, done) => done() }) })],
  }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>();
  configureApp(app, env);
  await app.init();
  return app;
}

describe('Rota de diagnóstico GET /_debug/error (T-01-16)', () => {
  it('responde 404 quando DEBUG_ROUTES_ENABLED está ausente', async () => {
    const app = await createApp();
    try {
      const res = await request(app.getHttpServer()).get('/_debug/error');

      expect(res.status).toBe(404);
    } finally {
      await app.close();
    }
  });

  it('responde 404 quando DEBUG_ROUTES_ENABLED=false', async () => {
    const app = await createApp({ DEBUG_ROUTES_ENABLED: 'false' });
    try {
      const res = await request(app.getHttpServer()).get('/_debug/error');

      expect(res.status).toBe(404);
    } finally {
      await app.close();
    }
  });

  it('responde 500 genérico, sem stack trace, quando DEBUG_ROUTES_ENABLED=true', async () => {
    const app = await createApp({ DEBUG_ROUTES_ENABLED: 'true' });
    try {
      const res = await request(app.getHttpServer()).get('/_debug/error');
      const body = JSON.stringify(res.body);

      expect(res.status).toBe(500);
      expect(body.includes('sentry-smoke')).toBe(false);
      expect(body.includes('at ')).toBe(false);
      expect(body.includes('.ts')).toBe(false);
    } finally {
      await app.close();
    }
  });
});

// --- Smoke sobre o build real (`dist`), com um ingest do Sentry falso e local ---

async function freePort(): Promise<number> {
  return await new Promise((resolve, reject) => {
    const probe = createNetServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address();
      const port = typeof address === 'object' && address !== null ? address.port : 0;
      probe.close(() => resolve(port));
    });
  });
}

type FakeIngest = { port: number; envelopes: string[]; close: () => Promise<void> };

async function startFakeIngest(): Promise<FakeIngest> {
  const envelopes: string[] = [];
  const server: Server = createHttpServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      let raw = Buffer.concat(chunks);
      if (req.headers['content-encoding'] === 'gzip') raw = gunzipSync(raw);
      if (req.url?.startsWith('/api/1/envelope')) envelopes.push(raw.toString('utf8'));
      res.setHeader('content-type', 'application/json');
      res.end('{}');
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const port = typeof address === 'object' && address !== null ? address.port : 0;
  return {
    port,
    envelopes,
    close: async () => {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}

type RunningApi = { port: number; child: ChildProcess; exited: () => boolean };

function startApi(port: number, extraEnv: Record<string, string>): RunningApi {
  let exited = false;
  // Ambiente mínimo e controlado: nada do ambiente do desenvolvedor (DSN, banco) vaza para o filho.
  const child = spawn(
    process.execPath,
    ['--enable-source-maps', '--import', './dist/instrument.js', 'dist/main.js'],
    {
      cwd: API_ROOT,
      env: {
        PATH: process.env['PATH'] ?? '',
        PORT: String(port),
        NODE_ENV: 'test',
        LOG_LEVEL: 'warn',
        GIT_SHA: 'testsha0107',
        ...extraEnv,
      },
      stdio: 'ignore',
    },
  );
  child.once('exit', () => {
    exited = true;
  });
  return { port, child, exited: () => exited };
}

async function waitUntil(check: () => Promise<boolean> | boolean, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await check()) return true;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return false;
}

async function isLive(api: RunningApi): Promise<boolean> {
  if (api.exited()) return false;
  try {
    const res = await fetch(`http://127.0.0.1:${api.port}/health/live`);
    return res.status === 200;
  } catch {
    return false;
  }
}

describe('Sentry em ESM por --import sobre o build real (OPS-01)', () => {
  let ingest: FakeIngest | undefined;
  let api: RunningApi | undefined;

  afterEach(async () => {
    if (api !== undefined && !api.exited()) {
      const stopped = new Promise<void>((resolve) => api?.child.once('exit', () => resolve()));
      api.child.kill('SIGTERM');
      await stopped;
    }
    api = undefined;
    await ingest?.close();
    ingest = undefined;
  });

  it('envia ao ingest o erro de GET /_debug/error (envelope com sentry-smoke)', { timeout: 40000 }, async () => {
    ingest = await startFakeIngest();
    const port = await freePort();
    api = startApi(port, {
      DEBUG_ROUTES_ENABLED: 'true',
      SENTRY_DSN: `http://public@127.0.0.1:${ingest.port}/1`,
    });

    const ready = await waitUntil(() => isLive(api as RunningApi), 20000);
    expect(ready, 'child did not become ready').toBe(true);

    const res = await fetch(`http://127.0.0.1:${port}/_debug/error`);
    expect(res.status).toBe(500);

    const received = await waitUntil(
      () => (ingest as FakeIngest).envelopes.some((body) => body.includes('sentry-smoke')),
      10000,
    );
    expect(received, 'envelope not received').toBe(true);
  });

  it('sobe normalmente sem SENTRY_DSN e responde 200 em /health/live', { timeout: 40000 }, async () => {
    const port = await freePort();
    api = startApi(port, {});

    const ready = await waitUntil(() => isLive(api as RunningApi), 20000);

    expect(ready, 'child did not become ready').toBe(true);
  });

  it('responde 404 em /_debug/error no processo real com a flag desligada', { timeout: 40000 }, async () => {
    ingest = await startFakeIngest();
    const port = await freePort();
    api = startApi(port, { SENTRY_DSN: `http://public@127.0.0.1:${ingest.port}/1` });

    const ready = await waitUntil(() => isLive(api as RunningApi), 20000);
    expect(ready, 'child did not become ready').toBe(true);

    const res = await fetch(`http://127.0.0.1:${port}/_debug/error`);
    expect(res.status).toBe(404);
  });
});
