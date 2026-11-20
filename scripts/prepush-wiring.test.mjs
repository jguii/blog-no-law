// Testes da ligação do portão local (QA-03, D-09): hook de pre-push, Turborepo e scripts.
// Só leem arquivos: não fazem `git push` nem chamam `scripts/verify-prepush.sh`, porque a partir
// do 01-09 rodam dentro do próprio pre-push e um push aqui dentro entraria em recursão.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Devolve string vazia quando o arquivo não existe: a falha vem da asserção, não do carregamento.
function readText(relativePath) {
  try {
    return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  } catch {
    return '';
  }
}

function readJson(relativePath) {
  const text = readText(relativePath);
  if (text === '') return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

const EXACT_VERSION = /^\d+\.\d+\.\d+$/;

test('ligação 1: o hook sobe o compose com --wait antes do verify e não cita tooling nem E2E', () => {
  const hook = readText('.husky/pre-push');
  const composeAt = hook.search(/docker compose -f compose\.test\.yaml up\b[^\n]*--wait/);
  const verifyAt = hook.indexOf('pnpm run verify');
  assert.notEqual(composeAt, -1, 'o hook precisa subir o compose.test.yaml com --wait');
  assert.notEqual(verifyAt, -1, 'o hook precisa chamar pnpm run verify');
  assert.ok(composeAt < verifyAt, 'o compose precisa subir antes do verify');
  assert.ok(!hook.includes('.claude'), 'o hook não pode citar o diretório de tooling (D-12)');
  assert.ok(!/gsd/i.test(hook), 'o hook não pode citar o GSD (D-12)');
  assert.ok(!hook.includes('test:e2e'), 'o E2E do Playwright só roda na CI (D-09)');
});

test('ligação 2: package.json raiz tem prepare=husky, verify via turbo run e versões exatas', () => {
  const pkg = readJson('package.json');
  assert.equal(pkg.scripts?.prepare, 'husky');
  const verify = pkg.scripts?.verify ?? '';
  const afterTurbo = verify.includes('turbo run') ? verify.slice(verify.indexOf('turbo run')) : '';
  for (const task of ['lint', 'typecheck', 'test', 'test:http', 'test:integration']) {
    const found = afterTurbo.split(/\s+/).includes(task);
    assert.ok(found, `o verify precisa passar ${task} para o turbo run`);
  }
  for (const name of ['turbo', 'husky']) {
    const version = pkg.devDependencies?.[name] ?? '';
    assert.match(version, EXACT_VERSION, `${name} precisa estar fixado em versão exata`);
  }
});

test('ligação 3: test:integration declara DATABASE_URL_TEST_ADMIN em env e prisma/** em inputs', () => {
  const tasks = readJson('turbo.json').tasks ?? {};
  for (const key of ['test:integration', '@blog/api#test:integration']) {
    const task = tasks[key];
    assert.ok(task, `turbo.json precisa ter a entrada ${key}`);
    assert.ok(
      task.env?.includes('DATABASE_URL_TEST_ADMIN'),
      `${key}: env sem DATABASE_URL_TEST_ADMIN`,
    );
    assert.ok(task.inputs?.includes('prisma/**'), `${key}: inputs sem prisma/**`);
  }
});

test('ligação 4: tarefas do @blog/api que usam o cliente Prisma dependem do build e o build guarda src/generated', () => {
  const tasks = readJson('turbo.json').tasks ?? {};
  for (const name of ['lint', 'typecheck', 'test', 'test:integration']) {
    const key = `@blog/api#${name}`;
    assert.ok(tasks[key]?.dependsOn?.includes('build'), `${key} precisa de build no dependsOn`);
  }
  assert.ok(
    tasks.build?.outputs?.includes('src/generated/**'),
    'o outputs do build precisa incluir src/generated/**',
  );
});

test('ligação 5: no @blog/api, build gera o cliente, typecheck não gera e test:integration roda os scripts node:test', () => {
  const scripts = readJson('apps/api/package.json').scripts ?? {};
  assert.ok(
    (scripts.build ?? '').startsWith('prisma generate'),
    'build precisa começar com prisma generate',
  );
  assert.ok(scripts.typecheck !== undefined, 'typecheck precisa existir');
  assert.ok(
    !scripts.typecheck.includes('prisma generate'),
    'typecheck não pode rodar prisma generate',
  );
  assert.ok(
    (scripts['test:integration'] ?? '').includes('node --test scripts/*.test.mjs'),
    'test:integration precisa rodar também node --test scripts/*.test.mjs',
  );
});

test('ligação 6: .oxlintrc.json exige no-floating-promises e ignora dist e o cliente gerado', () => {
  const config = readJson('.oxlintrc.json');
  assert.equal(config.rules?.['typescript/no-floating-promises'], 'error');
  const ignored = config.ignorePatterns ?? [];
  assert.ok(ignored.includes('**/dist/**'), 'ignorePatterns sem **/dist/**');
  assert.ok(ignored.includes('**/src/generated/**'), 'ignorePatterns sem **/src/generated/**');
});

test('ligação 7: lint do api e do shared via oxlint com versões exatas, lint do web segue no eslint', () => {
  const api = readJson('apps/api/package.json');
  const shared = readJson('packages/shared/package.json');
  const web = readJson('apps/web/package.json');
  assert.equal(api.scripts?.lint, 'oxlint --type-aware -c ../../.oxlintrc.json src/ test/');
  assert.equal(shared.scripts?.lint, 'oxlint --type-aware -c ../../.oxlintrc.json src/');
  assert.equal(web.scripts?.lint, 'eslint .');
  for (const pkg of [api, shared]) {
    for (const name of ['oxlint', 'oxlint-tsgolint']) {
      assert.match(
        pkg.devDependencies?.[name] ?? '',
        EXACT_VERSION,
        `${pkg.name}: ${name} sem versão exata`,
      );
    }
  }
});

test('ligação 8: verify roda format:check antes do turbo run e o .prettierignore cobre o que não se formata', () => {
  const pkg = readJson('package.json');
  const verify = pkg.scripts?.verify ?? '';
  const formatAt = verify.indexOf('format:check');
  const turboAt = verify.indexOf('turbo run');
  assert.notEqual(formatAt, -1, 'verify precisa chamar format:check');
  assert.notEqual(turboAt, -1, 'verify precisa chamar turbo run');
  assert.ok(formatAt < turboAt, 'format:check precisa vir antes do turbo run');
  const ignored = readText('.prettierignore')
    .split('\n')
    .map((line) => line.trim());
  for (const entry of ['pnpm-lock.yaml', '.planning', '.claude', 'apps/api/src/generated']) {
    assert.ok(ignored.includes(entry), `.prettierignore sem ${entry}`);
  }
});
