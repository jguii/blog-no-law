import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { comTema, expectNoAxeViolations, TEMAS } from './helpers';

// Cenários BDD: docs/bdd/paginas-institucionais.feature.md (tag @e2e). O nome de cada test() é o do
// cenário. Roda só na CI (D-09), nos projetos `chromium` (desktop) e `mobile` (Pixel 7).

type Pagina = { rota: string; titulo: string; linkDoRodape: string; aba: string };

const SOBRE: Pagina = {
  rota: '/sobre',
  titulo: 'Sobre o clã',
  linkDoRodape: 'Sobre o clã',
  aba: 'Sobre o clã | Blog No Law',
};
const REGRAS: Pagina = {
  rota: '/regras',
  titulo: 'Regras',
  linkDoRodape: 'Regras',
  aba: 'Regras | Blog No Law',
};
const PRIVACIDADE: Pagina = {
  rota: '/privacidade',
  titulo: 'Política de Privacidade',
  linkDoRodape: 'Privacidade',
  aba: 'Política de Privacidade | Blog No Law',
};

const LARGURA_MAXIMA_DO_CARD = 760;

// Parte de `/`, segue o link do rodapé e confere o essencial da página de leitura.
async function abrirPeloRodape(page: Page, pagina: Pagina): Promise<void> {
  await page.goto('/');
  await page
    .getByRole('contentinfo')
    .getByRole('navigation', { name: 'Rodapé' })
    .getByRole('link', { name: pagina.linkDoRodape })
    .click();

  await expect(page).toHaveURL(pagina.rota);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(pagina.titulo);
  await expect(page).toHaveTitle(pagina.aba);
}

// Abre a rota (status 200) em cada tema, numa página nova, e roda o axe.
async function semViolacoesNosDoisTemas(context: BrowserContext, pagina: Pagina): Promise<void> {
  for (const tema of TEMAS) {
    const nova = await context.newPage();
    await comTema(nova, tema);
    const resposta = await nova.goto(pagina.rota);
    expect(resposta?.status(), `${pagina.rota} no tema ${tema}`).toBe(200);
    await expect(nova.locator('html')).toHaveAttribute('data-theme', tema);
    await expectNoAxeViolations(nova);
    await nova.close();
  }
}

test('@e2e Ler Sobre o clã', async ({ page, context }) => {
  await abrirPeloRodape(page, SOBRE);

  await expect(page.getByRole('article')).toBeVisible();
  await expect(page.getByRole('article').locator('svg[viewBox="0 0 300 10"]')).toHaveCount(1);

  await semViolacoesNosDoisTemas(context, SOBRE);
});

test('@e2e Ler as Regras do clã', async ({ page, context }) => {
  await abrirPeloRodape(page, REGRAS);

  await expect(page.getByRole('article')).toBeVisible();

  await semViolacoesNosDoisTemas(context, REGRAS);
});

test('@e2e Ler a Política de Privacidade sem juridiquês', async ({ page, context }) => {
  await abrirPeloRodape(page, PRIVACIDADE);

  await expect(page.getByRole('heading', { level: 2, name: 'O que o site guarda' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'O que o site não faz' })).toBeVisible();
  await expect(page.getByRole('article').getByRole('listitem')).toHaveCount(3);

  const texto = await page.locator('#conteudo').innerText();
  expect(/lgpd/i.test(texto), 'o texto visível cita LGPD').toBe(false);
  expect(/cookie/i.test(texto), 'o texto visível cita cookie').toBe(false);

  await semViolacoesNosDoisTemas(context, PRIVACIDADE);
});

test('@e2e Páginas de leitura cabem no celular', async ({ page, isMobile }) => {
  for (const pagina of [SOBRE, REGRAS, PRIVACIDADE]) {
    if (isMobile) {
      await page.setViewportSize({ width: 320, height: 640 });
    }
    await page.goto(pagina.rota);

    if (isMobile) {
      const medidas = await page.evaluate(() => ({
        rolagem: document.documentElement.scrollWidth,
        janela: window.innerWidth,
      }));
      expect(medidas.rolagem, `${pagina.rota} rola na horizontal em 320px`).toBeLessThanOrEqual(
        medidas.janela,
      );
    } else {
      const caixa = await page.getByRole('article').boundingBox();
      expect(caixa?.width ?? Infinity, `${pagina.rota}: largura do card`).toBeLessThanOrEqual(
        LARGURA_MAXIMA_DO_CARD,
      );
    }
  }
});
