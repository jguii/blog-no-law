'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS, navItemClassName, type NavVariant } from '@/lib/nav';

type NavLinksProps = {
  variant: NavVariant;
  // Chamado no clique de um link: o painel do ☰ usa para se fechar.
  onNavigate?: () => void;
};

// Os três links do menu. É client só por causa do `usePathname`, que marca a página atual com
// `aria-current="page"` (só quando o caminho é exatamente o destino: /status e /kit não marcam nada).
export function NavLinks({ variant, onNavigate }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <ul className={variant === 'pill' ? 'flex items-center gap-2' : 'flex flex-col gap-1'}>
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              onClick={onNavigate}
              className={navItemClassName({ variant, active })}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
