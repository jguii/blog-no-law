import { expect, test, type Page } from '@playwright/test';
import { comTema, expectNoAxeViolations, TEMAS } from './helpers';

// Cenários BDD: docs/bdd/identidade-visual.feature.md (tag @e2e). O nome de cada test() começa pelo do cenário.
// Suíte transversal da fase: todas as rotas, nos dois temas, no desktop (`chromium`) e no celular (`mobile`,
// Pixel 7). Roda só na CI (D-09). O padrão do Playwright aqui é `reducedMotion: 'reduce'`, para o axe não
// medir contraste no meio de uma transição de cores.

const ROTAS = ['/', '/sobre', '/regras', '/privacidade', '/kit', '/status', '/nao-existe'] as const;
const LARGURAS = [320, 375, 412] as const;

for (const tema of TEMAS) {
  for (const rota of ROTAS) {
    test(`@e2e Acessibilidade nos dois temas em todas as páginas: ${rota} no tema ${tema}`, async ({
      page,
    }) => {
      await comTema(page, tema);
      await page.goto(rota);

      await expect(page.locator('html')).toHaveAttribute('data-theme', tema);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.getByRole('banner')).toBeVisible();
      await expect(
        page
          .getByRole('banner')
          .getByRole('link', { name: /No Law/ })
          .first(),
      ).toBeVisible();
      await expect(page.getByRole('contentinfo')).toBeVisible();

      await expectNoAxeViolations(page);
    });
  }
}

for (const tema of TEMAS) {
  for (const largura of LARGURAS) {
    test(`@e2e Nenhuma página rola de lado no celular: ${largura}px no tema ${tema}`, async ({
      page,
      isMobile,
    }) => {
      test.skip(!isMobile, 'a rolagem lateral só importa na tela de celular');

      await comTema(page, tema);
      await page.setViewportSize({ width: largura, height: 800 });

      for (const rota of ROTAS) {
        await page.goto(rota);
        const medidas = await page.evaluate(() => ({
          conteudo: document.documentElement.scrollWidth,
          tela: window.innerWidth,
        }));
        expect(medidas.conteudo, `${rota} a ${largura}px`).toBeLessThanOrEqual(medidas.tela);
      }
    });
  }
}

// O `securitypolicyviolation` é o sinal exato do navegador; a mensagem do console cobre o que ele só
// escreve no log. O coletor entra antes de qualquer script da página.
async function coletarViolacoes(page: Page): Promise<string[]> {
  const mensagens: string[] = [];
  page.on('console', (mensagem) => {
    if (/Content Security Policy/i.test(mensagem.text())) mensagens.push(mensagem.text());
  });
  page.on('pageerror', (erro) => {
    if (/Content Security Policy/i.test(erro.message)) mensagens.push(erro.message);
  });
  await page.addInitScript(() => {
    const janela = window as unknown as { __violacoesCsp: string[] };
    janela.__violacoesCsp = [];
    document.addEventListener('securitypolicyviolation', (evento) => {
      janela.__violacoesCsp.push(`${evento.violatedDirective} ${evento.blockedURI}`);
    });
  });
  return mensagens;
}

for (const tema of TEMAS) {
  test(`@e2e Nenhuma violação de CSP: todas as páginas no tema ${tema}`, async ({ page }) => {
    const mensagens = await coletarViolacoes(page);
    await comTema(page, tema);

    for (const rota of ROTAS) {
      await page.goto(rota);
      await page.waitForLoadState('load');
      const eventos = await page.evaluate(
        () => (window as unknown as { __violacoesCsp: string[] }).__violacoesCsp,
      );
      expect(eventos, `eventos de violação de CSP em ${rota}`).toEqual([]);
    }

    expect(mensagens, 'mensagens de violação de CSP no console').toEqual([]);
  });
}
