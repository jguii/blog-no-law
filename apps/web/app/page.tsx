import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { SITE } from '@/lib/site';
import { cn } from '@/lib/utils';

// Capa do clã (D-06): estática, sem chamar a API (por isso abre mesmo com a API fora do ar).
// O 02-14 acrescenta emblema, banner, pétalas e o traço de pincel sem mudar este conteúdo.
const CTA_LARGURA = 'max-[480px]:w-full';

export default function Home() {
  return (
    <section aria-labelledby="titulo-capa" className="flex flex-col items-start gap-6">
      <p className="text-label text-link tracking-[3px] uppercase">
        {`Clã do SA-MP · desde ${SITE.foundedYear}`}
      </p>
      <h1 id="titulo-capa" className="text-display text-balance">
        {SITE.slogan}
      </h1>
      <p className="text-body max-w-prose">
        Somos o No Law, um clã nascido no GTA San Andreas Multiplayer em 2017, de uma amizade de
        mais de 10 anos. Este é o nosso canto para guardar as histórias, as fotos e os vídeos do
        grupo.
      </p>
      <div className="flex w-full flex-wrap gap-4 max-[480px]:flex-col">
        <Link href="/sobre" className={cn(buttonVariants({ variant: 'primary' }), CTA_LARGURA)}>
          Conheça o clã
        </Link>
        <Link href="/regras" className={cn(buttonVariants({ variant: 'secondary' }), CTA_LARGURA)}>
          Leia as regras
        </Link>
      </div>
    </section>
  );
}
