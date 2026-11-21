#!/usr/bin/env bash
# Verificação HTTPS de uma API publicada (OPS-02, D-01, D-02, D-11): as mesmas asserções do
# smoke-container.sh, agora contra a URL pública da Render ou da Railway.
#
# Uso:
#   bash scripts/verify-remote-api.sh {base_url} {sha}                  # Render: /_debug/error = 404
#   bash scripts/verify-remote-api.sh {base_url} {sha} --expect-debug   # Railway de prova: /_debug/error = 500
#
# Variáveis:
#   VERIFY_TIMEOUT_S  tempo máximo esperando /status mostrar o SHA (default 300, cobre o cold start da Render)
#   VERIFY_POLL_S     intervalo entre consultas (default 10)
#
# Saídas: REMOTE_API_OK {base_url}, ou REMOTE_API_FAIL {commit|db|ready|csp|nosniff|debug_route} com saída 1.
# Só lê respostas públicas; não recebe nem imprime segredo. Sem tracing do shell.
set -euo pipefail

if [ "$#" -lt 2 ] || [ "$#" -gt 3 ]; then
  echo "uso: $0 {base_url} {sha} [--expect-debug]" >&2
  exit 2
fi

BASE=${1%/}
SHA=$2
EXPECT_DEBUG=0
case "${3:-}" in
  '') ;;
  --expect-debug) EXPECT_DEBUG=1 ;;
  *)
    echo "uso: $0 {base_url} {sha} [--expect-debug]" >&2
    exit 2
    ;;
esac

TIMEOUT_S=${VERIFY_TIMEOUT_S:-300}
POLL_S=${VERIFY_POLL_S:-10}
CURL_MAX_TIME=20

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
HEADERS="$WORK/headers"
BODY="$WORK/body"

fail() {
  echo "REMOTE_API_FAIL $1"
  exit 1
}

# Lê um campo do JSON de /status com node (jq pode faltar no WSL). Imprime "invalid" se não for JSON.
json_field() {
  node -e "
const fs = require('node:fs');
try {
  const value = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'))[process.argv[2]];
  process.stdout.write(String(value));
} catch {
  process.stdout.write('invalid');
}
" "$BODY" "$1"
}

# Polling de /status até o commit publicado ser o esperado. 5xx, conexão recusada e timeout contam
# como "ainda não" (a Render acorda em cerca de 1 minuto); a falha do curl não derruba o script.
deadline=$(($(date +%s) + TIMEOUT_S))
matched=0
while :; do
  code=$(curl -sS --max-time "$CURL_MAX_TIME" -D "$HEADERS" -o "$BODY" -w '%{http_code}' "${BASE}/status" 2> /dev/null || true)
  if [ "$code" = "200" ] && [ "$(json_field commit)" = "$SHA" ]; then
    matched=1
    break
  fi
  [ "$(date +%s)" -lt "$deadline" ] || break
  sleep "$POLL_S"
done
[ "$matched" = "1" ] || fail commit

[ "$(json_field db)" = "up" ] || fail db

ready=$(curl -sS --max-time "$CURL_MAX_TIME" -o /dev/null -w '%{http_code}' "${BASE}/health/ready" 2> /dev/null || true)
[ "$ready" = "200" ] || fail ready

# Headers do Helmet, lidos da resposta de /status que trouxe o SHA certo.
grep -iE "^content-security-policy:.*default-src[[:space:]]+'none'" "$HEADERS" > /dev/null || fail csp
grep -iE '^x-content-type-options:[[:space:]]*nosniff' "$HEADERS" > /dev/null || fail nosniff

# Rota de debug: 404 em produção (T-01-54); 500 só no boot temporário da Railway, que dispara o evento do Sentry.
debug_code=$(curl -sS --max-time "$CURL_MAX_TIME" -o /dev/null -w '%{http_code}' "${BASE}/_debug/error" 2> /dev/null || true)
if [ "$EXPECT_DEBUG" = "1" ]; then
  [ "$debug_code" = "500" ] || fail debug_route
else
  [ "$debug_code" = "404" ] || fail debug_route
fi

echo "REMOTE_API_OK ${BASE}"
