import { cn } from '@/lib/utils';

// Os destinos do menu do topo (D-08): só o que existe nesta fase, nada de "em breve". Este módulo
// não é client: o `/kit` (server component) o importa para mostrar a pílula e o painel em
// pré-visualização estática, e uma função exportada de módulo client não pode ser chamada ali.
export const NAV_ITEMS = [
  { href: '/', label: 'Início' },
  { href: '/sobre', label: 'Sobre o clã' },
  { href: '/regras', label: 'Regras' },
] as const;

// `pill`: as pílulas do header a partir de 768px. `panel`: os itens de 52px do painel do ☰.
export type NavVariant = 'pill' | 'panel';

type NavItemClassNameOptions = {
  variant: NavVariant;
  active: boolean;
};

const BASE = {
  pill: 'inline-flex min-h-11 items-center rounded-full px-4 whitespace-nowrap text-label',
  panel: 'flex min-h-13 w-full items-center rounded-full px-4 text-left text-label',
} as const;

// Dentro da faixa de tinta (`.faixa`): texto dourado, hover `accent` e o ativo em vermelho cheio
// com texto branco. O anel interno `link` (#ff6b75, 2px) dá os 3:1 que o vermelho sozinho sobre o
// preto não dá (UI-SPEC P5). O anel de foco é o `:focus-visible` global (--ring, 2px).
export function navItemClassName({ variant, active }: NavItemClassNameOptions): string {
  return cn(
    BASE[variant],
    active
      ? 'bg-primary text-primary-foreground inset-ring-2 inset-ring-link'
      : 'text-foreground hover:bg-accent',
  );
}
