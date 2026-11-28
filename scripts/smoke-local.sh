#!/usr/bin/env bash
# Smoke full-stack local: sobe a API e o web já compilados e confere a capa (/) e o status (/status) por HTTP.
# Cenários BDD: docs/bdd/status.feature.md (tag @smoke-local) e docs/bdd/capa.feature.md (escrito no 02-14).
#
# Uso:
#   scripts/smoke-local.sh              # Postgres do compose + API + web: /status com commit, db "up" e ?detail=full; / é a capa
#   scripts/smoke-local.sh --degraded   # só o web, com a API fora do ar: /status degradado com 200 e a capa abre normalmente
set -euo pipefail

MODE=normal
case "${1:-}" in
  '') ;;
  --degraded) MODE=degraded ;;
  *)
    echo "uso: $0 [--degraded]" >&2
    exit 2
    ;;
esac

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT"

API_PORT=3101
WEB_PORT=3100
CLOSED_PORT=9
HOST=127.0.0.1
SMOKE_DB=blog_smoke
SMOKE_DATABASE_URL=postgresql://app_api:app_api_local_test@127.0.0.1:54329/blog_smoke
LOG_DIR=$(mktemp -d)
PIDS=()

cleanup() {
  local pid
  for pid in ${PIDS[@]+"${PIDS[@]}"}; do
    kill "$pid" 2>/dev/null || true
  done
  for pid in ${PIDS[@]+"${PIDS[@]}"}; do
    wait "$pid" 2>/dev/null || true
  done
  rm -rf "$LOG_DIR"
}
trap cleanup EXIT

wait_for() {
  # wait_for <url> <segundos> <nome>
  local url=$1 limit=$2 name=$3 i
  for ((i = 0; i < limit; i++)); do
    if curl -fsS -o /dev/null --max-time 2 "$url" 2>/dev/null; then
      return 0
    fi
    sleep 1
  done
  echo "FALHA: $name não respondeu em ${limit}s ($url)" >&2
  tail -n 40 "$LOG_DIR"/*.log >&2 || true
  return 1
}

fetch_page() {
  # fetch_page <caminho> <arquivo-de-saida>: exige HTTP 200
  local path=$1 out=$2 status
  status=$(curl -sS -o "$out" -w '%{http_code}' --max-time 15 "http://$HOST:$WEB_PORT$path")
  if [ "$status" != "200" ]; then
    echo "FALHA: GET $path devolveu HTTP $status" >&2
    exit 1
  fi
}

check_cover() {
  # check_cover <arquivo>: a capa tem o slogan e nunca o status técnico (ela não chama a API)
  if ! grep -q 'Uma nova face, uma nova história.' "$1"; then
    echo 'FALHA: / sem o slogan da capa' >&2
    exit 1
  fi
  if grep -q 'api-commit' "$1"; then
    echo 'FALHA: / mostra o status técnico (api-commit); a capa não depende da API' >&2
    exit 1
  fi
}

start_web() {
  # start_web <API_URL>
  (cd apps/web && API_URL="$1" exec node node_modules/next/dist/bin/next start -p "$WEB_PORT" -H "$HOST") >"$LOG_DIR/web.log" 2>&1 &
  PIDS+=("$!")
  wait_for "http://$HOST:$WEB_PORT/" 30 "web"
}

echo "==> build de @blog/shared e @blog/web"
pnpm --filter @blog/shared build
pnpm --filter @blog/web build

if [ "$MODE" = degraded ]; then
  echo "==> subindo só o web em $HOST:$WEB_PORT, com a API apontada para a porta fechada $CLOSED_PORT"
  start_web "http://$HOST:$CLOSED_PORT"

  echo "==> conferindo o /status degradado"
  fetch_page /status "$LOG_DIR/status.html"
  if ! grep -q 'data-testid="api-unavailable"' "$LOG_DIR/status.html"; then
    echo 'FALHA: /status sem data-testid="api-unavailable"' >&2
    exit 1
  fi
  if ! grep -q 'Recarregar status' "$LOG_DIR/status.html"; then
    echo 'FALHA: /status degradado sem o link "Recarregar status"' >&2
    exit 1
  fi

  echo "==> conferindo a capa com a API fora do ar"
  fetch_page / "$LOG_DIR/capa.html"
  check_cover "$LOG_DIR/capa.html"

  echo "SMOKE_LOCAL_DEGRADED_OK"
  exit 0
fi

echo "==> build de @blog/api"
pnpm --filter @blog/api build

GIT_SHA=$(git rev-parse --short HEAD)

# Postgres descartável do compose, com a baseline aplicada e o papel app_api (credencial só de teste local).
echo "==> subindo o Postgres de teste e preparando o banco $SMOKE_DB"
docker compose -f compose.test.yaml up -d --wait
TEST_DB_NAME=$SMOKE_DB node apps/api/scripts/prepare-test-db.mjs

echo "==> subindo a API em $HOST:$API_PORT (GIT_SHA=$GIT_SHA, banco como app_api)"
PORT=$API_PORT GIT_SHA=$GIT_SHA DATABASE_URL=$SMOKE_DATABASE_URL node apps/api/dist/main.js >"$LOG_DIR/api.log" 2>&1 &
PIDS+=("$!")
wait_for "http://$HOST:$API_PORT/health/live" 30 "API"

echo "==> subindo o web em $HOST:$WEB_PORT"
start_web "http://$HOST:$API_PORT"

echo "==> conferindo o /status"
fetch_page /status "$LOG_DIR/status.html"
if ! grep -q "data-testid=\"api-commit\">$GIT_SHA<" "$LOG_DIR/status.html"; then
  echo "FALHA: /status sem data-testid=\"api-commit\" com o SHA $GIT_SHA" >&2
  exit 1
fi

if ! grep -q 'data-testid="api-db">up<' "$LOG_DIR/status.html"; then
  echo 'FALHA: /status sem data-testid="api-db" com "up" (a API não leu o banco)' >&2
  exit 1
fi

echo "==> conferindo /status?detail=full"
fetch_page "/status?detail=full" "$LOG_DIR/status-full.html"
if ! grep -q 'href="/status"' "$LOG_DIR/status-full.html"; then
  echo 'FALHA: /status?detail=full sem o link "Ocultar detalhes" (href="/status")' >&2
  exit 1
fi
if ! grep -q 'data-testid="api-db-latency"' "$LOG_DIR/status-full.html"; then
  echo 'FALHA: /status?detail=full sem data-testid="api-db-latency"' >&2
  exit 1
fi

echo "==> conferindo a capa"
fetch_page / "$LOG_DIR/capa.html"
check_cover "$LOG_DIR/capa.html"

echo "SMOKE_LOCAL_OK"
