import Link from 'next/link';
import { getStatus } from '../lib/api';

// A home é montada a cada requisição: o status da API muda o tempo todo.
export const dynamic = 'force-dynamic';

interface HomeProps {
  searchParams: Promise<{ detail?: string | string[] }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const detail = params.detail === 'full' ? 'full' : 'basic';
  const result = await getStatus(detail);

  if (!result.ok) {
    return (
      <div>
        <h1>Blog No Law</h1>
        <p role="status" data-testid="api-unavailable">
          API indisponível no momento
        </p>
      </div>
    );
  }

  const { service, version, commit, db, time, dbLatencyMs } = result.data;

  return (
    <div>
      <h1>Blog No Law</h1>
      <dl>
        <dt>Serviço</dt>
        <dd>{service}</dd>
        <dt>Versão</dt>
        <dd>{version}</dd>
        <dt>Commit</dt>
        <dd>
          <code data-testid="api-commit">{commit}</code>
        </dd>
        <dt>Banco</dt>
        <dd data-testid="api-db">{db}</dd>
        <dt>Horário</dt>
        <dd data-testid="api-time">{time}</dd>
        {dbLatencyMs !== undefined && (
          <>
            <dt>Latência do banco</dt>
            <dd data-testid="api-db-latency">{dbLatencyMs} ms</dd>
          </>
        )}
      </dl>
      {detail === 'full' ? (
        <Link href="/">Ocultar detalhes</Link>
      ) : (
        <Link href="/?detail=full">Ver detalhes</Link>
      )}
    </div>
  );
}
