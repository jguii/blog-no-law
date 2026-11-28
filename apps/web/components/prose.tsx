import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ProseProps = {
  children: ReactNode;
  className?: string;
};

// Tipografia das páginas de texto, escrita à mão (sem @tailwindcss/typography, D-23): coluna de até
// 664px no tamanho Body, 16px entre blocos e as regras de h2, listas e links. `wrap-anywhere`
// (overflow-wrap: anywhere) quebra palavras e endereços longos, então nada rola na horizontal em 320px.
const ESTILO = [
  'max-w-166 text-body text-pretty wrap-anywhere',
  '[&>*+*]:mt-4 [&_p+p]:mt-4',
  '[&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:font-display',
  '[&_ul]:list-disc [&_ul]:pl-6 [&_ul>li+li]:mt-2',
  '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol>li+li]:mt-2',
  '[&_a]:text-link [&_a]:underline [&_a]:underline-offset-4',
].join(' ');

export function Prose({ children, className }: ProseProps) {
  return <div className={cn(ESTILO, className)}>{children}</div>;
}
