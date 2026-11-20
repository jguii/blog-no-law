import pg from 'pg';
import { describe, expect, inject, it } from 'vitest';

// SQLSTATE do erro, ou 'sem erro' se a consulta deu certo. Comparar só o código
// mantém a mensagem de falha em uma linha.
async function sqlState(query: Promise<unknown>): Promise<string> {
  try {
    await query;
    return 'sem erro';
  } catch (error) {
    return (error as { code?: string }).code ?? 'sem codigo';
  }
}

async function withClient<T>(url: string, run: (client: pg.Client) => Promise<T>): Promise<T> {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

describe('RLS e papéis do banco (SEC-04)', () => {
  it('como anon, SELECT em heartbeat falha com 42501', async () => {
    const state = await withClient(inject('adminDbUrl'), async (client) => {
      await client.query('BEGIN');
      try {
        await client.query('SET LOCAL ROLE anon');
        // Sem isto, um SET ROLE negado (também 42501) faria o teste passar sem provar nada.
        const who = await client.query('SELECT current_user AS name');
        expect(who.rows[0].name).toBe('anon');
        return await sqlState(client.query('SELECT * FROM heartbeat'));
      } finally {
        await client.query('ROLLBACK');
      }
    });
    expect(state).toBe('42501');
  });

  it('como app_api, SELECT em heartbeat devolve id = 1', async () => {
    const ids = await withClient(inject('appApiUrl'), async (client) => {
      const result = await client.query('SELECT id FROM heartbeat');
      return result.rows.map((row) => row.id);
    });
    expect(ids.join(',')).toBe('1');
  });
});
