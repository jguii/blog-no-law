import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { THEME_INIT_SCRIPT } from '@/lib/theme';
import GlobalError from './global-error';

// O SDK e o loader do next/font são substituídos: nada de rede e nenhum build do Next no teste.
const sentry = vi.hoisted(() => ({ captureException: vi.fn() }));
vi.mock('@sentry/nextjs', () => sentry);
vi.mock('@/lib/fonts', () => ({
  body: { variable: 'fonte-corpo', className: 'fonte-corpo-cls' },
  title: { variable: 'fonte-titulo', className: 'fonte-titulo-cls' },
}));
// O renderToStaticMarkup não roda efeitos: aqui o useEffect executa na hora, para provar que o
// erro segue para o Sentry (Fase 1) sem montar um navegador.
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, useEffect: (effect: () => void) => effect() };
});

const SENTINELA = 'segredo-interno';

function renderErro(): string {
  const error = Object.assign(new Error(SENTINELA), { digest: 'digest-interno' });
  return renderToStaticMarkup(<GlobalError error={error} reset={() => {}} />);
}

beforeEach(() => {
  sentry.captureException.mockReset();
});

describe('Erro global com a identidade do clã', () => {
  const html = renderErro();

  it('traz o próprio <html> em pt-BR com o tema escuro e as variáveis das fontes', () => {
    const open = html.slice(0, html.indexOf('>') + 1);
    const esperado = '<html lang="pt-BR" data-theme="dark" class="fonte-corpo fonte-titulo">';
    expect(open === esperado).toBe(true);
  });

  it('define o título da aba com o sufixo do blog', () => {
    expect(html.includes('<title>Algo deu errado | Blog No Law</title>')).toBe(true);
  });

  it('inclui o script de tema como texto de <script>', () => {
    expect(html.includes(`<script>${THEME_INIT_SCRIPT}</script>`)).toBe(true);
  });

  it('mostra o h1 Display e a explicação no tom do clã', () => {
    const h1Display =
      /<h1[^>]*class="[^"]*text-display[^"]*text-balance[^"]*"[^>]*>Algo deu errado<\/h1>/;
    expect(h1Display.test(html)).toBe(true);
    expect(html.includes('Tivemos um problema do nosso lado. Tente de novo em instantes.')).toBe(
      true,
    );
  });

  it('oferece o link de volta à página inicial como CTA primário', () => {
    const link = html.match(/<a [^>]*href="\/"[^>]*>[^<]*<\/a>/)?.[0] ?? '(sem link)';
    expect(link.includes('Voltar para a página inicial')).toBe(true);
    expect(/class="[^"]*bg-brand-button/.test(link)).toBe(true);
  });

  it('não revela mensagem, digest nem pilha do erro ao visitante', () => {
    expect(html.includes(SENTINELA) || html.includes('digest-interno')).toBe(false);
    expect(/\bat \S+ \(/.test(html)).toBe(false);
  });

  it('continua repassando a exceção ao Sentry', () => {
    renderErro();
    expect(sentry.captureException).toHaveBeenCalledTimes(1);
    expect(sentry.captureException.mock.calls[0]?.[0]).toMatchObject({ message: SENTINELA });
  });
});
