import { describe, expect, it } from 'vitest';
import { SITE } from '@/lib/site';
import manifest from './manifest';

describe('manifest do site', () => {
  it('declara nome, descrição, idioma e abertura no navegador', () => {
    const m = manifest();
    expect(m.name).toBe('Blog No Law');
    expect(m.short_name).toBe('No Law');
    expect(m.description).toBe(SITE.description);
    expect(m.lang).toBe('pt-BR');
    expect(m.start_url).toBe('/');
    expect(m.display).toBe('browser');
  });

  it('usa preto como fundo e cor do tema, igual à faixa do topo', () => {
    const m = manifest();
    expect(m.background_color).toBe('#000000');
    expect(m.theme_color).toBe('#000000');
  });

  it('declara o ícone do app de 512 e o de 180', () => {
    const icons = manifest().icons ?? [];
    expect(icons).toContainEqual({
      src: '/brand/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
    });
    expect(icons).toContainEqual({ src: '/apple-icon.png', sizes: '180x180', type: 'image/png' });
  });
});
