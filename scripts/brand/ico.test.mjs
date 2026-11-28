// Testes do contêiner ICO com PNG embutido (D-03). Só módulos `node:`, sem rede e sem pacote.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeIco } from './ico.mjs';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// Não precisa ser um PNG decodificável: o contêiner só olha a assinatura e o tamanho dos bytes.
function fakePng(extraBytes) {
  return Buffer.concat([PNG_SIGNATURE, Buffer.alloc(extraBytes, 0xab)]);
}

test('ICONDIR: reservado 0, tipo 1 e quantidade de imagens em little-endian', () => {
  const ico = encodeIco([
    { size: 16, png: fakePng(10) },
    { size: 32, png: fakePng(20) },
  ]);
  assert.equal(ico.length, 6 + 16 * 2 + 18 + 28, 'tamanho total do arquivo');
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 2);
});

test('ICONDIRENTRY: largura, altura, cores, plano, bits, tamanho e deslocamento de cada imagem', () => {
  const first = fakePng(10);
  const second = fakePng(20);
  const ico = encodeIco([
    { size: 16, png: first },
    { size: 32, png: second },
  ]);
  assert.equal(ico.length, 6 + 16 * 2 + first.length + second.length, 'tamanho total do arquivo');
  const expected = [
    { size: 16, png: first, offset: 6 + 16 * 2 },
    { size: 32, png: second, offset: 6 + 16 * 2 + first.length },
  ];
  expected.forEach((entry, index) => {
    const at = 6 + index * 16;
    assert.equal(ico.readUInt8(at), entry.size, 'largura');
    assert.equal(ico.readUInt8(at + 1), entry.size, 'altura');
    assert.equal(ico.readUInt8(at + 2), 0, 'cores na paleta');
    assert.equal(ico.readUInt8(at + 3), 0, 'reservado');
    assert.equal(ico.readUInt16LE(at + 4), 1, 'planos');
    assert.equal(ico.readUInt16LE(at + 6), 32, 'bits por pixel');
    assert.equal(ico.readUInt32LE(at + 8), entry.png.length, 'tamanho dos dados');
    assert.equal(ico.readUInt32LE(at + 12), entry.offset, 'deslocamento dos dados');
  });
});

test('os dados em cada deslocamento são o PNG original, com a assinatura no início', () => {
  const first = fakePng(10);
  const second = fakePng(20);
  const ico = encodeIco([
    { size: 16, png: first },
    { size: 32, png: second },
  ]);
  assert.equal(ico.length, 6 + 16 * 2 + first.length + second.length, 'tamanho total do arquivo');
  for (let index = 0; index < 2; index += 1) {
    const at = 6 + index * 16;
    const length = ico.readUInt32LE(at + 8);
    const offset = ico.readUInt32LE(at + 12);
    const data = ico.subarray(offset, offset + length);
    assert.ok(data.subarray(0, 8).equals(PNG_SIGNATURE), 'assinatura PNG no deslocamento');
    assert.ok(data.equals(index === 0 ? first : second), 'bytes idênticos ao PNG de entrada');
  }
});

test('tamanho 256 vira o byte 0 (o ICO usa 0 para 256)', () => {
  const ico = encodeIco([{ size: 256, png: fakePng(4) }]);
  assert.equal(ico.length, 6 + 16 + 12, 'tamanho total do arquivo');
  assert.equal(ico.readUInt8(6), 0);
  assert.equal(ico.readUInt8(7), 0);
});

test('lança erro para tamanho fora de 1..256 ou não inteiro', () => {
  for (const size of [0, -1, 257, 16.5, Number.NaN, '16']) {
    assert.throws(() => encodeIco([{ size, png: fakePng(4) }]), `tamanho ${String(size)}`);
  }
});

test('lança erro para buffer sem a assinatura PNG e para lista vazia', () => {
  assert.throws(() => encodeIco([{ size: 16, png: Buffer.from('não é um PNG') }]));
  assert.throws(() => encodeIco([{ size: 16, png: 'texto' }]));
  assert.throws(() => encodeIco([]));
});
