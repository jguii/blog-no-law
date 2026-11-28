// Testes dos ícones da marca (VIS-02, D-01, D-03). Rodam a partir da raiz do repositório, sem rede.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const iconSvg = path.join(repoRoot, 'apps/web/app/icon.svg');

test('favicon SVG: arte dos dragões em 100x100, só com as cores da marca e sem texto, script ou referência externa', () => {
  assert.ok(fs.existsSync(iconSvg), 'apps/web/app/icon.svg precisa existir');
  const svg = fs.readFileSync(iconSvg, 'utf8');
  assert.ok(svg.includes('viewBox="0 0 100 100"'), 'viewBox 0 0 100 100');
  for (const color of ['#000000', '#ac020f', '#c8a04a']) {
    assert.ok(svg.includes(color), `cor da marca ${color}`);
  }
  for (const forbidden of ['<text', '<script', 'href', 'xlink']) {
    assert.ok(!svg.includes(forbidden), `o favicon não pode conter ${forbidden}`);
  }
});
