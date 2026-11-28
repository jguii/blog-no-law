import type { Metadata } from 'next';
import { ReadingPage } from '@/components/reading-page';
import { SOBRE } from '@/lib/conteudo';

// O modelo de título de lib/site.ts acrescenta "| Blog No Law". Estática: não lê a requisição.
export const metadata: Metadata = { title: SOBRE.titulo };

export default function SobrePage() {
  return (
    <ReadingPage id="titulo-sobre" title={SOBRE.titulo}>
      {SOBRE.paragrafos.map((paragrafo) => (
        <p key={paragrafo}>{paragrafo}</p>
      ))}
    </ReadingPage>
  );
}
