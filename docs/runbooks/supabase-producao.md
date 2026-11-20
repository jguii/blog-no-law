# Runbook: banco de produção (Supabase)

Este repositório é público. Este documento cita credenciais só pelo **nome**; nenhum valor, URL com senha ou chave secreta entra aqui.

## Resumo

| Item | Valor |
|---|---|
| Projeto | `blog-no-law` no Supabase (plano Free) |
| Região | `us-east-1` (East US, North Virginia). **Escolha sem volta** (D-05, D-11): a região de um projeto Supabase é imutável; mudar exige projeto novo e migração de dados |
| Por que essa região | Fica ao lado da Render (Virginia) e da Vercel (`iad1`), porque cada requisição roda várias consultas (D-04) |
| Servidor | PostgreSQL 17 (`verify-db-security.mjs` confere o major >= 17) |
| Conexão | Session pooler (Supavisor), host `aws-0-us-east-1.pooler.supabase.com`, porta `5432` |
| Por que o pooler | A conexão direta do plano Free é só IPv6; a Render e os runners do GitHub saem em IPv4. O modo session aceita prepared statements, então não há `pgbouncer=true` |
| Usuário de migração | `postgres.{ref}` (papel `postgres`, que cria tabelas e papéis) |
| Usuário de runtime | `app_api.{ref}` (papel `app_api`: sem superuser, sem `BYPASSRLS`, só `SELECT` em `heartbeat`) |

O `{ref}` é o identificador do projeto (`SUPABASE_PROJECT_REF`). No pooler, o usuário sempre leva o sufixo `.{ref}`.

## Onde cada credencial vive

Só os nomes; os valores nunca passam pelo git.

| Credencial | Uso | Onde vive |
|---|---|---|
| `MIGRATE_DATABASE_URL` | `prisma migrate deploy`, scripts de verificação, backup | `~/.config/blog-no-law/production.env` (local) e, a partir do 01-12, no GitHub Environment `production` |
| `DATABASE_URL` | Runtime da API como `app_api` | `~/.config/blog-no-law/production.env` (local) e variável de ambiente da Render |
| `SUPABASE_PROJECT_REF`, `SUPABASE_POOLER_HOST` | Montar a URL do `app_api` | `~/.config/blog-no-law/production.env` |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | Smoke anônimo do PostgREST (valores públicos por desenho) | `~/.config/blog-no-law/production.env` |

O env file local fica **fora do repositório**, em diretório `700` e arquivo `600`. Cuidados:

- Valores entre aspas simples; senhas com caracteres especiais vão URL-encoded dentro da URL.
- Nenhum script imprime URL de conexão, senha ou a mensagem crua do driver. Ao colar saída em issue ou PR, confira antes que não há senha embutida em URL de conexão nem chave secreta do Supabase.
- Nunca use `prisma db push`: o RLS e os papéis são SQL puro dentro da migration, e só `prisma migrate deploy` os aplica.

## Forma canônica de TLS

Vale para toda URL de banco de produção (host, runner da CI e container):

- A URL termina em `?sslmode=require`, **sem** nenhum outro parâmetro de TLS e **sem** caminho de certificado. Não use `sslrootcert`, `sslcert` nem `sslaccept`: um caminho relativo muda de sentido conforme o diretório de trabalho (no container o CWD é `/app`) e o `psql` recusa parâmetros que só o Prisma conhece.
- A CA pública do Supabase (`apps/api/certs/supabase-ca.crt`, "Supabase Root 2021 CA", válida até 2031-04-26) entra **pelo ambiente de cada cliente, com caminho absoluto**:
  - clientes Node (`pg`, o adapter do Prisma no runtime, os scripts `.mjs`): `NODE_EXTRA_CA_CERTS="$PWD/apps/api/certs/supabase-ca.crt"` rodando da raiz do repositório (na imagem do 01-11 será `/app/certs/supabase-ca.crt`; no runner do 01-12, `${{ github.workspace }}/apps/api/certs/supabase-ca.crt`);
  - clientes libpq (`psql`, `pg_dump` do 01-13): `PGSSLROOTCERT=/certs/supabase-ca.crt`, com `apps/api/certs` montado em `/certs`.
- Proibidos: `sslmode=no-verify` e `rejectUnauthorized: false`.

### Resultado da Open Question 7 (verificação do certificado)

Medido em 2026-11-20 contra o pooler de produção:

- **`pg` 8.x (Node): verifica.** O driver trata `sslmode=require` como `verify-full`. Sem `NODE_EXTRA_CA_CERTS` a conexão falha com `SELF_SIGNED_CERT_IN_CHAIN`; com a variável apontando para a CA, conecta. Isso vale para os scripts e para o runtime da API.
- **`prisma migrate` (schema engine em Rust): conecta com TLS, mas não valida a cadeia pela nossa CA.** `migrate status` e `migrate deploy` funcionaram sem nenhuma CA configurada, e `NODE_EXTRA_CA_CERTS` não afeta o binário. Portanto a migração tem criptografia, mas não verificação do servidor. Risco aceito e baixo: a migração roda só da máquina do autor ou do job de deploy, e as verificações que se seguem (`verify-db-security.mjs`) usam `pg` com verificação completa. Não tente "consertar" pondo caminho de certificado na URL (quebra a forma canônica).
- O `pg` 8.23 imprime um aviso de segurança: no `pg` 9 os modos `require`, `prefer` e `verify-ca` passarão a seguir a semântica do libpq (mais fraca). Enquanto o projeto estiver no `pg` 8 o comportamento é o descrito acima. Ao subir para o `pg` 9, trocar para `sslmode=verify-full` explícito ou revisar este runbook.

## Como rodar as verificações

Da raiz do repositório:

```bash
# 1. Schema em dia (migrate deploy aplica; status só consulta)
DOTENV_CONFIG_PATH="$HOME/.config/blog-no-law/production.env" pnpm --filter @blog/api exec prisma migrate status

# 2. Segurança do banco: RLS, atributos do app_api, privilégios de anon/authenticated/service_role
NODE_EXTRA_CA_CERTS="$PWD/apps/api/certs/supabase-ca.crt" node apps/api/scripts/verify-db-security.mjs

# 3. Mesma checagem, mais a conexão de runtime como app_api (lê heartbeat, não consegue UPDATE)
NODE_EXTRA_CA_CERTS="$PWD/apps/api/certs/supabase-ca.crt" node apps/api/scripts/verify-db-security.mjs --as-app

# 4. Smoke anônimo da Data API (PostgREST) com a chave publishable
ENV_FILE="$HOME/.config/blog-no-law/production.env" bash scripts/smoke-postgrest.sh
```

Saídas esperadas: `Database schema is up to date!`, `DB_SECURITY_OK`, `APP_API_OK` e `POSTGREST_ANON_BLOCKED`. Qualquer linha `FAIL` ou `LEAK` é bloqueante.

No smoke, a Data API responde `401` com `code=42501` (permission denied) para `heartbeat` e `_prisma_migrations`: as tabelas existem, mas `anon` não tem privilégio nenhum. Uma tabela inexistente responderia `404` (`PGRST205`), o que provaria menos. Esse mesmo script é o portão `postgrest-anon` da CI (D-14, ligado no 01-09).

## Rotação de credenciais

### Senha do `app_api` (runtime da API)

```bash
NODE_EXTRA_CA_CERTS="$PWD/apps/api/certs/supabase-ca.crt" node apps/api/scripts/set-app-api-password.mjs
NODE_EXTRA_CA_CERTS="$PWD/apps/api/certs/supabase-ca.crt" node apps/api/scripts/verify-db-security.mjs --as-app
```

O script gera 32 bytes aleatórios (base64url), aplica com `ALTER ROLE app_api WITH PASSWORD ...`, e regrava só a linha `DATABASE_URL` do env file (permissão `600`). Imprime apenas o caminho. Depois:

1. Copie o novo `DATABASE_URL` do env file para a variável de ambiente da Render (sem colar no chat nem em issue) e reimplante.
2. A senha antiga deixa de funcionar na hora; a API em execução perde as conexões novas até a Render receber o valor novo. Faça em horário de pouco uso.
3. Se o script falhar depois do `ALTER ROLE` e antes de gravar o arquivo (mensagem "o env file não pôde ser gravado"), basta rodá-lo de novo.

### Senha do `postgres` (migrações)

Mudar pelo painel: Project Settings -> Database -> Reset database password. Depois atualize `MIGRATE_DATABASE_URL` no env file local (URL-encode a senha) e no GitHub Environment `production` (01-12). Reexecute `verify-db-security.mjs`.

## Pausa do plano Free

O Supabase pausa projetos Free após 7 dias sem atividade. O `/health/ready` lê `heartbeat` a cada chamada, e o monitor de uptime externo (01-13) gera esse tráfego; sem ele, o projeto pausa e a API cai. Para despausar: painel -> Restore project (os dados são mantidos).

## Se a região precisar mudar

Não há migração in-place. Crie projeto novo na região desejada, aplique `prisma migrate deploy`, restaure um dump do banco antigo (backup do 01-13), rode `set-app-api-password.mjs` e atualize `API`/Render. Reavalie D-04 (colocação API, banco e Vercel na mesma região) antes.
