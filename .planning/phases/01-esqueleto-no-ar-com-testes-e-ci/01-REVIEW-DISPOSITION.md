---
phase: 01
review: 01-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "`TRUST_PROXY_HOPS` só com espaços (ou `0x..`) vira 0 e desliga o trust proxy em silêncio"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "o plano B manda copiar `TRUST_PROXY_HOPS` da Render (valor 3) para um host novo"
  - id: IN-01
    severity: info
    disposition: deferred
    title: "a migration de EXECUTE também vale para funções criadas por extensões em `public`"
  - id: IN-02
    severity: info
    disposition: deferred
    title: "`passThroughEnv` com `build` cacheável pode reaproveitar um build sem upload de source maps"
  - id: IN-03
    severity: info
    disposition: deferred
    title: "`sentryEnvOptions` não replica o default `development` do `env.ts`"
  - id: IN-04
    severity: info
    disposition: fixed
    title: "datas dos runbooks misturam horário local e UTC"
  - id: WR-03
    severity: warning
    disposition: deferred
    title: "Endpoints públicos que consultam o banco, sem cache nem limite, e amplificados pela home"
  - id: WR-04
    severity: warning
    disposition: fixed
    title: "O gate de HTML bruto ignora diretórios por nome em qualquer profundidade e certas extensões"
  - id: WR-05
    severity: warning
    disposition: fixed
    title: "`SENTRY_AUTH_TOKEN` não chega ao `next build` no modo estrito do Turborepo (source maps do web nunca sobem)"
  - id: WR-06
    severity: warning
    disposition: deferred
    title: "O smoke de produção do PostgREST trata 404 e 5xx como \"bloqueado\" e só testa duas tabelas fixas"
  - id: IN-05
    severity: info
    disposition: deferred
    title: "Comentários desatualizados e duplicação da imagem do Postgres de teste"
  - id: IN-06
    severity: info
    disposition: deferred
    title: "Backup só do schema `public`: restauração futura sem `auth.users`"
open: 0
total: 12
recorded: 2026-11-27T02:29:10.281Z
---

# Phase 01: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | fixed | 2a9f473 (RED), 9645002 (GREEN) |
| WR-02 | warning | fixed | 495787e |
| IN-01 | info | deferred | informativo: nenhuma extensão instala funções em public hoje; revisar se uma fase adicionar extensão |
| IN-02 | info | deferred | informativo: a Vercel faz o próprio build; revisar quando o upload de source maps for ligado |
| IN-03 | info | deferred | informativo: produção sempre define NODE_ENV e SENTRY_ENVIRONMENT; backlog |
| IN-04 | info | fixed | 70012fb |
| WR-03 | warning | deferred | Fase 7 — rate limit SEC-02; cache do probe (not in the current review) |
| WR-04 | warning | fixed | 8e1e0c6 (RED), ea32367 (GREEN) (not in the current review) |
| WR-05 | warning | fixed | 64ad2b9 (RED), 63b213b (GREEN) (not in the current review) |
| WR-06 | warning | deferred | ampliar a lista de tabelas quando a próxima fase criar tabelas (not in the current review) |
| IN-05 | info | deferred | informativo; backlog (not in the current review) |
| IN-06 | info | deferred | informativo; backlog (not in the current review) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
