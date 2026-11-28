import type { ReactNode } from 'react';
import { BrushStroke } from '@/components/ornaments/brush-stroke';
import { Prose } from '@/components/prose';
import { Card, CardContent } from '@/components/ui/card';

type ReadingPageProps = {
  id: string;
  title: string;
  children: ReactNode;
};

// Card de leitura do clã (direção Síntese): até 760px, faixa de gradiente de 6px colada no topo,
// h1 no Display com o traço de pincel logo abaixo e o corpo em Prose. Por D-19 as páginas de
// leitura não têm pétala, nuvem nem brilho: só o traço do título e a nuvem do header. Serve também
// aos posts da Fase 4.
export function ReadingPage({ id, title, children }: ReadingPageProps) {
  return (
    <article aria-labelledby={id} className="mx-auto max-w-190">
      <Card className="overflow-hidden">
        <div aria-hidden="true" className="bg-brand h-1.5" />
        <CardContent>
          <h1 id={id} className="text-display text-balance">
            {title}
          </h1>
          <BrushStroke variant="title" className="mt-2 mb-6" />
          <Prose>{children}</Prose>
        </CardContent>
      </Card>
    </article>
  );
}
