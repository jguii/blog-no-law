import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './helpers';

// Cenários BDD: docs/bdd/navegacao.feature.md (tag @e2e). O nome de cada test() é o do cenário.
// Roda só na CI (D-09), nos projetos `chromium` (desktop) e `mobile` (Pixel 7). A fixture `isMobile`
// pula o que não vale no projeto: o ☰ só existe abaixo de 768px e as pílulas só a partir dele.

test('@e2e Menu mostra só o que existe', async ({ page, isMobile }) => {
  test.skip(isMobile, 'as pílulas só existem a partir de 768px');

  await page.goto('/');

  const principal = page.getByRole('navigation', { name: 'Principal' });
  await expect(principal.getByRole('link', { name: 'Início' })).toBeVisible();
  await expect(principal.getByRole('link', { name: 'Sobre o clã' })).toBeVisible();
  await expect(principal.getByRole('link', { name: 'Regras' })).toBeVisible();
  await expect(principal.getByRole('link')).toHaveCount(3);

  await expect(principal.getByRole('link', { name: 'Início' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(principal.getByRole('link', { name: 'Regras' })).not.toHaveAttribute(
    'aria-current',
    'page',
  );

  await expect(page.getByRole('button', { name: 'Mudar para tema claro' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Abrir menu' })).toBeHidden();
  await expect(page.locator('header').getByText(/Explorar|Perfil|Entrar|em breve/)).toHaveCount(0);

  await expectNoAxeViolations(page);
});

test('@e2e Menu sanduíche no celular', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'o ☰ só existe abaixo de 768px');

  await page.goto('/');

  const abrir = page.getByRole('button', { name: 'Abrir menu' });
  const painel = page.locator('#menu-principal');
  await expect(abrir).toBeVisible();
  await expect(abrir).toHaveAttribute('aria-expanded', 'false');
  await expect(abrir).toHaveAttribute('aria-controls', 'menu-principal');
  await expect(painel).toBeHidden();

  // Ordem no celular: o botão de tema vem antes do ☰.
  const caixaTema = await page.getByRole('button', { name: 'Mudar para tema claro' }).boundingBox();
  const caixaMenu = await abrir.boundingBox();
  expect((caixaTema?.x ?? Infinity) < (caixaMenu?.x ?? -Infinity)).toBe(true);

  await abrir.click();

  const fechar = page.getByRole('button', { name: 'Fechar menu' });
  await expect(fechar).toHaveAttribute('aria-expanded', 'true');
  await expect(painel).toBeVisible();

  // O painel abre logo abaixo da faixa: o topo dele encosta na base do <header>.
  const caixaHeader = await page.locator('header').boundingBox();
  const caixaPainel = await painel.boundingBox();
  const baseDoHeader = (caixaHeader?.y ?? 0) + (caixaHeader?.height ?? 0);
  expect(Math.abs((caixaPainel?.y ?? Infinity) - baseDoHeader) <= 1).toBe(true);

  // Tab percorre os itens na ordem; o painel não prende o foco.
  await fechar.focus();
  await page.keyboard.press('Tab');
  await expect(painel.getByRole('link', { name: 'Início' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(painel.getByRole('link', { name: 'Sobre o clã' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(painel.getByRole('link', { name: 'Regras' })).toBeFocused();

  await expectNoAxeViolations(page);

  await painel.getByRole('link', { name: 'Regras' }).click();

  await expect(page).toHaveURL('/regras');
  await expect(page.locator('#menu-principal')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
});

test('@e2e Esc fecha o menu e devolve o foco', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'o ☰ só existe abaixo de 768px');

  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  const painel = page.locator('#menu-principal');
  await expect(painel).toBeVisible();

  await painel.getByRole('link', { name: 'Sobre o clã' }).focus();
  await page.keyboard.press('Escape');

  await expect(painel).toBeHidden();
  await expect(page.getByRole('button', { name: 'Abrir menu' })).toBeFocused();
});

test('@e2e Menu fecha ao alargar a janela', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'parte do celular, com o painel aberto');

  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await expect(page.locator('#menu-principal')).toBeVisible();

  await page.setViewportSize({ width: 1024, height: 768 });

  await expect(page.locator('#menu-principal')).toBeHidden();
  await expect(page.getByRole('button', { name: /menu/ })).toBeHidden();
  await expect(
    page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Início' }),
  ).toBeVisible();

  // Voltando ao celular, o painel não reaparece aberto.
  await page.setViewportSize({ width: 412, height: 915 });
  await expect(page.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
  await expect(page.locator('#menu-principal')).toBeHidden();
});

test('@e2e Pular para o conteúdo', async ({ page }) => {
  await page.goto('/');

  await page.keyboard.press('Tab');

  const atalho = page.getByRole('link', { name: 'Pular para o conteúdo' });
  await expect(atalho).toBeFocused();
  await expect(atalho).toBeVisible();
  await expect(atalho).toHaveAttribute('href', '#conteudo');
});

test('@e2e Rodapé com Sobre, Regras e Privacidade', async ({ page }) => {
  await page.goto('/');

  const rodape = page.getByRole('contentinfo');
  const navegacao = rodape.getByRole('navigation', { name: 'Rodapé' });
  await expect(navegacao.getByRole('link', { name: 'Sobre o clã' })).toHaveAttribute(
    'href',
    '/sobre',
  );
  await expect(navegacao.getByRole('link', { name: 'Regras' })).toHaveAttribute('href', '/regras');
  await expect(navegacao.getByRole('link', { name: 'Privacidade' })).toHaveAttribute(
    'href',
    '/privacidade',
  );
  await expect(rodape.getByText('No Law · desde 2017')).toBeVisible();
  await expect(page.locator('a[href*="discord" i]')).toHaveCount(0);

  await expectNoAxeViolations(page);
});
