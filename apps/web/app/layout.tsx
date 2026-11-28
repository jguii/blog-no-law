import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { body, title } from '@/lib/fonts';
import { siteMetadata, siteViewport } from '@/lib/site';
import { THEME_INIT_SCRIPT } from '@/lib/theme';
import './globals.css';

export const metadata: Metadata = siteMetadata;
export const viewport: Viewport = siteViewport;

// O layout não lê cookies nem cabeçalhos da requisição: as rotas sem dado continuam estáticas.
// O servidor sempre emite o tema escuro; o script do <head> troca para o claro antes da primeira
// pintura se o visitante tiver escolhido (por isso o suppressHydrationWarning no <html>).
// O link de atalho é o primeiro item da tabulação e só aparece quando recebe o foco.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pt-BR"
      data-theme="dark"
      className={`${body.variable} ${title.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script>{THEME_INIT_SCRIPT}</script>
      </head>
      <body>
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-sm focus:bg-primary focus:px-4 focus:py-3 focus:text-white"
        >
          Pular para o conteúdo
        </a>
        <SiteHeader />
        <main id="conteudo">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
