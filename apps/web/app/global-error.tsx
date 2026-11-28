'use client';

import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';
import { useEffect } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { body, title } from '@/lib/fonts';
import { THEME_INIT_SCRIPT } from '@/lib/theme';
import './globals.css';

// Último recurso do App Router: erro que escapa do layout raiz. Como o layout não envolve esta
// tela, ela traz por conta própria o documento, os estilos, as fontes e o tema (Pitfall 2).
// Repassa o erro ao SDK (no-op sem DSN) e mostra o mesmo card central da 404, sem detalhe
// técnico para o visitante: nem `error.message`, nem `digest`, nem a pilha (T-02-07).
// Sem `metadata` (client component): o título vem do <title> do React.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html
      lang="pt-BR"
      data-theme="dark"
      className={`${body.variable} ${title.variable}`}
      suppressHydrationWarning
    >
      <head>
        <title>Algo deu errado | Blog No Law</title>
        <script>{THEME_INIT_SCRIPT}</script>
      </head>
      <body>
        <main className="mx-auto max-w-288 px-4 py-12 md:px-8">
          <Card className="mx-auto max-w-190">
            <CardContent className="flex flex-col items-center gap-6 text-center">
              <h1 className="text-display text-balance">Algo deu errado</h1>
              <p className="text-body">
                Tivemos um problema do nosso lado. Tente de novo em instantes.
              </p>
              <Link href="/" className={buttonVariants({ variant: 'primary' })}>
                Voltar para a página inicial
              </Link>
            </CardContent>
          </Card>
        </main>
      </body>
    </html>
  );
}
