import type { Metadata } from 'next';
import { ReadingPage } from '@/components/reading-page';
import { REGRAS, REGRAS_PROVISORIAS } from '@/lib/conteudo';

export const metadata: Metadata = { title: REGRAS.titulo };

// Só texto em JSX (escapado pelo React). Com as regras do Discord, cada grupo vira um h2 com uma
// lista numerada; enquanto não há grupos, a página mostra só as frases provisórias, no mesmo layout.
export default function RegrasPage() {
  return (
    <ReadingPage id="titulo-regras" title={REGRAS.titulo}>
      {REGRAS.introducao.map((frase) => (
        <p key={frase}>{frase}</p>
      ))}
      {!REGRAS_PROVISORIAS &&
        REGRAS.grupos.map((grupo) => (
          <section key={grupo.titulo}>
            <h2>{grupo.titulo}</h2>
            <ol>
              {grupo.regras.map((regra) => (
                <li key={regra}>{regra}</li>
              ))}
            </ol>
          </section>
        ))}
    </ReadingPage>
  );
}
