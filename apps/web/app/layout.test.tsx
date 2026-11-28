import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { SITE, siteMetadata, siteViewport } from '@/lib/site';
import { THEME_INIT_SCRIPT } from '@/lib/theme';
import RootLayout from './layout';

// O loader do next/font só funciona dentro do build do Next: no teste entram objetos fictícios.
vi.mock('@/lib/fonts', () => ({
  body: { variable: 'fonte-corpo', className: 'fonte-corpo-cls' },
  title: { variable: 'fonte-titulo', className: 'fonte-titulo-cls' },
}));

// O layout é chamado como função e o elemento resultante vai para o renderToStaticMarkup:
// nenhum navegador, nenhum servidor Next (mesmo padrão do test/status.int-spec.ts).
function renderLayout(): string {
  return renderToStaticMarkup(
    <RootLayout>
      <p>conteudo-da-pagina</p>
    </RootLayout>,
  );
}

function section(html: string, tag: 'header' | 'footer'): string {
  const start = html.indexOf(`<${tag}`);
  const end = html.indexOf(`</${tag}>`);
  return start === -1 || end === -1 ? `(sem ${tag})` : html.slice(start, end + tag.length + 3);
}

// Há um link com este destino e este texto visível? Booleano: o relatório TAP do RED fica curto.
function hasLink(html: string, href: string, text: string): boolean {
  const anchors = html.match(/<a [^>]*>[^<]*<\/a>/g) ?? [];
  return anchors.some((a) => a.includes(`href="${href}"`) && a.includes(text));
}

describe('RootLayout: casca do clã', () => {
  const html = renderLayout();

  it('abre o <html> em pt-BR com o tema escuro e o script anti-flash no <head>', () => {
    expect(html.startsWith('<html lang="pt-BR" data-theme="dark"')).toBe(true);
    expect(html).toContain(`<script>${THEME_INIT_SCRIPT}</script>`);
  });

  it('põe as classes de variável das fontes no <html>, depois de lang e data-theme', () => {
    const open = html.slice(0, html.indexOf('>') + 1);
    expect(open).toBe('<html lang="pt-BR" data-theme="dark" class="fonte-corpo fonte-titulo">');
  });

  it('tem o link "Pular para o conteúdo" como primeiro link do <body>', () => {
    const body = html.slice(html.indexOf('<body'));
    const firstLink = /<a [^>]*>[^<]*<[/]a>/.exec(body)?.[0] ?? '(sem link)';
    expect(hasLink(firstLink, '#conteudo', 'Pular para o conteúdo')).toBe(true);
  });

  it('tem um único <main id="conteudo"> com o filho da página', () => {
    expect((html.match(/<main/g) ?? []).length).toBe(1);
    expect(html).toContain('<main id="conteudo"><p>conteudo-da-pagina</p></main>');
  });

  it('põe o header antes do <main> e o rodapé depois dele', () => {
    expect(html.indexOf('<header')).toBeLessThan(html.indexOf('<main'));
    expect(html.indexOf('<main')).toBeLessThan(html.indexOf('<footer'));
  });
});

describe('RootLayout: header com a marca', () => {
  const header = section(renderLayout(), 'header');

  it('tem o link da marca para "/" com o nome "No Law"', () => {
    expect(header.includes('No Law')).toBe(true);
    expect(header.includes('href="/"')).toBe(true);
  });

  it('mostra o ícone dos dragões como SVG decorativo', () => {
    expect(header).toContain('<svg aria-hidden="true"');
  });

  it('mantém o botão de tema no header', () => {
    expect(header).toContain('aria-label="Mudar para tema claro"');
  });
});

describe('RootLayout: ornamentos do header', () => {
  const header = section(renderLayout(), 'header');

  it('tem o traço de pincel de 4px logo abaixo da faixa', () => {
    expect(header.includes('viewBox="0 0 1200 12"')).toBe(true);
    expect(header.includes('stroke-width="4"')).toBe(true);
  });

  it('tem uma nuvem decorativa que só aparece a partir de 1024px', () => {
    expect(header.includes('viewBox="0 0 120 60"')).toBe(true);
    expect(header.includes('hidden lg:block')).toBe(true);
  });

  it('não usa estilo inline nem largura da janela inteira', () => {
    expect(header.includes('style=')).toBe(false);
    expect(header.includes('w-screen')).toBe(false);
  });
});

describe('RootLayout: rodapé do clã', () => {
  const footer = section(renderLayout(), 'footer');

  it('tem a navegação "Rodapé" com Sobre o clã, Regras e Privacidade', () => {
    expect(footer).toContain('aria-label="Rodapé"');
    expect(hasLink(footer, '/sobre', 'Sobre o clã')).toBe(true);
    expect(hasLink(footer, '/regras', 'Regras')).toBe(true);
    expect(hasLink(footer, '/privacidade', 'Privacidade')).toBe(true);
  });

  it('tem o texto "No Law · desde 2017"', () => {
    expect(footer).toContain('No Law · desde 2017');
  });

  it('não tem link do Discord nem links que abrem em outra aba', () => {
    expect(footer.startsWith('<footer')).toBe(true);
    expect(footer.toLowerCase().includes('discord')).toBe(false);
    expect(footer.includes('target="_blank"')).toBe(false);
  });
});

describe('metadados do site', () => {
  it('usa o título padrão "Blog No Law" e o modelo "<página> | Blog No Law"', () => {
    // Texto simples em uma linha só: o relatório TAP do RED fica legível para o classificador.
    const title = siteMetadata.title as { default?: string; template?: string } | undefined;
    expect(`${title?.default} -> ${title?.template}`).toBe('Blog No Law -> %s | Blog No Law');
  });

  it('descreve o site no <head>', () => {
    expect(siteMetadata.description).toBe(SITE.description);
    expect(SITE.description.length).toBeGreaterThan(0);
  });

  it('pinta a barra do navegador de preto', () => {
    expect(siteViewport.themeColor).toBe('#000000');
  });

  it('guarda o ano de fundação e o slogan do clã', () => {
    expect(SITE.foundedYear).toBe(2017);
    expect(SITE.slogan).toBe('Uma nova face, uma nova história.');
  });
});

describe('RootLayout: ornamentos do rodapé', () => {
  const footer = section(renderLayout(), 'footer');

  it('tem o traço de pincel de 5px acima da faixa', () => {
    expect(footer.includes('viewBox="0 0 1200 12"')).toBe(true);
    expect(footer.includes('stroke-width="5"')).toBe(true);
  });

  it('tem o selo hanko NO / LAW', () => {
    expect(footer.includes('>NO<')).toBe(true);
    expect(footer.includes('>LAW<')).toBe(true);
  });

  it('tem um par de nuvens nos cantos, só a partir de 640px', () => {
    expect((footer.match(/viewBox="0 0 120 60"/g) ?? []).length).toBe(2);
    expect((footer.match(/hidden sm:block/g) ?? []).length).toBe(2);
  });

  it('corta o excesso horizontal e não usa estilo inline', () => {
    expect(footer.includes('overflow-x-clip')).toBe(true);
    expect(footer.includes('style=')).toBe(false);
  });
});
