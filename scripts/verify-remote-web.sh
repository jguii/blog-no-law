#!/usr/bin/env bash
# Verificação HTTPS da identidade visual publicada do web (VIS-01..04, critério 5 da Fase 2): a capa com o
# tema escuro e o slogan, a imagem de preview, os ícones, os cabeçalhos de segurança, o noindex de /kit e
# /status e as páginas institucionais. Serve à produção na Vercel e a um `next start` local.
#
# Uso:
#   bash scripts/verify-remote-web.sh {base_url}
#
# Variáveis:
#   VERIFY_TIMEOUT_S  tempo máximo esperando a capa trazer o slogan e o tema escuro (default 300; a Vercel
#                     leva alguns minutos para promover o deploy)
#   VERIFY_POLL_S     intervalo entre consultas (default 10)
#
# Saídas: REMOTE_WEB_OK {base_url}, ou REMOTE_WEB_FAIL {shell|csp|xframe|og_image|icon|noindex:/rota|page:/rota}
# com saída 1. Uso errado sai com 2. Só lê respostas públicas; imprime apenas rota e item, nunca corpo de
# resposta; não recebe nem imprime segredo. Sem tracing do shell.
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "uso: $0 {base_url}" >&2
  exit 2
fi

BASE=${1%/}
SLOGAN='Uma nova face, uma nova história.'
TIMEOUT_S=${VERIFY_TIMEOUT_S:-300}
POLL_S=${VERIFY_POLL_S:-10}
CURL_MAX_TIME=20

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
HEADERS="$WORK/headers"
BODY="$WORK/body"

fail() {
  echo "REMOTE_WEB_FAIL $1"
  exit 1
}

# Busca {caminho} em {BASE}, guardando cabeçalhos e corpo em arquivos (nunca no terminal). Imprime o código
# HTTP; falha de rede conta como "000", sem derrubar o script.
fetch() {
  curl -sS --max-time "$CURL_MAX_TIME" -D "$HEADERS" -o "$BODY" -w '%{http_code}' "${BASE}$1" 2> /dev/null || true
}

# Valor do tipo de conteúdo da última resposta, sem parâmetros (charset) e em minúsculas.
content_type() {
  grep -i '^content-type:' "$HEADERS" | tail -n 1 | tr -d '\r' | sed -E 's/^[^:]*:[[:space:]]*//; s/;.*$//' | tr '[:upper:]' '[:lower:]' || true
}

# Lê o `content` da meta `og:image` do HTML da capa com node (independe da ordem dos atributos). Vazio se não houver.
og_image_url() {
  node -e "
const fs = require('node:fs');
const html = fs.readFileSync(process.argv[1], 'utf8');
for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
  if (!/property=\"og:image\"/i.test(tag)) continue;
  const content = tag.match(/content=\"([^\"]*)\"/i);
  if (content) process.stdout.write(content[1].replace(/&amp;/g, '&'));
  break;
}
" "$BODY"
}

# 1. A capa com o tema escuro e o slogan, por polling: 5xx, conexão recusada e deploy ainda antigo contam
# como "ainda não". Os cabeçalhos desta mesma resposta são os conferidos em seguida.
deadline=$(($(date +%s) + TIMEOUT_S))
matched=0
while :; do
  code=$(fetch /)
  if [ "$code" = "200" ] && grep -qF 'data-theme="dark"' "$BODY" && grep -qF "$SLOGAN" "$BODY"; then
    matched=1
    break
  fi
  [ "$(date +%s)" -lt "$deadline" ] || break
  sleep "$POLL_S"
done
[ "$matched" = "1" ] || fail shell

# 2. Cabeçalhos de segurança da capa (T-02-04): CSP sem enquadramento por terceiros e X-Frame-Options.
grep -iE "^content-security-policy:.*frame-ancestors[[:space:]]+'none'" "$HEADERS" > /dev/null || fail csp
grep -iE '^x-frame-options:[[:space:]]*deny' "$HEADERS" > /dev/null || fail xframe

# 3. A imagem de preview: `og:image` absoluto (o Discord e o WhatsApp exigem URL absoluta), cujo caminho,
# buscado no próprio host verificado, responde image/jpeg.
og=$(og_image_url)
case "$og" in
  https://*) ;;
  *) fail og_image ;;
esac
og_path=/${og#https://*/}
[ "$(fetch "$og_path")" = "200" ] || fail og_image
[ "$(content_type)" = "image/jpeg" ] || fail og_image

# 4. Ícones: o SVG dos dragões, o favicon.ico de reserva e o ícone da tela inicial.
[ "$(fetch /icon.svg)" = "200" ] || fail icon
[ "$(content_type)" = "image/svg+xml" ] || fail icon
[ "$(fetch /favicon.ico)" = "200" ] || fail icon
[ "$(fetch /apple-icon.png)" = "200" ] || fail icon

# 5. /kit e /status ficam públicos, mas fora dos buscadores (D-22).
for route in /kit /status; do
  [ "$(fetch "$route")" = "200" ] || fail "page:${route}"
  grep -iE '^x-robots-tag:.*noindex' "$HEADERS" > /dev/null || fail "noindex:${route}"
done

# 6. Páginas institucionais: 200 e um título (h1) no HTML.
for route in /sobre /regras /privacidade; do
  [ "$(fetch "$route")" = "200" ] || fail "page:${route}"
  grep -qi '<h1' "$BODY" || fail "page:${route}"
done

echo "REMOTE_WEB_OK ${BASE}"
