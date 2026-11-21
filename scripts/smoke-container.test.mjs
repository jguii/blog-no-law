// Testes do smoke da imagem da API (OPS-02, D-10). Nenhum caso usa Docker de verdade, rede ou banco:
// `docker` e `git` são executáveis falsos no PATH. Usa `spawnSync` porque não há servidor HTTP
// no mesmo processo (diferente de smoke-postgrest.test.mjs), então bloquear o event loop é seguro.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = 'scripts/smoke-container.sh';
const FAKE_SHA = '0123456789abcdef0123456789abcdef01234567';
const MARKER = 'SENHA_MARCADORA_TESTE';
const CANONICAL_URL = `postgresql://app_api.projref:${MARKER}@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require`;

// Texto de um arquivo do repositório; string vazia quando ele ainda não existe.
function readText(relativePath) {
  try {
    return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  } catch {
    return '';
  }
}

function writeExecutable(file, content) {
  fs.writeFileSync(file, content, { mode: 0o755 });
}

// Monta um diretório temporário com `docker` e `git` falsos, um env file e o log do `docker` falso.
function setup(databaseUrl) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'smoke-container-'));
  const bin = path.join(dir, 'bin');
  fs.mkdirSync(bin);
  const dockerLog = path.join(dir, 'docker.log');
  fs.writeFileSync(dockerLog, '');

  // O `docker` falso registra os argumentos de cada chamada e, quando DATABASE_URL chegou ao seu
  // ambiente, só a marca DB_ENV_PRESENT (nunca o valor). Falha em `run` para o caso terminar antes
  // da espera do /health/live.
  writeExecutable(
    path.join(bin, 'docker'),
    [
      '#!/usr/bin/env bash',
      'printf "%s\\n" "$*" >> "$DOCKER_LOG"',
      'if [ -n "${DATABASE_URL:-}" ]; then echo DB_ENV_PRESENT >> "$DOCKER_LOG"; fi',
      'case "$1" in',
      '  run) exit 1 ;;',
      '  *) exit 0 ;;',
      'esac',
      '',
    ].join('\n'),
  );
  writeExecutable(
    path.join(bin, 'git'),
    [
      '#!/usr/bin/env bash',
      'case "$1" in',
      '  rev-parse) echo "$FAKE_SHA" ;;',
      '  status) printf "%s" "${FAKE_GIT_STATUS:-}" ;;',
      'esac',
      '',
    ].join('\n'),
  );

  const envFile = path.join(dir, 'production.env');
  fs.writeFileSync(envFile, `DATABASE_URL='${databaseUrl}'\n`);

  return { dir, bin, dockerLog, envFile, imageRecord: path.join(dir, 'published-image.sha') };
}

// Env montado do zero: nada do ambiente do teste (nem DATABASE_URL) chega ao script.
function runSmoke(ctx, { args = [], gitStatus = '' } = {}) {
  const result = spawnSync('bash', [script, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 30000,
    env: {
      PATH: `${ctx.bin}:${path.dirname(process.execPath)}:/usr/bin:/bin`,
      HOME: ctx.dir,
      ENV_FILE: ctx.envFile,
      IMAGE_RECORD: ctx.imageRecord,
      DOCKER_LOG: ctx.dockerLog,
      FAKE_SHA,
      FAKE_GIT_STATUS: gitStatus,
    },
  });
  return {
    code: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    dockerLog: fs.readFileSync(ctx.dockerLog, 'utf8'),
  };
}

function dockerCalls(log, subcommand) {
  return log.split('\n').filter((line) => line.split(' ')[0] === subcommand);
}

function assertNoMarker(result) {
  assert.ok(!result.stdout.includes(MARKER), 'a senha apareceu em stdout');
  assert.ok(!result.stderr.includes(MARKER), 'a senha apareceu em stderr');
  assert.ok(!result.dockerLog.includes(MARKER), 'a senha apareceu no log do docker falso');
}

test('Dockerfile e .dockerignore: usuário não-root, CA absoluta, SHA, --import e exclusões de segredo', () => {
  const dockerfile = readText('apps/api/Dockerfile');
  assert.match(dockerfile, /^USER node$/m);
  assert.ok(dockerfile.includes('NODE_EXTRA_CA_CERTS=/app/certs/supabase-ca.crt'));
  assert.match(dockerfile, /^ARG GIT_SHA/m);
  assert.match(dockerfile, /^CMD .*"--import".*"\.\/dist\/instrument\.js"/m);

  const ignored = readText('.dockerignore').split('\n');
  for (const line of ['.env*', '.claude', '.planning', '**/node_modules']) {
    assert.ok(ignored.includes(line), `.dockerignore sem a linha ${line}`);
  }
});

test('DATABASE_URL fora da forma canônica de TLS: NON_CANONICAL_TLS_URL, sem senha e sem docker build', () => {
  const base =
    'postgresql://app_api.projref:' + MARKER + '@aws-0-us-east-1.pooler.supabase.com:5432/postgres';
  const invalid = [
    `${base}?sslmode=require&sslrootcert=certs/supabase-ca.crt`,
    `${base}?sslmode=verify-full`,
    `${base}?sslmode=no-verify`,
    base,
  ];
  for (const url of invalid) {
    const ctx = setup(url);
    const result = runSmoke(ctx);
    assert.notEqual(result.code, 0, `esperava falha para a URL inválida\n${result.stdout}`);
    assert.ok(result.stdout.includes('NON_CANONICAL_TLS_URL'), result.stdout + result.stderr);
    assert.equal(dockerCalls(result.dockerLog, 'build').length, 0, 'docker build não deve rodar');
    assertNoMarker(result);
  }
});

test('--publish com árvore suja: DIRTY_TREE, sem docker build, login nem push', () => {
  const ctx = setup(CANONICAL_URL);
  const result = runSmoke(ctx, { args: ['--publish'], gitStatus: '?? apps/api/novo-arquivo.ts\n' });
  assert.notEqual(result.code, 0, result.stdout + result.stderr);
  assert.ok(result.stdout.includes('DIRTY_TREE'), result.stdout + result.stderr);
  for (const sub of ['build', 'login', 'push']) {
    assert.equal(dockerCalls(result.dockerLog, sub).length, 0, `docker ${sub} não deve rodar`);
  }
  assert.ok(!fs.existsSync(ctx.imageRecord), 'nenhum SHA deve ser gravado');
  assertNoMarker(result);
});

test('URL canônica: docker run recebe DATABASE_URL só pelo nome, porta em 127.0.0.1, senha fora dos logs e container removido', () => {
  const ctx = setup(CANONICAL_URL);
  const result = runSmoke(ctx);
  assert.notEqual(result.code, 0, 'o docker run falso falha, então o smoke não pode passar');
  assert.ok(!result.stdout.includes('SMOKE_CONTAINER_OK'), result.stdout);
  assert.ok(!result.stdout.includes('NON_CANONICAL_TLS_URL'), result.stdout);

  assert.equal(dockerCalls(result.dockerLog, 'build').length, 1, 'a URL canônica chega ao build');
  const runs = dockerCalls(result.dockerLog, 'run');
  assert.equal(runs.length, 1);
  const tokens = runs[0].split(' ');
  const envIndex = tokens.indexOf('DATABASE_URL');
  assert.ok(envIndex > 0 && tokens[envIndex - 1] === '-e', 'esperava `-e DATABASE_URL` sem valor');
  assert.ok(
    !tokens.some((token) => token.startsWith('DATABASE_URL=')),
    'DATABASE_URL com valor na linha',
  );
  assert.ok(tokens.includes('127.0.0.1:3301:3301'), 'porta publicada só em 127.0.0.1');
  assert.ok(
    result.dockerLog.includes('DB_ENV_PRESENT'),
    'o docker falso deveria enxergar DATABASE_URL no ambiente',
  );
  assert.ok(
    dockerCalls(result.dockerLog, 'rm').length >= 1,
    'o container deve ser removido no trap',
  );
  assertNoMarker(result);
});
