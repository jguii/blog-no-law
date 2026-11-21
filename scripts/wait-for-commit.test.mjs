// Testes de scripts/wait-for-commit.sh (OPS-02, D-10) contra um servidor HTTP falso no mesmo processo.
// O script roda por `spawn` ASSÍNCRONO: a variante síncrona bloquearia o event loop que atende o curl do
// script e o teste nunca terminaria. Nunca toca a rede externa, a Render nem o banco.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = 'scripts/wait-for-commit.sh';
const SHA = '72f7961b2bd74687043f61ec45fe9ce4a5da4fdb';
const OLD_SHA = '0000000000000000000000000000000000000000';

const live = { status: 200, body: { commit: SHA, db: 'up' } };
const stale = { status: 200, body: { commit: OLD_SHA, db: 'up' } };

// Sobe um servidor falso configurável por caso. `statusResponses` é consumida em ordem e a última se
// repete. Uma resposta `{ drop: true }` encerra a conexão sem responder (cold start da Render).
async function withServer(statusResponses, fn) {
  let statusCalls = 0;
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
    if (pathname !== '/status') {
      res.writeHead(404);
      res.end();
      return;
    }
    const response = statusResponses[Math.min(statusCalls, statusResponses.length - 1)];
    statusCalls += 1;
    if (response.drop) {
      req.socket.destroy();
      return;
    }
    res.writeHead(response.status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(response.body ?? {}));
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
function runWait(baseUrl, sha, limitS, { env = {} } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('bash', [script, baseUrl, sha, String(limitS)], {
      cwd: repoRoot,
      env: { PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin`, WAIT_POLL_S: '1', ...env },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

test('commit já publicado: sai 0 e imprime COMMIT_LIVE com o SHA', { timeout: 20000 }, async () => {
  await withServer([live], async (baseUrl) => {
    const result = await runWait(baseUrl, SHA, 10);
    assert.equal(result.code, 0, result.stdout + result.stderr);
    assert.ok(result.stdout.includes(`COMMIT_LIVE ${SHA}`), result.stdout);
  });
});

test(
  'commit antigo por duas consultas e depois o novo: sai 0 com COMMIT_LIVE',
  { timeout: 20000 },
  async () => {
    await withServer([stale, stale, live], async (baseUrl, calls) => {
      const result = await runWait(baseUrl, SHA, 15);
      assert.equal(result.code, 0, result.stdout + result.stderr);
      assert.ok(result.stdout.includes(`COMMIT_LIVE ${SHA}`), result.stdout);
      assert.ok(calls() >= 3, `esperava ao menos 3 consultas a /status, houve ${calls()}`);
    });
  },
);

test(
  'cold start: 503 e conexão encerrada sem resposta no começo não derrubam o script',
  { timeout: 30000 },
  async () => {
    const responses = [{ status: 503, body: { message: 'starting' } }, { drop: true }, live];
    await withServer(responses, async (baseUrl) => {
      const result = await runWait(baseUrl, SHA, 20);
      assert.equal(result.code, 0, result.stdout + result.stderr);
      assert.ok(result.stdout.includes(`COMMIT_LIVE ${SHA}`), result.stdout);
    });
  },
);

test(
  'commit nunca aparece: sai 1 com COMMIT_TIMEOUT, sem COMMIT_LIVE, em menos de 15 s',
  { timeout: 30000 },
  async () => {
    await withServer([stale], async (baseUrl) => {
      const started = Date.now();
      const result = await runWait(baseUrl, SHA, 3);
      const elapsedMs = Date.now() - started;
      assert.equal(result.code, 1, result.stdout + result.stderr);
      assert.ok(result.stdout.includes(`COMMIT_TIMEOUT ${SHA}`), result.stdout);
      assert.ok(!result.stdout.includes('COMMIT_LIVE'), result.stdout);
      assert.ok(elapsedMs < 15000, `levou ${elapsedMs} ms`);
    });
  },
);
