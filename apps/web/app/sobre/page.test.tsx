import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SOBRE } from '@/lib/conteudo';
import SobrePage, { metadata } from './page';

describe('página Sobre o clã', () => {
  const html = renderToStaticMarkup(<SobrePage />);

  it('tem exatamente um h1 "Sobre o clã"', () => {
    expect(html.match(/<h1/g)?.length).toBe(1);
    expect(html).toMatch(/<h1[^>]*>Sobre o clã<\/h1>/);
  });

  it('mostra cada parágrafo de SOBRE num <p>', () => {
    expect(SOBRE.paragrafos.length).toBeGreaterThanOrEqual(2);
    for (const paragrafo of SOBRE.paragrafos) {
      expect(html).toContain(`<p>${paragrafo}</p>`);
    }
  });

  it('define o título da aba (o modelo acrescenta "| Blog No Law")', () => {
    expect(metadata.title).toBe('Sobre o clã');
  });
});
