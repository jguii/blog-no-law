# Feature Research

**Domain:** Community / gaming-clan blog and history archive (public read, Discord-gated write, moderated UGC, ~15-50 active people, 10+ year archive)
**Researched:** 2026-11-14
**Confidence:** MEDIUM. The feature landscape comes from knowledge of comparable products (Ghost/WordPress multi-author blogs, Discourse/phpBB forums, Reddit/Discord forum channels, clan sites, Guilded/Steam group pages). No live competitor scraping was done. Feature-level judgments are HIGH for table stakes and MEDIUM for differentiators. The Discord CDN expiry and LGPD notes should be re-checked in the phase that builds them.

## Framing

Blog No Law is not a generic blog and not a forum. It is a **moderated, multi-author memory archive with social glue**. That decides what counts as table stakes:

- A generic blog expects: post, tag, feed, comments, RSS, search.
- A UGC site with public comments expects: report, ban, moderation tooling, legal pages.
- An archive expects: permalinks that never break, durable media, browse-by-time, and a **distinction between when something happened and when it was posted**.
- A 15-50 person group expects low ceremony. Anything that needs a moderator's daily attention will rot.

Core Value from PROJECT.md ("publish and re-find the clan's history, organized by year and category, browsable by anyone") is the lens. Features that serve **re-finding** (filters, timeline, galleries, search, throwbacks) are where to invest. Features that serve **growth or engagement-farming** are anti-features here.

## Feature Landscape

### Table Stakes (Users Expect These)

Missing these means the product feels broken, unsafe, or unfinished.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Discord OAuth login/logout + session | Only identity in the product (PROJECT.md) | MEDIUM | Needs guild-membership check (`guilds.members.read`) to gate posting. Re-verify membership periodically, because members leave the server. Posts of ex-members stay (archive). |
| Post create with text + images + video embed | Core Value | MEDIUM | Constrained rich text. Recommend Markdown with toolbar and live preview, or Tiptap with sanitized output. Never accept raw HTML. Server-side sanitization is mandatory. |
| Multiple images per post, upload with preview | Clan history is mostly screenshots | MEDIUM | Size/type limits, WebP conversion, EXIF strip, already in PROJECT.md. Alt text field per image (see differentiators). |
| Video embed from link (allowlisted providers) | Out-of-scope to host video | LOW-MEDIUM | Allowlist: YouTube (use youtube-nocookie), Twitch clips, Streamable, Medal.tv, Vimeo. Parse URL to provider and ID, render iframe from a template. Never store or render user-supplied iframe HTML. |
| Post lifecycle states: draft, pending, approved, rejected | Approval queue implies state machine | LOW-MEDIUM | `draft -> pending -> approved/rejected`. Drives notifications, webhook, and public visibility. Model it once, correctly (single source of truth for "public"). |
| Drafts (save without submitting) | Long posts with many images are not written in one sitting | LOW | Falls out of the state machine for free. Server-side drafts only. Skip autosave in v1. |
| Edit and delete own posts | Standard UGC expectation | MEDIUM | Needs an explicit policy for editing an already-approved post (see Dependency Notes). Use soft delete so moderators and the audit log keep context. |
| Moderator approval queue (approve / reject with reason) | Defined requirement | MEDIUM | Reject reason is shown to the author via notification. Queue shows image previews inline. Without a reason field, rejections feel arbitrary. |
| Categories/tags on posts | Defined requirement | LOW | Admin-managed fixed category list (SA-MP primary, other games, memes, vida). Do not allow free-form tags in v1 (tag sprawl: "samp", "SA-MP", "SAMP"). |
| Chronological feed ("Explorar") with pagination | Defined requirement | LOW-MEDIUM | Cursor pagination, not offset. Chronological only, no algorithm. |
| Combinable filters (category + member + year), URL-driven | Defined requirement; this is how users re-find things | MEDIUM | Filter state lives in the URL query string so filtered views are shareable and back-button safe. Multi-category semantics must be decided (OR within categories, AND across filter types is the least surprising). |
| Post detail page with stable permalink | Archive must not break links | LOW | Slug + ID so renamed titles do not break URLs. Canonical URL set. |
| Member profile (public) with their posts | Defined requirement | LOW-MEDIUM | Avatar and name from Discord, role badges, achievements, post list reusing the feed component with a pre-applied member filter. |
| Members directory page | Every clan site has a roster | LOW | Lists members with badges. Reuses profile data. Cheap and expected for a clan site. |
| Comments on approved posts | Defined requirement | MEDIUM | Post-moderation (published immediately, removed on report). Pre-moderating comments in a 15-50 person group kills conversation. Edit/delete own comment. |
| Reactions on posts (and ideally comments) | Defined requirement | LOW-MEDIUM | Unique constraint (user, target, type). Aggregate counts. Optimistic UI. |
| On-site notifications | Defined requirement | MEDIUM | Events: comment on my post, reaction on my post, post approved/rejected, achievement granted. Bell + unread count + list page. Fetch on load and on focus. No websockets needed (see anti-features). |
| Report content (posts and comments) | Public UGC without a report path is irresponsible and unmoderatable | LOW-MEDIUM | Reason enum + optional note. Appears in a moderation report queue. Reporter must be logged in. Rate limited. |
| User ban / mute | Public comments invite abuse eventually | MEDIUM | Ban blocks posting, commenting, reacting. Keep the account row so banned users cannot trivially re-register. Reversible, audit-logged, optional reason. |
| Role system: member / moderator / admin, managed in blog | Defined requirement | MEDIUM | Admin panel to promote/demote. Roles are independent of Discord roles (key decision). Server-side guards on every mutation. |
| Moderation/admin audit log | Defined requirement | LOW-MEDIUM | Append-only: who, what, target, when, reason. Viewable by admins. |
| Responsive layout (mobile first) | Most clan members will open links from Discord on phones | MEDIUM | Native app is out of scope; responsive web is the delivery. |
| Dark mode (default dark, with toggle) | Gaming audience expectation; low effort if designed in from the start | LOW | CSS variables/tokens from day one. Retrofitting later is expensive. Respect `prefers-color-scheme`. |
| Accessibility baseline (WCAG 2.1 AA target) | Public site; also an explicit learning goal | MEDIUM | Semantic landmarks, keyboard-navigable lightbox, focus management, contrast in both themes, alt text, visible focus rings, reduced motion. |
| Image lightbox / gallery view | Screenshots are the content | MEDIUM | Keyboard (arrows/Esc), swipe, focus trap, caption and counter. Use a vetted library or headless primitive. Do not hand-roll focus traps. |
| Open Graph / Twitter card previews | Defined requirement; links are shared in Discord/WhatsApp constantly | MEDIUM | Per-post `og:title/description/image` (first image, resized to about 1200x630). Must be server-rendered. Also a sensible default image for home/profile/feed. |
| Basic SEO hygiene (sitemap, robots, canonical, semantic titles) | Public archive should be findable | LOW | Sitemap lists approved posts only. `noindex` on drafts, pending, and admin routes. |
| Pinned posts | Pinned "welcome / rules / about the clan" is expected on community sites | LOW | Boolean + order, mod/admin only. Show on top of Explorar and on home. |
| Static pages: About the clan, Rules, Privacy/Terms, Contact | Public UGC site collecting Discord identity data | LOW | LGPD (Brazil) basics: what is collected (Discord ID, name, avatar, role IDs), how to request deletion, who to contact. Include a way for a member to delete their account and personal data. |
| Empty, error, loading and 404 states | Polish expected on a "FODA" project | LOW | Cheap if treated as part of each feature, expensive if left to the end. |
| pt-BR copy throughout | Audience is Brazilian | LOW | Single-language. Hardcode strings in a central constants/messages file for tidiness, but no i18n framework (see anti-features). Format dates with `Intl` pt-BR. |

### Differentiators (Competitive Advantage)

These are where Blog No Law is better than "a Discord channel" or "a WordPress install". All align with Core Value (re-finding clan history).

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Clan timeline of eras (admin-managed) | The clan has left and returned to the server several times; the timeline is the clan's story | MEDIUM | Entity: `era` (title, description, start, end nullable, optional cover image). Public timeline page. Highest-identity feature in the project. |
| Link posts to eras (derived from date) | Browsing "what was happening in the 2016 era" is the archive payoff | LOW-MEDIUM | Derive by the post's occurred-on date falling inside an era range. No manual join table. Era page shows its posts. Add an era filter to Explorar later if useful. |
| "Occurred on" date separate from "published on" | An archive's posts describe the past. A 2015 screenshot posted in 2026 must appear under 2015 | LOW-MEDIUM | Optional field `occurred_at` (date, can be year-only or year-month precision), defaults to publish date. **Year filter and era derivation use this date.** This is the single most important modeling decision for the archive; changing it after launch means a data migration. Feed ordering is a product decision (see Open Decisions). |
| Discord role badges on profile (name + colour) | Makes members feel recognized; ties blog to the server's social structure | MEDIUM | Needs a read-only bot plus cache and periodic sync. Treat roles as display-only decoration; authorization stays with blog roles. Handle deleted/renamed roles and rate limits. |
| Manual achievements (admin creates and grants) | Honours people and milestones ("Veterano 2014", "Fundador") | MEDIUM | Entities: `achievement` (title, description, icon/image) and `member_achievement` (granted_by, granted_at, note). Shown on profile and triggers a notification. Manual only (automatic rules are out of scope). |
| Discord webhook announcing approved posts | Brings the clan back to the blog without anyone remembering to share | LOW-MEDIUM | Fire on the `approved` transition only, idempotently (do not repost on edit). Embed with title, author, category, thumbnail, link. Queue with retry so a Discord outage does not fail approval. Webhook URL is a secret (env var). |
| Rich link previews in Discord (good OG images) | Posts look great when shared; drives traffic back | LOW (on top of OG) | Cover image selection: let the author choose which image is the cover. |
| Shareable filtered views | "All SA-MP posts by Fulano in 2016" is a link you can post | LOW | Free if filters are URL-driven (table stakes). Mention it in UX so it is tested. |
| Photo archive / "Acervo" gallery page | Browse all images by year/category without opening posts | MEDIUM | Image grid with filter reuse. Needs an `images` table with `post_id`, dimensions, and `occurred_at` inherited from the post. High nostalgia value. Candidate for v1.x. |
| "Neste dia" throwback (on this day in past years) | Cheap, strong nostalgia hook, rewards the archive | LOW-MEDIUM | Query by month/day of `occurred_at`. Needs `occurred_at`. Home page widget. v1.x. |
| Full-text search (Portuguese) | Re-finding is the Core Value; filters alone do not find "that clip with the helicopter" | MEDIUM | Postgres `tsvector` with `portuguese` config + `unaccent`, GIN index. Search posts (title/body) and members. No external search service (free tier, extra infra). v1.x. |
| Trusted-member auto-approval (admin-granted flag) | Keeps the approval queue sustainable as the member base posts more | LOW | Boolean on member. Trusted members' posts skip `pending` but remain reportable and removable. Solves moderator fatigue, the number-one failure mode of approval queues. Still audit-logged. Consider for v1.x. |
| Image alt text and captions | Accessibility differentiator, and captions add archive context (who/when/where) | LOW | Optional alt field in uploader. Caption doubles as alt fallback. |
| Video embed click-to-load facade | Faster pages, no third-party cookies before click, better Lighthouse | LOW-MEDIUM | Thumbnail and play button swap to iframe on click. Good learning item. |
| Mention members (@) in posts/comments | Tagging who is in a photo or answering someone is very social for old friends | MEDIUM-HIGH | Needs autocomplete, parsing, notification, and rendering. Defer to v2. Cheaper variant: "people in this post" picker on the post form. |
| Reaction set of about 5 fixed types | More expressive than a single like, still cheap | LOW | Fixed emoji set defined in code (e.g. like, laugh, fire, GG, saudade). Not user-configurable. |
| RSS/Atom feed | Cheap, expected by a minority, signals "real blog" | LOW | One global feed plus optional per-category. v1.x. |
| One-level comment replies | Keeps conversation readable without full threading | MEDIUM | `parent_comment_id` restricted to top-level parents. Notify the parent author. Optional, v1.x. Flat is fine at launch. |
| Moderator dashboard (queue + reports + recent actions in one place) | Mods need a single inbox or the queue gets neglected | MEDIUM | Counts badge in nav for pending items. |
| Admin bulk/legacy post import tool or "post on behalf of" | There are 10+ years of material to backfill | MEDIUM | Admin can create a post attributed to a member (or a "former member" placeholder) with a custom `occurred_at`. Likely needed to seed the archive realistically. Consider it a pre-launch enabler more than a feature. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Video upload/hosting | "Our clips are the best content" | Storage, bandwidth, and transcoding cost break the zero-cost constraint; moderation burden rises. Already out of scope. | Embed links (YouTube, Streamable, Medal, Twitch). Upload to YouTube unlisted if needed. |
| Hotlinking Discord CDN images/attachments | Fastest way to "post" an image someone already shared in Discord | Discord attachment URLs are signed and expire, so archive posts silently break | Always upload and re-host images in Supabase Storage. Warn in the uploader if a Discord CDN link is pasted. |
| Real-time everything (WebSockets/SSE for notifications, live comments) | Feels modern | Persistent-connection infra on a free-tier VPS, reconnection edge cases, and almost no value at 15-50 users | Fetch notifications on page load, route change, and window focus. Optional light polling (60s) if wanted. |
| Direct messages / chat | "Members want to talk" | A second Discord to moderate. The clan already has one. | Link to the Discord server. |
| Email notifications / newsletter | Standard in blogs | Needs email infra and deliverability, and the login has no email by design | On-site notifications plus Discord webhook. |
| Multiple login providers, email/password | Wider reach | Breaks the "identity = Discord membership" model and creates password-security surface | Discord only (key decision). |
| Fully nested/infinite comment threading | "Like Reddit" | Complex UI and queries, poor mobile layout, no value at this volume | Flat comments, optionally one reply level. |
| Raw HTML or unrestricted WYSIWYG editor | "Let me format freely" | Primary XSS vector on a public site | Markdown or a constrained rich-text schema, with server-side sanitization. |
| Free-form user-created tags | Flexible | Tag sprawl and duplicates ruin filtering | Admin-managed category list; members choose from it. Admin can add categories on request. |
| Gamification: points, levels, leaderboards, karma | Engagement | Encourages low-quality spam posting; conflicts with "achievements are honours" | Manual achievements only. |
| Automatic achievements by rules | "Less admin work" | Rules engine, backfill jobs, and edge cases. Explicitly out of scope for v1. | Manual grant; revisit after launch if admins feel the pain. |
| Auto-moderation / ML / auto-hide on N reports | "Scale moderation" | Over-engineering at this scale; false positives on in-jokes and slang; brigading risk | Human moderators, report queue, optional word filter later. |
| Algorithmic/personalized feed, follows, "trending" | Engagement | Contradicts archive browsing and chronological reading; needs data and tuning | Chronological feed with explicit filters. |
| Two-way Discord sync (post from Discord, mirror comments) | Seamlessness | Bot write permissions (conflicts with read-only bot), duplicate-content handling, and moderation bypass | One-way webhook announcing approved posts. |
| Custom emoji reactions synced from Discord | "Our server emojis" | Needs bot emoji sync, asset licensing/availability, and rendering edge cases | Fixed built-in reaction set. |
| Multi-language i18n framework | "Best practice" | Single-language audience; adds routing, translation files, and SEO complexity | pt-BR only; keep copy in one place so an extraction is possible later. |
| Post scheduling, auto-save, full revision history UI | Seen in big CMSs | Cost exceeds value for 15-50 users | Drafts plus "edited" marker; audit log records moderation actions. Revisit if edit abuse appears. |
| View counters / analytics dashboards on posts | Vanity metrics | Tracking, privacy (LGPD) and bot-filtering work; little decision value | Reaction and comment counts are enough. Use privacy-friendly aggregate analytics at the infra level if wanted. |
| Native mobile app / PWA push | "Notifications on phone" | Out of scope; large added surface | Discord webhook already pings phones. |

## Feature Dependencies

```
Discord OAuth login
    └──requires──> Role system (member/mod/admin) ──requires──> Audit log
                        │
                        ├──requires──> Approval queue ──requires──> Post state machine (draft/pending/approved/rejected)
                        │                                   └──triggers──> Notifications (approved/rejected)
                        │                                   └──triggers──> Discord webhook (on approved)
                        ├──requires──> Report queue ──requires──> Comments / Posts
                        └──requires──> Ban / mute

Image upload pipeline (WebP, EXIF) ──requires──> Storage + Post media model
    ├──enhances──> Lightbox / gallery
    ├──enhances──> OG previews (cover image)
    └──enables──> Photo archive "Acervo" page

Post `occurred_at` (date of the event) ──requires──> Post model design (do first)
    ├──enables──> Year filter (correct semantics)
    ├──enables──> Era derivation ──requires──> Timeline of eras (admin CRUD)
    └──enables──> "Neste dia" throwback

Categories (admin-managed) ──requires──> Post model
    └──enables──> Combinable filters (category + member + year) ──enhances──> Shareable URLs, Search

Discord read-only bot ──requires──> Server config + secrets
    └──enables──> Role badges on profile

Achievements (admin CRUD + grant) ──requires──> Role system, Profile page
    └──triggers──> Notification (achievement granted)

Comments ──requires──> Approved post, Role system
    ├──triggers──> Notifications
    └──requires──> Rate limiting, Report, Ban

Reactions ──requires──> Approved post (and comments), Notifications (optional)

Trusted-member auto-approval ──conflicts-with──> "all posts reviewed" (needs explicit policy)
Edit approved post ──conflicts-with──> Approval integrity (needs re-approval policy)
Full-text search ──enhances──> Filters (additive, not replacing)
```

### Dependency Notes

- **Post state machine is the spine.** Approval queue, notifications, webhook, sitemap, OG, public feed, and RLS policies all key off `status = approved`. Build it before any of them, and make "is public" a single predicate reused everywhere (query layer and RLS), or drafts leak.
- **`occurred_at` must exist from the first migration.** It affects the year filter, era derivation, throwbacks, and sorting. Adding it later means a backfill and re-testing every filter.
- **Era derivation by date range avoids a join table.** Eras are admin-curated; posts fall into them by date. Overlapping or open-ended eras need a validation rule (decide whether overlaps are allowed).
- **Role badges depend on the Discord bot and its config.** Authorization must not depend on badges; badges are cosmetic and may be stale or missing. The profile must render fine with no badges.
- **Notifications depend on events from several features** (approval, comments, reactions, achievements). Define a single `notification` model and an event-emit helper early; each feature then just emits.
- **Edit-after-approval policy (decide in requirements):**
  - Option A: any edit to an approved post returns it to `pending`. This is safest but annoying for typo fixes, and the post vanishes from the public feed meanwhile.
  - Option B: edits go live immediately with an "edited" marker and an audit trail; mods can revert. This is friendlier but allows bait-and-switch.
  - **Recommendation:** B for trusted/anyone with a stored previous version (cheap: keep the last approved snapshot), A when the edit touches images or video. Keep it simple at launch: B with an "editado" marker, since it is a friends-only author pool; re-queue if moderators see abuse.
- **Trusted-member auto-approval conflicts with the stated rule that all member posts pass the queue.** It is optional and should be a deliberate product decision, not a silent default.
- **Reactions and comments depend on the ban system**, or the abuse path is open from day one. Do not ship public comments without report + ban + rate limit.

## MVP Definition

### Launch With (v1)

Minimum to deliver Core Value safely on a public site.

- [ ] Discord login + guild-membership check + member/moderator/admin roles — identity and authorization base
- [ ] Post state machine, create/edit/delete own, drafts — spine of the product
- [ ] Image upload pipeline + multiple images + video embeds (allowlist) — the content itself
- [ ] Categories (admin-managed) + `occurred_at` on posts — enables the filters and the archive semantics
- [ ] Approval queue with reject reason — defined requirement and publication gate
- [ ] Explorar feed with combinable URL-driven filters (category, member, year), cursor pagination — re-finding
- [ ] Post detail permalink + OG/SEO + sitemap — shareable in Discord/WhatsApp
- [ ] Member profile + members directory — defined requirement
- [ ] Comments (flat) + reactions (small fixed set) — community interaction
- [ ] Report, ban, rate limiting, audit log — required to run public UGC safely
- [ ] On-site notifications (comment, reaction, approval/rejection) — closes the loop for authors
- [ ] Discord webhook on approval — brings people back to the blog
- [ ] Timeline of eras (admin CRUD + public page) — the identity feature
- [ ] Manual achievements (admin CRUD, grant, show on profile) — defined requirement
- [ ] Discord role badges (bot, cache, display) — defined requirement
- [ ] Lightbox, dark mode, responsive, a11y baseline, pt-BR copy — table-stakes polish
- [ ] Static pages (About, Rules, Privacy/LGPD, Contact), pinned posts — public-site hygiene
- [ ] Admin "post on behalf of" with custom `occurred_at` (or equivalent seeding path) — needed to backfill the 10-year archive before launch

### Add After Validation (v1.x)

- [ ] Full-text search (Postgres, Portuguese) — once the archive has enough content that browsing alone fails
- [ ] Photo archive ("Acervo") page — once many images exist
- [ ] "Neste dia" throwback widget — cheap nostalgia once `occurred_at` is well populated
- [ ] RSS/Atom feed — low effort, add when asked
- [ ] Trusted-member auto-approval flag — when the queue becomes a moderator burden
- [ ] One-level comment replies — when comment threads get confusing
- [ ] Era filter in Explorar and era detail pages — once eras are populated
- [ ] Video embed click-to-load facade — performance pass
- [ ] Moderator dashboard consolidation — if reports and queue are scattered
- [ ] Alt text/caption prompts in the uploader — a11y improvement pass (alt field itself should exist at launch)

### Future Consideration (v2+)

- [ ] @mentions with autocomplete and notifications — meaningful complexity, defer
- [ ] "People in this photo" tagging — nostalgic, but needs UI and moderation of tags
- [ ] Automatic achievements by rule — explicitly out of scope for v1
- [ ] Per-category RSS, word filters for comments — only if demanded
- [ ] Revision history UI — only if edit abuse appears

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Discord login + roles + guards | HIGH | MEDIUM | P1 |
| Post state machine + CRUD + drafts | HIGH | MEDIUM | P1 |
| Image upload pipeline | HIGH | MEDIUM | P1 |
| Video embeds (allowlist) | HIGH | LOW | P1 |
| Categories + `occurred_at` | HIGH | LOW | P1 |
| Approval queue | HIGH | MEDIUM | P1 |
| Feed + combinable filters | HIGH | MEDIUM | P1 |
| OG/SEO + permalinks | HIGH | MEDIUM | P1 |
| Profiles + members directory | HIGH | LOW-MEDIUM | P1 |
| Comments + reactions | HIGH | MEDIUM | P1 |
| Report + ban + audit log | HIGH (safety) | MEDIUM | P1 |
| Notifications | MEDIUM-HIGH | MEDIUM | P1 |
| Discord webhook | HIGH | LOW-MEDIUM | P1 |
| Timeline of eras | HIGH (identity) | MEDIUM | P1 |
| Achievements (manual) | MEDIUM-HIGH | MEDIUM | P1 |
| Discord role badges | MEDIUM | MEDIUM | P1 |
| Lightbox / dark mode / a11y / responsive | MEDIUM-HIGH | MEDIUM | P1 |
| Static pages + LGPD + pinned posts | MEDIUM | LOW | P1 |
| Admin post-on-behalf / backfill | HIGH (launch content) | MEDIUM | P1 |
| Full-text search | MEDIUM-HIGH | MEDIUM | P2 |
| Photo archive page | MEDIUM-HIGH | MEDIUM | P2 |
| "Neste dia" throwback | MEDIUM | LOW-MEDIUM | P2 |
| Trusted-member auto-approval | MEDIUM | LOW | P2 |
| RSS | LOW-MEDIUM | LOW | P2 |
| One-level replies | MEDIUM | MEDIUM | P2 |
| Embed facade | LOW-MEDIUM | LOW-MEDIUM | P3 |
| @mentions | MEDIUM | MEDIUM-HIGH | P3 |
| Person tagging in photos | MEDIUM | MEDIUM | P3 |
| Automatic achievements | LOW-MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

Based on product knowledge, not live inspection (MEDIUM confidence).

| Feature | Generic blog (Ghost/WordPress) | Forum (Discourse/phpBB) | Discord forum channel | Our Approach |
|---------|-------------------------------|-------------------------|-----------------------|--------------|
| Multi-author with approval | Yes (editorial roles), clunky for UGC | Moderation queue exists | Not applicable; no gate | Native approval queue with reasons and notifications |
| Public read / gated write | Possible, awkward | Possible | Server members only | Public read, Discord-guild-gated write |
| Archive by time | Date archives | Weak | Poor; search only, media expires | Year filter on event date + era timeline |
| Durable media | Yes | Yes | Discord CDN links expire | Re-host in Supabase Storage |
| Identity | Email accounts | Email accounts | Discord | Discord OAuth plus guild roles as badges |
| Nostalgia/identity features | None | None | None | Eras, achievements, throwbacks, "Acervo" |
| Moderation | Plugins | Strong | Discord's tools | Queue, reports, bans, audit log, trusted flag |
| Search | Basic/plugin | Strong | Decent in-app | Postgres full-text (v1.x) |
| Reactions | Plugin | Likes | Emoji | Small fixed set |
| Link previews | Plugin/theme | Yes | N/A | First-class OG with chosen cover |
| Cost | Hosting or paid | Hosting | Free | Zero-cost stack |

Takeaway: generic tools win on mature moderation and search; Discord wins on conversation; none of them keep a **durable, time-organized, identity-rich clan archive**. That gap, plus the era/achievement identity layer, is the product's reason to exist. Do not try to out-feature forums on discussion.

## Open Decisions for Requirements

1. **Feed ordering and year semantics.** Order by `published_at` (reading flow) or by `occurred_at` (archive)? Recommendation: default to `published_at` desc in Explorar; year filter and era use `occurred_at`; show "Ocorreu em 2015" label on posts where it differs.
2. **`occurred_at` precision.** Full date, month, or year-only? Recommendation: store a date plus a precision flag (year / month / day), because most old material is dated by year only.
3. **Edit-after-approval policy** (see Dependency Notes).
4. **Trusted-member bypass:** in v1 or v1.x?
5. **Multi-category filter semantics:** OR within categories (recommended), AND across filter types.
6. **Former members:** posts remain under their profile; profile shows a "ex-membro" state if they left the guild? Needs a membership-status field and a periodic re-check.
7. **Comment/reaction visibility to non-members:** any Discord-logged user may comment (defined). Confirm this includes Discord users who are not in the clan server, which widens the abuse surface (stronger case for rate limits, report, and ban at launch).
8. **Account deletion / LGPD:** what happens to posts and comments when a member asks to be removed (anonymize versus delete). Decide before launch.

## Sources

- PROJECT.md (this repo), requirements, constraints and key decisions (HIGH for scope facts)
- Product knowledge of Ghost, WordPress multi-author, Discourse, phpBB, Discord forum channels, Reddit subreddit tooling, Guilded and typical clan sites (MEDIUM, not re-verified live)
- Platform behavior notes carried from training knowledge, to be re-verified in the phase that builds them: Discord CDN attachment URLs are signed and expire (MEDIUM); Discord OAuth `guilds.members.read` returns role IDs only, not names/colours, as already recorded in PROJECT.md (HIGH); Postgres `portuguese` text search config and `unaccent` extension are available on Supabase (MEDIUM)
- LGPD (Lei 13.709/2018) as the applicable privacy regime for a Brazilian audience (HIGH on existence, LOW on specific obligations; get legal-page wording from a template and review in the build phase)

---
*Feature research for: community / gaming-clan blog and history archive*
*Researched: 2026-11-14*
