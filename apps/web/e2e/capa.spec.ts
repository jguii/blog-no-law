import { expect, test, type Page } from '@playwright/test';
import { comTema, expectNoAxeViolations, TEMAS } from './helpers';

// Cenários BDD: docs/bdd/capa.feature.md (tag @e2e). O nome de cada test() é o do cenário.
// Roda só na CI (D-09), nos projetos `chromium` (desktop) e `mobile` (Pixel 7). O padrão do
// Playwright aqui é `reducedMotion: 'reduce'`; o cenário das pétalas liga o movimento de volta.

const SLOGAN = 'Uma nova face, uma nova história.';
// Segundo servidor do web, apontado para uma porta fechada (playwright.config.ts): a API "caiu".
const DEGRADED_URL = 'http://127.0.0.1:3202/';

// As pétalas ficam num contêiner `aria-hidden` que é o primeiro filho da seção da capa.
const PETALAS = 'section[aria-labelledby="titulo-capa"] > div[aria-hidden="true"] > span';

function petalasVisiveis(page: Page) {
  return page.locator(PETALAS).locator('visible=true');
}

test('@e2e Capa do clã', async ({ context }) => {
  // Uma aba nova por tema: o `comTema` grava o tema num script de inicialização que vale para a aba toda.
  for (const tema of TEMAS) {
    const page = await context.newPage();
    await comTema(page, tema);
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: SLOGAN })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByText('Clã do SA-MP · desde 2017')).toBeVisible();

    const emblema = page.locator('img[src*="emblema.png"]');
    await expect(emblema).toBeVisible();
    await expect
      .poll(() => emblema.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0);

    const banner = page.getByRole('img', { name: /Banner do clã No Law/ });
    await banner.scrollIntoViewIfNeeded();
    await expect(banner).toBeVisible();
    await expect(page.getByText('Do acervo do clã · o banner')).toBeVisible();

    await expect(page.getByRole('link', { name: 'Conheça o clã' })).toHaveAttribute(
      'href',
      '/sobre',
    );
    await expect(page.getByRole('link', { name: 'Leia as regras' })).toHaveAttribute(
      'href',
      '/regras',
    );

    await expectNoAxeViolations(page);

    await page.getByRole('link', { name: 'Conheça o clã' }).click();
    await expect(page).toHaveURL('/sobre');
    await page.goBack();
    await page.getByRole('link', { name: 'Leia as regras' }).click();
    await expect(page).toHaveURL('/regras');

    await page.close();
  }
});

test('@e2e Capa abre mesmo com a API fora', async ({ page }) => {
  const response = await page.goto(DEGRADED_URL);

  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1, name: SLOGAN })).toBeVisible();
  await expect(page.getByTestId('api-unavailable')).toHaveCount(0);
});

test.describe('pétalas com movimento ligado', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('@e2e Pétalas só na capa', async ({ page, isMobile }) => {
    await page.goto('/');
    await expect(page.locator(PETALAS)).toHaveCount(6);
    await expect(petalasVisiveis(page)).toHaveCount(isMobile ? 3 : 6);

    // O contêiner é decorativo e não pega clique nem foco.
    const camada = page.locator(PETALAS).first().locator('..');
    await expect(camada).toHaveAttribute('aria-hidden', 'true');
    await expect(camada).toHaveCSS('pointer-events', 'none');

    await page.goto('/sobre');
    await expect(page.locator('[class*="petala"]')).toHaveCount(0);
  });
});

test('@e2e Movimento reduzido desliga pétalas e brilho', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator(PETALAS)).toHaveCount(6);
  await expect(petalasVisiveis(page)).toHaveCount(0);

  const brilho = page.locator('.animate-brilho');
  await expect(brilho).toHaveCount(1);
  await expect(brilho).toHaveCSS('animation-name', 'none');
});

test('@e2e Capa cabe no celular', async ({ context, isMobile }) => {
  test.skip(!isMobile, 'a largura do celular só é conferida no projeto mobile');

  for (const tema of TEMAS) {
    const page = await context.newPage();
    await comTema(page, tema);
    for (const largura of [320, 375, 412]) {
      await page.setViewportSize({ width: largura, height: 800 });
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1, name: SLOGAN })).toBeVisible();

      const { rolagem, janela } = await page.evaluate(() => ({
        rolagem: document.documentElement.scrollWidth,
        janela: window.innerWidth,
      }));
      expect(rolagem, `rolagem horizontal a ${largura}px no tema ${tema}`).toBeLessThanOrEqual(
        janela,
      );
    }
    await page.close();
  }
});
