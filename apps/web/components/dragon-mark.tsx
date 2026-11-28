import { useId } from 'react';

// Os dragões do clã em yin-yang (esboço 002, coluna B; D-01): um dragão preto e um vermelho dentro
// de um disco com aro dourado, sem texto. É arte, não tema: as cores da marca ficam literais aqui
// porque não mudam com o tema claro/escuro.
const BLACK = '#000000';
const RED = '#ac020f';
const GOLD = '#c8a04a';

// Contorno do corpo preto (a metade "yin"): serve de desenho e de recorte das escamas.
const BODY_PATH = 'M50 5 A45 45 0 0 0 50 95 A22.5 22.5 0 0 0 50 50 A22.5 22.5 0 0 1 50 5 Z';

type Detail = 'small' | 'large';

type DragonMarkProps = {
  size: number;
  /** Arte pequena (16 a 44px) ou grande (a partir de 96px, com escamas). Padrão pelo tamanho. */
  detail?: Detail;
  className?: string;
};

// Um dragão: dois chifres, o olho e, na arte grande, a boca e o bigode. O segundo dragão é o
// mesmo desenho girado em 180 graus, com as cores trocadas.
function Dragon({ body, accent, detail }: { body: string; accent: string; detail: Detail }) {
  const large = detail === 'large';
  return (
    <>
      <path d="M58 54 Q67 44 76 34 Q70 47 64 57 Z" fill={body} />
      <path d="M64 58 Q73 51 82 47 Q74 55 68 61 Z" fill={body} />
      {large ? <path d="M72.5 72 L63 75 L72 79 Z" fill={accent} /> : null}
      <ellipse cx="57" cy="67" rx="4.5" ry="2.6" transform="rotate(-25 57 67)" fill={accent} />
      {large ? (
        <path
          d="M71 79 Q81 82 75 86"
          fill="none"
          stroke={body}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      ) : null}
    </>
  );
}

// Decorativa: sempre aria-hidden e sem texto; quem usa a marca dá o nome acessível ao redor
// (o botão de tema, o link da marca). O id do clipPath vem de useId porque a arte grande pode
// aparecer mais de uma vez na mesma página.
export function DragonMark({ size, detail, className }: DragonMarkProps) {
  const clipId = useId();
  const level: Detail = detail ?? (size >= 96 ? 'large' : 'small');
  const large = level === 'large';

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
    >
      {large ? (
        <defs>
          <clipPath id={clipId}>
            <path d={BODY_PATH} />
          </clipPath>
        </defs>
      ) : null}
      <circle cx="50" cy="50" r="47.5" fill={RED} stroke={GOLD} strokeWidth="5" />
      {large ? (
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="none"
          stroke={BLACK}
          strokeWidth="1.4"
          strokeDasharray="2.5 3.5"
          opacity="0.55"
        />
      ) : null}
      <path d={BODY_PATH} fill={BLACK} />
      {large ? (
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="none"
          stroke={RED}
          strokeWidth="1.4"
          strokeDasharray="2.5 3.5"
          opacity="0.75"
          clipPath={`url(#${clipId})`}
        />
      ) : null}
      <Dragon body={BLACK} accent={RED} detail={level} />
      <g transform="rotate(180 50 50)">
        <Dragon body={RED} accent={BLACK} detail={level} />
      </g>
    </svg>
  );
}
