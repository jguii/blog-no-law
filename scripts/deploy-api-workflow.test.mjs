// Testes da guarda do deploy da API (OPS-02, QA-04, D-04, D-10, D-13): leem os workflows e o vercel.json
// como texto. A semântica de `workflow_run` e de `needs` só executa no runner do GitHub; aqui fica
// fixada a forma que a produz, e o run real do `Deploy API` prova o caminho verde. Só módulos `node:`,
// sem parser de YAML.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEPLOY = '.github/workflows/deploy-api.yml';
const CI = '.github/workflows/ci.yml';

// Devolve string vazia quando o arquivo não existe: a falha vem da asserção, não do carregamento.
function readText(relativePath) {
  try {
    return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  } catch {
    return '';
  }
}

// O bloco de um job é o trecho entre a linha `  {job}:` e a próxima chave de job no mesmo recuo
// (ou a próxima chave de nível superior, ou o fim do arquivo). Vazio quando o job não existe.
function jobBlock(workflow, job) {
  const lines = workflow.split('\n');
  const start = lines.findIndex((line) => line === `  ${job}:`);
  if (start === -1) return '';
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^ {2}[A-Za-z0-9_-]+:/.test(lines[index]) || /^[A-Za-z0-9_-]+:/.test(lines[index])) {
      end = index;
      break;
    }
  }
  return lines.slice(start, end).join('\n');
}

// Verdadeiro quando o bloco declara `needs` com exatamente aquele job (forma escalar ou lista).
function needsJob(block, job) {
  return new RegExp(`^\\s+needs:\\s*(\\[\\s*${job}\\s*\\]|${job})\\s*$`, 'm').test(block);
}

test('guarda 1: dispara por workflow_run do CI na main e por workflow_dispatch', () => {
  const workflow = readText(DEPLOY);
  assert.notEqual(workflow, '', `${DEPLOY} precisa existir`);
  assert.match(workflow, /^name: Deploy API\s*$/m, 'o workflow precisa se chamar Deploy API');
  assert.match(workflow, /^\s+workflow_run:\s*$/m, 'precisa do gatilho workflow_run');
  assert.match(workflow, /^\s+workflows:\s*\[\s*CI\s*\]\s*$/m, 'workflow_run precisa ouvir o CI');
  assert.match(workflow, /^\s+types:\s*\[\s*completed\s*\]\s*$/m, 'types precisa ser completed');
  assert.match(workflow, /^\s+branches:\s*\[\s*main\s*\]\s*$/m, 'branches precisa ser a main');
  assert.match(workflow, /^\s+workflow_dispatch:/m, 'precisa do gatilho workflow_dispatch');
  assert.ok(
    !/pull_request_target/.test(workflow),
    'nunca pull_request_target (repositório público)',
  );
});

test('guarda 2: build-push só age em CI verde disparado por push do próprio repositório', () => {
  const block = jobBlock(readText(DEPLOY), 'build-push');
  assert.notEqual(block, '', 'o job build-push precisa existir');
  for (const condition of [
    "github.event_name == 'workflow_dispatch'",
    "github.event.workflow_run.conclusion == 'success'",
    "github.event.workflow_run.event == 'push'",
    'github.event.workflow_run.head_repository.full_name == github.repository',
  ]) {
    assert.ok(block.includes(condition), `a condição de build-push precisa citar: ${condition}`);
  }
  assert.match(block, /^\s+if:/m, 'build-push precisa ter condição if');
  assert.match(block, /persist-credentials:\s*false/, 'o checkout não persiste credenciais');
});

test('guarda 3: deploys serializados sem cancelamento e permissões mínimas no topo', () => {
  const workflow = readText(DEPLOY);
  assert.match(
    workflow,
    /^concurrency:\s*\n\s+group:\s*deploy-api-production\s*\n\s+cancel-in-progress:\s*false\s*$/m,
    'concurrency precisa do grupo deploy-api-production com cancel-in-progress: false',
  );
  assert.match(
    workflow,
    /^permissions:\s*\n\s+contents:\s*read\s*$/m,
    'permissions de topo precisa ser só contents: read',
  );
});

test('guarda 4: ordem build-push, migrate, deploy, verify, com Environment production', () => {
  const workflow = readText(DEPLOY);
  const migrate = jobBlock(workflow, 'migrate');
  const deploy = jobBlock(workflow, 'deploy');
  const verify = jobBlock(workflow, 'verify');
  assert.ok(needsJob(migrate, 'build-push'), 'migrate precisa depender de build-push');
  assert.ok(needsJob(deploy, 'migrate'), 'deploy precisa depender de migrate');
  assert.ok(needsJob(verify, 'deploy'), 'verify precisa depender de deploy');
  for (const [name, block] of [
    ['migrate', migrate],
    ['deploy', deploy],
    ['verify', verify],
  ]) {
    assert.match(
      block,
      /^\s+environment:\s*production\s*$/m,
      `${name} precisa do environment production`,
    );
  }
  assert.ok(
    migrate.includes('prisma migrate deploy'),
    'migrate precisa rodar prisma migrate deploy',
  );
  assert.ok(deploy.includes('imgURL'), 'deploy precisa acionar o hook com imgURL');
});

test('guarda 5: ações fixadas por SHA de 40 hex e sem tracing do shell nem curl verboso', () => {
  const workflow = readText(DEPLOY);
  assert.notEqual(workflow, '', `${DEPLOY} precisa existir`);
  const usesLines = workflow.split('\n').filter((line) => /^\s*-?\s*uses:/.test(line));
  assert.ok(usesLines.length > 0, 'o workflow precisa usar ações');
  for (const line of usesLines) {
    assert.match(line, /@[0-9a-f]{40}(\s|$)/, `ação não fixada por SHA de 40 hex: ${line.trim()}`);
  }
  assert.ok(
    !/curl[^|]*\s-v(\s|$)|set -x/.test(workflow),
    'sem curl -v nem set -x (segredos em log público)',
  );
});

test('guarda 6: docker-build no needs do ci-ok e funções da Vercel em iad1', () => {
  const block = jobBlock(readText(CI), 'ci-ok');
  assert.notEqual(block, '', 'o job ci-ok precisa existir');
  const needsLines = block.split('\n').filter((line) => /^\s+needs:/.test(line));
  assert.equal(needsLines.length, 1, 'ci-ok precisa ter uma única linha needs: [...]');
  for (const job of ['docker-build', 'postgrest-anon', 'e2e']) {
    assert.match(needsLines[0], new RegExp(`\\b${job}\\b`), `ci-ok precisa depender de ${job}`);
  }
  assert.notEqual(jobBlock(readText(CI), 'docker-build'), '', 'o job docker-build precisa existir');

  const raw = readText('apps/web/vercel.json');
  assert.notEqual(raw, '', 'apps/web/vercel.json precisa existir');
  const config = JSON.parse(raw);
  assert.deepEqual(config.regions, ['iad1'], 'regions precisa ser exatamente ["iad1"] (D-04)');
});
