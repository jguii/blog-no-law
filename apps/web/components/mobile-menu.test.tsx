import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { CloseIcon, MenuIcon } from './icons';
import { MobileMenu } from './mobile-menu';

// O App Router não existe no teste: o caminho atual é fixo.
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

// Só o HTML do servidor: o painel nasce fechado e os links estão nele (sem JS, o rodapé cobre).
describe('MobileMenu: HTML do servidor (D-10)', () => {
  const html = renderToStaticMarkup(<MobileMenu />);

  it('tem o botão ☰ fechado, ligado ao painel "menu-principal", com o rótulo "Abrir menu"', () => {
    expect(html.includes('<button type="button"')).toBe(true);
    expect(html.includes('aria-expanded="false"')).toBe(true);
    expect(html.includes('aria-controls="menu-principal"')).toBe(true);
    expect(html.includes('aria-label="Abrir menu"')).toBe(true);
  });

  it('tem o painel "menu-principal" escondido pelo atributo hidden', () => {
    const panel = /<div[^>]*id="menu-principal"[^>]*>/.exec(html)?.[0] ?? '(sem painel)';
    expect(/\shidden(=""|\s|>)/.test(panel)).toBe(true);
  });

  it('põe os três links da D-08 dentro do painel', () => {
    const panel = html.slice(html.indexOf('id="menu-principal"'));
    expect(panel.includes('href="/"')).toBe(true);
    expect(panel.includes('href="/sobre"')).toBe(true);
    expect(panel.includes('href="/regras"')).toBe(true);
  });

  it('só existe abaixo de 768px e o botão tem 44x44', () => {
    expect(html.includes('md:hidden')).toBe(true);
    expect(html.includes('size-11')).toBe(true);
  });

  it('não é modal: sem diálogo, sem aria-modal e sem estilo inline', () => {
    expect(html.includes('aria-modal')).toBe(false);
    expect(html.includes('role="dialog"')).toBe(false);
    expect(html.includes('style=')).toBe(false);
  });
});

describe('MobileMenu: panelId', () => {
  it('usa o id pedido no botão e no painel', () => {
    const html = renderToStaticMarkup(<MobileMenu panelId="menu-kit" />);
    expect(html.includes('aria-controls="menu-kit"')).toBe(true);
    expect(html.includes('id="menu-kit"')).toBe(true);
    expect(html.includes('menu-principal')).toBe(false);
  });
});

describe('MenuIcon e CloseIcon', () => {
  it('são SVG decorativo, sem texto', () => {
    const menu = renderToStaticMarkup(<MenuIcon />);
    const close = renderToStaticMarkup(<CloseIcon />);
    expect(menu.startsWith('<svg aria-hidden="true"')).toBe(true);
    expect(close.startsWith('<svg aria-hidden="true"')).toBe(true);
    expect(menu.includes('<text')).toBe(false);
    expect(close.includes('<text')).toBe(false);
  });
});
