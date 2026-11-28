import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { THEME_INIT_SCRIPT } from '@/lib/theme';
import './globals.css';

export const metadata: Metadata = {
  title: 'Blog No Law',
};

// O layout não lê cookies nem cabeçalhos da requisição: as rotas sem dado continuam estáticas.
// O servidor sempre emite o tema escuro; o script do <head> troca para o claro antes da primeira
// pintura se o visitante tiver escolhido (por isso o suppressHydrationWarning no <html>).
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="dark" suppressHydrationWarning>
      <head>
        <script>{THEME_INIT_SCRIPT}</script>
      </head>
      <body>{children}</body>
    </html>
  );
}
