# Runbook: deploy contínuo (Vercel + Render + Supabase)

Este repositório é público (D-07). Este documento cita segredos e variáveis só pelo **nome**; nenhum valor, URL com senha, DSN ou URL de deploy hook entra aqui.

## Resumo

| Item                   | Valor                                                                                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Web (produção)         | `https://blog-no-law.vercel.app`, projeto Vercel com Root Directory `apps/web`, Production Branch `main`                                                                                               |
| API (produção)         | `https://blog-no-law-api.onrender.com`, serviço `blog-no-law-api` na Render Free (ver `render.md`)                                                                                                     |
| Banco                  | Supabase `us-east-1`, pooler em modo session (ver `supabase-producao.md`)                                                                                                                              |
| Colocação (D-04)       | Funções da Vercel em `iad1` (`apps/web/vercel.json`), Render em Virginia, Supabase em `us-east-1`                                                                                                      |
| Gatilho (D-10)         | Merge na `main` com CI verde: a Vercel publica o web e o workflow `Deploy API` publica a API                                                                                                           |
| Imagem da API          | `ghcr.io/jguii/blog-no-law-api:{sha}`, pública, `linux/amd64`; o `{sha}` é o commit cujo conteúdo está nela                                                                                            |
| Prova de ponta a ponta | 2026-11-21: a home na Vercel mostrava `api-commit` = SHA da `main` e `api-db` = `up`, com `x-vercel-id` citando `iad1`. Desde a Fase 2 a prova é conferida em `/status` (a home virou a capa estática) |

## Fluxo completo

1. **PR para a `main`** (D-08). Todo código chega à `main` por PR; o ruleset do 01-09 bloqueia push direto, force push e deleção.
2. **`ci-ok` verde.** O job `ci-ok` do workflow `CI` depende de `lint`, `typecheck`, `test-api`, `test-web`, `e2e`, `secrets`, `postgrest-anon` e `docker-build`. Um Dockerfile quebrado (`docker-build`) ou uma tabela legível pelo papel anônimo (`postgrest-anon`) bloqueiam o merge.
3. **Merge por merge commit** (nunca squash, nunca push direto).
4. **CI na `main`.** O push do merge roda o `CI` de novo na `main`.
5. **`Deploy API`** (`.github/workflows/deploy-api.yml`), disparado por `workflow_run` quando o `CI` da `main` termina com `success`. Só age em run disparado por `push` no próprio repositório (nunca por PR, nem por fork com branch chamada `main`). Os deploys ficam no grupo de concorrência `deploy-api-production` sem cancelamento: dois merges seguidos implantam em ordem e uma migration em andamento nunca é interrompida. Jobs, em ordem:
   1. `build-push`: constrói a imagem `linux/amd64` e publica `ghcr.io/jguii/blog-no-law-api:{sha}` com o `GITHUB_TOKEN`.
   2. `migrate`: `prisma migrate deploy` com `MIGRATE_DATABASE_URL` (credencial `postgres`) do Environment `production`, enquanto a versão antiga da API ainda serve.
   3. `deploy`: um `POST` no deploy hook da Render (`RENDER_DEPLOY_HOOK_URL`) com `imgURL` apontando para a imagem nova, codificada na query.
   4. `verify`: `scripts/wait-for-commit.sh` espera o `/status` da Render mostrar o SHA novo (`COMMIT_LIVE {sha}`, limite de 600 s) e `scripts/smoke-postgrest.sh` roda o smoke anônimo do PostgREST de produção (`POSTGREST_ANON_BLOCKED`).
6. **Vercel em paralelo.** A integração Git da Vercel publica o web em produção a partir do mesmo push, sem esperar o `Deploy API`. Os dois deploys **não são atômicos** (ver "Regras de compatibilidade").

Acompanhar:

```bash
gh run list --workflow deploy-api.yml --branch main --limit 3 --repo jguii/blog-no-law
gh run watch {run-id} --exit-status --repo jguii/blog-no-law
bash scripts/wait-for-commit.sh "$(gh variable get API_BASE_URL --env production --repo jguii/blog-no-law)" {sha} 120
```

## Merges no meio da fase (D-13)

A D-08 manda uma branch por fase com merge na `main` por PR no fim da fase. A D-13 é a exceção aceita: a branch da fase pode ser mergeada na `main` **no meio da fase**, sempre por PR com `ci-ok` verde e **nunca por push direto**. O motivo é o GitHub Actions: `workflow_run` (o gatilho do `Deploy API`), `schedule` (o backup noturno) e `workflow_dispatch` só rodam a partir de um workflow que já existe na branch padrão. Sem o workflow na `main`, o deploy automático não pode ser provado. A branch de produção da Vercel é configurável e não é o motivo.

A branch da fase continua depois de cada merge, e o PR final da fase sai no `/gsd-ship`. O primeiro merge desse tipo foi o PR #1 (merge commit `1c14a0fb4feaff6e42944664485412272ed0695e`).

## Portão PostgREST pré-merge e smoke pós-deploy (D-14)

São duas provas diferentes da mesma regra (o papel anônimo não lê nenhuma tabela):

| Momento    | Onde                                              | O que prova                                                                                                             |
| ---------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Pré-merge  | Job `postgrest-anon` da CI, no `needs` do `ci-ok` | Um PostgREST real ao lado do Postgres de teste, com as migrations aplicadas, recusa leituras anônimas. Bloqueia o merge |
| Pós-deploy | Job `verify` do `Deploy API`                      | O PostgREST de **produção**, com a chave publishable (pública por desenho), recusa leituras depois da migration         |

O portão pré-merge é o que impede uma migration insegura de chegar à `main`. O smoke pós-deploy confirma o estado real de produção; se ele falhar, o run do `Deploy API` fica vermelho e a migration já foi aplicada, então a correção é uma migration nova (revogar o privilégio), não um rollback da imagem.

## Regras de compatibilidade

O web e a API implantam em tempos diferentes (Pitfall 13). Durante alguns minutos o web novo pode falar com a API antiga, ou o contrário. Regras:

- **Contratos (`@blog/shared`):** campo novo é sempre **opcional** no schema Zod. Remover ou renomear campo leva dois merges: primeiro o web deixa de usar o campo, depois a API deixa de mandar. O web degrada ("API indisponível", D-03) em vez de quebrar.
- **Migrations (expand/contract):** o job `migrate` roda **antes** do hook, com a versão antiga da API ainda servindo. Toda migration precisa ser compatível com a versão em execução: primeiro expandir (coluna nova anulável, tabela nova), implantar o código que usa, e só num merge posterior contrair (remover coluna, tornar `NOT NULL`). Nunca `prisma db push`.
- **Nunca migration no boot do container:** a imagem não roda `migrate`; só o job `migrate`, com a credencial `postgres`, aplica o schema.

## Previews da Vercel

- Cada PR ganha um preview deploy (D-10). O ambiente **Preview** da Vercel tem **só** `API_URL` e chama apenas o `GET /status` público da API de produção.
- Nenhum segredo vive no Preview: `SENTRY_DSN` e `NEXT_PUBLIC_SENTRY_DSN` estão marcados só em Production. Builds de PR rodam código não revisado, então nada do Preview pode ler ou gravar dados.
- PRs de fork não ganham preview automaticamente: com a Git Fork Protection (Settings -> Git, ligada por padrão), a Vercel pede autorização de um membro do projeto antes de construir. Mantenha ligada e autorize só depois de ler o diff.
- A proteção padrão dos previews (Deployment Protection) fica ligada.
- O `CORS_ORIGINS` da Render libera só o domínio de produção exato (`https://blog-no-law.vercel.app`). Como o Next busca a API no servidor, os previews não precisam de CORS.

## Reimplantar e fazer rollback

### Reimplantar a `main` atual

```bash
gh workflow run deploy-api.yml --ref main --repo jguii/blog-no-law
```

O `workflow_dispatch` constrói a imagem do **HEAD da `main`**, roda o `migrate` (sem efeito se não há migration pendente) e aciona o hook. Ele **não serve** para voltar a um SHA antigo: não tem entrada de SHA.

### Voltar a API para uma versão anterior

1. Escolher um SHA anterior cuja imagem ainda exista no GHCR (GitHub -> Packages -> `blog-no-law-api` -> versões).
2. Conferir que o schema atual é compatível com esse código (expand/contract). Se não for, o rollback é uma migration nova, não uma imagem antiga.
3. Disparar o hook com o `imgURL` desse SHA, conforme `render.md`. A URL do hook é lida do painel da Render (Settings -> Deploy Hook) e colada num prompt sem eco, nunca na linha de comando nem no histórico:

   ```bash
   read -rs RENDER_DEPLOY_HOOK_URL
   IMG_ENC=$(node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "ghcr.io/jguii/blog-no-law-api:{sha-anterior}")
   curl -fsS -o /dev/null -X POST "$RENDER_DEPLOY_HOOK_URL&imgURL=$IMG_ENC"
   unset RENDER_DEPLOY_HOOK_URL
   ```

4. Verificar:

   ```bash
   bash scripts/verify-remote-api.sh "$(gh variable get API_BASE_URL --env production --repo jguii/blog-no-law)" {sha-anterior}
   ```

5. O próximo merge na `main` volta a implantar o HEAD. Para manter o rollback, não faça merge até a correção.

### Atenção: mudar variável na Render reimplanta a imagem das Settings

Salvar variáveis de ambiente na Render com **Save and deploy** (ou qualquer deploy manual pelo painel) reimplanta a **Image URL gravada nas Settings do serviço**, não a última imagem enviada pelo hook com `imgURL`. Em 2026-11-21, ao gravar o `CORS_ORIGINS`, a produção voltou para a imagem do 01-11 (`72f7961...`). Depois de qualquer mudança de variável ou deploy manual na Render, faça um destes:

- rodar `gh workflow run deploy-api.yml --ref main --repo jguii/blog-no-law` (foi o que corrigiu: run 44922889162, `COMMIT_LIVE` do SHA da `main`);
- ou disparar o hook com o `imgURL` da versão que deve estar no ar;
- ou atualizar a Image URL nas Settings da Render para a tag atual antes de salvar.

Confira sempre com `wait-for-commit.sh` ou pelo `/status` do web (`api-commit`).

### Rollback do web na Vercel

Vercel -> projeto -> Deployments -> escolher um deploy de produção anterior -> **Promote to Production** (ou Instant Rollback). Depois de um rollback, a Vercel pode deixar de promover sozinha os deploys novos da `main` até que um deploy seja promovido de novo; confira o aviso no painel e promova o deploy corrigido quando ele existir.

## Onde vive cada segredo e variável

Só os nomes (D-07). Valores nunca passam por chat, log, issue ou repositório.

| Nome                                                     | Tipo       | Onde vive                                                            | Uso                                                       |
| -------------------------------------------------------- | ---------- | -------------------------------------------------------------------- | --------------------------------------------------------- |
| `MIGRATE_DATABASE_URL`                                   | secret     | GitHub Environment `production` (restrito à `main`) e env file local | Job `migrate` (credencial `postgres`)                     |
| `RENDER_DEPLOY_HOOK_URL`                                 | secret     | GitHub Environment `production` e painel da Render                   | Job `deploy`                                              |
| `API_BASE_URL`                                           | variável   | GitHub Environment `production`                                      | Job `verify` e verificações locais                        |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`               | variáveis  | GitHub Environment `production` e env file local                     | Smoke anônimo do PostgREST (valores públicos por desenho) |
| `WEB_BASE_URL`                                           | variável   | GitHub Environment `production`                                      | Verificação do /status de produção                        |
| `GITHUB_TOKEN`                                           | automático | Gerado pelo Actions em cada run                                      | Push da imagem no GHCR (`packages: write`)                |
| `DATABASE_URL`, `CORS_ORIGINS`, `SENTRY_DSN` e as demais | variáveis  | Painel da Render (lista completa em `render.md`)                     | Runtime da API                                            |
| `API_URL`                                                | variável   | Vercel, Production e Preview                                         | Endereço da API para o Next                               |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`                   | variáveis  | Vercel, **só** Production                                            | Sentry do web                                             |

O env file local é `~/.config/blog-no-law/production.env` (diretório `700`, arquivo `600`), fora do repositório. Para gravar um secret, passe o valor por stdin ou pelo prompt do `gh secret set ... --env production --repo jguii/blog-no-law`, nunca como argumento.

## Pacote GHCR e acesso do Actions

O pacote `ghcr.io/jguii/blog-no-law-api` foi criado no 01-11 por um push com o token do autor, antes do workflow existir, e não ficou ligado ao repositório. O primeiro run do `Deploy API` (44854566143, tentativas 1 e 2) falhou em `build-push` com `denied: permission_denied: write_package`. Não há API para isso; a correção é no painel:

GitHub -> Packages -> `blog-no-law-api` -> Package settings -> **Manage Actions access** -> adicionar o repositório `jguii/blog-no-law` com papel **Write**.

Depois, `gh run rerun {run-id} --failed --repo jguii/blog-no-law`. A tentativa 3 do run 44854566143 passou em todos os jobs. Se o pacote for recriado, refaça esse passo e confirme que a visibilidade continua **pública** (a Render e a Railway puxam a imagem sem credencial).

## Rotação

- **Deploy hook:** Render -> Settings -> Deploy Hook -> regenerar; regravar `RENDER_DEPLOY_HOOK_URL` no Environment `production` (ver `render.md`).
- **`MIGRATE_DATABASE_URL`:** trocar a senha do `postgres` no Supabase, atualizar o env file local e regravar o secret (ver `supabase-producao.md`).
- **`DATABASE_URL` (`app_api`):** `set-app-api-password.mjs`, depois atualizar na Render **e** reimplantar a imagem certa (ver a seção "Atenção" acima).

## Checagem de produção

```bash
curl -fsS -D - -o /tmp/status.html https://blog-no-law.vercel.app/status | grep -i '^x-vercel-id'
grep -oE 'data-testid="api-(commit|db)"[^>]*>[^<]*<' /tmp/status.html
```

Esperado: `x-vercel-id` com `iad1` (por exemplo `gru1::iad1::...`: borda em São Paulo, função em `iad1`), `api-commit` igual ao SHA de `origin/main` e `api-db` igual a `up`. A `/` agora é a capa estática, servida pela borda, então o `x-vercel-id` com `iad1` se confere no `/status`, que roda na função. O primeiro acesso pode esperar o cold start da Render (cerca de 1 minuto).
