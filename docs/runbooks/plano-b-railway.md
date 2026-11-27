# Runbook: plano B na Railway (boot único)

Este repositório é público. Variáveis aparecem só pelo **nome**.

## O que este plano B é (D-11)

A Railway **não é um standby gratuito permanente**. O trial de US$ 5 (sem cartão) acaba e o serviço desliga. O papel dela aqui é provar **uma vez** que a mesma imagem do GHCR sobe em outro host só com variáveis de ambiente (portabilidade), e deixar um procedimento de emergência para o caso de a Render falhar ou deixar de oferecer o plano gratuito. A Koyeb foi eliminada (sem plano grátis) e a Oracle foi descartada (cadastro exige CNPJ).

Depois da evidência abaixo, o **serviço da Railway deve ser removido pelo autor** (Settings -> Delete service) para não consumir o trial. A rota `/_debug/error` ficou ligada nesse serviço só para o teste do Sentry.

## Evidência do boot

| Item                          | Valor                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| Data do boot e da verificação | 2026-11-20 (verificações em 2026-11-21T01:55Z UTC)                                         |
| Imagem                        | `ghcr.io/jguii/blog-no-law-api:72f7961b2bd74687043f61ec45fe9ce4a5da4fdb` (mesma da Render) |
| SHA                           | `72f7961b2bd74687043f61ec45fe9ce4a5da4fdb`                                                 |
| URL                           | `https://blog-no-law-api-production.up.railway.app`                                        |
| `SENTRY_ENVIRONMENT`          | `railway-planob`                                                                           |

Saída de `bash scripts/verify-remote-api.sh https://blog-no-law-api-production.up.railway.app 72f7961b2bd74687043f61ec45fe9ce4a5da4fdb --expect-debug`:

```text
REMOTE_API_OK https://blog-no-law-api-production.up.railway.app
```

`/status` devolveu o mesmo `commit` da Render com `db: up`, `/health/live` e `/health/ready` 200, headers do Helmet e `/_debug/error` com 500 (esperado com `DEBUG_ROUTES_ENABLED=true`).

### Evento do Sentry

Para o autor localizar o evento no projeto `blog-no-law-api`, issue `Error: sentry-smoke`, environment `railway-planob`:

| Disparo                                                | Horário (UTC)        | `x-request-id`                  |
| ------------------------------------------------------ | -------------------- | ------------------------------- |
| `verify-remote-api.sh --expect-debug` (sem id próprio) | 2026-11-21T01:55:59Z | gerado pela API                 |
| `curl` dedicado a `/_debug/error`, resposta HTTP 500   | 2026-11-21T01:56:07Z | `sentry-smoke-20261121T015607Z` |

Esse primeiro evento **não chegou**: o `SENTRY_DSN` colado no serviço tinha uma chave pública inexistente no projeto (organização e projeto certos), e o Sentry descarta esses envios em silêncio. Em 2026-11-26 o DSN foi corrigido e a imagem do serviço trocada para a de produção (`e92302ea7288a803435f59b8c6802822ba8d724b`). Um novo `curl` em `/_debug/error` (HTTP 500) gerou a issue `BLOG-NO-LAW-API-2`, `Error: sentry-smoke`, com environment `railway-planob`, release `e92302e`, stack trace e sem headers da requisição (coleta de dados pessoais desligada, T-01-24).

**Serviço removido:** depois dessa evidência, o projeto da Railway (só com este serviço) foi apagado em 2026-11-26. O domínio `*.up.railway.app` passou a responder 404 em todas as rotas, inclusive `/_debug/error`. Para religar, seguir "Religar em emergência" abaixo.

## Armadilhas encontradas no boot

- **Variáveis da Railway só valem depois de Apply/Deploy.** No primeiro boot o container caiu porque `DATABASE_URL` tinha sido editada, mas a mudança ficou apenas em rascunho (staged) e não foi aplicada. Depois de editar variáveis, aplicar/redeployar o serviço.
- **Porta.** Definir `PORT=10000` explicitamente nas variáveis e apontar o domínio gerado para a porta `10000` (Networking). A imagem escuta em `PORT`, e o padrão dela é `10000`.

## Variáveis do serviço (só nomes)

`NODE_ENV`, `DATABASE_URL`, `PORT`, `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `DEBUG_ROUTES_ENABLED` (só neste serviço temporário). `TRUST_PROXY_HOPS` ficou no default (1) neste serviço temporário. O valor `3` medido no `render.md` vale para a rede da Render; num host novo, repetir a sonda antes de fixar o valor.

## Religar em emergência

Use só se a Render falhar ou deixar de ter plano gratuito. A imagem é pública, então não há credencial de registro para configurar.

1. Escolher o host: nova conta ou plano na Railway (ou outro PaaS que rode imagem Docker). Verificar antes o que o plano gratuito oferece naquele momento, porque o trial pode não estar mais disponível.
2. Criar o serviço a partir da imagem `ghcr.io/jguii/blog-no-law-api:{sha}` (o último SHA bom; o do deploy em produção aparece em `/status` da Render quando ela responde).
3. Definir as mesmas variáveis do `render.md` (`NODE_ENV`, `DATABASE_URL`, `PORT=10000`, `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `TRUST_PROXY_HOPS`, `CORS_ORIGINS`), **sem** `DEBUG_ROUTES_ENABLED`, e **aplicar** as variáveis antes do deploy. Como o Supabase é externo, não há migração de dados.
4. Gerar o domínio apontando para a porta `10000`.
5. Conferir: `bash scripts/verify-remote-api.sh https://{novo-host} {sha}` deve imprimir `REMOTE_API_OK`.
6. Trocar `API_URL` na Vercel para a URL nova e `API_BASE_URL` no GitHub Environment `production` (`gh variable set API_BASE_URL --env production --body https://{novo-host} --repo jguii/blog-no-law`). Os monitores do 01-13 também passam a apontar para a URL nova.
7. Ajustar `CORS_ORIGINS` se o domínio do web mudou.

Lembrar: a Railway não substitui a Render de graça de forma permanente. Se ficar como host definitivo, o custo mensal zero (restrição do projeto) deixa de valer; nesse caso, decidir de novo entre outro PaaS gratuito e pagar.
