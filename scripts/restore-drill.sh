#!/usr/bin/env bash
# Restore drill cronometrado (OPS-03, D-07): baixa o backup cifrado mais recente do repositório privado,
# decifra com a chave privada offline do autor e restaura num Postgres 17 descartável, só em 127.0.0.1.
# O texto em claro do dump só passa pelo pipe `age -d | pg_restore`; nunca é gravado em disco.
#
# Depois do restore confere o que o runtime precisa: heartbeat com 1 linha, a baseline em
# _prisma_migrations, RLS e policy em heartbeat, os privilégios vindos do próprio backup (app_api com
# SELECT, anon sem) e uma leitura real de heartbeat conectada como app_api, com senha, por TCP.
#
# Saídas: `RESTORE_OK tag={tag} seconds={n}` (n = do download ao fim das checagens) ou
# `RESTORE_FAIL {checagem}` com saída 1. O container e o diretório temporário somem no trap.
# Procedimento e registro dos drills: docs/runbooks/backup-restore.md.
#
# Variáveis: BACKUP_REPO (padrão: a variável BACKUP_REPO do Environment production), AGE_KEY (padrão:
# ~/.config/blog-no-law/backup.age.key), DRILL_PORT (padrão 54330).
set -euo pipefail

AGE_KEY="${AGE_KEY:-$HOME/.config/blog-no-law/backup.age.key}"
DRILL_PORT="${DRILL_PORT:-54330}"
DRILL_IMAGE='postgres:17'
APP_REPO='jguii/blog-no-law'

# Papéis da plataforma Supabase citados em privilégios do dump (por exemplo nos privilégios padrão do
# schema) que não viajam num dump de schema. Nascem NOLOGIN antes do restore. Lista registrada em
# docs/runbooks/backup-restore.md.
DRILL_PLATFORM_ROLES=()

fail() {
  echo "RESTORE_FAIL $1"
  exit 1
}

# A chave vem antes de qualquer chamada ao gh ou ao docker: sem ela nada pode ser decifrado.
[ -f "$AGE_KEY" ] && [ -r "$AGE_KEY" ] || fail age_key
command -v age > /dev/null || fail age_missing
command -v docker > /dev/null || fail docker_missing
command -v gh > /dev/null || fail gh_missing

WORK=$(mktemp -d)
CONTAINER=''
cleanup() {
  if [ -n "$CONTAINER" ]; then
    docker rm -f "$CONTAINER" > /dev/null 2>&1 || true
  fi
  rm -rf "$WORK"
}
trap cleanup EXIT

if [ -z "${BACKUP_REPO:-}" ]; then
  BACKUP_REPO=$(gh variable get BACKUP_REPO --env production --repo "$APP_REPO") || fail backup_repo
fi

START=$(date +%s)

# A ordem vem da data de publicação: a outra data de uma release é a do commit alvo da tag, igual para
# todos os backups deste repositório.
TAG=$(gh release list --repo "$BACKUP_REPO" --exclude-drafts --limit 200 --json tagName,publishedAt \
  --jq '[.[] | select(.tagName | startswith("db-"))] | sort_by(.publishedAt) | last | .tagName // empty') \
  || fail release_list
[ -n "$TAG" ] || fail release_list
echo "Backup mais recente: $TAG"

gh release download "$TAG" --repo "$BACKUP_REPO" --pattern '*.dump.age' --dir "$WORK" > /dev/null \
  || fail release_download
FILES=("$WORK"/*.dump.age)
[ "${#FILES[@]}" -eq 1 ] && [ -s "${FILES[0]}" ] || fail release_download
FILE=${FILES[0]}

# Senha de uso único do app_api neste container; vai ao psql por nome (-e PGPASSWORD).
PGPASSWORD=$(od -An -tx1 -N16 /dev/urandom | tr -d ' \n')
export PGPASSWORD

# Conexões TCP exigem senha (scram); o socket local fica em trust para o superusuário do drill.
CONTAINER=$(docker run -d --rm \
  -p "127.0.0.1:$DRILL_PORT:5432" \
  -e POSTGRES_PASSWORD=drill \
  -e POSTGRES_INITDB_ARGS='--auth-host=scram-sha-256 --auth-local=trust' \
  "$DRILL_IMAGE") || fail postgres_start

# Pela interface TCP: o servidor temporário da inicialização da imagem só escuta no socket.
READY=0
for _ in $(seq 1 60); do
  if docker exec "$CONTAINER" pg_isready -q -h 127.0.0.1 -U postgres > /dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 1
done
[ "$READY" -eq 1 ] || fail postgres_start

# Papéis não entram num dump de schema. Os da baseline nascem antes do restore com os mesmos
# atributos da migration (o app_api com a senha de uso único).
ROLES_SQL="CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN;"
ROLES_SQL+=" CREATE ROLE app_api LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT PASSWORD '$PGPASSWORD';"
for ROLE in "${DRILL_PLATFORM_ROLES[@]}"; do
  ROLES_SQL+=" CREATE ROLE $ROLE NOLOGIN;"
done
docker exec "$CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -qc "$ROLES_SQL" > /dev/null \
  || fail create_roles

# O texto em claro só passa pelo pipe. Os GRANT/REVOKE do dump são restaurados (o runtime depende deles).
set +e
age -d -i "$AGE_KEY" "$FILE" \
  | docker exec -i "$CONTAINER" pg_restore -U postgres -d postgres --no-owner --exit-on-error
STATUS=("${PIPESTATUS[@]}")
set -e
[ "${STATUS[1]}" -eq 0 ] || fail pg_restore
[ "${STATUS[0]}" -eq 0 ] || fail age_decrypt

# Cada checagem é uma consulta que devolve um único valor.
check() {
  local name=$1 expected=$2 sql=$3 got
  got=$(docker exec "$CONTAINER" psql -U postgres -d postgres -tAc "$sql" 2> /dev/null) || got=''
  [ "$got" = "$expected" ] || fail "$name"
}

check heartbeat_rows 1 'select count(*) from public.heartbeat'
check baseline_migration 1 "select count(*) from public._prisma_migrations where migration_name like '%\_baseline' and finished_at is not null"
check rls_heartbeat t "select relrowsecurity from pg_class where oid = 'public.heartbeat'::regclass"
check policy_heartbeat 1 "select count(*) from pg_policies where schemaname = 'public' and tablename = 'heartbeat' and policyname = 'heartbeat_app_api_select'"
check app_api_select t "select has_table_privilege('app_api', 'public.heartbeat', 'SELECT')"
check anon_denied f "select has_table_privilege('anon', 'public.heartbeat', 'SELECT')"

# Leitura como no runtime: login com senha por TCP, grant restaurado do backup e policy do RLS juntos.
READ=$(docker exec -e PGPASSWORD "$CONTAINER" \
  psql -h 127.0.0.1 -U app_api -d postgres -tAc 'select id from public.heartbeat' 2> /dev/null) || READ=''
[ "$READ" = 1 ] || fail app_api_read

echo "RESTORE_OK tag=$TAG seconds=$(($(date +%s) - START))"
