import Link from 'next/link';
import { SITE } from '@/lib/site';

// Os destinos institucionais (D-05, D-09). São publicados pelo 02-06; até lá caem na 404 do clã.
// Só destinos internos: nenhum link externo nas faixas nesta fase (D-09).
const LINKS = [
  { href: '/sobre', label: 'Sobre o clã' },
  { href: '/regras', label: 'Regras' },
  { href: '/privacidade', label: 'Privacidade' },
] as const;

// Faixa de tinta do rodapé: links com alvos de 44px que quebram em linhas no celular e o selo
// de fundação. O texto é montado numa string só para o HTML sair com "No Law · desde 2017" inteiro.
export function SiteFooter() {
  return (
    <footer className="faixa">
      <div className="mx-auto max-w-288 px-4 py-8 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <nav aria-label="Rodapé">
            <ul className="flex flex-wrap gap-2">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-label text-link inline-flex min-h-11 items-center underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <p className="text-label">{`${SITE.clan} · desde ${SITE.foundedYear}`}</p>
        </div>
      </div>
    </footer>
  );
}
