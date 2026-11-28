import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { getStatus } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Status do serviço',
  robots: { index: false, follow: false },
};

// O status é montado a cada requisição: o estado da API muda o tempo todo.
export const dynamic = 'force-dynamic';

interface StatusProps {
  searchParams: Promise<{ detail?: string | string[] }>;
}

const LINK_CLASS = 'text-link text-body underline underline-offset-4';

export default async function StatusPage({ searchParams }: StatusProps) {
  const params = await searchParams;
  const detail = params.detail === 'full' ? 'full' : 'basic';
  const result = await getStatus(detail);

  if (!result.ok) {
    return (
      <Card className="mx-auto max-w-190">
        <CardContent className="flex flex-col gap-4">
          <h1 className="text-display text-balance">Status do serviço</h1>
          <p role="status" className="text-body" data-testid="api-unavailable">
            API indisponível no momento
          </p>
          <p className="text-body">A API pode estar iniciando; tente de novo em alguns minutos.</p>
          <Link href="/status" className={LINK_CLASS}>
            Recarregar status
          </Link>
        </CardContent>
      </Card>
    );
  }

  const { service, version, commit, db, time, dbLatencyMs } = result.data;

  return (
    <Card className="mx-auto max-w-190">
      <CardContent className="flex flex-col gap-6">
        <h1 className="text-display text-balance">Status do serviço</h1>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-[max-content_minmax(0,1fr)]">
          <dt className="text-label text-muted-foreground">Serviço</dt>
          <dd className="text-body mb-3 sm:mb-0">{service}</dd>
          <dt className="text-label text-muted-foreground">Versão</dt>
          <dd className="text-body mb-3 sm:mb-0">{version}</dd>
          <dt className="text-label text-muted-foreground">Commit</dt>
          <dd className="text-body mb-3 sm:mb-0">
            <code
              className="text-label font-mono font-normal wrap-anywhere"
              data-testid="api-commit"
            >
              {commit}
            </code>
          </dd>
          <dt className="text-label text-muted-foreground">Banco</dt>
          <dd className="text-body mb-3 sm:mb-0" data-testid="api-db">
            {db}
          </dd>
          <dt className="text-label text-muted-foreground">Horário</dt>
          <dd className="text-body mb-3 wrap-anywhere sm:mb-0" data-testid="api-time">
            {time}
          </dd>
          {dbLatencyMs !== undefined && (
            <>
              <dt className="text-label text-muted-foreground">Latência do banco</dt>
              <dd className="text-body mb-3 sm:mb-0" data-testid="api-db-latency">
                {dbLatencyMs} ms
              </dd>
            </>
          )}
        </dl>
        {detail === 'full' ? (
          <Link href="/status" className={LINK_CLASS}>
            Ocultar detalhes
          </Link>
        ) : (
          <Link href="/status?detail=full" className={LINK_CLASS}>
            Ver detalhes
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
