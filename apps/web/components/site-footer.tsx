import Link from 'next/link';
import { BrushStroke } from '@/components/ornaments/brush-stroke';
import { Cloud } from '@/components/ornaments/cloud';
import { Hanko } from '@/components/ornaments/hanko';
import { SITE } from '@/lib/site';

// Os destinos institucionais (D-05, D-09). São publicados pelo 02-06; até lá caem na 404 do clã.
// Só destinos internos: nenhum link externo nas faixas nesta fase (D-09).
const LINKS = [
  { href: '/sobre', label: 'Sobre o clã' },
  { href: '/regras', label: 'Regras' },
  { href: '/privacidade', label: 'Privacidade' },
] as const;

// Faixa de tinta do rodapé (D-19): traço de pincel acima da faixa, links com alvos de 44px que
// quebram em linhas no celular, o selo de fundação e o hanko. O par de nuvens ocupa os cantos a
// partir de 640px; o rodapé corta o excesso horizontal para nunca criar rolagem lateral. O texto
// é montado numa string só para o HTML sair com "No Law · desde 2017" inteiro.
export function SiteFooter() {
  return (
    <footer className="faixa relative overflow-x-clip">
      <BrushStroke variant="footer" />
      <div
        aria-hidden="true"
        className="hidden sm:block pointer-events-none absolute bottom-0 left-0 z-0 -ml-6 w-32"
      >
        <Cloud className="w-full" />
      </div>
      <div
        aria-hidden="true"
        className="hidden sm:block pointer-events-none absolute right-0 bottom-0 z-0 -mr-6 w-32"
      >
        <Cloud flip className="w-full" />
      </div>
      <div className="relative z-10 mx-auto max-w-288 px-4 py-8 sm:px-36">
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
          <div className="flex items-center gap-3">
            <p className="text-label">{`${SITE.clan} · desde ${SITE.foundedYear}`}</p>
            <Hanko />
          </div>
        </div>
      </div>
    </footer>
  );
}
