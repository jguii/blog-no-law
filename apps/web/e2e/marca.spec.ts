import { expect, test, type Page } from '@playwright/test';

// Cenários BDD: docs/bdd/marca.feature.md (tag @e2e). O nome de cada test() é o do cenário.
// Roda só na CI (D-09), contra o web compilado (`next start`).

const OG_ALT = 'No Law: emblema dos dragões e o slogan “Uma nova face, uma nova história.”';

// O `href` de um ícone pode vir relativo ou absoluto (com `metadataBase`); o servidor de teste só
// atende o próprio host, então a requisição usa o caminho e a query, relativos ao `baseURL`.
function caminhoNoServidor(href: string, pagina: Page): string {
  const url = new URL(href, pagina.url());
  return `${url.pathname}${url.search}`;
}

async function metaContent(page: Page, property: string): Promise<string> {
  const content = await page.locator(`meta[property="${property}"]`).getAttribute('content');
  expect(content, `meta ${property} ausente`).not.toBeNull();
  return content ?? '';
}

test('@e2e Favicon dos dragões na aba', async ({ page }) => {
  await page.goto('/');

  const hrefs = await page
    .locator('link[rel="icon"], link[rel="apple-touch-icon"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));
  expect(hrefs.length).toBeGreaterThan(0);
  expect(await page.locator('link[rel="apple-touch-icon"]').count()).toBe(1);

  for (const href of hrefs) {
    const resposta = await page.request.get(caminhoNoServidor(href, page));
    expect(resposta.status(), href).toBe(200);
    expect(resposta.headers()['content-type'], href).toMatch(/^image\//);
  }
});

test('@e2e Preview do link com a imagem do clã', async ({ page }) => {
  await page.goto('/');

  const imagem = await metaContent(page, 'og:image');
  expect(imagem.startsWith('https://')).toBe(true);

  const resposta = await page.request.get(caminhoNoServidor(imagem, page));
  expect(resposta.status()).toBe(200);
  expect(resposta.headers()['content-type']).toContain('image/jpeg');

  expect(await metaContent(page, 'og:image:width')).toBe('1200');
  expect(await metaContent(page, 'og:image:height')).toBe('630');
  expect(await metaContent(page, 'og:image:alt')).toBe(OG_ALT);
});

test('@e2e Ícone do app no manifesto', async ({ page }) => {
  await page.goto('/');

  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href, 'link[rel="manifest"] ausente').not.toBeNull();

  const resposta = await page.request.get(caminhoNoServidor(href ?? '', page));
  expect(resposta.status()).toBe(200);
  const manifesto = (await resposta.json()) as { icons?: { src: string; sizes: string }[] };

  const icone512 = (manifesto.icons ?? []).find((icone) => icone.sizes === '512x512');
  expect(icone512, 'o manifesto declara o ícone de 512').toBeDefined();

  const icone = await page.request.get(caminhoNoServidor(icone512?.src ?? '', page));
  expect(icone.status()).toBe(200);
  expect(icone.headers()['content-type']).toContain('image/png');
});
