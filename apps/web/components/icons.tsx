// Ícones do menu em SVG inline, desenhados à mão (D-23: nenhuma biblioteca de ícones). São só
// decoração: o botão que os usa tem o próprio rótulo ("Abrir menu" / "Fechar menu"), então o SVG
// é `aria-hidden` e não tem texto. O traço usa `currentColor` e herda a cor do botão.
const ICON = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

// ☰
export function MenuIcon() {
  return (
    <svg aria-hidden="true" focusable="false" {...ICON}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

// ✕
export function CloseIcon() {
  return (
    <svg aria-hidden="true" focusable="false" {...ICON}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
