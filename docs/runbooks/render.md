# Runbook: API na Render (host primário)

Este repositório é público. Este documento cita variáveis e segredos só pelo **nome**; nenhum valor, URL com senha, DSN ou URL de deploy hook entra aqui.

## Resumo

| Item                | Valor                                                                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Serviço             | `blog-no-law-api`, Web Service a partir de imagem existente (sem Blueprint, que pede cartão)                                                                   |
| URL pública         | `https://blog-no-law-api.onrender.com` (HTTPS nativo do domínio `onrender.com`, D-02)                                                                          |
| Região              | Virginia (US East), ao lado do Supabase `us-east-1` e das funções da Vercel em `iad1` (D-04)                                                                   |
| Plano               | Free (512 MB, 0,1 CPU). Dorme após 15 min sem tráfego de entrada                                                                                               |
| Imagem              | `ghcr.io/jguii/blog-no-law-api:{sha}`, pública (D-10, D-11). O `{sha}` é o commit cujo conteúdo está na imagem                                                 |
| Health check        | `/health/live`                                                                                                                                                 |
| Auto-Deploy         | Desligado. O deploy sai pelo deploy hook, disparado pelo workflow do 01-12                                                                                     |
| Imagem do 1º deploy | `72f7961b2bd74687043f61ec45fe9ce4a5da4fdb` (verificada em 2026-11-20 com `verify-remote-api.sh`: `commit` igual ao SHA, `db: up`, Helmet, `/_debug/error` 404) |

## Variáveis de ambiente do serviço

Só os nomes. Os valores vivem no painel da Render (e, para `DATABASE_URL`, no env file local fora do repositório).

| Variável             | Papel                                                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`           | `production`                                                                                                          |
| `DATABASE_URL`       | Conexão do runtime como `app_api` pelo pooler, forma canônica de TLS (`?sslmode=require`, ver `supabase-producao.md`) |
| `TRUST_PROXY_HOPS`   | Número de proxies confiáveis à frente da API: `3` na Render, medido pela sonda (ver "Sonda do trust proxy")           |
| `LOG_LEVEL`          | `info`                                                                                                                |
| `SENTRY_DSN`         | DSN do projeto `blog-no-law-api`, copiado de Sentry -> Settings -> Projects -> `blog-no-law-api` -> Client Keys (DSN) |
| `SENTRY_ENVIRONMENT` | `production`                                                                                                          |
| `CORS_ORIGINS`       | Vazio na Fase 1; o domínio da Vercel entra no 01-12                                                                   |
| `PORT`               | Injetada pela Render (a imagem assume `10000` por padrão)                                                             |

`DEBUG_ROUTES_ENABLED` **não** existe na Render: `/_debug/error` precisa responder 404 em produção (T-01-54). `verify-remote-api.sh` sem flag exige exatamente isso.

## Deploy hook

- Onde vive: no painel da Render (Settings -> Deploy Hook) e, como segredo, em `RENDER_DEPLOY_HOOK_URL` no GitHub Environment `production`, restrito à `main` (T-01-26). A URL nunca passa por chat, log ou repositório.
- Como rotacionar se vazar: Render -> Settings -> Deploy Hook -> regenerar (a URL antiga deixa de valer), e regravar o segredo com `gh secret set RENDER_DEPLOY_HOOK_URL --env production --repo jguii/blog-no-law` (o valor é colado no prompt, não na linha de comando).
- Disparo normal: o workflow do 01-12 chama o hook com `imgURL` apontando para a imagem do commit (`ghcr.io/jguii/blog-no-law-api:{sha}`, com `/` e `:` codificados na query).

## Rollback

Disparar o hook com o `imgURL` de um SHA anterior que ainda esteja no GHCR. Depois conferir:

```bash
bash scripts/verify-remote-api.sh "$(gh variable get API_BASE_URL --env production --repo jguii/blog-no-law)" {sha-anterior}
```

A saída esperada é `REMOTE_API_OK {url}`. O polling aguarda o cold start (até 5 min por padrão, `VERIFY_TIMEOUT_S`).

## Limite de 750 h e um único web service gratuito

A Render dá 750 h de instância Free por mês por **workspace**. Um serviço acordado o mês inteiro usa 744 h em mês de 31 dias, folga de 6 h. Um segundo web service gratuito acordado no mesmo workspace estoura o limite, e a Render suspende todos os serviços Free até o mês seguinte (Pitfall 3). Regra: este é o **único** web service gratuito do workspace, e o plano B (Railway) **nunca** roda na Render. A banda de saída é irrisória na Fase 1 (JSON); imagens nunca passam pela API.

## Cold start e degradação do web (D-03)

Sem tráfego por 15 min o serviço dorme, e o primeiro acesso espera cerca de 1 minuto. O web busca a API no servidor com `AbortSignal.timeout(5000)` e mostra "API indisponível" em vez de erro 500 (Pitfall 2). Requisições a `/robots.txt` com o serviço dormindo não o acordam. A Render pode reiniciar um serviço Free a qualquer momento: a API não guarda estado em memória.

## Política de keep-alive

Política de keep-alive (D-03): RISCO_ACEITO

- **Data da leitura:** 2026-11-20.
- **URLs lidas:** https://render.com/acceptable-use, https://render.com/terms e https://render.com/docs/free.
- **O que se apurou:** a página `docs/free` não diz nada sobre pings ou monitores de uptime; só informa que o serviço dorme após 15 min sem tráfego de entrada, que `/robots.txt` não acorda o serviço, as 750 h por workspace (esgotadas, a Render suspende todos os serviços Free até o mês seguinte), que a Render pode suspender um serviço Free que inicie volume anormalmente alto de tráfego de saída e que pode reiniciá-lo a qualquer momento. O texto da Acceptable Use Policy e dos Terms não pôde ser extraído pela ferramenta de leitura, então o silêncio (SILENCIA) **não foi verificado**.
- **Aceite do autor:** em 2026-11-20 o autor aceitou por escrito, no checkpoint da Task 2 do 01-11, o risco de a Render suspender o serviço gratuito por causa de um ping automático (resposta `RISCO_ACEITO`).
- **Consequência para o 01-13:** os dois monitores de 5 minutos (`/health/live` e `/health/ready`) são criados. Um ping a cada 5 min mantém a API acordada cerca de 744 h por mês em mês de 31 dias, abaixo do limite de 750 h mas muito perto dele, e isso só vale se este for o **único** web service gratuito do workspace. Se a Render sinalizar o ping como abuso ou suspender o serviço, reavaliar: a arquitetura já tolera o sono (D-03), com o web mostrando "API indisponível" no cold start e o keep-alive do Supabase só pela escrita diária do `backup.yml`.

## Sonda do trust proxy (D-02)

O número de proxies à frente da Render não é documentado oficialmente. O default é `TRUST_PROXY_HOPS=1` (falha segura: errar para baixo só agrupa IPs). A sonda mede o valor real: uma requisição com `X-Forwarded-For` forjado e um `x-request-id` conhecido, e o autor lê o campo `clientIp` da linha de log correspondente no painel da Render (Logs).

Comando usado (a URL base é a pública do serviço):

```bash
curl -s -o /dev/null -H 'X-Forwarded-For: 203.0.113.7' -H 'x-request-id: probe-{timestamp}' https://blog-no-law-api.onrender.com/status
```

| Campo                           | Valor                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------- |
| Data e hora da sonda (UTC)      | 2026-11-21T01:56:07Z                                                                        |
| IP público da máquina           | (registrado fora do repositório, em `~/.config/blog-no-law/trust-proxy-probe.txt`)          |
| `x-request-id` usado            | `probe-1795226167`                                                                          |
| IP forjado em `X-Forwarded-For` | `203.0.113.7` (faixa de documentação, não é IP real)                                        |
| `clientIp` lido no log          | IP interno `10.x` (com `TRUST_PROXY_HOPS=1`), lido em 2026-11-26 pela API de logs da Render |
| `TRUST_PROXY_HOPS` final        | `3`, aplicado em 2026-11-26                                                                 |

O IP público do autor é dado pessoal e este repositório é público, por isso ele fica só no arquivo local (modo 600) junto com o `x-request-id` e o horário.

### Resultado da sonda

A linha de log de `probe-1795226167` mostrou esta cadeia (IPs mascarados; da esquerda para a direita, como chega no `X-Forwarded-For`, mais o socket no fim):

```text
203.0.113.7 (forjado) , IP real do cliente , 162.x (Cloudflare) , 10.x (interno da Render)   socket: 127.x (proxy local)
```

Há três proxies à frente da aplicação: a Cloudflare, a borda interna da Render e um proxy local no container. Com `TRUST_PROXY_HOPS=1` o Express confiava só no socket e devolvia o `10.x`, então todo visitante aparecia com o mesmo IP e o rate limit agruparia todo mundo. Com `3` ele confia no socket, no `10.x` e no `162.x` e para no IP real, ignorando o valor forjado à esquerda.

Confirmação depois da troca (deploy de `e92302e` pelo Deploy API em 2026-11-26): a sonda `probe-1795744851`, de novo com `X-Forwarded-For: 203.0.113.7`, registrou `clientIp` igual ao `cf-connecting-ip` da mesma linha, que é o IP real do cliente.

Regra de decisão (T-01-53), revista depois da medição:

- Contar, a partir da **direita**, quantos endereços (socket incluído) vêm depois do IP real do cliente no `X-Forwarded-For`. Esse número é o `TRUST_PROXY_HOPS`. A conferência é `clientIp` igual ao `cf-connecting-ip` da mesma linha.
- `clientIp` igual a `203.0.113.7` (o valor forjado): o valor está alto demais e a API aceita cabeçalho do cliente. Baixar até o `clientIp` virar o IP real.
- O schema limita o valor a `0..3` (`apps/api/src/config/env.ts`). Se a Render acrescentar um quarto proxy, a sonda mostra isso e o limite precisa subir junto, com teste.
- Repetir a sonda se a Render mudar a rede de borda, ou se o `clientIp` dos logs voltar a ser o mesmo IP interno para todo mundo.

Depois de decidir, ajustar a variável na Render com **Save only** e rodar o Deploy API (`gh workflow run deploy-api.yml --ref main --repo jguii/blog-no-law`). O "Save and deploy" do painel republica a imagem antiga gravada no serviço (ver `deploy.md`).

### Sentry em produção (2026-11-26)

O `SENTRY_DSN` da Render e o da Railway tinham uma chave pública que não existe no projeto (a organização e o projeto estavam certos). O Sentry descarta esses envios sem contá-los nem como rejeitados, por isso o projeto ficou sem nenhum evento. O DSN foi recolado a partir de Client Keys. Depois do deploy, o ambiente `production` passou a aparecer no projeto `blog-no-law-api`, alimentado pelas transações amostradas (5%). Para conferir no futuro: o projeto deve listar o ambiente `production` e a release do último SHA.

## Verificação

```bash
bash scripts/verify-remote-api.sh https://blog-no-law-api.onrender.com {sha}
```

Saídas: `REMOTE_API_OK {url}` ou `REMOTE_API_FAIL {commit|db|ready|csp|nosniff|debug_route}`. O mesmo script verifica a Railway com `--expect-debug` (ver `plano-b-railway.md`).
