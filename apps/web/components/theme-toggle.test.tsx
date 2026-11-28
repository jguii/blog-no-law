import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DragonMark } from './dragon-mark';
import { ThemeToggle } from './theme-toggle';

function clipPathIds(html: string): string[] {
  return [...html.matchAll(/<clipPath id="([^"]+)"/g)].map((match) => match[1] ?? '');
}

describe('DragonMark', () => {
  it('desenha a arte pequena como SVG decorativo, sem texto e sem clipPath', () => {
    const html = renderToStaticMarkup(<DragonMark size={44} />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('viewBox="0 0 100 100"');
    expect(html).toContain('width="44"');
    expect(html).not.toContain('<text');
    expect(html).not.toContain('clipPath');
  });

  it('usa a arte grande, com clipPath, a partir de 96px', () => {
    const html = renderToStaticMarkup(<DragonMark size={96} />);
    expect(html).toContain('clipPath');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('<text');
  });

  it('respeita o detail pedido, independente do tamanho', () => {
    expect(renderToStaticMarkup(<DragonMark size={44} detail="large" />)).toContain('clipPath');
    expect(renderToStaticMarkup(<DragonMark size={120} detail="small" />)).not.toContain(
      'clipPath',
    );
  });

  it('dá um id de clipPath diferente a cada instância grande na mesma árvore', () => {
    const html = renderToStaticMarkup(
      <div>
        <DragonMark size={96} />
        <DragonMark size={120} />
      </div>,
    );
    const ids = clipPathIds(html);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });
});

describe('ThemeToggle', () => {
  const html = renderToStaticMarkup(<ThemeToggle />);

  it('é um botão do tipo button', () => {
    expect(html).toContain('type="button"');
  });

  it('no HTML do servidor (tema escuro) oferece mudar para o claro', () => {
    expect(html).toContain('aria-label="Mudar para tema claro"');
  });

  it('traz os dragões decorativos dentro do botão', () => {
    expect(html).toContain('<svg aria-hidden="true"');
  });

  it('troca o ícone por CSS conforme o tema, sem estilo inline', () => {
    expect(html).toContain('light:rotate-180');
    expect(html).not.toContain('style=');
  });
});
