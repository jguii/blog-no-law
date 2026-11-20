// Testes do smoke anônimo do PostgREST (SEC-04, D-14) contra um servidor HTTP falso no mesmo processo.
// O script roda por `spawn` ASSÍNCRONO: a variante síncrona bloquearia o event loop que atende o curl
// do script, e o `node --test` nunca terminaria. Nunca toca a rede externa nem o Supabase de produção.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = 'scripts/smoke-postgrest.sh';
const TEST_KEY = 'sb_publishable_TESTKEY_abc123XYZ';
const PERMISSION_DENIED =
  '{"code":"42501","details":null,"hint":null,"message":"permission denied for table heartbeat"}';

let server;
let baseUrl;
let routes = new Map(); // caminho -> { status, body } (ou { hang: true })
let requests = []; // { path, headers }

before(async () => {
  server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
    requests.push({ path: pathname, headers: req.headers });
    const route = routes.get(pathname);
    if (route?.hang) return; // aceita a conexão e nunca responde
    res.writeHead(route?.status ?? 404, { 'content-type': 'application/json' });
    res.end(route?.body ?? '{}');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.closeAllConnections();
  server.close();
});

function reset(entries) {
  routes = new Map(Object.entries(entries));
  requests = [];
}

// Env montado do zero: sem SUPABASE_URL, sem ENV_FILE, sem herdar nada do ambiente do teste.
function runSmoke(extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('bash', [script], {
      cwd: repoRoot,
      env: { PATH: process.env.PATH, POSTGREST_URL: baseUrl, ...extraEnv },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

test('LEAK: 200 com linhas sai 1 nos dois modos, e falha de rede nunca vira bloqueio', { timeout: 15000 }, async () => {
  reset({ '/heartbeat': { status: 200, body: '[{"id":1}]' } });
  for (const extra of [{ TABLES: 'heartbeat' }, { TABLES: 'heartbeat', POSTGREST_STRICT: '1' }]) {
    const result = await runSmoke(extra);
    assert.equal(result.code, 1, result.stdout + result.stderr);
    assert.ok(result.stdout.includes('LEAK heartbeat 200'), result.stdout);
    assert.ok(!result.stdout.includes('POSTGREST_ANON_BLOCKED'));
  }

  // Servidor que aceita a conexão e não responde: o curl estoura o timeout e o script falha.
  reset({ '/hang': { hang: true } });
  for (const extra of [{}, { POSTGREST_STRICT: '1' }]) {
    const result = await runSmoke({ TABLES: 'hang', SMOKE_CURL_MAX_TIME: '1', ...extra });
    assert.notEqual(result.code, 0, result.stdout + result.stderr);
    assert.ok(!result.stdout.includes('POSTGREST_ANON_BLOCKED'));
  }
});

test('modo estrito: só passa com 42501 vindo do Postgres ou lista vazia; o resto é INCONCLUSIVE', { timeout: 15000 }, async () => {
  reset({
    '/heartbeat': { status: 401, body: PERMISSION_DENIED },
    '/_prisma_migrations': { status: 200, body: '[]' },
  });
  const pass = await runSmoke({ POSTGREST_STRICT: '1' });
  assert.equal(pass.code, 0, pass.stdout + pass.stderr);
  assert.ok(pass.stdout.includes('POSTGREST_ANON_BLOCKED'));

  const inconclusive = [
    [503, '{"message":"no database"}'],
    [404, '{"code":"PGRST205","message":"Could not find the table"}'],
    [401, '{"message":"JWT expired"}'],
  ];
  for (const [status, body] of inconclusive) {
    reset({ '/heartbeat': { status, body } });
    const result = await runSmoke({ POSTGREST_STRICT: '1', TABLES: 'heartbeat' });
    assert.equal(result.code, 1, `status ${status}: ${result.stdout}${result.stderr}`);
    assert.ok(result.stdout.includes(`INCONCLUSIVE heartbeat ${status}`), result.stdout);
    assert.ok(!result.stdout.includes('POSTGREST_ANON_BLOCKED'));
  }
});

test('modo de produção (sem STRICT): 401, 403, 404 e 200 com [] passam como no 01-06', { timeout: 15000 }, async () => {
  const passing = [
    [401, '{"message":"x"}'],
    [403, '{"message":"x"}'],
    [404, '{"code":"PGRST205"}'],
    [200, '[]'],
  ];
  for (const [status, body] of passing) {
    reset({ '/heartbeat': { status, body } });
    const result = await runSmoke({ TABLES: 'heartbeat' });
    assert.equal(result.code, 0, `status ${status}: ${result.stdout}${result.stderr}`);
    assert.ok(result.stdout.includes('POSTGREST_ANON_BLOCKED'), result.stdout);
  }
});

test('headers: sem chave a requisição é anônima; com chave vão apikey e Authorization e a chave nunca é impressa', { timeout: 15000 }, async () => {
  reset({ '/heartbeat': { status: 401, body: PERMISSION_DENIED } });
  const anonymous = await runSmoke({ TABLES: 'heartbeat' });
  assert.equal(anonymous.code, 0, anonymous.stdout + anonymous.stderr);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].headers.apikey, undefined);
  assert.equal(requests[0].headers.authorization, undefined);

  reset({ '/heartbeat': { status: 401, body: PERMISSION_DENIED } });
  const withKey = await runSmoke({ TABLES: 'heartbeat', SUPABASE_PUBLISHABLE_KEY: TEST_KEY });
  assert.equal(withKey.code, 0, withKey.stdout + withKey.stderr);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].headers.apikey, TEST_KEY);
  assert.equal(requests[0].headers.authorization, `Bearer ${TEST_KEY}`);
  assert.ok(!withKey.stdout.includes(TEST_KEY), 'a chave apareceu em stdout');
  assert.ok(!withKey.stderr.includes(TEST_KEY), 'a chave apareceu em stderr');
});

test('TABLES consulta exatamente as tabelas dadas; o padrão é heartbeat e _prisma_migrations', { timeout: 15000 }, async () => {
  reset({ '/a': { status: 200, body: '[]' }, '/b': { status: 200, body: '[]' } });
  const custom = await runSmoke({ TABLES: 'a b' });
  assert.equal(custom.code, 0, custom.stdout + custom.stderr);
  assert.deepEqual(
    requests.map((r) => r.path),
    ['/a', '/b'],
  );

  reset({ '/heartbeat': { status: 200, body: '[]' }, '/_prisma_migrations': { status: 200, body: '[]' } });
  const defaults = await runSmoke();
  assert.equal(defaults.code, 0, defaults.stdout + defaults.stderr);
  assert.deepEqual(
    requests.map((r) => r.path),
    ['/heartbeat', '/_prisma_migrations'],
  );
});

test('com POSTGREST_URL o script não exige SUPABASE_URL nem lê ENV_FILE', { timeout: 15000 }, async () => {
  reset({ '/heartbeat': { status: 200, body: '[]' } });
  const result = await runSmoke({ TABLES: 'heartbeat', ENV_FILE: '/nao/existe/production.env' });
  assert.equal(result.code, 0, result.stdout + result.stderr);
  assert.ok(result.stdout.includes('POSTGREST_ANON_BLOCKED'));
  assert.ok(!result.stderr.includes('ENV_FILE'), result.stderr);
});
