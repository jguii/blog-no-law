import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Home from './page';

// Capa estática do clã (D-06): conteúdo final, sem chamar a API. Cenários BDD: docs/bdd/capa.feature.md.
describe('capa do clã em /', () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch');
  const html = renderToStaticMarkup(<Home />);

  afterEach(() => {
    fetchSpy.mockClear();
  });

  it('tem exatamente um h1 com o slogan', () => {
    expect(html.match(/<h1/g)?.length).toBe(1);
    expect(html).toMatch(/<h1[^>]*>Uma nova face, uma nova história\.<\/h1>/);
  });

  it('mostra o rótulo da capa acima do slogan', () => {
    expect(html).toContain('Clã do SA-MP · desde 2017');
  });

  it('traz o parágrafo da UI-SPEC', () => {
    expect(html).toContain(
      'Somos o No Law, um clã nascido no GTA San Andreas Multiplayer em 2017, de uma amizade de mais de 10 anos. Este é o nosso canto para guardar as histórias, as fotos e os vídeos do grupo.',
    );
  });

  it('tem o CTA primário "Conheça o clã" para /sobre', () => {
    const link = html.match(/<a [^>]*href="\/sobre"[^>]*>[^<]*<\/a>/)?.[0] ?? '';
    expect(link).toContain('Conheça o clã');
    expect(link).toMatch(/class="[^"]*bg-brand-button/);
  });

  it('tem o CTA secundário "Leia as regras" para /regras', () => {
    const link = html.match(/<a [^>]*href="\/regras"[^>]*>[^<]*<\/a>/)?.[0] ?? '';
    expect(link).toContain('Leia as regras');
    expect(link).toMatch(/class="[^"]*border-foreground/);
  });

  it('empilha os CTAs a 100% abaixo de 480px', () => {
    const links = html.match(/<a [^>]*href="\/(?:sobre|regras)"[^>]*>/g) ?? [];
    expect(links.length).toBe(2);
    for (const link of links) {
      expect(link).toMatch(/class="[^"]*max-\[480px\]:w-full/);
    }
  });

  it('não mostra nada do status técnico nem chama a API', () => {
    expect(html).not.toContain('api-commit');
    expect(html).not.toContain('api-unavailable');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
