// Contraste WCAG 2.1 e leitura dos blocos de tema do `app/globals.css`. Serve ao teste de contrato
// (`lib/contrast.test.ts`) e à página `/kit`, que mostram as razões calculadas, não digitadas.

// Luminância relativa de uma cor `#rrggbb`: canais sRGB para linear e `0,2126 R + 0,7152 G + 0,0722 B`.
export function relativeLuminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) {
    throw new Error(`Cor inválida: ${hex} (esperado #rrggbb)`);
  }
  const value = parseInt(match[1]!, 16);
  const channels = [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff].map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

// Razão de contraste `(L1 + 0,05) / (L2 + 0,05)`, sempre a luminância maior sobre a menor.
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (light! + 0.05) / (dark! + 0.05);
}

export type ThemeScope = 'light' | 'dark' | 'faixa';

// Seletor de cada escopo. O escuro aceita aspas simples, duplas ou nenhuma, porque o Prettier e
// o Tailwind não garantem uma só forma.
const SCOPE_SELECTORS: Readonly<Record<ThemeScope, string>> = {
  light: ':root',
  dark: String.raw`\[data-theme=(?:'dark'|"dark"|dark)\]`,
  faixa: String.raw`\.faixa`,
};

const TOKEN_PATTERN = /--([a-z0-9-]+)\s*:\s*(#[0-9a-f]{6})\s*;/gi;

// Extrai `--nome: #hex` dos blocos `:root`, `[data-theme=dark]` e `.faixa` (o seletor tem de ser
// o único do bloco). Os valores que não são hex (`var(...)`, gradientes) ficam de fora.
export function parseThemeBlocks(css: string): Record<ThemeScope, Record<string, string>> {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const result: Record<ThemeScope, Record<string, string>> = { light: {}, dark: {}, faixa: {} };
  for (const scope of Object.keys(SCOPE_SELECTORS) as ThemeScope[]) {
    const block = new RegExp(`(?:^|[};{])\\s*${SCOPE_SELECTORS[scope]}\\s*\\{([^}]*)\\}`, 'g');
    for (const found of clean.matchAll(block)) {
      for (const token of found[1]!.matchAll(TOKEN_PATTERN)) {
        result[scope][token[1]!] = token[2]!.toLowerCase();
      }
    }
  }
  return result;
}
