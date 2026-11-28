import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DragonMark } from '@/components/dragon-mark';
import { MenuIcon } from '@/components/icons';
import { BrushStroke } from '@/components/ornaments/brush-stroke';
import { Cloud } from '@/components/ornaments/cloud';
import { Hanko } from '@/components/ornaments/hanko';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { contrastRatio } from '@/lib/contrast';
import { NAV_ITEMS, navItemClassName } from '@/lib/nav';
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

// Os quatro papéis (4 tamanhos, 2 pesos). Cada linha usa a própria utilitária do papel.
function SecaoTipografia() {
  return (
    <Secao titulo="Tipografia">
      <div className="flex flex-col gap-4">
        <p className="text-label">Label 14px · peso 700 · Atkinson</p>
        <p className="text-body">Body 18px · peso 400 · Atkinson</p>
        <p className="text-heading font-display text-balance">
          Heading 26/22px · peso 400 · Yuji Boku
        </p>
        <p className="text-display font-display text-balance">Display 52/36px · Yuji Boku</p>
      </div>
    </Secao>
  );
}

// A escala de espaçamento (UI-SPEC). As larguras são classes da escala do Tailwind, escritas por
// extenso para o Tailwind enxergá-las; nenhum valor arbitrário.
const ESCALA = [
  { nome: 'xs', px: 4, barra: 'w-1' },
  { nome: 'sm', px: 8, barra: 'w-2' },
  { nome: 'md', px: 16, barra: 'w-4' },
  { nome: 'lg', px: 24, barra: 'w-6' },
  { nome: 'xl', px: 32, barra: 'w-8' },
  { nome: '2xl', px: 48, barra: 'w-12' },
  { nome: '3xl', px: 64, barra: 'w-16' },
] as const;

function SecaoEspacamento() {
  return (
    <Secao titulo="Espaçamento">
      <ul className="flex flex-col gap-2">
        {ESCALA.map(({ nome, px, barra }) => (
          <li key={nome} className="flex items-center gap-4">
            <span
              aria-hidden="true"
              data-espaco={px}
              className={`block h-3 shrink-0 rounded-sm bg-primary ${barra}`}
            />
            <code className={CODE_CLASS}>{nome}</code>
            <span className="text-label text-muted-foreground">{`${px}px`}</span>
          </li>
        ))}
      </ul>
    </Secao>
  );
}

// Os estados são mostrados de forma estática: o hover e o foco aplicam as mesmas classes que o
// estado real produz (`hover:` e `focus-visible:` do `buttonVariants`), sem depender do ponteiro.
const BOTOES = [
  { variant: 'primary', size: 'default' },
  { variant: 'primary', size: 'sm' },
  { variant: 'secondary', size: 'default' },
  { variant: 'secondary', size: 'sm' },
] as const;

const HOVER = {
  primary: '-translate-y-0.5 shadow-botao',
  secondary: 'bg-accent',
} as const;

const FOCO = 'outline-2 outline-offset-2 outline-ring';

function SecaoBotoes() {
  return (
    <Secao titulo="Botões">
      {BOTOES.map(({ variant, size }) => (
        <div key={`${variant}-${size}`} className="flex flex-col gap-2">
          <p className="text-label">
            <code className={CODE_CLASS}>{`${variant} · ${size}`}</code>
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant={variant} size={size}>
              Normal
            </Button>
            <Button variant={variant} size={size} className={HOVER[variant]}>
              Hover
            </Button>
            <Button variant={variant} size={size} className={FOCO}>
              Foco
            </Button>
            <Button variant={variant} size={size} disabled>
              Desabilitado
            </Button>
          </div>
        </div>
      ))}
    </Secao>
  );
}

function SecaoLink() {
  return (
    <Secao titulo="Link em texto">
      <p className="text-body">
        Um link dentro do texto é{' '}
        <a href="#conteudo" className="text-link text-body underline underline-offset-4">
          sublinhado e na cor de link
        </a>
        : a cor nunca é o único indicador.
      </p>
    </Secao>
  );
}

function SecaoCard() {
  return (
    <Secao titulo="Card">
      <div className="rounded-md bg-background p-4">
        <Card>
          <CardContent className="flex flex-col gap-2">
            <p className="text-label text-muted-foreground">Exemplo de card</p>
            <p className="text-body">Superfície de leitura sobre o fundo da página.</p>
          </CardContent>
        </Card>
      </div>
    </Secao>
  );
}

// Pré-visualização estática (spans, não links): o menu real do topo tem o id `menu-principal` e o
// nav "Principal", e a página não pode repetir nenhum dos dois.
function SecaoItemDeMenu() {
  return (
    <Secao titulo="Item de menu">
      <div className="faixa flex flex-wrap items-center gap-2 rounded-md p-4">
        <span className={navItemClassName({ variant: 'pill', active: false })}>
          {NAV_ITEMS[1].label}
        </span>
        <span className={navItemClassName({ variant: 'pill', active: true })}>
          {NAV_ITEMS[0].label}
        </span>
      </div>
      <p className="text-label text-muted-foreground">Normal e ativa (página atual).</p>
    </Secao>
  );
}

function SecaoMenuSanduiche() {
  return (
    <Secao titulo="Menu sanduíche">
      <div className="flex flex-wrap items-start gap-6">
        <div className="faixa flex flex-col gap-2 rounded-md p-4">
          <p className="text-label">Fechado</p>
          <span
            aria-hidden="true"
            className="inline-flex size-11 items-center justify-center rounded-full border-2 border-border bg-transparent text-foreground"
          >
            <MenuIcon />
          </span>
        </div>
        <div className="faixa flex flex-col gap-2 rounded-md p-4">
          <p className="text-label">Aberto</p>
          <ul className="flex w-64 max-w-full flex-col rounded-md border-2 border-border bg-panel px-4 py-2">
            {NAV_ITEMS.map((item, index) => (
              <li key={item.href}>
                <span className={navItemClassName({ variant: 'panel', active: index === 0 })}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Secao>
  );
}

function SecaoBotaoDeTema() {
  return (
    <Secao titulo="Botão de tema">
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <p className="text-body">Troca entre o escuro e o claro; a escolha fica salva.</p>
      </div>
    </Secao>
  );
}

const MARCAS = [16, 32, 44, 96] as const;

function SecaoOrnamentos() {
  return (
    <Secao titulo="Ornamentos">
      <div className="flex flex-wrap items-end gap-6">
        {MARCAS.map((size) => (
          <figure key={size} className="flex flex-col items-center gap-2">
            <DragonMark size={size} />
            <figcaption className="text-label text-muted-foreground">{`${size}px`}</figcaption>
          </figure>
        ))}
      </div>
      <div className="flex flex-col gap-4">
        <BrushStroke variant="header" />
        <BrushStroke variant="footer" />
        <BrushStroke variant="title" />
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <Cloud className="w-40" />
        <Hanko />
      </div>
    </Secao>
  );
}

export default function KitPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <h1 className="text-display text-balance">Kit de identidade</h1>
      <SecaoCores />
      <SecaoTipografia />
      <SecaoEspacamento />
      <SecaoBotoes />
      <SecaoLink />
      <SecaoCard />
      <SecaoItemDeMenu />
      <SecaoMenuSanduiche />
      <SecaoBotaoDeTema />
      <SecaoOrnamentos />
    </div>
  );
}
