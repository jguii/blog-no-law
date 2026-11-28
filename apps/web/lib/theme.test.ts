import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { THEME_INIT_SCRIPT, THEME_KEY, resolveTheme } from './theme';

// Roda o script anti-flash num contexto isolado, sem navegador. Devolve todos os atributos gravados
// no <html> e quantas vezes o script tentou gravar (para provar que o valor cru nunca vai ao DOM).
function runInit(getItem: () => string | null): { theme: string; writes: string[] } {
  const writes: string[] = [];
  vm.runInNewContext(THEME_INIT_SCRIPT, {
    localStorage: { getItem },
    document: {
      documentElement: {
        setAttribute: (name: string, value: string) => {
          if (name === 'data-theme') writes.push(value);
        },
      },
    },
  });
  return { theme: writes.at(-1) ?? '', writes };
}

describe('resolveTheme', () => {
  it.each([[null], [undefined], [''], ['Dark'], ['LIGHT'], ['"><x>'], [' light']])(
    'devolve dark para %j',
    (stored) => {
      expect(resolveTheme(stored)).toBe('dark');
    },
  );

  it('devolve light só para a string exata light', () => {
    expect(resolveTheme('light')).toBe('light');
  });

  it('devolve dark para a string exata dark', () => {
    expect(resolveTheme('dark')).toBe('dark');
  });
});

describe('THEME_INIT_SCRIPT', () => {
  it('grava dark quando não há preferência salva', () => {
    expect(runInit(() => null).theme).toBe('dark');
  });

  it('grava light quando a preferência salva é light', () => {
    expect(runInit(() => 'light').theme).toBe('light');
  });

  it('ignora um valor com marcação e grava dark', () => {
    expect(runInit(() => '"><x>').theme).toBe('dark');
  });

  it('ignora um valor com caixa diferente e grava dark', () => {
    expect(runInit(() => 'Dark').theme).toBe('dark');
  });

  it('não lança e só aceita o dark padrão se o storage lançar erro', () => {
    const run = () =>
      runInit(() => {
        throw new Error('storage bloqueado');
      });
    expect(run).not.toThrow();
    expect(run().writes.every((value) => value === 'dark')).toBe(true);
  });

  it('nunca grava o valor cru do storage no DOM', () => {
    const { writes } = runInit(() => '"><script>alert(1)</script>');
    expect(writes.every((value) => value === 'dark' || value === 'light')).toBe(true);
  });

  it('usa a chave nl-theme', () => {
    expect(THEME_KEY).toBe('nl-theme');
    expect(THEME_INIT_SCRIPT).toContain('nl-theme');
  });

  it('não contém marcação que feche o script nem o caractere <', () => {
    expect(THEME_INIT_SCRIPT).not.toContain('</script');
    expect(THEME_INIT_SCRIPT).not.toContain('<');
  });

  it('é uma constante: o mesmo texto em duas importações', async () => {
    const outra = await import('./theme');
    expect(outra.THEME_INIT_SCRIPT).toBe(THEME_INIT_SCRIPT);
  });
});
