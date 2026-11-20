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

test('guarda do gitleaks: regras padrão e allowlist só com os dois literais de teste local', () => {
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
});
