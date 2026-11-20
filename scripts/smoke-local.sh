#!/usr/bin/env bash
# Smoke full-stack local: sobe a API e o web já compilados e confere a home por HTTP.
# Cenários BDD: docs/bdd/home.feature.md (tag @smoke-local).
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT"

API_PORT=3101
WEB_PORT=3100
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

echo "==> build de @blog/shared, @blog/api e @blog/web"
pnpm --filter @blog/shared build
pnpm --filter @blog/api build
pnpm --filter @blog/web build

GIT_SHA=$(git rev-parse --short HEAD)

echo "==> subindo a API em $HOST:$API_PORT (GIT_SHA=$GIT_SHA)"
PORT=$API_PORT GIT_SHA=$GIT_SHA node apps/api/dist/main.js >"$LOG_DIR/api.log" 2>&1 &
PIDS+=("$!")
wait_for "http://$HOST:$API_PORT/health/live" 30 "API"

echo "==> subindo o web em $HOST:$WEB_PORT"
(cd apps/web && API_URL="http://$HOST:$API_PORT" exec node node_modules/next/dist/bin/next start -p "$WEB_PORT" -H "$HOST") >"$LOG_DIR/web.log" 2>&1 &
PIDS+=("$!")
wait_for "http://$HOST:$WEB_PORT/" 30 "web"

echo "==> conferindo a home"
BODY="$LOG_DIR/home.html"
STATUS=$(curl -sS -o "$BODY" -w '%{http_code}' --max-time 10 "http://$HOST:$WEB_PORT/")
if [ "$STATUS" != "200" ]; then
  echo "FALHA: GET / devolveu HTTP $STATUS" >&2
  exit 1
fi
if ! grep -q "data-testid=\"api-commit\">$GIT_SHA<" "$BODY"; then
  echo "FALHA: HTML sem data-testid=\"api-commit\" com o SHA $GIT_SHA" >&2
  exit 1
fi

echo "SMOKE_LOCAL_OK"
