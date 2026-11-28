import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import PrivacidadePage, { metadata } from './page';

describe('página Política de Privacidade', () => {
  const html = renderToStaticMarkup(<PrivacidadePage />);

  it('tem exatamente um h1 "Política de Privacidade"', () => {
    expect(html.match(/<h1/g)?.length).toBe(1);
    expect(html).toMatch(/<h1[^>]*>Política de Privacidade<\/h1>/);
  });

  it('tem dois h2: o que o site guarda e o que não faz', () => {
    expect(html.match(/<h2/g)?.length).toBe(2);
    expect(html).toMatch(/<h2[^>]*>O que o site guarda<\/h2>/);
    expect(html).toMatch(/<h2[^>]*>O que o site não faz<\/h2>/);
  });

  it('lista três itens do que o site guarda numa ul', () => {
    expect(html.match(/<ul/g)?.length).toBe(1);
    expect(html.match(/<li/g)?.length).toBe(3);
  });

  it('termina com o fecho que manda falar com um admin do clã', () => {
    expect(html).toContain('Fale com um admin do clã.');
  });

  it('não cita a lei nem a palavra proibida (D-14)', () => {
    expect(/lgpd/i.test(html)).toBe(false);
    expect(/cookie/i.test(html)).toBe(false);
  });

  it('define o título da aba', () => {
    expect(metadata.title).toBe('Política de Privacidade');
  });
});
