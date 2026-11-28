import Link from 'next/link';
import { DragonMark } from '@/components/dragon-mark';
import { BrushStroke } from '@/components/ornaments/brush-stroke';
import { Cloud } from '@/components/ornaments/cloud';
import { ThemeToggle } from '@/components/theme-toggle';
import { SITE } from '@/lib/site';

// Faixa de tinta do topo (D-02, D-19): os dragões e o nome "No Law" à esquerda, o botão de tema no
// fim e o traço de pincel sob a faixa. O nome é texto HTML, não imagem: é ele que dá o nome
// acessível ao link da marca. O cabeçalho não é sticky (UI-SPEC P8).
// O 02-05 põe a navegação entre a marca e o botão de tema, na mesma linha.
//
// A nuvem do canto direito só aparece a partir de 1024px, fica numa camada abaixo do conteúdo e a
// faixa corta o que passa do topo. A linha reserva 144px à direita (lg:pr-36) para ela nunca ficar
// sob a navegação, o botão de tema ou o ☰. Sem estilo inline e sem largura da janela inteira.
export function SiteHeader() {
  return (
    <header className="faixa relative overflow-y-clip">
      <div className="relative mx-auto max-w-288 px-4 py-2 md:px-8">
        <div
          aria-hidden="true"
          className="hidden lg:block pointer-events-none absolute -top-3 right-0 z-0 w-32"
        >
          <Cloud className="w-full" />
        </div>
        <div className="relative z-10 flex items-center gap-4 lg:pr-36">
          <Link href="/" className="inline-flex min-h-11 items-center gap-3">
            <DragonMark size={44} />
            <span className="text-heading font-display">{SITE.clan}</span>
          </Link>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </div>
      <BrushStroke variant="header" />
    </header>
  );
}
