---
phase: 01
review: 01-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "Variável de ambiente vazia tratada de forma inconsistente (GIT_SHA quebra o boot; TRUST_PROXY_HOPS vira 0 em silêncio)"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "Baseline não fecha o EXECUTE de PUBLIC em funções (a promessa do comentário não se cumpre)"
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
  - id: IN-01
    severity: info
    disposition: deferred
    title: "`getStatus` não normaliza `API_URL` com barra final"
  - id: IN-02
    severity: info
    disposition: deferred
    title: "`wait-for-commit.sh` aceita base URL vazia e gasta o limite inteiro"
  - id: IN-03
    severity: info
    disposition: deferred
    title: "`restore-drill.sh` diagnostica a chave errada como `pg_restore`"
  - id: IN-04
    severity: info
    disposition: deferred
    title: "`set-app-api-password.mjs` envia a senha em texto claro dentro do `ALTER ROLE`"
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
recorded: 2026-11-21T23:04:36.855Z
---

# Phase 01: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | fixed | b079319 (refactor), 45806ca (RED), e8cb346 (GREEN) |
| WR-02 | warning | fixed | 23fdf9e (RED), 2a3760c (GREEN) |
| WR-03 | warning | deferred | Fase 7 — rate limit SEC-02; cache do probe |
| WR-04 | warning | fixed | 8e1e0c6 (RED), ea32367 (GREEN) |
| WR-05 | warning | fixed | 64ad2b9 (RED), 63b213b (GREEN) |
| WR-06 | warning | deferred | ampliar a lista de tabelas quando a próxima fase criar tabelas |
| IN-01 | info | deferred | informativo; backlog |
| IN-02 | info | deferred | informativo; backlog |
| IN-03 | info | deferred | informativo; backlog |
| IN-04 | info | deferred | informativo; backlog |
| IN-05 | info | deferred | informativo; backlog |
| IN-06 | info | deferred | informativo; backlog |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
