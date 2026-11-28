// Fonte única dos hex da identidade visual do clã (VIS-01). O `app/globals.css` repete estes
// valores e o teste `lib/contrast.test.ts` trava as duas pontas: mudou um, o outro tem de mudar.
// A página `/kit` mostra esta mesma tabela. Os hex valem em hex (não OKLCH) para o teste ler o CSS.

export type TokenScope = 'light' | 'dark' | 'faixa';

export type TokenSet = Readonly<Record<string, string>>;

// `light` é o `:root` (pergaminho), `dark` é `[data-theme='dark']` (tinta) e `faixa` é `.faixa`:
// o header e o rodapé, pretos nos dois temas, que redefinem as variáveis semânticas dentro deles.
export const TOKENS: Readonly<Record<TokenScope, TokenSet>> = {
  light: {
    background: '#ecdcc4',
    foreground: '#1a1210',
    card: '#f6eddc',
    'card-foreground': '#1a1210',
    muted: '#e2cfb2',
    'muted-foreground': '#5c4631',
    primary: '#ac020f',
    'primary-foreground': '#ffffff',
    secondary: '#d3aa82',
    'secondary-foreground': '#420b0d',
    accent: '#e2cfb2',
    'accent-foreground': '#1a1210',
    link: '#8a0210',
    border: '#8a6a4a',
    input: '#8a6a4a',
    ring: '#8a0210',
    destructive: '#8a0210',
  },
  dark: {
    background: '#000000',
    foreground: '#d3aa82',
    card: '#420b0d',
    'card-foreground': '#d3aa82',
    muted: '#1a0506',
    'muted-foreground': '#bfa07f',
    primary: '#ac020f',
    'primary-foreground': '#ffffff',
    secondary: '#2a0708',
    'secondary-foreground': '#d3aa82',
    accent: '#2a0708',
    'accent-foreground': '#d3aa82',
    link: '#ff6b75',
    border: '#a8845f',
    input: '#a8845f',
    ring: '#ff6b75',
    destructive: '#ff6b75',
  },
  faixa: {
    background: '#000000',
    foreground: '#d3aa82',
    link: '#ff6b75',
    border: '#a8845f',
    ring: '#ff6b75',
    accent: '#2a0708',
    panel: '#0d0203',
  },
};

// Um par obrigatório do contrato: `fg` sobre `bg` no escopo `scope`, com a razão mínima WCAG AA
// (4,5 para texto; 3 para UI e foco).
export type ContrastPair = {
  readonly scope: TokenScope;
  readonly fg: string;
  readonly bg: string;
  readonly min: number;
};

function pairs(scope: TokenScope, fg: string, bgs: readonly string[], min: number): ContrastPair[] {
  return bgs.map((bg) => ({ scope, fg, bg, min }));
}

function pairsOfTheme(scope: 'light' | 'dark'): ContrastPair[] {
  return [
    ...pairs(scope, 'foreground', ['background'], 4.5),
    ...pairs(scope, 'card-foreground', ['card'], 4.5),
    ...pairs(scope, 'muted-foreground', ['background', 'card', 'muted'], 4.5),
    ...pairs(scope, 'primary-foreground', ['primary'], 4.5),
    ...pairs(scope, 'link', ['background', 'card'], 4.5),
    ...pairs(scope, 'ring', ['background', 'card'], 3),
    ...pairs(scope, 'border', ['background', 'card'], 3),
  ];
}

// Na faixa os três fundos possíveis são o preto da faixa, o painel do menu móvel e o hover da pílula.
const FAIXA_BGS = ['background', 'panel', 'accent'] as const;

export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  ...pairsOfTheme('light'),
  ...pairsOfTheme('dark'),
  ...pairs('faixa', 'foreground', FAIXA_BGS, 4.5),
  ...pairs('faixa', 'link', FAIXA_BGS, 4.5),
  ...pairs('faixa', 'ring', FAIXA_BGS, 3),
  ...pairs('faixa', 'border', FAIXA_BGS, 3),
];
