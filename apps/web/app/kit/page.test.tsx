import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TOKENS } from '@/lib/tokens';
import KitPage, { metadata } from './page';

// Página de referência do kit (D-22, VIS-03). Cenários BDD: docs/bdd/kit.feature.md.
const html = renderToStaticMarkup(<KitPage />);

// Nomes de token que faltam no HTML como `<code>nome</code>` (lista vazia = nenhum faltou).
function missingCodes(values: readonly string[]): string {
  return values.filter((value) => !html.includes(`>${value}</code>`)).join(',');
}

describe('/kit: metadados', () => {
  it('fica fora dos buscadores', () => {
    expect(JSON.stringify(metadata.robots) === '{"index":false,"follow":false}').toBe(true);
  });

  it('tem o título "Kit de identidade"', () => {
    expect(metadata.title === 'Kit de identidade').toBe(true);
  });
});

describe('/kit: cores', () => {
  it('tem um único h1 "Kit de identidade"', () => {
    expect(html.match(/<h1/g)?.length === 1).toBe(true);
    expect(/<h1[^>]*>Kit de identidade<\/h1>/.test(html)).toBe(true);
  });

  it('tem a seção Cores', () => {
    expect(/<h2[^>]*>Cores<\/h2>/.test(html)).toBe(true);
  });

  it('mostra nome de cada token do tema escuro em code', () => {
    expect(missingCodes(Object.keys(TOKENS.dark)) === '').toBe(true);
  });

  it('mostra hex de cada token do tema escuro em code', () => {
    expect(missingCodes(Object.values(TOKENS.dark)) === '').toBe(true);
  });

  it('mostra nome de cada token do tema claro em code', () => {
    expect(missingCodes(Object.keys(TOKENS.light)) === '').toBe(true);
  });

  it('mostra hex de cada token do tema claro em code', () => {
    expect(missingCodes(Object.values(TOKENS.light)) === '').toBe(true);
  });

  it('mostra os tokens da faixa, inclusive o painel do menu', () => {
    expect(missingCodes(Object.values(TOKENS.faixa)) === '').toBe(true);
    expect(html.includes('>panel</code>')).toBe(true);
  });

  it('mostra a razão calculada com vírgula decimal (foreground sobre background no escuro)', () => {
    expect(html.includes('9,84:1')).toBe(true);
  });

  it('mostra os mínimos exigidos de 4,5:1 e 3:1', () => {
    expect(html.includes('4,5:1') && html.includes('3:1')).toBe(true);
  });
});

// Texto dos h2, na ordem em que a página os mostra.
function headings(): string {
  return [...html.matchAll(/<h2[^>]*>([^<]*)<\/h2>/g)].map((match) => match[1] ?? '').join('|');
}

// Quantas vezes um trecho aparece no HTML.
function count(pattern: RegExp): number {
  return html.match(pattern)?.length ?? 0;
}

describe('/kit: as dez seções da UI-SPEC', () => {
  it('tem os h2 das dez seções, na ordem do contrato', () => {
    expect(headings()).toBe(
      'Cores|Tipografia|Espaçamento|Botões|Link em texto|Card|Item de menu|Menu sanduíche|Botão de tema|Ornamentos',
    );
  });
});

describe('/kit: tipografia e espaçamento', () => {
  it('mostra os quatro papéis com tamanho', () => {
    const roles = ['Label 14px', 'Body 18px', 'Heading 26/22px', 'Display 52/36px'];
    expect(roles.filter((role) => !html.includes(role)).join(',')).toBe('');
  });

  it('desenha as 7 barras da escala de espaçamento, de 4 a 64px', () => {
    const sizes = [...html.matchAll(/data-espaco="(\d+)"/g)].map((match) => match[1]);
    expect(sizes.join(',')).toBe('4,8,16,24,32,48,64');
  });

  it('usa só classes da escala do Tailwind nas barras (w-1 a w-16)', () => {
    const bars = html.match(/<span[^>]*data-espaco[^>]*>/g) ?? [];
    const widths = bars.map((bar) => /class="[^"]*\b(w-\d+)\b/.exec(bar)?.[1] ?? '?');
    expect(widths.join(',')).toBe('w-1,w-2,w-4,w-6,w-8,w-12,w-16');
  });
});

describe('/kit: botões, link e card', () => {
  it('mostra o botão primário e o secundário nos dois tamanhos', () => {
    expect(count(/<button[^>]*bg-brand-button[^>]*h-13/g) >= 1).toBe(true);
    expect(count(/<button[^>]*bg-brand-button[^>]*h-11/g) >= 1).toBe(true);
    expect(count(/<button[^>]*border-foreground[^>]*h-13/g) >= 1).toBe(true);
    expect(count(/<button[^>]*border-foreground[^>]*h-11/g) >= 1).toBe(true);
  });

  it('mostra o estado desabilitado com o atributo disabled', () => {
    expect(count(/<button[^>]*\sdisabled=""/g) >= 2).toBe(true);
  });

  it('mostra o link em texto sublinhado com a cor de link', () => {
    expect(/<a [^>]*class="[^"]*text-link[^"]*underline[^"]*underline-offset-4/.test(html)).toBe(
      true,
    );
  });

  it('mostra um card de exemplo', () => {
    expect(html.includes('Exemplo de card')).toBe(true);
  });
});

describe('/kit: menu e botão de tema', () => {
  it('mostra a pílula normal e a ativa dentro de uma faixa', () => {
    expect(html.includes('faixa')).toBe(true);
    expect(html.includes('bg-primary text-primary-foreground inset-ring-2 inset-ring-link')).toBe(
      true,
    );
    expect(html.includes('hover:bg-accent')).toBe(true);
  });

  it('mostra o menu sanduíche fechado (ícone ☰) e aberto (itens do painel)', () => {
    expect(html.includes('M4 6h16M4 12h16M4 18h16')).toBe(true);
    expect(html.includes('bg-panel')).toBe(true);
    expect(html.includes('min-h-13')).toBe(true);
  });

  it('não repete o id menu-principal nem cria outro nav Principal', () => {
    expect(html.includes('id="menu-principal"')).toBe(false);
    expect(html.includes('aria-label="Principal"')).toBe(false);
    expect(html.includes('<nav')).toBe(false);
  });

  it('mostra o botão de tema real', () => {
    expect(/aria-label="Mudar para tema (claro|escuro)"/.test(html)).toBe(true);
  });
});

describe('/kit: ornamentos', () => {
  it('mostra o DragonMark em 16, 32, 44 e 96px', () => {
    const widths = [...html.matchAll(/<svg[^>]*viewBox="0 0 100 100"[^>]*width="(\d+)"/g)].map(
      (match) => match[1],
    );
    expect(widths.join(',')).toBe('16,32,44,96');
  });

  it('mostra os três traços de pincel, a nuvem e o hanko', () => {
    expect(count(/viewBox="0 0 1200 12"/g)).toBe(2);
    expect(count(/viewBox="0 0 300 10"/g)).toBe(1);
    expect(count(/viewBox="0 0 120 60"/g) >= 1).toBe(true);
    expect(html.includes('<span>NO</span><span>LAW</span>')).toBe(true);
  });
});
