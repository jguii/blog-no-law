import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { contrastRatio } from '@/lib/contrast';
import { CONTRAST_PAIRS, TOKENS, type TokenScope } from '@/lib/tokens';

// Página de referência do kit (D-22, VIS-03): estática, fora do menu e fora dos buscadores (esta
// meta e o cabeçalho `X-Robots-Tag` do `lib/security-headers.ts`). Não chama a API.
export const metadata: Metadata = {
  title: 'Kit de identidade',
  robots: { index: false, follow: false },
};

const CODE_CLASS = 'text-label font-mono font-normal wrap-anywhere';

const SCOPES: readonly { scope: TokenScope; titulo: string }[] = [
  { scope: 'dark', titulo: 'Escuro "tinta" (padrão)' },
  { scope: 'light', titulo: 'Claro "pergaminho"' },
  { scope: 'faixa', titulo: 'Faixa (header e rodapé, igual nos dois temas)' },
];

// Razão com vírgula decimal e duas casas ("9,84:1"); o mínimo exigido sai sem casas inúteis.
function formatRatio(value: number): string {
  return `${value.toFixed(2).replace('.', ',')}:1`;
}

function formatMin(value: number): string {
  return `${String(value).replace('.', ',')}:1`;
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-6">
        <h2>{titulo}</h2>
        {children}
      </CardContent>
    </Card>
  );
}

// A amostra pinta o próprio hex do token (e não a variável do tema atual), então os dois temas e
// a faixa aparecem lado a lado qualquer que seja o tema de quem abre a página.
function Amostras({ scope }: { scope: TokenScope }) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,12rem),1fr))] gap-4">
      {Object.entries(TOKENS[scope]).map(([name, hex]) => (
        <li key={name} className="flex flex-col gap-1">
          <span
            aria-hidden="true"
            className="block h-12 rounded-sm border border-border"
            style={{ backgroundColor: hex }}
          />
          <code className={CODE_CLASS}>{name}</code>
          <code className={CODE_CLASS}>{hex}</code>
        </li>
      ))}
    </ul>
  );
}

function ParesDeContraste({ scope }: { scope: TokenScope }) {
  const pares = CONTRAST_PAIRS.filter((par) => par.scope === scope);
  return (
    <table className="w-full table-fixed border-collapse text-left">
      <caption className="sr-only">Razão de contraste de cada par no escopo {scope}</caption>
      <thead>
        <tr>
          <th scope="col" className="w-1/2 py-1 pr-2 text-label text-muted-foreground">
            Texto sobre fundo
          </th>
          <th scope="col" className="py-1 pr-2 text-label text-muted-foreground">
            Razão
          </th>
          <th scope="col" className="py-1 text-label text-muted-foreground">
            Mínimo
          </th>
        </tr>
      </thead>
      <tbody>
        {pares.map((par) => {
          const ratio = contrastRatio(TOKENS[scope][par.fg]!, TOKENS[scope][par.bg]!);
          return (
            <tr key={`${par.fg}-${par.bg}`} className="border-t border-border align-top">
              <td className="py-2 pr-2">
                <code className={CODE_CLASS}>{par.fg}</code>
                <span className="text-label text-muted-foreground"> sobre </span>
                <code className={CODE_CLASS}>{par.bg}</code>
              </td>
              <td className="py-2 pr-2 text-label">{formatRatio(ratio)}</td>
              <td className="py-2 text-label">{formatMin(par.min)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function SecaoCores() {
  return (
    <Secao titulo="Cores">
      {SCOPES.map(({ scope, titulo }) => (
        <div key={scope} role="group" aria-label={titulo} className="flex flex-col gap-4">
          <p className="text-label">{titulo}</p>
          <Amostras scope={scope} />
          <ParesDeContraste scope={scope} />
        </div>
      ))}
    </Secao>
  );
}

export default function KitPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <h1 className="text-display text-balance">Kit de identidade</h1>
      <SecaoCores />
    </div>
  );
}
