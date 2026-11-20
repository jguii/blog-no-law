// Gera uma senha aleatória para o papel de runtime `app_api`, aplica no banco e grava o
// `DATABASE_URL` no env file local. É também o procedimento de rotação (T-01-40): rodar de novo
// troca a senha; depois é só copiar o novo `DATABASE_URL` para a Render.
//
// Uso (da raiz do repositório, com a CA do Supabase pelo ambiente quando o alvo for o Supabase):
//   NODE_EXTRA_CA_CERTS="$PWD/apps/api/certs/supabase-ca.crt" node apps/api/scripts/set-app-api-password.mjs
//
// Variáveis: ENV_FILE (default ~/.config/blog-no-law/production.env, com MIGRATE_DATABASE_URL,
// SUPABASE_PROJECT_REF e SUPABASE_POOLER_HOST) e APP_API_ROLE (default `app_api`; o teste usa
// `app_api_pwtest`). O repositório é público: o script imprime só o caminho do env file, nunca a
// senha, a URL nem a mensagem crua do driver.
import { randomBytes } from 'node:crypto';
import { chmodSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { config } from 'dotenv';
import pg from 'pg';

const ROLE_PATTERN = /^[a-z_][a-z0-9_]*$/;
const REF_PATTERN = /^[a-z0-9]+$/;
const HOST_PATTERN = /^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$/;
const POOLER_PORT = 5432;
const URL_KEY = 'DATABASE_URL=';

function fail(message) {
  console.error(message);
  process.exit(1);
}

// Só o código do erro (SQLSTATE ou de rede): a mensagem crua pode citar host e usuário.
function errorCode(error) {
  return typeof error?.code === 'string' ? error.code : 'sem_codigo';
}

// Troca a linha DATABASE_URL= (mantendo a posição), remove duplicatas e acrescenta se não houver.
function withDatabaseUrl(content, line) {
  const lines = content.split('\n');
  if (lines.at(-1) === '') lines.pop();
  const result = [];
  let replaced = false;
  for (const current of lines) {
    if (!current.startsWith(URL_KEY)) {
      result.push(current);
    } else if (!replaced) {
      result.push(line);
      replaced = true;
    }
  }
  if (!replaced) result.push(line);
  return `${result.join('\n')}\n`;
}

const role = process.env.APP_API_ROLE ?? 'app_api';
if (!ROLE_PATTERN.test(role))
  fail('APP_API_ROLE inválido: use só minúsculas, dígitos e underscore');

const envFile = process.env.ENV_FILE ?? join(homedir(), '.config', 'blog-no-law', 'production.env');
config({ path: envFile, quiet: true });

const migrateUrl = process.env.MIGRATE_DATABASE_URL;
const projectRef = process.env.SUPABASE_PROJECT_REF;
const poolerHost = process.env.SUPABASE_POOLER_HOST;
if (!migrateUrl || !projectRef || !poolerHost) {
  fail(
    'env file incompleto: faltam MIGRATE_DATABASE_URL, SUPABASE_PROJECT_REF ou SUPABASE_POOLER_HOST',
  );
}
if (!REF_PATTERN.test(projectRef)) fail('SUPABASE_PROJECT_REF inválido');
if (!HOST_PATTERN.test(poolerHost)) fail('SUPABASE_POOLER_HOST inválido');

const password = randomBytes(32).toString('base64url');

const client = new pg.Client({ connectionString: migrateUrl, connectionTimeoutMillis: 15000 });
client.on('error', () => {});
try {
  await client.connect();
  await client.query(
    `ALTER ROLE ${client.escapeIdentifier(role)} WITH PASSWORD ${client.escapeLiteral(password)}`,
  );
} catch (error) {
  fail(`falha ao aplicar a senha no banco (erro=${errorCode(error)}); o env file não foi alterado`);
} finally {
  await client.end().catch(() => {});
}

// Forma canônica de TLS: só `sslmode=require`, sem parâmetro nem caminho de certificado.
const databaseUrl = `postgresql://${role}.${projectRef}:${encodeURIComponent(password)}@${poolerHost}:${POOLER_PORT}/postgres?sslmode=require`;

try {
  const next = withDatabaseUrl(readFileSync(envFile, 'utf8'), `${URL_KEY}'${databaseUrl}'`);
  // Escrita atômica com 600 desde a criação: o arquivo nunca fica legível por outros usuários.
  const temp = join(dirname(envFile), `.${process.pid}.tmp`);
  writeFileSync(temp, next, { mode: 0o600 });
  renameSync(temp, envFile);
  chmodSync(envFile, 0o600);
} catch (error) {
  fail(
    `a senha foi aplicada no banco, mas o env file não pôde ser gravado (erro=${errorCode(error)}); rode o script de novo`,
  );
}

console.log(`DATABASE_URL atualizado em ${envFile}`);
