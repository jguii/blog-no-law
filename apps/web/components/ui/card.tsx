import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

// Superfície do kit (D-23), adaptada à mão do `card` do registro oficial do shadcn.
// Escuro: contorno de 1px no `--border`; claro: sombra suave de folha de papel.
export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'rounded-md bg-card text-card-foreground dark:border dark:border-border light:shadow-folha',
        className,
      )}
      {...props}
    />
  );
}

// Padding de 48px a partir de 768px e 24px abaixo (escala de espaçamento da UI-SPEC).
export function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('p-6 md:p-12', className)} {...props} />;
}
