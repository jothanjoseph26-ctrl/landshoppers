# ServiceHub — Roadmap & Five-Stream Execution Plan

**Purpose:** Single handoff document so five parallel agents (or engineers) can ship the [ServiceHub Ecosystem Specification v1.0](../ServiceHub_Ecosystem_Specification_v1.0%20(1).md) without duplicating APIs, breaking contracts, or silently diverging from the product spec.  
**Stack:** Turborepo, Next (`apps/web`), Hono (`apps/api`), Prisma (`packages/db`), BullMQ workers (`apps/workers`), Vitest / Playwright.  
**Related roadmaps:** [Agent Portal (AgentOS)](./AGENT_PORTAL_ROADMAP.md), [Developer Portal](./DEVELOPER_PORTAL_ROADMAP.md) — ServiceHub consumes personas and touchpoints from both.

**Last updated:** 2026-05-17 (Stream 1+2 gap closure — BUY-01, SVC-PUB-02/03/04; see [`SERVICEHUB_STREAM_1_2_GAP_CLOSURE.md`](./SERVICEHUB_STREAM_1_2_GAP_CLOSURE.md))

---

## 1. How the five streams work together

### 1.1 Stream names and ownership

| Stream | Codename | Owns (write) | Must not own alone |
|--------|----------|--------------|---------------------|
| **1** | **API & Data** | `apps/api` routes under `/v1/services`, `/v1/provider`, `/v1/admin/services`; Zod contracts `servicehub-public.ts`, `provider-portal.ts`; Prisma queries; ServiceHub domain libs under `apps/api/src/lib/servicehub/**` | Marketplace UI, worker process wiring in production |
| **2** | **Web — Marketplace** | `apps/web/app/services/**`, `components/servicehub/**`, `lib/api/services-marketplace.ts`, listing embed `ServiceHubListingMatchSection` | New JSON fields on public responses without Stream 1 contract |
| **3** | **Web — Provider OS** | `apps/web/app/(dashboard)/provider/**`, `lib/api/provider-portal.ts`, portal shell + tier gating UX | Prisma migrations, admin RBAC |
| **4** | **Workers & Integrations** | `apps/workers` queues (e.g. provider match score refresh), Redis caches for match, WhatsApp lead enqueue stubs → full Evolution bridge, Paystack provider billing (later), AI scoring service integration | Breaking changes to API response shapes without Stream 1 |
| **5** | **QA & Admin** | `apps/api/tests/servicehub-*.test.ts`, `provider-portal.test.ts`, `apps/web/e2e/servicehub.spec.ts`; admin `GET /v1/admin/services/providers` and future admin routes; seed data for demos | Core feature logic in production routes |

**Rule:** Every new **route**, **query param**, or **JSON field** is owned by **Stream 1** first. Streams 2–4 consume via **Zod contracts** + typed web clients. Stream 5 blocks merge if contract tests drift or critical paths lack coverage.

### 1.2 Mandatory integration contract

1. **API before UI** for new aggregates (spec §3.2 PRV-01): e.g. `GET /v1/provider/dashboard` returns a stable shape before Stream 3 adds KPI cards.
2. **Contracts:** Extend `apps/api/src/contracts/servicehub-public.ts` and `provider-portal.ts`; mirror types in `apps/web/lib/api/*`.
3. **Tier gating:** Server is source of truth (`subscriptionTier`, limits, feature flags). Web only hides/disabled; never enforce subscription only in the client.
4. **Feature flags:** Long-lead items (provider WhatsApp bridge, bundle activation, full AI lead scoring) ship behind env flags (e.g. `PROVIDER_WHATSAPP_ENABLED`) until staging is safe.
5. **PostGIS:** Geo filters and contextual match depend on `service_providers.geom` + GIST index; local CI must tolerate absence of PostGIS where documented (see `packages/db/scripts/verify-postgis.ts`).

### 1.3 Light weekly cadence

| When | What |
|------|------|
| **Week start** | Each stream posts at most **3 outcomes** (merged or in review). |
| **Mid-week** | 30-minute **contract sync**: breaking request/response changes announced with contract diff. |
| **Before merge** | PR description or §3 table below: spec **section** (e.g. §3.1, SVC-PUB-05) + **stream**. |

---

## 2. Definition of Done (by spec area)

| Spec reference | Done when |
|----------------|-----------|
| **§2 Schema** | Migration applied; Prisma models match tables; seed/minimal data for directory + match demos. |
| **§3.1 Public API** | Endpoint matches contract; guest + auth paths tested; pagination and filters documented in contract. |
| **§3.2 Provider API** | RBAC `service_provider`; pagination; status transitions valid (see `lead-status-machine.ts`). |
| **§3.3 Match engine** | Weights aligned with spec; Redis cache keying; optional `provider_ai_match_log` persistence when enabled. |
| **§3.4 Admin** | `requireAdmin`; list/patch flows audited; no leaked PII in logs. |
| **§4 Public pages** | SSR or hybrid per existing app patterns; SEO routes stable; empty states + CTA to `/services/join`. |
| **§5 Provider OS** | Shell + page wired to real API or explicit stub component with ticket link; tier gates for Pro/Elite features. |

---

## 3. Current implementation status (repo snapshot)

Update this table when PRs merge. Status legend: **Shipped** · **Partial** · **Stub** · **Not started**.

### 3.1 Specification §2 — Database

| Area | Status | Notes |
|------|--------|-------|
| `service_providers` + ServiceHub columns | **Shipped** | Migration `20260515200000_servicehub_foundation`; PostGIS `geom` + indexes |
| `service_leads`, `service_reviews`, `service_bundles`, `bundle_activations` | **Partial** | `GET /services/bundles` + `POST …/activate` create `bundle_activations` + multi-lead; platform fee / Paystack later |
| `provider_whatsapp_connections`, `provider_availability`, `provider_ai_match_log`, `agent_preferred_partners` | **Partial** | Schema + some reads/writes; WhatsApp **Evolution** end-to-end **not** shipped |
| `ai_match_score` refresh | **Partial** | Worker `provider-match-score.worker.ts` + package `@landshoppers/servicehub-match`; schedule/ops are environment-dependent |

### 3.2 Specification §3.1 — Public marketplace API (`/v1/services`)

| Endpoint (spec) | Status | Notes |
|-----------------|--------|-------|
| `GET /services` | **Shipped** | Filters, sort, `lat`/`lng`/`radius_km` when `geom` present; list rows include `latitude`/`longitude` from PostGIS for map pins |
| `GET /services/categories` | **Shipped** | Catalog + live counts |
| `GET /services/match` | **Shipped** | Listing contextual match + Redis cache |
| `GET /services/:slug` | **Shipped** | Profile + availability snippet |
| `POST /services/:slug/quote` | **Partial** | Lead creation + heuristic score; email **stub** (`lead-notify-stub`) |
| `GET /services/:slug/reviews` | **Shipped** | Paginated |
| `GET /services/bundles`, `POST .../activate` | **Shipped** | Activate requires **auth**; optional `developerProjectId` (JSON metadata + lead message); **Phase 1** `platformFeeKobo` = 5% estimate; **Phase 2** settlement **blocked on product** |
| `GET /services/:slug/availability` | **Shipped** | Next 30 days on `GET /v1/services/:slug/availability` |

### 3.3 Specification §3.2 — Provider portal API (`/v1/provider`)

| Endpoint (spec) | Status | Notes |
|-----------------|--------|-------|
| `GET /context`, `GET /dashboard` | **Shipped** | Dashboard builder + tier |
| `GET/PATCH /profile` | **Shipped** | MVP fields |
| `GET /leads`, `PATCH /leads/:id` | **Shipped** | `lead-status-machine.ts`; on **completed**: `completedJobCount`, notification, review-invite **stub** |
| `GET/POST /availability` | **Shipped (MVP)** | Post upserts one UTC calendar day |
| `GET /jobs`, `PATCH /jobs/:id` | **Shipped (MVP)** | `provider.jobs.ts` — active lead statuses as jobs |
| `GET /analytics/summary` | **Shipped (MVP)** | `provider.analytics.ts` |
| `GET /reviews`, `PATCH /reviews/:id/respond` | **Partial** | List + provider response |
| `GET/PATCH /kyc` | **Partial** | Document metadata MVP |
| `GET/PATCH /settings` | **Shipped (MVP)** | `provider.settings.ts` |
| `GET /subscription`, `POST /subscription/checkout` | **Partial** | Stub Paystack / direct tier in dev |
| `GET /whatsapp` | **Partial** | Read connection status; Evolution **not** production |
| `POST /content/generate` | **Partial** | Caption stub |
| `GET /v1/me/service-leads`, `POST …/:leadId/review` | **Shipped (MVP)** | `me.service-leads.ts` — buyer ledger + verified review |
| Other spec routes (dedicated respond/quote, portfolio CRUD) | **Not started** | Extend contracts incrementally |

### 3.4 Specification §3.3 — Match engine

| Area | Status | Notes |
|------|--------|-------|
| Scoring + listing context | **Shipped** | `lib/servicehub/contextual-match.ts` + `@landshoppers/servicehub-match` |
| Redis cache (30m intent per spec) | **Partial** | Implemented via `match-redis`; tune TTL to spec in Stream 4 |
| BullMQ full spec (6h global refresh per provider) | **Partial** | Baseline score worker exists; verify queue schedule vs. spec |

### 3.5 Specification §3.4 — Admin API

| Area | Status | Notes |
|------|--------|-------|
| `GET /v1/admin/services/providers` | **Shipped** | Filters: tier, verification, category, city |
| `PATCH …/providers/:id` (verification / isVerified) | **Shipped (MVP)** | Body: `verificationLevel`, `isVerified` |
| Other admin routes (KYC queue, leads, bundles CRUD, analytics) | **Not started** | Add under `adminServicehubV1` |

### 3.6 Specification §4 — Public pages (SVC-PUB)

| Page | Status | Notes |
|------|--------|-------|
| SVC-PUB-01 `/services` | **Partial** | Homepage + trust stats strip (verified count / fallback); testimonials still P2 |
| SVC-PUB-02 directory | **Shipped (MVP)** | `[category]`, geo `[segment]`; list/map toggle (`view=map`); Leaflet pins when API returns lat/lng |
| SVC-PUB-03 profile | **Shipped (MVP)** | `[category]/[segment]` profile branch; `generateMetadata` for SEO |
| SVC-PUB-04 bundles | **Shipped** | `/services/bundles` + wizard; `?projectId=` → `developerProjectId` on activate |
| SVC-PUB-05 listing embed | **Shipped** | `ServiceHubListingMatchSection` on `listings/[slug]` |
| SVC-PUB-06 join | **Partial** | `/services/join` + registration via auth (`service_provider` role in API) |

### 3.7 Specification §5 — Provider OS (PRV)

| Area | Status | Notes |
|------|--------|-------|
| PRV-01 `/provider` | **Shipped** | Client dashboard via `GET /v1/provider/dashboard` |
| PRV-02 `/provider/leads` | **Shipped** | List + patch + status machine |
| PRV-03 `/provider/profile` | **Shipped** | Edit MVP |
| PRV-04 `/provider/jobs` | **Partial** | Kanban/list via `GET /v1/provider/jobs` |
| PRV-05 `/provider/whatsapp` | **Partial** | UI + read API; Evolution behind flag |
| PRV-06 `/provider/analytics` | **Partial** | Summary charts |
| PRV-07 `/provider/reviews` | **Partial** | List + respond |
| PRV-08 `/provider/content` | **Partial** | Generate caption stub |
| PRV-09 `/provider/kyc` | **Partial** | Upload metadata MVP |
| PRV-10 `/provider/subscription` | **Partial** | Stub checkout (like agent/developer) |
| PRV-11 `/provider/settings` | **Partial** | PATCH integrations |
| Availability | **Partial** | API shipped; dedicated calendar UI TBD |
| Buyer service ledger (BUY-01) | **Shipped (MVP)** | `GET/POST /v1/me/service-leads*`; `BuyerServiceLeadsList` on dashboard + `/buyer/services`; contract `me-service-leads.ts` |

---

## 4. Sprint plan vs. repo (spec §8)

Cross-reference [spec §8 weeks 1–8](../ServiceHub_Ecosystem_Specification_v1.0%20(1).md). This matrix is **delivery tracking**, not a substitute for the spec.

| Sprint | Theme (spec) | Repo status (2026-05-17) |
|--------|----------------|---------------------------|
| **A** | Foundation: tables, directory, homepage, registration | **Partial+** — migration + public list/profile/match/categories + registration; **bundles API shipped** |
| **B** | Match on listings, profiles, provider command center | **Partial+** — listing embed + match API + provider dashboard; profile/availability depth outstanding |
| **C** | Leads, WhatsApp, jobs, AI scoring | **Partial+** — lead workflow + status machine + buyer reviews API; provider jobs UI; WhatsApp/Evolution **stub**; FastAPI lead scoring **not** wired |
| **D** | Bundles, Paystack, analytics, KYC, launch | **Partial** — bundle activate + provider OS MVPs; live Paystack, featured slots, full admin ServiceHub, launch ops out |

---

## 5. Suggested next tickets (by stream)

| Stream | Next 3 outcomes |
|--------|-----------------|
| **1** | Quote fields on `PATCH /leads/:id`; admin ServiceHub analytics; optional `GET /me/service-leads/:id` (P2) |
| **2** | SVC-PUB-01 testimonials; bundle builder polish; optional `e2e/servicehub-public.spec.ts` |
| **3** | Provider availability calendar UI; portfolio section on profile; tier-gated WhatsApp when Evolution live |
| **4** | Evolution integration behind flag; 6h match refresh schedule; FastAPI `/score-service-lead` client |
| **5** | E2E: quote → provider completes → buyer reviews; extend `servicehub-phase-c` + `stub-portals` for provider jobs |

---

## 6. File map (starting points)

| Concern | Path |
|---------|------|
| Public routes | `apps/api/src/routes/v1/services.ts` |
| Provider routes | `apps/api/src/routes/v1/provider.ts` |
| Contracts | `apps/api/src/contracts/servicehub-public.ts`, `provider-portal.ts` |
| Bundle activation | `apps/api/src/lib/servicehub/bundle-activate.ts` |
| Scoring package | `packages/` or vendored `@landshoppers/servicehub-match` |
| Match worker | `apps/workers/src/provider-match-score.worker.ts` |
| Marketplace UI | `apps/web/app/services/**`, `apps/web/components/servicehub/**` |
| Provider UI | `apps/web/app/(dashboard)/provider/**` |
| Buyer leads API | `apps/api/src/routes/v1/me.service-leads.ts` |
| Lead workflow lib | `apps/api/src/lib/servicehub/lead-status-machine.ts`, `review-invite-stub.ts` |
| Tests | `apps/api/tests/servicehub-*.test.ts`, `servicehub-phase-c.test.ts`, `provider-portal.test.ts`, `provider-extensions.test.ts` |

---

_Maintainers: update §3 when merging ServiceHub PRs; keep §5 in sync with the current sprint board._
