import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TOKENS } from '@/lib/tokens';
import KitPage, { metadata } from './page';

// Página de referência do kit (D-22, VIS-03). Cenários BDD: docs/bdd/kit.feature.md.
const html = renderToStaticMarkup(<KitPage />);

// Nomes de token que faltam no HTML como `<code>nome</code>` (lista vazia = nenhum faltou).
function missingCodes(values: readonly string[]): string {
  return values.filter((value) => !html.includes(`>${value}</code>`)).join(',');
}

describe('/kit: metadados', () => {
  it('fica fora dos buscadores', () => {
    expect(JSON.stringify(metadata.robots) === '{"index":false,"follow":false}').toBe(true);
  });

  it('tem o título "Kit de identidade"', () => {
    expect(metadata.title === 'Kit de identidade').toBe(true);
  });
});

describe('/kit: cores', () => {
  it('tem um único h1 "Kit de identidade"', () => {
    expect(html.match(/<h1/g)?.length === 1).toBe(true);
    expect(/<h1[^>]*>Kit de identidade<\/h1>/.test(html)).toBe(true);
  });

  it('tem a seção Cores', () => {
    expect(/<h2[^>]*>Cores<\/h2>/.test(html)).toBe(true);
  });

  it('mostra nome de cada token do tema escuro em code', () => {
    expect(missingCodes(Object.keys(TOKENS.dark)) === '').toBe(true);
  });

  it('mostra hex de cada token do tema escuro em code', () => {
    expect(missingCodes(Object.values(TOKENS.dark)) === '').toBe(true);
  });

  it('mostra nome de cada token do tema claro em code', () => {
    expect(missingCodes(Object.keys(TOKENS.light)) === '').toBe(true);
  });

  it('mostra hex de cada token do tema claro em code', () => {
    expect(missingCodes(Object.values(TOKENS.light)) === '').toBe(true);
  });

  it('mostra os tokens da faixa, inclusive o painel do menu', () => {
    expect(missingCodes(Object.values(TOKENS.faixa)) === '').toBe(true);
    expect(html.includes('>panel</code>')).toBe(true);
  });

  it('mostra a razão calculada com vírgula decimal (foreground sobre background no escuro)', () => {
    expect(html.includes('9,84:1')).toBe(true);
  });

  it('mostra os mínimos exigidos de 4,5:1 e 3:1', () => {
    expect(html.includes('4,5:1') && html.includes('3:1')).toBe(true);
  });
});
