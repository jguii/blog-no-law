import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Sem registrar os utilitários próprios do clã (definidos em app/globals.css), o tailwind-merge
// trata `text-display` como uma cor de texto e descarta um dos dois em
// `cn('text-display', 'text-foreground')`. Cada utilitário entra no grupo certo: assim ele
// conflita só com o que é do mesmo tipo (tamanho com tamanho, sombra com sombra).
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['label', 'body', 'heading', 'display'] }],
      'font-family': [{ font: ['display', 'sans'] }],
      'bg-image': [{ bg: ['brand', 'brand-button'] }],
      shadow: [{ shadow: ['folha', 'botao'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
