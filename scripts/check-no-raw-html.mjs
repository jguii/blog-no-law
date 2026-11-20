#!/usr/bin/env node
// Gate de HTML bruto (SEC-03): falha se a prop de HTML bruto do React aparecer em apps/web
// fora da allowlist explícita. É a segunda camada, independente da regra `react/no-danger` do ESLint.
//
// Uso: node scripts/check-no-raw-html.mjs [--root DIR] [--allowlist FILE]
// Saídas: `caminho:linha` (uso proibido), `STALE_ALLOWLIST caminho` (item podre) e `RAW_HTML_OK`.
// Só módulos `node:`; imprime apenas caminho e número de linha, nunca o conteúdo.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FORBIDDEN = 'dangerouslySetInnerHTML';
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.mdx']);
const IGNORED_DIRS = new Set(['node_modules', '.next', 'coverage', 'playwright-report', 'test-results']);

function parseArgs(argv) {
  const options = { root: 'apps/web', allowlist: 'scripts/raw-html-allowlist.json' };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--root' || arg === '--allowlist') {
      const value = argv[i + 1];
      if (!value) {
        console.error(`faltou o valor de ${arg}`);
        process.exit(2);
      }
      options[arg.slice(2)] = value;
      i += 1;
    } else {
      console.error(`argumento desconhecido: ${arg}`);
      process.exit(2);
    }
  }
  return options;
}

// Caminho relativo à raiz do repositório, sempre com `/`.
function toRepoPath(absolute) {
  return path.relative(repoRoot, absolute).split(path.sep).join('/');
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) yield* walk(full);
    } else if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name))) {
      yield full;
    }
  }
}

function loadAllowlist(file) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    console.error(`allowlist ilegível ou inválida: ${toRepoPath(file)}`);
    process.exit(2);
  }
  if (!parsed || !Array.isArray(parsed.allow) || !parsed.allow.every((item) => typeof item === 'string')) {
    console.error('a allowlist precisa ter o formato { "allow": ["caminho/relativo.tsx"] }');
    process.exit(2);
  }
  return parsed.allow;
}

const options = parseArgs(process.argv.slice(2));
const rootDir = path.resolve(repoRoot, options.root);
const allow = loadAllowlist(path.resolve(repoRoot, options.allowlist));
const allowed = new Set(allow);

if (!fs.existsSync(rootDir) || !fs.statSync(rootDir).isDirectory()) {
  console.error(`diretório raiz não encontrado: ${options.root}`);
  process.exit(2);
}

let failed = false;

// A allowlist não pode apodrecer: item que sumiu do disco é erro.
for (const item of allow) {
  if (!fs.existsSync(path.resolve(repoRoot, item))) {
    console.log(`STALE_ALLOWLIST ${item}`);
    failed = true;
  }
}

for (const file of walk(rootDir)) {
  const repoPath = toRepoPath(file);
  if (allowed.has(repoPath)) continue;
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    if (line.includes(FORBIDDEN)) {
      console.log(`${repoPath}:${index + 1}`);
      failed = true;
    }
  });
}

if (failed) process.exit(1);
console.log('RAW_HTML_OK');
