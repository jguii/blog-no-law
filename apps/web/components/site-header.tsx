import Link from 'next/link';
import { DragonMark } from '@/components/dragon-mark';
import { ThemeToggle } from '@/components/theme-toggle';
import { SITE } from '@/lib/site';

// Faixa de tinta do topo (D-02): os dragões e o nome "No Law" à esquerda, o botão de tema no fim.
// O nome é texto HTML, não imagem: é ele que dá o nome acessível ao link da marca. O cabeçalho não
// é sticky (UI-SPEC P8). O 02-05 põe a navegação entre a marca e o botão de tema.
export function SiteHeader() {
  return (
    <header className="faixa relative">
      <div className="mx-auto max-w-288 px-4 py-2 md:px-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="inline-flex min-h-11 items-center gap-3">
            <DragonMark size={44} />
            <span className="text-heading font-display">{SITE.clan}</span>
          </Link>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
