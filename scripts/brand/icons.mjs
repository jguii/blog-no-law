#!/usr/bin/env node
// Gerador manual dos ícones da marca (VIS-02, D-01, D-03). A fonte é a arte SVG versionada
// (apps/web/app/icon.svg, só o círculo com os dois dragões, sem texto); as saídas são versionadas e
// este script NÃO roda no build da Vercel nem na CI (só o teste dele, num diretório temporário).
//
// Uso: node scripts/brand/icons.mjs [--out DIR]   (padrão: apps/web; relativo à raiz do repositório)
// Escreve em DIR:
//   app/icon1.png               32x32, arte inteira (o <link rel="icon"> numerado do Next)
//   app/apple-icon.png          180x180, arte a 140px centralizada sobre #000000
//   public/brand/icon-512.png   512x512, arte a 398px centralizada sobre #000000 (manifesto do 02-12)
//   app/favicon.ico             PNG de 16 e de 32 num contêiner ICO (scripts/brand/ico.mjs)
// Saídas: `BRAND_ICONS_OK` e uma linha por arquivo com dimensões e peso.
// O `sharp` não fica na raiz do pnpm: é resolvido a partir de apps/web/package.json.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodeIco } from './ico.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SOURCE_SVG = path.join(repoRoot, 'apps/web/app/icon.svg');
const BLACK = '#000000';

function parseArgs(argv) {
  const options = { out: 'apps/web' };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--out') {
      const value = argv[i + 1];
      if (!value) {
        console.error('faltou o valor de --out');
        process.exit(2);
      }
      options.out = value;
      i += 1;
    } else {
      console.error(`argumento desconhecido: ${arg}`);
      process.exit(2);
    }
  }
  return options;
}

function loadSharp() {
  try {
    return createRequire(path.join(repoRoot, 'apps/web/package.json'))('sharp');
  } catch (error) {
    console.error(`o sharp não foi encontrado em apps/web (rode pnpm install): ${error.message}`);
    process.exit(1);
  }
}

const options = parseArgs(process.argv.slice(2));
const outDir = path.resolve(repoRoot, options.out);
const sharp = loadSharp();
const svg = fs.readFileSync(SOURCE_SVG);

// A arte renderizada em `size`px, com fundo transparente. O `sharp` remove os metadados por padrão
// (inclusive EXIF), então nada de câmera ou localização vai para os arquivos públicos.
function renderArt(size) {
  return sharp(svg, { density: Math.ceil((72 * size) / 100) * 2 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

// Quadrado `size`px de #000000 com a arte de `artSize`px no centro.
async function renderOnBlack(size, artSize) {
  const art = await renderArt(artSize);
  const offset = Math.round((size - artSize) / 2);
  return sharp({ create: { width: size, height: size, channels: 3, background: BLACK } })
    .composite([{ input: art, left: offset, top: offset }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

function write(relativePath, buffer) {
  const target = path.join(outDir, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, buffer);
}

const files = [
  { file: 'app/icon1.png', dimensions: '32x32', buffer: await renderArt(32) },
  { file: 'app/apple-icon.png', dimensions: '180x180', buffer: await renderOnBlack(180, 140) },
  {
    file: 'public/brand/icon-512.png',
    dimensions: '512x512',
    buffer: await renderOnBlack(512, 398),
  },
  {
    file: 'app/favicon.ico',
    dimensions: '16x16+32x32',
    buffer: encodeIco([
      { size: 16, png: await renderArt(16) },
      { size: 32, png: await renderArt(32) },
    ]),
  },
];

for (const { file, buffer } of files) write(file, buffer);

console.log('BRAND_ICONS_OK');
for (const { file, dimensions, buffer } of files) {
  console.log(`${file} ${dimensions} ${buffer.length} bytes`);
}
