import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';
import { THEME_KEY } from '../lib/theme';

// Ajudantes compartilhados pelos E2E da fase de identidade visual (o `status.spec.ts` e os demais
// usam este módulo em vez de manter cada um a sua cópia do helper do axe).

export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

// Falha listando o `id` de cada violação do axe, para o log da CI dizer o que corrigir.
export async function expectNoAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(
    results.violations.map((violation) => violation.id),
    'violações de acessibilidade (WCAG 2.1 A/AA) encontradas pelo axe',
  ).toEqual([]);
}

export const TEMAS = ['dark', 'light'] as const;
export type Tema = (typeof TEMAS)[number];

// Grava a escolha de tema no armazenamento antes de qualquer navegação, como se o visitante já a
// tivesse feito. É mais estável que clicar no botão e rodar o axe logo depois, durante a transição
// de cores (Pitfall 5). Vale para toda navegação seguinte da página, inclusive recargas.
export async function comTema(page: Page, tema: Tema): Promise<void> {
  await page.addInitScript(
    ([chave, valor]) => {
      localStorage.setItem(chave, valor);
    },
    [THEME_KEY, tema] as const,
  );
}
