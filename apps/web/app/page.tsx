import Image from 'next/image';
import Link from 'next/link';
import { BrushStroke } from '@/components/ornaments/brush-stroke';
import { buttonVariants } from '@/components/ui/button';
import { SITE } from '@/lib/site';
import { cn } from '@/lib/utils';

// Capa do clã (D-06): estática, sem chamar a API (por isso abre mesmo com a API fora do ar).
// Emblema, banner e traço de pincel são decorativos (D-19); o fundo da seção é sólido e nenhum
// texto fica sobre a imagem do banner (Pitfall 4). Nenhum estilo inline: a CSP segue estática.
const CTA_LARGURA = 'max-[480px]:w-full';

const ALT_BANNER =
  'Banner do clã No Law com o emblema dos dois dragões e o slogan “Uma nova face, uma nova história.”';

// Bastão de madeira do pergaminho (decorativo): `--wood` não muda com o tema.
const BASTAO = 'h-3.5 rounded-[7px] bg-(--wood)';

export default function Home() {
  return (
    <section
      aria-labelledby="titulo-capa"
      className="relative overflow-x-clip bg-background pt-8 pb-6 md:pt-16 md:pb-12"
    >
      <div className="relative z-10 mx-auto flex max-w-288 flex-col gap-12 px-4 md:px-8">
        <div className="flex flex-wrap items-center gap-6 md:gap-12">
          <div className="flex min-w-0 flex-[999_1_460px] flex-col items-start gap-6">
            <p className="text-label text-link tracking-[3px] uppercase">
              {`Clã do SA-MP · desde ${SITE.foundedYear}`}
            </p>
            <div className="flex flex-col gap-3">
              <h1 id="titulo-capa" className="text-display text-balance">
                {SITE.slogan}
              </h1>
              <BrushStroke variant="title" />
            </div>
            <p className="text-body max-w-prose">
              Somos o No Law, um clã nascido no GTA San Andreas Multiplayer em 2017, de uma amizade
              de mais de 10 anos. Este é o nosso canto para guardar as histórias, as fotos e os
              vídeos do grupo.
            </p>
            <div className="flex w-full flex-wrap gap-4 max-[480px]:flex-col">
              <Link
                href="/sobre"
                className={cn(buttonVariants({ variant: 'primary' }), CTA_LARGURA)}
              >
                Conheça o clã
              </Link>
              <Link
                href="/regras"
                className={cn(buttonVariants({ variant: 'secondary' }), CTA_LARGURA)}
              >
                Leia as regras
              </Link>
            </div>
          </div>

          <div className="relative order-first flex min-h-65 min-w-0 flex-[1_1_360px] items-center justify-center md:min-h-100">
            <div
              aria-hidden="true"
              className="animate-brilho absolute size-70 rounded-full bg-[radial-gradient(circle,rgba(172,2,15,0.75)_0%,rgba(66,11,13,0.55)_45%,transparent_70%)] motion-reduce:animate-none md:size-105"
            />
            <Image
              src="/brand/emblema.png"
              alt=""
              width={340}
              height={340}
              sizes="(min-width: 768px) 340px, 220px"
              loading="eager"
              fetchPriority="high"
              className="relative size-55 rounded-full bg-background shadow-[0_0_0_3px_var(--gold),0_20px_60px_rgba(0,0,0,0.6)] md:size-85"
            />
          </div>
        </div>

        <figure className="m-0 flex flex-col">
          <div aria-hidden="true" className={cn(BASTAO, 'shadow-[0_3px_6px_rgba(0,0,0,0.35)]')} />
          <Image
            src="/brand/banner.jpg"
            alt={ALT_BANNER}
            width={1500}
            height={500}
            sizes="(min-width: 1152px) 1088px, 96vw"
            loading="lazy"
            className="mx-3 block aspect-3/1 w-[calc(100%-1.5rem)] bg-background object-cover"
          />
          <div aria-hidden="true" className={cn(BASTAO, 'shadow-[0_-2px_6px_rgba(0,0,0,0.35)]')} />
          <figcaption className="text-label mt-2.5 text-right text-muted-foreground">
            Do acervo do clã · o banner
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
