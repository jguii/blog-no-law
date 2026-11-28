import { useId } from 'react';

// Nuvem do clã (esboço Síntese, D-19): corpo em gradiente preto para vermelho, contorno dourado e
// duas espirais. Decorativa: sem texto, sem cliques e sem estilo inline.
const BLACK = '#000000';
const RED = '#ac020f';
const GOLD = '#c8a04a';

type CloudProps = {
  className?: string;
  /** Espelha a nuvem na horizontal (a do canto direito do rodapé). */
  flip?: boolean;
};

export function Cloud({ className, flip }: CloudProps) {
  const gradientId = useId();
  const classes = ['pointer-events-none block', flip ? '-scale-x-100' : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 120 60" className={classes}>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1">
          <stop offset="0" stopColor={BLACK} />
          <stop offset="1" stopColor={RED} />
        </linearGradient>
      </defs>
      <path
        d="M8 48 C8 36 20 30 30 34 C30 20 48 14 58 24 C64 10 88 10 92 26 C104 22 116 32 112 44 C116 46 116 52 110 52 L12 52 C6 52 4 50 8 48 Z"
        fill={`url(#${gradientId})`}
        stroke={GOLD}
        strokeWidth="1.5"
      />
      <path
        d="M40 40 c0 -6 8 -6 8 0 c0 3 -4 3 -4 1"
        fill="none"
        stroke={GOLD}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M70 36 c0 -7 10 -7 10 0 c0 4 -5 4 -5 1"
        fill="none"
        stroke={GOLD}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
