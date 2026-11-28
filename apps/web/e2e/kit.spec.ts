import { expect, test } from '@playwright/test';
import { TEMAS, comTema, expectNoAxeViolations } from './helpers';

// Cenários BDD: docs/bdd/kit.feature.md (tag @e2e). O nome de cada test() é o do cenário.
// Roda só na CI (D-09), contra o web compilado (`next start`).

const SECOES = [
  'Cores',
  'Tipografia',
  'Espaçamento',
  'Botões',
  'Link em texto',
  'Card',
  'Item de menu',
  'Menu sanduíche',
  'Botão de tema',
  'Ornamentos',
];

test('@e2e Kit mostra tokens e componentes', async ({ context }, testInfo) => {
  for (const tema of TEMAS) {
    // Uma aba por tema, com o tema gravado antes de navegar (mesmo padrão do tema.spec.ts).
    const aba = await context.newPage();
    await aba.emulateMedia({ reducedMotion: 'reduce' });
    await comTema(aba, tema);

    await aba.goto('/kit');
    await expect(aba.locator('html')).toHaveAttribute('data-theme', tema);
    await expect(aba.getByRole('heading', { level: 1, name: 'Kit de identidade' })).toBeVisible();

    const titulos = await aba.getByRole('heading', { level: 2 }).allTextContents();
    expect(titulos).toEqual(SECOES);

    // A pré-visualização do menu (dentro do <main>) não repete o id nem o nav do menu real do topo.
    await expect(aba.locator('main #menu-principal')).toHaveCount(0);
    await expect(aba.locator('main nav')).toHaveCount(0);
    await expect(aba.locator('#menu-principal')).toHaveCount(1);

    if (testInfo.project.name === 'mobile') {
      const sobra = await aba.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(sobra, 'rolagem horizontal no celular').toBeLessThanOrEqual(0);
    }

    await expectNoAxeViolations(aba);
    await aba.close();
  }
});

test('@e2e Kit e status fora dos buscadores', async ({ page }) => {
  for (const rota of ['/kit', '/status']) {
    const resposta = await page.goto(rota);

    expect(resposta?.headers()['x-robots-tag'] ?? '', rota).toContain('noindex');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    );
  }

  // O kit fica fora do menu e do rodapé.
  await page.goto('/');
  await expect(page.locator('a[href="/kit"]')).toHaveCount(0);
});

test('@e2e Toda página sai com os cabeçalhos de segurança', async ({ page }) => {
  const resposta = await page.goto('/');
  const cabecalhos = resposta?.headers() ?? {};

  const csp = cabecalhos['content-security-policy'] ?? '';
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("font-src 'self'");
  expect(csp).not.toContain('unsafe-eval');
  expect(csp).not.toContain('*');
  expect(cabecalhos['x-frame-options']).toBe('DENY');
  expect(cabecalhos['x-content-type-options']).toBe('nosniff');
});
