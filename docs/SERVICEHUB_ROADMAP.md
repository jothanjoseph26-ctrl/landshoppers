# ServiceHub — Roadmap & Five-Stream Execution Plan

**Purpose:** Single handoff document so five parallel agents (or engineers) can ship the [ServiceHub Ecosystem Specification v1.0](../ServiceHub_Ecosystem_Specification_v1.0%20(1).md) without duplicating APIs, breaking contracts, or silently diverging from the product spec.  
**Stack:** Turborepo, Next (`apps/web`), Hono (`apps/api`), Prisma (`packages/db`), BullMQ workers (`apps/workers`), Vitest / Playwright.  
**Related roadmaps:** [Agent Portal (AgentOS)](./AGENT_PORTAL_ROADMAP.md), [Developer Portal](./DEVELOPER_PORTAL_ROADMAP.md) — ServiceHub consumes personas and touchpoints from both.

**Last updated:** 2026-05-16 (bundles API + admin verify + provider availability shipped)

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
| `GET /services` | **Shipped** | Filters, sort, `lat`/`lng`/`radius_km` when `geom` present |
| `GET /services/categories` | **Shipped** | Catalog + live counts |
| `GET /services/match` | **Shipped** | Listing contextual match + Redis cache |
| `GET /services/:slug` | **Shipped** | Profile + availability snippet |
| `POST /services/:slug/quote` | **Partial** | Lead creation + heuristic score; email **stub** (`lead-notify-stub`) |
| `GET /services/:slug/reviews` | **Shipped** | Paginated |
| `GET /services/bundles`, `POST .../activate` | **Shipped (MVP)** | Activate requires **auth**; **Phase 1** `platformFeeKobo` = 5% of bundle `priceFromKobo` (estimate); **Phase 2** final fee + settlement (Paystack split vs buyer charge) **blocked on product** |
| `GET /services/:slug/availability` | **Shipped** | Next 30 days on `GET /v1/services/:slug/availability` |

### 3.3 Specification §3.2 — Provider portal API (`/v1/provider`)

| Endpoint (spec) | Status | Notes |
|-----------------|--------|-------|
| `GET /context`, `GET /dashboard` | **Shipped** | Dashboard builder + tier |
| `GET/PATCH /profile` | **Shipped** | MVP fields |
| `GET /leads`, `PATCH /leads/:id` | **Shipped** | Status machine + review invite **stub** on complete |
| `GET/POST /availability` | **Shipped (MVP)** | Post upserts one UTC calendar day |
| Other spec routes (respond, quote, portfolio, analytics, subscription, KYC, WhatsApp, reviews respond) | **Not started** or **Stub** | Extend `provider.ts` + contracts incrementally |

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
| SVC-PUB-01 `/services` | **Partial** | Homepage components; compare to full spec widget list |
| SVC-PUB-02 directory | **Partial** | `[category]`, `[category]/[segment]` |
| SVC-PUB-03 profile | **Partial** | Routed as `[category]/[segment]` for provider slug segment (verify SEO parity with spec URL examples) |
| SVC-PUB-04 bundles | **Partial** | `/services/bundles` lists API + per-bundle activate form (auth) |
| SVC-PUB-05 listing embed | **Shipped** | `ServiceHubListingMatchSection` on `listings/[slug]` |
| SVC-PUB-06 join | **Partial** | `/services/join` + registration via auth (`service_provider` role in API) |

### 3.7 Specification §5 — Provider OS (PRV)

| Area | Status | Notes |
|------|--------|-------|
| PRV-01 `/provider` | **Shipped** | Client dashboard via `GET /v1/provider/dashboard` |
| PRV-02 `/provider/leads` | **Shipped** | List + patch |
| PRV-03 `/provider/profile` | **Shipped** | Edit MVP |
| Availability API + shell routes | **Partial** | `GET/POST /v1/provider/availability` — portal UI still stub-only at `/provider` sub-routes |
| PRV-04 jobs, PRV-05 WhatsApp, analytics, reviews, content, KYC, subscription, settings | **Stub** | `ProviderRoadmapStub` until APIs exist |

---

## 4. Sprint plan vs. repo (spec §8)

Cross-reference [spec §8 weeks 1–8](../ServiceHub_Ecosystem_Specification_v1.0%20(1).md). This matrix is **delivery tracking**, not a substitute for the spec.

| Sprint | Theme (spec) | Repo status (2026-05-16) |
|--------|----------------|---------------------------|
| **A** | Foundation: tables, directory, homepage, registration | **Partial** — migration + public list/profile/match/categories + provider registration path; bundles API missing |
| **B** | Match on listings, profiles, provider command center | **Partial** — listing embed + match API + provider dashboard MVP; full PRV-03 spec depth outstanding |
| **C** | Leads, WhatsApp, jobs, AI scoring | **Partial** — leads + heuristic scoring; WhatsApp worker enqueue **stub**; jobs UI stub; FastAPI `/score-service-lead` **not** wired |
| **D** | Bundles, Paystack, analytics, KYC, launch | **Partial** — bundle list + activate + seeded catalogs; Paystack provider billing, featured slots, full admin, launch seed still out |

---

## 5. Suggested next tickets (by stream)

| Stream | Next 3 outcomes |
|--------|-----------------|
| **1** | `GET/POST /v1/services/bundles*`, expand `PATCH /v1/provider/leads/:id` with quote fields per spec, admin `PATCH .../providers/:id/verify` |
| **2** | SVC-PUB-04 real data + activation wizard; directory map toggle; profile page spec parity |
| **3** | Replace stubs: jobs pipeline tied to lead status; subscription page + `POST /v1/provider/subscription/checkout` stub |
| **4** | Evolution integration behind flag; match TTL + job schedule docs; optional AI scoring HTTP client |
| **5** | E2E: directory → profile → quote → provider sees lead; admin list smoke; contract tests for new bundle endpoints |

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
| Tests | `apps/api/tests/servicehub-*.test.ts`, `provider-portal.test.ts` |

---

_Maintainers: update §3 when merging ServiceHub PRs; keep §5 in sync with the current sprint board._
