// Testes de scripts/verify-remote-web.sh (VIS-01..04, critério 5 da Fase 2) contra um servidor HTTP falso no
// mesmo processo. O script roda por `spawn` ASSÍNCRONO: a variante síncrona bloquearia o event loop que
// atende o curl do script e o teste nunca terminaria. Nunca toca a rede externa, a Vercel nem a API.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = 'scripts/verify-remote-web.sh';
const SLOGAN = 'Uma nova face, uma nova história.';
const OG_PATH = '/opengraph-image.jpg?3f9a1c';
// O `metadataBase` aponta para o domínio de produção, mesmo num `next start` local: o script só usa o
// caminho do `og:image` e o busca no host verificado.
const OG_ABSOLUTE = `https://blog-no-law.vercel.app${OG_PATH}`;

const SECURITY_HEADERS = {
  'content-security-policy': "default-src 'self'; frame-ancestors 'none'",
  'x-frame-options': 'DENY',
};

function homeHtml({ og = OG_ABSOLUTE, dark = true, slogan = SLOGAN } = {}) {
  return (
    '<!DOCTYPE html>' +
    `<html lang="pt-BR"${dark ? ' data-theme="dark"' : ''}><head>` +
    `<meta property="og:image" content="${og}"/>` +
    `</head><body><main><h1>${slogan}</h1></main></body></html>`
  );
}

const INSTITUTIONAL = '<!DOCTYPE html><html><body><main><h1>Página</h1></main></body></html>';

// Respostas saudáveis por caminho; cada caso sobrescreve só o que quer quebrar.
function healthyRoutes() {
  return {
    '/': { status: 200, type: 'text/html', headers: SECURITY_HEADERS, body: homeHtml() },
    '/opengraph-image.jpg': { status: 200, type: 'image/jpeg', body: 'jpeg' },
    '/icon.svg': { status: 200, type: 'image/svg+xml', body: '<svg/>' },
    '/favicon.ico': { status: 200, type: 'image/x-icon', body: 'ico' },
    '/apple-icon.png': { status: 200, type: 'image/png', body: 'png' },
    '/kit': {
      status: 200,
      type: 'text/html',
      headers: { 'x-robots-tag': 'noindex, nofollow' },
      body: INSTITUTIONAL,
    },
    '/status': {
      status: 200,
      type: 'text/html',
      headers: { 'x-robots-tag': 'noindex, nofollow' },
      body: INSTITUTIONAL,
    },
    '/sobre': { status: 200, type: 'text/html', body: INSTITUTIONAL },
    '/regras': { status: 200, type: 'text/html', body: INSTITUTIONAL },
    '/privacidade': { status: 200, type: 'text/html', body: INSTITUTIONAL },
  };
}

// Sobe um servidor falso configurável por caso. `overrides` troca ou (com `null`) remove rotas saudáveis.
async function withServer(overrides, fn) {
  const routes = { ...healthyRoutes() };
  for (const [route, value] of Object.entries(overrides)) {
    if (value === null) delete routes[route];
    else routes[route] = value;
  }
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
    const route = routes[pathname];
    if (!route) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('nao encontrado');
      return;
    }
    res.writeHead(route.status, { 'content-type': route.type, ...route.headers });
    res.end(route.body ?? '');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    return await fn(baseUrl);
  } finally {
    server.closeAllConnections();
    server.close();
  }
}

// Env montado do zero: nada herdado do ambiente do teste além do que o script precisa para achar o curl e o node.
function runVerify(args, { env = {} } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('bash', [script, ...args], {
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

async function expectFail(overrides, item, options) {
  await withServer(overrides, async (baseUrl) => {
    const result = await runVerify([baseUrl], options);
    assert.equal(result.code, 1, result.stdout + result.stderr);
    assert.ok(result.stdout.includes(`REMOTE_WEB_FAIL ${item}`), result.stdout);
  });
}

test('servidor saudável: sai 0 e imprime REMOTE_WEB_OK com a URL', { timeout: 30000 }, async () => {
  await withServer({}, async (baseUrl) => {
    const result = await runVerify([baseUrl]);
    assert.equal(result.code, 0, result.stdout + result.stderr);
    assert.ok(result.stdout.includes(`REMOTE_WEB_OK ${baseUrl}`), result.stdout);
  });
});

test('sem argumento: imprime o uso e sai 2', { timeout: 10000 }, async () => {
  const result = await runVerify([]);
  assert.equal(result.code, 2, result.stdout + result.stderr);
  assert.ok(result.stderr.includes('uso:'), result.stderr);
});

test(
  'capa sem o slogan até estourar o tempo: REMOTE_WEB_FAIL shell em menos de 15 s',
  { timeout: 30000 },
  async () => {
    const started = Date.now();
    await expectFail(
      {
        '/': {
          status: 200,
          type: 'text/html',
          headers: SECURITY_HEADERS,
          body: homeHtml({ slogan: 'Em construção' }),
        },
      },
      'shell',
      { env: { VERIFY_TIMEOUT_S: '2', VERIFY_POLL_S: '1' } },
    );
    assert.ok(Date.now() - started < 15000);
  },
);

test('capa sem data-theme="dark": REMOTE_WEB_FAIL shell', { timeout: 30000 }, async () => {
  await expectFail(
    {
      '/': {
        status: 200,
        type: 'text/html',
        headers: SECURITY_HEADERS,
        body: homeHtml({ dark: false }),
      },
    },
    'shell',
    { env: { VERIFY_TIMEOUT_S: '2', VERIFY_POLL_S: '1' } },
  );
});

test(
  'cold start: 503 nas primeiras respostas e depois saudável sai 0',
  { timeout: 30000 },
  async () => {
    let calls = 0;
    const server = http.createServer((req, res) => {
      const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
      if (pathname === '/') {
        calls += 1;
        if (calls <= 2) {
          res.writeHead(503, { 'content-type': 'text/plain' });
          res.end('subindo');
          return;
        }
      }
      const route = healthyRoutes()[pathname];
      if (!route) {
        res.writeHead(404);
        res.end();
        return;
      }
      res.writeHead(route.status, { 'content-type': route.type, ...route.headers });
      res.end(route.body ?? '');
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    try {
      const result = await runVerify([baseUrl], { env: { VERIFY_TIMEOUT_S: '10' } });
      assert.equal(result.code, 0, result.stdout + result.stderr);
      assert.ok(result.stdout.includes('REMOTE_WEB_OK'), result.stdout);
      assert.ok(calls >= 3, `esperava ao menos 3 consultas à capa, houve ${calls}`);
    } finally {
      server.closeAllConnections();
      server.close();
    }
  },
);

test('sem CSP (ou sem frame-ancestors none): REMOTE_WEB_FAIL csp', { timeout: 30000 }, async () => {
  await expectFail(
    {
      '/': {
        status: 200,
        type: 'text/html',
        headers: { 'x-frame-options': 'DENY' },
        body: homeHtml(),
      },
    },
    'csp',
  );
  await expectFail(
    {
      '/': {
        status: 200,
        type: 'text/html',
        headers: { 'content-security-policy': "default-src 'self'", 'x-frame-options': 'DENY' },
        body: homeHtml(),
      },
    },
    'csp',
  );
});

test('sem X-Frame-Options: DENY: REMOTE_WEB_FAIL xframe', { timeout: 30000 }, async () => {
  await expectFail(
    {
      '/': {
        status: 200,
        type: 'text/html',
        headers: { 'content-security-policy': SECURITY_HEADERS['content-security-policy'] },
        body: homeHtml(),
      },
    },
    'xframe',
  );
});

test(
  'og:image relativo, com caminho 404 ou sem image/jpeg: REMOTE_WEB_FAIL og_image',
  {
    timeout: 40000,
  },
  async () => {
    await expectFail(
      {
        '/': {
          status: 200,
          type: 'text/html',
          headers: SECURITY_HEADERS,
          body: homeHtml({ og: '/opengraph-image.jpg?3f9a1c' }),
        },
      },
      'og_image',
    );
    await expectFail({ '/opengraph-image.jpg': null }, 'og_image');
    await expectFail(
      { '/opengraph-image.jpg': { status: 200, type: 'text/html', body: 'nao e imagem' } },
      'og_image',
    );
  },
);

test('ícone ausente ou com tipo errado: REMOTE_WEB_FAIL icon', { timeout: 40000 }, async () => {
  await expectFail({ '/favicon.ico': null }, 'icon');
  await expectFail({ '/apple-icon.png': null }, 'icon');
  await expectFail({ '/icon.svg': { status: 200, type: 'text/html', body: '<html/>' } }, 'icon');
});

test('/kit e /status sem noindex: REMOTE_WEB_FAIL noindex:{rota}', { timeout: 40000 }, async () => {
  await expectFail(
    { '/kit': { status: 200, type: 'text/html', body: INSTITUTIONAL } },
    'noindex:/kit',
  );
  await expectFail(
    { '/status': { status: 200, type: 'text/html', body: INSTITUTIONAL } },
    'noindex:/status',
  );
});

test(
  'página institucional com erro ou sem h1: REMOTE_WEB_FAIL page:{rota}',
  { timeout: 40000 },
  async () => {
    await expectFail({ '/sobre': { status: 500, type: 'text/html', body: 'erro' } }, 'page:/sobre');
    await expectFail(
      {
        '/regras': { status: 200, type: 'text/html', body: '<html><body>sem titulo</body></html>' },
      },
      'page:/regras',
    );
    await expectFail({ '/privacidade': null }, 'page:/privacidade');
  },
);

test('a saída nunca traz corpo de resposta', { timeout: 30000 }, async () => {
  await withServer(
    { '/sobre': { status: 500, type: 'text/html', body: 'CORPO-SECRETO-DA-RESPOSTA' } },
    async (baseUrl) => {
      const result = await runVerify([baseUrl]);
      assert.equal(result.code, 1);
      assert.ok(!(result.stdout + result.stderr).includes('CORPO-SECRETO'), result.stdout);
    },
  );
});
