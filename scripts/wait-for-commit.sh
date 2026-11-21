#!/usr/bin/env bash
# Espera a API publicada servir um commit (OPS-02, D-10): polling de /status até `commit` ser o SHA
# esperado. É o passo "verify" do Deploy API e a prova de ponta a ponta de que a Render trocou de imagem.
#
# Uso:
#   bash scripts/wait-for-commit.sh {base_url} {sha} {limite_s}
#
# Variáveis:
#   WAIT_POLL_S  intervalo entre consultas, em segundos (default 10)
#
# Saídas: `COMMIT_LIVE {sha}` com saída 0, ou `COMMIT_TIMEOUT {sha}` com saída 1 ao estourar o limite.
# 5xx, conexão recusada ou encerrada e timeout contam como "ainda não" (a Render Free acorda em cerca de
# 1 minuto): a falha do curl no polling não derruba o script. Só lê respostas públicas; não recebe nem
# imprime segredo. Sem tracing do shell nem modo verboso do curl.
set -euo pipefail

if [ "$#" -ne 3 ]; then
  echo "uso: $0 {base_url} {sha} {limite_s}" >&2
  exit 2
fi

BASE=${1%/}
SHA=$2
LIMIT_S=$3
POLL_S=${WAIT_POLL_S:-10}
CURL_MAX_TIME=20

case "$LIMIT_S" in
  '' | *[!0-9]*)
    echo "o limite precisa ser um número inteiro de segundos" >&2
    exit 2
    ;;
esac

BODY=$(mktemp)
trap 'rm -f "$BODY"' EXIT

# Lê o campo `commit` do JSON de /status com node (jq pode faltar no WSL). Imprime "invalid" se não for JSON.
commit_field() {
  node -e "
const fs = require('node:fs');
try {
  process.stdout.write(String(JSON.parse(fs.readFileSync(process.argv[1], 'utf8')).commit));
} catch {
  process.stdout.write('invalid');
}
" "$BODY"
}

deadline=$(($(date +%s) + LIMIT_S))
while :; do
  : > "$BODY"
  code=$(curl -sS --connect-timeout 5 --max-time "$CURL_MAX_TIME" -o "$BODY" -w '%{http_code}' "${BASE}/status" 2> /dev/null || true)
  if [ "$code" = "200" ] && [ "$(commit_field)" = "$SHA" ]; then
    echo "COMMIT_LIVE ${SHA}"
    exit 0
  fi
  [ "$(date +%s)" -lt "$deadline" ] || break
  sleep "$POLL_S"
done

echo "COMMIT_TIMEOUT ${SHA}"
exit 1
