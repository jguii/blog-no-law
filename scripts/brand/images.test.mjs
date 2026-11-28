// Testes das imagens da marca (VIS-02, D-01, D-04): Open Graph, emblema recortado e banner da capa.
// Rodam a partir da raiz do repositório, sem rede. Os arquivos versionados são conferidos pelo
// cabeçalho (IHDR do PNG, SOF do JPEG), sem o `sharp`; o `sharp` só entra para rodar o gerador e
// olhar os pixels e os metadados da saída.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const generator = 'scripts/brand/images.mjs';
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const OG_ALT = 'No Law: emblema dos dragões e o slogan “Uma nova face, uma nova história.”';
const OG_MAX_BYTES = 500 * 1024;

// Mesma resolução do gerador: o pnpm não põe o `sharp` na raiz, então parte do `@blog/web`.
function loadSharp() {
  return createRequire(path.join(repoRoot, 'apps/web/package.json'))('sharp');
}

// Largura e altura do chunk IHDR (bytes 16 a 23) e o tipo de cor (byte 25; 6 = RGBA).
function readPngHeader(buffer) {
  assert.ok(buffer.subarray(0, 8).equals(PNG_SIGNATURE), 'assinatura PNG');
  assert.equal(buffer.toString('ascii', 12, 16), 'IHDR', 'primeiro chunk é o IHDR');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    colorType: buffer.readUInt8(25),
  };
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

function readFile(relativePath) {
  const full = path.join(repoRoot, relativePath);
  assert.ok(fs.existsSync(full), `${relativePath} precisa existir`);
  return fs.readFileSync(full);
}

async function withTempDir(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'brand-images-'));
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

test('gerador: escreve o Open Graph 1200x630 sem EXIF e o alt exato, e imprime BRAND_IMAGES_OK', async () => {
  const sharp = loadSharp();
  await withTempDir(async (tmp) => {
    const result = runGenerator(tmp);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.ok(result.stdout.includes('BRAND_IMAGES_OK'), result.stdout);

    const og = fs.readFileSync(path.join(tmp, 'app/opengraph-image.jpg'));
    const metadata = await sharp(og).metadata();
    assert.equal(metadata.format, 'jpeg');
    assert.deepEqual([metadata.width, metadata.height], [1200, 630]);
    assert.equal(metadata.exif, undefined, 'o Open Graph não pode carregar EXIF');

    const alt = fs.readFileSync(path.join(tmp, 'app/opengraph-image.alt.txt'), 'utf8');
    assert.equal(alt, OG_ALT, 'alt exato da UI-SPEC, sem quebra de linha final');
  });
});

test('arquivos versionados: o Open Graph é JPEG 1200x630 com menos de 500 KB e o alt é o exato', () => {
  const og = readFile('apps/web/app/opengraph-image.jpg');
  assert.deepEqual(readJpegSize(og), { width: 1200, height: 630 });
  assert.ok(
    og.length < OG_MAX_BYTES,
    `o Open Graph pesa ${og.length} bytes (limite ${OG_MAX_BYTES})`,
  );

  const alt = readFile('apps/web/app/opengraph-image.alt.txt').toString('utf8');
  assert.equal(alt, OG_ALT);
});

test('o leitor de cabeçalho do PNG devolve dimensões e tipo de cor', async () => {
  const sharp = loadSharp();
  const base = { create: { width: 40, height: 24, channels: 4, background: '#ac020f' } };
  const png = await sharp(base).png().toBuffer();
  assert.deepEqual(readPngHeader(png), { width: 40, height: 24, colorType: 6 });
});
