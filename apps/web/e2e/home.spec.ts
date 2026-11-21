import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Cenários BDD: docs/bdd/home.feature.md (tag @e2e). O nome de cada test() é o do cenário.
// Roda só na CI (D-09), contra a API compilada, o web (`next start`) e um Postgres real.

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

// Falha listando o `id` de cada violação do axe, para o log da CI dizer o que corrigir.
async function expectNoAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(
    results.violations.map((violation) => violation.id),
    'violações de acessibilidade (WCAG 2.1 A/AA) encontradas pelo axe',
  ).toEqual([]);
}

test('@e2e API e banco no ar', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId('api-commit')).toHaveText('e2e-sha');
  await expect(page.getByTestId('api-db')).toHaveText('up');

  await expectNoAxeViolations(page);
});

test('@e2e Ver detalhes', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Ver detalhes' }).click();

  await expect(page).toHaveURL('/?detail=full');
  await expect(page.getByTestId('api-db-latency')).toBeVisible();

  await expectNoAxeViolations(page);
});

// Segundo servidor do web, apontado para uma porta fechada (playwright.config.ts): a API "caiu".
const DEGRADED_URL = 'http://127.0.0.1:3202/';

test('@e2e API indisponível', async ({ page }) => {
  const response = await page.goto(DEGRADED_URL);

  // A home degrada com 200; nunca 500 (D-03).
  expect(response?.status()).toBe(200);
  await expect(page.getByTestId('api-unavailable')).toBeVisible();
  await expect(page.getByTestId('api-unavailable')).toHaveText('API indisponível no momento');

  await expectNoAxeViolations(page);
});
