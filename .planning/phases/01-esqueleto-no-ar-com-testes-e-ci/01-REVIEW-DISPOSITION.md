---
phase: 01
review: 01-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: open
    title: "Variável de ambiente vazia tratada de forma inconsistente (GIT_SHA quebra o boot; TRUST_PROXY_HOPS vira 0 em silêncio)"
  - id: WR-02
    severity: warning
    disposition: open
    title: "Baseline não fecha o EXECUTE de PUBLIC em funções (a promessa do comentário não se cumpre)"
  - id: WR-03
    severity: warning
    disposition: open
    title: "Endpoints públicos que consultam o banco, sem cache nem limite, e amplificados pela home"
  - id: WR-04
    severity: warning
    disposition: open
    title: "O gate de HTML bruto ignora diretórios por nome em qualquer profundidade e certas extensões"
  - id: WR-05
    severity: warning
    disposition: open
    title: "`SENTRY_AUTH_TOKEN` não chega ao `next build` no modo estrito do Turborepo (source maps do web nunca sobem)"
  - id: WR-06
    severity: warning
    disposition: open
    title: "O smoke de produção do PostgREST trata 404 e 5xx como \"bloqueado\" e só testa duas tabelas fixas"
  - id: IN-01
    severity: info
    disposition: open
    title: "`getStatus` não normaliza `API_URL` com barra final"
  - id: IN-02
    severity: info
    disposition: open
    title: "`wait-for-commit.sh` aceita base URL vazia e gasta o limite inteiro"
  - id: IN-03
    severity: info
    disposition: open
    title: "`restore-drill.sh` diagnostica a chave errada como `pg_restore`"
  - id: IN-04
    severity: info
    disposition: open
    title: "`set-app-api-password.mjs` envia a senha em texto claro dentro do `ALTER ROLE`"
  - id: IN-05
    severity: info
    disposition: open
    title: "Comentários desatualizados e duplicação da imagem do Postgres de teste"
  - id: IN-06
    severity: info
    disposition: open
    title: "Backup só do schema `public`: restauração futura sem `auth.users`"
open: 12
total: 12
recorded: 2026-11-21T23:04:36.855Z
---

# Phase 01: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | open | 01-REVIEW.md |
| WR-02 | warning | open | 01-REVIEW.md |
| WR-03 | warning | open | 01-REVIEW.md |
| WR-04 | warning | open | 01-REVIEW.md |
| WR-05 | warning | open | 01-REVIEW.md |
| WR-06 | warning | open | 01-REVIEW.md |
| IN-01 | info | open | 01-REVIEW.md |
| IN-02 | info | open | 01-REVIEW.md |
| IN-03 | info | open | 01-REVIEW.md |
| IN-04 | info | open | 01-REVIEW.md |
| IN-05 | info | open | 01-REVIEW.md |
| IN-06 | info | open | 01-REVIEW.md |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
