// Testes dos ícones da marca (VIS-02, D-01, D-03). Rodam a partir da raiz do repositório, sem rede.
// Os arquivos versionados são conferidos pelo cabeçalho (IHDR do PNG, SOF do JPEG, diretório do ICO),
// sem o `sharp`; o `sharp` só entra para rodar o gerador e olhar os pixels e os metadados da saída.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const iconSvg = path.join(repoRoot, 'apps/web/app/icon.svg');
const generator = 'scripts/brand/icons.mjs';
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// Mesma resolução do gerador: o pnpm não põe o `sharp` na raiz, então parte do `@blog/web`.
function loadSharp() {
  return createRequire(path.join(repoRoot, 'apps/web/package.json'))('sharp');
}

// Largura e altura do chunk IHDR (bytes 16 a 23), depois da assinatura e do cabeçalho do chunk.
function readPngSize(buffer) {
  assert.ok(buffer.subarray(0, 8).equals(PNG_SIGNATURE), 'assinatura PNG');
  assert.equal(buffer.toString('ascii', 12, 16), 'IHDR', 'primeiro chunk é o IHDR');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

// Largura e altura do primeiro marcador SOF (início de quadro) de um JPEG.
function readJpegSize(buffer) {
  assert.equal(buffer.readUInt16BE(0), 0xffd8, 'assinatura JPEG');
  let at = 2;
  while (at + 9 < buffer.length) {
    assert.equal(buffer[at], 0xff, 'marcador JPEG');
    const marker = buffer[at + 1];
    const isFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isFrame) return { width: buffer.readUInt16BE(at + 7), height: buffer.readUInt16BE(at + 5) };
    at += 2 + buffer.readUInt16BE(at + 2);
  }
  assert.fail('JPEG sem marcador SOF');
}

// Entradas do diretório do ICO: o byte 0 de largura/altura vale 256.
function readIcoEntries(buffer) {
  assert.equal(buffer.readUInt16LE(0), 0, 'reservado');
  assert.equal(buffer.readUInt16LE(2), 1, 'tipo ícone');
  const count = buffer.readUInt16LE(4);
  const entries = [];
  for (let index = 0; index < count; index += 1) {
    const at = 6 + index * 16;
    const length = buffer.readUInt32LE(at + 8);
    const offset = buffer.readUInt32LE(at + 12);
    entries.push({
      width: buffer.readUInt8(at) || 256,
      height: buffer.readUInt8(at + 1) || 256,
      png: buffer.subarray(offset, offset + length),
    });
  }
  return entries;
}

function readFile(relativePath) {
  const full = path.join(repoRoot, relativePath);
  assert.ok(fs.existsSync(full), `${relativePath} precisa existir`);
  return fs.readFileSync(full);
}

async function withTempDir(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'brand-icons-'));
  try {
    return await fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function runGenerator(out) {
  return spawnSync(process.execPath, [generator, '--out', out], {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 60000,
  });
}

const EXPECTED_PNGS = [
  { file: 'app/icon1.png', size: 32 },
  { file: 'app/apple-icon.png', size: 180 },
  { file: 'public/brand/icon-512.png', size: 512 },
];

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

test('leitores de cabeçalho: o do JPEG acha o SOF e o do PNG acha o IHDR', async () => {
  const sharp = loadSharp();
  const base = { create: { width: 40, height: 24, channels: 3, background: '#ac020f' } };
  const jpeg = await sharp(base).jpeg().toBuffer();
  assert.deepEqual(readJpegSize(jpeg), { width: 40, height: 24 });
  const png = await sharp(base).png().toBuffer();
  assert.deepEqual(readPngSize(png), { width: 40, height: 24 });
});

test('gerador: escreve os PNG e o ICO nos tamanhos certos, sem EXIF, e imprime BRAND_ICONS_OK', async () => {
  const sharp = loadSharp();
  await withTempDir(async (tmp) => {
    const result = runGenerator(tmp);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.ok(result.stdout.includes('BRAND_ICONS_OK'), result.stdout);

    for (const { file, size } of EXPECTED_PNGS) {
      const full = path.join(tmp, file);
      assert.ok(fs.existsSync(full), `${file} precisa existir`);
      const buffer = fs.readFileSync(full);
      assert.deepEqual(readPngSize(buffer), { width: size, height: size }, file);
      const metadata = await sharp(buffer).metadata();
      assert.equal(metadata.exif, undefined, `${file} não pode carregar EXIF`);
    }

    const icoPath = path.join(tmp, 'app/favicon.ico');
    assert.ok(fs.existsSync(icoPath), 'app/favicon.ico precisa existir');
    const entries = readIcoEntries(fs.readFileSync(icoPath));
    assert.deepEqual(
      entries.map((entry) => [entry.width, entry.height]),
      [
        [16, 16],
        [32, 32],
      ],
    );
    for (const entry of entries) {
      assert.deepEqual(readPngSize(entry.png), { width: entry.width, height: entry.height });
    }
  });
});

test('gerador: o ícone do app é a arte centralizada num quadrado #000000 (cantos pretos, aro dourado)', async () => {
  const sharp = loadSharp();
  await withTempDir(async (tmp) => {
    const result = runGenerator(tmp);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    for (const { file, size, art } of [
      { file: 'app/apple-icon.png', size: 180, art: 140 },
      { file: 'public/brand/icon-512.png', size: 512, art: 398 },
    ]) {
      const { data, info } = await sharp(path.join(tmp, file))
        .raw()
        .toBuffer({ resolveWithObject: true });
      const pixel = (x, y) => Array.from(data.subarray((y * size + x) * info.channels).slice(0, 3));
      for (const [x, y] of [
        [0, 0],
        [size - 1, 0],
        [0, size - 1],
        [size - 1, size - 1],
      ]) {
        assert.deepEqual(pixel(x, y), [0, 0, 0], `${file} canto ${x},${y} é #000000`);
      }
      // A meio da altura, o aro dourado começa a margem + ~3% da arte para dentro do quadrado.
      const margin = Math.round((size - art) / 2);
      const [r, g, b] = pixel(margin + Math.round(art * 0.025), Math.round(size / 2));
      assert.ok(r > 170 && g > 120 && b < 140, `${file} aro dourado, veio ${r},${g},${b}`);
    }
  });
});

test('arquivos versionados: PNG e ICO têm as dimensões certas, lidas do cabeçalho', () => {
  for (const { file, size } of EXPECTED_PNGS) {
    const relative = `apps/web/${file}`;
    assert.deepEqual(readPngSize(readFile(relative)), { width: size, height: size }, relative);
  }
  const entries = readIcoEntries(readFile('apps/web/app/favicon.ico'));
  assert.deepEqual(
    entries.map((entry) => [entry.width, entry.height]),
    [
      [16, 16],
      [32, 32],
    ],
  );
  for (const entry of entries) {
    assert.deepEqual(readPngSize(entry.png), { width: entry.width, height: entry.height });
  }
});
