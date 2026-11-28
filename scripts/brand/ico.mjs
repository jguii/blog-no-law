// Contêiner ICO com PNG embutido (D-03), sem pacote: só `node:`. O formato é o ICONDIR de 6 bytes,
// uma ICONDIRENTRY de 16 bytes por imagem e os PNG em sequência (navegadores e o Windows leem PNG
// dentro do ICO desde o Vista).
//
// Uso: import { encodeIco } from './ico.mjs'; encodeIco([{ size: 16, png }, { size: 32, png }])
// Devolve um Buffer. Lança erro para tamanho fora de 1..256, buffer sem assinatura PNG ou lista vazia.
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const HEADER_BYTES = 6;
const ENTRY_BYTES = 16;

export function encodeIco(images) {
  if (!Array.isArray(images) || images.length === 0) {
    throw new Error('encodeIco precisa de ao menos uma imagem');
  }
  for (const { size, png } of images) {
    if (!Number.isInteger(size) || size < 1 || size > 256) {
      throw new Error(`tamanho de ícone inválido: ${String(size)} (esperado inteiro de 1 a 256)`);
    }
    if (!Buffer.isBuffer(png) || !png.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
      throw new Error(`a imagem de ${size}px não é um PNG (assinatura ausente)`);
    }
  }

  const header = Buffer.alloc(HEADER_BYTES);
  header.writeUInt16LE(0, 0); // reservado
  header.writeUInt16LE(1, 2); // tipo 1 = ícone
  header.writeUInt16LE(images.length, 4);

  let offset = HEADER_BYTES + ENTRY_BYTES * images.length;
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(ENTRY_BYTES);
    entry.writeUInt8(size === 256 ? 0 : size, 0); // largura (0 significa 256)
    entry.writeUInt8(size === 256 ? 0 : size, 1); // altura (0 significa 256)
    entry.writeUInt8(0, 2); // cores na paleta (0 = sem paleta)
    entry.writeUInt8(0, 3); // reservado
    entry.writeUInt16LE(1, 4); // planos de cor
    entry.writeUInt16LE(32, 6); // bits por pixel
    entry.writeUInt32LE(png.length, 8); // tamanho dos dados
    entry.writeUInt32LE(offset, 12); // deslocamento dos dados
    offset += png.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map(({ png }) => png)]);
}
