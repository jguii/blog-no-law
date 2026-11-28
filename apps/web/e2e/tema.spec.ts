import { expect, test } from '@playwright/test';
import { THEME_KEY } from '../lib/theme';
import { TEMAS, comTema, expectNoAxeViolations } from './helpers';

// Cenários BDD: docs/bdd/tema.feature.md (tag @e2e). O nome de cada test() é o do cenário.
// Roda só na CI (D-09), contra o web compilado (`next start`).

test('@e2e Primeira visita abre no tema escuro', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('button', { name: 'Mudar para tema claro' })).toBeVisible();
});

test('@e2e Trocar para o tema claro e a escolha persiste', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Mudar para tema claro' }).click();

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByRole('button', { name: 'Mudar para tema escuro' })).toBeVisible();
  expect(await page.evaluate((chave) => localStorage.getItem(chave), THEME_KEY)).toBe('light');

  await page.reload();

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('@e2e Tema salvo aplicado antes de hidratar', async ({ page }) => {
  await comTema(page, 'light');
  // Bloqueia os scripts do Next: a página nunca hidrata, então só o script do <head> pode trocar o tema.
  await page.route('**/_next/static/**/*.js', (route) => route.abort());

  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('@e2e Valor estranho no armazenamento cai no escuro', async ({ page }) => {
  await page.addInitScript((chave) => {
    localStorage.setItem(chave, 'Dark');
  }, THEME_KEY);

  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('@e2e Contraste AA nos dois temas', async ({ context }) => {
  for (const tema of TEMAS) {
    // Uma aba por tema, com o tema gravado antes de navegar. Movimento reduzido: sem transição de
    // cor no meio da análise (Pitfall 5), o axe lê só valores finais.
    const aba = await context.newPage();
    await aba.emulateMedia({ reducedMotion: 'reduce' });
    await comTema(aba, tema);

    await aba.goto('/');
    await expect(aba.locator('html')).toHaveAttribute('data-theme', tema);
    await expectNoAxeViolations(aba);

    await aba.close();
  }
});
