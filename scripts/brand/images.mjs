#!/usr/bin/env node
// Gerador manual das imagens da marca (VIS-02, D-01, D-04). As fontes são os JPG do clã versionados
// em assets/brand/; as saídas são versionadas e este script NÃO roda no build da Vercel nem na CI
// (só o teste dele, num diretório temporário).
//
// Uso: node scripts/brand/images.mjs [--out DIR]   (padrão: apps/web; relativo à raiz do repositório)
// Escreve em DIR:
//   app/opengraph-image.jpg       1200x630, recorte do banner com emblema e slogan inteiros (D-04)
//   app/opengraph-image.alt.txt   o `alt` do Open Graph, sem quebra de linha final
// Saídas: `BRAND_IMAGES_OK` e uma linha por arquivo com dimensões e peso.
// O `sharp` não fica na raiz do pnpm: é resolvido a partir de apps/web/package.json. Ele remove os
// metadados por padrão (inclusive EXIF e GPS), e este script nunca pede o contrário (T-02-09).
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const BANNER = path.join(repoRoot, 'assets/brand/Banner No Law.jpg');

const OG_ALT = 'No Law: emblema dos dragões e o slogan “Uma nova face, uma nova história.”';

// Banner 1500x500 levado a 630px de altura vira 1890x630; o recorte de 1200px de largura começa em
// OG_LEFT. A 348, a janela (348 a 1547) fica entre as duas nuvens: a do canto esquerdo termina em 345 e a do
// canto direito começa em 1548. O emblema (centro perto de 920) e o slogan (529 a 1348) ficam inteiros.
const OG = { width: 1200, height: 630, scaledWidth: 1890, left: 348, quality: 82 };

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

function write(relativePath, buffer) {
  const target = path.join(outDir, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, buffer);
}

// Banner na altura do Open Graph e recorte da janela escolhida.
async function renderOpenGraph() {
  const scaled = await sharp(BANNER).resize(OG.scaledWidth, OG.height, { fit: 'fill' }).toBuffer();
  return sharp(scaled)
    .extract({ left: OG.left, top: 0, width: OG.width, height: OG.height })
    .jpeg({ quality: OG.quality })
    .toBuffer();
}

const files = [
  {
    file: 'app/opengraph-image.jpg',
    dimensions: `${OG.width}x${OG.height}`,
    buffer: await renderOpenGraph(),
  },
  { file: 'app/opengraph-image.alt.txt', dimensions: 'texto', buffer: Buffer.from(OG_ALT, 'utf8') },
];

for (const { file, buffer } of files) write(file, buffer);

console.log('BRAND_IMAGES_OK');
for (const { file, dimensions, buffer } of files) {
  console.log(`${file} ${dimensions} ${buffer.length} bytes`);
}
