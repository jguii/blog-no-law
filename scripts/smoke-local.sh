#!/usr/bin/env bash
# Smoke full-stack local: sobe a API e o web já compilados e confere a home por HTTP.
# Cenários BDD: docs/bdd/home.feature.md (tag @smoke-local).
#
# Uso:
#   scripts/smoke-local.sh              # API + web: home com o commit da API e /?detail=full
#   scripts/smoke-local.sh --degraded   # só o web, com a API fora do ar: home degradada com 200
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

fetch_home() {
  # fetch_home <caminho> <arquivo-de-saida>: exige HTTP 200
  local path=$1 out=$2 status
  status=$(curl -sS -o "$out" -w '%{http_code}' --max-time 15 "http://$HOST:$WEB_PORT$path")
  if [ "$status" != "200" ]; then
    echo "FALHA: GET $path devolveu HTTP $status" >&2
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

  echo "==> conferindo a home degradada"
  fetch_home / "$LOG_DIR/home.html"
  if ! grep -q 'data-testid="api-unavailable"' "$LOG_DIR/home.html"; then
    echo 'FALHA: HTML sem data-testid="api-unavailable"' >&2
    exit 1
  fi
  echo "SMOKE_LOCAL_DEGRADED_OK"
  exit 0
fi

echo "==> build de @blog/api"
pnpm --filter @blog/api build

GIT_SHA=$(git rev-parse --short HEAD)

echo "==> subindo a API em $HOST:$API_PORT (GIT_SHA=$GIT_SHA)"
PORT=$API_PORT GIT_SHA=$GIT_SHA node apps/api/dist/main.js >"$LOG_DIR/api.log" 2>&1 &
PIDS+=("$!")
wait_for "http://$HOST:$API_PORT/health/live" 30 "API"

echo "==> subindo o web em $HOST:$WEB_PORT"
start_web "http://$HOST:$API_PORT"

echo "==> conferindo a home"
fetch_home / "$LOG_DIR/home.html"
if ! grep -q "data-testid=\"api-commit\">$GIT_SHA<" "$LOG_DIR/home.html"; then
  echo "FALHA: HTML sem data-testid=\"api-commit\" com o SHA $GIT_SHA" >&2
  exit 1
fi

echo "==> conferindo /?detail=full"
fetch_home "/?detail=full" "$LOG_DIR/home-full.html"
if ! grep -q 'href="/"' "$LOG_DIR/home-full.html"; then
  echo 'FALHA: /?detail=full sem o link "Ocultar detalhes" (href="/")' >&2
  exit 1
fi

echo "SMOKE_LOCAL_OK"
