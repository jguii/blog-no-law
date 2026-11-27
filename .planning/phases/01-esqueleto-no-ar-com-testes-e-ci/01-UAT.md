---
status: complete
phase: 01-esqueleto-no-ar-com-testes-e-ci
source: [01-VERIFICATION.md]
started: 2026-11-21T23:09:16Z
updated: 2026-11-27T02:23:32.342Z
---

## Current Test

[testing complete]

## Tests

### 1. Sonda de trust proxy nos logs da Render

expected: clientIp do x-request-id probe-1795226167 lido e TRUST_PROXY_HOPS confirmado ou ajustado conforme docs/runbooks/render.md
result: pass
evidence: "2026-11-26: com hops=1 o clientIp era o IP interno 10.x (cadeia: forjado, IP real, Cloudflare, interno, socket local). TRUST_PROXY_HOPS=3 aplicado, Deploy API run 45925442066, e a sonda probe-1795744851 registrou clientIp == cf-connecting-ip. Regra corrigida em docs/runbooks/render.md."

### 2. Evento sentry-smoke no Sentry

expected: o projeto blog-no-law-api no Sentry tem a issue "Error: sentry-smoke" (ambiente railway-planob, por volta de 2026-11-21T01:56Z)
result: pass
evidence: "O evento de 2026-11-21 nunca chegou: o SENTRY_DSN da Railway (e o da Render) tinha uma chave pública inexistente no projeto. DSN corrigido e imagem trocada para e92302e; a issue BLOG-NO-LAW-API-2 'Error: sentry-smoke' chegou em 2026-11-27T01:33Z (env railway-planob, release e92302e, stack trace, sem headers). Produção: DSN recolado na Render, e o ambiente production passou a aparecer no projeto."

### 3. Remover o serviço do plano B na Railway

expected: o serviço blog-no-law-api da Railway foi apagado depois das evidências (custo zero; /\_debug/error deixa de existir lá)
result: pass
evidence: "Projeto 'illustrious-patience' apagado em 2026-11-26 via API da Railway (projectDelete true); a conta ficou com zero projetos e o domínio *.up.railway.app responde 404 em /status e /_debug/error."

### 4. Home de produção em janela anônima

expected: https://blog-no-law.vercel.app mostra versão, commit, banco "up" e horário; o link "Ver detalhes" mostra a latência do banco
result: pass
evidence: "2026-11-26, contexto limpo sem cookies (HTTP direto; a home é SSR force-dynamic): / responde 200 com commit e92302e, banco up e horário, link 'Ver detalhes'; /?detail=full mostra 'Latência do banco: 6 ms' e o link 'Ocultar detalhes'. x-vercel-id ...::iad1."

### 5. Monitores do UptimeRobot e primeiro backup agendado

expected: os dois monitores (/health/live e /health/ready) Up há algumas horas sem quedas longas; o primeiro run agendado do Backup (05:17 UTC) aparece com sucesso em Actions
result: pass
evidence: "UptimeRobot (API): /health/live e /health/ready Up, 100% de uptime em 1 e 7 dias, zero quedas. Backup: primeiro run agendado 45027560636 com sucesso em 2026-11-22T13:27Z (o cron das 05:17 UTC roda com 8 a 10 h de atraso no GitHub); runs agendados com sucesso em 22, 23, 24 e 26/11. O de 25/11 (45648619482) falhou com HTTP 500 da API do GitHub no gh release create, sem tag nem draft órfão."

### 6. PR final da fase na main antes de 2026-12-20

expected: o PR de fechamento da fase (com a retenção por publishedAt) mergeado na main antes de 2026-12-20
result: pass
evidence: "PR #8 mergeado na main em 2026-11-22T05:10Z (merge commit e92302e), antes de 2026-12-20, com a retenção por publishedAt."

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none]

## Deferred Follow-Ups

- test: 5
  idea: "Backup: tentar de novo o gh release create (e o upload) com backoff quando a API do GitHub devolver 5xx; em 2026-11-25 um HTTP 500 transitório fez o dia ficar sem backup."
  deferred_at: 2026-11-26
