import { useId } from 'react';

// Traço de pincel do clã (D-19), escrito como JSX: arte decorativa, sem HTML bruto e sem estilo
// inline. As cores da marca ficam literais porque não mudam com o tema claro/escuro.
const RED = '#ac020f';
const DARK_RED = '#420b0d';

type Variant = 'header' | 'footer' | 'title';

type BrushStrokeProps = {
  variant: Variant;
  className?: string;
};

// Cada variante é uma arte diferente (esboço Síntese): o header (4px) e o rodapé (5px) esticam a
// largura da faixa e o `title` fica sob o h1 (3px, sólido).
const ART = {
  header: {
    viewBox: '0 0 1200 12',
    d: 'M0 7 C200 2 380 11 600 6 C820 1 1000 10 1200 5',
    strokeWidth: 4,
    from: RED,
    to: DARK_RED,
    size: 'block h-2.5 w-full',
  },
  footer: {
    viewBox: '0 0 1200 12',
    d: 'M0 5 C220 10 420 2 640 7 C860 11 1020 3 1200 6',
    strokeWidth: 5,
    from: DARK_RED,
    to: RED,
    size: 'block h-2.5 w-full',
  },
  title: {
    viewBox: '0 0 300 10',
    d: 'M2 6 C80 1 160 9 298 4',
    strokeWidth: 3,
    from: RED,
    to: RED,
    size: 'block w-40 md:w-64',
  },
} as const satisfies Record<Variant, object>;

export function BrushStroke({ variant, className }: BrushStrokeProps) {
  const gradientId = useId();
  const art = ART[variant];
  const stretched = variant !== 'title';

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={art.viewBox}
      preserveAspectRatio={stretched ? 'none' : undefined}
      className={className ? `${art.size} ${className}` : art.size}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1">
          <stop offset="0" stopColor={art.from} />
          <stop offset="1" stopColor={art.to} />
        </linearGradient>
      </defs>
      <path
        d={art.d}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={art.strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}
