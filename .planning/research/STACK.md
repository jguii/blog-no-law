# Technology Stack

**Project:** Blog No Law (community/clan blog: public read, Discord-OAuth member posting, moderation queue)
**Researched:** 2026-11-14
**Scope:** Supporting stack around the author's fixed choices (Next.js on Vercel, NestJS in Docker on Oracle Always Free, Supabase Postgres/Auth/Storage, TypeScript end to end, US$0/month). The fixed choices are not relitigated.
**Overall confidence:** MEDIUM-HIGH

## How to read the confidence labels

- **HIGH**: versions, engines and peer-dependency facts read directly from the npm registry or package tarballs on 2026-11-14, and/or confirmed by an official vendor doc plus a second independent source.
- **MEDIUM**: one official-doc fetch (summarised by a fetch tool) or a behaviour that is consistent with registry metadata but not executed here.
- **LOW**: third-party blog or search summaries only, or inference. Never treat as settled.
- Note: the GSD `classify-confidence` seam rates the `websearch`/`webfetch` providers as LOW by provider. Labels below are per claim, after cross-checking against registry metadata (machine ground truth) where possible.

## Headline findings that change plans

These are findings that contradict common assumptions, or that the roadmap must absorb.

1. **The Oracle Always Free Ampere A1 allowance is now 2 OCPU / 12 GB (1,500 OCPU-h + 9,000 GB-h per month), half the old 4 OCPU / 24 GB.** Old guides are stale. This is still plenty for one NestJS container plus Caddy. Oracle's own page also still says idle Always Free instances may be reclaimed (7 days with CPU p95 <20%, network <20%, and, for A1, memory <20%). A quiet blog API will sit below 20% memory of 12 GB, so reclamation is a real risk rather than a theoretical one. Confidence: HIGH (Oracle docs page fetched, plus Linuxiac).
2. **NestJS is now v12 (12.5.0, released 2026-11-12), ESM-first, with native Standard Schema (Zod) validation.** `nestjs-zod` is unnecessary and does not declare Nest 12 support. Vitest is the generated default for ESM projects. Confidence: HIGH.
3. **TypeScript 7.0 (the Go-native compiler) is `latest`, but the toolchain is not ready.** Pin TypeScript to `~6.0.3`. `typescript-eslint` peers `<6.1.0`, `ts-jest` peers `<7`, and `@nestjs/cli` depends on `typescript ~6.0.2`. Confidence: HIGH (registry metadata).
4. **Prisma split-brain on npm.** `prisma@latest` (the CLI) is `8.0.0-rc.33` while `@prisma/client@latest` is `7.10.1`. `pnpm add prisma` would install a release candidate that mismatches the client. Pin exact `7.10.1` for `prisma`, `@prisma/client` and `@prisma/adapter-pg`. Prisma 8 GA was described by Prisma as "four to eight weeks out", and Prisma 7 gets security fixes after 8 GA (12 months per one Prisma post, 18 months per another source; do not rely on either number). Confidence: HIGH on the dist-tags, MEDIUM on the Prisma 8 timeline.
5. **Supabase direct DB connections are IPv6-only on the free plan.** An IPv4-only Oracle VM cannot reach `db.<ref>.supabase.co`. Use the shared Supavisor pooler in **session mode** (port 5432, `postgres.<ref>` user, IPv4). Confidence: HIGH (official docs).
6. **Supabase provider tokens are neither persisted nor refreshed**, so the planned "OAuth scope `guilds.members.read` gives role IDs" flow works only at the instant of login. A bot-token REST lookup (below) is simpler and keeps working after login. This changes an assumption in PROJECT.md and needs the author's decision. Confidence: HIGH on the Supabase behaviour, MEDIUM on the Discord endpoint requirements (see Discord section).
7. **Vercel Functions cap request bodies at 4.5 MB (not configurable).** Image uploads cannot be proxied through Next.js server actions or route handlers. Uploads must go from the browser to the NestJS API directly. This constrains the auth/cookie design. Confidence: HIGH.
8. **Node 26 is Active LTS (since Oct 2026) and ships without Corepack.** Install pnpm explicitly (`pnpm/action-setup` in CI, `npm i -g pnpm@12` locally and in Docker). Confidence: HIGH (the local Node 26.13.1 install contains only `node`, `npm`, `npx`).
9. **`eslint-config-next@16.4.6` depends on plugins whose ESLint peer ranges stop at ESLint 9**, so use ESLint 9.x for `apps/web` even though ESLint 10 is `latest`. Confidence: HIGH (registry peer ranges).

## Recommended Stack

### Runtime, language and monorepo

| Technology | Version | Purpose | Why | Confidence |
|---|---|---|---|---|
| Node.js | 26.x LTS (dev machine runs 26.13.1) | Runtime for API, CI, local dev | Active LTS since Oct 2026, EOL Apr 2029. All chosen libraries support it (Vitest 5 and Nest CLI generators explicitly list >=26). Fallback: Node 24 (Maintenance LTS, EOL Apr 2028). Both `node:26-bookworm-slim` and `node:24-bookworm-slim` have arm64 images. | HIGH |
| TypeScript | `~6.0.3` | Language, end to end | Pinned below 6.1 because typescript-eslint requires `<6.1.0`, Nest CLI uses `~6.0.2`. TS 7 upgrade is a later chore once the programmatic API (promised in 7.1) and typescript-eslint catch up. | HIGH |
| pnpm | 12.18.0 | Package manager, workspaces | Strict node_modules, workspace protocol, catalogs. Not bundled with Node 26, so install explicitly. | HIGH |
| Turborepo | 2.11.11 | Task graph and cache (`build`, `typecheck`, `test`, `lint`) | Three workspaces, but cached `shared -> api/web` builds speed up CI. Free local and CI caching. Remote cache optional. | HIGH |
| Monorepo layout | n/a | `apps/web`, `apps/api`, `packages/shared` | `packages/shared` holds Zod schemas, inferred DTO types, role and status enums, error codes. It is the single wire contract between Next and Nest. Build it with `tsc` to ESM `dist` and consume via `workspace:*`. | HIGH |

### Frontend (apps/web)

| Technology | Version | Purpose | Why | Confidence |
|---|---|---|---|---|
| Next.js | 16.4.6 | App Router, SSR/ISR, SEO, OG images | Current stable. Turbopack default. Use `proxy.ts` (replaces `middleware.ts`). `params`, `cookies()` and `headers()` are async. `next lint` is removed. | HIGH |
| React / React DOM | 19.3.1 | UI | Next 16 peer range. | HIGH |
| `@supabase/ssr` + `@supabase/supabase-js` | 0.12.7 + 2.119.0 | Discord OAuth (PKCE) and session cookies in Next | Official SSR helper. In server code verify with `supabase.auth.getClaims()`, never trust `getSession()` for authorization. Use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_...`), not the legacy anon key. | HIGH |
| Tailwind CSS | 4.3.5 (+ `@tailwindcss/postcss` 4.3.5) | Styling | create-next-app default. | HIGH |
| shadcn/ui CLI | 4.23.0 | Accessible component source copied into the repo | No runtime dependency lock-in. Radix/Base UI primitives, good a11y defaults. | MEDIUM |
| Zod | 4.6.7 | Shared validation schemas (forms and API) | One schema validates the form in the browser and the request in Nest. Zod 4 implements Standard Schema. | HIGH |
| react-hook-form + `@hookform/resolvers` | 7.92.0 + 7.0.6 | Forms (post, comment, admin) | Resolvers peer-lists `zod ^3.25 \|\| ^4`. | HIGH |
| Tiptap (`@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-placeholder`) | 3.34.0 | Rich text editor for posts | See "Rich text" below. v3 StarterKit already bundles Link and Underline (verified in its dependency list). Needs `immediatelyRender: false` under SSR. | HIGH on versions, MEDIUM on fit |
| `@tanstack/react-query` | 5.107.1 | Client-side cache for infinite feed, reactions, notifications polling | Optional. Add only when client-driven interactivity appears (infinite scroll, optimistic reactions). RSC covers the rest. React 19 `useOptimistic` can cover simple reactions. | MEDIUM |
| `sonner` | 2.0.8 | Toasts | shadcn standard. | MEDIUM |
| `date-fns` | 4.4.0 | Dates (pt-BR locale, year filter) | Tree-shakeable. Single-locale site, so no i18n framework (`next-intl` is overkill). Set `<html lang="pt-BR">`. | MEDIUM |
| `@sentry/nextjs` | 11.12.0 | Frontend and RSC error monitoring | Peers `next ^14 \|\| ^15 \|\| ^16`. | HIGH |
| `@playwright/test` | 1.65.1 | E2E | Next lists it as an optional peer. | HIGH |

### Backend (apps/api)

| Technology | Version | Purpose | Why | Confidence |
|---|---|---|---|---|
| NestJS (`@nestjs/common`, `core`, `platform-express`, `testing`) | 12.5.0 | API framework | Current. Run it as ESM (`"type": "module"`, `module: nodenext`, `.js` extensions on relative imports). Prisma 7, jose 6 and file-type 22 are ESM-first or ESM-only, so ESM avoids `require(esm)` friction. Nest 12 still supports CommonJS if ESM hurts. | HIGH |
| Express adapter (`@nestjs/platform-express`, Express 5.3.0, Multer 2.5.0) | 12.5.0 | HTTP layer | Maximum ecosystem compatibility (helmet, throttler `trust proxy`, multer). Fastify and the new `platform-node` adapter buy performance this app (15-50 active users) will never need. | HIGH |
| `@nestjs/cli` | 12.0.13 | Build and dev server | Default SWC/tsc flow. Requires Node >=22.22.3 / 24.15 / 26 for generators. | HIGH |
| `@nestjs/config` | 12.1.1 | Typed env config | v12 accepts a Standard Schema, so validate `process.env` with a Zod schema at boot and fail fast. | HIGH |
| `reflect-metadata` / `rxjs` | 0.2.2 / 7.8.2 | Nest peers | n/a | HIGH |
| Zod via `StandardSchemaValidationPipe` | 4.6.7 | Request validation | Nest 12 core feature: `app.useGlobalPipes(new StandardSchemaValidationPipe())` and `@Body({ schema })`. Schemas live in `packages/shared`. | HIGH (migration guide + docs) |
| `@nestjs/schedule` + `@nestjs/event-emitter` | 12.0.4 + 12.0.3 | Cron (Discord role resync, orphan upload cleanup) and in-process events (post approved -> webhook + notification) | Zero extra infrastructure. Peers include Nest 12. | HIGH |
| `@nestjs/terminus` | 12.1.0 | `/health` and `/ready` | v12 dropped the legacy indicator API (use `up()`/`down()`). Write a small DB indicator with `SELECT 1`. The check also generates the DB traffic that stops Supabase pausing the project. | HIGH |

### Auth: validating Supabase JWTs in a NestJS guard

| Technology | Version | Purpose | Why | Confidence |
|---|---|---|---|---|
| `jose` | 6.2.17 | JWT verification via remote JWKS | Supabase's own docs use it in their example. Do **not** use `@nestjs/jwt`, `passport`, `jsonwebtoken` or the legacy HS256 secret. | HIGH |
| Supabase JWT signing keys | n/a (dashboard setting) | Asymmetric (ES256) tokens | Migrate the project from the legacy shared secret to signing keys first, then verify only against JWKS. | HIGH |

Guard design (a custom `CanActivate`, no Passport):

```ts
import { createRemoteJWKSet, jwtVerify } from 'jose';

const issuer = `${env.SUPABASE_URL}/auth/v1`;
const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`), {
  cacheMaxAge: 10 * 60_000,   // never longer than Supabase's own ~10 min edge cache
  cooldownDuration: 30_000,
});

const { payload } = await jwtVerify(token, jwks, {
  issuer,
  audience: 'authenticated',
  algorithms: ['ES256'],      // pin; reject HS256 and alg confusion
});
// payload.sub = auth user id, payload.role === 'authenticated'
```

Rules:
- Verify `iss`, `aud` (`authenticated`) and the algorithm explicitly. Never trust `role` from the token for **app** authorization: the blog's roles (member, moderator, admin) live in your own `profiles` table and are loaded per request (cache for seconds, not minutes, so demotions take effect).
- Make the key resolver injectable. Production uses `createRemoteJWKSet`; tests use `createLocalJWKSet` with a key pair from `generateKeyPair('ES256')`. This makes the guard fully testable without Supabase.
- Supabase's edge caches JWKS for about 10 minutes, so after a key rotation allow ~20 minutes before revoking the old key.
- Provision the app `profiles` row just-in-time on first authenticated call (upsert by `sub`) inside Nest, not with a DB trigger on `auth.users`. The logic stays testable and in one place.
- `aud` value `authenticated` and `iss` format are from Supabase's JWT docs. The exact Discord identity field names inside `user_metadata` should be confirmed in a spike (see Gaps).

### Database access from NestJS

| Technology | Version | Purpose | Why | Confidence |
|---|---|---|---|---|
| Prisma ORM (`prisma`, `@prisma/client`, `@prisma/adapter-pg`) | **7.10.1 exact** | Typed queries, migrations | See decision below. Rust-free client, driver adapter on `pg`, `prisma.config.ts`. | HIGH on versions, MEDIUM-HIGH on the choice |
| `pg` | 8.23.1 | Postgres driver used by the adapter | Prisma 7 requires an explicit driver adapter. | HIGH |
| `dotenv` | 18.0.10 | Load env for `prisma.config.ts` | Prisma 7 no longer auto-loads `.env`. | HIGH |

**Decision: Prisma 7, not Drizzle, not supabase-js.**
- Prisma 7.10 is the stable line (Prisma 7 requires Node >=20.19, TS >=5.4, `"type": "module"`, generator `prisma-client` with a required `output` path, and driver adapters).
- Drizzle's stable line is `0.45.4`, while `1.0` is at `rc.5` with breaking changes (relational query API v2) still landing. Starting a greenfield on 0.45 means a near-certain migration, and starting on the RC means churn. Drizzle does have better in-schema RLS ergonomics. If the author values SQL-first control over migration stability, Drizzle 1.0 stable is the alternative to revisit.
- supabase-js (PostgREST) from the backend gives up transactions, joins, and typed relations, and RLS then depends on forwarding user JWTs. Use supabase-js in the API **only** for Storage and Auth admin calls.
- Prisma 8 (RC) renames query methods (`take/skip` to `limit/offset`) and moves to new packages. Stay on 7.x. A 7-to-8 side-by-side upgrade path is documented by Prisma, so this is a planned later chore, not a blocker.
- Pin exact versions for all three Prisma packages and renovate them together.

Connection and RLS configuration:
- Runtime and migrations both use the **Supavisor shared pooler in session mode** (port 5432, user `postgres.<ref>`) because the Oracle VM is IPv4-only by default. Copy the exact pooler host from the Supabase "Connect" dialog (it contains a cluster index). Session mode supports prepared statements, so no `pgbouncer=true`. If you ever use transaction mode (port 6543), prepared statements must be disabled.
- Set an explicit `pg` pool size small (for example max 5-10) and a connect timeout, since the adapter inherits `pg` defaults (no connect timeout by default).
- `pg` rejects invalid TLS certs (Prisma 7 behaviour change). Configure the Supabase CA via `NODE_EXTRA_CA_CERTS` rather than `rejectUnauthorized: false`.
- **RLS defence in depth, done honestly:** the `postgres` role (what Prisma would use by default) has `BYPASSRLS`, so RLS would never apply to the API's own queries. Create a dedicated login role for the API (`app_api`, not owner, not `BYPASSRLS`) with explicit grants, keep the `postgres` credentials for migrations only, and write RLS policies that grant `app_api` what it needs. Separately, enable RLS on every `public` table and revoke default grants from `anon`/`authenticated`, so the publishable key cannot read or write anything through PostgREST. Supabase warns that on existing projects `anon`/`authenticated` start with default grants, so the revoke is required, not optional. Write all of this as raw SQL inside Prisma migrations. Prisma has no RLS DSL.
- Prisma Migrate is the **only** migration system for `public`. Use the Supabase CLI (3.1.0) just for the local dev stack (Postgres + Auth + Storage + Studio), not for schema migrations, to avoid two competing systems.
- The dedicated-role approach rests on Postgres behaviour plus a vendor blog, with no official "Prisma + Supabase" guide found. Verify with an RLS test in CI (see Testing).

### Discord integration

| Technology | Version | Purpose | Why | Confidence |
|---|---|---|---|---|
| `@discordjs/rest` | 2.6.3 | Bot-authenticated REST calls: guild member and guild roles | Built-in rate-limit bucket handling, tiny compared to the full client. | HIGH on version, MEDIUM on endpoint behaviour |
| `discord-api-types` | 0.38.59 | Typed payloads for REST responses | Types only. | HIGH |
| Native `fetch` | (Node) | Webhook post for "post approved" | A webhook is one JSON POST. `allowed_mentions: { parse: [] }`. Handle 429 `Retry-After`. | HIGH |

Recommendation (needs the author's decision, because it changes PROJECT.md): **identify membership and roles with the bot token, not the user OAuth scope.**
- Supabase documents that provider tokens are intentionally not stored and not refreshed. The user's `provider_token` is only reachable in the session returned right after the callback. The OAuth scope `guilds.members.read` (`GET /users/@me/guilds/{guild.id}/member`) therefore only works as a one-shot at login, and Discord user tokens expire.
- With the bot in the guild, `GET /guilds/{guild.id}/members/{user.id}` (bot token) returns 200 with the role IDs, or 404 if the user is not a member. `GET /guilds/{guild.id}/roles` returns role `name` and `colors` (the role `color` field is deprecated in favour of `colors`, which has `primary_color`, `secondary_color`, `tertiary_color`). Neither endpoint is documented as needing a permission or privileged intent. The privileged `GUILD_MEMBERS` intent is documented for **List Guild Members**, which we do not need. This can be re-run at any time (login, nightly cron, moderator "resync" button).
- Use the Discord user ID from the Supabase Discord identity. Request only the default Discord scopes (`identify`, `email`) in Supabase. Keep `guilds.members.read` as the fallback if the spike shows the bot endpoint needs more.
- **Do not install `discord.js`** (14.28.1). It pulls in the gateway client and websocket machinery for a bot that never connects. A "read-only bot" here is a bot application with a token that is a guild member with no permissions beyond View Channels. No gateway connection is needed to call REST.
- Cache role names and colors in your own table (`discord_roles`) refreshed by `@nestjs/schedule` hourly and on demand. Never call Discord on page render.

### Validation, sanitisation and HTTP hardening

| Technology | Version | Purpose | Why | Confidence |
|---|---|---|---|---|
| Zod 4 (+ Nest `StandardSchemaValidationPipe`) | 4.6.7 | Input validation on every route | Shared with the frontend. Use `z.strictObject` to reject unknown keys on mutations. Coerce query params (`z.coerce.number()`). | HIGH |
| `sanitize-html` + `@types/sanitize-html` | 2.18.2 + 2.16.2 | Server-side HTML allowlist sanitisation of post/comment bodies **on write** | Pure JS (htmlparser2), no DOM or jsdom, small, fast, trivial on ARM. Strict allowlist matching what the Tiptap schema can emit. Force `rel="noopener noreferrer nofollow ugc"` and `target="_blank"` on links, allow only `http/https/mailto` schemes, and restrict `<img src>` to your Storage public host. | MEDIUM-HIGH |
| `helmet` | 8.3.0 | Security headers on the API | One-liner. The API serves JSON only, so its CSP can be `default-src 'none'`. The browser-facing CSP belongs in Next (nonce via `proxy.ts`). | HIGH |
| CORS (`app.enableCors`) | built in | Restrict origins | Allow only the exact web origin(s) (prod + preview if needed). Never `*` with credentials. | HIGH |
| `@nestjs/throttler` | 6.7.1 | Rate limiting | Peers Nest 12. Named throttlers (`short`/`medium`/`long`) plus `@Throttle` on login-sync, comments, upload, post creation. **In-memory storage is correct for one API container.** Add Redis only if you scale to multiple instances. | HIGH |

Throttler details that bite:
- Behind Caddy, set Express `trust proxy` to the hop count or CIDR you actually have, otherwise every client appears as Caddy's IP (or you trust spoofed `X-Forwarded-For`).
- If Next.js server-side code calls the API on users' behalf, all those calls originate from Vercel egress IPs, so an IP-keyed throttle penalises everyone at once. Override `getTracker()` to key authenticated routes by `sub` (user id), and for anonymous routes forward the real client IP from Next in a header the API only trusts from a request carrying a shared server secret.
- `@nest-lab/throttler-storage-redis@1.2.0` peers Nest up to 11 and needs Redis you do not have. Skip it.

**Why sanitize-html over DOMPurify:** DOMPurify (3.4.18) is the most battle-tested sanitiser but needs a DOM on the server (`isomorphic-dompurify` pulls in jsdom). A jsdom dependency on a small ARM container is heavy and increases attack surface. sanitize-html with a tight allowlist, plus CSP, is the pragmatic choice here. If the author prefers the maximum-assurance route, run DOMPurify on the Next.js server (Node runtime) at render time as a second layer. Do not render stored HTML without one of these layers.

### Rich text and embeds

**Recommendation: Tiptap 3 emitting HTML; the API sanitizes on write; embeds are structured data, not HTML.**
- Tiptap is headless ProseMirror with first-class React support, an MIT core, and the extensions this blog needs (headings, lists, quotes, code, links, images). Lexical (0.53.0) is a valid alternative. Tiptap's React and Next story is simpler. Slate, Draft.js, Quill and CKEditor are not recommended (maintenance state or licensing).
- Store the sanitized HTML (plus optionally a plain-text excerpt for previews and search). Render with `dangerouslySetInnerHTML` only for the already-sanitized value.
- Videos are out of scope as uploads. Model them as a separate `embeds` array validated server-side: parse the URL, allow only YouTube (and other explicitly allowlisted hosts), store `{provider, videoId}`, and render a click-to-load `youtube-nocookie.com` iframe built from the ID. This keeps `<iframe>` out of the sanitised HTML allowlist entirely. Allow the frame host in the Next CSP `frame-src`.
- Simpler alternative if the author wants the smallest XSS surface: store **Markdown** and render with `react-markdown` (10.1.0, no raw HTML by default). It sacrifices WYSIWYG for members. The requirement text asks for HTML sanitisation, so HTML is the default here.
- Avoid `@tiptap/html` on the server unless needed: its server rendering needs `happy-dom`, another DOM dependency.

### Images and media

| Technology | Version | Purpose | Why | Confidence |
|---|---|---|---|---|
| `sharp` | 0.35.5 | Decode untrusted images, resize, convert to WebP | libvips prebuilt binaries for linux-arm64 (glibc and musl) are published. Strips all metadata by default (including EXIF), so GPS and camera data are removed. | HIGH |
| `file-type` | 22.3.0 (ESM-only, Node >=22) | Magic-byte sniffing of the upload | Never trust the client `Content-Type` or file extension. | HIGH |
| Multer via `FileInterceptor` | 2.5.0 (bundled with `@nestjs/platform-express`) + `@types/multer` 2.3.0 | Multipart parsing | Use **memory storage** with hard `limits` (`fileSize` about 10 MB, `files`, `fields`, `parts`). Nest 12.5 also defaults multipart parts to 1000. | HIGH |
| `@supabase/supabase-js` (server) | 2.119.0 | Upload processed files to Storage, create buckets | Use a **secret key** (`sb_secret_...`) from env, server only, never the browser. Legacy `service_role` and `anon` JWT keys are being deprecated by Supabase by end of 2026. | HIGH |

Pipeline (all server-side in Nest):
1. Multer memory buffer with size limit. Reject early.
2. `file-type` allowlist: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
3. `sharp(buf, { failOn: 'warning', limitInputPixels: 50_000_000 })` (keep the default `failOn` of `'warning'`, which is the strictest, and never set `unlimited: true`). Then `.autoOrient()` (`rotate()` with no angle is the same call) **before** output, so orientation is applied and the EXIF tag is dropped. Then `.resize({ width: 1920, withoutEnlargement: true })` and `.webp({ quality: 80, effort: 4 })`. Do **not** call `withMetadata()`, `keepExif()` or `keepMetadata()`.
4. Generate two variants (for example thumbnail about 480 px and full about 1920 px) and a content-hash or UUID filename (never the user's filename). Store in a public-read Storage bucket.
5. GIF memes (likely, given the audience): use `animated: true` and animated WebP, with a frame and pixel cap, or reject animated input in v1. Animated WebP encoding is CPU-expensive on a 2-OCPU VM, so cap concurrency (a semaphore or `sharp.concurrency(2)`).
6. Serve through the Supabase CDN and use `next/image` with `unoptimized` or a thin custom loader. Pre-generated WebP variants avoid spending the Vercel Image Optimization quota.
7. Free-tier budget: Supabase Free is 1 GB storage, 5 GB egress (+5 GB cached), 500 MB database, 50 MB max upload, 2 active projects. WebP at about 1920 px is what makes the clan archive fit. Track bucket size in an admin view.

### Observability

| Technology | Version | Purpose | Why | Confidence |
|---|---|---|---|---|
| `pino` + `pino-http` + `nestjs-pino` | 10.4.0 + 11.0.0 + 5.3.1 | Structured JSON logs with request IDs | `nestjs-pino@5.3.1` peers exactly `pino ^10`, `pino-http ^11`, Nest `^11.0.8 \|\| ^12.0.2`. Configure `redact` for `req.headers.authorization`, `req.headers.cookie`, and any tokens. | HIGH |
| `pino-pretty` | 13.2.0 | Dev-only pretty printing | Dev dependency only. | HIGH |
| `@sentry/nestjs` + `@sentry/nextjs` | 11.12.0 | Error monitoring | Both peer Nest 12 / Next 16. Free Developer plan: 5k errors, 1 user, 30-day retention, 5M spans. Set a low `tracesSampleRate`. Needs Node >=20.19 (22.x >=22.12). Import `instrument` first. In ESM mode the SDK must be loaded before app code (use `node --import ./dist/instrument.js`), which the NestJS doc page did not confirm, so verify in the setup phase. | MEDIUM-HIGH |
| Docker `json-file` log driver with rotation | n/a | Log retention on the VM | `max-size: 10m`, `max-file: 3`. No log shipper in v1. Optionally add a free hosted log tier later. | HIGH |
| External uptime ping on `/health` | n/a | Uptime and anti-pause | Any free uptime monitor. The health route must touch the DB (`SELECT 1`) because Supabase **pauses free projects after 7 days of inactivity**. | HIGH |

### Testing, linting and CI

| Technology | Version | Purpose | Why | Confidence |
|---|---|---|---|---|
| Vitest | **4.1.12** | Unit + integration tests, API and web | This is the version family the official Nest 12 ESM generator pins (`^4.1.2`) with Vite 8. Vitest 5.1.0 exists (since 2026-11-02, requires Node >=22.12 and Vite 6.4/7/8). Upgrade to 5 as a separate chore once the Nest template moves. | MEDIUM-HIGH |
| `@vitest/coverage-v8` | 4.1.12 | Coverage | Same version as Vitest. | HIGH |
| Vite | 8.3.8 | Vitest runtime. Vite 8 ships `resolve.tsconfigPaths` | The Nest 12 template config is just `defineConfig({ resolve: { tsconfigPaths: true }, test: { globals: true } })`. No `unplugin-swc` needed. The template relies on Vite 8/Oxc for decorator metadata. Confirm in the first test that DI (`emitDecoratorMetadata`) resolves. | HIGH (template read from the official tarball), MEDIUM on runtime behaviour |
| `supertest` | 7.3.2 | HTTP-level API tests | Pair with `Test.createTestingModule`. | HIGH |
| Real Postgres in tests | `postgres:17` image | Integration tests against real SQL (Prisma + RLS) | GitHub Actions `services: postgres` in CI, docker compose locally. `@testcontainers/postgresql` 12.2.1 is a fine optional extra. Do not mock Prisma for query tests. | MEDIUM-HIGH |
| `@playwright/test` + `@axe-core/playwright` | 1.65.1 + 4.14.0 | E2E and accessibility smoke | Discord OAuth cannot be automated. In tests, create a user via the Supabase Admin API on the local stack and mint a session, or enable password login on the **local** stack only. | HIGH on versions, MEDIUM on approach |
| `oxlint` + `oxlint-tsgolint` | 1.93.0 + 7.0.2007 | Linting `apps/api` and `packages/shared` | What the official Nest 12 template ships (`oxlint --type-aware`, with `no-floating-promises: error`). | HIGH |
| ESLint + `eslint-config-next` | **9.39.x** + 16.4.6 | Linting `apps/web` | ESLint 10 is `latest`, but `eslint-plugin-react`, `-import` and `-jsx-a11y` (dependencies of `eslint-config-next`) only list ESLint up to 9. Use the flat config. | HIGH |
| Prettier | 3.10.1 | Formatting | Both apps. | HIGH |
| GitHub Actions | `actions/checkout@v7`, `actions/setup-node@v7`, `pnpm/action-setup@v6`, `docker/setup-buildx-action@v4`, `docker/login-action@v4`, `docker/metadata-action@v6`, `docker/build-push-action@v7`, `actions/upload-artifact@v7`, `actions/cache@v6` | CI and image build | Majors read from the GitHub releases API on 2026-11-14. Pin third-party actions by commit SHA and enable Dependabot for Actions. | HIGH |

CI shape: one `ci` job (install with frozen lockfile, `turbo run lint typecheck test build`, Postgres service container, `prisma migrate deploy`), a Playwright job (Chromium only, cached browsers), and a `release` job on `main` that builds `linux/arm64` and pushes to GHCR. Build natively on `ubuntu-24.04-arm` (free and unlimited **for public repositories**; availability for private repos is unconfirmed, and the fallback is QEMU buildx, which is slow but works). Add `gitleaks`, `pnpm audit --prod`, and CodeQL (free for public repos).

### Infrastructure (Oracle Always Free VM + Docker)

| Technology | Version | Purpose | Why | Confidence |
|---|---|---|---|---|
| OCI `VM.Standard.A1.Flex` | 2 OCPU / 12 GB (the current Always Free cap) | Host | Allowance is 1,500 OCPU-h + 9,000 GB-h per month = 2 OCPU/12 GB always-on. The 4/24 figure in older guides is outdated. 200 GB combined block storage, 10 TB/month egress. | HIGH |
| Docker Engine + Compose v2 | current | Run `api` + `caddy` | Same image runs on Render/Koyeb if Oracle disappears. | HIGH |
| `node:26-bookworm-slim` base image | 26 | API image | arm64 + amd64 verified on Docker Hub (updated 2026-11-11). Debian slim (glibc) avoids musl surprises with sharp/libvips. Multi-stage build, `pnpm deploy --prod` to ship only API deps, non-root user, `HEALTHCHECK`. | HIGH |
| Caddy | 2.11.9 (`caddy:2-alpine`, arm64 image verified) | Reverse proxy with automatic Let's Encrypt TLS | Zero-config HTTPS and renewal in a 4-line Caddyfile. Nginx + certbot adds moving parts for no benefit here. | HIGH |
| GHCR | n/a | Image registry | Free. Deploy by SSH: `docker compose pull && docker compose up -d`. | MEDIUM |

Deployment notes:
- **Only Caddy publishes ports 80/443.** The `api` container joins an internal Docker network (no published port). Open 80/443 in **both** the OCI VCN security list and the OS firewall (Oracle's Ubuntu images ship restrictive iptables rules). This is experience-based and not verified in this research.
- **Reclamation mitigation (decision for the author):** Oracle says idle Always Free instances may be reclaimed. Converting the tenancy to Pay-As-You-Go while staying inside the Always Free shape reportedly exempts it from the idle rule, but it requires a credit card and at least one source reports the halved limits applying to PAYG accounts too. Treat this as LOW confidence and verify with Oracle before relying on it. Whatever the choice, keep the container portable (env-only config, no state on the VM, images in GHCR) and write a runbook for re-provisioning in under an hour.
- **Plan B is weaker than PROJECT.md assumes.** Research on Render and Koyeb free tiers returned conflicting third-party reports: Render free web services spin down after inactivity (cold starts), and Koyeb's free web-service tier was not clearly confirmed for 2026. Treat both as LOW confidence and re-check their official pricing pages before the roadmap relies on them.
- **TLS requires a hostname.** Let's Encrypt cannot issue for a bare IP. Options: a purchased domain (about US$10/year, which breaks the strict US$0 rule), or a free dynamic-DNS subdomain. Whether a given free-DNS parent domain is subject to Let's Encrypt's shared 50-certs-per-registered-domain-per-week limit was not verified (LOW). Put this decision in front of the author early, because it gates deploy.

### Development workflow

| Tool | Version | Purpose | Notes |
|---|---|---|---|
| Supabase CLI (`supabase` devDependency) | 3.1.0 | Local Postgres + Auth + Storage + Studio | Configure `[auth.external.discord]` in `config.toml` for local OAuth. Do not use it for schema migrations. |
| Husky + lint-staged | 9.1.7 + 17.6.0 | Pre-commit | Optional. Keep hooks fast (staged files only). CI is the real gate. |
| Dependabot (or Renovate) | n/a | Dependency updates | Group Prisma packages and Nest packages so they move together. |
| `knip` | 6.45.1 | Dead-code and unused-dependency detection | Optional, useful in a monorepo. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not (now) / When to switch |
|---|---|---|---|
| ORM | Prisma 7.10.1 | Drizzle (0.45.4 stable / 1.0 RC) | Stable line is about to be superseded by 1.0 with RQB v2 breaking changes. Switch if Drizzle 1.0 goes stable and you want in-schema RLS policies and SQL-like queries. |
| ORM | Prisma 7.10.1 | Prisma 8 RC | RC with renamed query API and new package layout. Adopt after GA via the documented side-by-side path. |
| ORM | Prisma 7.10.1 | Kysely 0.29.9 | Excellent typed SQL builder but no migrations or schema modelling. Choose only if you want to hand-write all SQL. |
| Validation | Zod 4 via Nest 12 Standard Schema | `class-validator` + `class-transformer` | Still supported, but it duplicates types and cannot be shared with the browser. |
| Validation | Zod 4 | `nestjs-zod` 5.6.0 | Peers Nest `^10 \|\| ^11` only, and Nest 12 now has the capability in core. |
| JWT | `jose` + custom guard | `@nestjs/passport` + `passport-jwt` | An extra abstraction layer with no benefit when there is one token type. |
| Discord | `@discordjs/rest` + bot token | `discord.js` 14.28.1 | Full gateway client for a bot that never connects. |
| Discord | Bot-token member lookup | OAuth `guilds.members.read` | Works only at login (tokens unpersisted, unrefreshed). Keep as fallback. |
| HTTP adapter | Express 5 | Fastify / `platform-node` | Speed is irrelevant at this scale, ecosystem compatibility is not. |
| Sanitiser | `sanitize-html` | DOMPurify (+ jsdom) | Better pedigree, heavier on the server. Use it at render time on the Next server if you want a second layer. |
| Editor | Tiptap 3 | Lexical 0.53.0 | Fine, but more manual React wiring. |
| Editor | Tiptap (HTML) | Markdown + `react-markdown` | Smallest XSS surface. Worse member UX. Reasonable fallback. |
| Rate-limit store | In-memory | Redis (`ioredis` 6.0.0) | Needs extra infra and a throttler storage package that does not list Nest 12. Add only for multi-instance deployment. |
| Jobs | `@nestjs/schedule` + `@nestjs/event-emitter` | `pg-boss` 12.38.2 / BullMQ 6.7.6 | `pg-boss` (Postgres-backed, no Redis) is the right upgrade if durable retries for webhooks and notifications become necessary. BullMQ needs Redis. |
| Tests | Vitest | Jest 30.5.2 | Nest 12 ESM packages load in Jest only on Node >=24.9. Jest is the default for CommonJS projects only. |
| Lint (api) | oxlint | ESLint + typescript-eslint | Valid. oxlint is simply the Nest 12 template default and much faster. |
| Reverse proxy | Caddy | Nginx + certbot | More config, manual renewal plumbing. |
| Monorepo | pnpm + Turborepo | Nx | Heavier than needed for three workspaces. |
| Error tracking | Sentry free | GlitchTip (self-host) | Extra service on a 12 GB VM. Only if Sentry quotas become a problem. |

## What NOT to Use

| Avoid | Why | Use Instead |
|---|---|---|
| TypeScript 7.x (for now) | typescript-eslint `<6.1.0`, ts-jest `<7`, Nest CLI `~6.0.2`, API stability not yet promised | `typescript@~6.0.3` |
| `pnpm add prisma` (unpinned) | `latest` CLI is an 8.0 RC while the client `latest` is 7.10.1 | Exact `7.10.1` for `prisma`, `@prisma/client`, `@prisma/adapter-pg` |
| Legacy Supabase HS256 JWT secret, `anon`/`service_role` JWT keys | Shared-secret verification is discouraged by Supabase and legacy keys are being deprecated by end of 2026 | Asymmetric signing keys + JWKS, `sb_publishable_` / `sb_secret_` keys |
| `jsonwebtoken`, `@nestjs/jwt`, Passport | Unneeded and weaker defaults than jose for remote JWKS | `jose` |
| Direct Supabase connection string from the VM | IPv6-only on Free, fails from an IPv4-only network | Supavisor session-mode pooler host |
| Connecting Prisma as `postgres` and calling that "RLS defence in depth" | `postgres` bypasses RLS | Dedicated non-bypass `app_api` role |
| supabase-js/PostgREST as the main data layer | No real transactions or joins, RLS pushes you into forwarding user JWTs | Prisma. supabase-js for Storage and Auth admin only |
| `discord.js` gateway client | Heavy and always-on for a REST-only need | `@discordjs/rest` |
| Storing Discord tokens long-term | Supabase intentionally does not, and you would need to implement refresh yourself | Bot-token lookups |
| Trusting client MIME type or filename | Trivial to spoof | `file-type` magic-byte check, server-generated filenames |
| `sharp().withMetadata()` / `keepExif()` / `keepMetadata()` | Re-introduces EXIF, including GPS | Default output (strips metadata) after `autoOrient()` |
| `unlimited: true` or lowered `failOn` in sharp | Disables decompression-bomb and memory protections | Defaults plus `limitInputPixels` |
| Uploads through Next.js server actions or route handlers | Vercel 4.5 MB body limit (HTTP 413) | Browser to NestJS directly using a short-lived upload ticket |
| Iframes in sanitised HTML | Large XSS and clickjacking surface | Structured `embeds` plus allowlisted click-to-load player |
| `isomorphic-dompurify`/jsdom on the API | Heavy, a DOM implementation on the server | `sanitize-html` |
| `@nest-lab/throttler-storage-redis` | Peers stop at Nest 11 and need Redis | Built-in in-memory store |
| `middleware.ts`, `next lint`, sync `cookies()`/`params` in Next 16 | Deprecated or removed | `proxy.ts`, ESLint CLI, `await` the async APIs |
| ESLint 10 in `apps/web` | `eslint-config-next` plugins cap at ESLint 9 | ESLint 9.39.x |
| Jest for the ESM Nest 12 API | Needs Node >=24.9 to load ESM-only core packages | Vitest |
| Relying on Corepack | Not shipped with Node 26 | `pnpm/action-setup`, `npm i -g pnpm@12` |
| Treating Render/Koyeb free tiers as a drop-in plan B | Spin-down or unclear free tier in 2026 | Verify first. Reduce reclamation risk on Oracle |
| Publishing the API container port directly | Bypasses TLS and the proxy | Caddy is the only public listener |

## Stack Patterns by Variant

**If the author keeps the "httpOnly cookies" requirement strictly:**
- Use server-only Supabase clients and call the API from Server Components and Server Actions with the access token read from the cookie (server-to-server, no CORS).
- `@supabase/ssr`'s browser client reads cookies from JavaScript, so a fully httpOnly session means no browser Supabase client. Run login initiation through a route handler.
- Because uploads cannot pass through Vercel, add an upload-ticket endpoint: a Server Action asks the API for a short-lived, user-bound, size-bound signed ticket, and the browser POSTs the file directly to the API with that ticket (CORS limited to the web origin).

**If the browser calls the API directly with a Bearer token:**
- Simpler CORS-and-fetch model, no ticket dance, but the access token is readable from JavaScript (the XSS blast radius is bigger). The sanitiser and CSP then carry more weight.
- Choose this only if the requirement is relaxed deliberately.

**If Oracle capacity or reclamation fails:**
- Redeploy the same GHCR image to another host with env vars only. Verify the plan-B platform's free tier first (see above). Because Supabase is external, no data migration is needed.

**If the clan outgrows free tiers:**
- Supabase Pro raises limits and also gets IPv4/dedicated pooler options. Redis plus BullMQ/pg-boss and a second API instance become justified. Move throttling to Redis at that point.

## Installation

```bash
# Tooling (Node 26 has no Corepack)
npm i -g pnpm@12.18.0

# Root
pnpm add -Dw turbo@2.11.11 typescript@~6.0.3 prettier@3.10.1

# packages/shared
pnpm --filter @bnl/shared add zod@4.6.7

# apps/api  (ESM project: "type": "module")
pnpm --filter @bnl/api add \
  @nestjs/common@12.5.0 @nestjs/core@12.5.0 @nestjs/platform-express@12.5.0 \
  @nestjs/config@12.1.1 @nestjs/throttler@6.7.1 @nestjs/terminus@12.1.0 \
  @nestjs/schedule@12.0.4 @nestjs/event-emitter@12.0.3 \
  reflect-metadata@0.2.2 rxjs@7.8.2 zod@4.6.7 \
  jose@6.2.17 helmet@8.3.0 \
  prisma@7.10.1 @prisma/client@7.10.1 @prisma/adapter-pg@7.10.1 pg@8.23.1 dotenv@18.0.10 \
  @supabase/supabase-js@2.119.0 \
  @discordjs/rest@2.6.3 discord-api-types@0.38.59 \
  sharp@0.35.5 file-type@22.3.0 sanitize-html@2.18.2 \
  nestjs-pino@5.3.1 pino@10.4.0 pino-http@11.0.0 @sentry/nestjs@11.12.0
pnpm --filter @bnl/api add -D \
  @nestjs/cli@12.0.13 @nestjs/testing@12.5.0 @nestjs/schematics@12.0.13 \
  vitest@4.1.12 @vitest/coverage-v8@4.1.12 vite@8.3.8 supertest@7.3.2 \
  @types/node@26 @types/express@5 @types/multer@2.3.0 @types/pg @types/sanitize-html@2.16.2 @types/supertest \
  oxlint@1.93.0 oxlint-tsgolint@7.0.2007 pino-pretty@13.2.0

# apps/web
pnpm --filter @bnl/web add \
  next@16.4.6 react@19.3.1 react-dom@19.3.1 \
  @supabase/ssr@0.12.7 @supabase/supabase-js@2.119.0 \
  zod@4.6.7 react-hook-form@7.92.0 @hookform/resolvers@7.0.6 \
  @tiptap/react@3.34.0 @tiptap/pm@3.34.0 @tiptap/starter-kit@3.34.0 \
  @tiptap/extension-image@3.34.0 @tiptap/extension-placeholder@3.34.0 \
  date-fns@4.4.0 sonner@2.0.8 @sentry/nextjs@11.12.0
pnpm --filter @bnl/web add -D \
  tailwindcss@4.3.5 @tailwindcss/postcss@4.3.5 eslint@9.39.5 eslint-config-next@16.4.6 \
  @playwright/test@1.65.1 @axe-core/playwright@4.14.0 vitest@4.1.12

# Local Supabase stack
pnpm add -Dw supabase@3.1.0
```

(`@bnl/*` is a placeholder scope; rename as desired.) Note that pnpm 10+ requires approving dependency build scripts (`onlyBuiltDependencies` in `pnpm-workspace.yaml`) for packages such as `sharp`, `prisma` and `@prisma/engines`. Verify each version against the registry once more on the day of scaffolding, because the ecosystem is moving quickly.

## Version Compatibility

| Package A | Compatible With | Notes |
|---|---|---|
| `@nestjs/*` 12.x | Node >=20.19 (not 21.x); Nest CLI generators need Node >=22.22.3 / 24.15 / 26 | Core packages are ESM-only; consumed via `require(esm)` from CJS. |
| `@nestjs/cli` 12.0.13 | `typescript ~6.0.2` | The CLI bundles its own TypeScript; keep the project at `~6.0.3`. |
| `typescript-eslint` 8.72.2 | `typescript >=4.8.4 <6.1.0`; ESLint 8.57/9/10 | Blocks TS 6.1+ and 7. |
| `ts-jest` 29.4.15 | `typescript >=4.3 <7` | Irrelevant if Vitest is used. |
| `nestjs-pino` 5.3.1 | `pino ^10`, `pino-http ^11`, Nest `^11.0.8 \|\| ^12.0.2` | Version-lock these three together. |
| `@nestjs/throttler` 6.7.1 | Nest 7 through 12 | OK. |
| `@sentry/nestjs` / `@sentry/nextjs` 11.12.0 | Nest 8 through 12 / Next 14 through 16; Node >=20.19, 22.x >=22.12 | Node 26 is covered by the `>=23.2.0` range. |
| `nestjs-zod` 5.6.0 | Nest `^10 \|\| ^11` | Not Nest 12. Not needed. |
| `@prisma/client` 7.10.1 | Node `^20.19 \|\| ^22.12 \|\| >=24`, TS >=5.4 | Pin the CLI (`prisma`) and adapter to the same exact version. |
| `@supabase/ssr` 0.12.7 | `@supabase/supabase-js ^2.114.0` | `supabase-js` 2.119.0 requires Node >=22. |
| `next` 16.4.6 | Node >=20.9, React 18.2+/19, TS >=5.1 | Peer on `@playwright/test ^1.51.1` is optional. |
| `eslint-config-next` 16.4.6 | ESLint >=9 declared, but its plugins stop at 9 | Use ESLint 9.39.x. |
| `vitest` 4.1.12 | Vite 8 (as in the Nest template) | Vitest 5.1.0 needs Node ^22.12 / ^24 / >=26. |
| `sharp` 0.35.5 | Node >=20.9; prebuilt linux-arm64 (glibc and musl) | No compiler needed in the image. |
| `file-type` 22.3.0 | Node >=22, ESM-only | One more reason the API is ESM. |
| `@hookform/resolvers` 7.0.6 | `zod ^3.25 \|\| ^4`, `react-hook-form ^7.55` | OK with Zod 4. |

## Open verifications (spikes for phase planning)

1. **Discord bot lookup:** confirm `GET /guilds/{id}/members/{user.id}` with a bot token needs no privileged intent for a bot with no gateway connection, and confirm the exact Discord user ID field in Supabase's Discord identity (`user_metadata.provider_id` / `identities[]`). Docs fetched did not state either. MEDIUM.
2. **Sentry ESM bootstrap** with Nest 12 (`--import` instrumentation). Not covered by the fetched page. MEDIUM.
3. **Vitest 4 + Vite 8 decorator metadata** with real Nest DI in this monorepo (path aliases, `shared` package). The Nest template suggests it works; the Nest docs page did not show config. MEDIUM.
4. **`app_api` role and RLS tests** against a Supabase project (grants, `FORCE ROW LEVEL SECURITY`, PostgREST denial with the publishable key). Based on Postgres semantics plus a vendor blog. MEDIUM.
5. **Oracle:** whether PAYG conversion removes idle reclamation and whether the halved limits apply to PAYG. Source quality LOW. Ask Oracle or test.
6. **Hostname and TLS** for the API without spending money. LOW.
7. **GitHub arm64 runners for a private repo.** Unconfirmed. Public repo is fine.

## Sources

- npm registry (`npm view`), 2026-11-14: versions, dist-tags, `engines`, `peerDependencies` for all packages listed. HIGH.
- `@nestjs/schematics@12.0.13` tarball (official generator templates for ESM: `vitest.config.ts`, `tsconfig.json`, `package.json.template`, `.oxlintrc.json`): read without executing. HIGH.
- NestJS 12 migration guide (https://docs.nestjs.com/migration-guide), validation docs (https://docs.nestjs.com/techniques/validation), testing (https://docs.nestjs.com/fundamentals/testing), rate limiting (https://docs.nestjs.com/security/rate-limiting; documents the v5 API, v6.7.1 verified through the registry), GitHub releases (https://github.com/nestjs/nest/releases): MEDIUM-HIGH.
- Supabase: JWT signing keys (https://supabase.com/docs/guides/auth/signing-keys), verifying JWTs (https://supabase.com/docs/guides/auth/jwts), JWT fields (https://supabase.com/docs/guides/auth/jwt-fields), connecting to Postgres (https://supabase.com/docs/guides/database/connecting-to-postgres), social login / provider tokens (https://supabase.com/docs/guides/auth/social-login), Discord provider (https://supabase.com/docs/guides/auth/social-login/auth-discord), API keys (https://supabase.com/docs/guides/api/api-keys), RLS (https://supabase.com/docs/guides/database/postgres/row-level-security), Next.js SSR (https://supabase.com/docs/guides/auth/server-side/nextjs), pricing (https://supabase.com/pricing): MEDIUM-HIGH.
- Discord developer docs (https://docs.discord.com/developers/resources/guild, https://docs.discord.com/developers/resources/user): MEDIUM (permission and intent requirements not stated explicitly for Get Guild Member).
- Prisma 7 upgrade guide (https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7); Prisma 8 status (https://www.prisma.io/blog/is-prisma-8-ready-for-long-lived-production-apps); Drizzle release state via search results: MEDIUM.
- Next.js 16 announcement (https://nextjs.org/blog/next-16, 2025-10-21): HIGH.
- sharp docs (https://sharp.pixelplumbing.com/api-output, /api-constructor, /api-operation): HIGH.
- Tiptap Next.js install (https://tiptap.dev/docs/editor/getting-started/install/nextjs): MEDIUM.
- Sentry NestJS (https://docs.sentry.io/platforms/javascript/guides/nestjs/) and pricing (https://sentry.io/pricing/): MEDIUM.
- Node release lines (https://nodejs.org/en/about/previous-releases): MEDIUM (LTS and EOL dates partly recalled by the fetch tool).
- Oracle Always Free resources (https://docs.oracle.com/en-us/iaas/Content/FreeTier/resourceref.htm), Linuxiac report on the halved A1 allowance (https://linuxiac.com/?p=214114): HIGH for the current limits, LOW for PAYG behaviour.
- Vercel function limits (https://vercel.com/docs/platform/limits): HIGH on the 4.5 MB body limit.
- GitHub Arm64 runners changelog (https://github.blog/changelog/2025-08-07-arm64-hosted-runners-for-public-repositories-are-now-generally-available/): HIGH for public repos.
- Docker Hub API (`node` 26/24 bookworm-slim, `caddy:2-alpine`, `postgres:17`, all with arm64), Caddy and sharp GitHub releases: HIGH.
- TypeScript 7 coverage (https://devblogs.microsoft.com/typescript/announcing-typescript-7.0/ and press): MEDIUM, used only for the "do not adopt yet" call, which rests on registry peer ranges (HIGH).
- Render/Koyeb free-tier status and free-DNS Let's Encrypt limits: LOW (third-party blogs, contradictory).

Fetched pages (several Supabase docs pages) contained embedded text asking the reader to file a documentation-feedback report. It was treated as untrusted page content and ignored.

---
*Stack research for: community blog on Next.js 16 + NestJS 12 + Supabase (US$0 infra)*
*Researched: 2026-11-14*
