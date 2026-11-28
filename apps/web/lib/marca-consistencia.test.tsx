import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DragonMark } from '@/components/dragon-mark';

// Testes de ativos (VIS-02, D-03): a arte do favicon (`app/icon.svg`) e a do `DragonMark` pequeno
// são a mesma. Se alguém mexer num desenho e não no outro, a aba do navegador e a marca no site
// passam a mostrar dragões diferentes.
const iconSvg = readFileSync(new URL('../app/icon.svg', import.meta.url), 'utf8');
const markHtml = renderToStaticMarkup(<DragonMark size={44} />);

// Todo valor de `d="..."` de um caminho do SVG, sem repetidos.
function pathData(svg: string): string[] {
  return [...new Set([...svg.matchAll(/\sd="([^"]+)"/g)].map((match) => match[1] ?? ''))];
}

describe('favicon e DragonMark pequeno', () => {
  it('o favicon tem caminhos para comparar (o teste não passa no vazio)', () => {
    expect(pathData(iconSvg).length >= 3).toBe(true);
  });

  it('todo caminho do favicon aparece no DragonMark de 44px', () => {
    const missing = pathData(iconSvg).filter((d) => !markHtml.includes(`d="${d}"`));
    expect(missing.join(' | ')).toBe('');
  });

  it('o favicon usa as mesmas cores da marca (vermelho, dourado e preto)', () => {
    const colors = ['#ac020f', '#c8a04a', '#000000'];
    const missing = colors.filter((color) => !iconSvg.includes(color) || !markHtml.includes(color));
    expect(missing.join(',')).toBe('');
  });

  it('o favicon e o DragonMark têm o mesmo viewBox', () => {
    expect(
      iconSvg.includes('viewBox="0 0 100 100"') && markHtml.includes('viewBox="0 0 100 100"'),
    ).toBe(true);
  });
});
