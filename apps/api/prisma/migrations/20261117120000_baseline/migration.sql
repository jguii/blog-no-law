-- Baseline de segurança do banco (SEC-04): papel de runtime sem bypass, revoke dos grants
-- padrão do Supabase, RLS em toda tabela de `public` e a tabela `heartbeat`.
-- Roda com a credencial `postgres` (migrations). A senha do `app_api` NUNCA entra neste arquivo:
-- é definida fora do git (ALTER ROLE no setup de teste; no Supabase, passo manual do plano 01-06).

-- Papel de runtime da API: login, sem superuser, sem bypass de RLS, sem criar banco nem papel.
-- Idempotente: o papel é do cluster, então um segundo banco no mesmo cluster não pode falhar aqui.
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_api') THEN
    CREATE ROLE app_api LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
END $$;

-- Supabase concede tudo em `public` a anon, authenticated e service_role por padrão.
-- Revogar os defaults faz toda tabela, sequência e função futura nascer sem esse acesso.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated, service_role;

-- Linha única que o /health/ready lê (e que mantém o projeto Supabase ativo).
CREATE TABLE heartbeat (
  id      smallint    PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  beat_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO heartbeat DEFAULT VALUES;

ALTER TABLE heartbeat ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON heartbeat FROM anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO app_api;
GRANT SELECT ON heartbeat TO app_api;
CREATE POLICY heartbeat_app_api_select ON heartbeat FOR SELECT TO app_api USING (true);

-- A tabela de controle do Prisma também vive em `public`; sem RLS ela falharia na checagem
-- "toda tabela de public tem RLS". O Prisma a cria antes de aplicar esta migration.
ALTER TABLE _prisma_migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON _prisma_migrations FROM anon, authenticated, service_role;
