# Architecture Research

**Domain:** Community/clan blog (public read, Discord-gated write, moderated publishing, media archive)
**Stack (fixed by author):** Next.js on Vercel + NestJS in Docker on Oracle Cloud Always Free VPS + Supabase (Postgres, Auth via Discord, Storage)
**Researched:** 2026-11-14
**Overall confidence:** MEDIUM-HIGH (platform facts verified against official docs; items tagged `[VERIFY]` need a spike in the phase that builds them)

Confidence tags used below: **[HIGH]** confirmed in official docs this session; **[MED]** consistent community/secondary sources or strong prior knowledge, not re-verified; **[LOW]** inference, must be spiked.

---

## Executive Position (the five decisions that shape everything)

1. **The browser never calls NestJS. Next.js is a Backend-for-Frontend (BFF).** Server Components, Server Actions and Route Handlers in Next call NestJS server-to-server with `Authorization: Bearer <supabase access token>`. This removes the entire cross-domain cookie/SameSite/CORS problem class (Vercel domain vs VPS domain), because session cookies live only on the Next origin. NestJS still owns 100% of business rules, so the decision "frontend talks only to NestJS" is preserved in spirit and in trust boundaries.
2. **Next.js owns the Supabase session (via `@supabase/ssr`, server-side only, no Supabase client in the browser for auth/data); NestJS is a pure resource server** that verifies the JWT against Supabase's JWKS and loads the app role/ban status from its own `profiles` table on each request (cached briefly). Roles are never trusted from the JWT.
3. **Capture the Discord `provider_token` exactly once, in the OAuth callback, use it immediately for the `guilds.members.read` membership check, and do not persist it.** Supabase does not store or refresh provider tokens [HIGH]. Ongoing role freshness comes from the read-only bot (REST only), not from the user's token.
4. **Public pages are static/ISR, tag-revalidated by NestJS on approval.** Public routes must not read cookies (that makes them dynamic and defeats ISR/OG caching). User-specific UI (menu, reaction state, comment form) hydrates client-side via BFF endpoints.
5. **Side effects (Discord webhook, ISR revalidation, role sync, media cleanup) run as retryable jobs backed by Postgres (transactional outbox / pg-boss), not Redis and not inline in request handlers.** Zero-cost constraint, single VPS, and needs durability across restarts.

---

## Standard Architecture

### System Overview

```
                         BROWSER (visitor / member / mod / admin)
        ┌────────────────────────┬───────────────────────────────┬─────────────────────────┐
        │ HTML/RSC/JS            │ PUT image bytes               │ <img> / OG crawlers      │
        │ (same-origin cookies)  │ (signed upload URL)           │ (Discord, WhatsApp)      │
        ▼                        ▼                               ▲                          │
┌───────────────────────────┐   ┌─────────────────────────────┐  │                          │
│  VERCEL — Next.js (web)   │   │  SUPABASE STORAGE           │──┘ public CDN URLs          │
│  ───────────────────────  │   │  bucket: uploads-incoming   │ (pre-generated WebP variants)│
│  Public routes: ISR/static│   │    (private, quarantine)    │                              │
│  App routes: dynamic      │   │  bucket: media (public)     │◄─────────────────────────────┘
│  proxy.ts: session refresh│   └──────────────▲──────────────┘
│  BFF: Server Actions +    │                  │ service-role (download/upload/delete)
│       Route Handlers      │                  │
│  /api/revalidate (secret) │◄── POST (HMAC) ──┤
└─────────────┬─────────────┘                  │
              │ HTTPS, Bearer JWT (server→server)
              │ (+ X-BFF-Key, X-Client-IP)      │
              ▼                                 │
┌─────────────────────────────────────────────────────────────────────────┐
│  ORACLE VPS — Docker Compose                                            │
│  ┌─────────┐   ┌───────────────────────────────────────────────────┐    │
│  │  Caddy  │──►│ NestJS API (single container, stateless)          │    │
│  │ (TLS)   │   │  Guards: SupabaseJwt → Roles/Policy → Throttler   │    │
│  └─────────┘   │  Feature modules (auth, users, posts, moderation, │    │
│                │    comments, reactions, media, notifications,     │    │
│                │    achievements, timeline, tags, discord, audit)  │    │
│                │  Jobs worker (pg-boss): webhook, revalidate,      │    │
│                │    role-sync, media-gc                            │    │
│                └──────┬───────────────────────────┬────────────────┘    │
└───────────────────────┼───────────────────────────┼─────────────────────┘
                        │ Postgres (Supavisor        │ HTTPS
                        │ session-mode pooler, IPv4) │
                        ▼                            ▼
              ┌───────────────────┐       ┌───────────────────────────┐
              │ SUPABASE          │       │ DISCORD                   │
              │ Postgres (+RLS)   │       │  • OAuth user token →     │
              │ Auth (Discord IdP)│       │    /users/@me/guilds/{id}/│
              │ Storage           │       │    member (login only)    │
              └───────────────────┘       │  • Bot token (REST) →     │
                                          │    guild roles / member   │
                                          │  • Webhook ← approved post│
                                          └───────────────────────────┘
```

**Direction of every arrow that matters:**
- Browser → Next (cookies, same-origin). Browser → Supabase Storage (upload bytes only, with a one-time signed URL minted by NestJS). Browser never → NestJS, never → Supabase DB/Auth REST directly.
- Next → NestJS (server-to-server). NestJS → Next (only `POST /api/revalidate`, HMAC-signed).
- NestJS → Supabase (Postgres via pooler; Storage via service-role key; JWKS fetch). NestJS → Discord (bot REST, user-token one-shot at login, webhook).
- Supabase service-role key and bot token exist **only** on the VPS. Vercel holds only the public Supabase URL + publishable (anon) key, the API base URL, and the revalidate secret.

### Component Responsibilities

| Component | Responsibility | Implementation notes |
|-----------|----------------|----------------------|
| **web: public routes** | Feed ("Explorar"), post page, profile, timeline, tag/year filters; SEO/OG | RSC + `fetch(..., { next: { tags } })`, ISR. No cookies/headers access. |
| **web: app routes** | Compose/edit post, moderation queue, admin panel, notifications, my profile | Dynamic RSC + Server Actions; forwards Bearer. |
| **web: `proxy.ts`** (Next 16; `middleware.ts` in ≤15) | Refresh Supabase session cookies (Server Components cannot write cookies) | Narrow `matcher`: only app routes + `/api/*` BFF + `/auth/*`. Public routes skipped. |
| **web: auth route handlers** | `/auth/login` (start OAuth), `/auth/callback` (exchange code, bootstrap), `/auth/logout` (POST) | Only place `exchangeCodeForSession` and `provider_token` handling occur. |
| **web: BFF route handlers** | Thin forwarders for client-side calls (SWR/TanStack polling, reactions, comments) | Attach Bearer, forward client IP, refresh-and-retry once on 401. Origin check on non-GET (CSRF). |
| **web: `/api/revalidate`** | Receive NestJS signal → `revalidateTag` / `revalidatePath` | HMAC-verified, constant-time compare, timestamp window. |
| **api: Auth module** | `SupabaseJwtGuard` (jose + remote JWKS), `@Public()`, `OptionalAuth`, `@CurrentUser()`, session bootstrap endpoint | Verifies `iss`, `aud=authenticated`, `exp`; rejects anonymous users. |
| **api: Users module** | Profiles, app roles (member/moderator/admin), ban, admin panel endpoints | Source of truth for authorization. |
| **api: Discord module** | Only module that speaks Discord HTTP. OAuth member-check client, bot REST client, role catalog sync, webhook publisher | Rate-limit aware (429 / `Retry-After`), typed clients. |
| **api: Posts module** | Post + revision lifecycle, feed queries, slug/permalink, embed parsing | Owns state machine. Public read side separated from authoring side. |
| **api: Moderation module** | Review queue, approve/reject/request-changes, decisions log | Depends on Posts (one-way). Writes audit + notification + outbox in one transaction. |
| **api: Tags module** | Curated categories (admin-managed) | Small CRUD; tags are slugs. |
| **api: Comments / Reactions** | Threaded (1 level) comments; fixed-set reactions; soft delete; hide by mod | Rate-limited hot paths. |
| **api: Media module** | Upload intent, finalize (validate + sharp), variants, GC of orphans | Concurrency-limited sharp queue. |
| **api: Notifications** | Insert rows (leaf module), list/unread-count/mark-read | Polled, not pushed (v1). |
| **api: Achievements / Timeline** | Admin-managed catalog + grants; eras/milestones | Simple CRUD + audit. |
| **api: Audit module** | Append-only write API used inside the caller's transaction; admin read endpoint | DB role has no UPDATE/DELETE on the table. |
| **api: Jobs (pg-boss)** | Durable queue + cron on Postgres | Needs session-mode connection (not transaction pooler). |
| **api: Platform** | Config (zod-validated env), pino logging + request id, Helmet, Throttler, Terminus health, global exception filter, Sentry | Cross-cutting, global. |
| **Supabase Postgres** | Data + RLS deny-by-default | Backend connects as a dedicated non-superuser role. |
| **Supabase Storage** | `uploads-incoming` (private), `media` (public) | Variants generated by us (Supabase image transforms are a paid-plan feature [MED]). |

---

## Recommended Project Structure

```
blog-no-law/                          # pnpm workspaces + Turborepo
├── apps/
│   ├── web/                          # Next.js (Vercel; Root Directory = apps/web)
│   │   ├── src/app/
│   │   │   ├── (public)/             # ISR/static: /, /explorar, /p/[id]/[slug], /u/[handle], /linha-do-tempo
│   │   │   ├── (app)/                # dynamic: /novo, /meus-posts, /moderacao, /admin, /notificacoes
│   │   │   ├── auth/{login,callback,logout}/route.ts
│   │   │   ├── api/{revalidate,me,notifications,reactions,comments,...}/route.ts   # BFF
│   │   │   └── sitemap.ts, robots.ts
│   │   ├── src/lib/
│   │   │   ├── api-client.ts         # typed fetch wrapper (public + authed variants)
│   │   │   └── supabase/{server.ts,proxy.ts}   # @supabase/ssr helpers (server only)
│   │   └── proxy.ts
│   └── api/                          # NestJS
│       ├── src/
│       │   ├── main.ts               # helmet, trust proxy, validation, shutdown hooks
│       │   ├── platform/             # config, logging, health, throttler, db, jobs, errors
│       │   ├── modules/
│       │   │   ├── auth/  users/  discord/  posts/  moderation/  tags/
│       │   │   ├── comments/  reactions/  media/  notifications/
│       │   │   ├── achievements/  timeline/  audit/  public-cache/
│       │   │   └── <module>/{*.controller.ts,*.service.ts,*.repository.ts,*.policy.ts,dto/,jobs/}
│       │   └── db/{schema/,migrations/}          # Drizzle schema + SQL migrations incl. RLS
│       ├── test/                     # e2e (supertest) against real Postgres
│       └── Dockerfile                # multi-stage, `turbo prune api --docker`
├── packages/
│   ├── contracts/                    # zod schemas + inferred types + route/response shapes (single source of truth)
│   ├── tsconfig/  eslint-config/     # shared config
├── infra/
│   ├── docker-compose.yml            # caddy + api (+ optional log shipper)
│   ├── Caddyfile
│   └── scripts/deploy.sh
├── .github/workflows/                # ci.yml (lint, typecheck, test, build), deploy-api.yml
└── turbo.json, pnpm-workspace.yaml
```

### Structure Rationale

- **`packages/contracts` with Zod, not class-validator classes.** Decorated classes cannot be shared with the browser bundle cleanly; Zod schemas validate on the API (`nestjs-zod` pipe) *and* type the web client (`z.infer`). One definition, no codegen step. Serve OpenAPI/Swagger in dev only if wanted for exploration. [MED] (`ts-rest` is the alternative if you want a contract-first router; heavier.)
- **Drizzle schema lives in `apps/api`, not shared.** The web app must never know table shapes; it only knows contracts (DTOs). Prevents DB-type leakage into the UI. (ORM choice is a STACK.md concern; Drizzle is recommended here because it supports RLS/policy declarations and plain-SQL migrations [MED]. Prisma works but fights RLS and the `auth` schema.)
- **Migrations are SQL, versioned in the repo, applied by CI/CD.** They include RLS enables, policies, grants/revokes, triggers (audit immutability). The Supabase dashboard is never a source of truth.
- **Feature-module folders with `repository` + `policy` files.** Services hold use-cases, repositories hold queries, policies hold "can X do Y to Z" rules. Avoids a god `PostsService` (the most common NestJS blog failure mode).
- **`(public)` vs `(app)` route groups** make the cache boundary explicit: nothing in `(public)` may import `cookies()`/`headers()`.
- **`turbo prune api --docker`** keeps the API image small (important on a free ARM/micro VM) and the Docker layer cache effective.

---

## Authentication Architecture

### Login flow (all steps server-side on Next; PKCE)

```
1. User clicks "Entrar com Discord"  →  GET /auth/login   (Next route handler)
   └─ supabase.auth.signInWithOAuth({ provider:'discord',
        options:{ redirectTo:`${SITE}/auth/callback`, scopes:'identify guilds.members.read',
                  skipBrowserRedirect:true }})
   └─ PKCE code_verifier cookie written via setAll (httpOnly, Secure, SameSite=Lax)
   └─ 302 → returned authorize URL (Supabase → Discord consent)

2. Discord → Supabase /auth/v1/callback → 302 → {SITE}/auth/callback?code=...

3. GET /auth/callback  (Next route handler)
   a. { data:{session} } = await supabase.auth.exchangeCodeForSession(code)
      → session cookies set (httpOnly)
   b. providerToken = session.provider_token   (present ONLY now; dropped after refresh) [HIGH]
   c. POST {API}/auth/session/bootstrap
        Authorization: Bearer <session.access_token>
        body: { providerToken }                       (HTTPS, server→server, never logged)
   d. NestJS: verify JWT → upsert `profiles` (id=sub, discord_id, username, avatar)
              → Discord GET /users/@me/guilds/{GUILD_ID}/member  with the user token
                  200 → is_guild_member=true, store role ids in member_discord_roles
                  404/403 → is_guild_member=false (can read/comment/react, cannot post)
              → stamp guild_checked_at; discard the token (do not persist)
   e. 302 → `next` param or "/"
```

Key facts:
- Supabase **does not store** provider tokens and **does not refresh** them; the app must capture them at sign-in and use the provider's refresh token itself [HIGH, Supabase social-login docs]. Discord access tokens last 7 days (`expires_in: 604800`) and the authorization-code grant returns a `refresh_token` [HIGH, Discord OAuth2 docs].
- `guilds.members.read` enables `GET /users/@me/guilds/{guild.id}/member` [HIGH], returning that user's member object (role IDs, nickname).
- **Recommendation: do not store the Discord refresh token.** Storing it creates a secret-at-rest liability (encryption key management) for a benefit (re-checking membership without the bot) the bot already provides. Revisit only if bot-based checks prove insufficient.
- The bootstrap call must be **idempotent** and tolerate Discord failure: if Discord is down at login, create the profile with `is_guild_member=null` (unknown) and let the bot reconciliation job fix it; do not block login.
- `[VERIFY]` in the auth spike: that `session.provider_token` is populated after `exchangeCodeForSession` in a route handler with the chosen `@supabase/ssr` version, and that overriding cookie options to `httpOnly: true` in `setAll` does not break the server client. (`@supabase/ssr` defaults to non-httpOnly because its *browser* client must read cookies; with zero browser Supabase auth usage, httpOnly is feasible — requirement "cookies httpOnly" depends on this.) [MED/LOW]

### Per-request flow (authenticated)

```
Browser ── cookie ──► Next (proxy.ts refreshes if near/after expiry, rewrites Set-Cookie)
                       └─ Server Component / Action / Route Handler:
                            token = (await supabase.auth.getSession()).data.session.access_token
                            fetch(API/..., { headers:{ Authorization:`Bearer ${token}`,
                                                       'X-Client-IP': ip, 'X-BFF-Key': secret }})
                                  │
NestJS: SupabaseJwtGuard ── jose.jwtVerify(token, remoteJWKS, {issuer, audience:'authenticated'})
        → UserContextService.load(sub)  (profiles: role, banned_at, is_guild_member; LRU 30–60s)
        → RolesGuard / PolicyService → controller → service → repository (tx) → audit/notify/outbox
```

- **JWT verification:** Use asymmetric JWT signing keys and verify with `jose` + `createRemoteJWKSet(<SUPABASE_URL>/auth/v1/.well-known/jwks.json)` (cached, no network per request). Supabase recommends a JWT library or `getClaims()` rather than hand-rolled checks; the JWKS endpoint returns keys only when asymmetric signing is enabled [HIGH]. If the project still issues legacy HS256 tokens, enable the new signing keys in the dashboard first (do not ship the shared HS256 secret to the API) [MED]. The guard should reject unknown `alg` explicitly.
- **Statelessness gap:** a valid JWT stays valid until `exp` (default 1h) even after logout/ban. Mitigation = DB check of `banned_at`/role on each request (cheap, cached ≤60s, invalidated on role/ban change). This is also why roles are not JWT claims: role changes must apply immediately.
- **Refresh handling:** `proxy.ts` is the one place cookies can be rewritten on page navigations; BFF route handlers/actions can also write cookies, so on a 401 from NestJS they call `refreshSession()` once and retry. Server Components cannot write cookies — never refresh there.
- **Public routes skip `proxy.ts`** (matcher). Logged-in state in the public layout is a client island calling `GET /api/me` (BFF → `GET /me`), SWR-cached. Trade-off: a short flash of "logged out" header on first paint; acceptable for ISR cache hits. (Next 16 Cacheable Components/PPR can turn this into a streamed dynamic hole later [MED].)

### Domain / cookie strategy (the cross-domain question)

| Option | Verdict |
|--------|---------|
| Browser calls API directly with cookie across `*.vercel.app` ↔ VPS host | **Reject.** Cross-site → SameSite=None; Secure + CORS credentials + third-party-cookie blocking (Safari/Chrome). Fragile. |
| Shared parent domain (`blog.x.com` + `api.x.com`), `Domain=.x.com` cookie, NestJS parses Supabase's chunked `sb-*-auth-token` cookie | Works, but NestJS must understand Supabase's cookie format and refresh is split across two places. **Not recommended.** |
| **BFF: browser only talks to the Next origin; Next→NestJS with Bearer** | **Recommended.** Cookies are first-party on whatever Next domain you use (`*.vercel.app` works; a custom domain is optional polish). |

Consequences:
- The API only needs a **TLS hostname reachable from Vercel**, not a "nice" domain, and not cookie-compatible with the web domain. Zero-cost option: a free DuckDNS-style subdomain + Caddy automatic Let's Encrypt. Public-suffix cookie restrictions are irrelevant because no cookie ever lives on the API host. [MED]
- NestJS CORS can be `origin: false` (or locked to the web origin for Swagger in dev). There is no browser→API traffic to allow.
- CSRF: the API uses Bearer tokens (not ambient cookies) → CSRF-immune. The BFF layer is the CSRF surface: Server Actions have built-in Origin checks; custom route handlers that accept cookies on POST/PUT/DELETE must verify `Origin`/`Sec-Fetch-Site` and use `SameSite=Lax` cookies.
- **Client IP:** server-side calls arrive from Vercel IPs. Rate limiting keyed on IP is meaningless for BFF traffic. Key throttlers by `user.id` for authenticated routes; for anonymous routes forward the end-user IP in `X-Client-IP` and honor it **only** when a valid `X-BFF-Key` shared secret accompanies the request (and set Nest/Express `trust proxy` correctly for Caddy). Anonymous public reads are mostly absorbed by ISR anyway.
- Vercel preview URLs: add wildcard redirect URLs in Supabase Auth settings; Discord's registered redirect stays the single Supabase callback URL.

### Authorization model

- `app_role` enum on `profiles`: `member | moderator | admin`. Plus orthogonal capability `can_post = is_guild_member AND NOT banned`. "Logged in via Discord but not in the guild" = commenter/reactor only (matches PROJECT.md).
- `RolesGuard` for coarse checks (`@Roles('moderator','admin')`); `*.policy.ts` for resource rules (author edits own draft; mods cannot edit an author's published text without audit; only admin changes roles). Plain functions are enough at this size; CASL is overkill.
- Guild-membership staleness: nightly reconcile via bot, plus lazy re-check on post creation if `guild_checked_at` older than 24h. Someone who left the server loses posting rights within a day, not never.

---

## Discord Integration Architecture

**Two distinct credentials, two distinct jobs:**

| Credential | Used for | When | Persisted? |
|------------|----------|------|-----------|
| User OAuth token (`guilds.members.read`) | "Is this person in the clan server, and which role IDs?" | Login callback only | No |
| Bot token (read-only, REST only) | Role catalog (name, color, position); re-checking a member; nightly reconcile | Cron + on-demand | Env var on VPS only |
| Webhook URL | Announce approved posts | Job on approval | Env var on VPS only |

- **Bot does not need a Gateway connection.** All needed calls are REST: `GET /guilds/{id}/roles` and `GET /guilds/{id}/members/{user_id}`. `List Guild Members` requires the privileged `GUILD_MEMBERS` intent; `Get Guild Member` documents no such requirement [HIGH, Discord docs]. With 15–50 members, per-member GETs are trivial — avoid the list endpoint and avoid a persistent Gateway process. `[VERIFY]` with a real call in the Discord phase.
- **Role catalog = sync job + cache table, not on-demand per page view.** `discord_roles(id, name, color, position, managed, synced_at)`. Cron (every 6h) + admin "sync now" button + lazy refresh when a member references an unknown role ID. Pages read the table; Discord is never in a page-render path.
- **Color field:** Discord is migrating role `color` → `colors{primary,secondary,tertiary}`; `color` is still returned but marked deprecated [HIGH]. Store `color_primary` (int) and optional `color_secondary/tertiary`; do not assume `color` forever.
- **Which badges display** is an admin choice (`discord_roles.show_as_badge`), because the clan server may have noise roles ("@everyone", bots, managed roles). Sort by `position`.
- **Rate limits:** wrap Discord HTTP in a client honoring `429 Retry-After` and the bucket headers; reconcile job processes members sequentially with small delay.
- **Webhook publisher** is a pg-boss job (see Jobs), idempotent via `posts.announced_at`; payload is an embed (title, author, cover variant, canonical link). Failure never rolls back approval.

---

## Data Model (logical)

Conventions: `uuid` PKs (`gen_random_uuid()`), `timestamptz` everywhere, soft delete only where history matters (comments, posts), FK `ON DELETE` explicit, every table has RLS enabled.

```
profiles            id (=auth.users.id) PK, discord_id UNIQUE, username, display_name, avatar_url,
                    app_role enum(member|moderator|admin) DEFAULT member,
                    is_guild_member bool NULL(unknown), guild_checked_at, banned_at NULL,
                    bio, created_at
discord_roles       id (discord snowflake text) PK, name, color_primary, color_secondary, color_tertiary,
                    position, managed bool, show_as_badge bool, synced_at
member_discord_roles profile_id FK, role_id FK, PK(profile_id, role_id)

posts               id PK, author_id FK, slug, status enum(draft|pending|approved|archived),
                    current_revision_id FK→post_revisions, published_revision_id FK NULL,
                    event_date date NULL,          -- when the thing HAPPENED (drives "ano" filter / eras)
                    published_at NULL,             -- when approved (drives feed order)
                    announced_at NULL, created_at, deleted_at NULL
post_revisions      id PK, post_id FK, rev_no int, title, summary, body jsonb (restricted doc schema),
                    cover_media_id FK NULL, state enum(draft|submitted|approved|rejected|superseded),
                    submitted_at, created_at         -- append-only after submit
post_embeds         (inside body JSON as {type:'embed', provider:'youtube', id:'abc'}; validated on write;
                     provider allowlist; never store raw iframe/HTML)
post_media          revision_id FK, media_id FK, position, caption, PK(revision_id, media_id)
media               id PK, owner_id FK, bucket, base_path, mime, bytes, width, height, blurhash NULL,
                    variants jsonb ({"sm":..,"md":..,"lg":..,"og":..}), alt_text,
                    status enum(pending|processing|ready|failed), created_at
tags                id PK, slug UNIQUE, name, is_primary bool, sort_order       (admin-curated)
post_tags           post_id FK, tag_id FK, PK(post_id, tag_id)

post_reviews        id PK, post_id FK, revision_id FK, reviewer_id FK,
                    decision enum(approved|rejected|changes_requested), reason text, created_at
comments            id PK, post_id FK, author_id FK, parent_id FK NULL (max depth 1),
                    body text (plain/limited markdown), status enum(visible|hidden),
                    created_at, edited_at NULL, deleted_at NULL
reactions           post_id FK, profile_id FK, kind enum(fixed set), created_at,
                    PK(post_id, profile_id, kind)
notifications       id PK, recipient_id FK, type enum, actor_id FK NULL, post_id NULL, comment_id NULL,
                    data jsonb, read_at NULL, created_at; INDEX(recipient_id, read_at, created_at DESC)
timeline_entries    id PK, kind enum(era|milestone), title, description, starts_on date, ends_on date NULL,
                    created_by FK
achievements        id PK, name, description, icon_media_id NULL, created_by FK
member_achievements achievement_id FK, profile_id FK, granted_by FK, note, granted_at,
                    PK(achievement_id, profile_id)
audit_log           id bigserial PK, at timestamptz, actor_id FK NULL, action text, target_type, target_id,
                    before jsonb NULL, after jsonb NULL, request_id, ip_hash NULL
                    -- append-only: REVOKE UPDATE, DELETE from app role + trigger that raises
jobs/outbox         owned by pg-boss schema (or an `outbox_events` table if hand-rolled)
```

Design rationale and traps:

- **Revision pointers (`current_revision_id` vs `published_revision_id`).** Public queries read the *published* revision; an author editing an approved post creates a new revision that goes through review **without unpublishing the live page** (important for SEO and shared links). Approval = pointer swap + `published_at` (first time). Rejection only marks the revision. Mod decisions attach to a specific revision, so the audit trail is exact. If this feels heavy for v1, the fallback is "editing an approved post is moderator/admin-only" — but decide explicitly; the naive "set status back to pending" silently takes content offline. **Flag for discuss-phase.**
- **`event_date` vs `published_at`.** For a clan archive, "year" almost certainly means *when it happened* (a 2013 photo posted in 2026). Feed order and "recent" use `published_at`; the year filter and era placement use `event_date` (defaults to publish date when unknown). Index `(event_date)` and `(published_at DESC, id)`. **Flag for requirements confirmation.**
- **Eras are standalone `timeline_entries`, not FKs on posts.** A post belongs to an era by date range overlap (derived at query time). Re-defining an era never requires a data migration.
- **Feed pagination = keyset (cursor) on `(published_at DESC, id DESC)`,** not OFFSET. Filters (multi-tag, author, year) are `EXISTS`/`WHERE` clauses; define tag semantics (any-of vs all-of) up front — default recommended: any-of within category chips, AND with author/year.
- **Reactions are a fixed enum set** (e.g., like, haha, fire, sad) → no arbitrary unicode, simple unique key, easy counts (`GROUP BY kind`; no counter cache at this scale). Notifications for reactions are coalesced (one per actor/post/type via unique index + upsert) to avoid spam.
- **Comment threading depth 1** (reply to top-level only) — avoids recursive CTEs and keeps UI sane.
- **Slugs:** permalink `/p/{shortid}/{slug}`; the id is authoritative, slug mismatch 301s to canonical. Title edits never break shared links.
- **Body format:** a restricted structured document (e.g., TipTap/ProseMirror JSON or Markdown AST) validated by a schema on write, rendered through React components. Never persist client-provided HTML and never `dangerouslySetInnerHTML`; if HTML is unavoidable, sanitize on write *and* render (`sanitize-html`/DOMPurify-jsdom). Embeds stored as `{provider,id}`, rendered as `youtube-nocookie` iframes from an allowlist. (Editor library = STACK.md.)
- **Where RLS fits:** see "RLS strategy" below.

### RLS strategy (second layer that actually means something)

Because the browser never uses Supabase's data API, RLS protects against: leaked anon/publishable key, a future mistake exposing PostgREST, a dev querying with the wrong key.

Tier 1 (ship in v1, cheap):
1. `ENABLE ROW LEVEL SECURITY` on every table in the same migration that creates it (CI check: query `pg_tables`/`pg_class` and fail if any app table lacks RLS).
2. `REVOKE ALL ON ALL TABLES` from `anon`/`authenticated`; grant nothing, or `SELECT` on approved-only views through policies. Prefer also **removing app schemas from the exposed Data API schemas** (or disabling the Data API) in Supabase settings. [MED]
3. NestJS connects as a dedicated role (`app_backend`) — not `postgres`, not `service_role` — with only the grants it needs; `audit_log` has INSERT/SELECT only.
4. Policies for the narrow public-read case (approved posts/published revisions, tags, public profile fields) so even a leaked anon key sees nothing private.

Tier 2 (hardening phase, educational): per-request RLS context — wrap each authenticated request in a transaction doing `SET LOCAL ROLE authenticated` + `set_config('request.jwt.claims', ...)`/`app.user_id`, with policies expressing ownership/role rules. Real enforcement, but every request becomes a transaction and policies duplicate service logic. Do this after features stabilize, not before.

Connection note: Supabase direct DB host is IPv6-only on the free plan; Oracle VMs are IPv4 by default → use the **Supavisor pooler in session mode** (needed by pg-boss and LISTEN-style features; transaction mode breaks prepared statements/session features). [MED] `[VERIFY]` at provisioning.

---

## Architectural Patterns

### Pattern 1: BFF with token forwarding

**What:** Next server code is the only API client; mints no tokens, only forwards the user's Supabase access token.
**When:** Always, for this project.
**Trade-offs:** + no CORS/cookie headaches, + secrets off the browser, + one place for refresh/retry. − extra hop (browser→Vercel→VPS) adds latency; − Vercel function body limit (~4.5 MB) rules out proxying uploads (hence direct-to-Storage).

```typescript
// apps/web/src/lib/api-client.ts (server only)
export async function api<T>(path: string, init: RequestInit & { auth?: boolean; tags?: string[] } = {}) {
  const headers = new Headers(init.headers);
  if (init.auth) {
    const supabase = await createServerSupabase();            // @supabase/ssr, cookies() read
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new UnauthenticatedError();
    headers.set('Authorization', `Bearer ${session.access_token}`);
    headers.set('X-Client-IP', await clientIp());
    headers.set('X-BFF-Key', process.env.BFF_KEY!);
  }
  const res = await fetch(`${process.env.API_URL}${path}`, {
    ...init, headers,
    next: init.auth ? undefined : { tags: init.tags },       // public GETs are cacheable + taggable
    cache: init.auth ? 'no-store' : undefined,
  });
  if (!res.ok) throw await ApiError.from(res);
  return res.json() as Promise<T>;                            // parse with a contracts schema
}
```

### Pattern 2: Tag-based ISR with signed push revalidation

**What:** Public fetches carry tags (`feed`, `post:{id}`, `profile:{id}`, `timeline`, `tag:{slug}`). On approval/edit/delete, NestJS enqueues a `revalidate` job → HMAC-signed `POST web/api/revalidate` → `revalidateTag(...)`.
**When:** Every state change that alters public content.
**Trade-offs:** + near-instant publish, + OG preview fresh before the Discord webhook fires (**order the jobs: revalidate first, announce second**, otherwise Discord's crawler can cache a 404/stale card). − needs a fallback: also set a time-based `revalidate` (e.g., 1h) so a failed revalidation self-heals. `revalidateTag` signature changed in Next 16 (profile argument) `[VERIFY]` against the installed version; do not copy 15.x snippets.

```typescript
// apps/api: after approve transaction commits (job handler)
await fetch(`${WEB_URL}/api/revalidate`, {
  method: 'POST',
  headers: { 'x-ts': ts, 'x-signature': hmacSha256(secret, `${ts}.${body}`) },
  body: JSON.stringify({ tags: ['feed', `post:${postId}`, `profile:${authorId}`] }),
});
```

Comments/reactions are **not** part of the ISR payload: they load client-side via BFF (public GET) so every comment doesn't invalidate the page, and counts are always fresh.

### Pattern 3: Transactional write + durable side effects (outbox via pg-boss)

**What:** A use-case runs in one DB transaction: state change + `audit_log` row + `notifications` rows + enqueue jobs (pg-boss supports enqueuing with the caller's DB executor `[VERIFY]`; otherwise a hand-rolled `outbox_events` table drained by a `FOR UPDATE SKIP LOCKED` poller). Workers perform Discord/Vercel/Storage calls with retries and backoff.
**When:** approve/reject, role changes, media finalize (cleanup), role sync.
**Trade-offs:** + survives restarts, + approval never fails because Discord is down, + no Redis (zero cost). − at-least-once delivery → handlers must be idempotent (`announced_at`, deterministic job keys).

```typescript
await db.transaction(async (tx) => {
  await posts.publishRevision(tx, revisionId, reviewer);          // pointer swap
  await audit.record(tx, { actor: reviewer.id, action: 'post.approve', target: ['post', postId] });
  await notifications.create(tx, { recipient: authorId, type: 'POST_APPROVED', postId });
  await jobs.send(tx, 'public-cache.revalidate', { postId }, { singletonKey: `reval:${postId}` });
  await jobs.send(tx, 'discord.announce-post', { postId }, { startAfter: 3, singletonKey: `ann:${postId}` });
});
```

### Pattern 4: Leaf modules + one-way dependencies

**What:** `audit`, `notifications`, `jobs` are leaf modules every feature may call (passing `tx`). Feature modules may not depend on each other cyclically; `moderation → posts`, `comments → posts (read)`, nothing → moderation. Cross-feature reads go through exported query services, not repositories.
**Trade-offs:** + no circular DI (`forwardRef` is a smell), + trivial to test. − Notifications gets "what to notify" calls from several places; acceptable at this scale (an in-process event bus adds indirection without benefit here).

### Pattern 5: Direct-to-storage upload with server-side finalize (media pipeline)

```
1. Browser → Next BFF  POST /api/media/intents {filename, mime, bytes}
   → NestJS (authz: can_post; rate limit; size/mime allowlist; quota per user)
   → creates media row (status=pending), mints Supabase signed upload URL for
     uploads-incoming/{userId}/{mediaId}   (createSignedUploadUrl; token-in-URL, short TTL)
   ← { mediaId, uploadUrl, token }
2. Browser PUTs bytes directly to Supabase Storage (bypasses Vercel body limit & VPS bandwidth).
   Bucket `uploads-incoming` is PRIVATE with file_size_limit + allowed_mime_types set as a first filter.
3. Browser → BFF → NestJS  POST /media/:id/finalize
   → enqueue/execute (concurrency-limited, e.g. p-queue=2):
        download from incoming → sniff magic bytes (not the client mime) → sharp:
        limitInputPixels, rotate() from EXIF orientation, then strip all metadata
        (sharp drops EXIF by default unless withMetadata() — do NOT call it),
        resize to variants sm/md/lg (+ 1200x630 `og`), encode WebP (AVIF optional later)
      → upload variants to PUBLIC `media/{mediaId}/{variant}.webp` → delete incoming object
      → media.status=ready, store width/height/(blurhash)
4. Orphan GC job (daily): media rows `pending/failed` older than 24h + incoming objects → delete.
```

- **Why direct + quarantine over proxy-through-Next:** Vercel functions cap request bodies (~4.5 MB) [MED]; phone photos exceed that. Proxying through NestJS from the browser would reintroduce the browser→API cookie/CORS problem. Quarantine bucket means unvalidated bytes are never publicly served.
- **Why we generate variants ourselves:** Supabase Storage image transformations are a paid-plan feature [MED] and Vercel Hobby's image-optimization quota is limited; serving pre-generated WebP variants from the Supabase CDN via a custom `next/image` loader (or `unoptimized`) sidesteps both and keeps OG images at stable URLs.
- **Public bucket with unguessable paths** for `media`: crawlers (Discord, WhatsApp) must fetch `og:image` without auth, so signed/expiring URLs would break link previews. Pending-post images are therefore "unlisted," not private — a conscious trade-off; document it. (Stricter alternative: private `media-pending` bucket and copy-on-approve; adds coupling and a failure mode for little gain at this audience size.)
- **Memory:** sharp decoding a 24 MP photo needs ~100 MB; on a 1 GB Always-Free AMD micro VM that matters. Hard-cap input pixels/bytes and queue concurrency. `[VERIFY]` which shape (ARM Ampere A1 vs AMD micro) was actually provisioned.
- Supabase free tier file limit is 50 MB, storage 1 GB [MED, multiple secondary sources]: WebP-only variants and a per-user quota are not optional if the archive is meant to last 10+ years. Plan an eviction/archival story (see Scaling).

### Pattern 6: Fixed-window throttling per route class

`@nestjs/throttler` with named policies: `auth` (bootstrap), `post-create`, `comment`, `reaction`, `upload-intent`, `default`. Key: `user.id` when authenticated else `X-Client-IP` (BFF-key-verified) else socket IP. In-memory storage is fine for one instance; if ever scaled to >1 replica, switch to a shared store (Postgres/Redis). Stricter limits on write paths; reads rely on ISR.

---

## Data Flow

### Request flow (public read)

```
Visitor ─► Vercel edge cache (HIT: HTML, no function) ─► Browser
              │ MISS / stale
              ▼
         Next RSC: fetch(API/public/feed?..., {next:{tags:['feed']}})  (no cookies, no auth)
              ▼
         NestJS public controller ─► PostsQueryService ─► Postgres (published revisions only)
              ▼
         HTML + <meta og:*> cached until tag revalidated
Client island: GET /api/me, GET /api/posts/:id/reactions, comments  (SWR; per-user, uncached)
```

### Publish flow (the core loop)

```
Member (can_post) ── Compose ──► Server Action ─► NestJS POST /posts (draft) / PATCH
   media: intent → PUT Storage → finalize (sharp)           
   Submit ─► POST /posts/:id/submit  → revision.state=submitted, post.status=pending
                                     → notify moderators (queue badge), audit
Moderator ─► GET /moderation/queue ─► approve | reject(reason) | request_changes
   tx: swap published_revision_id, set published_at, audit, notify author, enqueue jobs
Jobs: revalidate(web) → announce(Discord webhook) 
Visitors: new page is live; Discord embed shows OG card.
```

### Key Data Flows

1. **Login/bootstrap:** see Authentication Architecture — token captured once, membership resolved, profile upserted, token discarded.
2. **Role badge display:** `discord_roles` + `member_discord_roles` joined in the profile payload; refreshed by cron/reconcile and at login. Profile pages are ISR-tagged `profile:{id}`; badge changes enqueue a revalidate for that profile.
3. **Engagement:** comment/reaction → NestJS tx (row + notification + audit-lite) → recipient finds it via polled unread count.
4. **Notifications delivery = polling, not Realtime/SSE (v1).** `GET /api/notifications/unread-count` (cheap, `ETag`/304) every ~30–60 s while tab visible + refetch on focus, via TanStack Query/SWR. Rationale: Supabase Realtime would require a browser Supabase client holding the JWT (contradicts httpOnly + "only NestJS"); SSE through Vercel functions is capped by function duration; audience is ≤50 people. Upgrade path if ever needed: SSE endpoint on NestJS proxied by a route handler with `export const runtime='nodejs'` is still limited — realistically, move to Supabase Realtime with a short-lived scoped token. Don't build it now.
5. **Moderation audit:** every mod/admin mutation calls `audit.record(tx, …)` *inside the same transaction* as the change — an interceptor-only approach loses before/after state and can log actions that rolled back.
6. **Sitemap/robots/OG:** `sitemap.ts` pulls `GET /public/sitemap` (ids, slugs, `published_at`) tagged `feed`; `generateMetadata` reuses the same tagged fetch as the page (Next dedupes); `og:image` = the post's pre-generated 1200x630 variant (absolute URL, <300 KB for WhatsApp); JSON-LD `Article`; canonical = `/p/{id}/{slug}`.

### State Management (web)

Server state lives in NestJS/Postgres. In Next: RSC for reads; Server Actions for authenticated mutations (revalidate the specific tag after); TanStack Query/SWR only for polled/personal client islands (notifications, reaction state, comment list). No global client store needed.

---

## Deployment Topology

- **VPS:** `docker compose`: Caddy (automatic TLS, reverse proxy, security headers) + API container (non-root, read-only FS where possible, `HEALTHCHECK`, `restart: unless-stopped`). Secrets via env file with 600 perms or Docker secrets; nothing in the image. Only 80/443 (and SSH from your IP) open in the OCI security list and the host firewall.
- **CI/CD:** GitHub Actions: install (pnpm cache) → lint → typecheck → unit → e2e (API + Postgres; prefer `supabase start` or a service container with a stub `auth` schema) → build image (buildx, linux/arm64 *and* amd64 if the shape is uncertain) → push GHCR → SSH deploy `docker compose pull && up -d` → smoke-test `/health/ready`. Vercel deploys web from git independently.
- **Portability (Plan B Render/Koyeb):** the API is stateless — config by env, no local disk state, jobs in Postgres, throttler in memory. Moving hosts = point `API_URL` at a new host. Note: free tiers that sleep break cron/job processing; keep Oracle as primary. Idle-reclaim risk on Always Free: keep the box genuinely used (health pings alone may not count) — monitor and keep image reproducible.
- **Region co-location:** the audience is Brazilian and every SSR/ISR miss fans out Vercel → API → DB. Prefer Supabase `sa-east-1`, Oracle São Paulo/Vinhedo, and a Vercel function region near `gru1` (setting `regions` in project config). Oracle's home region is fixed at signup and Always Free resources exist only there — decide before creating the tenancy. [MED]
- **Environments:** free Supabase allows 2 projects → `prod` + `dev/staging`; local dev via Supabase CLI. Free projects pause after 7 days inactivity [MED, multiple sources]: real traffic + the cron/jobs make this unlikely in prod but it **will** bite a rarely-used staging project; document a manual wake step.
- **Observability:** pino JSON logs with `request_id` propagated Next→API (`X-Request-Id`); Sentry (free) in both apps; Terminus `/health/live` (process) and `/health/ready` (DB + pg-boss); external uptime monitor on `/health/ready`; log redaction for `Authorization`, `providerToken`, cookies.
- **Secrets inventory:** Vercel: `NEXT_PUBLIC_SITE_URL`, `SUPABASE_URL`, publishable key, `API_URL`, `BFF_KEY`, `REVALIDATE_SECRET`. VPS: `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (secret key), `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`, `DISCORD_WEBHOOK_URL`, `BFF_KEY`, `REVALIDATE_SECRET`, `WEB_URL`, `SENTRY_DSN`. Service-role/secret key **never** on Vercel.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 15–50 active members, ~hundreds of posts/yr (target) | Current design is overkill-safe. Single API instance, in-memory throttler/cache, count(*) aggregates, no search index. |
| 1k–10k monthly readers | ISR absorbs reads. Add DB indexes on the feed/filter paths, keep keyset pagination, CDN-cache API public GETs with `Cache-Control: s-maxage`. Still one VPS. |
| Beyond | Not a goal. Shared throttler store, read replica, or paid Supabase would be the first steps. |

### Scaling Priorities

1. **First real bottleneck: Supabase free storage (1 GB) and egress, not CPU.** A 10-year photo/video-thumbnail archive fills 1 GB quickly. Mitigations in the design: WebP variants only, original discarded after finalize, per-user quota, `lg` variant capped (~1600 px), no GIF/video hosting (already out of scope). Contingency: move `media` to Cloudflare R2 free tier behind the same `MediaStorage` port (put Storage behind an interface now to make this a one-module change).
2. **Second: free-tier DB (500 MB) and project pause.** Text is cheap; `audit_log` and notifications grow — add retention (notifications > 90 days read, prune job).
3. **Third: sharp CPU/RAM on the VPS** during bulk uploads of old photos (the archive-import use-case!). Concurrency cap + per-user upload rate limit; consider a one-off admin import script run locally instead of through the API.

---

## Anti-Patterns

### Anti-Pattern 1: Browser Supabase client alongside the BFF

**What people do:** Add `createBrowserClient` "just for realtime/auth state" and query tables from the client.
**Why it's wrong:** Reintroduces non-httpOnly session cookies, bypasses NestJS rules, makes RLS the *only* defense, contradicts the key decision.
**Do this instead:** Server-only Supabase usage in Next (auth + signed-upload only; a storage-only client with `persistSession:false` is acceptable for `uploadToSignedUrl`).

### Anti-Pattern 2: Roles/ban status in JWT claims

**What people do:** Custom access-token hook injecting `app_role`.
**Why it's wrong:** Stale until token expiry; a demoted/banned user retains power for up to an hour.
**Do this instead:** Resolve role from `profiles` per request with a ≤60 s cache invalidated on change.

### Anti-Pattern 3: Persisting or forwarding the Discord token casually

**What people do:** Put `provider_token` in cookies, localStorage, a DB column, or logs.
**Why it's wrong:** Supabase drops it on refresh anyway [HIGH]; storing creates a long-lived third-party credential.
**Do this instead:** One-shot use in the callback, redact in logs, rely on the bot afterward.

### Anti-Pattern 4: Reading cookies in public pages / layouts

**What people do:** Call `cookies()`/`getUser()` in the root layout to render the avatar.
**Why it's wrong:** Whole tree becomes dynamic → no ISR, slow TTFB, OG crawlers hit the function every time.
**Do this instead:** `(public)` group is cookie-free; personalization via client island.

### Anti-Pattern 5: Synchronous external calls in request handlers

**What people do:** `await discordWebhook()` / `await revalidate()` inside the approve endpoint.
**Why it's wrong:** Approval fails or hangs when Discord/Vercel is slow; partial state.
**Do this instead:** Enqueue in the same transaction, process with retries.

### Anti-Pattern 6: Proxying uploads through Vercel (or trusting client MIME)

**What people do:** Multipart POST through a Server Action; trust `Content-Type`.
**Why it's wrong:** 4.5 MB body limit, wasted Vercel bandwidth, polyglot/SVG/HTML upload attacks.
**Do this instead:** Signed upload to quarantine → magic-byte sniff → sharp re-encode (re-encoding is the real sanitizer) → allowlist raster formats only; **reject SVG**.

### Anti-Pattern 7: Offset pagination and `ORDER BY random()`-style shortcuts on the feed

**Do this instead:** Keyset on `(published_at, id)`; indexes for filter combinations validated with `EXPLAIN` on seeded data.

### Anti-Pattern 8: Status-flip editing of approved posts

**Why it's wrong:** Unpublishes live content/links (see revision pointers).
**Do this instead:** Revision model or restricted-editor rule decided explicitly.

### Anti-Pattern 9: Business rules in RLS policies or SQL functions

**Why it's wrong:** Two sources of truth, untestable via the normal Nest test suite, painful to change.
**Do this instead:** RLS = coarse safety net; rules live in NestJS policies/services.

### Anti-Pattern 10: Redis/BullMQ "because that's what Nest docs show"

**Why it's wrong:** Another stateful service to run on a free VM; jobs live outside the DB transaction.
**Do this instead:** pg-boss (or hand-rolled outbox) on the existing Postgres.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase Auth (Discord IdP) | `@supabase/ssr` server-side PKCE in Next route handlers | Request scopes `identify guilds.members.read` (Supabase adds `identify`/`email` defaults; confirm). Dev vs prod Supabase projects each need their own Discord redirect URI. |
| Supabase JWKS | `jose.createRemoteJWKSet` in `SupabaseJwtGuard` | Requires asymmetric signing keys; cache + cooldown; test the rotation path. |
| Supabase Postgres | Drizzle + `pg` via Supavisor **session** pooler; dedicated `app_backend` role | Pool size small (free tier connection caps); pg-boss needs session semantics. |
| Supabase Storage | service-role client in NestJS only; signed upload URLs to browser | Two buckets; `file_size_limit` + `allowed_mime_types` on incoming. |
| Discord OAuth API | One-shot `GET /users/@me/guilds/{id}/member` with user token | Handle 404 (not a member), 401 (bad token), 429. |
| Discord Bot (REST) | `GET /guilds/{id}/roles`, `GET /guilds/{id}/members/{uid}` | Bot needs to be in the guild; no privileged intent expected for these REST calls `[VERIFY]`; no Gateway. |
| Discord Webhook | Job handler POST embed | Idempotent (`announced_at`); respect 429; never block approval. |
| Vercel (revalidate) | NestJS → `POST /api/revalidate` HMAC | Timestamp window to prevent replay; also time-based `revalidate` fallback. |
| Sentry / uptime monitor | SDK + external ping | Redact tokens. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| web ↔ api | HTTPS JSON, Bearer, shapes from `packages/contracts` | Only web server code calls api. Version the contract if the API ever has a second client. |
| posts ↔ moderation | Moderation calls `PostsService.publishRevision(tx, …)` | One-way; posts knows nothing about moderation UI. |
| feature modules ↔ audit/notifications/jobs | Direct call with `tx` | Leaf modules; never import feature modules. |
| discord ↔ everything | Other modules call `DiscordRolesService`/queue jobs; never raw HTTP | Single place to swap/mocks in tests. |
| media ↔ storage | `MediaStorage` interface (Supabase impl) | Keeps R2 escape hatch open. |
| api ↔ db | Repositories only; services never build SQL | Transaction helper passes `tx` explicitly. |

---

## Suggested Build Order (dependencies drive phases)

```
[0 Foundations] ─► [1 Identity & Discord] ─► [2 Posts + Media + Tags] ─► [3 Moderation + Audit + Publish pipeline]
                                                                                │
                              ┌─────────────────────────────────────────────────┤
                              ▼                                                 ▼
                   [4 Public reading + SEO/OG]                    [5 Engagement: comments, reactions, notifications]
                              │                                                 │
                              └──────────────┬──────────────────────────────────┘
                                             ▼
                          [6 Discord webhook + badges polish] ► [7 Timeline/eras + Achievements] ► [8 Hardening]
```

0. **Foundations (walking skeleton, deployed):** monorepo, `contracts`, CI, Nest platform (config/logging/health/helmet/throttler/error filter/pipes), DB migration pipeline + RLS baseline + CI RLS check, Docker + Caddy on the VPS, Vercel project, a hello-world BFF call end to end. **Start Oracle provisioning on day 1** — ARM capacity is the known external blocker; Plan B host decision is made here.
1. **Identity & Discord:** login/callback/bootstrap, JWT guard, profiles, guild gating, app roles + admin role management, `discord_roles` sync + badges data. Everything else depends on `user + role + can_post`.
2. **Posts + media + tags:** draft/revision model, editor body schema + sanitization/embeds, media intent/finalize/sharp pipeline, curated tags. Needs 1 for authz.
3. **Moderation + audit + jobs:** review queue, approve/reject, `audit_log`, pg-boss, notifications (approval/rejection types), revalidate job. Audit and jobs land **with** moderation, not after — retrofitting transactional audit is painful.
4. **Public reading + SEO/OG:** feed with combinable filters (tags/author/year), post page, profile page, sitemap/robots/OG, ISR + tag revalidation wiring. Needs approved posts (3). Can overlap with 5.
5. **Engagement:** comments, reactions, polled notifications, throttling tuned per route. Needs 1 (authz) and 4 (post pages to host them).
6. **Discord announce webhook + role-badge display polish:** small once jobs exist; sequence "revalidate → announce".
7. **Timeline/eras + achievements:** independent admin-CRUD features, low coupling — safe to defer or parallelize.
8. **Hardening:** RLS Tier 2 (optional), e2e suites for auth/moderation flow, load check of feed queries, backup/restore drill (Supabase free has no PITR — schedule `pg_dump` to off-site storage from the VPS), alerting, security review, dependency audit.

**Research/spike flags for the roadmap:**
- Phase 1 — **needs a spike:** server-only `@supabase/ssr` with httpOnly cookies + `provider_token` capture; asymmetric JWT keys enabled; Discord member-check with real guild; bot REST calls without privileged intent.
- Phase 2 — **needs a spike:** sharp memory/CPU on the actual VPS shape; signed-upload flow and bucket limits; editor body schema choice.
- Phase 3/4 — **verify docs at plan time:** Next 16 caching/revalidation API (`revalidateTag` arguments, Cacheable Components), pg-boss enqueue-in-transaction.
- Phase 0 — **decide early:** regions (Oracle home region is irreversible), domain strategy for the API TLS hostname.
- Phases 5, 6, 7 — standard patterns; unlikely to need dedicated research.

**Open decisions to settle in discuss-phase (affect schema):**
1. Does "ano" filter mean event date (recommended) or publication date?
2. Edit-after-approval policy (revision pointers vs mod-only edits).
3. Tag semantics (any-of vs all-of) and whether members can propose tags.
4. Are pending-post images allowed to be "unlisted public"? (recommended yes)
5. Should non-guild Discord users be able to comment at all (PROJECT.md says yes) — and should their profile be public?

---

## Confidence Notes

| Area | Confidence | Basis |
|------|------------|-------|
| Provider-token behavior, Discord endpoints/lifetimes, JWKS verification | HIGH | Official Supabase and Discord docs fetched this session |
| BFF + Bearer forwarding, ISR tag revalidation, cookie-domain analysis | MEDIUM-HIGH | Well-established platform behavior; reasoning from first principles |
| httpOnly cookies with `@supabase/ssr` server-only | MEDIUM/LOW | Not documented as supported; needs spike |
| Next 16 API details (`proxy.ts` rename confirmed in secondary sources; `revalidateTag` signature) | MEDIUM | Secondary sources; verify in installed version |
| Supabase free-tier limits, IPv6 direct connection, image-transform plan gating | MEDIUM | Multiple secondary sources / prior knowledge; re-check at provisioning |
| pg-boss in-transaction enqueue, Drizzle RLS support | MEDIUM | Prior knowledge; verify at plan time |

## Sources

- Supabase, Social Login (provider tokens not stored / not refreshed): https://supabase.com/docs/guides/auth/social-login (HIGH)
- Supabase, PKCE flow and SSR: https://supabase.com/docs/guides/auth/sessions/pkce-flow , https://www.supabase.com/docs/guides/auth/server-side-rendering (MEDIUM; provider_token persistence through `@supabase/ssr` cookies not stated)
- Supabase, JWT signing keys / JWKS / `getClaims`: https://supabase.com/blog/jwt-signing-keys.md , https://supabase.com/docs/guides/auth/jwts , https://www.supabase.com/docs/guides/auth/signing-keys (HIGH)
- Discord, OAuth2 (token lifetime 604800 s, refresh token, `guilds.members.read` → `/users/@me/guilds/{guild.id}/member`): https://docs.discord.com/developers/topics/oauth2 (HIGH)
- Discord, Guild resource (List Guild Members requires `GUILD_MEMBERS` intent; role `color` deprecated in favor of `colors`): https://docs.discord.com/developers/resources/guild (HIGH)
- Supabase pricing/limits (free tier: 1 GB storage, 50 MB file, 500 MB DB, pause after 1 week): https://supabase.com/pricing , https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/ (MEDIUM)
- Next.js 16 (`middleware` → `proxy`, Cache Components, revalidation changes), secondary sources only: https://appwrite.io/blog/post/everything-new-in-nextjs16 , https://dev.to/x4nent/nextjs-16-deep-dive-cache-components-with-use-cache-turbopack-as-the-default-bundler-6h0 (MEDIUM; confirm against nextjs.org docs before planning)

**Research-integrity note:** One fetched page (Supabase social-login docs) contained embedded text asking the reader to file a feedback report; it was treated as untrusted data and ignored.

---
*Architecture research for: community/clan blog (Next.js + NestJS + Supabase + Discord)*
*Researched: 2026-11-14*
