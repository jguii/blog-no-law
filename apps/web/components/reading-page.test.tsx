import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ReadingPage } from './reading-page';

describe('ReadingPage (card de leitura do clã)', () => {
  const html = renderToStaticMarkup(
    <ReadingPage id="t" title="Título">
      <p>x</p>
    </ReadingPage>,
  );

  it('é um article rotulado pelo h1', () => {
    expect(html).toContain('<article aria-labelledby="t"');
    expect(html).toMatch(/<h1[^>]*id="t"[^>]*>Título<\/h1>/);
  });

  it('tem um único h1 no Display', () => {
    expect(html.match(/<h1/g)?.length).toBe(1);
    expect(html).toMatch(/<h1[^>]*class="[^"]*text-display/);
  });

  it('tem a faixa de gradiente da marca de 6px no topo do card', () => {
    expect(html).toMatch(/class="[^"]*bg-brand[^"]*"/);
    expect(html).toMatch(/class="[^"]*h-1\.5/);
  });

  it('usa só o traço de pincel do título como ornamento (D-19)', () => {
    expect(html).toContain('<svg aria-hidden="true"');
    expect(html).toContain('viewBox="0 0 300 10"');
    expect(html).not.toContain('viewBox="0 0 120 60"');
    expect(html.match(/<svg/g)?.length).toBe(1);
  });

  it('limita o card a 760px e o corpo a 664px, com quebra de palavras longas', () => {
    expect(html).toMatch(/class="[^"]*max-w-190/);
    expect(html).toMatch(/class="[^"]*max-w-166/);
    expect(html).toMatch(/class="[^"]*wrap-anywhere/);
  });

  it('renderiza os filhos dentro do corpo', () => {
    expect(html).toContain('<p>x</p>');
  });
});
