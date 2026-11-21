// Testes do gate de HTML bruto (SEC-03). Rodam a partir da raiz do repositório, sem rede e sem pacote npm.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = 'scripts/check-no-raw-html.mjs';
const unsafeRoot = 'scripts/__fixtures__/raw-html/unsafe';
const safeRoot = 'scripts/__fixtures__/raw-html/safe';
const unsafeFile = `${unsafeRoot}/page.tsx`;

function run(args) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 20000,
  });
}

// A linha esperada é calculada lendo a fixture (o formatador pode reformatá-la).
function expectedLine() {
  const lines = fs.readFileSync(path.join(repoRoot, unsafeFile), 'utf8').split('\n');
  const index = lines.findIndex((line) => line.includes('dangerouslySetInnerHTML'));
  assert.notEqual(index, -1, 'a fixture insegura precisa conter o identificador');
  return index + 1;
}

function withTempAllowlist(allow, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'raw-html-allowlist-'));
  try {
    const file = path.join(dir, 'allowlist.json');
    fs.writeFileSync(file, JSON.stringify({ allow }));
    return fn(file);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('fixture insegura: sai 1 e imprime caminho:linha', () => {
  const result = run(['--root', unsafeRoot]);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.ok(
    result.stdout.includes(`${unsafeFile}:${expectedLine()}`),
    `esperava ${unsafeFile}:${expectedLine()} na saída: ${result.stdout}`,
  );
  assert.ok(!result.stdout.includes('RAW_HTML_OK'));
});

test('fixture segura: sai 0 e imprime RAW_HTML_OK', () => {
  const result = run(['--root', safeRoot]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.ok(result.stdout.includes('RAW_HTML_OK'));
});

test('allowlist com o caminho da fixture insegura: sai 0', () => {
  withTempAllowlist([unsafeFile], (allowlist) => {
    const result = run(['--root', unsafeRoot, '--allowlist', allowlist]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.ok(result.stdout.includes('RAW_HTML_OK'));
  });
});

test('allowlist podre (item que não existe mais): sai 1 com STALE_ALLOWLIST', () => {
  withTempAllowlist(
    [unsafeFile, 'scripts/__fixtures__/raw-html/unsafe/removido.tsx'],
    (allowlist) => {
      const result = run(['--root', unsafeRoot, '--allowlist', allowlist]);
      assert.equal(result.status, 1, result.stdout + result.stderr);
      assert.ok(
        result.stdout.includes('STALE_ALLOWLIST scripts/__fixtures__/raw-html/unsafe/removido.tsx'),
      );
    },
  );
});

test('sem argumentos: varre o apps/web real com a allowlist vazia e sai 0', () => {
  const result = run([]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.ok(result.stdout.includes('RAW_HTML_OK'));
});
