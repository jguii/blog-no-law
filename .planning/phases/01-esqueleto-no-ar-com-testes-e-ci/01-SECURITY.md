---
phase: "1"
slug: "esqueleto-no-ar-com-testes-e-ci"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-11-21"
---

# Phase 1 — Security

> Contrato de segurança da fase: registro de ameaças, riscos aceitos e trilha de auditoria. Registro montado a partir dos blocos `<threat_model>` dos 14 planos (autorados no planejamento) e verificado pelo `gsd-security-auditor` contra o código e a configuração ao vivo (`gh api` somente leitura).

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Navegador → Vercel (web) | Público anônimo acessa o Next.js; a home renderiza só texto JSX | HTML público, sem sessão |
| Vercel (BFF) → API Render | Chamada servidor a servidor por `API_URL`; CORS só para a origem da Vercel | JSON de status (versão, commit, banco up/down) |
| API → Supabase Postgres | Papel `app_api` (sem BYPASSRLS) pelo session pooler com TLS verificado | Leitura de `heartbeat`; credencial do runtime |
| Internet → Data API (PostgREST) do Supabase | Chave publicável é pública por desenho; RLS + revogação de grants de `anon`/`authenticated` | Nenhuma linha deve atravessar (42501) |
| GitHub Actions → produção | Environment `production` só na `main`; segredos por nome; logs públicos | Hook de deploy, URL de migração, token de backup |
| Repositório público ↔ colaboradores/forks | Ruleset com `ci-ok`, sem `pull_request_target`, aprovação para contribuidores externos | Código e workflows |
| Actions → repositório privado de backups | Dump cifrado com `age` no pipe; chave privada offline | `.dump.age` (cifrado) |
| Imagem pública no GHCR | Imagem sem `.env` nem segredo, usuário não root | Binários da API |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-01-01 | Info disclosure | `.claude/` tooling | medium | mitigate | `.gitignore:7-16`; só `.claude/CLAUDE.md` rastreado | closed |
| T-01-02 | Tampering | postinstall scripts | medium | mitigate | `pnpm-workspace.yaml:8-10` (allowBuilds só prisma) | closed |
| T-01-SC | Tampering | supply chain (npm, imagens, age) | high | mitigate | versões exatas + lockfile `--frozen-lockfile`; `uses:` por SHA; PostgREST por digest; `age` via apt assinado | closed |
| T-01-03 | Info disclosure | `loadEnv()` | high | mitigate | `env.ts:69-77`; `env.spec.ts:60-64` | closed |
| T-01-04 | Tampering | `GET /status` query | medium | mitigate | pipe global + `strictObject`; `app.http-spec.ts:45-54` | closed |
| T-01-05 | Tampering (XSS) | render do web | high | mitigate | `react/no-danger`=error; só texto JSX | closed |
| T-01-06 | DoS | SSR no cold start | medium | mitigate | `lib/api.ts:27,35-53` (timeout 5 s, nunca lança) | closed |
| T-01-37 | Info disclosure | URL da API no bundle | low | mitigate | `API_URL` sem `NEXT_PUBLIC_` | closed |
| T-01-07 | Info disclosure | tabelas públicas via Data API | critical | mitigate | baseline RLS + revoke; `rls.int-spec.ts:36-86` | closed |
| T-01-08 | EoP | papel do runtime | high | mitigate | `app_api` NOBYPASSRLS; `rls.int-spec.ts:91-134` | closed |
| T-01-38 | Info disclosure | senha do `app_api` | medium | mitigate | sem PASSWORD na migration; `prepare-test-db.mjs` | closed |
| T-01-09 | Info disclosure | logs de falha do banco | high | mitigate | `prisma-database.probe.ts:36-41`; `db.int-spec.ts` | closed |
| T-01-10 | Info disclosure | corpos de `/health/ready` e `/status` | low | accept | AR-01 | closed |
| T-01-39 | DoS | banco travado | medium | mitigate | probe 2 s; pool max 5 / connect 5 s; `db.int-spec.ts:144-184` | closed |
| T-01-51 | Info disclosure | Data API de produção | critical | mitigate | `verify-db-security.mjs`; smoke no `deploy-api.yml`; run 44957670712 → 401/42501 | closed |
| T-01-11 | Info disclosure | env file de produção | high | mitigate | dir 700 / arquivo 600 fora do repo; `.gitignore:29-31` | closed |
| T-01-12 | Tampering | região do projeto | medium | mitigate | `supabase-producao.md:10,13` (us-east-1) | closed |
| T-01-13 | Spoofing (MITM) | TLS até o pooler | medium | mitigate | CA via `NODE_EXTRA_CA_CERTS`/`PGSSLROOTCERT`; residual AR-03 | closed |
| T-01-40 | EoP | senha fraca do `app_api` | medium | mitigate | `set-app-api-password.mjs`; teste 28P01 sem imprimir | closed |
| T-01-14 | Info disclosure | logs pino | high | mitigate | redact em `app.module.ts:31-40`; `logging.http-spec.ts:83-98` | closed |
| T-01-15 | Spoofing | X-Forwarded-For | medium | mitigate | `TRUST_PROXY_HOPS` validado; `security.http-spec.ts:139-170` | closed |
| T-01-16 | Info disclosure | `/_debug/error` | medium | mitigate | desligada por padrão; `sentry.http-spec.ts` | closed |
| T-01-17 | Tampering | Helmet e CORS | medium | mitigate | `app.setup.ts:14-31`; `security.http-spec.ts:50-135` | closed |
| T-01-24 | Info disclosure | eventos Sentry da API | medium | mitigate | `instrument.ts:7-24` (DSN por env, sample 0.05, sem PII) | closed |
| T-01-18 | Tampering | `--no-verify` no pre-push | low | transfer | CI obrigatória (`ci-ok` no ruleset 27773237) | closed |
| T-01-41 | Tampering | hook depende de tooling local | low | mitigate | `.husky/pre-push` e `turbo.json` sem `.claude` | closed |
| T-01-19 | Info disclosure | segredo commitado | critical | mitigate | job gitleaks no `ci-ok`; secret scanning + push protection | closed |
| T-01-20 | EoP | PR de fork lendo segredos | high | mitigate | sem `pull_request_target`; perms read; aprovação externa; env só `main` | closed |
| T-01-21 | Tampering | actions de terceiros | high | mitigate | SHA de 40 hex; Dependabot de Actions | closed |
| T-01-22 | Tampering | merge sem CI | high | mitigate | ruleset 27773237; `ci-gates.test.mjs:42-55` | closed |
| T-01-50 | Tampering (XSS) | `apps/web` | high | mitigate | `check:raw-html` na CI e no pre-push | closed |
| T-01-42 | Info disclosure | logs públicos do Actions | high | mitigate | `persist-credentials: false`; sem `set -x`/`curl -v`; testes de guarda | closed |
| T-01-52 | Info disclosure | Data API antes do merge | critical | mitigate | job `postgrest-anon` no `needs` do `ci-ok` | closed |
| T-01-43 | Repudiation | gate PostgREST vazio | high | mitigate | modo estrito + autoteste; `ci-gates.test.mjs:109-131` | closed |
| T-01-44 | Tampering | `main` sem proteção no bootstrap | high | mitigate | `main` só com docs antes do ruleset | closed |
| T-01-45 | Info disclosure | allowlist do gitleaks | medium | mitigate | 3 literais ancorados, regras padrão mantidas, teste | closed |
| T-01-23 | Info disclosure | artefato do Playwright | low | accept | AR-02 | closed |
| T-01-56 | Info disclosure | eventos Sentry do web | medium | mitigate | init só com DSN; `lib/sentry-init.test.ts` | closed |
| T-01-55 | Tampering | merge sem E2E | high | mitigate | job `e2e` no `needs` do `ci-ok` | closed |
| T-01-25 | Info disclosure | segredos na imagem pública | critical | mitigate | `.dockerignore`; `smoke-container.sh:157-165` | closed |
| T-01-26 | Tampering | URL do deploy hook | high | mitigate | só secret no env `production`; `read -rs` no runbook | closed |
| T-01-27 | EoP | processo do container | medium | mitigate | `USER node`; smoke confere uid ≠ 0 | closed |
| T-01-46 | Repudiation | proveniência da tag | medium | mitigate | tag = commit; DIRTY_TREE barra build | closed |
| T-01-54 | Info disclosure | `/_debug/error` na Render | medium | mitigate | `verify-remote-api.sh:85-90` (404) | closed |
| T-01-28 | DoS (custo) | contas gratuitas | medium | mitigate | `render.md:9`; remoção da Railway é item de UAT | closed |
| T-01-53 | Spoofing | IP do cliente atrás da Render | medium | mitigate | sonda + regra em `render.md:69-94`; leitura do `clientIp` é UAT | closed |
| T-01-48 | DoS | keep-alive vs política da Render | medium | mitigate | `RISCO_ACEITO` registrado (AR-04) | closed |
| T-01-29 | EoP | `workflow_run` disparado por fork | high | mitigate | condição de repo/evento em `deploy-api.yml:33-37`; env só `main` | closed |
| T-01-30 | Info disclosure | segredos no log de deploy | high | mitigate | segredos por `env:`; `deploy-api-workflow.test.mjs` | closed |
| T-01-31 | Info disclosure | Preview da Vercel | high | mitigate | só `API_URL` em Preview; `deploy.md:63-69` | closed |
| T-01-32 | DoS | deploys não atômicos | medium | mitigate | campos novos opcionais no contrato; expand/contract em `deploy.md` | closed |
| T-01-57 | Tampering | uso do deploy hook | high | mitigate | hook só no job `deploy` com env `production` | closed |
| T-01-33 | Info disclosure | dump do banco | high | mitigate | `age` no pipe, sem artefato; repo de backups privado | closed |
| T-01-34 | EoP | `BACKUP_REPO_TOKEN` | medium | mitigate | fine-grained só no repo de backups; rotação documentada | closed |
| T-01-35 | DoS | schedule desligado após 60 dias | medium | mitigate | `backup-restore.md` (alerta e reativação) | closed |
| T-01-36 | Integrity | backup vazio por RLS | high | mitigate | dump como `postgres`; restore drill confere linhas | closed |
| T-01-58 | Info disclosure | URL do banco no log do backup | high | mitigate | `-e DB_URL` por nome; guarda `NON_CANONICAL_TLS_URL` | closed |
| T-01-60 | DoS | restore incompleto | medium | mitigate | privilégios no dump; drill confere `app_api`/`anon`; RESTORE_OK | closed |
| T-01-61 | Spoofing (MITM) | TLS do `pg_dump` | medium | mitigate | `PGSSLROOTCERT` absoluto; `backup-workflow.test.mjs:114-141` | closed |
| T-01-49 | Tampering (XSS) | `apps/web` | high | mitigate | `check-no-raw-html.mjs` com allowlist vazia + testes | closed |
| T-01-59 | Repudiation | smoke do PostgREST | high | mitigate | só 42501 ou `[]`; `smoke-postgrest.test.mjs:83-105` | closed |
| T-01-47 | Info disclosure | saída do smoke | low | mitigate | chave via config no stdin; corpo nunca impresso | closed |

_Status: open · closed · open — below high threshold (non-blocking)_
_Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open_
_Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)_

Totais: 62 ameaças (5 critical, 25 high, 26 medium, 6 low); 59 mitigate, 2 accept, 1 transfer; 62 closed, 0 open.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01 | T-01-10 | `/health/ready` e `/status` mostram só up/down e latência em ms; não ajudam um atacante de forma relevante | Planejamento (01-05) | 2026-11-15 |
| AR-02 | T-01-23 | Relatório do Playwright só sobe em falha, retido 7 dias, com dados de teste locais | Planejamento (01-10) | 2026-11-15 |
| AR-03 | T-01-13 (residual) | O schema engine do `prisma migrate` usa TLS sem conferir a cadeia da CA; a checagem seguinte (`verify-db-security.mjs`, `pg` com verificação completa) cobre | Autor (01-06) | 2026-11-20 |
| AR-04 | T-01-48 (residual) | Ping de keep-alive a cada 5 min pode ser visto pela Render como abuso; o autor escolheu `RISCO_ACEITO` | Autor | 2026-11-20 |

_Transfer: T-01-18 (pular o pre-push) é coberto pelo `ci-ok` obrigatório no ruleset 27773237._

---

## Avisos fora do registro (não bloqueiam)

1. **Retenção de backups na `main` ainda usa `createdAt`.** A correção (`publishedAt`, guarda 7 do `scripts/backup-workflow.test.mjs`) está na branch da fase e chega à `main` no PR de fechamento. O bug não dispara antes de ~2026-12-20.
2. **`postgres:17` é tag móvel** no `backup.yml` e no runbook de restore, e recebe a credencial de migração e o fluxo do dump em claro. Sugestão para um plano futuro: fixar a imagem por digest e incluir o caminho no Dependabot de Docker.
3. **Itens de UAT relacionados:** leitura do `clientIp` nos logs da Render para fixar `TRUST_PROXY_HOPS` (T-01-53); evento `sentry-smoke` no Sentry; remoção do serviço da Railway (T-01-28, T-01-54).

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-11-21 | 62 | 62 | 0 | gsd-security-auditor (opus), ASVS L1, block_on high |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-11-21
