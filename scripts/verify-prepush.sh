#!/usr/bin/env bash
# Prova de ponta a ponta que o hook de pre-push bloqueia o que deve bloquear (QA-03, D-09).
# Usa um remote bare descartável. As sondas são arquivos não rastreados, nunca commits, porque
# o hook roda sobre a working tree.
#
# Casos: A teste falhando, B erro de tipo (ambos bloqueados), C push limpo (passa),
#        D push repetido sem mudanças (passa, com FULL TURBO).
set -euo pipefail

ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"

REMOTE=prepush-verify
TMP=$(mktemp -d)
STATUS_BEFORE=$(git status --porcelain)

PROBE_TEST=packages/shared/src/__prepush_probe.test.ts
PROBE_TYPE=packages/shared/src/__prepush_probe.ts
PROBE_FILES=("$PROBE_TEST" "$PROBE_TYPE")

cleanup() {
  rm -f "${PROBE_FILES[@]}"
  git remote remove "$REMOTE" 2>/dev/null || true
  rm -rf "$TMP"
}
trap cleanup EXIT

for probe in "${PROBE_FILES[@]}"; do
  if [ -e "$probe" ]; then
    echo "FATAL: sobrou um arquivo de sonda de uma execução anterior: $probe" >&2
    exit 1
  fi
done

git init --bare --quiet "$TMP/remote.git"
git remote add "$REMOTE" "$TMP/remote.git"

# Roda o push e guarda saída e código em $PUSH_OUT e $PUSH_RC.
PUSH_OUT=""
PUSH_RC=0
push_to() {
  local branch=$1
  set +e
  PUSH_OUT=$(git push "$REMOTE" "HEAD:refs/heads/$branch" 2>&1)
  PUSH_RC=$?
  set -e
}

expect_blocked() {
  local case_name=$1 branch=$2
  push_to "$branch"
  if [ "$PUSH_RC" -eq 0 ]; then
    echo "FAIL: caso $case_name: o push com sonda quebrada passou (deveria ser bloqueado)" >&2
    exit 1
  fi
  if ! printf '%s' "$PUSH_OUT" | grep -q '__prepush_probe'; then
    echo "FAIL: caso $case_name: o push foi bloqueado, mas a saída não cita a sonda (outro motivo?)" >&2
    printf '%s\n' "$PUSH_OUT" | tail -40 >&2
    exit 1
  fi
  echo "ok: caso $case_name bloqueado (código $PUSH_RC)"
}

# Caso A: teste falhando.
cat > "$PROBE_TEST" <<'EOF'
import { expect, test } from 'vitest';

test('sonda do pre-push: falha de propósito', () => {
  expect(1).toBe(2);
});
EOF
expect_blocked A probe-a
rm -f "$PROBE_TEST"

# Caso B: erro de tipo.
cat > "$PROBE_TYPE" <<'EOF'
export const sondaDoPrePush: number = 'não é número';
EOF
expect_blocked B probe-b
rm -f "$PROBE_TYPE"

# Caso C: árvore limpa passa.
push_to probe-c
if [ "$PUSH_RC" -ne 0 ]; then
  echo "FAIL: caso C: o push limpo foi bloqueado" >&2
  printf '%s\n' "$PUSH_OUT" | tail -60 >&2
  exit 1
fi
echo "ok: caso C passou"

# Caso D: sem mudanças desde o push verde, tudo vem do cache do Turborepo.
push_to probe-d
if [ "$PUSH_RC" -ne 0 ]; then
  echo "FAIL: caso D: o push repetido foi bloqueado" >&2
  printf '%s\n' "$PUSH_OUT" | tail -60 >&2
  exit 1
fi
if ! printf '%s' "$PUSH_OUT" | grep -q 'FULL TURBO'; then
  echo "FAIL: caso D: o push repetido não usou o cache (FULL TURBO ausente)" >&2
  printf '%s\n' "$PUSH_OUT" | tail -60 >&2
  exit 1
fi
echo "ok: caso D passou com FULL TURBO"

# Nada de sobra: a working tree termina igual ao início.
cleanup
trap - EXIT
STATUS_AFTER=$(git status --porcelain)
if [ "$STATUS_BEFORE" != "$STATUS_AFTER" ]; then
  echo "FAIL: a working tree mudou durante a verificação" >&2
  diff <(printf '%s\n' "$STATUS_BEFORE") <(printf '%s\n' "$STATUS_AFTER") >&2 || true
  exit 1
fi

echo PREPUSH_VERIFY_OK
