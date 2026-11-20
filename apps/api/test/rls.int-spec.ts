import pg from 'pg';
import { describe, expect, inject, it } from 'vitest';
import { prepareTestDb } from '../scripts/prepare-test-db.mjs';

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

// Mesma URL do servidor, apontando para o banco de manutenção (para DROP DATABASE).
function maintenanceUrl(adminDbUrl: string): string {
  const url = new URL(adminDbUrl);
  url.pathname = '/postgres';
  return url.toString();
}

describe('RLS e papéis do banco (SEC-04)', () => {
  describe('acesso pela Data API (papéis anon e authenticated)', () => {
    it.each(['anon', 'authenticated'])('como %s, SELECT em heartbeat falha com 42501', async (role) => {
      const state = await withClient(inject('adminDbUrl'), async (client) => {
        await client.query('BEGIN');
        try {
          await client.query(`SET LOCAL ROLE ${role}`);
          // Sem isto, um SET ROLE negado (também 42501) faria o teste passar sem provar nada.
          const who = await client.query('SELECT current_user AS name');
          expect(who.rows[0].name).toBe(role);
          return await sqlState(client.query('SELECT * FROM heartbeat'));
        } finally {
          await client.query('ROLLBACK');
        }
      });
      expect(state).toBe('42501');
    });

    it('anon, authenticated e service_role não têm nenhum privilégio em heartbeat e _prisma_migrations', async () => {
      const result = await withClient(inject('adminDbUrl'), (client) =>
        client.query(
          `SELECT r.role, p.priv, t.tbl
             FROM unnest(ARRAY['anon', 'authenticated', 'service_role']) AS r(role),
                  unnest(ARRAY['heartbeat', '_prisma_migrations']) AS t(tbl),
                  unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE']) AS p(priv)
            WHERE has_table_privilege(r.role, 'public.' || t.tbl, p.priv)`,
        ),
      );
      const granted = result.rows.map((row) => `${row.role} ${row.priv} em ${row.tbl}`);
      expect(granted.join(', ')).toBe('');
    });
  });

  describe('RLS em todas as tabelas de public', () => {
    it('toda tabela de public tem RLS ativo (inclusive _prisma_migrations)', async () => {
      const result = await withClient(inject('adminDbUrl'), (client) =>
        client.query(
          `SELECT c.relname, c.relrowsecurity
             FROM pg_class c
             JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
            ORDER BY c.relname`,
        ),
      );
      const names = result.rows.map((row) => row.relname);
      // Garante que a checagem não é vazia: as duas tabelas conhecidas precisam aparecer.
      expect(names.includes('heartbeat')).toBe(true);
      expect(names.includes('_prisma_migrations')).toBe(true);
      for (const table of result.rows) {
        expect(table.relrowsecurity, `RLS desligado na tabela ${table.relname}`).toBe(true);
      }
    });
  });

  describe('papel app_api', () => {
    it('tem login e nenhum privilégio de administração', async () => {
      const result = await withClient(inject('adminDbUrl'), (client) =>
        client.query(
          `SELECT rolcanlogin, rolsuper, rolbypassrls, rolcreatedb, rolcreaterole
             FROM pg_roles WHERE rolname = 'app_api'`,
        ),
      );
      const row = result.rows[0];
      expect(row, 'papel app_api não existe').toBeDefined();
      const flags = `login=${row.rolcanlogin} super=${row.rolsuper} bypassrls=${row.rolbypassrls} createdb=${row.rolcreatedb} createrole=${row.rolcreaterole}`;
      expect(flags).toBe('login=true super=false bypassrls=false createdb=false createrole=false');
    });

    it('não é dono de nenhuma tabela de public', async () => {
      const result = await withClient(inject('adminDbUrl'), (client) =>
        client.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tableowner = 'app_api'`),
      );
      expect(result.rows.map((row) => row.tablename).join(', ')).toBe('');
    });

    it('SELECT em heartbeat devolve id = 1', async () => {
      const ids = await withClient(inject('appApiUrl'), async (client) => {
        const result = await client.query('SELECT id FROM heartbeat');
        return result.rows.map((row) => row.id);
      });
      expect(ids.join(',')).toBe('1');
    });

    it('UPDATE e INSERT em heartbeat falham com 42501', async () => {
      const states = await withClient(inject('appApiUrl'), async (client) => {
        const update = await sqlState(client.query('UPDATE heartbeat SET beat_at = now()'));
        const insert = await sqlState(client.query('INSERT INTO heartbeat DEFAULT VALUES'));
        return `update=${update} insert=${insert}`;
      });
      expect(states).toBe('update=42501 insert=42501');
    });

    it('SELECT em _prisma_migrations falha com 42501', async () => {
      const state = await withClient(inject('appApiUrl'), (client) =>
        sqlState(client.query('SELECT * FROM _prisma_migrations')),
      );
      expect(state).toBe('42501');
    });
  });

  describe('preparo do banco de teste', () => {
    it('prepareTestDb duas vezes no mesmo cluster (app_api já existe) termina sem erro', async () => {
      const dbName = 'blog_test_idem';
      const adminDbUrl = inject('adminDbUrl');
      const adminUrl = maintenanceUrl(adminDbUrl);
      try {
        await prepareTestDb({ adminUrl, dbName });
        const second = await prepareTestDb({ adminUrl, dbName });
        // O banco refeito continua com a baseline aplicada: o app_api lê o heartbeat.
        const ids = await withClient(second.appApiUrl, async (client) => {
          const result = await client.query('SELECT id FROM heartbeat');
          return result.rows.map((row) => row.id);
        });
        expect(ids.join(',')).toBe('1');
      } finally {
        await withClient(adminUrl, (client) => client.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`));
      }
    });
  });
});
