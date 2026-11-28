import Link from 'next/link';
import { DragonMark } from '@/components/dragon-mark';
import { MobileMenu } from '@/components/mobile-menu';
import { NavLinks } from '@/components/nav-links';
import { BrushStroke } from '@/components/ornaments/brush-stroke';
import { Cloud } from '@/components/ornaments/cloud';
import { ThemeToggle } from '@/components/theme-toggle';
import { SITE } from '@/lib/site';

// Faixa de tinta do topo (D-02, D-19): os dragões e o nome "No Law" à esquerda, a navegação em
// pílulas (a partir de 768px) e o botão de tema no fim, e o traço de pincel sob a faixa. O nome é
// texto HTML, não imagem: é ele que dá o nome acessível ao link da marca. O cabeçalho não é
// sticky (UI-SPEC P8).
//
// A nuvem do canto direito só aparece a partir de 1024px. Ela mora numa camada própria que corta o
// que passa do topo (em vez de cortar o cabeçalho inteiro, para o painel do ☰ poder sair por baixo
// da faixa) e fica atrás do conteúdo (-z-10 dentro do contexto de empilhamento do <header>, que
// também põe o painel acima do conteúdo da página). A linha reserva 144px à direita (lg:pr-36)
// para a nuvem nunca ficar sob a navegação ou o botão de tema. Sem estilo inline e sem largura da
// janela inteira.
export function SiteHeader() {
  return (
    <header className="faixa relative z-20">
      <div
        aria-hidden="true"
        className="hidden lg:block pointer-events-none absolute inset-0 -z-10 overflow-clip"
      >
        <div className="relative mx-auto h-full max-w-288">
          <div className="absolute -top-3 right-0 w-32">
            <Cloud className="w-full" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-288 px-4 py-2 md:px-8">
        <div className="flex items-center gap-4 lg:pr-36">
          <Link href="/" className="inline-flex min-h-11 items-center gap-3">
            <DragonMark size={44} />
            <span className="text-heading font-display">{SITE.clan}</span>
          </Link>
          <div className="ml-auto flex items-center gap-4">
            <nav aria-label="Principal" className="hidden md:block">
              <NavLinks variant="pill" />
            </nav>
            <ThemeToggle />
            <MobileMenu />
          </div>
        </div>
      </div>
      <BrushStroke variant="header" />
    </header>
  );
}
