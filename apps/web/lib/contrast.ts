// Esqueleto do RED: as funções existem para o teste carregar e falhar na asserção.
// A implementação real entra no GREEN.
export function relativeLuminance(_hex: string): number {
  return 0;
}

export function contrastRatio(_a: string, _b: string): number {
  return 0;
}

export function parseThemeBlocks(
  _css: string,
): Record<'light' | 'dark' | 'faixa', Record<string, string>> {
  return { light: {}, dark: {}, faixa: {} };
}
