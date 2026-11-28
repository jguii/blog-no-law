import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SiteHeader } from './site-header';

// O App Router não existe no teste: o caminho atual é uma variável que cada caso ajusta.
const nav = vi.hoisted(() => ({ pathname: '/' }));
vi.mock('next/navigation', () => ({
  usePathname: () => nav.pathname,
}));

function renderHeader(pathname: string): string {
  nav.pathname = pathname;
  return renderToStaticMarkup(<SiteHeader />);
}

// Cada link de texto do HTML como `{ href, label, current }`. Os três destinos da D-08 aparecem
// mais de uma vez (pílulas e painel do ☰): `current` vale se QUALQUER ocorrência está marcada.
function linksTo(html: string, href: string): string[] {
  const anchors = html.match(/<a [^>]*>[^<]*<\/a>/g) ?? [];
  return anchors.filter((a) => a.includes(`href="${href}"`));
}

function labelOf(anchor: string): string {
  return anchor.replace(/<[^>]*>/g, '');
}

function currentLabels(html: string): string[] {
  const anchors = html.match(/<a [^>]*>[^<]*<\/a>/g) ?? [];
  return [...new Set(anchors.filter((a) => a.includes('aria-current="page"')).map(labelOf))];
}

describe('SiteHeader: navegação principal (D-08)', () => {
  beforeEach(() => {
    nav.pathname = '/';
  });

  it('tem a navegação "Principal" com Início, Sobre o clã e Regras', () => {
    const html = renderHeader('/');
    expect(html.includes('aria-label="Principal"')).toBe(true);
    expect(linksTo(html, '/').map(labelOf)).toContain('Início');
    expect(linksTo(html, '/sobre').map(labelOf)).toContain('Sobre o clã');
    expect(linksTo(html, '/regras').map(labelOf)).toContain('Regras');
  });

  it('marca só "Sobre o clã" com aria-current em /sobre', () => {
    expect(currentLabels(renderHeader('/sobre')).join(',')).toBe('Sobre o clã');
  });

  it('marca só "Início" com aria-current na capa', () => {
    expect(currentLabels(renderHeader('/')).join(',')).toBe('Início');
  });

  it('não marca nenhum item em /status', () => {
    expect(currentLabels(renderHeader('/status')).length).toBe(0);
  });

  it('não marca nenhum item em /kit', () => {
    expect(currentLabels(renderHeader('/kit')).length).toBe(0);
  });

  it('não mostra itens que ainda não existem nem "em breve"', () => {
    const html = renderHeader('/');
    expect(/Explorar|Perfil|Entrar|em breve/.test(html)).toBe(false);
  });

  it('esconde as pílulas abaixo de 768px e deixa o rótulo inteiro numa linha só', () => {
    const html = renderHeader('/');
    expect(html.includes('hidden md:block')).toBe(true);
    expect(html.includes('whitespace-nowrap')).toBe(true);
  });

  it('põe o ☰ depois do botão de tema (ordem no celular: tema, depois menu)', () => {
    const html = renderHeader('/');
    const tema = html.indexOf('aria-label="Mudar para tema claro"');
    const menu = html.indexOf('aria-label="Abrir menu"');
    expect(menu > tema && tema > -1).toBe(true);
  });
});

describe('SiteHeader: marca e ornamentos do 02-11 continuam no lugar', () => {
  const html = renderHeader('/');

  it('tem a marca como link "/" com o texto "No Law" e o ícone dos dragões decorativo', () => {
    expect(html.includes('No Law')).toBe(true);
    expect(html.includes('<svg aria-hidden="true"')).toBe(true);
  });

  it('mantém o botão de tema, o traço de pincel e a nuvem', () => {
    expect(html.includes('aria-label="Mudar para tema claro"')).toBe(true);
    expect(html.includes('viewBox="0 0 1200 12"')).toBe(true);
    expect(html.includes('viewBox="0 0 120 60"')).toBe(true);
  });

  it('reserva a faixa da nuvem à direita da linha, sem estilo inline', () => {
    expect(html.includes('lg:pr-36')).toBe(true);
    expect(html.includes('style=')).toBe(false);
  });
});
