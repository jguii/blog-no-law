-- WR-02: fecha o EXECUTE em funções de `public` para PUBLIC, anon, authenticated e service_role.
--
-- Correção do comentário da baseline (20261117120000_baseline, que não se edita depois de
-- aplicada): o `ALTER DEFAULT PRIVILEGES ... IN SCHEMA public REVOKE ALL ON FUNCTIONS` de lá só
-- remove os grants POR ESQUEMA que o Supabase dá a anon, authenticated e service_role. O Postgres
-- dá EXECUTE a PUBLIC em toda função nova por um default GLOBAL, que um revoke com `IN SCHEMA` não
-- alcança, e os três papéis herdam de PUBLIC. Ou seja: funções futuras NÃO nasciam fechadas.
--
-- Depois desta migration, toda função ou procedure criada pelo papel das migrations nasce só com
-- o EXECUTE do dono. Quem precisar chamar uma função (inclusive `app_api`, por exemplo num helper
-- de política RLS) recebe `GRANT EXECUTE` explícito na mesma migration que cria a função.
--
-- Só expande restrições e é idempotente: revogar o que não existe não falha.

-- Funções e procedures que já existam em `public` (hoje nenhuma).
REVOKE EXECUTE ON ALL ROUTINES IN SCHEMA public FROM PUBLIC, anon, authenticated, service_role;

-- Default global (sem IN SCHEMA), o único que retira o EXECUTE de PUBLIC. Vale para o papel que
-- roda as migrations (current_user) e, como na baseline, explicitamente para `postgres`.
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated, service_role;

-- Defaults por esquema que o Supabase concede em `public`.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated, service_role;
