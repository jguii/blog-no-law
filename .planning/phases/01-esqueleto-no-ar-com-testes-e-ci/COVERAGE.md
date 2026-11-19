# Phase 1 — API Coverage Decision

**Detector:** `api-coverage.cjs` returned `detected: true` (signal: the noun "api" in the Data API threat row of the plans).
**Reading:** this phase has no product API integration. It touches platform services only as infrastructure (database, hosting, CI/CD, monitoring). The matrix below lists every capability the plans actually touch, plus the adjacent capabilities that were deliberately left out, with a one-line reason each.

| Service | Capability | Decision | Plan(s) | Reason |
|---|---|---|---|---|
| Supabase | Postgres via Supavisor session pooler (5432) | INTEGRATE | 01-04, 01-05, 01-06 | Runtime database as `app_api`; migrations and dump as `postgres` |
| Supabase | Data API (PostgREST) in production | INTEGRATE (negative test only) | 01-06, 01-12 | Post-deploy anonymous smoke with the publishable key proving nothing is readable; the app never uses PostgREST (BFF -> NestJS -> Prisma) |
| PostgREST | Container next to the test Postgres in CI (`postgrest-anon` job) | INTEGRATE (negative test only) | 01-14, 01-09 | Pre-merge RLS gate per D-14: real anonymous GETs against the migrated schema, job in the `needs` of `ci-ok` |
| Supabase | Auth (Discord OAuth, JWKS) | OPT-OUT | — | Belongs to Phase 3 (AUTH-01, SEC-01) |
| Supabase | Storage | OPT-OUT | — | Belongs to Phase 5 (media) |
| Supabase | Realtime, Edge Functions | OPT-OUT | — | Out of scope for the project (polling is enough; NestJS is the backend) |
| Supabase | Management API | OPT-OUT | — | Project creation is a one-time dashboard step (D-05); no token stored |
| Render | Web service from public GHCR image + health check | INTEGRATE | 01-11 | Primary API host (D-01, D-11) |
| Render | Deploy hook with `imgURL` | INTEGRATE | 01-12 | Automatic deploy on merge (D-10) |
| Render | REST API, Blueprints | OPT-OUT | — | Dashboard setup is enough; Blueprints reportedly ask for a card; avoids an account-wide API key |
| Railway | Docker image deploy (one boot) | INTEGRATE | 01-11 | Plan B portability proof (D-11), removed after evidence |
| Railway | API/CLI, persistent standby | OPT-OUT | — | One-boot plan B by decision D-11 |
| Vercel | Git integration (production on `main`, PR previews), `regions` | INTEGRATE | 01-12 | Web hosting in `iad1` (D-04, D-10) |
| Vercel | CLI/REST API | OPT-OUT | — | Git integration covers every deploy; no token needed |
| GitHub | REST API via `gh` (repos, security_and_analysis, Actions permissions, rulesets, environments, secrets/variables, releases) | INTEGRATE | 01-09, 01-11, 01-12, 01-13 | Repository hardening, protected `main`, deploy secrets, private backup releases |
| GitHub | Actions (CI, deploy, scheduled backup) and GHCR | INTEGRATE | 01-09 to 01-13 | Quality gates and delivery (QA-04, D-10, OPS-03) |
| Sentry | SDK event ingest (api and web projects) | INTEGRATE | 01-07, 01-10, 01-11 | Error monitoring (OPS-01) |
| Sentry | REST API, source map upload | OPT-OUT | — | Event check is a human check; upload only runs if a `SENTRY_AUTH_TOKEN` is added later |
| UptimeRobot | Two HTTP monitors (5 min) | INTEGRATE (dashboard, conditional) | 01-11, 01-13 | Keep-alive and uptime (D-03); created only if the Render keep-alive policy read in 01-11 is not PROIBE |
| UptimeRobot | API | OPT-OUT | — | Two monitors by hand; avoids storing another API key |
| Discord | Bot REST, webhooks | OPT-OUT | — | Phases 3 and 7 |
