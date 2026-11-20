// Testes da forma da CI (QA-04, SEC-03, SEC-04, D-08, D-14): leem o workflow e a config do gitleaks
// como texto. A semântica do `ci-ok` só executa no runner do GitHub; aqui fica fixada a forma que a
// produz, e o run real da CI prova o caminho verde. Só módulos `node:`, sem parser de YAML ou TOML.
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

// O bloco de um job é o trecho entre a linha `  {job}:` e a próxima chave de job no mesmo recuo
// (ou a próxima chave de nível superior, ou o fim do arquivo). Vazio quando o job não existe.
function jobBlock(workflow, job) {
  const lines = workflow.split('\n');
  const start = lines.findIndex((line) => line === `  ${job}:`);
  if (start === -1) return '';
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^ {2}[A-Za-z0-9_-]+:/.test(lines[index]) || /^[A-Za-z0-9_-]+:/.test(lines[index])) {
      end = index;
      break;
    }
  }
  return lines.slice(start, end).join('\n');
}

// Linhas de configuração sem comentários inteiros (um comentário pode citar o que é proibido).
function configLines(text) {
  return text.split('\n').filter((line) => !line.trim().startsWith('#'));
}

test('guarda do ci-ok: always() e falha em failure, cancelled e skipped', () => {
  const block = jobBlock(readText('.github/workflows/ci.yml'), 'ci-ok');
  assert.notEqual(block, '', 'o job ci-ok precisa existir em .github/workflows/ci.yml');
  assert.match(block, /^\s+if: always\(\)\s*$/m, 'ci-ok precisa rodar sempre (if: always())');
  const needsLines = block.split('\n').filter((line) => /^\s+needs:/.test(line));
  assert.equal(needsLines.length, 1, 'ci-ok precisa ter uma única linha needs: [...]');
  assert.match(needsLines[0], /needs:\s*\[.*\]/, 'a lista needs precisa estar numa linha só');
  for (const job of ['lint', 'typecheck', 'test-api', 'test-web', 'secrets']) {
    assert.match(needsLines[0], new RegExp(`\\b${job}\\b`), `ci-ok precisa depender de ${job}`);
  }
  for (const result of ['failure', 'cancelled', 'skipped']) {
    assert.ok(
      block.includes(`contains(needs.*.result, '${result}')`),
      `a condição do passo de falha precisa citar ${result}`,
    );
  }
  assert.match(block, /\bexit 1\b/, 'o passo de falha precisa sair com exit 1');
});

test('guarda do gitleaks: regras padrão e allowlist só com literais exatos de teste local', () => {
  const raw = readText('.gitleaks.toml');
  assert.notEqual(raw, '', '.gitleaks.toml precisa existir na raiz');
  const lines = configLines(raw).join('\n');
  assert.match(lines, /^\s*useDefault\s*=\s*true\s*$/m, 'precisa estender as regras padrão');
  assert.ok(!/disabledRules/.test(lines), 'não pode desligar regra nenhuma');
  assert.ok(!/^\s*paths\s*=/m.test(lines), 'a allowlist não pode liberar caminhos inteiros');
  assert.ok(!/^\s*commits\s*=/m.test(lines), 'a allowlist não pode liberar commits inteiros');
  for (const literal of ['app_api_local_test', 'postgres:postgres']) {
    assert.ok(lines.includes(literal), `a allowlist precisa citar o literal ${literal}`);
  }
  // Nada de regex genérica: cada entrada é um literal inteiro, ancorado nas duas pontas.
  const entries = [...lines.matchAll(/'''(.*?)'''/g)].map((match) => match[1]);
  assert.ok(entries.length >= 2, 'a allowlist precisa ter as entradas de literais');
  for (const entry of entries) {
    assert.match(
      entry,
      /^\^[A-Za-z0-9_:-]+\$$/,
      `entrada não é um literal exato ancorado: ${entry}`,
    );
  }
});

test('ligação dos gates: package.json tem check:raw-html e test:scripts, e o verify roda os dois antes do turbo', () => {
  let pkg = {};
  try {
    pkg = JSON.parse(readText('package.json'));
  } catch {
    pkg = {};
  }
  assert.equal(pkg.scripts?.['check:raw-html'], 'node scripts/check-no-raw-html.mjs');
  assert.equal(pkg.scripts?.['test:scripts'], 'node --test scripts/');
  const verify = pkg.scripts?.verify ?? '';
  const turboAt = verify.indexOf('turbo run');
  const rawHtmlAt = verify.indexOf('pnpm run check:raw-html');
  const scriptsAt = verify.indexOf('pnpm run test:scripts');
  assert.notEqual(turboAt, -1, 'verify precisa chamar turbo run');
  assert.ok(rawHtmlAt !== -1 && rawHtmlAt < turboAt, 'verify: check:raw-html antes do turbo run');
  assert.ok(scriptsAt !== -1 && scriptsAt < turboAt, 'verify: test:scripts antes do turbo run');
});

test('ligação dos gates: o job lint roda o gate de HTML bruto e os testes dos scripts', () => {
  const block = jobBlock(readText('.github/workflows/ci.yml'), 'lint');
  assert.notEqual(block, '', 'o job lint precisa existir');
  assert.match(block, /run: pnpm run check:raw-html\s*$/m, 'lint precisa rodar check:raw-html');
  assert.match(block, /run: pnpm run test:scripts\s*$/m, 'lint precisa rodar test:scripts');
});

test('ligação dos gates: o job postgrest-anon fixa a imagem por digest e usa modo estrito com autoteste', () => {
  const block = jobBlock(readText('.github/workflows/ci.yml'), 'postgrest-anon');
  assert.notEqual(block, '', 'o job postgrest-anon precisa existir');
  assert.match(
    block,
    /postgrest\/postgrest:v16\.5@sha256:[0-9a-f]{64}\b/,
    'a imagem do PostgREST precisa estar fixada por digest sha256',
  );
  assert.ok(block.includes('POSTGREST_STRICT=1'), 'o smoke precisa rodar em modo estrito');
  assert.ok(block.includes('POSTGREST_GATE_SELFTEST_OK'), 'o autoteste do portão precisa existir');
  assert.ok(
    block.includes('POSTGREST_ANON_BLOCKED'),
    'o job precisa exigir POSTGREST_ANON_BLOCKED',
  );
});

test('ligação dos gates: postgrest-anon está na linha needs do ci-ok', () => {
  const block = jobBlock(readText('.github/workflows/ci.yml'), 'ci-ok');
  const needsLine = block.split('\n').find((line) => /^\s+needs:/.test(line)) ?? '';
  for (const job of ['lint', 'typecheck', 'test-api', 'test-web', 'secrets', 'postgrest-anon']) {
    assert.match(needsLine, new RegExp(`\\b${job}\\b`), `ci-ok precisa depender de ${job}`);
  }
});

test('ligação dos gates: dependabot cobre github-actions e npm com os cinco grupos', () => {
  const text = readText('.github/dependabot.yml');
  assert.notEqual(text, '', '.github/dependabot.yml precisa existir');
  assert.match(text, /package-ecosystem:\s*['"]?github-actions['"]?/);
  assert.match(text, /package-ecosystem:\s*['"]?npm['"]?/);
  for (const group of ['prisma', 'nestjs', 'sentry', 'next-react', 'pino']) {
    assert.match(text, new RegExp(`^\\s+${group}:\\s*$`, 'm'), `falta o grupo ${group}`);
  }
});
