import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { REGRAS } from '@/lib/conteudo';
import RegrasPage, { metadata } from './page';

describe('página Regras com o conteúdo do clã', () => {
  const html = renderToStaticMarkup(<RegrasPage />);

  it('tem exatamente um h1 "Regras"', () => {
    expect(html.match(/<h1/g)?.length).toBe(1);
    expect(html).toMatch(/<h1[^>]*>Regras<\/h1>/);
  });

  it('mostra as frases da introdução, cada uma num <p>', () => {
    for (const frase of REGRAS.introducao) {
      expect(html).toContain(`<p>${frase}</p>`);
    }
  });

  it('mostra um h2 por grupo de regras', () => {
    expect(html.match(/<h2/g)?.length).toBe(REGRAS.grupos.length);
    for (const grupo of REGRAS.grupos) {
      expect(html).toContain(`>${grupo.titulo}</h2>`);
    }
  });

  it('define o título da aba', () => {
    expect(metadata.title).toBe('Regras');
  });
});

// Cada caso troca o conteúdo por um próprio, para exercitar os dois ramos do layout.
describe('página Regras com conteúdo simulado', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/conteudo');
    vi.resetModules();
  });

  async function renderComConteudo(
    grupos: { titulo: string; regras: string[] }[],
    provisorias: boolean,
  ): Promise<string> {
    vi.resetModules();
    vi.doMock('@/lib/conteudo', () => ({
      REGRAS: { titulo: 'Regras', introducao: ['Introdução de teste.'], grupos },
      REGRAS_PROVISORIAS: provisorias,
    }));
    const { default: Pagina } = await import('./page');
    return renderToStaticMarkup(<Pagina />);
  }

  it('com as regras do Discord cada grupo vira um h2 com uma ol de regras', async () => {
    const html = await renderComConteudo(
      [
        { titulo: 'Grupo A', regras: ['Regra A1', 'Regra A2'] },
        { titulo: 'Grupo B', regras: ['Regra B1', 'Regra B2'] },
      ],
      false,
    );

    expect(html.match(/<h2/g)?.length).toBe(2);
    expect(html).toMatch(/<h2[^>]*>Grupo A<\/h2>/);
    expect(html).toMatch(/<h2[^>]*>Grupo B<\/h2>/);
    expect(html.match(/<ol/g)?.length).toBe(2);
    expect(html.match(/<li/g)?.length).toBe(4);
    expect(html.match(/<h1/g)?.length).toBe(1);
  });

  it('com REGRAS_PROVISORIAS verdadeiro mostra só as frases, sem lista numerada', async () => {
    const html = await renderComConteudo([], true);

    expect(html).toContain('<p>Introdução de teste.</p>');
    expect(html.includes('<ol')).toBe(false);
    expect(html.includes('<h2')).toBe(false);
  });
});
