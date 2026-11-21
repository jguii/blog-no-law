// Testes de scripts/verify-remote-api.sh (OPS-02, D-02, D-11) contra um servidor HTTP falso no mesmo processo.
// O script roda por `spawn` ASSÍNCRONO: a variante síncrona bloquearia o event loop que atende o curl do
// script e o teste nunca terminaria. Nunca toca a rede externa, a Render, a Railway nem o banco.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = 'scripts/verify-remote-api.sh';
const SHA = '72f7961b2bd74687043f61ec45fe9ce4a5da4fdb';
const OTHER_SHA = '0000000000000000000000000000000000000000';

const SECURE_HEADERS = {
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
  'x-content-type-options': 'nosniff',
};

function healthyStatus(overrides = {}) {
  return { status: 200, body: { commit: SHA, db: 'up' }, headers: SECURE_HEADERS, ...overrides };
}

// Sobe um servidor falso configurável por caso. `statusResponses` é consumida em ordem e a última se repete.
async function withServer(config, fn) {
  const statusResponses = config.statusResponses ?? [healthyStatus()];
  let statusCalls = 0;
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
    if (pathname === '/status') {
      const response = statusResponses[Math.min(statusCalls, statusResponses.length - 1)];
      statusCalls += 1;
      res.writeHead(response.status, { 'content-type': 'application/json', ...response.headers });
      res.end(JSON.stringify(response.body ?? {}));
      return;
    }
    if (pathname === '/health/ready') {
      res.writeHead(config.ready ?? 200, { 'content-type': 'application/json' });
      res.end('{}');
      return;
    }
    if (pathname === '/_debug/error') {
      res.writeHead(config.debug ?? 404, { 'content-type': 'application/json' });
      res.end('{}');
      return;
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    return await fn(baseUrl, () => statusCalls);
  } finally {
    server.closeAllConnections();
    server.close();
  }
}

// Env montado do zero: nada herdado do ambiente do teste além do que o script precisa para achar o curl e o node.
function runVerify(baseUrl, sha, { args = [], env = {} } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('bash', [script, baseUrl, sha, ...args], {
      cwd: repoRoot,
      env: {
        PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin`,
        VERIFY_TIMEOUT_S: '3',
        VERIFY_POLL_S: '1',
        ...env,
      },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

test('servidor saudável: sai 0 e imprime REMOTE_API_OK com a URL', { timeout: 20000 }, async () => {
  await withServer({}, async (baseUrl) => {
    const result = await runVerify(baseUrl, SHA);
    assert.equal(result.code, 0, result.stdout + result.stderr);
    assert.ok(result.stdout.includes(`REMOTE_API_OK ${baseUrl}`), result.stdout);
  });
});

test(
  'cold start: 503 nas duas primeiras respostas de /status e depois saudável sai 0',
  { timeout: 20000 },
  async () => {
    const config = {
      statusResponses: [
        { status: 503, body: { message: 'starting' } },
        { status: 503, body: { message: 'starting' } },
        healthyStatus(),
      ],
    };
    await withServer(config, async (baseUrl, calls) => {
      const result = await runVerify(baseUrl, SHA, { env: { VERIFY_TIMEOUT_S: '10' } });
      assert.equal(result.code, 0, result.stdout + result.stderr);
      assert.ok(result.stdout.includes('REMOTE_API_OK'), result.stdout);
      assert.ok(calls() >= 3, `esperava ao menos 3 consultas a /status, houve ${calls()}`);
    });
  },
);

test(
  'commit nunca igual ao esperado: sai 1 com REMOTE_API_FAIL commit em menos de 15 s',
  { timeout: 20000 },
  async () => {
    const config = { statusResponses: [healthyStatus({ body: { commit: OTHER_SHA, db: 'up' } })] };
    await withServer(config, async (baseUrl) => {
      const started = Date.now();
      const result = await runVerify(baseUrl, SHA);
      const elapsedMs = Date.now() - started;
      assert.equal(result.code, 1, result.stdout + result.stderr);
      assert.ok(result.stdout.includes('REMOTE_API_FAIL commit'), result.stdout);
      assert.ok(elapsedMs < 15000, `levou ${elapsedMs} ms`);
    });
  },
);

test('db down e ready 503 falham com a checagem certa', { timeout: 20000 }, async () => {
  await withServer(
    { statusResponses: [healthyStatus({ body: { commit: SHA, db: 'down' } })] },
    async (baseUrl) => {
      const result = await runVerify(baseUrl, SHA);
      assert.equal(result.code, 1, result.stdout + result.stderr);
      assert.ok(result.stdout.includes('REMOTE_API_FAIL db'), result.stdout);
    },
  );

  await withServer({ ready: 503 }, async (baseUrl) => {
    const result = await runVerify(baseUrl, SHA);
    assert.equal(result.code, 1, result.stdout + result.stderr);
    assert.ok(result.stdout.includes('REMOTE_API_FAIL ready'), result.stdout);
  });
});

test(
  'headers do Helmet: sem CSP default-src none ou sem nosniff falha',
  { timeout: 20000 },
  async () => {
    await withServer(
      {
        statusResponses: [healthyStatus({ headers: { 'x-content-type-options': 'nosniff' } })],
      },
      async (baseUrl) => {
        const result = await runVerify(baseUrl, SHA);
        assert.equal(result.code, 1, result.stdout + result.stderr);
        assert.ok(result.stdout.includes('REMOTE_API_FAIL csp'), result.stdout);
      },
    );

    await withServer(
      {
        statusResponses: [
          healthyStatus({
            headers: { 'content-security-policy': "default-src 'none'" },
          }),
        ],
      },
      async (baseUrl) => {
        const result = await runVerify(baseUrl, SHA);
        assert.equal(result.code, 1, result.stdout + result.stderr);
        assert.ok(result.stdout.includes('REMOTE_API_FAIL nosniff'), result.stdout);
      },
    );
  },
);

test(
  'rota de debug: 500 sem a flag falha; com --expect-debug 500 passa e 404 falha',
  { timeout: 30000 },
  async () => {
    await withServer({ debug: 500 }, async (baseUrl) => {
      const result = await runVerify(baseUrl, SHA);
      assert.equal(result.code, 1, result.stdout + result.stderr);
      assert.ok(result.stdout.includes('REMOTE_API_FAIL debug_route'), result.stdout);
    });

    await withServer({ debug: 500 }, async (baseUrl) => {
      const result = await runVerify(baseUrl, SHA, { args: ['--expect-debug'] });
      assert.equal(result.code, 0, result.stdout + result.stderr);
      assert.ok(result.stdout.includes('REMOTE_API_OK'), result.stdout);
    });

    await withServer({ debug: 404 }, async (baseUrl) => {
      const result = await runVerify(baseUrl, SHA, { args: ['--expect-debug'] });
      assert.equal(result.code, 1, result.stdout + result.stderr);
      assert.ok(result.stdout.includes('REMOTE_API_FAIL debug_route'), result.stdout);
    });
  },
);
