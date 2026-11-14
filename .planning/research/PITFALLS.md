# Pitfalls Research

**Domain:** Public community/clan blog. Next.js (Vercel) + NestJS (Docker, Oracle Always Free VPS) + Supabase (Postgres, Auth via Discord OAuth, Storage), zero monthly budget, solo learning project.
**Researched:** 2026-11-14
**Confidence:** MEDIUM overall. Supabase, Discord, Oracle and Next.js behavior was checked against official docs fetched on 2026-11-14 (tagged **[V]**). Items tagged **[E]** come from established practice and were not re-verified against a source this session. Items tagged **[U]** have conflicting or unconfirmed sources and need a spike before anyone relies on them.

## Phase Vocabulary Used In This Document

The roadmap does not exist yet. These working names are used for the "Phase to address" fields. Map them onto the real roadmap later.

| Tag | Meaning |
|-----|---------|
| **P-Infra** | Repo, CI skeleton, Docker image, Oracle VPS, reverse proxy/TLS, DB schema baseline, RLS baseline, env/secrets handling |
| **P-Auth** | Discord OAuth, session handling, NestJS JWT guard, guild-membership gate, roles |
| **P-Posts** | Post authoring, markdown/sanitization, image upload pipeline, video embeds, tags |
| **P-Mod** | Approval queue, moderator/admin panel, audit log, bans |
| **P-Read** | Public feed, filters, profiles, SEO/OG, Next.js caching and revalidation |
| **P-Engage** | Comments, reactions, notifications, Discord webhook, role-badge bot sync, achievements, timeline/eras |
| **P-Harden** | Observability, backup/restore drills, load/abuse testing, final security pass (verification only, not first-time implementation) |

**Ordering rule that matters:** rate limiting, Helmet, CORS, validation pipes, trust-proxy and the JWT guard are implemented in **P-Infra/P-Auth**, not left for a final hardening phase. A "security at the end" phase is the most common way solo projects ship without it.

---

## Critical Pitfalls

### Pitfall 1: Validating the Supabase JWT with the legacy HS256 secret (or trusting the wrong claims)

**What goes wrong:**
The NestJS guard uses `jsonwebtoken`/`passport-jwt` with `SUPABASE_JWT_SECRET`. It works today, then breaks the day signing keys are migrated/rotated, or it keeps accepting tokens signed by a secret that was supposed to be revoked. Separately, the guard decodes the token but authorizes using claims the user controls (`user_metadata`) or confuses the Postgres role claim (`role: "authenticated"`) with the blog's own roles (member/moderator/admin).

**Why it happens:**
Most tutorials and older answers predate asymmetric signing keys. The legacy secret also signs the `anon`/`service_role` keys, so it feels like "the" Supabase secret. [V] Supabase now recommends asymmetric keys (ES256 recommended; HS256 "not recommended for production") with public keys at `https://<ref>.supabase.co/auth/v1/.well-known/jwks.json`, and explicitly warns that verifying every JWT against the legacy secret with `jose`/`jsonwebtoken` will break on rotation. Supabase plans to deprecate legacy `anon`/`service_role` keys by end of 2026. [V]

**How to avoid:**
- Verify with `jose` `createRemoteJWKSet` (or `supabase.auth.getClaims()`), with an explicit algorithm allowlist (`ES256`/`RS256`), `issuer` = `https://<ref>.supabase.co/auth/v1`, `audience` = `authenticated`, and `exp`/`nbf` enforced. Never accept `alg: none` or HS256 from an untrusted header.
- Create the project's signing key as asymmetric from day one (greenfield: no migration needed). Do not store `SUPABASE_JWT_SECRET` in the API at all.
- Cache the JWKS in-process (one `createRemoteJWKSet` instance at module scope, not one per request). [V] Supabase edge caches JWKS ~10 minutes plus client-side caching, so after a rotation allow ~20 minutes and wait at least token TTL + 15 minutes before revoking the previous key.
- Treat the JWT as proof of identity only (`sub` = Supabase user id). Load the blog role/ban state from your own DB (short in-memory cache, e.g. 30-60 s, invalidated on role change). Never use `user_metadata` for authorization (the user can edit it); `app_metadata` is server-only but still prefer your own table.
- Build the guard as a single `AuthGuard` + `@CurrentUser()` decorator + `@Roles()` guard, deny-by-default (global guard with `@Public()` opt-out), so a forgotten decorator fails closed.

**Warning signs:**
`SUPABASE_JWT_SECRET` appears in `.env.example`; guard unit tests sign tokens with `HS256` and a literal string; any `@UseGuards` missing on a new controller does not fail a test; code reads `user.user_metadata.role`.

**Phase to address:** P-Auth. Add a CI test that a token signed by a random key, an expired token, a wrong-`aud` token and an unsigned token are all rejected.

---

### Pitfall 2: Relying on `provider_token` after login (Discord token lifecycle)

**What goes wrong:**
The app reads `session.provider_token` later (on a request, in a cron, in a profile refresh) to call `GET /users/@me/guilds/{guild.id}/member`. It is `null`/missing after the first session refresh or in another browser, so guild checks and role sync silently stop working, or worse, fail open ("couldn't verify, let them in").

**Why it happens:**
[V] Supabase does not store provider tokens in the project DB ("intentionally not stored") and does not refresh them: "Supabase Auth does not manage refreshing the provider token for the user." The app must capture them at the callback and refresh them itself. [V] Discord access tokens expire (docs example: 604800 s = 7 days), and Discord's docs do not state refresh-token lifetime or single-use semantics (treat as rotating: always persist the newest one). **[U]** Whether a refresh token is returned for the Supabase-initiated flow in all cases should be confirmed with a spike.

**How to avoid:**
- **Design decision: do the guild/role check once, at login, then stop depending on the user's token.** In the auth callback (server side, right after `exchangeCodeForSession`) read `provider_token`, call the member endpoint, and persist the result (`is_guild_member`, `discord_role_ids[]`, `checked_at`) in your own table. Discard the token (or, if refresh is wanted, store it encrypted server-side only).
- For later resyncs use the **read-only bot**, not user tokens. [V] `Get Guild Member` (single member, REST) lists no privileged intent; only `List Guild Members` requires `GUILD_MEMBERS`. With ~15-50 users, resync by fetching each registered user's member object one at a time, with backoff. This avoids the privileged intent and the Gateway entirely.
- Request scopes explicitly: `options.scopes: 'guilds.members.read'` (plus the defaults `identify`/`email` Supabase already requests **[E]**). `guilds.members.read` is what lets `/users/@me/guilds/{guild.id}/member` work. [V]
- Fail closed: if the check errors (Discord 5xx/429), do not grant posting rights and do not revoke existing ones; keep the last known state and retry.
- Handle Discord accounts with no (verified) email: **[E]** Supabase sign-in can error for providers that return no email. Test with an email-less Discord account and show a human error page.

**Warning signs:**
Code that calls `getSession()` to fetch `provider_token` outside the callback; "works for me" only because the developer's browser still has a fresh session; no test with an expired Discord token.

**Phase to address:** P-Auth (gate design) and P-Engage (bot role sync). Spike the real Discord flow in P-Auth before building anything on it.

---

### Pitfall 3: Stale membership and "member left the guild" edge cases

**What goes wrong:**
Membership is checked once at first login and cached forever. Someone leaves/gets kicked/banned from the Discord server and keeps posting for years. The opposite also bites: the app hard-deletes a user when they leave the guild, and cascading foreign keys wipe their posts, comments and the 10-year archive the project exists to preserve.

**Why it happens:**
Two different concepts get collapsed into one boolean: "may write now" vs "exists in the clan's history". Guild membership is also an external system you do not control.

**How to avoid:**
- Separate state: `users.guild_status` (`member` | `former` | `unknown`) controls write permission; the account row, authored posts and comments are **never** cascade-deleted from guild changes. Use `ON DELETE RESTRICT`/`SET NULL` on author FKs and soft-delete (`deleted_at`) for anything user-initiated.
- Re-check membership at login every time (cheap) and via bot resync on a schedule (e.g. daily + on-demand when a moderator opens the admin panel). A `former` member can still be displayed on old posts; they lose create-post rights, comments stay allowed (rules say any Discord-logged user may comment) unless banned.
- Document the policy for departed members' posts (keep, with a "former member" badge) and for deletion requests (see LGPD in Security Mistakes).
- Dedicated ban flag in the blog (`banned_at`, reason), independent from guild status, enforced in the guard.

**Warning signs:**
`ON DELETE CASCADE` on `posts.author_id`; no column recording when membership was last verified; no way for an admin to ban a non-guild commenter.

**Phase to address:** P-Auth (schema + login re-check), P-Mod (ban UI), P-Engage (scheduled bot resync).

---

### Pitfall 4: Cookie/session architecture across Vercel and the VPS API

**What goes wrong:**
The browser calls `api.example.xyz` directly from `app.vercel.app` and the session cookie never arrives, or arrives in Chrome but not Safari/Firefox. Or, to "fix" it, `SameSite=None; Secure` + `credentials: 'include'` + wildcard-ish CORS is enabled, opening CSRF and token exposure. Or the requirement "cookies httpOnly" is silently violated.

**Why it happens:**
- [V from Supabase SSR design, E] The `@supabase/ssr` browser client stores the session in cookies that JavaScript must read, so they are **not** httpOnly by default. The project requirement "cookies httpOnly" is not satisfied by defaults.
- **[E]** `vercel.app` and free dynamic-DNS domains (e.g. `duckdns.org`) are on the Public Suffix List, so `x.vercel.app` and `y.duckdns.org` are *different sites*; cookies cannot be shared between them. Third-party-cookie restrictions (Safari ITP, Firefox, Chrome changes) apply.
- A custom domain costs money, and the budget is zero.

**How to avoid:**
- **Make the browser talk to a single origin: the Vercel app (a BFF).** Server Components, Route Handlers and Server Actions hold the Supabase session in first-party cookies (set `httpOnly`, `Secure`, `SameSite=Lax` yourself in the server-side cookie adapter and do not give the browser JS client the tokens), then call NestJS server-to-server with `Authorization: Bearer <access_token>`. NestJS needs no cookies and no credentialed CORS; its CORS can be locked to "none/only Vercel origin" for the rare direct call.
- Refresh the session in the Next.js request interceptor (`proxy.ts`/`middleware.ts` depending on version **[E]**); Server Components cannot set cookies. On the server use `getClaims()`/`getUser()`, **not** `getSession()`, which returns the unverified cookie contents. **[E]**
- CSRF for cookie-authenticated mutations: `SameSite=Lax`, Server Actions' built-in Origin check, and for custom Route Handlers verify `Origin`/`Host` on non-GET.
- Validate the OAuth `redirectTo`/`next` parameter against an allowlist of relative paths (classic open-redirect in the auth callback). Configure Supabase "Redirect URLs" with exact URLs; avoid a `*.vercel.app` wildcard (anyone's app matches).
- If the API must stay reachable from the browser directly (uploads, see Pitfall 7), use short-lived, single-purpose tokens minted by the BFF, not the user's long-lived session.

**Warning signs:**
`credentials: 'include'` in browser fetches to the API; CORS `origin: true` or regex `.*\.vercel\.app`; auth works on localhost (same site) but not on deployed previews; login works in Chrome but not iOS Safari.

**Phase to address:** P-Infra (decide the topology and write it as an ADR), P-Auth (implement). Test on a deployed preview in Safari before building more features on top.

---

### Pitfall 5: Believing RLS protects the app, and leaving the Data API open

**What goes wrong:**
(a) The team feels safe because "RLS is on", but NestJS connects as `postgres` or with the secret/`service_role` key, which bypasses RLS entirely: RLS does nothing against bugs in NestJS. (b) Meanwhile the publishable (anon) key is public by design (the browser needs it for auth), so the PostgREST Data API is reachable by everyone; any `public` table without RLS or with an overly broad policy is world-readable/writable. (c) The secret key leaks into the Next.js client bundle via a `NEXT_PUBLIC_` variable.

**Why it happens:**
[V] The secret key (`sb_secret_…`) maps to `service_role`, which has `BYPASSRLS`; publishable keys are safe to expose and run as `anon`/`authenticated` subject to RLS. Legacy `anon`/`service_role` keys are long-lived JWTs that keep working until disabled. Views bypass RLS unless `security_invoker`; functions marked `SECURITY DEFINER` bypass it too. **[E]**

**How to avoid:**
- Since "frontend only talks to NestJS", **do not expose the Data API at all**: disable it for the schemas holding app tables (put app tables in a non-exposed schema, or `REVOKE ALL ON ... FROM anon, authenticated`), and *also* `ENABLE ROW LEVEL SECURITY` on every table with a deny-by-default posture. This is the real defense-in-depth layer. Add a CI check that fails if any table in an exposed schema lacks RLS (query `pg_tables.rowsecurity`).
- RLS policies still matter for the one place where clients touch Supabase directly: Storage (`storage.objects`) and Auth. Write explicit policies for buckets.
- Secret/service key only in the NestJS container env (never in Vercel env, never `NEXT_PUBLIC_`, never in the Docker image or git; `.dockerignore` excludes `.env*`). Never log it (log a hash). Prefer the new publishable/secret key pair over legacy JWT keys. [V]
- Run a secret scanner in CI (gitleaks) and enable GitHub secret scanning/push protection (free for public repos).

**Warning signs:**
`NEXT_PUBLIC_SUPABASE_SERVICE…` anywhere; `supabase.from('posts')` in browser code; Supabase dashboard security advisor reports "RLS disabled"; a `curl` with only the publishable key can read a table.

**Phase to address:** P-Infra (baseline: deny-all RLS + revoke + CI check), re-verified in P-Harden with a "curl as anon" test script.

---

### Pitfall 6: Database connectivity from the VPS (IPv6-only direct connection, pooler modes)

**What goes wrong:**
NestJS in Docker on the Oracle VM cannot connect to `db.<ref>.supabase.co:5432` (timeouts/`ENETUNREACH`), or connects through the transaction pooler and Prisma/TypeORM prepared statements break with cryptic errors, or the app exhausts the small free-tier connection budget.

**Why it happens:**
[V] The direct connection is IPv6 on Free/Pro (IPv4 requires a paid add-on); the shared pooler in session mode (port 5432) is IPv4 and supports prepared statements; transaction mode (6543) is for serverless and does not support prepared statements. Oracle VMs are IPv4-first unless IPv6 is set up on the VCN. Docker's default bridge network typically has no IPv6 either.

**How to avoid:**
- From the persistent NestJS container, use the **shared pooler in session mode** (IPv4, prepared statements OK). Keep the pool small (e.g. `max: 5-10`). Use transaction mode only if some function becomes serverless.
- Use the direct connection only for migrations from a machine that has IPv6 (or run migrations through the session pooler).
- Add a startup connectivity check (readiness probe) so a misconfigured `DATABASE_URL` fails the deploy rather than the first user.

**Warning signs:**
Works from the laptop, fails from the VM; `prepared statement "s0" already exists` errors; connection-count alerts in the dashboard.

**Phase to address:** P-Infra. Verify from the VPS before writing any DB code that assumes it works.

---

### Pitfall 7: Image upload pipeline treated as "just multer + save"

**What goes wrong:**
Trusting the client `Content-Type`/extension; accepting SVG (stored XSS when served from your origin) or polyglot files; decompression bombs (a small file that expands to hundreds of megapixels and OOMs the container); buffering many large uploads in memory on a 1-12 GB VM; GPS coordinates left in EXIF (members' homes); losing orientation because EXIF was stripped without applying rotation; uploads routed through Vercel hitting its function body limit; one user filling the 1 GB storage quota.

**Why it happens:**
Uploads feel like a solved problem. Free-tier ceilings (storage, request body size, RAM) are invisible until they are hit. [V] Supabase Free allows at most a 50 MB global file size limit; storage quota is 1 GB. **[E]** Vercel serverless functions have a ~4.5 MB request body limit, so large uploads cannot be proxied through Next.js functions.

**How to avoid:**
- Pipeline: size cap at the edge (Content-Length + stream limit, e.g. 8-10 MB) -> detect real type by magic bytes (`file-type`), allowlist JPEG/PNG/WebP/GIF only, **reject SVG** -> decode with `sharp` with `limitInputPixels` set (e.g. 40 MP) and a concurrency limit of 1-2 -> `.rotate()` (apply EXIF orientation) *then* re-encode to WebP (sharp drops metadata by default; do not call `withMetadata()`) -> generate a thumbnail + a display size -> store under a server-generated random path (never the client filename). Re-encoding also neutralizes polyglots.
- Use `multer` disk or streaming storage with a hard `limits.fileSize`, not memory storage.
- Per-user quotas (files/day, total bytes) enforced in the DB; global bucket usage monitor with an alert at ~70% of 1 GB.
- Choose the upload path deliberately (decision for P-Infra/P-Posts): either (A) browser -> NestJS directly with a short-lived BFF-minted ticket (needs CORS for that one route), or (B) browser -> signed upload URL to a private "incoming" bucket -> NestJS processes and moves the result to the final bucket. Do **not** proxy through Vercel functions.
- Set bucket-level `allowed_mime_types` and `file_size_limit` as a second layer.
- Animated GIF/APNG can be huge: either convert to a static first frame or cap frames/size.

**Warning signs:**
`file.mimetype` used for validation; container memory spikes on upload; images in the bucket with original filenames; a test upload of a phone photo still shows GPS in `exiftool`.

**Phase to address:** P-Posts. Include an automated test with a decompression-bomb PNG, an SVG, a renamed `.php`, and a GPS-tagged JPEG.

---

### Pitfall 8: Stored XSS through markdown / rich text (posts, comments, profiles, OG tags)

**What goes wrong:**
User content rendered with `dangerouslySetInnerHTML`, markdown allowing raw HTML, `javascript:` / `data:` URLs in links, or sanitization only on write (so a later rules change or DB edit reintroduces it). Public pages make it worse: any visitor, including moderators with elevated rights, executes the payload.

**Why it happens:**
Sanitization libraries are easy to misuse (wrong config, wrong place), and DOMPurify needs a DOM (`isomorphic-dompurify`/jsdom is heavy and has caused build/Docker issues on server-side rendering **[E]**).

**How to avoid:**
- Store the **raw markdown**, render at read time through a pipeline that never emits raw HTML: `remark` -> `rehype-sanitize` with an explicit schema (no `script/style/iframe/form`, link protocols limited to `http/https/mailto`, `rel="noopener noreferrer nofollow ugc"` on user links, `target=_blank` only with rel). Prefer disabling raw HTML in markdown entirely.
- Sanitize on the server both when saving (reject/clean obviously bad input, enforce length limits) *and* when rendering (defense in depth). Comments: plain text or a very small markdown subset, no embedded images.
- A strict **Content-Security-Policy** on the Next.js app (nonce-based `script-src`, `frame-src` allowlist for video embeds, `img-src` limited to the Supabase storage host/self, `object-src 'none'`, `base-uri 'self'`). Roll it out in `Report-Only` first.
- Do not build a WYSIWYG editor in v1 (scope creep and a bigger XSS surface); markdown textarea + preview is enough.
- Any user text that flows into `<title>`, OG tags, JSON-LD or the Discord webhook must be escaped in that context too.

**Warning signs:**
Any `dangerouslySetInnerHTML` that is not wrapped by the single sanitizing renderer; a test post containing `<img src=x onerror=...>` and `[x](javascript:alert(1))` is not part of the test suite.

**Phase to address:** P-Posts (renderer + CSP-Report-Only), P-Harden (enforce CSP).

---

### Pitfall 9: Oracle Always Free is a moving, reclaimable target

**What goes wrong:**
The VM cannot be created ("Out of host capacity"); the instance is reclaimed for being idle; the A1 allowance is smaller than the tutorials say; the home region (permanent) turns out to be capacity-starved; or the API is down for days because there is exactly one VM with no backup and no tested Plan B.

**Why it happens:**
- [V] Oracle's documented Always Free A1 allowance is now **1,500 OCPU-hours + 9,000 GB-hours/month = 2 OCPU / 12 GB**. Many tutorials and some indexed pages still say 4 OCPU / 24 GB (3,000 / 18,000). Multiple outlets report the cut took effect mid-2026 with little notice; reports conflict on exact enforcement date and whether Pay-As-You-Go accounts are affected. **[U]** Do not size anything above 2 OCPU / 12 GB.
- [V] Idle reclamation: an Always Free instance is idle if over **7 days** the 95th-percentile CPU is below 20% **and** network below 20% **and** (A1 only) memory below 20%. A small NestJS blog will *always* sit below those thresholds, so reclamation risk is the default state, not an edge case. Instances may be reclaimed; the doc does not promise a warning. Idle-prevention scripts ("lookbusy") exist but are a community workaround; upgrading the tenancy to Pay-As-You-Go is the commonly cited protection **[U]** (requires a card and billing-risk care: set a budget alert, stay inside Always Free shapes).
- [V] "Out of host capacity": try another availability domain or retry later; Always Free compute must be in the **home region**, chosen at signup and not changeable.
- [V] Free-tier fallback shapes: up to two `VM.Standard.E2.1.Micro` (1/8 OCPU burst, 1 GB RAM, 50 Mbps), enough for NestJS but not for building the image on the box.

**How to avoid:**
- Treat the VPS as **disposable**: everything in git + Docker image in a registry (GHCR), config only via env, one documented `deploy.sh`/compose file, a restore runbook. Rebuilding the box from scratch must take <1 hour and be rehearsed once in P-Harden.
- Keep a documented **Plan B** that has actually been deployed once (same container on Render/Koyeb/Fly or similar). **[U]** The free terms of those platforms change often (spin-down on inactivity, free-tier removals); verify current terms when you need it and measure cold start before promising it.
- Decide the idle strategy explicitly: (a) PAYG upgrade with budget alerts, (b) a modest scheduled real workload (e.g. the nightly pg_dump + image reprocessing jobs genuinely use CPU), or (c) accept reclamation and rely on Plan B. Write the decision in the ADR.
- Uptime monitoring from outside (UptimeRobot/Better Stack free) so reclamation is noticed in minutes, not days.
- Account creation friction: card verification and region capacity can block signup; start this on day one, not the week you want to deploy.

**Warning signs:**
Instance in `STOPPED`/terminated state; tenancy console shows an A1 limit of 2 not 4; no registry copy of the image; all state lives on the VM disk.

**Phase to address:** P-Infra (early: provision on week 1 to discover capacity problems), P-Harden (rebuild drill).

---

### Pitfall 10: Firewall layers, Docker bypassing the firewall, and TLS on the VPS

**What goes wrong:**
Ports 80/443 are open in the OCI Security List/NSG but Ubuntu's default `iptables` rules on Oracle images still REJECT them (or vice versa), so TLS issuance fails and the API "works from the server but not from outside". Alternatively the NestJS container is published with `-p 3000:3000`, bypassing `ufw` (Docker writes its own iptables rules) and exposing the raw API, unauthenticated by the reverse proxy, to the internet.

**Why it happens:**
There are two independent firewalls (cloud network + host), and Docker's port publishing is applied before `ufw` rules. **[E]**

**How to avoid:**
- Open exactly 22 (restricted to your IP if possible, key-only SSH, no password auth), 80, 443 in the VCN security list *and* on the host. Persist iptables rules (`netfilter-persistent`).
- Publish container ports on loopback only (`127.0.0.1:3000:3000`) and put **Caddy** (automatic Let's Encrypt, trivial config) or nginx in front, in the same compose network. Verify with an external port scan that only 80/443/22 respond.
- Domain: you need a hostname for TLS. A free dynamic-DNS subdomain works with Let's Encrypt, but note the Public-Suffix cookie consequences (Pitfall 4), which is another reason to use the BFF topology. A real domain is the cleanest option if a ~US$1/month exception is ever acceptable; decide explicitly, since "zero budget" is a stated constraint.
- Set HSTS only after TLS is verified stable; monitor certificate expiry; Caddy needs its data volume persisted or it re-requests certs on every redeploy and hits Let's Encrypt rate limits.

**Warning signs:**
`curl http://<public-ip>:3000` from outside returns JSON; certificate errors after redeploy; `iptables -L` shows a REJECT rule before your ACCEPT rules.

**Phase to address:** P-Infra.

---

### Pitfall 11: Rate limiting that limits everyone (or no one) behind proxies

**What goes wrong:**
All requests appear to come from one IP (the Vercel server or the Caddy container), so one noisy user throttles the entire site; or `X-Forwarded-For` is trusted blindly and an attacker rotates a fake header to bypass limits; or in-memory throttler state resets on every deploy.

**Why it happens:**
`@nestjs/throttler` keys on `req.ip`. Express only resolves the real client IP when `trust proxy` is configured, and only for the correct number of hops. With the BFF topology the NestJS peer is Vercel's function, not the user. Vercel egress IPs are dynamic, so you cannot allowlist them. **[E]**

**How to avoid:**
- Set `app.set('trust proxy', <exact hop count>)` (Caddy -> Nest = 1); never `true`.
- With the BFF, the Next.js server forwards the end user's IP in a dedicated header (e.g. `X-Client-IP` taken from Vercel's `x-forwarded-for`) **plus** a shared secret header proving the request came from your BFF; NestJS only honors the forwarded IP when the secret matches. Without it, fall back to the peer IP.
- Limit by **user id** for authenticated writes (posts, comments, reactions, uploads) and by IP only for anonymous/login routes. Use per-route limits (login/callback stricter, comment creation, upload, post creation) and a looser global limit.
- Return 429 with `Retry-After`; the BFF must surface that to the UI.
- For one container, in-memory storage is acceptable; document that limits reset on restart. Do not add Redis for this.

**Warning signs:**
Throttler logs show a single IP for all traffic; `req.ip` equals the Docker gateway address; rate-limit tests pass only because the test client has one IP.

**Phase to address:** P-Infra (trust proxy + global limiter), P-Auth/P-Posts/P-Engage (per-route limits as each route ships).

---

### Pitfall 12: Moderation state machine gaps (editing approved posts, un-publishing, stale caches)

**What goes wrong:**
An author edits an approved post and the changes (including new images or links) go live without review; or the edit forces the post back to pending and it disappears from the public site; two moderators approve/reject simultaneously; a moderator approves their own post; a post is rejected/unpublished but remains visible through a cached page, a cached OG preview, or a guessable public image URL; the audit log omits who did what.

**Why it happens:**
"Pending -> Approved/Rejected" is modeled as a column, not as a state machine with revisions. Caches (Next.js, social scrapers, CDN) are forgotten.

**How to avoid:**
- Model states explicitly: `draft` -> `pending` -> `published` | `rejected`, plus `unpublished`/`archived`. For edits to published posts, use a **revision**: the live version stays published while the edit sits as `pending_revision`; approval swaps it atomically. (Simpler v1 alternative: allow only typo-level edits by moderators and disallow author edits after publication; decide explicitly.)
- Enforce transitions in one service (guard clauses + DB `CHECK`/enum), with optimistic concurrency (`updated_at`/`version` in the `UPDATE ... WHERE version = $1`) so double-approvals are rejected.
- Moderators cannot approve their own posts (or admins may, with an audit flag). Say which.
- Write the audit entry in the **same transaction** as the state change; make the table append-only (no UPDATE/DELETE grants), include actor, target, action, before/after summary, timestamp, IP. Never store tokens or full request bodies.
- On unpublish/reject/delete: trigger revalidation (Pitfall 15), remove or privatize media (Pitfall 13), and notify the author with the reason.
- Role administration safety: protect against demoting/removing the last admin; define how the first admin is bootstrapped (seed by Discord ID via env, not a public endpoint).

**Warning signs:**
`PATCH /posts/:id` does not check the post's status; no test for "edit after approval"; moderator panel has no pagination or concurrency handling; audit rows can be edited.

**Phase to address:** P-Mod (state machine + audit), P-Read (revalidation hooks).

---

### Pitfall 13: Unapproved or removed media is still publicly reachable

**What goes wrong:**
Images of a pending/rejected post sit in a public bucket, so anyone with the URL (or a leaked URL in a notification/log) can see unmoderated content; rejected NSFW/abusive images stay online forever; orphaned uploads from abandoned drafts consume the 1 GB quota.

**Why it happens:**
Public buckets are the easy way to get CDN-cached images and `next/image` working.

**How to avoid:**
- Upload into a **private** bucket (or private prefix). On approval, copy/move the processed derivatives to the public bucket under an unguessable path; on unpublish, remove them.
- Orphan cleanup job: delete uploads not attached to any post after N hours; reconcile DB rows against bucket contents weekly.
- Keep the DB as the source of truth for which media belong to which post; store dimensions, byte size and content hash (also gives dedupe).

**Warning signs:**
Bucket marked public with sequential/guessable names; no job that ever deletes storage objects; bucket size grows faster than post count.

**Phase to address:** P-Posts (private->public flow) and P-Mod (move on approval).

---

### Pitfall 14: Supabase Free limits and silent pausing

**What goes wrong:**
The project pauses after a quiet week (a clan blog is exactly the type to go quiet during holidays) and the site shows errors; egress (5 GB) is consumed by the image archive; the 500 MB DB limit or 1 GB storage fills; there are no real backups.

**Why it happens:**
- [V] Free plan: pauses when it does not receive sufficient user database activity over the past week (docs: a few DB requests per day is typically enough, no hard threshold given); warning email ~1 week before; paused projects restorable up to 1 year per current docs (older changelog said 90 days, **[U]** treat 90 days as the safe planning number); two free projects per org; paid plans never pause. Quotas: DB 500 MB/project, storage 1 GB, egress 5 GB, 50k MAU, 50 MB max file size. [V]
- **[E]** The Free plan does not offer scheduled/downloadable backups or PITR (only a final logical backup at pause time). The only copy of 10 years of clan history would live on one free project.
- Heavy static serving of originals from Storage counts against egress.

**How to avoid:**
- Keep-alive that is real: a scheduled job (NestJS `@Cron` or GitHub Actions) that performs an actual DB query through the API every day. Do not rely on cached ISR pages (they generate no DB activity). Also set up an alert on the pause-warning email address (use a mailbox you actually read).
- Always serve derived WebP thumbnails/display sizes (not originals) with long `Cache-Control`; let Next.js `next/image` or a free CDN layer cache them. **[U]** Check current Vercel Hobby image-optimization quotas before relying on `next/image` for everything; a pre-generated thumbnail avoids the dependency.
- Budget: ~25-50 members x maybe 500 posts x 3 images x ~300 KB = ~1 GB. Do the arithmetic early; define the cap per user and per post (e.g. max 10 images, 8 MB each pre-processing); plan the overflow path (a second free project for media, or Cloudflare R2 free tier **[U]** if its terms still fit).
- Backups: nightly `pg_dump` (via session pooler) from the VPS, compressed and encrypted, copied off-box (OCI Object Storage free allocation, or a private repo/release artifact if small). Test a restore once. Also export a manifest of storage objects.
- Do not use Supabase Realtime for notifications (connection limits, scope creep); poll.

**Warning signs:**
Dashboard "Usage" at >60% of any quota; no `*.sql.gz` older than a day anywhere; the last time anyone restored a backup is "never".

**Phase to address:** P-Infra (backups + keep-alive from the start), P-Posts (image budget), P-Harden (restore drill).

---

### Pitfall 15: Next.js caching and revalidation for public pages (and the Next 16 mental-model shift)

**What goes wrong:**
(a) Personalized data leaks into a cached shared render (e.g. a cached component fetching with the viewer's token). (b) Approved posts never appear or unpublished posts never disappear because NestJS has no way to tell Vercel to revalidate. (c) Training-data advice about `fetch` caching / `unstable_cache` / `revalidate` exports is wrong for the current framework model. (d) Pages fail hard when the VPS API is down because every request hits it.

**Why it happens:**
[V] The current Next.js docs (updated 2026-10) describe **Cache Components** (`cacheComponents: true`, `'use cache'`, `cacheLife`, `cacheTag`, Partial Prerendering) as the default for new `create-next-app` projects, with a separate "previous model" guide. Cached entries are scoped per deployment, held in a per-instance ephemeral in-memory store on serverless by default (durable sharing needs `use cache: remote`), and runtime APIs (`cookies()`, `headers()`, `searchParams`) must sit behind `<Suspense>` or be passed as arguments into cached functions. Bots/crawlers are detected by user agent and get a fully dynamic render, so build-time and request-time data sources must both be available.

**How to avoid:**
- Pick **one** caching model for the project and write it in the ADR (greenfield: use the current Cache Components model and the official docs, not older blog posts).
- Split public vs personalized: the public post/feed/profile data comes from unauthenticated NestJS endpoints inside `'use cache'` functions with `cacheLife` + `cacheTag('posts')`, `cacheTag('post:<id>')`; user-specific bits (my reactions, notification count) are separate, uncached, behind `<Suspense>`. Never put an `Authorization` header or user id into a function cached for everyone.
- On-demand revalidation: NestJS (after approval/unpublish/edit/ban) calls a Next.js Route Handler protected by a shared secret that runs `revalidateTag`. Make the call best-effort with retry; keep a short `cacheLife` (e.g. minutes) as a safety net so a missed webhook self-heals.
- Resilience: because cached content is served from Vercel, a down VPS degrades to "stale but up" for public reads. Verify by stopping the API container and loading a post.
- Avoid `generateStaticParams` over thousands of posts at build; rely on ISR for unknown slugs.

**Warning signs:**
Two different users see each other's data; approving a post requires waiting for time-based expiry; deploy-time build failures because the API is unreachable from Vercel's build environment.

**Phase to address:** P-Read. Spike a 1-page vertical slice (publish -> revalidate -> visible; unpublish -> gone) before building the rest of the public UI.

---

### Pitfall 16: Open Graph / social previews that look fine in the browser but not in Discord/WhatsApp

**What goes wrong:**
Preview shows no image or a stale one; dynamic OG image generation fails or is slow; unpublished post titles stay in scraper caches; relative image URLs; images too big for WhatsApp.

**Why it happens:**
Scrapers do not run JS, use their own caches, and have strict limits. **[E]** WhatsApp is picky about image size (aim well under ~300 KB) and requires absolute HTTPS URLs; Discord caches embeds aggressively. Per [V] docs, crawlers get a dynamic render, so metadata must be resolvable server-side at request time.

**How to avoid:**
- Set `metadataBase` to the production URL; emit `og:title/description/image` (1200x630), `og:url`, `twitter:card`, and `article:published_time`.
- Use the post's first uploaded image (pre-resized 1200x630 WebP derivative stored at upload time) as `og:image` instead of generating one per request with Satori; use generated OG images only as a fallback with a simple design and bundled font.
- Never expose metadata for non-published posts (404 with no OG tags).
- Test with real Discord and WhatsApp links on the deployed domain (not localhost) as part of P-Read acceptance.

**Warning signs:**
OG tests only done by viewing page source; `og:image` URL begins with `/`; image larger than 1 MB.

**Phase to address:** P-Read.

---

### Pitfall 17: Video embeds as an injection vector (and as link rot)

**What goes wrong:**
Members paste arbitrary URLs/iframes; the server stores the raw string and renders an `<iframe src>` from it (phishing frames, `javascript:`/`data:` URLs, tracking). Separately, a 10-year archive full of embedded videos silently rots as old YouTube videos are deleted or made private.

**Why it happens:**
"Embed" is implemented as "store the URL". Link rot is invisible until someone looks at a 2014 post.

**How to avoid:**
- Parse on the server: accept only a provider allowlist (YouTube, and any others you explicitly choose), extract the **provider + video id** (regex-validated, e.g. `^[\w-]{11}$` for YouTube), store those two fields, and construct the embed URL yourself from a template (`https://www.youtube-nocookie.com/embed/<id>`). Never store or render user-supplied iframe HTML.
- Render with `sandbox` (allow-scripts allow-same-origin only as needed), `referrerpolicy="strict-origin-when-cross-origin"`, `loading="lazy"`, and a CSP `frame-src` that lists only those hosts. Use a click-to-load facade to avoid loading third-party scripts on every feed item.
- Store a cached title + thumbnail (fetched once via oEmbed/server request, with SSRF protections: allowlisted host, timeout, size cap, no redirects to private IPs) so a dead video still leaves a recognizable placeholder in the archive.
- Same principle for images: do **not** allow hotlinked image URLs. Discord CDN attachment links are signed and expire, so pasted Discord image links will break; require uploads.

**Warning signs:**
A `videoUrl` column that is rendered verbatim; no test for a `javascript:` or non-allowlisted URL; archive posts showing "Video unavailable" with no context.

**Phase to address:** P-Posts.

---

### Pitfall 18: Discord webhook and bot misuse

**What goes wrong:**
A post title containing `@everyone` or `<@&role>` pings the whole server (member-controlled text going into an announcement); the webhook URL leaks (logs, client bundle, error reports) and anyone can post as the clan; webhook failures (429, 5xx) block post approval or are silently dropped; the bot requests the `GUILD_MEMBERS` privileged intent and a Gateway connection it does not need; the bot token leaks.

**Why it happens:**
Webhook payloads are built by string interpolation. Discord calls feel "fire and forget".

**How to avoid:**
- Always send `allowed_mentions: { parse: [] }` and escape markdown in user-provided text; use an embed with truncated fields (title <= 256, description <= 4096 characters) and a link to the post.
- Webhook URL and bot token only in NestJS env; redact in logs and in Sentry (`beforeSend`); rotate on suspected leak.
- Decouple: approval commits first, then an **outbox** row/job sends the webhook with retry + exponential backoff and honors `Retry-After` on 429. Webhook failure never rolls back or blocks moderation.
- [V] `GUILD_MEMBERS` is a privileged intent (toggle in the Developer Portal; connecting with an unapproved privileged intent closes with `4014`; verification only becomes required at 100+ guilds). You do not need it: use REST-only `Get Guild Member` (no Gateway). If you ever do need the Gateway, enable only that intent.
- Bot permissions: invite with the minimum (no `Administrator`, no message permissions); "read-only" means no write scopes in the invite URL.
- Respect REST rate limits via per-route buckets; use a queue with concurrency 1 for syncs.

**Warning signs:**
Webhook call inside the approval HTTP handler without try/catch; `intents:` in bot code; the webhook URL appears in `git grep`.

**Phase to address:** P-Engage.

---

### Pitfall 19: Discord IDs as JavaScript numbers (snowflake corruption)

**What goes wrong:**
Discord IDs (snowflakes) are 64-bit integers; stored/parsed as JS `number` or Postgres `integer`, they lose precision and two users collide or lookups silently fail.

**Why it happens:**
JSON parsers and ORMs happily coerce large numeric strings. **[E]**

**How to avoid:**
Treat every Discord ID as a **string** everywhere (`text` column, or `bigint` mapped to string/BigInt in the ORM); validate with a `^\d{17,20}$` DTO pattern. Key identity on `discord_id` (stable) and treat username/avatar as refreshable display attributes (refresh on each login; store the avatar hash, not a long-lived URL).

**Warning signs:**
`parseInt(role)`; `Number(discordId)`; test fixtures with small IDs like `123`.

**Phase to address:** P-Auth (schema), P-Engage (roles).

---

### Pitfall 20: Scope creep and "production-grade everything" in a solo learning project

**What goes wrong:**
The Active list has ~25 requirements across auth, content, moderation, engagement, infra and quality. Building each feature to full polish before moving on leaves nothing deployed for months; motivation dies in the middle (usually during notifications/achievements/timeline). Infra rabbit holes (Kubernetes, Redis, observability stacks, a WYSIWYG editor, realtime) consume the learning budget without helping the Core Value.

**Why it happens:**
The explicit goal "do it right, not fast" plus a big requirement list invites depth-first perfection.

**How to avoid:**
- Walking skeleton first: a deployed, thin vertical slice (Discord login -> create text post -> mod approves -> visible publicly on Vercel via the VPS API) before any breadth. Everything after is increments on a live system.
- Hold the line on the Core Value ("publish and re-find the clan's history"): order features by that. Achievements, eras timeline, reactions and role badges are explicitly later phases and can slip without harming v1.
- Pre-decide "good enough" for each production-quality item (e.g. unit tests for guards/state machine/sanitizer/upload pipeline and one E2E happy path, not 90% coverage).
- Defer: WYSIWYG, realtime, i18n, Redis, search engine (Postgres FTS is enough), email notifications, automatic achievements. Add to a visible "Not now" list.
- Time-box spikes (Discord flow, cache revalidation, upload path) to a day each and record the conclusion.

**Warning signs:**
More than ~2 weeks without a deploy; a phase with no user-visible outcome; the backlog grows faster than it shrinks.

**Phase to address:** Roadmap structure itself (every phase ends deployed), reinforced at each phase transition.

---

## Moderate Pitfalls

### Pitfall 21: "Chronological feed" and "filter by year" semantics
**What goes wrong:** Year filter uses `created_at`, so a 2014 memory posted in 2026 shows under 2026; feed order shifts when old posts are approved late; offset pagination skips/duplicates items when posts are approved mid-scroll; year boundaries differ between UTC and the clan's timezone.
**Prevention:** Add an author-set `occurred_at` (or "year/date of the memory", optional precision) distinct from `published_at`; filter/sort by it (decide which is the default feed sort). Use keyset pagination `(sort_key, id)`. Index `(occurred_at, id)`, tag join table and `author_id`. Normalize timezone (`America/Sao_Paulo` for year bucketing) in one place. **Phase:** P-Read, but the column must exist in the P-Posts schema.

### Pitfall 22: Open comments and reactions from any Discord account
**What goes wrong:** Any free Discord account can comment; spam, harassment, and reaction toggling floods notifications.
**Prevention:** Comment rate limits per user, minimum Discord account age / not-banned checks at login, a ban/mute flag, moderator delete (soft-delete with tombstone), a "report" action. Plain-text comments. Reactions: one row per `(user, post, type)` with a unique constraint; notify only on first creation, never on toggle-off/on loops; self-reactions do not notify. Notifications get a retention policy and cap. **Phase:** P-Mod (ban/mute) and P-Engage.

### Pitfall 23: ORM/migration sources of truth
**What goes wrong:** Two migration tools (ORM + Supabase CLI) fight; migrations touch Supabase-managed schemas (`auth`, `storage`); the `users` profile table drifts from `auth.users`; deleting an auth user orphans or cascades.
**Prevention:** One migration tool (versioned SQL, applied in CI/deploy), never modify `auth.*`; profile table keyed by `auth.users.id` with an explicit FK policy; create the profile in the auth callback (idempotent upsert) rather than relying on a trigger you cannot easily test. Local dev with the Supabase CLI stack or a separate dev project. **Phase:** P-Infra/P-Auth.

### Pitfall 24: Docker image build for ARM
**What goes wrong:** Image built on x86 CI runs on ARM VM and crashes (`exec format error`), `sharp`/native modules install the wrong binary, QEMU builds take 20+ minutes, building on the 1 GB micro shape OOMs, secrets are baked into layers, containers run as root, log files fill the disk.
**Prevention:** Build `linux/arm64` (or multi-arch) with `docker buildx` in CI (GitHub Actions has ARM runners for public repos **[U]**; otherwise QEMU), push to GHCR, and only `docker compose pull` on the VM. Multi-stage build, `node:*-slim` (glibc; avoid musl surprises with `sharp`), `npm ci --omit=dev` in the final stage, non-root user, `.dockerignore` for `.env`/`.git`/`node_modules`, `HEALTHCHECK`, `enableShutdownHooks()`, `restart: unless-stopped`, Docker `json-file` log rotation (`max-size`, `max-file`). Test the ARM image locally with `--platform linux/arm64` before the first deploy. **Phase:** P-Infra.

### Pitfall 25: CORS and Helmet misconfiguration
**What goes wrong:** `origin: true` or reflecting `Origin` with credentials; regex permitting any `*.vercel.app`; Helmet's defaults breaking Swagger/static assets leading developers to disable it; Next.js and Nest both setting security headers inconsistently.
**Prevention:** If the BFF topology holds, NestJS CORS allows only the production origin (and a single configured preview origin in staging); no credentials. Helmet on NestJS (API) and a hand-written header/CSP config in Next.js (`next.config`/proxy), each owning its responses. Keep Swagger disabled in production or behind admin auth. **Phase:** P-Infra.

### Pitfall 26: Observability that leaks or fails
**What goes wrong:** Logs contain `Authorization` headers, cookies, webhook URLs; the health endpoint hits Supabase and a transient DB blip makes Docker restart-loop the container; Sentry quota burned by bot noise; no one notices the VM died.
**Prevention:** `pino` with redaction paths (`req.headers.authorization`, `req.headers.cookie`, `*.token`); separate `/health/live` (process up) and `/health/ready` (DB reachable; used by monitoring, not by the restart policy); request id propagated Vercel -> API -> logs; external uptime monitor; Sentry with `beforeSend` scrubbing and sample rates; alert on 5xx rate and on Supabase usage. **Phase:** P-Infra (logger, health), P-Harden (alerts).

### Pitfall 27: Tests that cannot cover the auth path
**What goes wrong:** Real Discord OAuth cannot run in CI, so auth is untested, or a "test login" endpoint is added and accidentally shipped to production.
**Prevention:** In tests, stand up a local JWKS (generate a key pair, serve `/jwks.json`, sign test tokens) and point the guard at it via env; no auth bypass in the production code path. Contract-test the Discord client with recorded responses. Mock Supabase Storage with a thin interface. CI runs lint, typecheck, unit, an integration suite against a disposable Postgres container, and the Docker build. **Phase:** P-Auth (harness), P-Infra (CI).

### Pitfall 28: Vercel Hobby and free-tier terms
**What goes wrong:** Assuming Hobby is unlimited; builds or functions throttled; commercial-use restriction ignored if donations/ads are ever added.
**Prevention:** **[U]** Re-read current Vercel Hobby limits (function duration, bandwidth, image optimization, "non-commercial" clause) at P-Infra; keep the site strictly non-commercial per PROJECT.md (no monetization is already out of scope); keep dynamic work in NestJS. **Phase:** P-Infra.

---

## Minor Pitfalls

### Pitfall 29: Discord avatar/username display
Hotlinked avatar URLs change when the user updates their avatar; store `avatar_hash` and rebuild the CDN URL, and fall back to a default avatar. Handle new Discord usernames (no discriminator) and display names vs unique usernames.

### Pitfall 30: Tags/categories free-text drift
User-entered categories produce "SA-MP", "samp", "SAMP". Use an admin-managed tag list (with slugs) and let members pick, not invent. Redirect old slugs when tags are merged.

### Pitfall 31: Time and locale
Store UTC, render in `pt-BR`/`America/Sao_Paulo`; avoid hydration mismatches by formatting dates on the server with a fixed locale/timezone.

### Pitfall 32: SEO duplicates
Multiple URLs for the same post (with/without slug, filter query strings) dilute indexing. Canonical URL on post pages, `noindex` on filtered feed combinations, a sitemap of published posts.

### Pitfall 33: Dependency and secret hygiene
Dependabot/Renovate on, lockfile committed, `npm audit` in CI; separate `.env.example` documenting every variable; different Supabase/Discord apps for dev vs prod to avoid testing against the real guild.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Verify JWT with `SUPABASE_JWT_SECRET` (HS256) | 10-minute auth guard | Breaks on key rotation; key-compromise blast radius includes `service_role` | Never (use JWKS from the start) |
| Public Storage bucket for all uploads | `next/image` and CDN just work | Unapproved/rejected media reachable by URL | Only for already-approved derivatives; never for pending media |
| Skip the BFF; call API from the browser with CORS+cookies | Fewer moving parts initially | Cross-site cookie failures, CSRF exposure, httpOnly requirement violated | Never for session cookies; acceptable only for a single ticket-authorized upload route |
| `synchronize: true` / ad-hoc schema edits in the Supabase dashboard | Fast iteration | Unreproducible schema, can't rebuild env | Local throwaway DB only |
| In-memory throttler storage | No Redis | Limits reset per deploy/restart | Acceptable with one container (document it) |
| Sanitize only on write | One place to fix | Rule changes and DB edits reintroduce XSS | Never; sanitize at render too |
| `ON DELETE CASCADE` from user to posts | Easy cleanup | Deleting/leaving member erases archive | Never for posts; OK for ephemeral rows (notifications, sessions) |
| Single VM, no off-box backup | Simplest deploy | Reclamation or disk loss = total loss | Never; nightly dump off-box from the first deploy |
| Calling Discord webhook inline in the approval handler | Few lines of code | Approval fails when Discord is down/429s | Never; use an outbox |
| Skipping a CI check for RLS-enabled tables | Saves an hour | A forgotten table is world-readable | Never |
| Using `getSession()` server-side for auth decisions | Works immediately | Trusts an unverified cookie | Never; use `getClaims()`/`getUser()` |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase Auth (Discord) | Reading `provider_token` later; assuming refresh handles it; default scopes only | Add `guilds.members.read`; capture and use the token in the callback only; resync via bot |
| Supabase JWT | Legacy HS256 secret; trusting `user_metadata` | JWKS + algorithm/issuer/audience checks; roles from own DB |
| Supabase DB from VPS | Direct connection (IPv6-only on Free) or transaction pooler with prepared statements | Session pooler (IPv4) from the persistent container |
| Supabase Storage | Public buckets, trusting client MIME, originals served directly | Private incoming bucket -> processed derivatives -> public bucket; bucket MIME/size limits |
| Supabase Data API | Leaving it exposed "because RLS is on" | Revoke/hide app schemas; deny-all RLS; CI check |
| Discord bot | Requesting GUILD_MEMBERS + Gateway for a small guild | REST `Get Guild Member` only; handle 429 with `Retry-After` |
| Discord webhook | Interpolating user text; inline call in request path | `allowed_mentions: {parse: []}`, escaping, outbox + retry |
| Vercel -> NestJS | Forwarding cookies cross-site; losing user IP; fetching API at build time | Server-to-server Bearer; forward IP with shared-secret header; resilient build |
| NestJS -> Vercel revalidation | No auth on the revalidate endpoint; fire-and-forget without retry | Shared-secret Route Handler, `revalidateTag`, short `cacheLife` fallback |
| Oracle VCN + host | Opening only one of the two firewalls | Security List/NSG and iptables both; verify from outside |
| Docker + firewall | `-p 3000:3000` bypasses ufw | Bind to `127.0.0.1`, expose only via Caddy |
| YouTube embeds | Rendering user-supplied URL/iframe | Store provider+id, build `youtube-nocookie` URL, CSP `frame-src` |
| Social scrapers | Judging OG tags by page source only | Test real Discord/WhatsApp unfurls on the deployed URL |

## Performance Traps

Expected scale is small (15-50 active members, public readers possibly more via shared links), so the real constraints are free-tier quotas, not CPU.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Serving original-size images from Storage | Egress climbs; slow feed | Pre-generate thumbs/display WebP; long `Cache-Control`; lazy loading | ~5 GB/month egress (a few hundred daily viewers on an image-heavy feed) |
| Feed N+1 queries (posts -> author -> tags -> reaction counts) | Slow `/explorar`, DB CPU | Single query with joins/aggregates or batched loaders; denormalized counters updated transactionally | A few hundred posts with 20 per page |
| Offset pagination on growing feed | Duplicates/skips, slow deep pages | Keyset pagination | Thousands of posts |
| `sharp` processing on request thread with high concurrency | OOM kills, container restarts | Concurrency limit 1-2, `limitInputPixels`, size caps, optional job queue | A few simultaneous 12 MP uploads on a 1 GB VM |
| Unbounded notifications table | Slow badge query | Index `(user_id, read_at)`, retention/cleanup job, count via index | Tens of thousands of rows |
| Every public request hits the VPS API | Latency + outage = site down | Cached rendering with tag revalidation | As soon as traffic spikes after a Discord share |
| Filter combos (tags + author + year) without indexes | Slow filtered feed | Composite indexes designed from the actual query shapes; `EXPLAIN` in tests | ~10k posts |
| DB pool too large for pooler/free tier | Connection errors | Pool max 5-10 | Immediately under bursts |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Service/secret key in Vercel env or client bundle | Full DB/Storage takeover (High) | Only in NestJS container; no `NEXT_PUBLIC_`; secret scanning in CI |
| Data API reachable for app tables | Anyone with the public key reads/writes data (High) | Hide/revoke schemas + RLS on all tables + CI check |
| `getSession()` trusted on the server | Forged cookie accepted (High) | `getClaims()`/`getUser()`; BFF verifies via JWKS |
| Open redirect in auth callback `next` param | Phishing via your domain (Medium) | Allowlist relative paths only |
| Stored XSS in posts/comments/profile | Session theft, defacement (High) | Single sanitizing renderer, no raw HTML, CSP |
| SVG/polyglot/decompression-bomb uploads | XSS, DoS, malware hosting (High) | Magic-byte allowlist, reject SVG, `limitInputPixels`, re-encode |
| EXIF GPS in published photos | Doxxing members' locations (High; also LGPD) | Strip via re-encode; verify with `exiftool` in tests |
| Webhook/bot mention injection | Server-wide ping/spam (Medium) | `allowed_mentions` empty, escaping |
| Webhook URL / bot token leakage | Impersonation of the clan (Medium-High) | Env only, log redaction, rotation runbook |
| `X-Forwarded-For` trusted blindly | Rate-limit bypass, forged audit IPs (Medium) | Exact hop count; secret header from BFF |
| Role escalation: first admin, last admin, self-promotion | Lockout or takeover (High) | Seed admin by Discord ID via env; forbid removing last admin; audit log every role change; role changes admin-only and re-checked server-side |
| IDOR on edit/delete/read of pending posts | Reading/editing others' drafts (High) | Authorization in services (owner-or-role check), tested per endpoint; deny-by-default |
| Unvalidated DTOs (mass assignment) | User sets `status`, `author_id`, `role` (High) | Global `ValidationPipe({whitelist: true, forbidNonWhitelisted: true, transform: true})`; separate DTOs for create/update/moderate |
| SSRF in thumbnail/oEmbed fetch | Internal network probing (Medium) | Provider allowlist, no redirects to private ranges, timeouts, size cap |
| Personal data / LGPD | Legal and trust risk (Medium) | Privacy note, deletion/anonymization path for a departed member who asks, no unnecessary PII, EXIF stripped |
| Images of people (including old photos of minors) | Takedown requests | Report/takedown flow for moderators; author attribution + removal policy |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Silent failure when the user is not in the guild | Person logs in, can't post, no explanation | Explicit "you must be in the No Law Discord" state with a link; re-check button |
| Post vanishes into "pending" with no feedback | Members think the post was lost | Status page "my posts" with pending/rejected + reason; in-site notification on decision |
| Editing an approved post resets it to hidden | Loss of published content | Revision model (live stays live) |
| Upload errors with no detail | Frustration | Clear limits shown up front (size/types), client-side preview, progress, server error mapping |
| Filter state lost on navigation | Can't share/find history | Filters in URL query string, shareable; empty-state messages |
| Slow first load of image-heavy feed | Bounce | Blur placeholders, fixed aspect ratios, lazy loading |
| Mobile-first neglected (clan shares links on WhatsApp/Discord) | Most visitors arrive on phones | Test OG previews and layout on mobile first |
| Embedded video autoplays/loads heavy iframes | Slow feed | Click-to-load facade |
| Deleted video with no context | Archive looks broken | Cached title/thumbnail placeholder |
| Mixed language/locale | Confusing | Single locale (pt-BR) decided up front |

## "Looks Done But Isn't" Checklist

- [ ] **Discord login:** Often missing the `guilds.members.read` scope, a non-member path, and email-less accounts. Verify with three accounts: member, non-member, no-email.
- [ ] **JWT guard:** Often missing aud/iss/alg checks and tests for forged/expired tokens. Verify the negative-test suite exists and runs in CI.
- [ ] **RLS:** Often "enabled" but Data API still exposed or a table missed. Verify `curl` with the publishable key returns nothing for every table and the CI check passes.
- [ ] **Roles panel:** Often missing last-admin protection and audit entries. Verify demoting the last admin is rejected and logged.
- [ ] **Post approval:** Often missing concurrency control, edit-after-approval handling, notification on rejection. Verify with two moderator sessions and an edit of a published post.
- [ ] **Uploads:** Often missing SVG rejection, pixel limit, orientation, GPS strip, quotas. Verify with the abuse-fixture set and `exiftool`.
- [ ] **Unpublish:** Often leaves cached HTML, OG unfurl and public image URLs. Verify the post URL 404s, tag revalidated, media removed.
- [ ] **Rate limiting:** Often keyed on the proxy IP. Verify two different users from different IPs do not share a bucket, and a spoofed `X-Forwarded-For` does not bypass.
- [ ] **TLS/firewall:** Often one of the two firewalls missed or container port exposed. Verify with an external scan and `curl http://<ip>:3000` failing.
- [ ] **Backups:** Often configured but never restored. Verify a restore into a scratch project and record the time it took.
- [ ] **Keep-alive/monitoring:** Often pinging a cached page. Verify a real DB query happens daily and an outage alert reaches you.
- [ ] **Webhook:** Often pings @everyone or blocks approval on failure. Verify a title with `@everyone` does not ping and approval succeeds with Discord unreachable.
- [ ] **OG previews:** Often only checked in page source. Verify real unfurl in Discord and WhatsApp on production.
- [ ] **Logs:** Often contain tokens. Verify redaction by grepping logs after an authenticated request.
- [ ] **Docker image:** Often x86-only or running as root. Verify `docker run --platform linux/arm64`, `whoami`, image contents free of `.env`.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Service key leaked | MEDIUM | Rotate secret key in dashboard (disable legacy keys), redeploy API with new env, review audit/access logs, rewrite git history only if needed (rotation is what matters) |
| Instance reclaimed / VM lost | MEDIUM | Re-provision from IaC notes, pull image from GHCR, restore env from password manager, point DNS; fall back to Plan B container meanwhile |
| Supabase project paused | LOW | Click "Resume project" (restorable within the documented window), add the real keep-alive |
| Supabase quota exceeded (egress/storage) | MEDIUM | Switch to derivatives-only serving, purge orphans, move media to a second free project/other free object storage, temporarily disable uploads |
| Stored XSS found | HIGH | Disable the renderer path or enforce strict CSP, re-render with fixed sanitizer (raw markdown is preserved, which is why you store raw), invalidate sessions if needed, audit-log review |
| Wrong JWT validation shipped | MEDIUM | Rotate the signing key, deploy corrected guard, wait token TTL + 15 min before revoking old key |
| Archive deleted by cascade | HIGH | Restore from last nightly dump; this is why backups and `RESTRICT` FKs exist |
| Approved-then-edited malicious content went live | MEDIUM | Unpublish via moderator panel (triggers revalidation), purge scraper caches by changing slug/OG URL if needed, add revision flow |
| IP rate-limit bucket shared by all users | LOW | Fix trust-proxy/forwarded-IP header, redeploy; add test |
| Discord webhook URL leaked | LOW | Delete and recreate the webhook, update env |
| Bot token leaked | LOW-MEDIUM | Reset token in the Developer Portal, redeploy, review audit log of the guild |
| Free-tier terms change (Oracle/Supabase/Vercel) | MEDIUM | Container + env portability (already a constraint) makes migration mechanical; keep the Plan B deployed once |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. Legacy HS256 JWT validation / wrong claims | P-Auth | Negative token tests in CI; no `JWT_SECRET` in repo |
| 2. `provider_token` lifecycle | P-Auth (spike first), P-Engage | Login as member/non-member/no-email; guild data persisted at callback |
| 3. Stale membership / leaving members | P-Auth, P-Mod, P-Engage | FK audit (no cascade to posts); former-member test; scheduled resync |
| 4. Cookie/session topology, httpOnly, open redirect | P-Infra (ADR), P-Auth | Works in deployed Safari/Chrome; cookies show httpOnly; `next=` abuse test |
| 5. RLS illusion / Data API / key leakage | P-Infra, P-Harden | `curl` anon access test; CI RLS check; gitleaks clean |
| 6. DB connectivity (IPv6/pooler) | P-Infra | App starts on the VPS with the session pooler URL |
| 7. Upload pipeline abuse | P-Posts | Abuse fixture suite; `exiftool` clean; memory stays flat |
| 8. Stored XSS | P-Posts, P-Harden | XSS corpus test; CSP report-only then enforced |
| 9. Oracle capacity/reclaim/quota cut | P-Infra, P-Harden | Provisioned early; sized <= 2 OCPU/12 GB; rebuild drill; uptime monitor |
| 10. Firewall/Docker/TLS | P-Infra | External scan shows only 22/80/443; cert auto-renews |
| 11. Rate limiting behind proxies | P-Infra, then per route | Two-IP test; spoofed header test; 429 with `Retry-After` |
| 12. Moderation state machine, audit | P-Mod | Concurrency and edit-after-approval tests; append-only audit |
| 13. Pending media publicly reachable | P-Posts, P-Mod | Pending image URL returns 403/404 for anon |
| 14. Supabase free limits/pausing/backups | P-Infra, P-Posts, P-Harden | Daily keep-alive query; nightly dump exists; restore drill done; usage alerts |
| 15. Next.js caching/revalidation | P-Read (spike) | Publish/unpublish round trip; API-down read test; no per-user data in cached fns |
| 16. OG previews | P-Read | Real Discord/WhatsApp unfurl on production |
| 17. Video embed security/link rot | P-Posts | Non-allowlisted URL rejected; CSP `frame-src`; placeholder for dead video |
| 18. Webhook/bot misuse | P-Engage | `@everyone` title test; approval succeeds with Discord down; minimal bot perms |
| 19. Snowflake IDs as numbers | P-Auth | DTO/schema use strings; large-ID fixture test |
| 20. Scope creep | Roadmap structure | Every phase ends deployed; "Not now" list maintained |
| 21. Feed/year semantics | P-Posts (schema), P-Read | `occurred_at` exists; keyset pagination; indexed filters |
| 22. Open comments abuse | P-Mod, P-Engage | Ban/mute works; toggling reactions does not spam notifications |
| 23. Migration sources of truth | P-Infra | Fresh DB builds from migrations only in CI |
| 24. ARM Docker build | P-Infra | Image runs under `--platform linux/arm64`; non-root; no `.env` in image |
| 25. CORS/Helmet | P-Infra | CORS test from foreign origin fails; headers scan |
| 26. Observability leaks | P-Infra, P-Harden | Redaction grep; live vs ready health checks |
| 27. Auth testing harness | P-Auth, P-Infra | Local JWKS harness; no test-login in prod build |
| 28. Vercel Hobby terms | P-Infra | Limits re-read and recorded in ADR |

### Phase-specific research flags (for the roadmap)

| Phase | Needs deeper phase research? | Why |
|-------|------------------------------|-----|
| P-Infra | Yes (short spike) | Oracle current capacity/quota/idle behavior, domain/TLS choice under zero budget, Plan B free-tier terms, Vercel Hobby limits |
| P-Auth | Yes (spike) | Real Discord token/refresh behavior through Supabase, `@supabase/ssr` httpOnly cookie customization, JWKS verification in Nest |
| P-Posts | Yes | Upload path choice (direct vs signed URL), `sharp` limits on the chosen VM, sanitizer pipeline, CSP |
| P-Mod | No | Standard state-machine/audit patterns (design carefully, but no unknowns) |
| P-Read | Yes (spike) | Cache Components + external API revalidation, bot/crawler rendering, OG unfurl behavior |
| P-Engage | Light | Bot REST rate limits and outbox pattern are well known; confirm `Get Guild Member` works with the bot permissions chosen |
| P-Harden | No | Verification-only phase |

## Sources

Official documentation fetched 2026-11-14 (confidence MEDIUM per the research seam, cross-checked against practice):
- Supabase signing keys / JWKS / rotation: https://supabase.com/docs/guides/auth/signing-keys
- Supabase API keys (publishable/secret/legacy): https://supabase.com/docs/guides/api/api-keys
- Supabase social login, provider tokens: https://supabase.com/docs/guides/auth/social-login
- Supabase Discord provider setup: https://supabase.com/docs/guides/auth/social-login/auth-discord
- Supabase billing and Free plan quotas: https://supabase.com/docs/guides/platform/billing-on-supabase
- Supabase project pausing: https://supabase.com/docs/guides/platform/free-project-pausing
- Supabase storage file limits: https://supabase.com/docs/guides/storage/uploads/file-limits
- Supabase connecting to Postgres (IPv4/IPv6, pooler modes): https://supabase.com/docs/guides/database/connecting-to-postgres
- Discord gateway privileged intents: https://docs.discord.com/developers/topics/gateway#privileged-intents
- Discord OAuth2 (token expiry, refresh, scopes): https://docs.discord.com/developers/topics/oauth2
- Discord Get Current User Guild Member: https://docs.discord.com/developers/resources/user#get-current-user-guild-member
- Discord Get/List Guild Members: https://docs.discord.com/developers/resources/guild#get-guild-member
- Oracle Always Free resources (A1 allowance, idle reclamation, home region): https://docs.oracle.com/en-us/iaas/Content/FreeTier/resourceref.htm
- Next.js caching (Cache Components), updated 2026-10-06: https://nextjs.org/docs/app/getting-started/caching

Secondary / community (LOW to MEDIUM, treat as signals, verify before relying):
- Oracle Always Free A1 reduction reports: https://linuxiac.com/oracle-quietly-cuts-free-tier-ampere-a1-resources-in-half/ (effective date and PAYG impact unconfirmed; sources conflict)
- Third-party explainer on idle rules: https://oracommit.blogspot.com/2026/02/understanding-oci-always-free-compute.html
- Community threads on missing `provider_token` after refresh (no accepted answer found), e.g. https://www.answeroverflow.com/m/1438477722241335298
- Supabase pause restore-window discrepancy (90 days in changelog vs 1 year in current docs): https://supabase.com/changelog/27497-paused-free-plan-projects-are-restorable-for-90-days

Established practice, not re-verified this session ([E] items): Vercel serverless body-size limit, Public Suffix List behavior for `vercel.app` and dynamic-DNS domains, Docker bypassing ufw, Express `trust proxy` semantics, `sharp` metadata/orientation behavior, Free-plan lack of backups, WhatsApp/Discord unfurl constraints, `@supabase/ssr` non-httpOnly cookies, Next.js `proxy.ts` rename.

---
*Pitfalls research for: public community blog on Next.js (Vercel) + NestJS (Oracle Always Free, Docker) + Supabase (Discord OAuth), zero budget*
*Researched: 2026-11-14*
