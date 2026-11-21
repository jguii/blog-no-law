'use client';

import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';
import { useEffect } from 'react';

// Último recurso do App Router: erro que escapa do layout raiz. Só repassa o erro ao SDK
// (no-op sem DSN) e mostra uma página mínima, sem detalhe técnico para o visitante.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <main>
          <h1>Algo deu errado</h1>
          <Link href="/">Voltar para a página inicial</Link>
        </main>
      </body>
    </html>
  );
}
