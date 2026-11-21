#!/usr/bin/env bash
# Smoke da imagem real da API (OPS-02, D-10): constrói a imagem linux/amd64, sobe o container
# ligado ao banco de PRODUÇÃO como `app_api` e confere health, /status, uid, memória e ausência
# de segredos na imagem. Com --publish, publica a imagem no GHCR como ghcr.io/{owner}/blog-no-law-api:{sha}.
#
# Uso:
#   bash scripts/smoke-container.sh             # constrói e prova a imagem localmente
#   bash scripts/smoke-container.sh --publish   # idem e publica; exige árvore limpa (DIRTY_TREE)
#
# Variáveis:
#   ENV_FILE      env file com DATABASE_URL (default: ~/.config/blog-no-law/production.env)
#   IMAGE_RECORD  onde gravar o SHA publicado (default: ~/.config/blog-no-law/published-image.sha)
#   IMAGE_OWNER   dono do pacote no GHCR e do repositório (default: jguii)
#
# Saídas: SMOKE_CONTAINER_OK, PUBLISHED {sha}, DIRTY_TREE, NON_CANONICAL_TLS_URL, SMOKE_FAIL {checagem}.
# Nunca imprime a URL do banco nem variáveis do ambiente: sem tracing do shell, e a DATABASE_URL
# chega ao container só pelo NOME (`-e DATABASE_URL`), nunca na linha de comando. Os logs do
# container também não são impressos (a mensagem crua de um driver pode carregar dados da conexão).
set -euo pipefail

PUBLISH=0
case "${1:-}" in
  '') ;;
  --publish) PUBLISH=1 ;;
  *)
    echo "uso: $0 [--publish]" >&2
    exit 2
    ;;
esac

cd "$(dirname "${BASH_SOURCE[0]}")/.."

OWNER=${IMAGE_OWNER:-jguii}
SOURCE_URL="https://github.com/${OWNER}/blog-no-law"
ENV_FILE=${ENV_FILE:-$HOME/.config/blog-no-law/production.env}
IMAGE_RECORD=${IMAGE_RECORD:-$HOME/.config/blog-no-law/published-image.sha}
HOST_PORT=3301
BASE="http://127.0.0.1:${HOST_PORT}"
SHA=$(git rev-parse HEAD)
IMAGE="blog-no-law-api:${SHA}"
CONTAINER="blog-no-law-api-smoke-$$"

# A tag {sha} descreve exatamente o conteúdo da imagem: a árvore do contexto de build precisa
# estar commitada (inclui arquivos não rastreados). Roda antes de ler o env file e de qualquer docker.
if [ "$PUBLISH" = "1" ]; then
  dirty=$(git status --porcelain -- apps packages package.json pnpm-lock.yaml pnpm-workspace.yaml .dockerignore)
  if [ -n "$dirty" ]; then
    echo "DIRTY_TREE"
    exit 1
  fi
fi

# Lê KEY de um env file sem executá-lo: só linhas KEY=valor, com aspas removidas.
read_env_value() {
  local key=$1 file=$2 line value
  line=$(grep -E "^${key}=" "$file" | head -n 1 || true)
  value=${line#"${key}="}
  value=${value#\'}
  value=${value%\'}
  value=${value#\"}
  value=${value%\"}
  printf '%s' "$value"
}

if [ ! -f "$ENV_FILE" ]; then
  echo "ENV_FILE não encontrado" >&2
  exit 2
fi
DB_URL=$(read_env_value DATABASE_URL "$ENV_FILE")
if [ -z "$DB_URL" ]; then
  echo "DATABASE_URL ausente no ENV_FILE" >&2
  exit 2
fi

# Forma canônica de TLS (01-06): termina em `?sslmode=require` e não tem nenhum outro parâmetro
# (nem caminho de certificado, que mudaria de sentido no container, onde o CWD é /app). Validada
# antes do build, sem imprimir a URL.
CANONICAL_SUFFIX='?sslmode=require'
case "$DB_URL" in
  postgres://* | postgresql://*) ;;
  *)
    echo "NON_CANONICAL_TLS_URL"
    exit 1
    ;;
esac
if [ "${DB_URL%"$CANONICAL_SUFFIX"}" = "$DB_URL" ] || [[ "${DB_URL%"$CANONICAL_SUFFIX"}" == *'?'* ]] || [[ "$DB_URL" == *'&'* ]]; then
  echo "NON_CANONICAL_TLS_URL"
  exit 1
fi

docker build --platform linux/amd64 -f apps/api/Dockerfile \
  --build-arg "GIT_SHA=${SHA}" --build-arg "SOURCE_URL=${SOURCE_URL}" \
  -t "$IMAGE" .

cleanup() {
  docker rm -f "$CONTAINER" > /dev/null 2>&1 || true
}
trap cleanup EXIT

# A variável vai ao ambiente só deste comando; `-e DATABASE_URL` herda o valor sem expô-lo em `ps`.
# --memory espelha o limite de 512 MB do plano Free da Render.
DATABASE_URL="$DB_URL" docker run -d --name "$CONTAINER" --platform linux/amd64 --memory 512m \
  -e DATABASE_URL -e "PORT=${HOST_PORT}" -e NODE_ENV=production \
  -p "127.0.0.1:${HOST_PORT}:${HOST_PORT}" "$IMAGE" > /dev/null

fail() {
  echo "SMOKE_FAIL $1"
  exit 1
}

up=0
for ((i = 0; i < 60; i++)); do
  if curl -fsS -o /dev/null --max-time 2 "${BASE}/health/live" 2> /dev/null; then
    up=1
    break
  fi
  if [ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER" 2> /dev/null || echo false)" != "true" ]; then
    break
  fi
  sleep 1
done
[ "$up" = "1" ] || fail health_live

ready=$(curl -sS --max-time 15 -o /dev/null -w '%{http_code}' "${BASE}/health/ready" || echo 000)
[ "$ready" = "200" ] || fail "health_ready ${ready}"

status_body=$(curl -fsS --max-time 15 "${BASE}/status") || fail status
read -r got_commit got_db < <(printf '%s' "$status_body" | node -e "
let s = '';
process.stdin.on('data', (d) => (s += d)).on('end', () => {
  try {
    const j = JSON.parse(s);
    process.stdout.write(String(j.commit) + ' ' + String(j.db) + '\n');
  } catch {
    process.stdout.write('invalid invalid\n');
  }
});
")
[ "$got_commit" = "$SHA" ] || fail status_commit
[ "$got_db" = "up" ] || fail status_db

uid=$(docker exec "$CONTAINER" id -u)
[ "$uid" != "0" ] || fail uid_root

mem_line=$(docker stats --no-stream --format '{{.MemUsage}}' "$CONTAINER")
mem_mib=$(printf '%s' "$mem_line" | node -e "
let s = '';
process.stdin.on('data', (d) => (s += d)).on('end', () => {
  const m = /^\s*([0-9.]+)\s*([KMG]i?B)/i.exec(s);
  if (!m) { process.stdout.write('9999'); return; }
  const factor = { kib: 1 / 1024, kb: 1 / 1024, mib: 1, mb: 1, gib: 1024, gb: 1024 }[m[2].toLowerCase()];
  process.stdout.write(String(Math.round(parseFloat(m[1]) * factor)));
});
")
[ "$mem_mib" -lt 512 ] || fail "memory ${mem_mib}MiB"

env_files=$(docker exec "$CONTAINER" find /app -name '.env*' 2> /dev/null || true)
[ -z "$env_files" ] || fail env_file_in_image

# Só os NOMES das variáveis da imagem são inspecionados; os valores nunca saem do docker.
image_env_names=$(docker image inspect --format '{{range .Config.Env}}{{println .}}{{end}}' "$IMAGE" | sed 's/=.*//')
if printf '%s\n' "$image_env_names" | grep -qiE '^(DATABASE_URL|SENTRY_DSN|.*HOOK.*)$'; then
  fail secret_in_image_env
fi

echo "SMOKE_CONTAINER_OK ${SHA} mem=${mem_mib}MiB uid=${uid}"

if [ "$PUBLISH" = "1" ]; then
  REMOTE="ghcr.io/${OWNER}/blog-no-law-api:${SHA}"
  gh auth token | docker login ghcr.io -u "$OWNER" --password-stdin > /dev/null
  docker tag "$IMAGE" "$REMOTE"
  docker push "$REMOTE" > /dev/null
  docker logout ghcr.io > /dev/null 2>&1 || true
  mkdir -p "$(dirname "$IMAGE_RECORD")"
  printf '%s\n' "$SHA" > "$IMAGE_RECORD"
  echo "PUBLISHED ${SHA}"
fi
