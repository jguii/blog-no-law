// Checagem de segurança do banco (SEC-04): RLS em toda tabela de public, atributos do papel `app_api`
// e privilégios de anon, authenticated e service_role. Saída: só linhas `PASS`/`FAIL`/`SKIP`.
//
// Uso (da raiz do repositório, com a CA do Supabase pelo ambiente):
//   NODE_EXTRA_CA_CERTS="$PWD/apps/api/certs/supabase-ca.crt" node apps/api/scripts/verify-db-security.mjs [--as-app]
//
// Variáveis: ENV_FILE (default ~/.config/blog-no-law/production.env) com MIGRATE_DATABASE_URL e,
// para --as-app, DATABASE_URL. O repositório é público: este script nunca imprime URL, usuário com
// senha nem a mensagem crua do driver (só o SQLSTATE ou o código de erro de rede).
import { homedir } from 'node:os';
import { join } from 'node:path';
import { config } from 'dotenv';
import pg from 'pg';

const MIN_MAJOR = 17;
const SUPABASE_ROLES = ['anon', 'authenticated', 'service_role'];
const PROTECTED_TABLES = ['heartbeat', '_prisma_migrations'];
const asApp = process.argv.includes('--as-app');

const envFile = process.env.ENV_FILE ?? join(homedir(), '.config', 'blog-no-law', 'production.env');
config({ path: envFile, quiet: true });

let failed = false;

function report(status, name, detail = '') {
  if (status === 'FAIL') failed = true;
  console.log(`${status} ${name}${detail ? ` ${detail}` : ''}`);
}

// Só o código do erro (SQLSTATE ou código de rede). A mensagem crua pode citar host e usuário.
function errorCode(error) {
  return typeof error?.code === 'string' ? error.code : 'sem_codigo';
}

async function check(name, run) {
  try {
    const result = await run();
    if (result === true) report('PASS', name);
    else report('FAIL', name, typeof result === 'string' ? result : '');
  } catch (error) {
    report('FAIL', name, `erro=${errorCode(error)}`);
  }
}

async function connect(url, label) {
  const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 15000 });
  // Sem listener, um erro assíncrono da conexão derrubaria o processo com a mensagem crua.
  client.on('error', () => {});
  try {
    await client.connect();
  } catch (error) {
    report('FAIL', `connect_${label}`, `erro=${errorCode(error)}`);
    return null;
  }
  return client;
}

async function sqlState(promise) {
  try {
    await promise;
    return 'sem erro';
  } catch (error) {
    return errorCode(error);
  }
}

async function verifyAdmin(admin) {
  try {
    const result = await admin.query('SHOW server_version_num');
    const major = Math.floor(Number(result.rows[0].server_version_num) / 10000);
    report(major >= MIN_MAJOR ? 'PASS' : 'FAIL', 'server_version', `major=${major}`);
  } catch (error) {
    report('FAIL', 'server_version', `erro=${errorCode(error)}`);
  }

  await check('baseline_aplicada', async () => {
    const result = await admin.query(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL)::int AS done
         FROM _prisma_migrations WHERE migration_name LIKE '%\\_baseline'`,
    );
    const { total, done } = result.rows[0];
    return total === 1 && done === 1 ? true : `total=${total} concluidas=${done}`;
  });

  await check('rls_em_toda_tabela_de_public', async () => {
    const result = await admin.query(
      `SELECT c.relname, c.relrowsecurity
         FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
        ORDER BY c.relname`,
    );
    const names = result.rows.map((row) => row.relname);
    const missing = PROTECTED_TABLES.filter((table) => !names.includes(table));
    if (missing.length > 0) return `tabela ausente: ${missing.join(',')}`;
    const withoutRls = result.rows.filter((row) => !row.relrowsecurity).map((row) => row.relname);
    return withoutRls.length === 0 ? true : `sem RLS: ${withoutRls.join(',')}`;
  });

  await check('app_api_atributos', async () => {
    const result = await admin.query(
      `SELECT rolcanlogin, rolsuper, rolbypassrls, rolcreatedb, rolcreaterole
         FROM pg_roles WHERE rolname = 'app_api'`,
    );
    const row = result.rows[0];
    if (!row) return 'papel app_api não existe';
    const flags = `login=${row.rolcanlogin} super=${row.rolsuper} bypassrls=${row.rolbypassrls} createdb=${row.rolcreatedb} createrole=${row.rolcreaterole}`;
    return flags === 'login=true super=false bypassrls=false createdb=false createrole=false' ? true : flags;
  });

  await check('app_api_nao_e_dono_de_tabela', async () => {
    const result = await admin.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tableowner = 'app_api'`,
    );
    return result.rows.length === 0 ? true : `dono de: ${result.rows.map((row) => row.tablename).join(',')}`;
  });

  await check('anon_authenticated_service_role_sem_privilegio', async () => {
    const result = await admin.query(
      `SELECT r.role, p.priv, t.tbl
         FROM unnest($1::text[]) AS r(role),
              unnest($2::text[]) AS t(tbl),
              unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE']) AS p(priv)
        WHERE has_table_privilege(r.role, 'public.' || t.tbl, p.priv)`,
      [SUPABASE_ROLES, PROTECTED_TABLES],
    );
    const granted = result.rows.map((row) => `${row.role} ${row.priv} em ${row.tbl}`);
    return granted.length === 0 ? true : granted.join(', ');
  });

  await verifyAnonSelect(admin);
}

// SET LOCAL ROLE anon + SELECT deve dar 42501. Se o `postgres` do Supabase não puder assumir `anon`,
// registra SKIP e confia no has_table_privilege acima.
async function verifyAnonSelect(admin) {
  try {
    await admin.query('BEGIN');
    const setRole = await sqlState(admin.query('SET LOCAL ROLE anon'));
    if (setRole !== 'sem erro') {
      report('SKIP', 'set_role_anon', `erro=${setRole}`);
      return;
    }
    const who = await admin.query('SELECT current_user AS name');
    if (who.rows[0].name !== 'anon') {
      report('FAIL', 'anon_select_heartbeat', `current_user=${who.rows[0].name}`);
      return;
    }
    const state = await sqlState(admin.query('SELECT * FROM heartbeat'));
    if (state === '42501') report('PASS', 'anon_select_heartbeat_42501');
    else report('FAIL', 'anon_select_heartbeat', `sqlstate=${state} (esperado 42501)`);
  } catch (error) {
    report('FAIL', 'anon_select_heartbeat', `erro=${errorCode(error)}`);
  } finally {
    await admin.query('ROLLBACK').catch(() => {});
  }
}

async function verifyAsApp(app) {
  await check('app_api_current_user', async () => {
    const result = await app.query('SELECT current_user AS name');
    return result.rows[0].name === 'app_api' ? true : `current_user=${result.rows[0].name}`;
  });

  await check('app_api_le_heartbeat', async () => {
    const result = await app.query('SELECT id FROM heartbeat');
    const ids = result.rows.map((row) => row.id).join(',');
    return ids === '1' ? true : `ids=${ids}`;
  });

  await check('app_api_nao_escreve_heartbeat', async () => {
    const state = await sqlState(app.query('UPDATE heartbeat SET beat_at = now()'));
    return state === '42501' ? true : `sqlstate=${state} (esperado 42501)`;
  });
}

async function main() {
  if (!process.env.MIGRATE_DATABASE_URL) {
    report('FAIL', 'config', 'MIGRATE_DATABASE_URL ausente');
    return;
  }
  if (asApp && !process.env.DATABASE_URL) {
    report('FAIL', 'config', 'DATABASE_URL ausente (rode set-app-api-password.mjs)');
    return;
  }

  const admin = await connect(process.env.MIGRATE_DATABASE_URL, 'admin');
  if (admin) {
    try {
      await verifyAdmin(admin);
    } finally {
      await admin.end().catch(() => {});
    }
  }

  if (asApp) {
    const app = await connect(process.env.DATABASE_URL, 'app_api');
    if (app) {
      try {
        await verifyAsApp(app);
      } finally {
        await app.end().catch(() => {});
      }
    }
  }
}

await main();

if (failed) process.exit(1);
console.log(asApp ? 'APP_API_OK' : 'DB_SECURITY_OK');
