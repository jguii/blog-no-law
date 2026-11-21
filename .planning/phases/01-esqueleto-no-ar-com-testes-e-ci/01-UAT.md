---
status: testing
phase: 01-esqueleto-no-ar-com-testes-e-ci
source: [01-VERIFICATION.md]
started: 2026-11-21T23:09:16Z
updated: 2026-11-21T23:09:16Z
---

## Current Test

number: 1
name: Sonda de trust proxy nos logs da Render
expected: |
  No painel da Render (blog-no-law-api → Logs), a linha com x-request-id probe-1795226167 mostra clientIp. Pela regra de docs/runbooks/render.md: igual ao seu IP público → TRUST_PROXY_HOPS=1 (padrão atual); IP interno ou da Cloudflare → 2; 203.0.113.7 → 0. Se mudar, ajustar a variável na Render e rodar o Deploy API de novo.
awaiting: user response

## Tests

### 1. Sonda de trust proxy nos logs da Render

expected: clientIp do x-request-id probe-1795226167 lido e TRUST_PROXY_HOPS confirmado ou ajustado conforme docs/runbooks/render.md
result: [pending]

### 2. Evento sentry-smoke no Sentry

expected: o projeto blog-no-law-api no Sentry tem a issue "Error: sentry-smoke" (ambiente railway-planob, por volta de 2026-11-21T01:56Z)
result: [pending]

### 3. Remover o serviço do plano B na Railway

expected: o serviço blog-no-law-api da Railway foi apagado depois das evidências (custo zero; /\_debug/error deixa de existir lá)
result: [pending]

### 4. Home de produção em janela anônima

expected: https://blog-no-law.vercel.app mostra versão, commit, banco "up" e horário; o link "Ver detalhes" mostra a latência do banco
result: [pending]

### 5. Monitores do UptimeRobot e primeiro backup agendado

expected: os dois monitores (/health/live e /health/ready) Up há algumas horas sem quedas longas; o primeiro run agendado do Backup (05:17 UTC) aparece com sucesso em Actions
result: [pending]

### 6. PR final da fase na main antes de 2026-12-20

expected: o PR de fechamento da fase (com a retenção por publishedAt) mergeado na main antes de 2026-12-20
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
