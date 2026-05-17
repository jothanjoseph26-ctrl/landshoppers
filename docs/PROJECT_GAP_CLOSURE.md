# LandShoppers — Project Gap Closure Document

**Date:** 2026-05-17 (revised after stub-closure + ServiceHub Phase C)  
**Audience:** Product, engineering, QA, and client stakeholders  
**Sources of truth:** [`LandShoppers_Project_Framework_v1.1.md`](../LandShoppers_Project_Framework_v1.1.md) · [`ServiceHub_Ecosystem_Specification_v1.0 (1).md`](../ServiceHub_Ecosystem_Specification_v1.0%20(1).md) · live repo (`apps/web`, `apps/api`, `apps/workers`)  
**Companion docs:** [`WEB_ROUTE_INVENTORY.md`](./WEB_ROUTE_INVENTORY.md) · [`AGENT_PORTAL_ROADMAP.md`](./AGENT_PORTAL_ROADMAP.md) · [`DEVELOPER_PORTAL_ROADMAP.md`](./DEVELOPER_PORTAL_ROADMAP.md) · [`SERVICEHUB_ROADMAP.md`](./SERVICEHUB_ROADMAP.md) · [`NEXT_PHASE_REDFIN_CLASS_DEVELOPMENT_PLAN.md`](../NEXT_PHASE_REDFIN_CLASS_DEVELOPMENT_PLAN.md)

Regenerate route list: `pnpm run routes:inventory` (repo root).

---

## 1. Executive summary

LandShoppers has moved from a single-app scaffold to a **Turborepo monorepo** with a working Next.js front end (**91+ routes**), Hono API, Prisma/PostGIS, workers skeleton, AI service, and Docker-backed local infra. **Dashboard stub closure (19 routes) is complete** — buyer, agent, admin, and provider shells now call real `/v1/*` APIs ([`STUB_PAGES_SIX_AGENT_ARCHITECTURE.md`](./STUB_PAGES_SIX_AGENT_ARCHITECTURE.md) §13). **Feature depth remains uneven**: **Developer Portal** is still the deepest; **ServiceHub** public + provider OS are **partial MVP** (Stream 1 Phase C API shipped); **Layer 2/3** (WhatsApp child routes, SEO child routes, live Paystack/Evolution) are **not launch-complete**.

| Metric | Framework / spec | Repo today (2026-05-17) |
|--------|------------------|-------------------------|
| Framework page IDs (detailed inventory) | **77** rows across 7 sections | **~55** have a matching or equivalent route |
| Framework headline | “38 pages” | **Inconsistent** with the 77-row inventory — track by **page ID**, not headline count |
| ServiceHub pages | **17** (6 public + 11 Provider OS) | **12** routes under `/services` and `/provider`; **all 11 provider routes wired** (MVP; Paystack/Evolution still stub) |
| Dashboard stub routes (six-agent plan) | **19** | **19/19** API + UI (**Done**) |
| Web routes (any `page.tsx`) | — | **91+** ([`WEB_ROUTE_INVENTORY.md`](./WEB_ROUTE_INVENTORY.md)) — run `pnpm run routes:inventory` to refresh |
| P0 launch features (framework) | **51** | **Partial** — portal MVPs exist; WhatsApp **panel depth**, SEO **child routes**, payments webhooks, Socket.io remain gaps; **buyer ServiceHub ledger UI shipped** (2026-05-17) |

**Gap closure strategy:** ship in **vertical slices** (API contract → web → workers → QA). **Stub replacement is done**; **ServiceHub Stream 1+2 gap closure is done** for required tickets ([`SERVICEHUB_STREAM_1_2_GAP_CLOSURE.md`](./SERVICEHUB_STREAM_1_2_GAP_CLOSURE.md)). Focus shifts to **missing routes** (§4), **production integrations** (§6), and **ServiceHub depth** (Evolution, live Paystack, optional E2E).

---

## 2. Status legend

| Status | Meaning |
|--------|---------|
| **Shipped** | Route exists; core user journeys work against real APIs (may lack polish) |
| **Partial** | Route exists; some data/actions wired; spec gaps remain |
| **Stub** | Route exists; static marketing or placeholder copy only (no API client). `ProviderRoadmapStub` removed from repo (2026-05) |
| **Not started** | No `page.tsx` / not in route inventory; may appear only in framework spec |

---

## 3. Gap summary by portal

| Portal | Spec pages | Route coverage | Typical depth | Priority to close |
|--------|------------|----------------|---------------|-------------------|
| Public marketplace | 21 (PUB-01–21) | High | Partial → Shipped for listings; map via `/listings?view=split` | P0 — discovery & trust |
| Buyer dashboard | 8 (BUY-01–08) | 7/8 routes | **Partial+** — settings, tours API+UI; **no** `/buyer/messages` or notifications route | P0 — BUY-04, BUY-08, service-lead UI |
| Agent portal (AgentOS) | 12 (AGT-01–12) | 10/12 routes | **Partial+** — analytics, subscription, settings wired; no edit listing / commissions / referrals | P0 — AGT-04, AGT-08, AGT-12 |
| Developer portal | 10 (DEV-01–10) | 10/10 routes | **Best in repo** (MVP APIs) | P1 — S3 presign, live Paystack |
| WhatsApp automation | 6 (WA-01–06) | **1/6** (`/admin/whatsapp` only) | **Partial** — review queue API+UI; child routes WA-01–06 **not started** | P0 — Layer 2 |
| SEO engine (OutcomeLabs) | 8 (SEO-01–08) | **1/8** (`/admin/seo` only) | **Partial** — variants/approvals API+UI on parent page; child routes **not started** | P0 — Layer 3 |
| Admin panel | 12 (ADM-01–12) | 9/12 routes | **Partial+** — users, payments, analytics, reports, audit-logs, settings, whatsapp, seo wired; no `/admin/kyc`, `/admin/developers`, `/admin/services` | P0 — dedicated ADM pages |
| ServiceHub (extension) | 17 | 12/17 routes | **Partial+** — public MVP+ (map toggle, SEO metadata, bundle `projectId`); provider OS UI wired; **BUY-01 ledger UI shipped** | P1 — live Paystack/Evolution, admin ServiceHub depth |

---

## 4. Pages not yet developed (no route)

These framework/spec pages have **no dedicated App Router page** yet. Nested admin URLs (e.g. `/admin/whatsapp/queue`) are suggested targets but not implemented.

### 4.1 WhatsApp Automation Panel (Layer 2) — 6 pages

| ID | Page | Proposed route | Depends on |
|----|------|----------------|------------|
| WA-01 | Pending Queue | `/admin/whatsapp/queue` | Webhook ingestion, extraction worker, `GET /v1/admin/whatsapp/pending` |
| WA-02 | Message Detail | `/admin/whatsapp/queue/[id]` | Raw message + AI JSON + approve/edit API |
| WA-03 | Approved Listings | `/admin/whatsapp/approved` | Listing linkage after approval |
| WA-04 | Rejected Messages | `/admin/whatsapp/rejected` | Reject reasons + re-queue |
| WA-05 | Group Management | `/admin/whatsapp/groups` | Evolution/Baileys group registry |
| WA-06 | Automation Settings | `/admin/whatsapp/settings` | Confidence thresholds, auto-approve rules |

Today: `/admin/whatsapp` + child routes **WA-01–06** are **Shipped (MVP)** — queue/approved/rejected redirect to filtered hub; `queue/[id]` deep-links detail; groups/settings document Evolution env until bridge is live.

### 4.2 SEO Engine — OutcomeLabs (Layer 3) — 8 pages

| ID | Page | Proposed route | Depends on |
|----|------|----------------|------------|
| SEO-01 | SEO Dashboard | `/admin/seo` (replace stub) or `/admin/seo/dashboard` | Variant/post aggregates API |
| SEO-02 | Variant Generator | `/admin/seo/variants` | AI service + listing picker |
| SEO-03 | Content Calendar | `/admin/seo/calendar` | `PostingSchedule` model + scheduler |
| SEO-04 | Channel Manager | `/admin/seo/channels` | OAuth tokens per channel |
| SEO-05 | Post Approval Queue | `/admin/seo/approvals` | Human-in-loop before publish |
| SEO-06 | Performance Analytics | `/admin/seo/analytics` | Channel metrics ingestion |
| SEO-07 | SEO Audit Tool | `/admin/seo/audit` | Per-listing score API |
| SEO-08 | Hashtag Manager | `/admin/seo/hashtags` | Hashtag sets by city/type |

Today: `/admin/seo` + child routes **SEO-01–08** are **Shipped (MVP)** — hub handles variants/approvals; child paths redirect or document calendar/channels/analytics/audit/hashtags until Layer 3 schedulers connect.

### 4.3 Buyer dashboard — 2 pages — **routes shipped (2026-05-17)**

| ID | Page | Route | Status |
|----|------|-------|--------|
| BUY-04 | Messages | `/buyer/messages` | **Route + shell** — links to inquiries until `GET /v1/me/messages` |
| BUY-08 | Notifications | `/buyer/notifications` | **Route + shell** — until `GET /v1/me/notifications` |

### 4.4 Agent portal — 4 pages

| ID | Page | Proposed route | Notes |
|----|------|----------------|-------|
| AGT-04 | Edit Listing | `/agent/listings/[id]/edit` | Create exists at `/agent/listings/new`; no edit route |
| AGT-08 | Commission Tracker | `/agent/commissions` | Payments/ledger APIs not exposed |
| AGT-12 | Referral Programme | `/agent/referrals` | Distinct from `/agent/partners` (ServiceHub); referral ledger TBD |
| — | WhatsApp (AgentOS) | `/agent/whatsapp` | Listed in Agent roadmap; not routed |
| — | Content studio | `/agent/content` | Listed in Agent roadmap; not routed |

### 4.5 Admin panel — 3 dedicated pages

| ID | Page | Proposed route | Notes |
|----|------|----------------|-------|
| ADM-04 | KYC Review Queue | `/admin/kyc` | User/agent/developer doc review; `/admin/users` has list/patch MVP — dedicated KYC queue route still needed |
| ADM-05 | Developer Management | `/admin/developers` | Cross-developer governance |
| ADM-08 | Service Directory Mgmt | `/admin/services` | ServiceHub admin extensions (partial API: `GET /v1/admin/services/providers`) |

---

## 5. Routes that exist but are not feature-complete (stubs & partials)

### 5.1 Dashboard stub closure — **complete (2026-05-16)**

Nineteen routes from [`STUB_PAGES_SIX_AGENT_ARCHITECTURE.md`](./STUB_PAGES_SIX_AGENT_ARCHITECTURE.md) now load authenticated data from `/v1/*` (loading / empty / error states). `ProviderRoadmapStub` has been **removed** from `apps/web`.

| Route group | Routes | API surface (representative) | Remaining gap |
|-------------|--------|------------------------------|---------------|
| **Buyer** | `/buyer/settings`, `/buyer/tours` | `me.settings`, `me.tours` | Notifications email; profile depth |
| **Agent** | `/agent/analytics`, `/agent/subscription`, `/agent/settings` | `agent.analytics`, `agent.subscription`, `agent.settings` | Live Paystack webhooks |
| **Admin** | `/admin/users`, `payments`, `analytics`, `reports`, `audit-logs`, `settings`, `whatsapp`, `seo` | `admin.users`, `admin.payments`, … `admin-seo.ts` | Child WA/SEO routes (§4); live payments data |
| **Provider** | `/provider/analytics`, `jobs`, `whatsapp`, `reviews`, `content`, `kyc`, `subscription`, `settings` | `provider.*` sub-routers on `/v1/provider` | Evolution bridge; live Paystack |

Vitest: `me-settings`, `me-tours`, `agent-*`, `admin-*`, `provider-extensions`, `automation-admin`. Playwright: `e2e/stub-portals.spec.ts`.

### 5.2 Partial pages (real work started)

| Route | Spec ID | What works | What’s missing |
|-------|---------|------------|----------------|
| `/` | PUB-01 | Marketing home, hero | Testimonials/blog feed depth |
| `/listings`, `/listings/[slug]` | PUB-02, PUB-03 | Search API, discovery shell, detail, ServiceHub embed | Mortgage calc, virtual tour, price history, full gallery pipeline |
| `/listings?view=split` | PUB-04 | Split map/list (canonical; `/map-search` redirects) | Clustering polish, saved bounds alerts |
| `/agents`, `/agents/[id]` | PUB-05, PUB-06 | Directory + profile | Reviews persistence, click-to-chat |
| `/services/**` | PUB-07, SVC-PUB-* | Directory, match, bundles, **list/map toggle**, profile SEO, trust stats, **public E2E** | SVC-PUB-01 testimonials (P2) |
| `/developers`, `/developers/[id]`, `/projects/[id]` | PUB-09–11 | API-backed directory & project detail | Brochure download, enquiry funnel hardening |
| `/buyer`, `/buyer/saved`, `/buyer/searches`, `/buyer/inquiries`, `/buyer/recent` | BUY-01–03, 06–07 | Portal APIs wired | Recommendations, alert email jobs |
| `/buyer/profile` | BUY-07 | `fetchMe` | Full profile editor |
| `/buyer/settings`, `/buyer/tours` | BUY-07, BUY-05 | Settings PATCH; tour list + cancel | — moved from stub; see §5.1 |
| `/buyer/services` | BUY-01 | **`BuyerServiceLeadsList`** + review dialog on `completed` leads | — gap-closure sprint **done** (see [`SERVICEHUB_STREAM_1_2_GAP_CLOSURE.md`](./SERVICEHUB_STREAM_1_2_GAP_CLOSURE.md)) |
| `/agent`, `/agent/listings`, `/agent/leads`, `/agent/messages`, `/agent/listings/new` | AGT-01–06 | Dashboard, listings, leads, messaging MVP | Edit listing (**AGT-04**), CRM scoring UI |
| `/agent/analytics`, `/agent/subscription`, `/agent/settings` | AGT-07, 10, 11 | Charts, stub checkout, settings PATCH | Live Paystack |
| `/developer/**` | DEV-01–10 | See [DEVELOPER_PORTAL_ROADMAP.md](./DEVELOPER_PORTAL_ROADMAP.md) | S3 presign, real Paystack, digest cron, AI pitch queue |
| `/provider/**` | PRV-01–11 | Dashboard, leads (status machine), profile, jobs, analytics, reviews, KYC, subscription, settings, WhatsApp read, content stub | Evolution; availability calendar UI; live billing |
| `/admin`, `/admin/listings` | ADM-01–02 | Dashboard queue + moderation | `/admin/kyc`, `/admin/developers`, `/admin/services` |
| `/admin/users`, `payments`, `analytics`, `reports`, `audit-logs`, `settings`, `whatsapp`, `seo` | ADM-03–12 | Real APIs + tables (see §5.1) | WA/SEO **child** routes; platform settings DB model |

### 5.3 Shipped or near-shipped (reference)

- **Auth:** `/login`, `/register`, `/verify-otp`, `/reset-password` — wired to API (OAuth/Google may remain partial per env).
- **Developer portal core:** `/developer`, `/developer/projects/*`, `/developer/leads`, `/developer/bulk-upload`, `/developer/analytics`, `/developer/kyc`, `/developer/team`, `/developer/subscription`, `/developer/settings`.
- **Listing discovery:** `/listings` + `ListingDiscovery` component.
- **Legal/marketing:** `/privacy`, `/terms`, `/about`, `/contact`, `/pricing`, etc.

---

## 6. Cross-cutting capability gaps (not just pages)

These block multiple pages and belong on the same roadmap:

| Capability | Framework features | Status | Unblocks |
|------------|-------------------|--------|----------|
| OpenSearch + PostGIS search | F-020–026 | Partial API; UI split view started | PUB-02/04, saved search alerts |
| S3 + image pipeline | F-011 | Presign 501 in places | Listing create/edit, KYC uploads |
| Paystack (subscriptions, boosts, webhooks) | F-040–044 | **Stub checkout** on developer, agent, provider; admin payments list | Live webhooks + settlement |
| Socket.io messaging | F-050 | REST agent messages only | BUY-04, AGT-06 |
| WhatsApp bridge + extraction | F-070–077 | Webhook + admin review queue **Partial**; Evolution **not** production | WA-01–06 child routes |
| SEO variant generation + posting | F-100+ | Admin parent page + generate/approve API **Partial** | SEO-01–08 child routes, channel OAuth |
| Dojah KYC | F-031, F-090 | Document upload MVP (dev + provider); no Dojah | AGT-09, PRV-09 verification |
| Email/SMS (SES, Termii, Resend) | F-002, F-051–052 | Digest email partial; ServiceHub lead/review **stubs** | Alerts, OTP production |
| ServiceHub match + leads | ServiceHub §3–5 | **Partial+** — match, leads, buyer ledger API+UI, map coords, bundle `developerProjectId`; see [SERVICEHUB_ROADMAP.md](./SERVICEHUB_ROADMAP.md) | Evolution, live billing, optional public E2E |

---

## 7. Roadmap to close the gap

Aligned with the framework’s **16-week / 8-sprint** model and existing stream roadmaps. Adjust dates with PM; order reflects **dependencies**.

### Phase 0 — Baseline & contracts (Weeks 1–2) ✅ largely done

- Monorepo, auth, listings search, route inventory, portal shells.
- **Exit criteria:** `pnpm run routes:inventory` committed; RBAC on dashboard layouts; CI green.

### Phase 1 — Marketplace vertical slice (Weeks 3–5) — **in progress**

**Goal:** Redfin-class discovery + trustworthy listing detail ([`NEXT_PHASE_REDFIN_CLASS_DEVELOPMENT_PLAN.md`](../NEXT_PHASE_REDFIN_CLASS_DEVELOPMENT_PLAN.md)).

| Week | Deliverables | Pages / IDs |
|------|--------------|-------------|
| 3 | OpenSearch facets, geospatial filters, listing detail hardening | PUB-02, PUB-03 |
| 4 | Split map polish, saved searches API + UI, recently viewed | PUB-04, BUY-06, BUY (recent) |
| 5 | Image upload (S3), agent listing edit route | AGT-03, **AGT-04** (new route) |

**Streams:** API search/listings · Web listings/buyer · QA e2e discovery.

### Phase 2 — Buyer & agent operations (Weeks 6–8) — **partially started**

| Week | Deliverables | Pages / IDs |
|------|--------------|-------------|
| 6 | Buyer messages + notifications; tour scheduling API | **BUY-04**, **BUY-08** open; **BUY-05** tours **MVP shipped** |
| 7 | Agent analytics, subscription (Paystack), settings | **AGT-07, AGT-10, AGT-11** MVP shipped (stub Paystack) |
| 8 | Lead CRM scoring UI; commission tracker (if payments ready) | AGT-04/05, **AGT-08** open |

**Owner doc:** [AGENT_PORTAL_ROADMAP.md](./AGENT_PORTAL_ROADMAP.md) Phases 2–4.

### Phase 3 — WhatsApp automation (Weeks 9–10) — Layer 2

| Week | Deliverables | Pages / IDs |
|------|--------------|-------------|
| 9 | Webhook + queue worker + WA-01/02 APIs | **WA-01**, **WA-02** |
| 10 | Approve/reject → listing create; groups + settings | **WA-03–06**, ADM-09 |

**Workers:** `apps/workers` WhatsApp extraction queue · **AI:** `apps/ai-service` extract endpoint.

### Phase 4 — Admin governance (Weeks 11–12) — **partially started**

| Week | Deliverables | Pages / IDs |
|------|--------------|-------------|
| 11 | Users, KYC queue, developers admin | **ADM-06** users MVP on `/admin/users`; **`/admin/kyc`**, **`/admin/developers`** still **not started** |
| 12 | Payments admin, audit logs, reports | **ADM-07, ADM-11**, reports **MVP shipped** on parent routes (see §5.1) |

### Phase 5 — SEO engine (Weeks 13–14) — Layer 3

| Week | Deliverables | Pages / IDs |
|------|--------------|-------------|
| 13 | Variant generator + approval queue | **SEO-02**, **SEO-05** |
| 14 | Calendar, channels, analytics, audit, hashtags | **SEO-01, 03–04, 06–08** |

### Phase 6 — ServiceHub & developer polish (Weeks 15–16) — **partially started**

| Week | Deliverables | Pages / IDs |
|------|--------------|-------------|
| 15 | ServiceHub: provider OS depth | **PRV-04–11** UI+API **MVP shipped**; **ADM-08** `/admin/services` **shipped**; buyer service-lead **UI shipped**; WA/SEO **child routes shipped** |
| 16 | Developer: S3 presign, Paystack live, digest cron; agent referrals/content | DEV-* polish; **AGT-12**, `/agent/content`, `/agent/whatsapp` open |

**Owner doc:** [SERVICEHUB_ROADMAP.md](./SERVICEHUB_ROADMAP.md) Sprints C–D · [DEVELOPER_PORTAL_ROADMAP.md](./DEVELOPER_PORTAL_ROADMAP.md) Phase C+.

---

## 8. Parallel workstreams (five agents / engineers)

Reuse the supervision model from [`GAP_CLOSURE_5_AGENT_SUPERVISION_PLAN.md`](../GAP_CLOSURE_5_AGENT_SUPERVISION_PLAN.md):

| Stream | Owns | This phase focus |
|--------|------|------------------|
| **1 — API & data** | `apps/api`, contracts, Prisma | Search, tours, admin, WhatsApp, SEO, ServiceHub endpoints |
| **2 — Web marketplace** | Public + buyer routes | Listings discovery, buyer dashboard completion |
| **3 — Web portals** | Agent, developer, admin, provider | Stub closure **done** (§5.1); buyer ServiceHub UI; missing routes §4 |
| **4 — Workers & integrations** | `apps/workers`, Paystack, Evolution, AI | WhatsApp queue, emails, match refresh |
| **5 — QA & DX** | Vitest, Playwright, route inventory | Contract tests gate merges |

**Rule:** API + contract before UI; update §3 tables in portal roadmaps when PRs merge.

---

## 9. Definition of done (per page)

A spec page ID (e.g. **AGT-04**, **WA-02**, **SVC-PUB-03**) is **closed** when:

1. **Route** exists (or canonical redirect documented, e.g. `/map-search` → `/listings?view=split`).
2. **API** endpoints are implemented, Zod-contracted, and covered by Vitest.
3. **UI** meets framework “Key Features” for happy path (empty/error/loading states).
4. **RBAC** enforced server-side for dashboard/admin routes.
5. **E2E** smoke exists for P0 paths (Playwright).
6. **Roadmap table** updated in the relevant `docs/*_ROADMAP.md` file.

---

## 10. Tracking & maintenance

| Action | Command / location |
|--------|-------------------|
| Refresh all routes | `pnpm run routes:inventory` → `docs/WEB_ROUTE_INVENTORY.md` |
| Mark page shipped | Update §3 in this file + portal roadmap §2 status table |
| New page ID from CR | Add row to §4 or §5; assign sprint in §7 |

**Recommended sprint ritual:** PM picks page IDs from §4 (not started) and §5.2 (partials); each PR references IDs in the description (e.g. `WA-02`, `BUY-04`).

---

## 11. Quick reference — remaining P0 (after 2026-05-17 route closure)

1. ~~**WA-01–06**~~ — **Routes shipped** (hub + redirects/shells).  
2. ~~**BUY-04, BUY-08**~~ — **Routes shipped** (shells until `me/messages` + `me/notifications` APIs).  
3. ~~**AGT-04**~~ — **Edit listing shipped** (`/agent/listings/[id]/edit`).  
4. ~~**ADM-04, ADM-05, ADM-08**~~ — **Routes shipped** (ADM-08 wired to API).  
5. ~~**SEO-01–08**~~ — **Routes shipped** (hub + redirects/shells).  
6. ~~**Buyer service-lead UI**~~ — **Done**: `BuyerServiceLeadsList` + `me-service-leads`.  
7. **Live Paystack + Evolution** — Production credentials + webhooks (env-dependent; stubs remain in checkout flows).

---

*This document should be reviewed at the start of each two-week sprint and after any Change Request to the framework or ServiceHub spec.*
