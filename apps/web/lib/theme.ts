// Esqueleto do RED: exporta os símbolos sem o comportamento, para o teste falhar na asserção
// e não na carga do módulo (um módulo ausente não é RED válido). O GREEN o substitui.
export const THEME_KEY = '';
export const THEMES = ['dark', 'light'] as const;
export type Theme = (typeof THEMES)[number];
export const DEFAULT_THEME: Theme = 'dark';

export function resolveTheme(stored: string | null | undefined): Theme {
  void stored;
  return DEFAULT_THEME;
}

export const THEME_INIT_SCRIPT = '';
