// Prepara um banco descartável para testes de integração, smoke local e E2E da CI.
// Todos os defaults abaixo são valores só de teste local, sem relação com produção.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const API_DIR = fileURLToPath(new URL('..', import.meta.url));
const DEFAULT_ADMIN_URL = 'postgresql://postgres:postgres@127.0.0.1:54329/postgres';
const DEFAULT_DB_NAME = 'blog_test';
const DEFAULT_APP_API_PASSWORD = 'app_api_local_test';
const SUPABASE_ROLES = ['anon', 'authenticated', 'service_role'];
const DB_NAME_PATTERN = /^[a-z_][a-z0-9_]*$/;

function urlWith(baseUrl, { database, username, password }) {
  const url = new URL(baseUrl);
  if (database !== undefined) url.pathname = `/${database}`;
  if (username !== undefined) url.username = username;
  if (password !== undefined) url.password = password;
  return url.toString();
}

function runMigrateDeploy(migrateUrl, secrets) {
  try {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      cwd: API_DIR,
      env: { ...process.env, MIGRATE_DATABASE_URL: migrateUrl },
      stdio: 'pipe',
      encoding: 'utf8',
    });
  } catch (error) {
    // Nunca devolve credenciais no erro: a saída do Prisma pode citar a URL.
    let detail = `${error.stdout ?? ''}${error.stderr ?? ''}`;
    for (const secret of secrets) detail = detail.replaceAll(secret, '***');
    throw new Error(`prisma migrate deploy falhou:\n${detail}`);
  }
}

export async function prepareTestDb({
  adminUrl = DEFAULT_ADMIN_URL,
  dbName = DEFAULT_DB_NAME,
  appApiPassword = DEFAULT_APP_API_PASSWORD,
} = {}) {
  if (!DB_NAME_PATTERN.test(dbName)) {
    throw new Error('dbName inválido: use só minúsculas, dígitos e underscore');
  }

  const admin = new pg.Client({ connectionString: adminUrl });
  await admin.connect();
  try {
    // Papéis do Supabase que a imagem `postgres:17` simples não traz; no-op na `supabase/postgres`.
    for (const role of SUPABASE_ROLES) {
      await admin.query(
        `DO $$ BEGIN
           IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${role}') THEN
             CREATE ROLE ${role} NOLOGIN;
           END IF;
         END $$`,
      );
    }
    await admin.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`);
    await admin.query(`CREATE DATABASE ${dbName}`);
  } finally {
    await admin.end();
  }

  const adminDbUrl = urlWith(adminUrl, { database: dbName });
  runMigrateDeploy(adminDbUrl, [new URL(adminUrl).password, appApiPassword].filter(Boolean));

  // A migration cria `app_api` sem senha (nada de segredo no git); aqui entra a senha de teste.
  const setPassword = new pg.Client({ connectionString: adminDbUrl });
  await setPassword.connect();
  try {
    await setPassword.query(
      `ALTER ROLE app_api WITH PASSWORD ${setPassword.escapeLiteral(appApiPassword)}`,
    );
  } finally {
    await setPassword.end();
  }

  const appApiUrl = urlWith(adminUrl, {
    database: dbName,
    username: 'app_api',
    password: appApiPassword,
  });
  return { adminDbUrl, appApiUrl };
}

// Modo linha de comando: `node scripts/prepare-test-db.mjs` (smoke local e E2E da CI reutilizam).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dbName = process.env.TEST_DB_NAME ?? DEFAULT_DB_NAME;
  await prepareTestDb({ adminUrl: process.env.DATABASE_URL_TEST_ADMIN, dbName });
  console.log(`PREPARED ${dbName}`);
}
