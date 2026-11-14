# Project Research Summary

**Project:** Blog No Law
**Domain:** Moderated, multi-author community blog and clan memory archive (public read, Discord-gated write, approval queue, media archive, 10+ year history)
**Researched:** 2026-11-14
**Confidence:** MEDIUM (stack and architecture MEDIUM-HIGH; features and pitfalls MEDIUM; several items need spikes)

Fixed by the author (not re-litigated): Next.js on Vercel, NestJS 12 in Docker on Oracle Always Free VM, Supabase (Postgres, Auth with Discord, Storage), TypeScript end to end, US$0/month.

## Executive Summary

Blog No Law is a moderated, multi-author archive with social features, not a generic blog or forum. Core value: members publish and re-find the clan's history, organized by year and category. So the event date (`occurred_at`) is separate from publish date, permalinks never break, media is re-hosted (never Discord hotlinks), and every write goes through an approval state machine with audit. Architecture: Next.js as a Backend-for-Frontend holds the Supabase session in httpOnly cookies and forwards a Bearer token server-to-server to a stateless NestJS API; NestJS owns business rules and verifies Supabase JWTs via JWKS; Postgres (Supabase session-mode pooler) with RLS as second layer; durable side effects (Discord webhook, revalidation, backups) run as retryable pg-boss jobs.

Stack is largely settled with pinned versions: Next.js 16.4.6, NestJS 12.5.0, Prisma 7.10.1 (exact pin), Zod 4 in `packages/shared`, `jose`, `sharp` + `file-type`, `sanitize-html` on write, Vitest 4.1.12, Pino and Sentry. Main risks are operational: Oracle A1 allowance halved to 2 OCPU / 12 GB and idle reclaim; Supabase free projects pause after a week and have no backups; Vercel's 4.5 MB body limit forbids proxying uploads. Mitigations: portable container, nightly off-box pg_dump, daily real DB keep-alive, direct-to-storage uploads, Plan B host deployed once.

Researchers disagree on: Discord membership/role lookup (user OAuth token vs bot token), upload path (through NestJS vs direct to Supabase Storage), and content format (Tiptap HTML vs ProseMirror JSON vs Markdown). Recommendations are under "Conflicts" below; choices affecting schema and budget are under "Decisions the Author Must Make".

## Key Findings

### Recommended Stack
- Node.js 26 LTS (dev 26.13.1). No Corepack; install pnpm explicitly. Fallback Node 24.
- TypeScript `~6.0.3` (typescript-eslint and Nest CLI do not support TS 7 yet).
- pnpm 12.18.0 + Turborepo 2.11.11; workspaces `apps/web`, `apps/api`, `packages/shared` (Zod schemas, DTO types, enums).
- Next.js 16.4.6 + React 19.3.1. `proxy.ts` replaces `middleware.ts`; `cookies()`, `headers()`, `params` are async. eslint-config-next needs ESLint 9.39.x.
- `@supabase/ssr` 0.12.7 + `@supabase/supabase-js` 2.119.0. Verify with `getClaims()`, never `getSession()`. Publishable key.
- NestJS 12.5.0 on Express 5, ESM. Native Standard Schema, so `nestjs-zod` is unnecessary.
- Prisma 7.10.1 exact pin (`prisma`, `@prisma/client`, `@prisma/adapter-pg`). `prisma@latest` resolves to an 8.0 RC that mismatches the client.
- `jose` 6.2.17: JWKS verification with explicit iss, aud=authenticated, alg=ES256. Not @nestjs/jwt, Passport, or HS256 secret.
- `sharp` 0.35.5 + `file-type` 22.3.0: auto-orient, strip metadata (never `withMetadata()`), WebP output.
- Zod 4.6.7 shared between browser and Nest.
- `sanitize-html` 2.18.2: allowlist on write (no jsdom).
- `@nestjs/throttler` 6.7.1 (in-memory), `helmet` 8.3.0, `@nestjs/schedule`, `@nestjs/terminus` 12.1.0.
- Discord: `@discordjs/rest` 2.6.3 + `discord-api-types`, REST only. Do not install discord.js.
- `nestjs-pino` 5.3.1 (pino 10), `@sentry/nextjs` and `@sentry/nestjs` 11.12.0.
- Testing: Vitest 4.1.12 + Vite 8.3.8, supertest, Playwright 1.65.1, @axe-core/playwright, oxlint 1.93.0 (API), ESLint 9.39.x (web); real Postgres 17 in CI.
- Infra: Oracle VM.Standard.A1.Flex 2 OCPU / 12 GB, Docker Compose v2, Caddy 2.11.9, GHCR, node:26-bookworm-slim.

Critical requirements: pin Prisma packages together; VM connects only via Supavisor session-mode pooler on port 5432 (direct connection is IPv6-only on free plan); pool 5-10; runtime uses a non-bypass role (e.g. app_api), not postgres (which has BYPASSRLS); uploads never pass through Vercel functions.

### Expected Features

Must have (v1, table stakes):
- Discord OAuth login; guild-membership check; member/moderator/admin roles managed in the blog.
- Post state machine (draft -> pending -> approved | rejected, archived); create/edit/delete own; drafts; soft delete.
- Multiple images per post (WebP, EXIF stripped, limits, alt text); allowlisted video embeds only (YouTube via youtube-nocookie, Twitch clips, Streamable, Medal, Vimeo).
- Moderator approval queue with reject reason.
- Admin-managed categories (SA-MP, other games, memes, vida); no free-form tags.
- Chronological Explorar feed, cursor pagination, combinable URL-driven filters (category, member, year).
- Permalinks (ID + slug), Open Graph per post, sitemap of approved posts only, noindex on drafts/admin.
- Public profile and members directory.
- Flat comments and fixed reaction set on approved posts.
- Report content, ban/mute, rate limiting, append-only audit log.
- On-site notifications (comment, reaction, approval, rejection), polled.
- Discord webhook for approved posts (idempotent, retried, never blocks approval).
- Timeline of eras (admin CRUD, public page).
- Manual achievements (admin CRUD, grant, profile display).
- Discord role badges (name and colour) via read-only bot.
- "Post on behalf of" with custom occurred_at for backfilling the archive.
- Responsive, dark mode, WCAG 2.1 AA baseline, lightbox, pt-BR, static pages (About, Rules, Privacy/LGPD, Contact), pinned posts.

Should have (v1.x): Portuguese full-text search (tsvector, portuguese, unaccent); Acervo photo archive; "Neste dia" throwback; trusted-member auto-approval; one-level replies; RSS/Atom; era filter; click-to-load video facade.

Defer / out of scope: @mentions; people tagging in photos; rule-based achievements; video hosting; Discord CDN hotlinking; WebSockets/SSE; DMs; email notifications; email/password login; nested comments; raw HTML or free WYSIWYG; free-form tags; gamification; ML auto-moderation; algorithmic feed; two-way Discord sync; custom emoji sync; i18n framework; analytics dashboards; native app / PWA push.

### Architecture Approach

Browser talks only to Next.js (same origin). Next server code calls NestJS with `Authorization: Bearer <Supabase access token>`. Cookies never reach the API domain, removing cross-site cookie and CORS problems. Public routes are cookie-free and cacheable (ISR, tag-revalidated); user-specific UI is a client island calling BFF endpoints. Uploads go from browser directly to a private Supabase quarantine bucket via a signed URL minted by NestJS; NestJS validates, re-encodes with sharp, writes public variants and deletes the original.

Major components:
1. Next.js web (Vercel): public routes, app routes, BFF route handlers, proxy.ts session refresh, HMAC-verified /api/revalidate.
2. NestJS API (Docker on VPS, stateless): modules auth, users, discord, posts, moderation, tags, comments, reactions, media, notifications, achievements, timeline, audit, public-cache; guards for Supabase JWT, roles/policy, throttler.
3. Jobs worker (pg-boss on Postgres): webhook, revalidate, role sync, media GC, backup trigger.
4. Discord module: the only code that talks to Discord.
5. Supabase: Postgres with RLS (deny-by-default; app role without BYPASSRLS), Auth (Discord IdP), Storage (private quarantine, public media).
6. Caddy: TLS, only public listener.

Key patterns: BFF with Bearer forwarding; roles and ban state loaded per request from profiles (cached 30-60 s), never from JWT claims; transactional write plus side effects (state change, audit, notifications, job enqueue in one transaction); revision model for edits to approved posts; keyset pagination on (published_at, id); one shared "is public" predicate for query layer and RLS; leaf modules with explicit tx handle; revalidate first, announce second.

### Critical Pitfalls
1. Legacy HS256 secret or wrong claims (P-Auth). Verify via JWKS with pinned alg, issuer, audience. Never authorize from user_metadata. Negative tests in CI.
2. Relying on provider_token after login (P-Auth). Supabase neither stores nor refreshes it. Check membership via bot lookup; fail closed on Discord errors.
3. Cookie/session topology and getSession() trust (P-Infra, P-Auth). BFF, httpOnly cookies, getClaims(), allowlisted next redirect.
4. RLS illusion and exposed Data API (P-Infra). Non-bypass role, revoke anon/authenticated grants, RLS on every table in its creating migration, CI check, anon curl test.
5. Upload as "multer + save" (P-Posts). Magic bytes, reject SVG, limitInputPixels, concurrency 1-2, rotate before metadata strip, server filenames, quotas, abuse fixtures (decompression bomb, SVG, renamed file, GPS JPEG).
6. Stored XSS via rich text or embeds (P-Posts). Single sanitizing renderer; embeds stored as provider + id; CSP report-only first.
7. Oracle reclaimable and halved (P-Infra). Provision week one; size 2 OCPU / 12 GB; portable container; Plan B deployed once; external monitoring.
8. Supabase pause, no backups (P-Infra). Daily real DB query as keep-alive; nightly encrypted pg_dump off-box; restore drill.
9. Moderation state gaps (P-Mod). Transitions in one service with optimistic concurrency; no self-approval; append-only audit in same transaction; no status-flip edits.
10. Pending media publicly reachable (P-Posts, P-Mod). Private until approval; copy on approve; delete on unpublish.
11. Next.js caching model (P-Read). One model (Cache Components, cacheTag/cacheLife); no per-user data in cached functions; publish-revalidate-visible spike.
12. Webhook misuse and snowflakes as numbers (P-Engage, P-Auth). allowed_mentions parse empty, escaping, outbox; IDs as strings matching ^\d{17,20}$.

## Implications for Roadmap

Every phase should end deployed.

**Phase 0: Foundations (walking skeleton, deployed).** Rationale: Oracle capacity, DNS/TLS and Supabase connection are external blockers, cheapest to find early; DB baseline (occurred_at, RLS, app role) is hard to retrofit. Delivers: monorepo and packages/shared; CI (lint, typecheck, test, build, Postgres service); Nest platform (Zod config, Pino redaction, Helmet, exact trust-proxy hops, throttler, validation pipe, /health/live and /health/ready); multi-stage arm64 non-root Dockerfile; Caddy on VPS; Vercel project; hello-world BFF call; migration baseline with RLS and anon-denied CI check; nightly backup; keep-alive query; Oracle and domain decisions as ADR. Avoids pitfalls 5, 6, 7, 9, 10, 14, 23, 24, 25, 26, 28.

**Phase 1: Identity and Discord gate.** Rationale: every write needs can_post. Delivers: Discord sign-in via Supabase PKCE server-side in Next; httpOnly cookies; JWKS guard deny-by-default with @Public(); profiles keyed on auth.users.id, snowflakes as strings; bot-based guild check; discord_roles cache and sync; roles member/moderator/admin with admin panel; last-admin protection; first admin seeded by Discord ID via env; can_post = is_guild_member AND NOT banned. Avoids 1, 2, 3, 4, 19, 27. SPIKE REQUIRED.

**Phase 2: Posts, media and content pipeline.** Rationale: content format and media path must be fixed before public pages; occurred_at must be in the first posts migration. Delivers: post and revision model; occurred_at with precision; published_at; body format and sanitizer (see Conflicts); single renderer; CSP report-only; signed upload to quarantine; magic-byte check; sharp pipeline (WebP sm/md/lg/og); per-user quotas; orphan GC; admin categories; embed parser with allowlist. Avoids 7, 8, 13 (partly), 14, 17, 21, 30. SPIKE REQUIRED.

**Phase 3: Moderation, audit, jobs, publish pipeline.** Rationale: audit and jobs must land with moderation; they are the spine for feed, notifications, webhook, sitemap, OG, RLS. Delivers: review queue; approve / reject with reason / request changes; state machine with optimistic concurrency; append-only audit_log; pg-boss on session-mode connection; revalidate job (HMAC to Next); approval and rejection notifications; moderator dashboard; private-to-public media move; ban/mute enforced in guard; no self-approval. Avoids 12, 13, 3, 18.

**Phase 4: Public reading, filters, permalinks, SEO/OG.** Rationale: needs approved posts; proves cache model. Delivers: Explorar feed with keyset pagination and URL filters (category, member, year on occurred_at); /p/{id}/{slug} with 301 canonicalization; profiles and members directory; sitemap, robots, OG/Twitter, JSON-LD; static pages; empty/error/404 states; lightbox; dark mode; responsive; a11y. Avoids 15, 16, 21, 31, 32, 7. SPIKE REQUIRED.

**Phase 5: Engagement: comments, reactions, reports, notifications, abuse controls.** Rationale: public comments need report, ban and rate limits from day one. Delivers: flat post-moderated comments; fixed-set reactions with unique constraint and coalesced notifications; report flow; comment soft delete with tombstone; polled notification bell (30-60 s, refresh on focus); per-route throttling; notification retention job. Avoids 22, 11, 3.

**Phase 6: Discord webhook announcement and badge polish.** Delivers: webhook on approved only, idempotent via announced_at; embed with cover and link; allowed_mentions parse empty; retry honouring Retry-After; admin toggle for badge roles; badge rendering; cache refresh on role change. Order: revalidate first, announce second. Avoids 18, 29.

**Phase 7: Eras timeline and manual achievements.** Independent CRUD; can run parallel with 5-6 after Phase 4. Delivers: eras (starts_on/ends_on, public timeline, posts placed by occurred_at range, no join table); achievements (admin CRUD, grant with note, profile display, notification). Safest to slip (pitfall 20).

**Phase 8: Hardening and launch readiness.** Delivers: CSP enforced; XSS corpus test; anon curl test on every table; gitleaks clean; external port scan (only 22, 80, 443); restore drill with timing; Oracle rebuild drill; Plan B check; uptime monitor; alerts; feed load check with EXPLAIN; Playwright + axe happy path; real Discord and WhatsApp unfurl test; security review; dependency audit.

**v1.x (after launch):** Portuguese FTS, Acervo, Neste dia, RSS, trusted auto-approval, one-level replies, era filter, video facade, moderator dashboard consolidation, alt-text prompts.

Phase ordering rationale: identity before content (every write gated by can_post); expensive-to-retrofit schema decisions (occurred_at, revisions, RLS baseline, append-only audit, string snowflakes) made when the table is first created; audit and jobs land with moderation; public reading depends on approved content; comments wait for ban/report/rate limits; eras and achievements are isolated.

### Research Flags
- Phase 0: Oracle capacity, idle reclaim, PAYG (LOW); free hostname and Let's Encrypt limits (LOW); Vercel Hobby limits; Supabase pooler from VM.
- Phase 1 (NEEDS SPIKE): Discord bot GET /guilds/{id}/members/{uid} without privileged intent (MEDIUM); Supabase Discord identity field names; provider_token in route handler; httpOnly cookies via @supabase/ssr (MEDIUM/LOW); email-less accounts.
- Phase 2 (NEEDS SPIKE): sharp on actual VM shape; signed-upload flow and bucket limits; body format and sanitizer; CSP report-only.
- Phase 4 (NEEDS SPIKE): Next 16 caching (cacheTag, cacheLife, revalidateTag signature, described inconsistently); publish-revalidate-visible round trip; OG unfurl on Discord and WhatsApp in production.
- Phase 3: verify pg-boss enqueue within caller's transaction (MEDIUM); else hand-rolled outbox.
- Phases 5-6: light; confirm bot endpoint with chosen permissions; webhook rate limits.
- Standard patterns, skip research-phase: Phase 3 state machine and audit; Phase 7; Phase 8.

## Conflicts Between Research Files

| Topic | What the files say | Recommendation |
|---|---|---|
| Discord membership and role lookup [author] | STACK: bot-token lookup for everything. ARCHITECTURE and PITFALLS: user token with guilds.members.read at login, bot for resyncs. PROJECT.md assumes OAuth gives role IDs. | Bot-token lookup for login and all resyncs; guilds.members.read as fallback only. Confirm in Phase 1 spike. Changes a PROJECT.md assumption. |
| Upload path [author] | ARCHITECTURE: signed upload to private Supabase bucket, NestJS finalizes. STACK: browser multipart POST to NestJS, Multer in memory. PITFALLS: either; prefers disk or streaming. | Signed upload to Supabase quarantine. Keeps bytes off the 2-OCPU VM, avoids a browser-to-API route that breaks the BFF rule, keeps unvalidated bytes off public URLs. |
| Content format [author] | STACK: Tiptap HTML sanitized on write, rendered with dangerouslySetInnerHTML. ARCHITECTURE: Tiptap ProseMirror JSON rendered by React. FEATURES: Markdown or sanitized Tiptap. PITFALLS: raw Markdown via remark + rehype-sanitize; no WYSIWYG in v1. | Tiptap ProseMirror JSON rendered by a typed React renderer; no HTML stored. Fallback: Markdown with react-markdown. Do not store HTML rendered with dangerouslySetInnerHTML. |
| Edit after approval [author] | FEATURES: live immediately with "edited" marker, re-queue for media. ARCHITECTURE and PITFALLS: revision model, live version stays live. | Revision model; keep FEATURES' "edited" marker on top. |
| Pending-image visibility [author] | ARCHITECTURE: pending images in public bucket with unguessable paths ("unlisted"). PITFALLS 13: must return 403/404 anonymously. | Follow PITFALLS: private until approval; copy variants to public bucket on approval; remove on unpublish. |
| Background jobs | STACK: @nestjs/schedule + @nestjs/event-emitter (in-process). ARCHITECTURE and PITFALLS: pg-boss. STACK itself says pg-boss if durable retries are needed. | pg-boss from Phase 3; keep @nestjs/schedule for cron; drop the in-process event emitter from the plan. |
| ORM [author] | STACK: Prisma 7.10.1 with raw-SQL RLS. ARCHITECTURE: Drizzle, because Prisma "fights RLS and the auth schema". | Prisma 7.10.1; RLS as raw SQL migrations under either ORM. Author to confirm. |
| Next.js caching API | ARCHITECTURE: fetch with next.tags and revalidateTag (older model). PITFALLS: Cache Components ('use cache', cacheTag, cacheLife). | Cache Components; verify revalidateTag signature in Phase 4 spike. |
| Role sync frequency | STACK hourly; ARCHITECTURE every 6 h; PITFALLS daily. | Hourly catalog sync; per-member re-check on login and when guild_checked_at is over 24 h old. |
| Image variants | STACK: about 480 px thumb, 1920 px display. ARCHITECTURE: sm, md, lg (about 1600), og 1200x630. | sm (about 480), md (about 1200), lg (about 1920, capped), og (1200x630), all WebP; one definition in packages/shared. |
| Oracle PAYG and idle reclaim [author] | STACK: PAYG "reportedly" exempts from idle reclaim and may halve limits (LOW). PITFALLS: sources conflict. | Do not rely on PAYG until verified with Oracle. Plan for reclamation. |
| TLS hostname [author] | STACK: free DDNS subdomain or about US$10/yr domain. PITFALLS: about US$1/month domain as exception. ARCHITECTURE: free subdomain fine since cookies never reach the API host. | Free subdomain first; domain only if budget exception accepted. Let's Encrypt limits on free parent domains unverified. |
| Comment and moderation scope [author] | FEATURES: post-moderated comments; any Discord-logged user may comment. ARCHITECTURE: asks about non-members. PITFALLS: ban/mute and comment moderation. | Any logged-in Discord user may comment and react, with rate limits, report and ban at launch. |

## Decisions the Author Must Make

1. Discord membership lookup: bot-token lookup (recommended) vs user OAuth guilds.members.read at login. Changes PROJECT.md.
2. API hostname/domain: free subdomain (recommended) vs about US$10/yr domain.
3. Oracle idle reclaim: accept reclaim with Plan B (recommended until verified) vs PAYG with budget alerts.
4. Session topology: BFF with httpOnly cookies and Bearer (recommended; all researchers agree browser must not call the API directly). Consequence: uploads go via signed Supabase URL.
5. Content format: Tiptap ProseMirror JSON (recommended) vs Tiptap HTML vs Markdown.
6. "Year" filter semantics: occurred_at for filter and eras, published_at for feed order (recommended); show "Ocorreu em <ano>" when they differ.
7. Edit after approval: revision model (recommended) vs immediate edit with marker.
8. Who may comment and react: any logged-in Discord user with rate limits (recommended) vs guild members only. Also whether non-member profiles are public.
9. Ban, mute and comment moderation: missing from PROJECT.md Active requirements. Recommend adding ban (blocks post/comment/react, keeps account row), mute, report queue, moderator delete with tombstone, and a self-approval rule.
10. Pending-image visibility: private until approval (recommended) vs unlisted public.
11. ORM: Prisma 7.10.1 (recommended) vs Drizzle.
12. Former members and LGPD: keep posts under "former member"; define anonymize vs delete before launch.
13. Trusted-member auto-approval: v1.x (recommended).
14. Tag semantics: any-of within categories, AND with author and year (recommended); admin-only category creation (recommended).
15. Era overlap: allowed (recommended).
16. Post-on-behalf-of backfill: admin creates posts for "former member" placeholders with custom occurred_at (recommended).

Blocking for Phases 1-3 planning: items 1, 2, 4, 5, 6, 7, 8, 9.

## Confidence Assessment

| Area | Confidence | Notes |
|---|---|---|
| Stack | MEDIUM-HIGH | Versions from npm registry (HIGH). Unverified: Sentry ESM bootstrap with Nest 12; Vitest 4 + Vite 8 decorator metadata; bot endpoint without privileged intent (MEDIUM); app_api role + RLS on Supabase (MEDIUM). |
| Features | MEDIUM | Table stakes well grounded (HIGH). No live competitor inspection. Discord CDN expiry, Portuguese FTS config and LGPD specifics need rechecking. |
| Architecture | MEDIUM-HIGH | Supabase JWKS, provider-token behaviour, Discord endpoints verified (HIGH). @supabase/ssr httpOnly and provider_token persistence unconfirmed (MEDIUM/LOW). Next 16 API details from secondary sources. |
| Pitfalls | MEDIUM | Supabase, Discord, Oracle, Next behaviour checked against official docs. Oracle PAYG and halved-limit dates conflict (LOW). |

**Overall confidence:** MEDIUM. Phases 0 and 1 can be planned now, subject to the Phase 1 spike. Phases 2 and 4 need spikes before task-level planning. Oracle and domain items are business decisions to settle in Phase 0.

### Gaps to Address
- Discord bot endpoint without privileged intents: real call in Phase 1 spike; fallback guilds.members.read at login.
- Supabase Discord identity fields (provider_id, identities[]): confirm in a real login; store as validated string.
- provider_token and httpOnly with @supabase/ssr: spike; fallback server-only client with documented exception.
- Email-less Discord accounts: test; show a human error page.
- sharp on the provisioned shape: confirm 2 OCPU A1 vs 1 GB micro; concurrency 1-2; 40-50 MP cap.
- Animated GIF memes: reject in v1, first frame, or capped animated WebP. Decide in Phase 2.
- Next 16 caching and revalidateTag: verify against installed version in Phase 4.
- pg-boss enqueue in transaction: verify in Phase 3; else hand-rolled outbox with FOR UPDATE SKIP LOCKED.
- Supabase pause restore window: docs say 1 year, changelog says 90 days. Plan for 90.
- Oracle A1 limits and PAYG: confirm with Oracle.
- Oracle home region: irreversible; decide before creating tenancy; prefer Brazil-proximate if available.
- Let's Encrypt on free DNS parents: verify before deploy.
- Discord rate limits; GitHub arm64 runners for a private repo: confirm in Phases 0 and 5-6.
- Missing PROJECT.md requirements: ban/mute, comment moderation, report flow, LGPD deletion, former-member policy, edit policy, pending-image policy. Add to Active before roadmap.
- Privacy notice: use a template; review in Phase 4.

## Sources

Primary (HIGH): npm registry (2026-11-14); Supabase docs (JWT signing keys and JWKS, social login, API keys, RLS, connecting to Postgres, pausing, billing); Discord developer docs (OAuth2, Guild resource); Oracle Always Free resource reference; Next.js 16 announcement and caching docs; NestJS 12 migration guide; Vercel function limits; sharp docs; Docker Hub tags.

Secondary (MEDIUM): Prisma 7 upgrade guide and Prisma 8 status; Tiptap Next.js guide; Sentry NestJS guide and pricing; Node release lines; product knowledge of Ghost, WordPress, Discourse, phpBB, Discord forums, Guilded and clan sites (FEATURES; not re-verified live).

Tertiary (LOW): Oracle PAYG and idle-exemption claims; Oracle halved-limit date (linuxiac, third-party explainer); Render and Koyeb free tiers (contradictory); free DDNS and Let's Encrypt limits; community threads on missing provider_token; Supabase pause-window discrepancy.

Integrity note: several fetched pages contained embedded text asking the reader to file a documentation-feedback report. Treated as untrusted and ignored.

---
*Research completed: 2026-11-14*
*Ready for roadmap: yes, after the author resolves blocking decisions 1, 2, 4, 5, 6, 7, 8, 9.*
