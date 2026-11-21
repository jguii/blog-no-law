// Testes das guardas do backup noturno (OPS-03, D-03, D-07, T-01-SC): leem o `backup.yml` como texto.
// O run de verdade só acontece no runner do GitHub; aqui fica fixada a forma que torna o backup seguro
// num repositório público (cifra no pipe, nada em claro, TLS canônico, retenção depois do upload). Só
// módulos `node:`, sem parser de YAML.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BACKUP = '.github/workflows/backup.yml';
const RECIPIENTS = 'ops/backup/age-recipients.txt';

// Devolve string vazia quando o arquivo não existe: a falha vem da asserção, não do carregamento.
function readText(relativePath) {
  try {
    return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  } catch {
    return '';
  }
}

// Junta as linhas continuadas por barra invertida: um comando quebrado em várias linhas vira uma só.
function joinContinuations(text) {
  return text.replace(/\\\n\s*/g, ' ');
}

// Os blocos `run:` do workflow (escalar na mesma linha ou bloco literal `|`), já com as continuações
// juntadas. Cada bloco é o texto do comando, sem o recuo.
function runBlocks(workflow) {
  const lines = workflow.split('\n');
  const blocks = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = /^(\s*)(?:- )?run:\s*(.*)$/.exec(lines[index]);
    if (!match) continue;
    const indent = match[1].length;
    if (match[2] !== '|' && match[2] !== '|-') {
      blocks.push(match[2]);
      continue;
    }
    const body = [];
    let next = index + 1;
    while (next < lines.length && (lines[next].trim() === '' || lineIndent(lines[next]) > indent)) {
      body.push(lines[next].trim());
      next += 1;
    }
    blocks.push(joinContinuations(body.join('\n')));
    index = next - 1;
  }
  return blocks;
}

function lineIndent(line) {
  return line.length - line.trimStart().length;
}

// Os passos (`- name:` ou `- uses:`) do único job, na ordem do arquivo.
function steps(workflow) {
  const lines = workflow.split('\n');
  const starts = [];
  lines.forEach((line, index) => {
    if (/^\s+- (name|uses|run|if):/.test(line)) starts.push(index);
  });
  return starts.map((start, position) =>
    lines.slice(start, starts[position + 1] ?? lines.length).join('\n'),
  );
}

test('guarda 1: cron 17 5 * * *, workflow_dispatch, fila sem cancelamento, ubuntu-24.04 e production', () => {
  const workflow = readText(BACKUP);
  assert.notEqual(workflow, '', `${BACKUP} precisa existir`);
  assert.match(workflow, /^name: Backup\s*$/m, 'o workflow precisa se chamar Backup');
  assert.match(workflow, /^\s+schedule:\s*$/m, 'precisa do gatilho schedule');
  assert.match(workflow, /-\s*cron:\s*'17 5 \* \* \*'\s*$/m, "o cron precisa ser '17 5 * * *'");
  assert.match(workflow, /^\s+workflow_dispatch:/m, 'precisa do gatilho workflow_dispatch');
  assert.ok(!/pull_request|push:/.test(workflow), 'o backup só roda por schedule e dispatch');
  assert.match(
    workflow,
    /^concurrency:\s*\n\s+group:\s*backup-production\s*\n\s+cancel-in-progress:\s*false\s*$/m,
    'concurrency precisa do grupo backup-production com cancel-in-progress: false',
  );
  assert.match(
    workflow,
    /^permissions:\s*\n\s+contents:\s*read\s*$/m,
    'permissions de topo precisa ser só contents: read',
  );
  assert.match(workflow, /^\s+runs-on:\s*ubuntu-24\.04\s*$/m, 'o job roda em ubuntu-24.04 fixo');
  assert.ok(!/ubuntu-latest/.test(workflow), 'nunca o rótulo móvel ubuntu-latest');
  assert.match(
    workflow,
    /^\s+environment:\s*production\s*$/m,
    'o job usa o Environment production',
  );
});

test('guarda 2: age vem do arquivo assinado do Ubuntu por apt-get, sem binário baixado à mão', () => {
  const workflow = readText(BACKUP);
  assert.notEqual(workflow, '', `${BACKUP} precisa existir`);
  const runs = runBlocks(workflow).join('\n');
  assert.match(runs, /sudo apt-get update/, 'precisa atualizar o índice assinado do apt');
  assert.match(
    runs,
    /sudo apt-get install -y --no-install-recommends age(\s|$)/,
    'o age precisa vir de apt-get install do arquivo do Ubuntu',
  );
  assert.match(runs, /age --version/, 'a versão do age precisa ficar no log');
  assert.ok(!/releases\/download/.test(workflow), 'nenhum binário de release baixado à mão');
  assert.ok(!/\b(curl|wget)\b/.test(runs), 'nenhum download por curl ou wget no backup');
  assert.ok(!/sha256sum|shasum/.test(runs), 'nenhum hash calculado pelo executor');
});

test('guarda 3: forma canônica de TLS com PGSSLROOTCERT absoluto e a guarda NON_CANONICAL_TLS_URL', () => {
  const workflow = readText(BACKUP);
  assert.notEqual(workflow, '', `${BACKUP} precisa existir`);
  const runs = runBlocks(workflow);
  assert.match(
    workflow,
    /DB_URL:\s*\$\{\{\s*secrets\.MIGRATE_DATABASE_URL\s*\}\}/,
    'DB_URL vem de secrets.MIGRATE_DATABASE_URL por env:',
  );
  const guard = runs.find((block) => block.includes('NON_CANONICAL_TLS_URL')) ?? '';
  assert.notEqual(guard, '', 'precisa de um passo que imprime NON_CANONICAL_TLS_URL');
  assert.ok(guard.includes("'?sslmode=require'"), 'a guarda confere o sufixo ?sslmode=require');
  assert.match(guard, /exit 1/, 'a guarda encerra o job com exit 1');
  assert.ok(!/echo[^\n]*\$\{?DB_URL/.test(guard), 'a guarda nunca imprime a URL');

  const clients = runs.filter((block) => /\b(psql|pg_dump)\b/.test(block));
  assert.ok(clients.length >= 2, 'heartbeat (psql) e dump (pg_dump) precisam existir');
  for (const block of clients) {
    assert.ok(
      block.includes('-e PGSSLROOTCERT=/certs/supabase-ca.crt'),
      'a CA entra só por PGSSLROOTCERT absoluto',
    );
    assert.match(block, /-v "\$PWD\/apps\/api\/certs:\/certs:ro"/, 'a CA é montada só leitura');
    assert.match(block, /-e DB_URL\s/, 'DB_URL entra no container por nome');
    assert.ok(!/-e DB_URL=/.test(block), 'o valor de DB_URL nunca vai na linha de comando');
    assert.match(block, /postgres:17\s/, 'cliente libpq do postgres:17 (>= servidor)');
  }
  assert.ok(!/sslrootcert=|sslcert=|sslmode=no-verify/.test(workflow), 'nenhum TLS dentro da URL');
});

test('guarda 4: pg_dump vai direto por pipe para age -R, com privilégios e sem artefato', () => {
  const workflow = readText(BACKUP);
  assert.notEqual(workflow, '', `${BACKUP} precisa existir`);
  const runs = runBlocks(workflow).join('\n');
  assert.match(
    runs,
    /pg_dump "\$DB_URL" -Fc --no-owner --schema=public'?\s*\|\s*age -R ops\/backup\/age-recipients\.txt > "\$NAME"/,
    'pg_dump precisa ir por pipe direto para age -R ops/backup/age-recipients.txt',
  );
  assert.ok(!/pg_dump[^|\n]*>/.test(runs), 'o dump em claro nunca é redirecionado para arquivo');
  assert.ok(
    !/--no-privileges|--no-acl|pg_dump[^|\n]*\s-x(\s|$)/.test(runs),
    'o dump mantém GRANT/REVOKE',
  );
  assert.ok(!/upload-artifact/.test(workflow), 'nenhum artefato do Actions (repo público)');
  assert.ok(!/\b(cat|head|tail|xxd|od)\b[^\n]*\.dump(\s|"|$)/.test(runs), 'nada lê dump em claro');
  assert.match(runs, /test -s "\$NAME"/, 'o arquivo cifrado precisa ser não vazio');
  assert.ok(runs.includes('age-encryption.org/v1'), 'o arquivo precisa ter o cabeçalho do age');
  assert.match(
    runs,
    /psql "\$DB_URL" -v ON_ERROR_STOP=1 -qc "update public\.heartbeat set beat_at = now\(\) where id = 1"/,
    'o heartbeat é uma escrita real no banco',
  );
  assert.match(
    readText(RECIPIENTS),
    /^age1[0-9a-z]{58}$/m,
    `${RECIPIENTS} precisa da chave pública`,
  );
});

test('guarda 5: retenção de 30 dias depois do release e limpeza do runner com if: always()', () => {
  const workflow = readText(BACKUP);
  assert.notEqual(workflow, '', `${BACKUP} precisa existir`);
  const runs = runBlocks(workflow).join('\n');
  const create = runs.indexOf('gh release create "$TAG" "$NAME" --repo "$BACKUP_REPO"');
  const remove = runs.indexOf('gh release delete');
  assert.ok(create !== -1, 'precisa publicar com gh release create no repositório de backups');
  assert.ok(remove !== -1, 'precisa do passo de retenção com gh release delete');
  assert.ok(create < remove, 'a retenção vem depois do upload novo');
  assert.match(runs, /gh release delete "\$[A-Za-z_]+" --repo "\$BACKUP_REPO" --cleanup-tag -y/);
  assert.match(runs, /30 \* 86400|2592000|30 days ago/, 'a retenção é de 30 dias');
  assert.match(workflow, /GH_TOKEN:\s*\$\{\{\s*secrets\.BACKUP_REPO_TOKEN\s*\}\}/);
  assert.match(workflow, /BACKUP_REPO:\s*\$\{\{\s*vars\.BACKUP_REPO\s*\}\}/);

  const all = steps(workflow);
  const last = all.at(-1) ?? '';
  assert.match(last, /^\s+if:\s*always\(\)\s*$/m, 'o último passo roda com if: always()');
  assert.match(last, /rm -f "\$NAME"/, 'o último passo apaga o arquivo cifrado do runner');
});

test('guarda 6: ações fixadas por SHA de 40 hex, set -euo pipefail e nenhum tracing do shell', () => {
  const workflow = readText(BACKUP);
  assert.notEqual(workflow, '', `${BACKUP} precisa existir`);
  const usesLines = workflow.split('\n').filter((line) => /^\s*-?\s*uses:/.test(line));
  assert.ok(usesLines.length > 0, 'o workflow precisa usar ações (checkout)');
  for (const line of usesLines) {
    assert.match(line, /@[0-9a-f]{40}(\s|$)/, `ação não fixada por SHA de 40 hex: ${line.trim()}`);
  }
  assert.match(workflow, /persist-credentials:\s*false/, 'o checkout não persiste credenciais');
  const runs = runBlocks(workflow);
  assert.ok(runs.length > 0, 'o workflow precisa de passos run');
  for (const block of runs) {
    assert.ok(
      block.startsWith('set -euo pipefail'),
      `run sem set -euo pipefail: ${block.slice(0, 60)}`,
    );
  }
  assert.ok(
    !/set -x|set -o xtrace|bash -x|sh -x/.test(workflow),
    'sem tracing do shell (segredos em log público)',
  );
});
