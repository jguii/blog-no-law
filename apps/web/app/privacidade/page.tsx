import type { Metadata } from 'next';
import { ReadingPage } from '@/components/reading-page';
import { PRIVACIDADE } from '@/lib/conteudo';

export const metadata: Metadata = { title: PRIVACIDADE.titulo };

// Só texto em JSX (escapado pelo React): a abertura, cada seção como h2 seguido de lista ou
// parágrafos, e o fecho.
export default function PrivacidadePage() {
  return (
    <ReadingPage id="titulo-privacidade" title={PRIVACIDADE.titulo}>
      <p>{PRIVACIDADE.abertura}</p>
      {PRIVACIDADE.secoes.map((secao) => (
        <section key={secao.titulo}>
          <h2>{secao.titulo}</h2>
          {secao.itens && (
            <ul>
              {secao.itens.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          {secao.paragrafos?.map((paragrafo) => (
            <p key={paragrafo}>{paragrafo}</p>
          ))}
        </section>
      ))}
      {PRIVACIDADE.fecho.map((frase) => (
        <p key={frase}>{frase}</p>
      ))}
    </ReadingPage>
  );
}
