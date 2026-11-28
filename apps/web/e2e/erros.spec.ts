import { expect, test } from '@playwright/test';
import { TEMAS, comTema, expectNoAxeViolations } from './helpers';

// Cenários BDD: docs/bdd/erros.feature.md (tag @e2e). O nome de cada test() é o do cenário.
// Roda só na CI (D-09), contra o web compilado (`next start`). O erro global não tem E2E: não há
// como provocar uma exceção fora do layout raiz num build de produção, então ele fica no @unit.

test('@e2e Endereço inexistente mostra a 404 do clã', async ({ page }) => {
  for (const tema of TEMAS) {
    await comTema(page, tema);

    const resposta = await page.goto('/nao-existe');

    expect(resposta?.status()).toBe(404);
    await expect(page.locator('html')).toHaveAttribute('data-theme', tema);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Página não encontrada' }),
    ).toBeVisible();
    await expectNoAxeViolations(page);
  }

  await page.getByRole('link', { name: 'Voltar para o início' }).click();

  await expect(page).toHaveURL('/');
});
