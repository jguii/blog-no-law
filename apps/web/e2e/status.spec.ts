import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './helpers';

// Cenários BDD: docs/bdd/status.feature.md (tag @e2e). O nome de cada test() é o do cenário.
// Roda só na CI (D-09), contra a API compilada, o web (`next start`) e um Postgres real.

test('@e2e API e banco no ar', async ({ page }) => {
  await page.goto('/status');

  await expect(page.getByRole('heading', { level: 1, name: 'Status do serviço' })).toBeVisible();
  await expect(page.getByTestId('api-commit')).toHaveText('e2e-sha');
  await expect(page.getByTestId('api-db')).toHaveText('up');

  await expectNoAxeViolations(page);
});

test('@e2e Ver detalhes', async ({ page }) => {
  await page.goto('/status');

  await page.getByRole('link', { name: 'Ver detalhes' }).click();

  await expect(page).toHaveURL('/status?detail=full');
  await expect(page.getByTestId('api-db-latency')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ocultar detalhes' })).toHaveAttribute(
    'href',
    '/status',
  );

  await expectNoAxeViolations(page);
});

// Segundo servidor do web, apontado para uma porta fechada (playwright.config.ts): a API "caiu".
const DEGRADED_URL = 'http://127.0.0.1:3202/status';

test('@e2e API indisponível', async ({ page }) => {
  const response = await page.goto(DEGRADED_URL);

  // O status degrada com 200; nunca 500 (D-03).
  expect(response?.status()).toBe(200);
  await expect(page.getByTestId('api-unavailable')).toBeVisible();
  await expect(page.getByTestId('api-unavailable')).toHaveText('API indisponível no momento');
  await expect(
    page.getByText('A API pode estar iniciando; tente de novo em alguns minutos.'),
  ).toBeVisible();

  await expectNoAxeViolations(page);
});

test('@e2e Recarregar status', async ({ page }) => {
  await page.goto(DEGRADED_URL);

  const recarregar = page.getByRole('link', { name: 'Recarregar status' });
  await expect(recarregar).toHaveAttribute('href', '/status');

  await recarregar.click();

  await expect(page).toHaveURL(DEGRADED_URL);
  await expect(page.getByTestId('api-unavailable')).toBeVisible();
});
