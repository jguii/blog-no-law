import { describe, expect, it } from 'vitest';
import { cn } from './utils';

function tokens(value: string): string[] {
  return value.split(/\s+/).filter(Boolean);
}

describe('cn', () => {
  it('mantém text-display e text-foreground juntos (tamanho e cor são grupos diferentes)', () => {
    expect(tokens(cn('text-display', 'text-foreground'))).toEqual(
      expect.arrayContaining(['text-display', 'text-foreground']),
    );
  });

  it('mantém font-display e font-bold juntos (família e peso são grupos diferentes)', () => {
    expect(tokens(cn('font-display', 'font-bold'))).toEqual(
      expect.arrayContaining(['font-display', 'font-bold']),
    );
  });

  it('mantém bg-brand-button e bg-card juntos (imagem e cor de fundo são grupos diferentes)', () => {
    expect(tokens(cn('bg-brand-button', 'bg-card'))).toEqual(
      expect.arrayContaining(['bg-brand-button', 'bg-card']),
    );
  });

  it('mantém shadow-botao e shadow-folha como sombras do clã', () => {
    expect(cn('shadow-botao', 'shadow-folha')).toBe('shadow-folha');
  });

  it('o último utilitário de tamanho do clã vence o anterior', () => {
    expect(cn('text-label', 'text-heading')).toBe('text-heading');
  });

  it('resolve conflito comum do Tailwind: px-4 vence px-2', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('ignora valores falsos', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });
});
