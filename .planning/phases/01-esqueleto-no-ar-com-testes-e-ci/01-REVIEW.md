---
phase: 01-esqueleto-no-ar-com-testes-e-ci
reviewed: 2026-11-27T02:30:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - apps/api/Dockerfile
  - apps/api/prisma/migrations/20261122120000_revoke_function_execute/migration.sql
  - apps/api/src/config/env.spec.ts
  - apps/api/src/config/env.ts
  - apps/api/src/instrument.ts
  - apps/api/src/sentry-options.spec.ts
  - apps/api/src/sentry-options.ts
  - apps/api/test/rls.int-spec.ts
  - docs/runbooks/plano-b-railway.md
  - docs/runbooks/render.md
  - scripts/check-no-raw-html.mjs
  - scripts/check-no-raw-html.test.mjs
  - scripts/prepush-wiring.test.mjs
  - scripts/smoke-container.test.mjs
  - turbo.json
findings:
  critical: 0
  warning: 2
  info: 4
  total: 6
  necessity: 0
status: issues_found
---

# Phase 1: Code Review Report (re-review incremental)

**Reviewed:** 2026-11-27T02:30:00Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

Re-review dos arquivos alterados depois do review anterior (3210a41). As quatro correções pedidas foram conferidas contra o código real:

- **WR-01 (valores vazios):** `emptyToUndefined` está em todas as chaves de `env.ts`; `''` cai no default e nunca em `0`. A cobertura de `env.spec.ts` é boa. Resta uma variante do mesmo defeito (WR-01 abaixo).
- **WR-02 (EXECUTE em funções):** a migration está correta. `REVOKE ... ON ALL ROUTINES` cobre o que já existe, e o `ALTER DEFAULT PRIVILEGES` sem `IN SCHEMA` é o que de fato retira o EXECUTE de PUBLIC. O teste de `rls.int-spec.ts` prova o resultado: cria a função, lê `proacl` com `acldefault` e usa `has_function_privilege` para os três papéis. `prepare-test-db.mjs` cria os papéis `anon`, `authenticated` e `service_role` na imagem `postgres:17`, então a migration roda no teste sem erro.
- **WR-04 (gate de HTML bruto):** `ROOT_ONLY_IGNORED_DIRS` só vale na raiz varrida e `node_modules` vale em qualquer nível. Isso está correto e testado (`app/coverage/page.tsx`, `components/test-results/list.tsx`, `.mts/.cts/.cjs`). Não achei regressão.
- **WR-05 (Sentry no turbo):** `passThroughEnv` fica em `build` e o token não entra em `env` nem em `globalEnv`; o teste 9 garante isso. Há uma ressalva de cache (IN-02).
- **Dockerfile:** `ARG GIT_SHA=unknown` resolve o `GIT_SHA=""` do job docker-build, e o smoke test exige o default não vazio.

Runbooks: a regra de contagem de saltos (socket incluído, da direita) bate com a semântica do `proxy-addr` do Express. A cadeia `127.x, 10.x, 162.x` dá 3 saltos. A faixa `0..3` e a observação sobre ter que subir o teto estão coerentes com `env.ts`. Tracing/amostragem de 5% e o `release` por `GIT_SHA` batem com `instrument.ts`.

Varredura de segredos e dados pessoais nos 15 arquivos: nenhum DSN, senha, token, IP real ou e-mail. O IP do autor fica fora do repositório, os IPs da cadeia estão mascarados (`162.x`, `10.x`, `127.x`), o IP forjado `203.0.113.7` é da faixa de documentação RFC 5737, e o DSN do spec é o fictício `public@o1.ingest.sentry.io/1`. Os identificadores `jguii/blog-no-law` e as URLs `*.onrender.com` e `*.up.railway.app` são públicos por natureza.

## Warnings

### WR-01: `TRUST_PROXY_HOPS` só com espaços (ou `0x..`) vira 0 e desliga o trust proxy em silêncio

**File:** `apps/api/src/config/env.ts:39-42`
**Issue:** `emptyToUndefined` só trata `''` exato. `z.coerce.number()` usa `Number(input)`, e `Number(' ')`, `Number('\n')` e `Number('')` valem `0`. Confirmado executando o schema: `' '` e `'\n'` dão `0`, `'0x2'` dá `2`, `'1e0'` dá `1`. Um valor colado com espaço ou quebra de linha no painel da Render ou da Railway (o mesmo cenário que motivou o WR-01) passa pela validação (faixa `0..3`) e a API sobe com `trust proxy = 0`. Todo visitante passa a aparecer com o IP do proxy, e o rate limit agrupa o mundo todo. É exatamente a falha que o teste "não transforma TRUST_PROXY_HOPS vazio em 0" quer impedir, só que por outra porta. `PORT` não sofre disso porque `min(1)` rejeita `0`.
**Fix:** Aparar e exigir só dígitos antes de coagir:
```ts
const digitsOnly = (value: unknown): unknown => {
  const v = emptyToUndefined(typeof value === 'string' ? value.trim() : value);
  return typeof v === 'string' && !/^\d+$/.test(v) ? Number.NaN : v;
};
TRUST_PROXY_HOPS: z.preprocess(digitsOnly, z.coerce.number().int().min(0).max(3).default(1)),
```
Aplicar o mesmo `digitsOnly` a `PORT`, e acrescentar em `env.spec.ts` os casos `' '`, `'\n'` e `'0x2'`, que devem lançar erro citando `TRUST_PROXY_HOPS`.

### WR-02: o plano B manda copiar `TRUST_PROXY_HOPS` da Render (valor 3) para um host novo

**File:** `docs/runbooks/plano-b-railway.md:57` (contradiz `:49`)
**Issue:** O passo 3 de "Religar em emergência" diz para definir "as mesmas variáveis do `render.md`", e a lista inclui `TRUST_PROXY_HOPS`. Depois da medição de 2026-11-26, o valor da Render é `3`, e `render.md` o descreve como válido só "na Render". A linha 49 do próprio runbook diz o oposto: num host novo é preciso repetir a sonda. Na emergência, quem seguir o passo 3 literalmente grava `3` num host com menos proxies (a Railway tinha o default `1` quando foi testada). Aí o Express confia em entradas do `X-Forwarded-For` que o cliente controla: `req.ip` passa a ser um valor forjado, e o throttler pode ser contornado ou usado para travar o IP de outra pessoa.
**Fix:** Tirar `TRUST_PROXY_HOPS` da lista copiada e acrescentar um passo explícito, por exemplo: "Deixar `TRUST_PROXY_HOPS` no default (1) no primeiro boot. Medir com a sonda de `render.md` (secção Sonda do trust proxy) e só então fixar o valor do novo host. Nunca copiar o `3` da Render."

## Info

### IN-01: a migration de EXECUTE também vale para funções criadas por extensões em `public`

**File:** `apps/api/prisma/migrations/20261122120000_revoke_function_execute/migration.sql:20-25`
**Issue:** Os defaults revogados se aplicam a toda função criada pelo papel das migrations, incluindo as de `CREATE EXTENSION` (por exemplo `pg_trgm` ou `unaccent`) quando instaladas no schema `public`. Se uma fase futura (busca) fizer isso, as funções nascem sem EXECUTE para `app_api` e a consulta falha com `42501`, sem nenhum teste da migration apontando o motivo. O comentário diz para dar `GRANT EXECUTE` explícito às funções próprias, mas não menciona extensões.
**Fix:** Acrescentar ao comentário da migration (ou ao runbook de banco) que extensões devem ir para o schema `extensions` ou receber `GRANT EXECUTE ... TO app_api` na mesma migration.

### IN-02: `passThroughEnv` com `build` cacheável pode reaproveitar um build sem upload de source maps

**File:** `turbo.json:5-9`
**Issue:** Como o token fica fora do hash (decisão correta), um cache hit de um build feito sem `SENTRY_AUTH_TOKEN` (CI de PR, cache local, `ci.yml:138` não passa o token) é reutilizado num build que o teria. Nesse caso `next.config.ts` não roda e os source maps nunca sobem, sem aviso. Hoje o impacto é pequeno, porque o web é publicado pela Vercel, que faz o próprio build.
**Fix:** Se o upload virar requisito, deixar o upload fora do cache (passo separado, ou `"cache": false` na tarefa de release), ou declarar `SENTRY_ORG` e `SENTRY_PROJECT` em `env` e documentar a limitação do token.

### IN-03: `sentryEnvOptions` não replica o default `development` do `env.ts`

**File:** `apps/api/src/sentry-options.ts:22`
**Issue:** Sem `SENTRY_ENVIRONMENT` e sem `NODE_ENV`, `environment` fica `undefined` e o SDK usa o próprio default (`production`), enquanto `env.ts` trata esse caso como `development`. Em produção o Dockerfile fixa `NODE_ENV=production`, então só afeta uma execução local com DSN configurado, que poluiria o ambiente `production` do Sentry.
**Fix:** `environment: read(source, 'SENTRY_ENVIRONMENT') ?? read(source, 'NODE_ENV') ?? 'development'`, com um caso em `sentry-options.spec.ts`.

### IN-04: datas dos runbooks misturam horário local e UTC

**File:** `docs/runbooks/render.md:100`
**Issue:** `probe-1795744851` corresponde a 2026-11-27T02:00:51Z, mas o texto data a confirmação em 2026-11-26 (horário local do autor). As outras linhas da tabela são explicitamente UTC (`2026-11-21T01:56:07Z`), então a leitura fica ambígua para quem for cruzar com os logs da Render. Parecido: a sonda da Render e o `curl` da Railway aparecem no mesmo segundo (`2026-11-21T01:56:07Z`) em `render.md:81` e `plano-b-railway.md:36`; vale conferir se não é cópia do mesmo horário.
**Fix:** Informar o horário UTC da confirmação (`2026-11-27T02:00:51Z`) ou marcar as datas como "horário de Brasília".

---

_Reviewed: 2026-11-27T02:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
