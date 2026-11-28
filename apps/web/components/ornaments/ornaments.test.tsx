import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BrushStroke } from './brush-stroke';
import { Cloud } from './cloud';
import { Hanko } from './hanko';

function gradientIds(html: string): string[] {
  return [...html.matchAll(/<linearGradient id="([^"]+)"/g)].map((match) => match[1] ?? '');
}

describe('BrushStroke', () => {
  it('no header tem a arte larga, sem manter a proporção, com traço de 4px', () => {
    const html = renderToStaticMarkup(<BrushStroke variant="header" />);
    expect(html).toContain('viewBox="0 0 1200 12"');
    expect(html).toContain('preserveAspectRatio="none"');
    expect(html).toContain('stroke-width="4"');
  });

  it('no rodapé tem traço de 5px', () => {
    const html = renderToStaticMarkup(<BrushStroke variant="footer" />);
    expect(html).toContain('viewBox="0 0 1200 12"');
    expect(html).toContain('stroke-width="5"');
  });

  it('sob o título tem a arte curta de 300 por 10', () => {
    const html = renderToStaticMarkup(<BrushStroke variant="title" />);
    expect(html).toContain('viewBox="0 0 300 10"');
  });

  it('é decorativo em todas as variantes, sem estilo inline', () => {
    const variants = ['header', 'footer', 'title'] as const;
    const decorative = variants.map((variant) => {
      const html = renderToStaticMarkup(<BrushStroke variant={variant} />);
      return html.includes('aria-hidden="true"') && html.includes('focusable="false"');
    });
    expect(decorative.join(',')).toBe('true,true,true');
    expect(renderToStaticMarkup(<BrushStroke variant="header" />).includes('style=')).toBe(false);
  });

  it('dá um id de gradiente diferente a cada instância na mesma árvore', () => {
    const html = renderToStaticMarkup(
      <div>
        <BrushStroke variant="header" />
        <BrushStroke variant="footer" />
      </div>,
    );
    const ids = gradientIds(html);
    expect(ids.length).toBe(2);
    expect(new Set(ids).size).toBe(2);
  });
});

describe('Cloud', () => {
  const html = renderToStaticMarkup(<Cloud />);

  it('desenha a nuvem de 120 por 60 com o contorno dourado', () => {
    expect(html).toContain('viewBox="0 0 120 60"');
    expect(html).toContain('d="M8 48');
    expect(html).toContain('stroke="#c8a04a"');
  });

  it('é decorativa, sem estilo inline e sem receber cliques', () => {
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('pointer-events-none');
    expect(html.includes('style=')).toBe(false);
  });

  it('espelha por classe só quando pedido', () => {
    expect(renderToStaticMarkup(<Cloud flip />)).toContain('-scale-x-100');
    expect(html.includes('-scale-x-100')).toBe(false);
  });

  it('dá um id de gradiente diferente a cada instância', () => {
    const ids = gradientIds(
      renderToStaticMarkup(
        <div>
          <Cloud />
          <Cloud flip />
        </div>,
      ),
    );
    expect(ids.length).toBe(2);
    expect(new Set(ids).size).toBe(2);
  });
});

describe('Hanko', () => {
  const html = renderToStaticMarkup(<Hanko />);

  it('traz NO e LAW empilhados', () => {
    expect(html).toContain('NO');
    expect(html).toContain('LAW');
  });

  it('é um selo decorativo de 44px, sem estilo inline', () => {
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('size-11');
    expect(html.includes('style=')).toBe(false);
  });
});
