#!/usr/bin/env bash
# Smoke anônimo do PostgREST (Data API do Supabase): com a chave publishable (pública por desenho),
# nenhuma linha de `heartbeat` nem de `_prisma_migrations` pode ser lida (SEC-04, T-01-51).
#
# Passa se, para cada tabela, o HTTP não for 200 ou o corpo for exatamente `[]`.
# Variáveis: SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY no ambiente, ou ENV_FILE apontando para um
# env file com as duas linhas (valores entre aspas simples são aceitos).
# Nunca imprime a chave. Sem `set -x`.
set -euo pipefail

TABLES=(heartbeat _prisma_migrations)

# Lê KEY de um env file sem executá-lo (o arquivo não é "sourced"): só linhas KEY=valor.
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

if { [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_PUBLISHABLE_KEY:-}" ]; } && [ -n "${ENV_FILE:-}" ]; then
  if [ ! -f "$ENV_FILE" ]; then
    echo "ENV_FILE não encontrado" >&2
    exit 2
  fi
  SUPABASE_URL=${SUPABASE_URL:-$(read_env_value SUPABASE_URL "$ENV_FILE")}
  SUPABASE_PUBLISHABLE_KEY=${SUPABASE_PUBLISHABLE_KEY:-$(read_env_value SUPABASE_PUBLISHABLE_KEY "$ENV_FILE")}
fi

if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_PUBLISHABLE_KEY:-}" ]; then
  echo "defina SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY (ou ENV_FILE)" >&2
  exit 2
fi

BASE=${SUPABASE_URL%/}
BODY=$(mktemp)
trap 'rm -f "$BODY"' EXIT

for table in "${TABLES[@]}"; do
  # --config - mantém a chave fora da linha de comando (não aparece em `ps`).
  code=$(curl -sS --max-time 20 -o "$BODY" -w '%{http_code}' --config - <<CURL_CONFIG
url = "${BASE}/rest/v1/${table}?select=*"
header = "apikey: ${SUPABASE_PUBLISHABLE_KEY}"
header = "Authorization: Bearer ${SUPABASE_PUBLISHABLE_KEY}"
CURL_CONFIG
  )
  if [ "$code" = "200" ] && [ "$(tr -d '[:space:]' < "$BODY")" != "[]" ]; then
    echo "LEAK ${table} ${code}"
    exit 1
  fi
  # Código de erro do PostgREST (ex.: 42501 = permission denied), útil no diagnóstico; não é segredo.
  pgrst_code=$(sed -nE 's/.*"code":"([A-Za-z0-9_]+)".*/\1/p' "$BODY" | head -n 1)
  echo "OK ${table} ${code}${pgrst_code:+ code=${pgrst_code}}"
done

echo "POSTGREST_ANON_BLOCKED"
