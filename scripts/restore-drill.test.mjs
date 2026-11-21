// Testes do restore drill (OPS-03, D-07, T-01-60). Nenhum caso usa Docker, `age` ou GitHub de verdade:
// `gh`, `age` e `docker` são executáveis falsos no PATH, com log dos argumentos de cada chamada. Usa
// `spawnSync` porque não há servidor no processo do teste (padrão de smoke-container.test.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = 'scripts/restore-drill.sh';
const TAG = 'db-20261201T051700Z';

function writeExecutable(file, content) {
  fs.writeFileSync(file, content, { mode: 0o755 });
}

// Diretório temporário com `gh`, `age` e `docker` falsos, a chave age fictícia e os logs.
function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'restore-drill-'));
  const bin = path.join(dir, 'bin');
  const tmp = path.join(dir, 'tmp');
  fs.mkdirSync(bin);
  fs.mkdirSync(tmp);
  const ghLog = path.join(dir, 'gh.log');
  const dockerLog = path.join(dir, 'docker.log');
  fs.writeFileSync(ghLog, '');
  fs.writeFileSync(dockerLog, '');
  const ageKey = path.join(dir, 'backup.age.key');
  fs.writeFileSync(ageKey, 'chave fictícia do teste\n', { mode: 0o600 });

  // `release list` devolve a tag; `release download` cria {tag}.dump.age no diretório de --dir.
  writeExecutable(
    path.join(bin, 'gh'),
    [
      '#!/usr/bin/env bash',
      'printf "%s\\n" "$*" >> "$GH_LOG"',
      'if [ "$1 $2" = "release list" ]; then echo "$FAKE_TAG"; exit 0; fi',
      'if [ "$1 $2" = "release download" ]; then',
      '  dir=""',
      '  while [ $# -gt 0 ]; do',
      '    if [ "$1" = "--dir" ]; then dir="$2"; fi',
      '    shift',
      '  done',
      '  printf "age-encryption.org/v1 fictício" > "$dir/$FAKE_TAG.dump.age"',
      '  exit 0',
      'fi',
      'exit 0',
      '',
    ].join('\n'),
  );

  // Escreve bytes fictícios na stdout, como o texto decifrado.
  writeExecutable(
    path.join(bin, 'age'),
    ['#!/usr/bin/env bash', 'printf "PGDMP fictício"', ''].join('\n'),
  );

  // Registra cada chamada; responde a pg_isready, pg_restore e às consultas psql pelo trecho dos
  // argumentos, na precedência do contrato do plano. Cada resposta pode ser trocada pelo caso.
  writeExecutable(
    path.join(bin, 'docker'),
    [
      '#!/usr/bin/env bash',
      'printf "%s\\n" "$*" >> "$DOCKER_LOG"',
      'args="$*"',
      'case "$1" in',
      '  run) echo drill-container-id; exit 0 ;;',
      '  rm|stop) exit 0 ;;',
      'esac',
      'case "$args" in',
      '  *pg_isready*) exit 0 ;;',
      '  *pg_restore*) cat > /dev/null; exit "${FAKE_PG_RESTORE_EXIT:-0}" ;;',
      '  *"CREATE ROLE"*) exit 0 ;;',
      '  *"-U app_api"*) printf "%s\\n" "${FAKE_APP_API_READ-1}" ;;',
      `  *"has_table_privilege('app_api'"*) echo "\${FAKE_APP_API_SELECT:-t}" ;;`,
      `  *"has_table_privilege('anon'"*) echo "\${FAKE_ANON_SELECT:-f}" ;;`,
      '  *heartbeat_app_api_select*) echo "${FAKE_POLICY:-1}" ;;',
      '  *relrowsecurity*) echo "${FAKE_RLS:-t}" ;;',
      '  *_prisma_migrations*) echo "${FAKE_BASELINE:-1}" ;;',
      '  *"count(*)"*) echo "${FAKE_HEARTBEAT_ROWS:-1}" ;;',
      'esac',
      'exit 0',
      '',
    ].join('\n'),
  );

  return { dir, bin, tmp, ghLog, dockerLog, ageKey };
}

// Env montado do zero: nada do ambiente do teste (nem credenciais do gh) chega ao script.
function runDrill(ctx, overrides = {}) {
  const result = spawnSync('bash', [script], {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 30000,
    env: {
      PATH: `${ctx.bin}:${path.dirname(process.execPath)}:/usr/bin:/bin`,
      HOME: ctx.dir,
      TMPDIR: ctx.tmp,
      BACKUP_REPO: 'exemplo/blog-no-law-backups',
      AGE_KEY: ctx.ageKey,
      GH_LOG: ctx.ghLog,
      DOCKER_LOG: ctx.dockerLog,
      FAKE_TAG: TAG,
      ...overrides,
    },
  });
  return {
    code: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    ghLog: fs.readFileSync(ctx.ghLog, 'utf8'),
    dockerLog: fs.readFileSync(ctx.dockerLog, 'utf8'),
  };
}

function lines(log) {
  return log.split('\n').filter((line) => line !== '');
}

function assertScriptExists() {
  assert.ok(fs.existsSync(path.join(repoRoot, script)), `${script} precisa existir`);
}

function assertContainerRemoved(result) {
  assert.ok(
    lines(result.dockerLog).some((line) => /^(rm|stop)\b/.test(line)),
    `o container precisa ser removido no trap\n${result.dockerLog}`,
  );
}

function assertFailedWith(result, check) {
  assert.equal(result.code, 1, `esperava saída 1\n${result.stdout}${result.stderr}`);
  assert.match(result.stdout, new RegExp(`^RESTORE_FAIL ${check}$`, 'm'), result.stdout);
  assert.ok(!result.stdout.includes('RESTORE_OK'), result.stdout);
}

test('caso 1: restore saudável imprime RESTORE_OK, restaura com privilégios, lê como app_api e remove o container', () => {
  assertScriptExists();
  const ctx = setup();
  const result = runDrill(ctx);
  assert.equal(result.code, 0, result.stdout + result.stderr);
  assert.match(result.stdout, new RegExp(`^RESTORE_OK tag=${TAG} seconds=\\d+$`, 'm'));
  assert.ok(!result.stdout.includes('RESTORE_FAIL'), result.stdout);

  const docker = lines(result.dockerLog);
  const run = docker.find((line) => /^run\b/.test(line)) ?? '';
  assert.ok(run.includes('127.0.0.1:54330:5432'), `porta só em 127.0.0.1:54330\n${run}`);
  assert.match(run, /postgres:17/, 'Postgres descartável 17');
  const restore = docker.find((line) => line.includes('pg_restore')) ?? '';
  assert.ok(restore.includes('--exit-on-error'), `pg_restore sem --exit-on-error\n${restore}`);
  assert.ok(restore.includes('--no-owner'), `pg_restore sem --no-owner\n${restore}`);
  // O dump de `--schema=public` traz `CREATE SCHEMA public`, que já existe num banco novo: o restore
  // troca o `public` vazio do destino pelo do backup, com os privilégios do backup.
  assert.ok(
    restore.includes('--clean --if-exists'),
    `pg_restore sem --clean --if-exists\n${restore}`,
  );
  assert.ok(!/--no-privileges|--no-acl|\s-x(\s|$)/.test(restore), 'o restore mantém GRANT/REVOKE');
  const appRead = docker.find((line) => line.includes('-U app_api')) ?? '';
  assert.match(appRead, /heartbeat/, 'a leitura de runtime como app_api consulta heartbeat');
  assert.match(appRead, /-h 127\.0\.0\.1/, 'a leitura de runtime conecta por TCP, com senha');
  for (const fragment of [
    "has_table_privilege('app_api', 'public.heartbeat', 'SELECT')",
    "has_table_privilege('anon', 'public.heartbeat', 'SELECT')",
    'heartbeat_app_api_select',
    'relrowsecurity',
    '_prisma_migrations',
    'count(*) from public.heartbeat',
  ]) {
    assert.ok(result.dockerLog.includes(fragment), `checagem ausente: ${fragment}`);
  }
  const createRoles = docker.find((line) => line.includes('CREATE ROLE')) ?? '';
  assert.ok(
    docker.indexOf(createRoles) < docker.indexOf(restore),
    'os papéis nascem antes do restore',
  );
  assert.match(createRoles, /app_api LOGIN NOSUPERUSER NOBYPASSRLS/);
  assertContainerRemoved(result);
  assert.deepEqual(fs.readdirSync(ctx.tmp), [], 'o diretório temporário precisa ser apagado');
});

test('caso 2: app_api sem SELECT em heartbeat sai 1 com RESTORE_FAIL app_api_select', () => {
  assertScriptExists();
  const result = runDrill(setup(), { FAKE_APP_API_SELECT: 'f' });
  assertFailedWith(result, 'app_api_select');
  assertContainerRemoved(result);
});

test('caso 3: anon com SELECT em heartbeat sai 1 com RESTORE_FAIL anon_denied', () => {
  assertScriptExists();
  const result = runDrill(setup(), { FAKE_ANON_SELECT: 't' });
  assertFailedWith(result, 'anon_denied');
  assertContainerRemoved(result);
});

test('caso 4: leitura vazia conectado como app_api sai 1 com RESTORE_FAIL app_api_read', () => {
  assertScriptExists();
  const result = runDrill(setup(), { FAKE_APP_API_READ: '' });
  assertFailedWith(result, 'app_api_read');
  assertContainerRemoved(result);
});

test('caso 5: pg_restore com erro sai 1 com RESTORE_FAIL pg_restore, sem checagens e com o container removido', () => {
  assertScriptExists();
  const result = runDrill(setup(), { FAKE_PG_RESTORE_EXIT: '1' });
  assertFailedWith(result, 'pg_restore');
  for (const fragment of ['has_table_privilege', 'relrowsecurity', '-U app_api']) {
    assert.ok(!result.dockerLog.includes(fragment), `checagem rodou depois da falha: ${fragment}`);
  }
  assertContainerRemoved(result);
});

test('caso 6: AGE_KEY inexistente sai 1 com RESTORE_FAIL age_key antes de chamar gh ou docker', () => {
  assertScriptExists();
  const ctx = setup();
  const result = runDrill(ctx, { AGE_KEY: path.join(ctx.dir, 'nao-existe.key') });
  assertFailedWith(result, 'age_key');
  assert.equal(result.ghLog, '', 'gh não pode ser chamado');
  assert.equal(result.dockerLog, '', 'docker não pode ser chamado');
});
