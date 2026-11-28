// Tema do clã (UX-02, D-15): o servidor sempre emite o escuro "tinta" e o visitante pode trocar
// para o claro "pergaminho". A preferência fica só no localStorage do navegador, sem cookie e sem
// envio ao servidor, para nunca servir de identificador do visitante.
export const THEME_KEY = 'nl-theme';
export const THEMES = ['dark', 'light'] as const;
export type Theme = (typeof THEMES)[number];
export const DEFAULT_THEME: Theme = 'dark';

// Allowlist por igualdade exata: só a string `light` aplica o claro. Qualquer outro valor
// (ausente, vazio, outra caixa, marcação) resulta no escuro, e o valor lido nunca vai ao DOM.
export function resolveTheme(stored: string | null | undefined): Theme {
  return stored === 'light' ? 'light' : DEFAULT_THEME;
}

// Script anti-flash do <head>: roda antes da primeira pintura e aplica a escolha salva.
// Constante, sem dado de runtime e sem o caractere de abertura de marcação, porque entra no HTML
// como texto filho de <script> (nunca como HTML bruto). O try/catch cobre storage bloqueado.
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");document.documentElement.setAttribute("data-theme",t==="light"?"light":"dark")}catch(e){}})()`;
