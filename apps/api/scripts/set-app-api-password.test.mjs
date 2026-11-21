// Teste da rotação de senha do `app_api` (T-01-40) contra o Postgres local do compose.
// Usa um papel próprio (`app_api_pwtest`) para não tocar no `app_api` nem no banco `blog_test`
// que os testes de integração usam em paralelo. Todos os valores abaixo são só de teste local.
//
// Pré-requisito: docker compose -f compose.test.yaml up -d --wait
// Execução:      node --test apps/api/scripts/set-app-api-password.test.mjs
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const SCRIPT = fileURLToPath(new URL('./set-app-api-password.mjs', import.meta.url));
const ROLE = 'app_api_pwtest';
const ADMIN_URL =
  process.env.DATABASE_URL_TEST_ADMIN ?? 'postgresql://postgres:postgres@127.0.0.1:54329/postgres';
const CANONICAL_URL =
  /^postgresql:\/\/app_api_pwtest\.testref:[^:@/?#\s]+@pooler\.example\.test:5432\/postgres\?sslmode=require$/;

let workDir;
let envCounter = 0;

async function withAdmin(run) {
  const client = new pg.Client({ connectionString: ADMIN_URL });
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

async function dropRole(client) {
  await client.query(`DROP ROLE IF EXISTS ${ROLE}`);
}

// Cria um env file novo por teste (permissão 644 de propósito: o script precisa corrigir para 600).
function makeEnvFile() {
  envCounter += 1;
  const file = join(workDir, `production-${envCounter}.env`);
  writeFileSync(
    file,
    [
      `MIGRATE_DATABASE_URL='${ADMIN_URL}'`,
      `SUPABASE_PROJECT_REF='testref'`,
      `SUPABASE_POOLER_HOST='pooler.example.test'`,
      `KEEP_ME='1'`,
      '',
    ].join('\n'),
  );
  chmodSync(file, 0o644);
  return file;
}

function runScript(envFile, role = ROLE) {
  // Ambiente montado do zero: o script não herda nenhuma credencial do shell de quem roda o teste.
  return spawnSync(process.execPath, [SCRIPT], {
    env: { PATH: process.env.PATH ?? '', ENV_FILE: envFile, APP_API_ROLE: role },
    encoding: 'utf8',
  });
}

function databaseUrlLines(envFile) {
  return readFileSync(envFile, 'utf8')
    .split('\n')
    .filter((line) => line.startsWith('DATABASE_URL='));
}

// Extrai a URL (entre aspas simples) da linha DATABASE_URL= do env file.
function readDatabaseUrl(envFile) {
  const [line] = databaseUrlLines(envFile);
  assert.ok(line, 'linha DATABASE_URL= ausente');
  return line.slice('DATABASE_URL='.length).replace(/^'|'$/g, '');
}

function passwordOf(envFile) {
  return decodeURIComponent(new URL(readDatabaseUrl(envFile)).password);
}

async function loginState(password) {
  const target = new URL(ADMIN_URL);
  const client = new pg.Client({
    host: target.hostname,
    port: Number(target.port),
    user: ROLE,
    password,
    database: 'postgres',
  });
  client.on('error', () => {});
  try {
    await client.connect();
    const who = await client.query('SELECT current_user AS name');
    return `login ok como ${who.rows[0].name}`;
  } catch (error) {
    return `erro ${error.code}`;
  } finally {
    await client.end().catch(() => {});
  }
}

describe('set-app-api-password.mjs', () => {
  before(async () => {
    workDir = mkdtempSync(join(tmpdir(), 'set-app-api-password-'));
    await withAdmin(async (client) => {
      await dropRole(client);
      await client.query(`CREATE ROLE ${ROLE} LOGIN NOSUPERUSER NOBYPASSRLS`);
    });
  });

  after(async () => {
    await withAdmin(dropRole);
    rmSync(workDir, { recursive: true, force: true });
  });

  it('sai com 0 e imprime uma única linha com o caminho do env file', () => {
    const envFile = makeEnvFile();
    const result = runScript(envFile);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, `DATABASE_URL atualizado em ${envFile}\n`);
  });

  it('regrava o env file com permissão 600, uma linha DATABASE_URL na forma canônica e as demais intactas', () => {
    const envFile = makeEnvFile();
    const before = readFileSync(envFile, 'utf8');
    const result = runScript(envFile);
    assert.equal(result.status, 0);
    assert.equal((statSync(envFile).mode & 0o777).toString(8), '600');
    assert.equal(databaseUrlLines(envFile).length, 1);
    assert.match(readDatabaseUrl(envFile), CANONICAL_URL);
    const others = readFileSync(envFile, 'utf8')
      .split('\n')
      .filter((line) => !line.startsWith('DATABASE_URL='))
      .join('\n');
    assert.equal(others, before);
  });

  it('gera senha de pelo menos 43 caracteres que faz login como o papel de teste', async () => {
    const envFile = makeEnvFile();
    const result = runScript(envFile);
    assert.equal(result.status, 0);
    const password = passwordOf(envFile);
    assert.ok(password.length >= 43, `senha curta: ${password.length} caracteres`);
    assert.equal(await loginState(password), `login ok como ${ROLE}`);
  });

  it('a segunda execução troca a senha: nova diferente, uma só linha, antiga recusada com 28P01', async () => {
    const envFile = makeEnvFile();
    assert.equal(runScript(envFile).status, 0);
    const oldPassword = passwordOf(envFile);
    assert.equal(runScript(envFile).status, 0);
    const newPassword = passwordOf(envFile);
    assert.notEqual(newPassword, oldPassword);
    assert.equal(databaseUrlLines(envFile).length, 1);
    assert.equal(await loginState(oldPassword), 'erro 28P01');
    assert.equal(await loginState(newPassword), `login ok como ${ROLE}`);
  });

  it('não imprime a senha gerada em stdout nem em stderr', () => {
    const envFile = makeEnvFile();
    const result = runScript(envFile);
    assert.equal(result.status, 0);
    const password = passwordOf(envFile);
    const output = `${result.stdout}\n${result.stderr}`;
    assert.equal(output.includes(password), false);
    assert.equal(output.includes(encodeURIComponent(password)), false);
  });

  it('rejeita APP_API_ROLE fora de ^[a-z_][a-z0-9_]*$ sem mexer no env file', () => {
    const envFile = makeEnvFile();
    const before = readFileSync(envFile, 'utf8');
    const result = runScript(envFile, 'App-Api; DROP ROLE x');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /APP_API_ROLE inválido/);
    assert.equal(readFileSync(envFile, 'utf8'), before);
  });
});
