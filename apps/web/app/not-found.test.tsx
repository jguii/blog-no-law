import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import NotFound, { metadata } from './not-found';

describe('404 com a identidade do clã', () => {
  const html = renderToStaticMarkup(<NotFound />);

  it('tem exatamente um h1 com o título da página', () => {
    expect(html.match(/<h1/g)?.length).toBe(1);
    expect(html).toContain('Página não encontrada');
  });

  it('explica o que aconteceu no tom do clã', () => {
    expect(html).toContain('Esse endereço não existe ou mudou de lugar.');
  });

  it('oferece o CTA primário de volta ao início como link para /', () => {
    const link = html.match(/<a [^>]*href="\/"[^>]*>[^<]*<\/a>/)?.[0] ?? '';
    expect(link).toContain('Voltar para o início');
    expect(link).toMatch(/class="[^"]*bg-brand-button/);
  });

  it('usa o Display no título, centralizado com text-wrap balance', () => {
    expect(html).toMatch(/<h1[^>]*class="[^"]*text-display/);
    expect(html).toMatch(/<h1[^>]*class="[^"]*text-balance/);
  });

  it('define o título da aba', () => {
    expect(metadata.title).toBe('Página não encontrada');
  });
});
