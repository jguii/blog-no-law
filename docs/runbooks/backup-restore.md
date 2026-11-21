# Runbook: backup e restore do banco de produção

Este repositório é público (D-07). Este documento cita segredos e variáveis só pelo **nome**; nenhum valor, URL com senha, token, chave privada ou conteúdo de dump entra aqui.

## Resumo

| Item          | Valor                                                                                                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow      | `.github/workflows/backup.yml` (`name: Backup`), só na `main` (o `schedule` e o `workflow_dispatch` só rodam da branch padrão, D-13)                                          |
| Horário       | Todo dia às **05:17 UTC** (fora de minuto cheio, que atrasa no Actions), mais disparo manual por `workflow_dispatch`                                                          |
| Escopo        | Só o schema `public` (`pg_dump -Fc --no-owner --schema=public`), com os GRANT/REVOKE dentro do dump. Papéis não entram no dump                                                |
| Credencial    | `MIGRATE_DATABASE_URL` (papel `postgres`). Nunca `app_api`: com o RLS, um dump feito como `app_api` sairia vazio                                                              |
| Cliente       | `pg_dump` do container `postgres:17` (igual ao servidor 17), pela forma canônica de TLS (`?sslmode=require` e `PGSSLROOTCERT=/certs/supabase-ca.crt`)                         |
| Criptografia  | `age`, direto no pipe (`pg_dump ... \| age -R ops/backup/age-recipients.txt`). O texto em claro nunca toca o disco do runner                                                  |
| Chave pública | `ops/backup/age-recipients.txt` (no repositório, pública por desenho)                                                                                                         |
| Chave privada | Offline com o autor: `~/.config/blog-no-law/backup.age.key` (modo 600) e uma cópia no gerenciador de senhas. Sem ela nenhum backup pode ser lido                              |
| Destino       | Releases do repositório **privado** `blog-no-law-backups` (variável `BACKUP_REPO` do Environment `production`), uma release `db-{AAAAMMDD}T{HHMMSS}Z` por backup              |
| Token         | `BACKUP_REPO_TOKEN` (fine-grained, só o repositório de backups, Contents read/write, validade de 1 ano; ver `rotacao-segredos.md`)                                            |
| Retenção      | 30 dias, medidos pela data de **publicação** da release (`publishedAt`). Roda só depois do upload novo dar certo                                                              |
| Keep-alive    | O mesmo job faz `UPDATE public.heartbeat` antes do dump: uma escrita real por dia, que impede a pausa do Supabase Free (ver "Fontes de keep-alive")                           |
| Proibido      | Artefato do Actions, repositório público, dump em claro no disco ou no log, e a opção do `pg_dump` que descarta privilégios (sem ela o restore deixa o `app_api` sem leitura) |

### Por que `publishedAt` e não `createdAt`

O `createdAt` de uma release no GitHub é a data do **commit alvo** da tag, não a da publicação. No repositório de backups (um único commit, de 2026-11-20) todas as releases herdam a mesma data. Com `createdAt`, cerca de 30 dias depois desse commit a retenção apagaria **todas** as releases, inclusive a recém-publicada. A retenção e o drill usam `publishedAt`. Exemplo real: a release `db-20261121T223555Z` tem `createdAt` 2026-11-20T23:50:58Z e `publishedAt` 2026-11-21T22:36:07Z.

## Primeiro backup

| Campo                    | Valor                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| Run                      | `44957527489` (dispatch na `main`, 2026-11-21), todos os passos com sucesso                       |
| `age --version` (runner) | `1.1.1` (pacote do Ubuntu 24.04); o autor decifra com `age` 1.2.1                                 |
| Release                  | `db-20261121T223555Z`, asset `db-20261121T223555Z.dump.age` com 10113 bytes                       |
| Heartbeat                | `verify-db-security.mjs --as-app --heartbeat-fresh` imprimiu `HEARTBEAT_FRESH` logo depois do run |

## Conferir o último backup

```bash
R=$(gh variable get BACKUP_REPO --env production --repo jguii/blog-no-law)
gh release list --repo "$R" --limit 5 --json tagName,publishedAt --jq '.[] | "\(.tagName) \(.publishedAt)"'
gh run list --workflow backup.yml --branch main --limit 5 --repo jguii/blog-no-law
```

O backup mais recente precisa ter `publishedAt` de menos de 2 dias. Se não tiver, ver "Alerta: o `schedule` desliga depois de 60 dias".

Disparo manual (também religa a atividade do repositório):

```bash
gh workflow run backup.yml --ref main --repo jguii/blog-no-law
gh run watch "$(gh run list --workflow backup.yml --limit 1 --json databaseId --jq '.[0].databaseId' --repo jguii/blog-no-law)" --exit-status --repo jguii/blog-no-law
```

## Restore drill

```bash
bash scripts/restore-drill.sh
```

O script baixa a release `db-*` mais recente (ordenada por `publishedAt`), decifra com a chave privada offline (`AGE_KEY`, padrão `~/.config/blog-no-law/backup.age.key`) e restaura num `postgres:17` descartável em `127.0.0.1:54330`. O texto em claro só passa pelo pipe `age -d | pg_restore`. O container (`--rm`) e o diretório temporário somem no `trap`, com sucesso ou falha.

Antes do restore, o drill cria os papéis que o dump cita e que não viajam num dump de schema:

- os da baseline: `anon`, `authenticated` e `service_role` (NOLOGIN) e `app_api` com os atributos da migration (LOGIN, NOSUPERUSER, NOBYPASSRLS, NOCREATEDB, NOCREATEROLE, NOINHERIT) e uma senha de uso único;
- **`DRILL_PLATFORM_ROLES`**, papéis da plataforma Supabase citados em privilégios do dump, criados NOLOGIN: hoje só **`supabase_admin`** (o dump traz os `ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public ...` do Supabase). Se um drill futuro parar com `role "{nome}" does not exist`, acrescente o nome à lista do script e a esta linha.

O restore usa `pg_restore --no-owner --clean --if-exists --exit-on-error`: o dump de `--schema=public` traz `CREATE SCHEMA public`, que um banco novo já tem, então o `--clean --if-exists` troca o `public` vazio do destino pelo do backup, com os privilégios do backup. Nenhuma opção que descarte privilégios.

Depois do restore o drill confere, cada item com `RESTORE_FAIL {checagem}` e saída 1 se falhar:

| Checagem             | O que prova                                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `heartbeat_rows`     | `public.heartbeat` com 1 linha                                                                                                |
| `baseline_migration` | `_prisma_migrations` com a migration `*_baseline` finalizada (o `prisma migrate deploy` reconhece o schema)                   |
| `rls_heartbeat`      | RLS ligado em `heartbeat`                                                                                                     |
| `policy_heartbeat`   | policy `heartbeat_app_api_select` presente                                                                                    |
| `app_api_select`     | `has_table_privilege('app_api', 'public.heartbeat', 'SELECT')` verdadeiro: o GRANT veio do backup                             |
| `anon_denied`        | `has_table_privilege('anon', 'public.heartbeat', 'SELECT')` falso: o REVOKE veio do backup                                    |
| `app_api_read`       | Leitura real como no runtime: login do `app_api` **com senha** por TCP (scram), `select id from public.heartbeat` devolve `1` |

Saída de sucesso: `RESTORE_OK tag={tag} seconds={n}`, com `n` medido do download ao fim das checagens (a imagem `postgres:17` já baixada; um primeiro `docker pull` soma cerca de um minuto).

### Registro dos drills

| Data (UTC)           | Tag                   | Segundos | Resultado                                      | Observação                                                                                                                                                                                                        |
| -------------------- | --------------------- | -------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-21T22:43:20Z | `db-20261121T223555Z` | 8        | `RESTORE_OK tag=db-20261121T223555Z seconds=8` | Primeiro drill. Duas tentativas antes falharam e corrigiram o script: `schema "public" already exists` (entrou `--clean --if-exists`) e `role "supabase_admin" does not exist` (entrou em `DRILL_PLATFORM_ROLES`) |

Faça um drill **por mês** (e depois de qualquer mudança no `backup.yml`, na baseline ou na chave `age`) e acrescente uma linha. O drill mensal também confere a data do último backup: a tag impressa (`Backup mais recente: db-...`) traz o horário UTC do dump.

## Restore em produção (emergência)

Não testado contra um projeto Supabase: o drill prova o conteúdo do backup num Postgres 17 puro. Ensaie num projeto de rascunho antes de precisar.

1. **Destino.** Um projeto Supabase novo (mesma região, `us-east-1`, D-04) ou o atual depois de confirmar que o `public` dele pode ser substituído. O `--clean` apaga e recria os objetos do `public` do destino.
2. **Papéis antes do `pg_restore`.** Papéis não entram no dump. No SQL Editor do projeto de destino, como `postgres`:

   ```sql
   CREATE ROLE app_api LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT;
   ```

   `anon`, `authenticated`, `service_role` e `supabase_admin` já existem num projeto Supabase.

3. **Restore com os privilégios do dump.** Baixe a release e restaure pelo pooler, na forma canônica de TLS, com `DB_URL` = a `MIGRATE_DATABASE_URL` do **destino** (lida do env file, nunca colada na linha de comando):

   ```bash
   R=$(gh variable get BACKUP_REPO --env production --repo jguii/blog-no-law)
   TAG=db-AAAAMMDDTHHMMSSZ   # a release escolhida
   gh release download "$TAG" --repo "$R" --pattern '*.dump.age' --dir "$(mktemp -d)"
   # DB_URL exportada a partir do env file do destino (termina em ?sslmode=require)
   age -d -i ~/.config/blog-no-law/backup.age.key {caminho}/"$TAG".dump.age \
     | docker run --rm -i -e DB_URL -e PGSSLROOTCERT=/certs/supabase-ca.crt \
         -v "$PWD/apps/api/certs:/certs:ro" postgres:17 \
         sh -c 'pg_restore -d "$DB_URL" --no-owner --clean --if-exists --exit-on-error'
   ```

   O `postgres` do Supabase não é superusuário nem membro de `supabase_admin`. Se o restore parar num `ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin ...`, rode de novo sem `--exit-on-error`, confira que os únicos erros são desses privilégios padrão (o projeto novo já os tem) e siga.

4. **Senha e runtime.** Com o env file apontando para o destino: `NODE_EXTRA_CA_CERTS="$PWD/apps/api/certs/supabase-ca.crt" node apps/api/scripts/set-app-api-password.mjs`, depois atualize a `DATABASE_URL` na Render e reimplante a imagem certa (ver "Atenção" em `deploy.md`).
5. **Verificação.** `verify-db-security.mjs --as-app` (`DB_SECURITY_OK`, `APP_API_OK`), `prisma migrate status` (`Database schema is up to date!`, porque `_prisma_migrations` veio no dump) e `smoke-postgrest.sh` (`POSTGREST_ANON_BLOCKED`). Se o projeto mudou, atualize `MIGRATE_DATABASE_URL` no Environment `production` e as variáveis `SUPABASE_*` (ver `rotacao-segredos.md`).

## Fontes de keep-alive

Política de keep-alive da Render registrada em `docs/runbooks/render.md` (01-11): **`Política de keep-alive (D-03): RISCO_ACEITO`**.

Fontes ativas:

1. **Escrita diária do `backup.yml`** (sempre): `UPDATE public.heartbeat set beat_at = now()` às 05:17 UTC. É a fonte garantida contra a pausa do Supabase Free (7 dias sem atividade).
2. **UptimeRobot** (ativo porque a política não é PROIBE): dois monitores HTTP(s) de 5 minutos, `https://blog-no-law-api.onrender.com/health/live` e `https://blog-no-law-api.onrender.com/health/ready`. O `/health/ready` lê `heartbeat` como `app_api` a cada 5 minutos (segunda fonte de atividade no banco) e os dois mantêm a Render acordada. Se a Render sinalizar o ping como abuso, apague os monitores, troque a política em `render.md` para PROIBE e esta seção passa a ter só a fonte 1.

Conferir o heartbeat de produção:

```bash
NODE_EXTRA_CA_CERTS="$PWD/apps/api/certs/supabase-ca.crt" node apps/api/scripts/verify-db-security.mjs --as-app --heartbeat-fresh
```

`HEARTBEAT_FRESH` significa `beat_at` com menos de 2 horas (logo depois de um run do backup).

## Alerta: o `schedule` desliga depois de 60 dias

Em repositório público, o GitHub **desliga sozinho** os workflows agendados depois de 60 dias sem atividade no repositório (Pitfall 4). O backup e a escrita diária no `heartbeat` param em silêncio, e o Supabase pausa 7 dias depois se não houver outra fonte.

- **Ver o estado:** `gh api repos/jguii/blog-no-law/actions/workflows/backup.yml --jq .state` (`active` ou `disabled_inactivity`). O GitHub costuma avisar por e-mail antes.
- **Religar:** `gh workflow enable backup.yml --repo jguii/blog-no-law` (ou Actions -> Backup -> Enable workflow) e um disparo manual (`gh workflow run backup.yml --ref main --repo jguii/blog-no-law`).
- **Segunda fonte:** com a política em RISCO_ACEITO, o monitor do UptimeRobot em `/health/ready` continua lendo o banco a cada 5 minutos mesmo com o `schedule` desligado, e o projeto Supabase não pausa. Mas **não há backup** nesse período.
- **Drill mensal:** é a defesa contra o backup parado em silêncio (e a única, se a política virar PROIBE). Confira a data do último backup em cada drill.

## Escopo futuro

O backup cobre só o schema `public`. Quando entrarem o Auth (Fase 3, schema `auth`) e o Storage (Fase 5, objetos fora do Postgres), revise o escopo do dump, o restore e este runbook.
