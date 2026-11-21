#!/usr/bin/env bash
# Smoke anônimo do PostgREST (Data API do Supabase): nenhuma linha de `heartbeat` nem de
# `_prisma_migrations` pode ser lida com a chave publishable (pública por desenho) nem sem chave
# alguma (SEC-04, D-14, T-01-51, T-01-59).
#
# Modo de produção (padrão, 01-06): por tabela, passa se o HTTP não for 200 ou se o corpo for exatamente
# `[]`; 200 com linhas imprime `LEAK {tabela} {código}` e sai 1.
# Modo estrito (POSTGREST_STRICT=1, portão da CI): só aceita 401/403 com SQLSTATE `42501` no corpo
# (negação vinda do Postgres) ou 200 com corpo exatamente `[]`; qualquer outra resposta imprime
# `INCONCLUSIVE {tabela} {código}` e sai 1 (um PostgREST sem banco, 503, não pode passar como bloqueado).
#
# Variáveis:
#   POSTGREST_URL            raiz REST (default: $SUPABASE_URL/rest/v1). Quando definida, o script não
#                            exige SUPABASE_URL nem lê ENV_FILE.
#   SUPABASE_URL             obrigatória só sem POSTGREST_URL (ou via ENV_FILE).
#   SUPABASE_PUBLISHABLE_KEY chave publishable; sem POSTGREST_URL é obrigatória (ou via ENV_FILE). Quando
#                            ausente, a requisição é anônima de verdade (sem apikey nem Authorization).
#   ENV_FILE                 env file com SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY (aspas simples aceitas).
#   TABLES                   lista separada por espaço (default: heartbeat _prisma_migrations).
#   POSTGREST_STRICT         1 liga o modo estrito.
#   SMOKE_CURL_MAX_TIME      limite total de cada curl, em segundos (default 20).
# Nunca imprime a chave nem o corpo das respostas. Sem tracing do shell nem modo verboso do curl.
set -euo pipefail

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

if [ -z "${POSTGREST_URL:-}" ]; then
  if { [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_PUBLISHABLE_KEY:-}" ]; } && [ -n "${ENV_FILE:-}" ]; then
    if [ ! -f "$ENV_FILE" ]; then
      echo "ENV_FILE não encontrado" >&2
      exit 2
    fi
    SUPABASE_URL=${SUPABASE_URL:-$(read_env_value SUPABASE_URL "$ENV_FILE")}
    SUPABASE_PUBLISHABLE_KEY=${SUPABASE_PUBLISHABLE_KEY:-$(read_env_value SUPABASE_PUBLISHABLE_KEY "$ENV_FILE")}
  fi

  if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_PUBLISHABLE_KEY:-}" ]; then
    echo "defina POSTGREST_URL, ou SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY (ou ENV_FILE)" >&2
    exit 2
  fi
  POSTGREST_URL="${SUPABASE_URL%/}/rest/v1"
fi

BASE=${POSTGREST_URL%/}
KEY=${SUPABASE_PUBLISHABLE_KEY:-}
STRICT=${POSTGREST_STRICT:-0}
read -r -a TABLE_LIST <<< "${TABLES:-heartbeat _prisma_migrations}"

BODY=$(mktemp)
trap 'rm -f "$BODY"' EXIT

# Config do curl pela entrada padrão (printf é builtin): a chave fica fora da linha de comando
# (não aparece em `ps`). Sem chave, nenhum header de autenticação vai.
curl_config() {
  printf 'url = "%s/%s?select=*"\n' "$BASE" "$1"
  if [ -n "$KEY" ]; then
    printf 'header = "apikey: %s"\n' "$KEY"
    printf 'header = "Authorization: Bearer %s"\n' "$KEY"
  fi
}

for table in "${TABLE_LIST[@]}"; do
  # Falha do curl (rede, timeout) encerra o script via `set -e`: nunca conta como bloqueio.
  code=$(curl_config "$table" | curl -sS --connect-timeout 5 --max-time "${SMOKE_CURL_MAX_TIME:-20}" -o "$BODY" -w '%{http_code}' --config -)
  compact=$(tr -d '[:space:]' < "$BODY")

  if [ "$code" = "200" ] && [ "$compact" != "[]" ]; then
    echo "LEAK ${table} ${code}"
    exit 1
  fi

  if [ "$STRICT" = "1" ]; then
    blocked=0
    if [ "$code" = "200" ] && [ "$compact" = "[]" ]; then
      blocked=1
    elif { [ "$code" = "401" ] || [ "$code" = "403" ]; } && printf '%s' "$compact" | grep -q '"code":"42501"'; then
      blocked=1
    fi
    if [ "$blocked" != "1" ]; then
      echo "INCONCLUSIVE ${table} ${code}"
      exit 1
    fi
  fi

  # Código de erro do PostgREST (ex.: 42501 = permission denied), útil no diagnóstico; não é segredo.
  pgrst_code=$(printf '%s' "$compact" | sed -nE 's/.*"code":"([A-Za-z0-9_]+)".*/\1/p' | head -n 1)
  echo "OK ${table} ${code}${pgrst_code:+ code=${pgrst_code}}"
done

echo "POSTGREST_ANON_BLOCKED"
