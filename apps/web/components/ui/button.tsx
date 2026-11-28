import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

// Kit base (D-23): adaptado à mão do `button` do registro oficial do shadcn, sem o primitivo de
// composição e sem pacotes extras. Link com cara de botão = `buttonVariants()` num `next/link`.
// As classes só usam tokens do tema (nada de cor literal), então os dois temas valem sozinhos.
export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 rounded-md text-label font-bold',
    'cursor-pointer transition-[color,background-color,border-color,box-shadow,transform] duration-250',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-brand-button text-primary-foreground',
          'hover:-translate-y-0.5 hover:shadow-botao motion-reduce:hover:transform-none',
        ],
        secondary: 'border-2 border-foreground bg-transparent text-foreground hover:bg-accent',
      },
      size: {
        default: 'h-13 px-6',
        sm: 'h-11 px-4',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
);

export type ButtonProps = ComponentProps<'button'> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = 'button', ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
